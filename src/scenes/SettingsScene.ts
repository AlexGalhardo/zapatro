import Phaser from 'phaser';
import { tex } from '../art/flat';
import { GAME_SPEEDS } from '../config/constants';
import { buttonFill, PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS, SAFE, SHADOW, TYPE } from '../config/ui';
import { sfx } from '../core/audio';
import { getSave, persist, setSave } from '../core/context';
import { setResolution } from '../core/display';
import { refreshMusicVolume } from '../core/music';
import { exportSave, pickSaveFile } from '../core/storage';
import { relayout, trackZoom } from '../core/viewport';
import { RESOLUTION_IDS, RESOLUTIONS } from '../data/display';
import { type I18nKey, LANGS, setLang, t } from '../i18n';
import { UI_SCALES } from '../logic/save';
import { Button } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { backHint, showHintLine } from '../ui/key-hint';
import { onKey } from '../ui/keys';
import { drawPanel } from '../ui/panel';
import { text } from '../ui/screen';
import { screenTitle } from '../ui/title';
import { applyTouch, byMode, touchUi, uiPx } from '../ui/touch';
import { applyComfort } from '../view/comfort';
import { fitCamera } from '../view/stage';

const cycle = <T>(list: readonly T[], cur: T, dir: -1 | 1): T =>
	list[(list.indexOf(cur) + dir + list.length) % list.length] as T;

/** The three panels of screen-settings.png (x range, header icon); stage pixels (640×360). */
const COLUMNS = [
	{ title: 'settings.col.av', x: [6, 210], icon: 'sound' },
	{ title: 'settings.col.ui', x: [218, 422], icon: 'monitor' },
	{ title: 'settings.col.game', x: [430, 634], icon: 'gamepad' },
] as const;
const PANEL = { y: 76, h: 258 };
/** Top of the first row, row heights by kind, and the gap between rows. */
const ROWS_TOP = 112;
const HEIGHT = { slider: 28, toggle: 19, choice: 19, action: 19 } as const;
/** Row height; on touch screens the short rows grow to the Button's touch minimum. */
const rowH = (kind: Kind): number => (touchUi.on ? Math.max(HEIGHT[kind], 22) : HEIGHT[kind]);
/** Row gap: the list gap, tighter on touch so the taller rows still fit the first column. */
const rowGap = (): number => (touchUi.on ? 2 : GAP.list);
/** The Back button sits 8 px above the panel's base (shadow included). */
const BACK_Y = PANEL.y + PANEL.h - 8 - SHADOW.button - BUTTON_H.primary / 2;
/** Half the distance between a choice's ◀ ▶ (wider on touch, where the text is bigger). */
const choiceHalf = (): number => (touchUi.on ? 51 : 44);
/** A choice value lives between its ◀ ▶ (14 wide), 2 px clear of each. */
const choiceW = (): number => 2 * choiceHalf() - 14 - 4;
/** Row positions are assigned by `place`; rows are declared in order. */
const R = (_i: number): number => 0;

type Kind = 'slider' | 'toggle' | 'choice' | 'action';

interface Row {
	col: 0 | 1 | 2;
	y: number;
	kind: Kind;
	label: I18nKey;
	/** Shown value (slider %, choice text) or the toggle state. */
	value?: () => string | boolean;
	/** Slider fill, 0–1. */
	level?: () => number;
	onAdjust?: (dir: -1 | 1) => void;
	onSelect?: () => void;
	disabled?: () => boolean;
}

/**
 * Settings (PLAN §4.5, D-57) drawn as the concept art: volumes, mute, fullscreen, resolution,
 * zoom, language, reduced flashes, screen shake, animation speed, four-colour deck, controls,
 * export/import. Every change applies at once and is saved.
 */
export class SettingsScene extends Phaser.Scene {
	private returnTo = 'Menu';
	private focus = 0;

	constructor() {
		super('Settings');
	}

	init(data: { returnTo?: string }): void {
		this.returnTo = data?.returnTo ?? 'Menu';
		this.focus = 0;
		// The scene instance survives restart() (language change): drop the old scene's objects.
		this.rows = [];
		this.redrawers = [];
	}

