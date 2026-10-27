import { fitArt, type ViewSize } from '../logic/viewport';

/**
 * The shop painting as loaded (public/assets/gfx/bg/shop.webp, 1920×1080, made from the 1672×941
 * `shop.jpeg`) and the chalkboard's inner frame in those pixels.
 */
const SRC = { w: 1920, h: 1080 };
const SLATE = { x: 300, y: 138, w: 1310, h: 626 };

/**
 * Where the shop painting is drawn: scaled to cover the view, centred horizontally and, when it
 * is taller than the view (ultra-wide windows), shifted so the chalkboard's centre stays in the
 * middle of the screen instead of losing its top. The backdrop and the UI share this.
 */
export function shopImageRect(view: { width: number; height: number }): {
	scale: number;
	x: number;
	y: number;
} {
	const scale = Math.max(view.width / SRC.w, view.height / SRC.h);
	const x = (view.width - SRC.w * scale) / 2;
	const centred = view.height / 2 - (SLATE.y + SLATE.h / 2) * scale;
	// Never show past the painting's edges.
	const y = Math.min(0, Math.max(view.height - SRC.h * scale, centred));
	return { scale, x, y };
}

/**
 * The chalkboard's rectangle in stage px (the 640×360 space of a fitted screen), from the same
 * transform as the backdrop, so the shop UI sits inside it at any window shape.
 */
export function shopSlate(view: ViewSize): { x: number; y: number; w: number; h: number } {
	const { scale, x: ox, y: oy } = shopImageRect(view);
	const fit = fitArt(view);
	const toStage = (vx: number, vy: number): [number, number] => [
		320 + (vx - view.width / 2) / fit,
		180 + (vy - view.height / 2) / fit,
	];
	const [x0, y0] = toStage(ox + SLATE.x * scale, oy + SLATE.y * scale);
	const [x1, y1] = toStage(ox + (SLATE.x + SLATE.w) * scale, oy + (SLATE.y + SLATE.h) * scale);
	return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
