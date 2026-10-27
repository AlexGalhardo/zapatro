import type Phaser from 'phaser';
import { shade } from '../config/palette';

/**
 * How text gets its depth, by font size (logical px): a solid shadow one step down in a dark
 * tone of the text's own colour, a light blur, a thin dark outline on large light text, and a
 * soft vertical gradient on the big light numbers. Dark text on light buttons gets a faint light
 * shadow instead (engraved). One place for the numbers, like TITLE_LOOK.
 */
export const TEXT_LOOK = {
	/** Sizes: from here up the outline (and from `gradient` the gradient); up to `tiny` only a blur. */
	large: 10,
	gradient: 12,
	tiny: 6,
	/** Shadow offset and blur by tier; outline width on large light text. */
	offset: 1,
	blur: { large: 2, mid: 1, tiny: 1.5 },
	outline: 1,
	/** How much darker the shadow is than the text, and the gradient's lift and drop. */
	shadowShade: -0.75,
	lift: 0.25,
	drop: -0.15,
} as const;

const parseCss = (css: string): number | null => {
	const m = /^#([0-9a-f]{6})$/i.exec(css.trim());
	return m?.[1] ? Number.parseInt(m[1], 16) : null;
};

const light = (c: number): boolean =>
	0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255) > 128;

const rgba = (c: number, a: number): string =>
	`rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

/**
 * Gives a new Text its depth from its size and colour. Text that was made without a shadow on
 * purpose (speech bubbles, tags with a background) is left alone, and so is a gradient fill.
 */
export function applyTextDepth(text: Phaser.GameObjects.Text): void {
	const st = text.style;
	if (!st.shadowFill || st.backgroundColor) return;
	const color = parseCss(String(st.color));
	if (color === null) return;
	const size = Number.parseFloat(String(st.fontSize)) || 0;
	const L = TEXT_LOOK;
	if (!light(color)) {
		// Dark ink on a light button: a faint light edge underneath, as if pressed into it.
		text.setShadow(0, L.offset, 'rgba(255,255,255,0.28)', 0, false, true);
		return;
	}
	const ink = rgba(shade(color, L.shadowShade), 0.85);
	if (size <= L.tiny) {
		text.setShadow(0, 0, 'rgba(0,0,0,0.55)', L.blur.tiny, false, true);
		return;
	}
	const big = size >= L.large;
	text.setShadow(0, L.offset, ink, big ? L.blur.large : L.blur.mid, big, true);
	if (big) text.setStroke(rgba(shade(color, L.shadowShade), 0.6), L.outline);
	if (size >= L.gradient) {
		const g = text.context.createLinearGradient(0, 0, 0, text.height || size);
		g.addColorStop(0, `#${shade(color, L.lift).toString(16).padStart(6, '0')}`);
		g.addColorStop(1, `#${shade(color, L.drop).toString(16).padStart(6, '0')}`);
		text.setFill(g);
	}
}
