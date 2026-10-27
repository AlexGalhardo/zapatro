import Phaser from 'phaser';
import { tex } from '../art/flat';
import { LOGICAL_H } from '../config/constants';
import { PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, RADIUS } from '../config/ui';
import { sfx } from '../core/audio';
import { canHostLan, hostLan } from '../core/platform';
import { COMPANION_IDS } from '../data/companions';
import { t } from '../i18n';
import { NetClient } from '../net/client';
import { MAX_NAME, type ServerMessage } from '../net/protocol';
import { Button } from '../ui/Button';
import { UI_FONT } from '../ui/font';
import { onKey } from '../ui/keys';
import { drawPanel } from '../ui/panel';
import { fadeTo, setupScreen, text } from '../ui/screen';
import { screenTitle } from '../ui/title';
import { fitCamera } from '../view/stage';

/** Seat centres on the stage: you at the bottom, then counter-clockwise like the table. */
const SEAT_AT = [
	[320, 252],
	[484, 160],
	[320, 82],
	[156, 160],
] as const;
const SEAT_W = 132;
const SEAT_H = 40;

/** Last name and address typed (a convenience, not part of the save). */
const remember = (key: string, value?: string): string => {
	try {
		if (value !== undefined) localStorage.setItem(`lan.${key}`, value);
		return localStorage.getItem(`lan.${key}`) ?? '';
	} catch {
		return '';
	}
};

/**
 * LAN multiplayer: first a form to join a table (or host one, in the desktop app), then the
 * lobby where each person picks a seat. Across the table are partners: the bottom and top seats
 * against the left and right ones. The match starts when the host says so; empty seats are bots.
 */
export class LanScene extends Phaser.Scene {
	private client: NetClient | null = null;
	private ui!: Phaser.GameObjects.Container;
	private form: HTMLElement | null = null;
	private stageLeft = 0;
	private leaving = false;

	constructor() {
		super('Lan');
	}

	create(data: { client?: NetClient }): void {
		this.client = data?.client ?? null;
		this.leaving = false;
		this.form = null;
		this.ui = this.add.container(0, 0);
		const back = () => this.leave();
		onKey(this.input.keyboard, 'keydown-ESC', back);
		setupScreen(this, t('lan.title'), (view, cx, heading) => {
			heading.setVisible(false);
			fitCamera(this.cameras.main, view);
			this.stageLeft = cx - 320;
			this.draw();
		}).setVisible(false);
		this.events.once('shutdown', () => {
			this.closeForm();
			// Anywhere but the table: the connection is not needed any more.
			if (!this.leaving) this.client?.leave();
		});
		if (this.client) this.attach(this.client);
		else this.openForm();
	}

	private leave(): void {
		sfx(this, 'sfx.ui.confirm');
		this.client?.leave();
		this.client = null;
		fadeTo(this, 'Menu');
	}

	private attach(client: NetClient): void {
		this.client = client;
		client.listen((m) => this.onMessage(m));
		this.draw();
		this.rejoin();
	}

	/**
	 * Back in the lobby while a match I sit in runs (the host started the next one while I was
	 * still on the last end panel): ask for the table, or the match would wait for me forever.
	 */
	private rejoin(): void {
		const c = this.client;
		if (!this.leaving && c?.lobby?.playing && c.lobby.seats.some((s) => s?.id === c.id))
			c.send({ type: 'resync' });
	}

	private onMessage(m: ServerMessage): void {
		if (m.type === 'lobby') {
			this.draw();
			this.rejoin();
		} else if (m.type === 'start' && this.client) {
			// From here the table's messages wait in the client until the table listens.
			const client = this.client;
			client.listen(null);
			this.leaving = true;
			fadeTo(this, 'Table', { net: { client, start: m.start, snap: m.snap } });
		} else if (m.type === 'closed') {
			this.client = null;
			this.openForm(t('net.closed'));
			this.draw();
		}
	}

	// --- Lobby ------------------------------------------------------------------------------