	create(): void {
		this.scene.bringToTop();
		const cam = this.cameras.main;
		cam.fadeIn(160, 5, 5, 8);
		const s = getSave(this).settings;
		const vol = (key: 'master' | 'music' | 'sfx' | 'ui', dir: -1 | 1) => {
			s.volume[key] =
				Math.round(Math.min(1, Math.max(0, s.volume[key] + dir * 0.1)) * 10) / 10;
			refreshMusicVolume(this);
			persist(this);
		};
		const status = this.add.text(320, 328, '', text(7, PALETTE.textDim)).setOrigin(0.5, 0);
		const say = (msg: string, color: number = PALETTE.textDim) =>
			status.setText(msg).setColor(toCss(color));
		const back = () => {
			persist(this);
			this.scene.stop();
			this.scene.resume(this.returnTo);
		};
		const slider = (
			y: number,
			key: 'master' | 'music' | 'sfx' | 'ui',
			label: I18nKey,
		): Row => ({
			col: 0,
			y,
			kind: 'slider',
			label,
			level: () => s.volume[key],
			value: () => `${Math.round(s.volume[key] * 100)}%`,
			onAdjust: (d) => vol(key, d),
		});
		const rows: Row[] = [
			slider(R(0), 'master', 'settings.row.master'),
			slider(R(1), 'music', 'settings.row.music'),
			slider(R(2), 'sfx', 'settings.row.sfx'),
			slider(R(3), 'ui', 'settings.row.ui'),
			{
				col: 0,
				y: R(4),
				kind: 'toggle',
				label: 'settings.row.muted',
				value: () => s.muted,
				onAdjust: () => {
					s.muted = !s.muted;
					this.sound.mute = s.muted;
					persist(this);
				},
			},
			{
				col: 0,
				y: R(5),
				kind: 'toggle',
				label: 'settings.row.fullscreen',
				value: () => this.scale.isFullscreen,
				onAdjust: () => {
					if (this.scale.isFullscreen) this.scale.stopFullscreen();
					else this.scale.startFullscreen();
					this.time.delayedCall(250, () => this.redraw());
				},
			},
			{
				col: 0,
				y: R(6),
				kind: 'choice',
				label: 'settings.row.resolution',
				value: () => {
					const r = RESOLUTIONS.find((x) => x.id === s.resolution);
					return r && r.height > 0 ? `${r.height}p` : t('settings.res.auto');
				},
				onAdjust: (d) => {
					s.resolution = cycle(RESOLUTION_IDS, s.resolution, d);
					setResolution(s.resolution);
					persist(this);
				},
			},
			{
				col: 0,
				y: R(7),
				kind: 'choice',
				label: 'settings.row.scale',
				value: () => (s.scale === 0 ? t('settings.scale.auto') : `×${s.scale}`),
				onAdjust: (d) => {
					s.scale = cycle(UI_SCALES, s.scale, d);
					persist(this);
					relayout(this.game);
				},
			},
			{
				col: 1,
				y: R(0),
				kind: 'choice',
				label: 'settings.row.lang',
				value: () => t('settings.row.langName'),
				onAdjust: (d) => {
					s.lang = cycle(LANGS, s.lang, d);
					setLang(s.lang);
					persist(this);
					this.scene.restart({ returnTo: this.returnTo });
				},
			},
			{
				col: 1,
				y: R(1),
				kind: 'toggle',
				label: 'settings.row.flashes',
				value: () => s.reduceFlashes,
				onAdjust: () => {
					s.reduceFlashes = !s.reduceFlashes;
					applyComfort(s);
					persist(this);
				},
			},
			{
				col: 1,
				y: R(2),
				kind: 'toggle',
				label: 'settings.row.shake',
				value: () => s.screenShake,
				onAdjust: () => {
					s.screenShake = !s.screenShake;
					persist(this);
				},
			},
			{
				col: 1,
				y: R(3),
				kind: 'choice',
				label: 'settings.row.gameSpeed',
				value: () => `${s.gameSpeed}x`,
				onAdjust: (d) => {
					s.gameSpeed = cycle(GAME_SPEEDS, s.gameSpeed, d);
					persist(this);
				},
			},
			{
				col: 1,
				y: R(4),
				kind: 'toggle',
				label: 'settings.row.fourColor',
				value: () => s.fourColor,
				onAdjust: () => {
					s.fourColor = !s.fourColor;
					applyComfort(s);
					persist(this);
				},
			},
			{
				col: 1,
				y: R(5),
				kind: 'toggle',
				label: 'settings.row.keyHints',
				value: () => s.keyHints,
				onAdjust: () => {
					s.keyHints = !s.keyHints;
					applyComfort(s);
					this.hintLine?.setVisible(showHintLine());
					persist(this);
				},
			},
			{
				col: 2,
				y: R(0),
				kind: 'action',
				label: 'settings.controls',
				onSelect: () => {
					this.scene.pause();
					this.scene.launch('Keybinds', { returnTo: 'Settings' });
				},
			},
			{
				col: 2,
				y: R(1),
				kind: 'action',
				label: 'settings.export',
				onSelect: () => exportSave(getSave(this)),
			},
			{
				col: 2,
				y: R(2),
				kind: 'action',
				label: 'settings.import',
				disabled: () => this.returnTo !== 'Menu',
				onSelect: () => {
					pickSaveFile(s.lang).then((r) => {
						if (!r || !this.scene.isActive()) return;
						if (!r.ok) {
							say(t('settings.importFail', { reason: r.reason }), PALETTE.bad);
							return;
						}
						setSave(this.game, r.save);
						applyComfort(r.save.settings);
						applyTouch(r.save.settings.touchControls);
						persist(this);
						setLang(r.save.settings.lang);
						this.sound.mute = r.save.settings.muted;
						refreshMusicVolume(this);
						setResolution(r.save.settings.resolution);
						this.scene.stop('Menu');
						this.scene.start('Menu');
					});
				},
			},
			{ col: 2, y: BACK_Y, kind: 'action', label: 'menu.back', onSelect: back },
		];
		this.rows = rows;
		this.place(rows);
		this.build(rows);
		this.hintLine = this.add
			.text(
				320,
				360 - SAFE.stage,
				t(byMode('settings.hint')),
				text(TYPE.small, PALETTE.textDim),
			)
			.setOrigin(0.5, 1)
			.setVisible(showHintLine());
		this.bindKeys(back);
		this.redraw();
		trackZoom(this, cam, (view) => fitCamera(cam, view));
	}

