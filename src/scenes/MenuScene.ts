import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
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
import { MenuBackdrop, type MenuFrame } from '../view/menu-backdrop';
import { fitCamera } from '../view/stage';
import { setBackdrop } from './BackdropScene';

/** Brown of the secondary rows (screen-menu.png). */
const BROWN = 0x4a3b30;

interface Row {
	label: I18nKey;
	/** Icon (`icon.<name>`) at the left of the label. */
	icon: string;
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
		setBackdrop(this, 'main');
		const cam = this.cameras.main;
		// Settings may switch the language while the menu waits paused under it: rebuild on return.
		const lang = getLang();
		onSceneEvent(this, 'resume', () => {
			if (getLang() !== lang) this.scene.restart();
		});
		cam.fadeIn(160, 5, 5, 8);
		const status = this.game.registry.get('saveStatus') as
			| { recovered: boolean; unavailable: boolean }
			| undefined;
		const saved = parseRun(getSave(this).run);
		const rows: Row[] = [
			{
				label: 'menu.newRun',
				icon: 'next',
				color: PALETTE.manilha,
				onSelect: () => fadeTo(this, 'Run', { fresh: true }),
			},
			{
				label: 'menu.continue',
				icon: 'refresh',
				color: PALETTE.good,
				disabled: !saved,
				onSelect: () =>
					fadeTo(this, saved?.phase === 'table' ? 'Table' : 'Run', { run: true }),
			},
			{
				label: 'menu.quick',
				icon: 'cards',
				color: PALETTE.calm,
				onSelect: () => fadeTo(this, 'Table', { run: false }),
			},
			...(lanAvailable()
				? [
						{
							label: 'menu.lan' as const,
							icon: 'people',
							onSelect: () => fadeTo(this, 'Lan'),
						},
					]
				: []),
			{
				label: 'menu.tutorial',
				icon: 'hand',
				onSelect: () => fadeTo(this, 'Table', { tutorial: true }),
			},
			{ label: 'menu.almanac', icon: 'book', onSelect: () => fadeTo(this, 'Almanac') },
			{ label: 'menu.rules', icon: 'list', onSelect: () => fadeTo(this, 'Rules') },
			{ label: 'menu.settings', icon: 'gear', onSelect: () => this.openOverlay('Settings') },
			// Desktop app only (Steam): a browser tab cannot close itself.
			...(isElectron()
				? [
						{
							label: 'menu.quit' as const,
							icon: 'door',
							color: PALETTE.truco,
							onSelect: () => window.close(),
						},
					]
				: []),
		];
		// A saved run: Enter resumes it.
		this.focus = saved ? 1 : 0;

		// Logo and buttons are drawn over the ones painted into the backdrop, in the same place.
		let layer: Phaser.GameObjects.GameObject[] = [];
		let buttons: Button[] = [];
		const build = (f: MenuFrame): void => {
			for (const o of layer) o.destroy();
			const { col } = f.geo;
			const h = col.h * f.k;
			// The column keeps the painted step, tightening only if the last row would end under the margin.
			const first = f.y + col.y0 * f.k;
			const step = Math.min(
				col.step * f.k,
				rows.length > 1 ? (f.bottom - first - h) / (rows.length - 1) : Infinity,
			);
			buttons = rows.map((row, i) =>
				new Button(
					this,
					t(row.label),
					() => {
						this.focus = i;
						row.onSelect();
					},
					{
						w: col.w * f.k,
						h,
						size: Math.max(7, Math.round(h * 0.48)),
						color: row.color ?? BROWN,
						// Room for the icon (about 65% of the button's height) and the same gap everywhere.
						left: Math.round(h * 1.05),
						icon: row.icon,
						iconScale: (h * 0.65) / 24,
						onHover: () => this.move(rows, i - this.focus, true),
					},
				)
					.setPosition(f.x + (col.x + col.w / 2) * f.k, first + i * step + h / 2)
					.setEnabled(!row.disabled),
			);
			layer = [...buttons];
			version.setPosition(f.art.x + f.art.width - 6, f.art.y + f.art.height - 4);
			this.redraw();
		};
		const backdrop = new MenuBackdrop(this, build);
		onKey(this.input.keyboard, 'keydown-LEFT', () => backdrop.step(-1));
		onKey(this.input.keyboard, 'keydown-RIGHT', () => backdrop.step(1));
		this.redraw = () => {
			for (const [i, b] of buttons.entries()) b.setFocus(i === this.focus);
		};
		const version = this.add
			.text(0, 0, buildLabel(__APP_VERSION__, import.meta.env.DEV, __BUILD_NAME__), {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(8)}px`,
				fontStyle: '700',
				color: toCss(PALETTE.textLight),
				shadow: TEXT_SHADOW,
			})
			.setOrigin(1, 1);
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
		trackZoom(this, cam, (view) => {
			fitCamera(cam, view);
			backdrop.layout({
				x: 320 - cam.width / cam.zoom / 2,
				y: 180 - cam.height / cam.zoom / 2,
				width: cam.width / cam.zoom,
				height: cam.height / cam.zoom,
			});
		});
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
