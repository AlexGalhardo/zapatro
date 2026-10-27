import Phaser from 'phaser';
import { canvasTex, drawMenuFan, MENU_FAN } from '../art/flat';
import { PALETTE, toCss } from '../config/palette';
import { BUTTON_H, GAP } from '../config/ui';
import { sfx } from '../core/audio';
import { getSave } from '../core/context';
import { playAmbience, playMusic } from '../core/music';
import { isElectron, lanAvailable } from '../core/platform';
import { trackZoom } from '../core/viewport';
import { getLang, type I18nKey, t } from '../i18n';
import { parseRun } from '../logic/run/run';
import { Button } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { onKey, onSceneEvent } from '../ui/keys';
import { fadeTo, text } from '../ui/screen';
import { uiPx } from '../ui/touch';
import { buildLabel } from '../ui/version-footer';
import { addBackdrop, fitCamera } from '../view/stage';

/** The button column (references/concept-art/flat/screen-menu.png): centre x, first row, step, size. */
/** The button column: primary height, list gap (8 rows with Quit still clear the stage's base). */
const COLUMN = { x: 157, y: 124, step: BUTTON_H.primary + GAP.list, w: 168, h: BUTTON_H.primary };
/** Brown of the secondary rows (screen-menu.png). */
const BROWN = 0x4a3b30;

interface Row {
	label: I18nKey;
	onSelect: () => void;
	disabled?: boolean;
	/** Accent colour (the main actions); the rest are neutral. */
	color?: number;
}

/**
 * Main menu, drawn from its flat concept: the boteco at dusk, the gold title, a column of
 * gold-rimmed wooden buttons on the left and the felt table with three cards on the right.
 */
export class MenuScene extends Phaser.Scene {
	private focus = 0;

	constructor() {
		super('Menu');
	}

	create(): void {
		playMusic(this, 'music.menu');
		playAmbience(this, null);
		this.scene.bringToTop();
		const cam = this.cameras.main;
		// Settings may switch the language while the menu waits paused under it: rebuild on return.
		const lang = getLang();
		onSceneEvent(this, 'resume', () => {
			if (getLang() !== lang) this.scene.restart();
		});
		cam.setBackgroundColor(PALETTE.bgNeutral);
		cam.fadeIn(160, 5, 5, 8);
		const status = this.game.registry.get('saveStatus') as
			| { recovered: boolean; unavailable: boolean }
			| undefined;
		const saved = parseRun(getSave(this).run);
		const rows: Row[] = [
			{
				label: 'menu.newRun',
				color: PALETTE.manilha,
				onSelect: () => fadeTo(this, 'Run', { fresh: true }),
			},
			{
				label: 'menu.continue',
				color: PALETTE.good,
				disabled: !saved,
				onSelect: () =>
					fadeTo(this, saved?.phase === 'table' ? 'Table' : 'Run', { run: true }),
			},
			{
				label: 'menu.quick',
				color: PALETTE.calm,
				onSelect: () => fadeTo(this, 'Table', { run: false }),
			},
			...(lanAvailable()
				? [{ label: 'menu.lan' as const, onSelect: () => fadeTo(this, 'Lan') }]
				: []),
			{ label: 'menu.tutorial', onSelect: () => fadeTo(this, 'Table', { tutorial: true }) },
			{ label: 'menu.almanac', onSelect: () => fadeTo(this, 'Almanac') },
			{ label: 'menu.rules', onSelect: () => fadeTo(this, 'Rules') },
			{ label: 'menu.settings', onSelect: () => this.openOverlay('Settings') },
			// Desktop app only (Steam): a browser tab cannot close itself.
			...(isElectron()
				? [
						{
							label: 'menu.quit' as const,
							color: PALETTE.truco,
							onSelect: () => window.close(),
						},
					]
				: []),
		];
		// A saved run: Enter resumes it.
		this.focus = saved ? 1 : 0;

		addBackdrop(this);
		this.add.image(439, 207, canvasTex(this, 'menu.fan', MENU_FAN.w, MENU_FAN.h, drawMenuFan));
		// Title: gold letters, a dark outline and a solid drop under them.
		this.add
			// Left edge on the button column below it.
			.text(COLUMN.x - COLUMN.w / 2, 67, t('game.title').toUpperCase(), {
				fontFamily: UI_FONT,
				fontSize: '74px',
				fontStyle: '700',
				color: toCss(PALETTE.manilha),
				shadow: {
					offsetX: -3,
					offsetY: 4,
					color: toCss(PALETTE.shadow),
					fill: true,
				},
			})
			.setOrigin(0, 0.5);
		// Nine rows (desktop with LAN and Quit) squeeze together to stay above the stage's base.
		const tight = rows.length > 8;
		const step = tight ? COLUMN.step - 2 : COLUMN.step;
		const top = tight ? COLUMN.y - 6 : COLUMN.y;
		const buttons = rows.map((row, i) =>
			new Button(
				this,
				t(row.label),
				() => {
					this.focus = i;
					row.onSelect();
				},
				{
					w: COLUMN.w,
					h: COLUMN.h,
					size: 12,
					color: row.color ?? BROWN,
					left: true,
					onHover: () => this.move(rows, i - this.focus, true),
				},
			)
				.setPosition(COLUMN.x, top + i * step)
				.setEnabled(!row.disabled),
		);
		this.redraw = () => {
			for (const [i, b] of buttons.entries()) b.setFocus(i === this.focus);
		};
		this.add
			.text(320, 345, buildLabel(__APP_VERSION__, import.meta.env.DEV, __BUILD_NAME__), {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(8)}px`,
				fontStyle: '700',
				color: toCss(PALETTE.textLight),
				shadow: TEXT_SHADOW,
			})
			.setOrigin(0.5, 1);
		this.add
			.text(
				470,
				350,
				status?.unavailable
					? t('menu.saveUnavailable')
					: status?.recovered
						? t('menu.saveRecovered')
						: '',
				text(8, PALETTE.manilha),
			)
			.setOrigin(0.5, 1);
		const kb = this.input.keyboard;
		const on = (keys: string[], fn: () => void) => {
			for (const k of keys) onKey(kb, `keydown-${k}`, fn);
		};
		on(['UP', 'W'], () => this.move(rows, -1));
		on(['DOWN', 'S'], () => this.move(rows, 1));
		on(['ENTER', 'SPACE'], () => this.select(rows));
		this.redraw();
		trackZoom(this, cam, (view) => fitCamera(cam, view));
	}

	private redraw: () => void = () => {};

	/** Moves the focus `step` rows (skipping disabled ones; the mouse lands where it points). */
	private move(rows: Row[], step: number, exact = false): void {
		const n = rows.length;
		let i = this.focus;
		if (exact) i = (i + step + n) % n;
		else
			do i = (i + step + n) % n;
			while (rows[i]?.disabled && i !== this.focus);
		if (i === this.focus || rows[i]?.disabled) return;
		sfx(this, 'sfx.ui.move');
		this.focus = i;
		this.redraw();
	}

	private select(rows: Row[]): void {
		const row = rows[this.focus];
		if (!row || row.disabled) return;
		sfx(this, 'sfx.ui.confirm');
		row.onSelect();
	}

	private openOverlay(key: string): void {
		this.scene.pause();
		this.scene.launch(key, { returnTo: 'Menu' });
	}
}
