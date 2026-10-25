import {
	ACTIONS,
	type Action,
	DEFAULT_KEYS,
	type KeyBindings,
	RESERVED_KEYS,
} from '../data/keybinds';

export function defaultKeys(): KeyBindings {
	return Object.fromEntries(ACTIONS.map((a) => [a, [...DEFAULT_KEYS[a]]])) as KeyBindings;
}

/** Action bound to a physical key, or null. */
export function actionFor(keys: KeyBindings, code: string): Action | null {
	if (!code) return null;
	for (const a of ACTIONS) if (keys[a].includes(code)) return a;
	return null;
}

export type RebindResult = { ok: true; moved: Action | null } | { ok: false; reason: 'reserved' };

/**
 * Binds `code` to `action`'s slot. A key can only do one thing: if another action used it, that
 * slot is cleared (and reported as `moved`, so the UI can say what lost the key).
 */
export function rebind(keys: KeyBindings, action: Action, slot: 0 | 1, code: string): RebindResult {
	if (RESERVED_KEYS.has(code)) return { ok: false, reason: 'reserved' };
	let moved: Action | null = null;
	for (const a of ACTIONS)
		keys[a].forEach((c, i) => {
			if (c === code && !(a === action && i === slot)) {
				keys[a][i] = '';
				if (a !== action) moved = a;
			}
		});
	keys[action][slot] = code;
	return { ok: true, moved };
}

/** Parses stored bindings, keeping defaults for anything missing and dropping duplicates. */
export function parseKeys(raw: unknown): KeyBindings {
	const keys = defaultKeys();
	if (typeof raw !== 'object' || raw === null) return keys;
	const r = raw as Record<string, unknown>;
	const used = new Set<string>();
	for (const a of ACTIONS) {
		const v = r[a];
		if (!Array.isArray(v)) continue;
		keys[a] = [0, 1].map((i) => {
			const c = v[i];
			if (typeof c !== 'string' || !c || RESERVED_KEYS.has(c) || used.has(c)) return '';
			used.add(c);
			return c;
		}) as [string, string];
	}
	// Defaults of actions missing from the stored data count as used too.
	for (const a of ACTIONS) if (!Array.isArray(r[a])) for (const c of keys[a]) if (c) used.add(c);
	// An action left with no key at all gets its default back (if still free).
	for (const a of ACTIONS)
		if (!keys[a][0] && !keys[a][1]) {
			const d = DEFAULT_KEYS[a][0];
			if (!used.has(d)) {
				keys[a][0] = d;
				used.add(d);
			}
		}
	return keys;
}

/** Short label of a key code for the UI ("KeyW" → "W", "ArrowUp" → "↑"). */
export function keyLabel(code: string): string {
	if (!code) return '—';
	if (code.startsWith('Key')) return code.slice(3);
	if (code.startsWith('Digit')) return code.slice(5);
	const arrows: Record<string, string> = {
		ArrowUp: '↑',
		ArrowDown: '↓',
		ArrowLeft: '←',
		ArrowRight: '→',
	};
	if (arrows[code]) return arrows[code];
	if (code === 'Escape') return 'Esc';
	if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
	return code.replace(/(Left|Right)$/, '');
}
