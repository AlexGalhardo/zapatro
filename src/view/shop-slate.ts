import { fitArt, type ViewSize } from '../logic/viewport';

/** The chalkboard of the shop painting (art-src/gta/shop.jpeg, 1672×941), in its own pixels. */
const SRC = { w: 1672, h: 941 };
const SLATE = { x: 385, y: 170, w: 890, h: 450 };

/**
 * The chalkboard's rectangle in stage px (the 640×360 space of a fitted screen), following the
 * backdrop's cover fit (src/scenes/BackdropScene.ts), so the shop UI sits inside it at any window
 * shape: the painting is scaled to cover the view and centred, then the view is fitted to the stage.
 */
export function shopSlate(view: ViewSize): { x: number; y: number; w: number; h: number } {
	const cover = Math.max(view.width / SRC.w, view.height / SRC.h);
	const fit = fitArt(view);
	const toStage = (vx: number, vy: number): [number, number] => [
		320 + (vx - view.width / 2) / fit,
		180 + (vy - view.height / 2) / fit,
	];
	const ox = (view.width - SRC.w * cover) / 2;
	const oy = (view.height - SRC.h * cover) / 2;
	const [x0, y0] = toStage(ox + SLATE.x * cover, oy + SLATE.y * cover);
	const [x1, y1] = toStage(ox + (SLATE.x + SLATE.w) * cover, oy + (SLATE.y + SLATE.h) * cover);
	return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
