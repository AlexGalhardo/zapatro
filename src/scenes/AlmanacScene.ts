import Phaser from 'phaser';
import { tex } from '../art/flat';
import { PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS, TYPE } from '../config/ui';
import { getSave } from '../core/context';
import { trackZoom } from '../core/viewport';
import { BOSS_POOL, FINAL_BOSS } from '../data/bosses';
import { COMPANION_IDS, COMPANIONS, type CompanionId } from '../data/companions';
import { DECK_IDS } from '../data/decks';
import { FEATS } from '../data/feats';
import { MANHA_BY_ID, MANHAS } from '../data/manhas';
import { getLang, type I18nKey, t } from '../i18n';
import { flawText, perkText } from '../i18n/companion';
import { en } from '../i18n/en';
import { formatPoints } from '../logic/score/format';
import { Button } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { backHint } from '../ui/key-hint';
import { onKey } from '../ui/keys';
import { buttonNav } from '../ui/nav';
import { drawPanel } from '../ui/panel';
import { fadeTo } from '../ui/screen';
import { addTitle } from '../ui/title';
import { touchUi, uiPx } from '../ui/touch';
import { fitCamera } from '../view/stage';
import { setBackdrop } from './BackdropScene';

const TABS = ['manhas', 'bosses', 'partners', 'decks', 'feats', 'stats'] as const;
type Tab = (typeof TABS)[number];
type Kind = 'manha' | 'boss' | 'partner' | 'deck';

/** Icon of each tab (pixel bitmaps where scripts/icons.ts has one, vector shapes otherwise). */
const TAB_ICON: Record<Tab, string> = {
	manhas: 'star',
	bosses: 'skull',
	partners: 'people',
	decks: 'cards',
	feats: 'trophy',
	stats: 'list',
};

/** Stage geometry of screen-almanac.png: the frame, the grid panel and the detail panel. */
const FRAME = { x: 8, y: 6, w: 624, h: 348 };
const GRID = { x: 14, y: 90, w: 318, h: 256 };
const DETAIL = { x: 338, y: 90, w: 288, h: 256 };
/** The panels over the Back button (detail, Feats, Stats) stop 6 px above it. */
const LIST_H = DETAIL.h - 36;
/** Feats, Stats and the tab row span both columns. */
const LIST_W = DETAIL.x + DETAIL.w - GRID.x;
const BACK_Y = DETAIL.y + DETAIL.h - BUTTON_H.primary / 2 - 2;

/**
 * Almanac (PLAN B2.3) and lifetime stats (B2.4): everything the player has seen, the feats and
 * the run history. Unseen entries show as "???". The layout is screen-almanac.png: a grid on the
 * left and the picked entry on the right.
 */
export class AlmanacScene extends Phaser.Scene {
	private tab: Tab = 'manhas';
	private picked = 0;
	private body!: Phaser.GameObjects.Container;
	private detail!: Phaser.GameObjects.Container;
	private cx = 320;
	private nav: { reset(): void } | null = null;

	constructor() {
		super('Almanac');
	}

	create(): void {
		this.body = this.add.container(0, 0);
		this.picked = 0;
		const back = () => fadeTo(this, 'Menu');
		const move = (d: number) => {
			this.tab = TABS[(TABS.indexOf(this.tab) + d + TABS.length) % TABS.length] ?? 'manhas';
			this.picked = 0;
			this.draw();
		};
		onKey(this.input.keyboard, 'keydown-ESC', back);
		// Q/E switch tabs; the arrows move between buttons (gamepad L1/R1 too).
		onKey(this.input.keyboard, 'keydown-Q', () => move(-1));
		onKey(this.input.keyboard, 'keydown-E', () => move(1));
		this.nav = buttonNav(this);
		// The 640×360 stage scaled to fit, like Settings: a phone held upright (or any narrow
		// window) shows the whole Almanac instead of cutting its sides off.
		this.scene.bringToTop();
		// Opened from the shop it would keep the counter painting (Run picks it per phase).
		setBackdrop(this, 'main');
		const cam = this.cameras.main;
		cam.fadeIn(160, 5, 5, 8);
		// Under the body container, which was created first.
		trackZoom(this, cam, (view) => {
			fitCamera(cam, view);
			this.draw();
		});
	}

