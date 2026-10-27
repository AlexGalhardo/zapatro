import { PAD_BUTTONS, padConnected } from '../core/gamepad';
import type { Action, KeyBindings } from '../data/keybinds';
import { keyLabel } from '../logic/keybinds';
import { comfort } from '../view/comfort';
import { touchUi } from './touch';

/** DualSense glyph of each pad button index (standard mapping, src/core/gamepad.ts). */
const PAD_GLYPH: Readonly<Record<number, string>> = {
	0: '✕',
	1: '◯',
	2: '□',
	3: '△',
	4: 'L1',
	5: 'R1',
	6: 'L2',
	7: 'R2',
	8: 'Create',
	9: 'Options',
};

/** What the hints should show right now: nothing on touch, pad glyphs or keyboard keys. */
export type HintMode = 'touch' | 'pad' | 'keys';

export function hintMode(): HintMode {
	if (touchUi.on) return 'touch';
	return padConnected() ? 'pad' : 'keys';
}

/**
 * Badge for a key code: its keyboard label, the pad button that sends it, or '' on touch and while
 * Settings > Show key hints is off (the default). The shortcut itself always works.
 */
export function keyHint(code: string): string {
	const mode = hintMode();
	if (mode === 'touch' || !comfort.keyHints || !code) return '';
	if (mode === 'keys') return keyLabel(code);
	const index = Object.entries(PAD_BUTTONS).find(([, c]) => c === code)?.[0];
	return index === undefined ? '' : (PAD_GLYPH[Number(index)] ?? '');
}

/** Badge for a rebindable table action (its first key that the current device can press). */
export function actionHint(keys: KeyBindings, action: Action): string {
	for (const code of keys[action]) {
		const hint = keyHint(code);
		if (hint) return hint;
	}
	return '';
}

/** The footer lines that list keys (Settings, Pause): touch keeps its own, keys follow the option. */
export const showHintLine = (): boolean => touchUi.on || comfort.keyHints;

/** Back / leave: Esc on the keyboard, ◯ on the pad. */
export const backHint = (): string => keyHint('Escape');
