import { RESOLUTIONS, type ResolutionId } from '../data/display';

export interface RenderSize {
	/** Canvas backing size in device pixels. */
	width: number;
	height: number;
	/** CSS scale applied to the canvas so it fills the window. */
	cssScale: number;
}

/**
 * Canvas size for a window (CSS px) and device pixel ratio. Presets fix the height and keep
 * the window aspect; "auto" uses native device pixels.
 */
export function renderSize(
	windowW: number,
	windowH: number,
	dpr: number,
	preset: ResolutionId,
): RenderSize {
	const def = RESOLUTIONS.find((r) => r.id === preset) ?? RESOLUTIONS[0];
	const height = def.height > 0 ? def.height : Math.round(windowH * Math.max(1, dpr));
	const width = Math.round(height * (windowW / windowH));
	return { width, height, cssScale: windowH / height };
}
