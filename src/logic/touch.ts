import type { TouchMode } from './save';

/** Settings → touch controls: auto = only on touch devices. */
export function touchActive(mode: TouchMode, touchDevice: boolean): boolean {
	return mode === 'on' || (mode === 'auto' && touchDevice);
}

/** Smallest UI text on a touch screen (logical px): ~2 mm on the phones in the QA set. */
export const TOUCH_TEXT_MIN = 10;

/**
 * UI text size for the current mode (MOB1.2): on touch screens small text grows (×1.3, at least
 * TOUCH_TEXT_MIN) so it reads at arm's length on a 6.5" phone; titles and big numbers stay.
 */
export function touchPx(size: number, touch: boolean): number {
	if (!touch || size >= TOUCH_TEXT_MIN) return size;
	return Math.min(TOUCH_TEXT_MIN + 1, Math.max(TOUCH_TEXT_MIN, Math.round(size * 1.3)));
}

/** Touch targets (MOB1.2): menu rows at least this tall in logical px (~6 mm on a phone). */
export const TOUCH_ROW_MIN = 28;
