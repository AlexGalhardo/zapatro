/**
 * Synthetic keyboard (1.0): gamepad and touch controls press "keys" so every screen, menu and
 * the hero movement work unchanged — Phaser's keyboard and the window hotkeys both listen on
 * `window`. Phaser reads the legacy `keyCode`, which a constructed KeyboardEvent cannot set, so
 * it is defined on the event.
 */

const KEYS: Record<string, [key: string, keyCode: number]> = {
	ArrowUp: ['ArrowUp', 38],
	ArrowDown: ['ArrowDown', 40],
	ArrowLeft: ['ArrowLeft', 37],
	ArrowRight: ['ArrowRight', 39],
	Enter: ['Enter', 13],
	Escape: ['Escape', 27],
	Tab: ['Tab', 9],
	KeyX: ['x', 88],
	KeyC: ['c', 67],
	KeyR: ['r', 82],
	KeyN: ['n', 78],
	KeyL: ['l', 76],
};

export type VirtualKey = keyof typeof KEYS;

function fire(type: 'keydown' | 'keyup', code: string, repeat = false): void {
	const k = KEYS[code];
	if (!k) return;
	const e = new KeyboardEvent(type, {
		code,
		key: k[0],
		repeat,
		bubbles: true,
		cancelable: true,
	});
	Object.defineProperty(e, 'keyCode', { get: () => k[1] });
	Object.defineProperty(e, 'which', { get: () => k[1] });
	window.dispatchEvent(e);
}

/** Keys each source (gamepad, touch) is holding right now. */
const held = new Map<string, Set<string>>();

const heldByOthers = (source: string, code: string): boolean =>
	[...held.entries()].some(([s, codes]) => s !== source && codes.has(code));

/** Replaces the keys `source` holds: new ones go down, released ones go up. */
export function setHeld(source: string, codes: readonly string[]): void {
	const before = held.get(source) ?? new Set<string>();
	const now = new Set(codes);
	for (const c of now) if (!before.has(c) && !heldByOthers(source, c)) fire('keydown', c);
	for (const c of before) if (!now.has(c) && !heldByOthers(source, c)) fire('keyup', c);
	held.set(source, now);
}

/** Auto-repeat of a held key (menu navigation while a direction stays pressed). */
export function repeatKey(code: string): void {
	fire('keydown', code, true);
}

/** A press and release (buttons). */
export function tapKey(code: string): void {
	fire('keydown', code);
	setTimeout(() => fire('keyup', code), 40);
}
