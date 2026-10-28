/**
 * UI font, loaded in main.ts before the game boots (Text objects rasterize once): Rubik, clean and
 * bold, readable at small sizes, latin-ext for PT-BR accents. Titles use the 700 weight.
 */
export const UI_FONT = '"Rubik", "Segoe UI", sans-serif';
export const TITLE_FONT = UI_FONT;
/**
 * Color emoji from the OS (Noto on Android WebView, Apple/Segoe on desktop). Rubik has no emoji
 * glyphs, so a signal must use this family or the canvas draws an empty box.
 */
export const EMOJI_FONT =
	'"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "SamsungColorEmoji", sans-serif';
/** Default weight for UI text (500 medium; titles and emphasis use 700). */
export const UI_WEIGHT = '500';
/**
 * Menu text scale: screens were laid out for a tiny font; Rubik at 1.3× reads well at every
 * resolution without reworking each layout.
 */
export const MENU_TEXT_SCALE = 1.3;

export const menuPx = (size: number): number => Math.round(size * MENU_TEXT_SCALE);

/** The flat drop shadow under text (a solid offset, no blur). */
export const TEXT_SHADOW = {
	offsetX: 0,
	offsetY: 1,
	color: 'rgba(0,0,0,0.55)',
	blur: 0,
	stroke: false,
	fill: true,
} as const;