	private rows: Row[] = [];
	private hintLine?: Phaser.GameObjects.Text;
	private redrawers: (() => void)[] = [];

	private label(x: number, y: number, str: string, size = 8, color: number = PALETTE.textLight) {
		return this.add
			.text(x, y, str, {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(size)}px`,
				fontStyle: '700',
				color: toCss(color),
				shadow: TEXT_SHADOW,
			})
			.setOrigin(0, 0.5);
	}

	/** Stacks each column's rows from the top (the back button sits at the bottom of its panel). */
	private place(rows: Row[]): void {
		const next = [ROWS_TOP, ROWS_TOP, ROWS_TOP];
		for (const row of rows) {
			if (row.label === 'menu.back') {
				row.y = BACK_Y;
				continue;
			}
			const h = rowH(row.kind);
			row.y = (next[row.col] ?? ROWS_TOP) + h / 2;
			next[row.col] = (next[row.col] ?? ROWS_TOP) + h + rowGap();
		}
	}

	/** Title and the three panels with their headers (lit when the focus is in that panel). */
	private build(rows: Row[]): void {
		screenTitle(this, 320, t('settings.title'), 'gear');
		COLUMNS.forEach((c, i) => {
			const [x0, x1] = c.x;
			const mx = (x0 + x1) / 2;
			const g = this.add.graphics();
			drawPanel(g, x0, PANEL.y, x1 - x0, PANEL.h, { radius: RADIUS.panel, shadow: 3 });
			g.lineStyle(2, shade(PALETTE.panel, -0.3), 1).strokeRoundedRect(
				x0,
				PANEL.y,
				x1 - x0,
				PANEL.h,
				RADIUS.panel,
			);
			// Gold divider with a diamond under the header, at the panel's padding.
			g.fillStyle(PALETTE.manilha, 1).fillRect(
				x0 + PAD.panel,
				PANEL.y + 40,
				x1 - x0 - 2 * PAD.panel,
				1,
			);
			g.fillStyle(PALETTE.panel, 1).fillRect(mx - 5, PANEL.y + 36, 10, 9);
			g.fillStyle(PALETTE.manilha, 1)
				.fillTriangle(mx, PANEL.y + 36, mx + 4, PANEL.y + 40.5, mx, PANEL.y + 45)
				.fillTriangle(mx, PANEL.y + 36, mx - 4, PANEL.y + 40.5, mx, PANEL.y + 45);
			this.add
				.image(x0 + PAD.panel + 12, PANEL.y + 19, tex(this, `icon.${c.icon}`))
				.setScale(0.85);
			const head = this.label(x0 + 44, PANEL.y + 19, t(c.title).toUpperCase(), 12);
			this.add
				.zone(mx, PANEL.y + 19, x1 - x0, 36)
				.setInteractive({ useHandCursor: true })
				.on('pointerup', () => this.setFocus(rows.findIndex((r) => r.col === i)));
			this.redrawers.push(() => {
				const active = rows[this.focus]?.col === i;
				head.setColor(toCss(active ? PALETTE.manilha : PALETTE.textLight));
			});
		});
		rows.forEach((row, i) => {
			this.buildRow(row, i);
		});
	}

	private buildRow(row: Row, i: number): void {
		const c = COLUMNS[row.col];
		const [x0, x1] = c.x;
		const { y } = row;
		const isBack = row.label === 'menu.back';
		const h = isBack ? BUTTON_H.primary : rowH(row.kind);
		const left = x0 + 8;
		const right = x1 - 8;
		// The row's dark card; its frame lights up while focused.
		const card = this.add.graphics();
		let name: Phaser.GameObjects.Text | null = null;
		let back: Button | null = null;
		if (isBack) {
			back = new Button(this, t(row.label), () => this.select(i), {
				// As wide as the row cards above it (x0 + 5 to x1 - 5).
				w: x1 - x0 - 10,
				h: BUTTON_H.primary,
				size: TYPE.panelTitle,
				color: PALETTE.truco,
				left: 32,
				hint: backHint,
				icon: 'back2',
				iconScale: 0.8,
			}).setPosition((x0 + x1) / 2, y);
		} else name = this.label(left + 6, row.kind === 'slider' ? y - 8 : y, t(row.label), 9);
		const value = this.label(0, y, '', 8, PALETTE.textDim);
		const g = this.add.graphics();
		/** Where a click lowers (left of it) or raises the value. */
		let mid = (x0 + x1) / 2;
		let level: ((v: number) => void) | null = null;
		let toggle: ((on: boolean) => void) | null = null;
		if (row.kind === 'slider') {
			const tx = left + 26;
			const tw = right - left - 52;
			const by = y + 7;
			mid = tx + tw / 2;
			value
				.setOrigin(1, 0.5)
				.setX(right - 6)
				.setY(y - 8);
			this.add.image(left + 12, by, tex(this, 'icon.mute')).setScale(0.55);
			this.add.image(right - 12, by, tex(this, 'icon.sound')).setScale(0.5);
			level = (v) => {
				g.clear();
				g.fillStyle(PALETTE.shadow, 0.7).fillRoundedRect(tx, by - 3.5, tw, 7, 3.5);
				if (v > 0)
					g.fillStyle(PALETTE.good, 1).fillRoundedRect(
						tx,
						by - 3.5,
						Math.max(7, tw * v),
						7,
						3.5,
					);
				g.fillStyle(PALETTE.manilha, 1).fillRoundedRect(
					tx + (tw - 6) * v,
					by - 6.5,
					6,
					13,
					2,
				);
			};
		} else if (row.kind === 'toggle') {
			// SIM | NÃO segmented control.
			const w = 54;
			// Ends where the ◀ ▶ of the choice rows end.
			const tx = right - w - 1;
			value.setVisible(false);
			const yes = this.label(tx + w / 4, y, t('settings.toggle.on'), 7)
				.setOrigin(0.5)
				.setShadow(0, 0, '', 0, false, false);
			const no = this.label(tx + (w * 3) / 4, y, t('settings.toggle.off'), 7, PALETTE.textDim)
				.setOrigin(0.5)
				.setShadow(0, 0, '', 0, false, false);
			toggle = (on) => {
				g.clear();
				g.fillStyle(PALETTE.shadow, 0.8).fillRoundedRect(tx, y - 8, w, 16, RADIUS.button);
				g.fillStyle(on ? buttonFill(PALETTE.good) : PALETTE.buttonLight, 1).fillRoundedRect(
					on ? tx + 1.5 : tx + w / 2,
					y - 6.5,
					w / 2 - 1.5,
					13,
					RADIUS.card,
				);
				// Dark ink on the lit half (like every button), dim on the empty track.
				yes.setColor(toCss(on ? PALETTE.textDark : PALETTE.textDim));
				no.setColor(toCss(on ? PALETTE.textDim : PALETTE.textDark));
			};
		} else if (row.kind === 'choice') {
			mid = right - 8 - choiceHalf();
			value.setOrigin(0.5).setX(mid).setColor(toCss(PALETTE.textLight));
			for (const [x, s] of [
				[mid - choiceHalf(), '◀'],
				[mid + choiceHalf(), '▶'],
			] as const) {
				this.add
					.graphics()
					.fillStyle(PALETTE.buttonLight, 1)
					.fillRoundedRect(x - 7, y - 7, 14, 14, RADIUS.card);
				this.label(x, y - 0.5, s, 7, PALETTE.textDark)
					.setOrigin(0.5)
					.setShadow(0, 0, '', 0, false, false);
			}
		} else if (!isBack) this.label(right - 6, y, '›', 14, PALETTE.textLight).setOrigin(0.5);
		this.children.bringToTop(value);
		// The whole row answers the mouse: hover focuses; a click left of the value lowers it.
		const hit = this.add
			.zone((x0 + x1) / 2, y, x1 - x0, isBack ? 1 : h)
			.setInteractive({ useHandCursor: true });
		hit.on('pointerover', () => this.setFocus(i));
		hit.on('pointerup', (p: Phaser.Input.Pointer) => {
			this.setFocus(i);
			if (row.kind === 'action') this.select(i);
			else if (row.kind === 'toggle') this.adjust(1);
			else this.adjust(p.worldX < mid ? -1 : 1);
		});
		this.redrawers.push(() => {
			const focused = this.focus === i;
			const disabled = row.disabled?.() ?? false;
			card.clear();
			if (!isBack) {
				card.fillStyle(PALETTE.panelDark, 1).fillRoundedRect(
					x0 + 5,
					y - h / 2,
					x1 - x0 - 10,
					h,
					RADIUS.button,
				);
				card.lineStyle(
					focused ? 2 : 1,
					focused ? PALETTE.manilha : PALETTE.panelLight,
					1,
				).strokeRoundedRect(x0 + 5, y - h / 2, x1 - x0 - 10, h, RADIUS.button);
			}
			back?.setFocus(focused);
			name?.setColor(toCss(focused ? PALETTE.manilha : PALETTE.textLight));
			name?.setAlpha(disabled ? 0.4 : 1);
			const v = row.value?.();
			if (toggle) toggle(v === true);
			else value.setText(typeof v === 'string' ? v : '');
			// A long choice ("automática (nativa)") shrinks to stay between its arrows.
			if (row.kind === 'choice') {
				let px = uiPx(8);
				value.setFontSize(px);
				while (value.width > choiceW() && px > TYPE.min - 1) value.setFontSize(--px);
			}
			level?.(row.level?.() ?? 0);
		});
	}

	private redraw(): void {
		for (const r of this.redrawers) r();
	}

	private setFocus(i: number): void {
		if (i < 0 || i === this.focus) return;
		sfx(this, 'sfx.ui.move');
		this.focus = i;
		this.redraw();
	}

	private adjust(dir: -1 | 1): void {
		const row = this.rows[this.focus];
		if (!row?.onAdjust || row.disabled?.()) return;
		row.onAdjust(dir);
		sfx(this, 'sfx.ui.move');
		if (this.sys.isActive()) this.redraw();
	}

	private select(i: number = this.focus): void {
		const row = this.rows[i];
		if (!row || row.disabled?.()) return;
		sfx(this, 'sfx.ui.confirm');
		if (row.onSelect) row.onSelect();
		else row.onAdjust?.(1);
		if (this.sys.isActive()) this.redraw();
	}

	/** ↑↓ rows (past the ends: the next column), ←→ change values or switch columns, Enter, Esc. */
	private bindKeys(back: () => void): void {
		const kb = this.input.keyboard;
		const on = (keys: string[], fn: () => void) => {
			for (const k of keys) onKey(kb, `keydown-${k}`, fn);
		};
		const step = (d: -1 | 1) => {
			const n = this.rows.length;
			let i = this.focus;
			do i = (i + d + n) % n;
			while (this.rows[i]?.disabled?.() && i !== this.focus);
			this.setFocus(i);
		};
		const column = (d: -1 | 1) => {
			const col = ((this.rows[this.focus]?.col ?? 0) + d + 3) % 3;
			this.setFocus(this.rows.findIndex((r) => r.col === col));
		};
		on(['UP', 'W'], () => step(-1));
		on(['DOWN', 'S'], () => step(1));
		const side = (d: -1 | 1) => {
			if (this.rows[this.focus]?.onAdjust) this.adjust(d);
			else column(d);
		};
		on(['LEFT', 'A'], () => side(-1));
		on(['RIGHT', 'D'], () => side(1));
		on(['ENTER', 'SPACE'], () => this.select());
		on(['ESC', 'BACKSPACE'], () => {
			sfx(this, 'sfx.ui.back');
			back();
		});
	}
}