	private draw(): void {
		if (!this.ui) return;
		this.ui.removeAll(true);
		const L = this.stageLeft;
		const g = this.add.graphics();
		drawPanel(g, L + 8, 6, 624, LOGICAL_H - 12, { radius: RADIUS.frame, shadow: 4 });
		const head = screenTitle(this, L + 320, t('lan.title'), 'crown', 30);
		this.ui.add([g, head.icon, head.title]);
		const client = this.client;
		const lobby = client?.lobby;
		if (!client || !lobby) return;
		// The table in the middle, the seats around it.
		const felt = this.add.graphics();
		felt.fillStyle(PALETTE.felt, 1).fillRoundedRect(L + 210, 110, 220, 100, 40);
		felt.lineStyle(3, shade(PALETTE.felt, -0.35), 1).strokeRoundedRect(
			L + 210,
			110,
			220,
			100,
			40,
		);
		this.ui.add(felt);
		this.ui.add(
			this.add
				.text(L + 320, 148, client.label ? t('lan.joinedAt', { addr: client.label }) : '', {
					...text(7, PALETTE.textLight, 190),
				})
				.setOrigin(0.5),
		);
		this.ui.add(
			this.add
				.text(L + 320, 184, t('lan.hint'), text(6, PALETTE.textDim, 200))
				.setOrigin(0.5),
		);
		const seatOf = lobby.seats.findIndex((s) => s?.id === client.id);
		lobby.seats.forEach((p, seat) => {
			const [x, y] = SEAT_AT[seat] as readonly [number, number];
			const mine = seat === seatOf;
			const pair = seat % 2 === 0 ? PALETTE.calm : PALETTE.truco;
			const label = p
				? mine
					? t('lan.you', { name: p.name })
					: p.id === lobby.host
						? `${p.name} (${t('lan.host.tag')})`
						: p.name
				: lobby.playing
					? t('lan.bot')
					: t('lan.sit');
			const b = new Button(
				this,
				label,
				() => client.send({ type: 'sit', seat: seat as 0 | 1 | 2 | 3 }),
				{
					w: SEAT_W,
					h: SEAT_H,
					size: 8,
					color: mine ? PALETTE.manilha : pair,
					left: p ? 40 : true,
				},
			).setPosition(L + x, y);
			b.setEnabled(mine || (!p && !lobby.playing));
			this.ui.add(b);
			if (p)
				this.ui.add(
					this.add
						.image(L + x - SEAT_W / 2 + 20, y, tex(this, `portrait.${p.char}.neutral`))
						.setDisplaySize(32, 32),
				);
			this.ui.add(
				this.add
					.text(
						L + x,
						y + (seat === 0 ? 30 : -30),
						t(seat % 2 === 0 ? 'lan.teamA' : 'lan.teamB'),
						{
							...text(6, pair),
						},
					)
					.setOrigin(0.5),
			);
		});
		this.drawBar(client, seatOf);
	}

	private drawBar(client: NetClient, seatOf: number): void {
		const L = this.stageLeft;
		const lobby = client.lobby;
		if (!lobby) return;
		const y = LOGICAL_H - 6 - 8 - BUTTON_H.action / 2;
		const leave = new Button(this, t('lan.leave'), () => this.leave(), {
			w: 100,
			h: BUTTON_H.action,
			size: 9,
		}).setPosition(L + 78, y);
		const me = lobby.seats[seatOf];
		const portrait = new Button(
			this,
			t('lan.portrait'),
			() => {
				if (!me) return;
				const taken = new Set(lobby.seats.map((s) => s?.char));
				const i = COMPANION_IDS.indexOf(me.char as (typeof COMPANION_IDS)[number]);
				for (let k = 1; k <= COMPANION_IDS.length; k++) {
					const next = COMPANION_IDS[(i + k) % COMPANION_IDS.length] as string;
					if (taken.has(next)) continue;
					client.send({ type: 'profile', name: me.name, char: next });
					break;
				}
			},
			{ w: 100, h: BUTTON_H.action, size: 9, color: PALETTE.calm },
		).setPosition(L + 320, y);
		this.ui.add([leave, portrait]);
		if (lobby.host === client.id)
			this.ui.add(
				new Button(this, t('lan.start'), () => client.send({ type: 'start' }), {
					w: 120,
					h: BUTTON_H.action,
					size: 9,
					color: PALETTE.good,
				}).setPosition(L + 554, y),
			);
		else
			this.ui.add(
				this.add
					.text(L + 554, y, t('lan.waitHost'), text(6, PALETTE.textDim, 110))
					.setOrigin(0.5),
			);
	}

