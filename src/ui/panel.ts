import type Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { RADIUS, SHADOW } from '../config/ui';
import { menuPx, TEXT_SHADOW, TITLE_FONT } from './font';

/**
 * Flat panel: a rounded block over a solid drop shadow, optionally with a darker header band.
 * `fill` changes the colour (coloured boards, the HUD plates).
 */
export function drawPanel(
	g: Phaser.GameObjects.Graphics,
	x: number,
	y: number,
	w: number,
	h: number,
	opts: { header?: number; fill?: number; radius?: number; shadow?: number; alpha?: number } = {},
): void {
	const r = Math.min(opts.radius ?? RADIUS.panel, w / 2, h / 2);
	const drop = opts.shadow ?? SHADOW.panel;
	if (drop) g.fillStyle(PALETTE.shadow, SHADOW.panelAlpha).fillRoundedRect(x, y + drop, w, h, r);
	g.fillStyle(opts.fill ?? PALETTE.panel, opts.alpha ?? 1).fillRoundedRect(x, y, w, h, r);
	if (opts.header)
		g.fillStyle(PALETTE.panelDark, 1).fillRoundedRect(x, y, w, opts.header, {
			tl: r,
			tr: r,
			bl: 0,
			br: 0,
		});
}

/** A panel drawn into its own Graphics (one-liners for scenes). */
export function addPanel(
	scene: Phaser.Scene,
	x: number,
	y: number,
	w: number,
	h: number,
	opts: Parameters<typeof drawPanel>[5] = {},
): Phaser.GameObjects.Graphics {
	const g = scene.add.graphics();
	drawPanel(g, x, y, w, h, opts);
	return g;
}

/** Panel header text style. */
export const panelTitle = (size: number): Phaser.Types.GameObjects.Text.TextStyle => ({
	fontFamily: TITLE_FONT,
	fontSize: `${menuPx(size)}px`,
	fontStyle: '700',
	color: toCss(PALETTE.panelBorder),
	shadow: TEXT_SHADOW,
});
