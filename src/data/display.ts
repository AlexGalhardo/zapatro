/**
 * Render resolution presets (Settings → Resolution). The value is the render height; the
 * width follows the window aspect so ultrawide keeps filling the screen without bars.
 * "auto" renders at the display's native pixels (Retina/HiDPI included).
 */
export const RESOLUTIONS = [
	{ id: 'auto', height: 0 },
	{ id: 'sd', height: 480 },
	{ id: 'hd', height: 720 },
	{ id: 'fhd', height: 1080 },
	{ id: 'qhd', height: 1440 },
	{ id: '3k', height: 1620 },
	{ id: '4k', height: 2160 },
] as const;

export type ResolutionId = (typeof RESOLUTIONS)[number]['id'];
export const RESOLUTION_IDS = RESOLUTIONS.map((r) => r.id) as ResolutionId[];
