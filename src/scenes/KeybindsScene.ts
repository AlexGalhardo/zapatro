import Phaser from 'phaser';
import { tex } from '../art/flat';
import { PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, GAP, RADIUS, SAFE, SHADOW, TYPE } from '../config/ui';
import { sfx } from '../core/audio';
import { getSave, persist } from '../core/context';
import { setCapturing } from '../core/hotkeys';
import { trackZoom } from '../core/viewport';
import { ACTIONS, type Action } from '../data/keybinds';
import { type I18nKey, t } from '../i18n';
import { defaultKeys, keyLabel, rebind } from '../logic/keybinds';
import { PAD_DEADZONES, TOUCH_MODES } from '../logic/save';
import { Button } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { backHint } from '../ui/key-hint';
import { onKey } from '../ui/keys';
import { drawPanel } from '../ui/panel';
import { screenTitle } from '../ui/title';
import { applyTouch, byMode, uiPx } from '../ui/touch';
import { addBackdrop, fitCamera } from '../view/stage';

/**
 * Settings → Controls (BUGS.md M-02):
 * two keys per table action. ←/→ picks the slot, Enter waits for a key (Esc cancels), Delete
 * clears the slot. A key used elsewhere moves here and the other action is named in the hint bar.
 */
const cycle = <T>(list: readonly T[], cur: T, dir: -1 | 1): T =>
	list[(list.indexOf(cur) + dir + list.length) % list.length] as T;

/** Row centres of the actions (left panel) and of the options and buttons (right panel). */
const ROW_STEP = 20;
const ACTION_Y = Array.from({ length: ACTIONS.length }, (_, i) => 90 + i * ROW_STEP);
/** Option cards are 26 tall; the first one's top lines up with the first action row (y 81). */
const OPTION_Y = [94, 126, 158];
/** Columns of the left panel: icon, label start, the two key caps and the gamepad glyph. */
const LEFT = { x: 8, w: 396 };
const COL = {
	icon: LEFT.x + 22,
	label: LEFT.x + 42,
	key0: LEFT.x + 262,
	key1: LEFT.x + 306,
	pad: LEFT.x + 358,
};
const RIGHT = { x: 412, w: 220 };
const PANEL = { y: 50, h: 286 };
/** Reset and Back, stacked from the right panel's base (8 px clear, shadow included). */
const BACK_Y = PANEL.y + PANEL.h - 8 - SHADOW.button - BUTTON_H.primary / 2;
const BUTTON_Y = [BACK_Y - BUTTON_H.primary - GAP.card, BACK_Y];
/** Icon of each action (screen-controls.png): suits for the cards, pixel-style shapes for the rest. */
const ICON: Record<Action, string> = {
	card1: 'ui.suit.clubs',
	card2: 'ui.suit.hearts',
	card3: 'ui.suit.spades',
	truco: 'icon.alert',
	accept: 'icon.check',
	fold: 'icon.back2',
	signal: 'icon.hand',
	cover: 'icon.cards',
	pause: 'icon.pause',
	speed: 'icon.refresh',
	mute: 'icon.mute',
	fullscreen: 'icon.monitor',
};
/** Gamepad glyph of each action (the fixed pad layout); none = a dash. */
const PAD: Partial<Record<Action, string>> = {
	card1: '✕',
	card2: '✕',
	card3: '✕',
	truco: '△',
	accept: 'R2',
	fold: 'L2',
	signal: '□',
	cover: 'L1',
	pause: 'OPT',
};

const style = (size: number, color: number): Phaser.Types.GameObjects.Text.TextStyle => ({
	fontFamily: UI_FONT,
	fontSize: `${uiPx(size)}px`,
	fontStyle: '700',
	color: toCss(color),
	shadow: TEXT_SHADOW,
});

export class KeybindsScene extends Phaser.Scene {
	private returnTo = 'Settings';

	constructor() {
		super('Keybinds');
	}

	init(data: { returnTo?: string }): void {
		this.returnTo = data?.returnTo ?? 'Settings';
	}

