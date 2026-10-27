import { PALETTE, toCss } from '../config/palette';
import { UI_FONT } from '../ui/font';
import { canvasTex } from './flat';

const WEIGHT = 700;
const SIZE = 74;
/** Room around the glyphs for the outline and the solid drop shadow. */
const PAD = 8;
const DROP = [3, 4] as const;

/**
 * The game's title as an impact lettering: a sunset gradient (yellow, orange, pink) under a thick
 * dark outline with a solid drop shadow, drawn on a canvas so it fits `maxW` whatever the language.
 * Returns the texture key; its logical size is the texture frame's.
 */
export function titleTex(scene: Phaser.Scene, text: string, maxW: number): string {
	const probe = document.createElement('canvas').getContext('2d');
	if (!probe) return '';
	probe.font = `${WEIGHT} ${SIZE}px ${UI_FONT}`;
	const natural = probe.measureText(text).width + PAD * 2 + DROP[0];
	const size = Math.floor(SIZE * Math.min(1, maxW / natural));
	probe.font = `${WEIGHT} ${size}px ${UI_FONT}`;
	const w = Math.ceil(probe.measureText(text).width + PAD * 2 + DROP[0]);
	const h = Math.ceil(size * 1.25 + PAD * 2 + DROP[1]);
	return canvasTex(scene, `title.${text}.${size}`, w, h, (ctx) => {
		ctx.font = `${WEIGHT} ${size}px ${UI_FONT}`;
		ctx.textBaseline = 'middle';
		ctx.lineJoin = 'round';
		ctx.lineWidth = size * 0.16;
		const [x, y] = [PAD, (h - DROP[1]) / 2];
		ctx.strokeStyle = toCss(PALETTE.shadow);
		ctx.strokeText(text, x + DROP[0], y + DROP[1]);
		ctx.strokeStyle = '#2a1220';
		ctx.strokeText(text, x, y);
		const g = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
		g.addColorStop(0, '#ffe45c');
		g.addColorStop(0.5, '#ff9a2e');
		g.addColorStop(1, '#ff4f87');
		ctx.fillStyle = g;
		ctx.fillText(text, x, y);
	});
}