	// --- Join form (a page overlay: a phone keyboard needs a real <input>) --------------------

	private closeForm(): void {
		this.form?.remove();
		this.form = null;
	}

	private openForm(error = ''): void {
		this.closeForm();
		const css = (el: HTMLElement, style: string): void => {
			el.style.cssText = style;
		};
		const el = <K extends keyof HTMLElementTagNameMap>(
			tag: K,
			style: string,
			label = '',
		): HTMLElementTagNameMap[K] => {
			const e = document.createElement(tag);
			css(e, style);
			e.textContent = label;
			return e;
		};
		const ink = toCss(PALETTE.textLight);
		const field = (label: string, value: string, max: number): HTMLInputElement => {
			const input = el(
				'input',
				`font:inherit;padding:8px 10px;border-radius:8px;border:2px solid ${toCss(PALETTE.panelLight)};background:${toCss(PALETTE.bgNeutral)};color:${ink};`,
			);
			input.value = value;
			input.maxLength = max;
			input.autocomplete = 'off';
			input.addEventListener('keydown', (e) => e.stopPropagation());
			wrap.append(el('label', 'font-size:13px;', label), input);
			return input;
		};
		const root = el(
			'div',
			`position:fixed;inset:0;z-index:20;display:grid;place-items:center;font-family:${UI_FONT};color:${ink};background:rgba(20,20,20,.55);`,
		);
		const wrap = el(
			'div',
			`display:flex;flex-direction:column;gap:8px;width:min(92vw,380px);padding:18px;border-radius:14px;background:${toCss(PALETTE.panel)};box-shadow:0 5px 0 ${toCss(PALETTE.shadow)};`,
		);
		wrap.append(
			el(
				'div',
				`font-size:20px;font-weight:700;color:${toCss(PALETTE.manilha)};`,
				t('lan.title'),
			),
		);
		const name = field(t('lan.name'), remember('name'), MAX_NAME);
		const addr = field(t('lan.address'), remember('addr'), 60);
		const status = el(
			'div',
			`min-height:2.6em;font-size:13px;color:${toCss(PALETTE.bad)};`,
			error,
		);
		const row = el('div', 'display:flex;gap:8px;flex-wrap:wrap;');
		const btn = (label: string, color: number, fn: () => void): HTMLButtonElement => {
			const b = el(
				'button',
				`flex:1;font:inherit;font-weight:700;padding:9px 12px;border:0;border-radius:8px;cursor:pointer;background:${toCss(color)};color:${toCss(PALETTE.textDark)};box-shadow:0 3px 0 ${toCss(PALETTE.shadow)};`,
				label,
			);
			b.addEventListener('click', fn);
			return b;
		};
		const busy = (on: boolean): void => {
			for (const b of row.querySelectorAll('button')) b.disabled = on;
			status.style.color = toCss(on ? PALETTE.textLight : PALETTE.bad);
			if (on) status.textContent = t('lan.connecting');
		};
		const go = async (address: string, label: string): Promise<void> => {
			busy(true);
			try {
				const who = name.value.trim() || 'Zapatro';
				remember('name', who);
				const client = await NetClient.connect(address, who, '');
				client.label = label || address;
				this.closeForm();
				this.attach(client);
			} catch {
				busy(false);
				status.textContent = t('lan.failed');
			}
		};
		const join = (): void => {
			remember('addr', addr.value.trim());
			void go(addr.value, addr.value.trim());
		};
		row.append(btn(t('lan.join'), PALETTE.good, join));
		if (canHostLan())
			row.append(
				btn(t('lan.host'), PALETTE.calm, async () => {
					busy(true);
					try {
						const host = await hostLan();
						const list = host.addresses.map((a) => `${a}:${host.port}`).join('  ');
						await go(`127.0.0.1:${host.port}`, list);
					} catch {
						busy(false);
						status.textContent = t('lan.hostFailed');
					}
				}),
			);
		row.append(btn(t('lan.back'), PALETTE.panelLight, () => this.leave()));
		addr.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') join();
		});
		wrap.append(status, row);
		root.append(wrap);
		document.body.append(root);
		this.form = root;
		addr.focus();
	}
}