	private seen(id: string): boolean {
		return getSave(this).meta.seen.includes(id);
	}

	private put(
		x: number,
		y: number,
		s: string,
		px: number,
		color: number = PALETTE.textLight,
		o: [number, number] = [0.5, 0.5],
		wrap?: number,
		into: Phaser.GameObjects.Container = this.body,
	): Phaser.GameObjects.Text {
		const txt = this.add
			.text(x, y, s, {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(px)}px`,
				fontStyle: '700',
				color: toCss(color),
				align: o[0] === 0 ? 'left' : 'center',
				wordWrap: wrap ? { width: wrap } : undefined,
				shadow: TEXT_SHADOW,
			})
			.setOrigin(o[0], o[1]);
		into.add(txt);
		return txt;
	}

	private draw(_height = 360): void {
		this.nav?.reset();
		this.body.removeAll(true);
		this.detail = this.add.container(0, 0).setDepth(2);
		const L = this.cx - 320;
		const g = this.add.graphics();
		drawPanel(g, L + FRAME.x, FRAME.y, FRAME.w, FRAME.h, { radius: RADIUS.frame, shadow: 4 });
		g.lineStyle(2, shade(PALETTE.panel, -0.3), 1).strokeRoundedRect(
			L + FRAME.x,
			FRAME.y,
			FRAME.w,
			FRAME.h,
			RADIUS.frame,
		);
		this.body.add(g);
		this.body.add(this.add.image(L + 38, 30, tex(this, 'icon.book')).setScale(1.3));
		this.body.add(addTitle(this, L + 62, 30, t('almanac.title'), 25, PALETTE.manilha, 0));
		// Six tabs spanning the grid and detail panels. The active tab is added first so
		// buttonNav's starting focus lands on it.
		const tabW = (LIST_W - 5 * GAP.inline) / TABS.length;
		const order = [this.tab, ...TABS.filter((tab) => tab !== this.tab)];
		for (const tab of order) {
			const i = TABS.indexOf(tab);
			const on = tab === this.tab;
			const b = new Button(
				this,
				t(`almanac.${tab}` as I18nKey),
				() => {
					this.tab = tab;
					this.picked = 0;
					this.draw();
				},
				{
					w: tabW,
					h: BUTTON_H.primary,
					size: TYPE.label,
					color: on ? PALETTE.manilha : PALETTE.panelDark,
					// Touch text is bigger: a smaller icon leaves the label room ("Companheiros").
					left: touchUi.on ? 17 : 20,
					icon: TAB_ICON[tab],
					iconScale: touchUi.on ? 0.45 : 0.5,
					// The gold focus ring marks the tab; an "Enter" keycap would shrink its label.
					focusHint: false,
				},
			);
			b.setPosition(L + GRID.x + tabW / 2 + i * (tabW + GAP.inline), 66);
			this.body.add(b);
		}
		// Added after the tabs: buttonNav focuses the first button, and Enter on ✕ closed the Almanac.
		const close = new Button(this, '', () => fadeTo(this, 'Menu'), { w: 26, h: 24 });
		close.setPosition(L + 612, 26);
		this.body.add(close);
		this.body.add(this.add.image(L + 612, 25, tex(this, 'icon.close')).setScale(0.7));
		// Same column as the detail panel above it (and the list panels of Feats and Stats).
		const back = new Button(this, t('menu.back'), () => fadeTo(this, 'Menu'), {
			w: DETAIL.w,
			h: BUTTON_H.primary,
			size: TYPE.panelTitle,
			color: PALETTE.truco,
			left: 32,
			hint: backHint,
			icon: 'back2',
		});
		back.setPosition(L + DETAIL.x + DETAIL.w / 2, BACK_Y);
		this.body.add(back);
		if (this.tab === 'manhas')
			this.grid(
				MANHAS.map((m) => m.id),
				'manha',
			);
		if (this.tab === 'bosses') this.grid([...BOSS_POOL, FINAL_BOSS], 'boss');
		if (this.tab === 'partners') this.grid([...COMPANION_IDS], 'partner');
		if (this.tab === 'decks') this.grid([...DECK_IDS], 'deck');
		if (this.tab === 'feats') this.feats(L);
		if (this.tab === 'stats') this.stats(L);
	}

	private artKey(kind: Kind, id: string): string {
		if (kind === 'manha') return `manha.${id}`;
		if (kind === 'boss' || kind === 'partner') return `charcard.${id}`;
		return `card.back.${id === 'normal' ? 'default' : id}`;
	}

	/** Icon grid on the left; hovering (or tapping) an entry shows it on the right. */
	private grid(ids: readonly string[], kind: Kind): void {
		const L = this.cx - 320;
		const cell = kind === 'manha' ? 27 : 44;
		const gap = kind === 'manha' ? 2 : 3;
		const cols = Math.floor((GRID.w - 2 * PAD.panel + gap) / (cell + gap));
		// The grid is centred in its panel, the same margin on both sides.
		const x0 = L + GRID.x + (GRID.w - (cols * (cell + gap) - gap)) / 2;
		const g = this.add.graphics();
		drawPanel(g, L + GRID.x, GRID.y, GRID.w, GRID.h, {
			radius: RADIUS.panel,
			fill: PALETTE.panelDark,
			shadow: 2,
		});
		this.body.add(g);
		const seenCount = ids.filter((id) => this.seen(`${kind}:${id}`)).length;
		this.put(
			L + GRID.x + PAD.panel,
			GRID.y + PAD.panel,
			t('almanac.seen', { n: seenCount, total: ids.length }),
			7,
			PALETTE.textDim,
			[0, 0.5],
		);
		const frame = this.add.graphics();
		this.body.add(frame);
		const cells: { x: number; y: number }[] = [];
		const select = (i: number): void => {
			this.picked = i;
			frame.clear();
			const c = cells[i];
			if (c)
				frame
					.lineStyle(2, PALETTE.manilha, 1)
					.strokeRoundedRect(
						c.x - cell / 2 - 1,
						c.y - cell / 2 - 1,
						cell + 2,
						cell + 2,
						RADIUS.button,
					);
			this.showDetail(kind, ids[i] ?? '');
		};
		ids.forEach((id, i) => {
			const x = x0 + cell / 2 + (i % cols) * (cell + gap);
			const y = GRID.y + 26 + cell / 2 + Math.floor(i / cols) * (cell + gap);
			cells.push({ x, y });
			const slot = this.add.graphics();
			slot.fillStyle(PALETTE.panel, 1).fillRoundedRect(
				x - cell / 2,
				y - cell / 2,
				cell,
				cell,
				RADIUS.button,
			);
			this.body.add(slot);
			const img = this.add
				.image(x, y, tex(this, this.artKey(kind, id)))
				.setInteractive({ useHandCursor: true });
			const art = Math.max(img.width, img.height);
			img.setScale((cell - 6) / art);
			if (!this.seen(`${kind}:${id}`)) img.setTint(0x101010);
			img.on('pointerover', () => select(i));
			img.on('pointerdown', () => select(i));
			this.body.add(img);
		});
		const d = this.add.graphics();
		drawPanel(d, L + DETAIL.x, DETAIL.y, DETAIL.w, LIST_H, {
			radius: RADIUS.panel,
			fill: PALETTE.panelDark,
			shadow: 2,
		});
		this.body.add(d);
		this.body.add(this.detail);
		select(Math.min(this.picked, ids.length - 1));
	}

	/** The picked entry: art, name, text and whether it is unlocked. */
	private showDetail(kind: Kind, id: string): void {
		const L = this.cx - 320;
		this.detail.removeAll(true);
		const seen = this.seen(`${kind}:${id}`);
		const x0 = L + DETAIL.x + 12;
		const frame = this.add.graphics();
		frame.fillStyle(PALETTE.panel, 1).fillRoundedRect(x0, DETAIL.y + 12, 78, 78, RADIUS.panel);
		frame
			.lineStyle(2, PALETTE.panelLight, 1)
			.strokeRoundedRect(x0, DETAIL.y + 12, 78, 78, RADIUS.panel);
		this.detail.add(frame);
		const art = this.add.image(x0 + 39, DETAIL.y + 51, tex(this, this.artKey(kind, id)));
		art.setScale(68 / Math.max(art.width, art.height));
		if (!seen) art.setTint(0x101010);
		this.detail.add(art);
		const name =
			kind === 'manha'
				? `manha.${id}.name`
				: kind === 'boss'
					? `boss.${id}.name`
					: kind === 'partner'
						? `char.${id}`
						: `deck.${id}.name`;
		const desc =
			kind === 'manha'
				? `manha.${id}.desc`
				: kind === 'boss'
					? `boss.${id}.rule`
					: kind === 'partner'
						? `partner.style.${COMPANIONS[id as CompanionId]?.style}`
						: `deck.${id}.desc`;
		const w = DETAIL.w - 24;
		const title = this.put(
			x0 + 88,
			DETAIL.y + 28,
			seen ? t(name as I18nKey) : '???',
			17,
			PALETTE.manilha,
			[0, 0.5],
			w - 88,
			this.detail,
		);
		const line = this.add.graphics();
		line.fillStyle(PALETTE.manilha, 1).fillRect(x0 + 88, DETAIL.y + 46, w - 88, 1);
		this.detail.add(line);
		const sub =
			kind === 'manha'
				? t(`rarity.${MANHA_BY_ID.get(id as never)?.rarity ?? 'common'}` as I18nKey)
				: '';
		if (sub && seen)
			this.put(
				x0 + 88,
				DETAIL.y + 56,
				sub,
				8,
				PALETTE.textDim,
				[0, 0.5],
				w - 88,
				this.detail,
			);
		// GD-025: Manha names stay in Portuguese (D-29); English players get a literal gloss.
		const lit = `manha.${id}.lit`;
		if (kind === 'manha' && seen && getLang() === 'en' && lit in en)
			this.put(
				x0 + 88,
				DETAIL.y + 70,
				t('almanac.lit', { s: t(lit as I18nKey) }),
				8,
				PALETTE.textDim,
				[0, 0.5],
				w - 88,
				this.detail,
			);
		title.setLineSpacing(0);
		let y = DETAIL.y + 100;
		if (!seen) {
			this.put(x0, y, t('almanac.locked'), 9, PALETTE.textDim, [0, 0], w, this.detail);
		} else {
			this.put(x0, y, t(desc as I18nKey), 9, PALETTE.textLight, [0, 0], w, this.detail);
			if (kind === 'partner') {
				y += 40;
				this.put(
					x0,
					y,
					perkText(id as CompanionId),
					8,
					PALETTE.good,
					[0, 0],
					w,
					this.detail,
				);
				this.put(
					x0,
					y + 22,
					flawText(id as CompanionId),
					8,
					PALETTE.bad,
					[0, 0],
					w,
					this.detail,
				);
			}
		}
		const bar = this.add.graphics();
		const barY = DETAIL.y + LIST_H - 34;
		bar.fillStyle(PALETTE.panel, 1).fillRoundedRect(x0, barY, w, 24, RADIUS.button);
		this.detail.add(bar);
		// Icon and word as one centred pair.
		const icon = this.add
			.image(0, barY + 12, tex(this, seen ? 'icon.star' : 'icon.lock'))
			.setScale(0.6);
		this.detail.add(icon);
		const word = this.put(
			0,
			barY + 12,
			t(seen ? 'almanac.unlocked' : 'almanac.lockedShort'),
			9,
			seen ? PALETTE.manilha : PALETTE.textDim,
			[0, 0.5],
			undefined,
			this.detail,
		);
		// The pixel icons keep ~3/32 of clear margin per side and the glyph has its own bearing, so
		// half the inline gap between the boxes reads as GAP.inline between the ink.
		const gap = GAP.inline / 2;
		const pairX = x0 + (w - (icon.displayWidth + gap + word.width)) / 2;
		icon.setX(pairX + icon.displayWidth / 2);
		word.setX(pairX + icon.displayWidth + gap);
	}

	private feats(L: number): void {
		const got = getSave(this).meta.feats;
		const g = this.add.graphics();
		drawPanel(g, L + GRID.x, GRID.y, LIST_W, LIST_H, {
			radius: RADIUS.panel,
			fill: PALETTE.panelDark,
			shadow: 2,
		});
		this.body.add(g);
		this.put(
			L + GRID.x + PAD.panel,
			GRID.y + PAD.panel,
			t('almanac.seen', { n: got.length, total: FEATS.length }),
			7,
			PALETTE.textDim,
			[0, 0.5],
		);
		// 4 columns × 10 rows of 18 px fit the panel above the Back button.
		const colW = (LIST_W - 2 * PAD.panel) / 4;
		FEATS.forEach((f, i) => {
			const col = i % 4;
			const row = Math.floor(i / 4);
			const done = got.includes(f.id);
			const x = L + GRID.x + PAD.panel + col * colW;
			const y = GRID.y + 30 + row * 18;
			this.body.add(
				this.add
					.image(x + 6, y, tex(this, done ? 'icon.trophy' : 'icon.lock'))
					.setScale(0.5),
			);
			this.put(
				x + 18,
				y,
				t(`feat.${f.id}.name` as I18nKey),
				8,
				done ? PALETTE.manilha : PALETTE.textDim,
				[0, 0.5],
				colW - 22,
			);
		});
	}

	private stats(L: number): void {
		const s = getSave(this).meta.stats;
		const g = this.add.graphics();
		drawPanel(g, L + GRID.x, GRID.y, LIST_W, LIST_H, {
			radius: RADIUS.panel,
			fill: PALETTE.panelDark,
			shadow: 2,
		});
		this.body.add(g);
		const lines = [
			t('stats.runs', { n: s.runs, w: s.wins }),
			t('stats.hands', { n: s.handsPlayed, w: s.handsWon }),
			t('stats.trucos', { n: s.trucosCalled, b: s.bluffsWon }),
			t('stats.best', { h: formatPoints(s.bestHand, 'pt-BR'), c: s.bestChampionship }),
		];
		lines.forEach((l, i) => {
			this.put(
				L + GRID.x + PAD.panel,
				GRID.y + 18 + i * 17,
				l,
				9,
				PALETTE.textLight,
				[0, 0.5],
			);
		});
		this.put(
			L + GRID.x + PAD.panel,
			GRID.y + 94,
			t('stats.history'),
			10,
			PALETTE.manilha,
			[0, 0.5],
		);
		// Credits at the panel's foot (wrapping to two lines in touch mode); the history keeps
		// only the rows that end above them.
		const credits = this.put(
			L + GRID.x + PAD.panel,
			GRID.y + LIST_H - PAD.panel,
			t('stats.credits'),
			TYPE.small,
			PALETTE.textDim,
			[0, 1],
			LIST_W - 2 * PAD.panel,
		);
		const step = 13;
		// Row i is centred on GRID.y + 112 + i * step; its lower half must stay GAP.list over the credits.
		const fits =
			Math.floor(
				(credits.getBounds().top - GAP.list - uiPx(TYPE.small) / 2 - (GRID.y + 112)) / step,
			) + 1;
		s.history.slice(0, Math.min(8, fits)).forEach((r, i) => {
			const date = new Date(r.at).toLocaleDateString();
			this.put(
				L + GRID.x + PAD.panel,
				GRID.y + 112 + i * step,
				`${date} · ${t(`stats.end.${r.reason}` as I18nKey)} · ${t('run.champ', { n: r.championship })} · ${t(`char.${r.partner}` as I18nKey)} · ${t(`deck.${r.deck}.name` as I18nKey)} · ${t('run.stake', { n: r.stake })}`,
				TYPE.small,
				PALETTE.textDim,
				[0, 0.5],
			);
		});
	}
}
