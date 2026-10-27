import type Phaser from 'phaser';
import { PALETTE, shade, toCss } from '../config/palette';
import { PANEL_LOOK, RADIUS, SHADOW } from '../config/ui';
import { menuPx, TEXT_SHADOW, TITLE_FONT } from './font';

/**
 * Panel with the buttons' depth (PANEL_LOOK): a rounded block over a solid and a soft shadow,
 * optionally with a darker header band.
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
	const fill = opts.fill ?? PALETTE.panel;
	const alpha = opts.alpha ?? 1;
	const L = PANEL_LOOK;
	if (drop) {
		g.fillStyle(PALETTE.shadow, L.softAlpha).fillRoundedRect(x, y + drop + L.soft, w, h, r);
		g.fillStyle(PALETTE.shadow, SHADOW.panelAlpha).fillRoundedRect(x, y + drop, w, h, r);
	}
	// The button look (PANEL_LOOK): base colour, a gradient over the straight middle (the rounded
	// ends keep the base, a step the eye does not catch), a top highlight and a thin dark border.
	g.fillStyle(fill, alpha).fillRoundedRect(x, y, w, h, r);
	if (h > 2 * r) {
		const top = shade(fill, L.light);
		const base = shade(fill, L.dark);
		g.fillGradientStyle(top, top, base, base, alpha).fillRect(x, y + r, w, h - 2 * r);
	}
	g.fillStyle(shade(fill, L.highlight), L.highlightAlpha * alpha).fillRect(
		x + r,
		y + 1,
		w - 2 * r,
		1,
	);
	g.lineStyle(1, shade(fill, L.border), L.borderAlpha * alpha).strokeRoundedRect(x, y, w, h, r);
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