	create(): void {
		this.scene.bringToTop();
		const cam = this.cameras.main;
		cam.setBackgroundColor(PALETTE.bgNeutral);
		const s = getSave(this).settings;
		const keys = s.keys;
		const slot = Object.fromEntries(ACTIONS.map((a) => [a, 0])) as Record<Action, 0 | 1>;
		let waiting: Action | null = null;
		let focus = 0;

		addBackdrop(this);
		screenTitle(this, 320, t('keys.title'), 'gamepad');
		for (const panel of [LEFT, RIGHT]) {
			const g = this.add.graphics();
			drawPanel(g, panel.x, PANEL.y, panel.w, PANEL.h, { radius: RADIUS.panel });
			g.lineStyle(2, shade(PALETTE.panel, -0.3), 1).strokeRoundedRect(
				panel.x,
				PANEL.y,
				panel.w,
				PANEL.h,
				RADIUS.panel,
			);
		}
		const header = (x: number, key: I18nKey, origin = 0.5) =>
			this.add
				.text(x, PANEL.y + 12, t(key), style(8, PALETTE.manilha))
				.setOrigin(origin, 0.5);
		header(COL.label, 'keys.col.action', 0);
		header((COL.key0 + COL.key1) / 2, 'keys.col.keyboard');
		header(COL.pad, 'keys.col.pad');
		const rule = this.add.graphics();
		rule.fillStyle(PALETTE.manilha, 1).fillRect(LEFT.x + 12, PANEL.y + 22, LEFT.w - 24, 1);
		const focusBar = this.add.graphics();
		const hint = this.add
			.text(320, 360 - SAFE.stage, t(byMode('keys.hint')), style(TYPE.small, PALETTE.textDim))
			.setOrigin(0.5, 1);
		const say = (msg: string, color: number = PALETTE.textDim) =>
			hint
				.setText(msg || t(byMode('keys.hint')))
				.setColor(toCss(msg ? color : PALETTE.textDim));

		// Left panel: name, two key caps and the gamepad glyph of each action.
		const rows = ACTIONS.map((a, i) => {
			const y = ACTION_Y[i] ?? 0;
			const iconKey = ICON[a];
			this.add
				.image(COL.icon, y, tex(this, iconKey))
				.setScale(iconKey.startsWith('ui.') ? 0.55 : 0.62);
			const label = this.add.text(
				COL.label,
				y,
				t(`keys.${a}` as I18nKey),
				style(9, PALETTE.textLight),
			);
			label.setOrigin(0, 0.5);
			const caps = [COL.key0, COL.key1].map((x) => ({
				x,
				cap: this.add.graphics(),
				text: this.add
					.text(x, y, '', { ...style(8, PALETTE.textLight), shadow: undefined })
					.setOrigin(0.5),
			}));
			this.add.text(COL.pad, y, PAD[a] ?? '—', style(8, PALETTE.textDim)).setOrigin(0.5);
			return { a, y, label, caps };
		});
		const drawKeys = () =>
			rows.forEach(({ a, y, label, caps }, i) => {
				const on = focus === i;
				label.setColor(toCss(on ? PALETTE.manilha : PALETTE.textLight));
				caps.forEach(({ x, cap, text }, k) => {
					const code = keys[a][k] ?? '';
					const asking = waiting === a && slot[a] === k;
					const shown = asking ? '?' : code ? keyLabel(code) : '';
					text.setText(shown);
					cap.clear();
					// Empty slots stay as dashed boxes so the second key is findable.
					// Two cap widths (30, 38, 46…) so the columns line up row to row.
					const w = 30 + Math.max(0, Math.ceil((text.width + 12 - 30) / 8)) * 8;
					const lit = on && slot[a] === k;
					cap.fillStyle(PALETTE.panelDark, 1).fillRoundedRect(
						x - w / 2,
						y - 7,
						w,
						14,
						RADIUS.card,
					);
					cap.lineStyle(
						lit ? 2 : 1,
						lit ? PALETTE.manilha : PALETTE.panelLight,
						1,
					).strokeRoundedRect(x - w / 2, y - 7, w, 14, RADIUS.card);
					text.setY(y - 0.5);
				});
			});

		// Right panel: vibration, dead zone, touch controls; then the two buttons.
		const optionLabel = (i: number, key: I18nKey) =>
			this.add
				.text(RIGHT.x + 12, OPTION_Y[i] ?? 0, t(key), style(8, PALETTE.textLight))
				.setOrigin(0, 0.5);
		const optLabels = [
			optionLabel(0, 'keys.vibrationShort'),
			optionLabel(1, 'keys.deadzoneShort'),
			optionLabel(2, 'keys.touchShort'),
		];
		const valueX = RIGHT.x + RIGHT.w - 44;
		const values = OPTION_Y.map((y) =>
			this.add.text(valueX, y, '', style(8, PALETTE.manilha)).setOrigin(0.5),
		);
		const buttons = (['keys.defaults', 'menu.back'] as const).map((key, i) =>
			new Button(
				this,
				t(key),
				() => {
					focus = ACTIONS.length + 3 + i;
					select();
				},
				{
					// Edge to edge with the option cards above (RIGHT.x + 6 to the right edge - 6).
					w: RIGHT.w - 12,
					h: BUTTON_H.primary,
					size: TYPE.panelTitle,
					...(i ? { color: PALETTE.truco, hint: backHint } : {}),
				},
			).setPosition(RIGHT.x + RIGHT.w / 2, BUTTON_Y[i] ?? 0),
		);
		const drawOptions = () => {
			values[0]?.setText(t(s.padVibration ? 'keys.on' : 'keys.off'));
			values[1]?.setText(t(`keys.dz.${s.padDeadzone}`));
			values[2]?.setText(t(`keys.touchShort.${s.touchControls}`));
			const lit = (row: number) =>
				toCss(focus === row ? PALETTE.panelBorder : PALETTE.textLight);
			for (const [i, l] of optLabels.entries()) l.setColor(lit(ACTIONS.length + i));
			for (const [i, b] of buttons.entries()) b.setFocus(focus === ACTIONS.length + 3 + i);
		};

		const count = ACTIONS.length + 5;
		const draw = () => {
			focusBar.clear();
			// Every row is a dark card; the focused one gets the gold frame.
			const card = (x: number, w: number, y: number, h: number, on: boolean) => {
				focusBar
					.fillStyle(PALETTE.panelDark, 1)
					.fillRoundedRect(x, y - h / 2, w, h, RADIUS.button);
				focusBar
					.lineStyle(on ? 2 : 1, on ? PALETTE.manilha : PALETTE.panelLight, 1)
					.strokeRoundedRect(x, y - h / 2, w, h, RADIUS.button);
			};
			for (const [i, y] of ACTION_Y.entries())
				card(LEFT.x + 6, LEFT.w - 12, y, 18, focus === i);
			for (const [i, y] of OPTION_Y.entries())
				card(RIGHT.x + 6, RIGHT.w - 12, y, 26, focus === ACTIONS.length + i);
			drawKeys();
			drawOptions();
		};

		const back = () => {
			persist(this);
			this.scene.stop();
			this.scene.resume(this.returnTo);
		};
		const capture = (a: Action) => {
			waiting = a;
			setCapturing(true);
			say(t('keys.press'), PALETTE.manilha);
			draw();
			const listen = (e: KeyboardEvent) => {
				e.preventDefault();
				e.stopPropagation();
				window.removeEventListener('keydown', listen, true);
				if (e.code !== 'Escape') {
					const r = rebind(keys, a, slot[a], e.code);
					if (!r.ok) say(t('keys.reserved', { key: keyLabel(e.code) }), PALETTE.bad);
					else {
						sfx(this, 'sfx.ui.confirm');
						say(
							r.moved
								? t('keys.moved', {
										key: keyLabel(e.code),
										action: t(`keys.${r.moved}` as I18nKey),
									})
								: '',
							PALETTE.money,
						);
						persist(this);
					}
				} else say('');
				waiting = null;
				// Phaser reads the same DOM event on its next frame: release the capture after it.
				this.time.delayedCall(120, () => setCapturing(false));
				draw();
			};
			window.addEventListener('keydown', listen, true);
		};
		const adjust = (d: -1 | 1) => {
			const a = ACTIONS[focus];
			if (a) slot[a] = d > 0 ? 1 : 0;
			else if (focus === ACTIONS.length) s.padVibration = !s.padVibration;
			else if (focus === ACTIONS.length + 1)
				s.padDeadzone = cycle(PAD_DEADZONES, s.padDeadzone, d);
			else if (focus === ACTIONS.length + 2) {
				s.touchControls = cycle(TOUCH_MODES, s.touchControls, d);
				applyTouch(s.touchControls);
			} else return;
			if (!a) persist(this);
			sfx(this, 'sfx.ui.move');
			draw();
		};
		const select = () => {
			const a = ACTIONS[focus];
			if (a) capture(a);
			else if (focus < ACTIONS.length + 3) adjust(1);
			else if (focus === ACTIONS.length + 3) {
				Object.assign(keys, defaultKeys());
				persist(this);
				say(t('keys.restored'), PALETTE.good);
				draw();
			} else back();
		};
		const move = (step: number) => {
			focus = (focus + step + count) % count;
			sfx(this, 'sfx.ui.move');
			draw();
		};

		const kb = this.input.keyboard;
		const on = (names: string[], fn: () => void) => {
			for (const k of names) onKey(kb, `keydown-${k}`, () => !waiting && fn());
		};
		on(['UP', 'W'], () => move(-1));
		on(['DOWN', 'S'], () => move(1));
		on(['LEFT', 'A'], () => adjust(-1));
		on(['RIGHT', 'D'], () => adjust(1));
		on(['ENTER', 'SPACE'], select);
		on(['ESC'], back);
		on(['DELETE'], () => {
			const a = ACTIONS[focus];
			if (!a) return;
			keys[a][slot[a]] = '';
			persist(this);
			draw();
		});
		// Mouse/touch: a row is focused on hover and used on click.
		const zone = (x: number, y: number, w: number, h: number, i: number) =>
			this.add
				.zone(x, y, w, h)
				.setInteractive({ useHandCursor: true })
				.on('pointerover', () => {
					if (waiting || focus === i) return;
					focus = i;
					draw();
				})
				.on('pointerdown', () => {
					if (waiting) return;
					focus = i;
					select();
				});
		for (const [i, y] of ACTION_Y.entries()) zone(LEFT.x + LEFT.w / 2, y, LEFT.w - 12, 19, i);
		for (const [i, y] of OPTION_Y.entries())
			zone(RIGHT.x + RIGHT.w / 2, y, RIGHT.w - 12, 24, ACTIONS.length + i);
		draw();
		trackZoom(this, cam, (view) => fitCamera(cam, view));
	}
}
