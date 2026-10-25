/**
 * Table actions that can be rebound (Settings → Controls). Values are `KeyboardEvent.code`
 * (physical key). Two slots per action; '' = empty. Menus keep their fixed navigation
 * (arrows/WASD, Enter, Esc).
 */
export const ACTIONS = [
	'card1',
	'card2',
	'card3',
	'truco',
	'accept',
	'fold',
	'signal',
	'cover',
	'pause',
	'speed',
	'mute',
	'fullscreen',
] as const;
export type Action = (typeof ACTIONS)[number];
export type KeyBindings = Record<Action, [string, string]>;

export const DEFAULT_KEYS: KeyBindings = {
	card1: ['Digit1', 'Numpad1'],
	card2: ['Digit2', 'Numpad2'],
	card3: ['Digit3', 'Numpad3'],
	truco: ['KeyT', ''],
	accept: ['KeyA', ''],
	fold: ['KeyC', ''],
	signal: ['KeyS', ''],
	cover: ['KeyE', ''],
	pause: ['Escape', 'KeyP'],
	speed: ['Tab', ''],
	mute: ['KeyM', ''],
	fullscreen: ['F11', ''],
};

/** Keys that can never be bound (browser/system shortcuts or reserved for the debug bot). */
export const RESERVED_KEYS = new Set(['F5', 'F8', 'F12', 'MetaLeft', 'MetaRight']);
