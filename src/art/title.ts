import type Phaser from 'phaser';
import { PALETTE, shade, toCss } from '../config/palette';
import { TITLE_FONT } from '../ui/font';
import { canvasTex } from './flat';

/**
 * How a screen title is built, as fractions of its font size: the dark outline, the solid
 * extrusion under it (like the buttons' solid shadow) and the soft shadow that lands under that.
 */
const TITLE_LOOK = { stroke: 0.11, depth: 0.12, blur: 0.3, light: 0.3, dark: 0.22 } as const;

/** Outline, extrusion, blur and the padding around the glyphs of a title of `size` px. */
export function titleMetrics(size: number): {
	stroke: number;
	depth: number;
	blur: number;
	pad: number;
} {
	const stroke = Math.max(2, size * TITLE_LOOK.stroke);
	const blur = size * TITLE_LOOK.blur;
	return {
		stroke,
		depth: Math.max(2, Math.round(size * TITLE_LOOK.depth)),
		blur,
		pad: Math.ceil(stroke + blur / 2),
	};
}

/**
 * A screen title as a texture: a vertical gradient from `color` (lighter top, darker base, the
 * buttons' shading), a thick dark outline, a solid extrusion a few px down and a soft shadow
 * under it. Drawn on a canvas at the screen's zoom like the rest of the art, so it stays sharp.
 * Returns the texture key; its logical size is the frame's.
 */
export function titleTex(
	scene: Phaser.Scene,
	text: string,
	size: number,
	color: number = PALETTE.manilha,
): string {
	const probe = document.createElement('canvas').getContext('2d');
	if (!probe) return '__DEFAULT';
	const font = `700 ${size}px ${TITLE_FONT}`;
	probe.font = font;
	const { stroke, depth, blur, pad } = titleMetrics(size);
	const w = Math.ceil(probe.measureText(text).width + 2 * pad);
	const h = Math.ceil(size * 1.3 + 2 * pad + depth);
	return canvasTex(scene, `title.${size}.${color}.${text}`, w, h, (ctx) => {
		ctx.font = font;
		ctx.textBaseline = 'middle';
		ctx.lineJoin = 'round';
		ctx.lineWidth = stroke;
		const x = pad;
		const y = pad + (size * 1.3) / 2;
		const ink = toCss(PALETTE.shadow);
		// The extrusion: the outlined glyphs stacked down, the lowest one casting the soft shadow.
		for (let d = depth; d >= 1; d--) {
			ctx.save();
			if (d === depth) {
				ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
				ctx.shadowBlur = blur;
				ctx.shadowOffsetY = blur / 3;
			}
			ctx.strokeStyle = ink;
			ctx.fillStyle = toCss(shade(color, -0.55));
			ctx.strokeText(text, x, y + d);
			ctx.fillText(text, x, y + d);
			ctx.restore();
		}
		ctx.strokeStyle = ink;
		ctx.strokeText(text, x, y);
		const g = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
		g.addColorStop(0, toCss(shade(color, TITLE_LOOK.light)));
		g.addColorStop(1, toCss(shade(color, -TITLE_LOOK.dark)));
		ctx.fillStyle = g;
		ctx.fillText(text, x, y);
	});
}
