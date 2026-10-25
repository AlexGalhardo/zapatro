import { LOGICAL_H, LOGICAL_H_MAX, LOGICAL_H_MIN } from '../config/constants';

/** Render pixels a height may miss LOGICAL_H × zoom by and still get that zoom. */
const ZOOM_SLACK = 8;

export interface ViewSize {
	zoom: number;
	/** Visible logical size (variable width: ultrawide shows more world). */
	width: number;
	height: number;
}

/**
 * Integer zoom for a render height. `fixed` 0 = auto (largest zoom that keeps LOGICAL_H visible);
 * 1–4 = the player's choice (Settings → Zoom), clamped so the visible height stays between
 * LOGICAL_H_MIN and LOGICAL_H_MAX logical pixels (HUD and menus stay usable).
 */
export function computeZoom(_width: number, height: number, fixed = 0): number {
	// Phones report fractional CSS heights that round a pixel or two short of 720/1080 (Galaxy
	// A07: 719, S20 FE: 1079): without the slack they drop a zoom level and the UI halves.
	const auto = Math.max(1, Math.floor((height + ZOOM_SLACK) / LOGICAL_H));
	if (fixed <= 0) return auto;
	const most = Math.max(1, Math.floor(height / LOGICAL_H_MIN));
	const least = Math.max(1, Math.ceil(height / LOGICAL_H_MAX));
	return Math.min(most, Math.max(least, fixed));
}

export function computeView(width: number, height: number, fixed = 0): ViewSize {
	const zoom = computeZoom(width, height, fixed);
	return { zoom, width: width / zoom, height: height / zoom };
}

/**
 * Scale that fits the 640×360 stage of a fitted screen in the view (exactly 1 at 16:9): nothing of the art
 * is cropped; the extra width (phones, ultra-wide) or height shows the backdrop.
 */
export function fitArt(view: { width: number; height: number }): number {
	return Math.min(view.width / 640, view.height / 360);
}
