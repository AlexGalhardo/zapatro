import type { Settings } from '../logic/save';

/**
 * Accessibility options read by the render code (D-57). Updated from the settings on boot and
 * whenever Settings closes (applyComfort).
 */
export const comfort = {
	reduceFlashes: false,
	screenShake: true,
	fourColor: false,
	keyHints: false,
};

export function applyComfort(
	s: Pick<Settings, 'reduceFlashes' | 'screenShake' | 'fourColor' | 'keyHints'>,
): void {
	comfort.reduceFlashes = s.reduceFlashes;
	comfort.screenShake = s.screenShake;
	comfort.fourColor = s.fourColor;
	comfort.keyHints = s.keyHints;
}
