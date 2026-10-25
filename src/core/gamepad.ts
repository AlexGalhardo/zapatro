import type Phaser from 'phaser';
import type { SaveData } from '../logic/save';
import { touchUi } from '../ui/touch';
import { vibrate } from './platform';
import { repeatKey, setHeld, tapKey } from './virtual-keys';

/**
 * Gamepad support (1.0, tuned for the PS5 DualSense in the browser "standard" mapping; Xbox pads
 * map the same way). Polls the Gamepad API every frame and presses virtual keys, so menus, shop,
 * skill tree, cards and movement need no gamepad code of their own.
 *
 *   D-pad / left stick → arrows (menus, buttons, the card in focus) · ✕ Enter (play / pick)
 *   ◯ Esc (back, pause) · □ S (signal) · △ T (truco) · L1 E (face down)
 *   L2 C (run) · R2 A (accept) · Options Esc (pause) · Create Tab (animation speed)
 * The table keys are the default bindings (src/data/keybinds.ts).
 */
export const PAD_BUTTONS: Readonly<Record<number, string>> = {
	0: 'Enter',
	1: 'Escape',
	2: 'KeyS',
	3: 'KeyT',
	4: 'KeyE',
	6: 'KeyC',
	7: 'KeyA',
	8: 'Tab',
	9: 'Escape',
};

/** Stick dead zone by setting (fraction of the full tilt). */
export const DEADZONES = { low: 0.2, normal: 0.35, high: 0.5 } as const;
export type Deadzone = keyof typeof DEADZONES;

const REPEAT_DELAY = 380;
const REPEAT_EVERY = 130;

let connected: Gamepad | null = null;

export function padConnected(): boolean {
	return connected !== null;
}

/** Directions held by the D-pad or the left stick (8-way). */
export function padDirections(pad: Gamepad, deadzone: number): string[] {
	const b = (i: number) => pad.buttons[i]?.pressed ?? false;
	const x = pad.axes[0] ?? 0;
	const y = pad.axes[1] ?? 0;
	const out: string[] = [];
	if (b(12) || y < -deadzone) out.push('ArrowUp');
	else if (b(13) || y > deadzone) out.push('ArrowDown');
	if (b(14) || x < -deadzone) out.push('ArrowLeft');
	else if (b(15) || x > deadzone) out.push('ArrowRight');
	return out;
}

export function installGamepad(game: Phaser.Game): void {
	let prev: boolean[] = [];
	let dirs: string[] = [];
	let heldSince = 0;
	let lastRepeat = 0;
	const loop = (now: number) => {
		requestAnimationFrame(loop);
		const pad = navigator.getGamepads?.().find((p): p is Gamepad => !!p?.connected) ?? null;
		connected = pad;
		if (!pad) {
			if (dirs.length) setHeld('pad', []);
			dirs = [];
			prev = [];
			return;
		}
		const save = game.registry.get('save') as SaveData | undefined;
		const dz = DEADZONES[save?.settings.padDeadzone ?? 'normal'];
		const next = padDirections(pad, dz);
		if (next.join() !== dirs.join()) {
			setHeld('pad', next);
			heldSince = now;
			lastRepeat = now;
		} else if (
			next.length &&
			now - heldSince > REPEAT_DELAY &&
			now - lastRepeat > REPEAT_EVERY
		) {
			// Menus move one row per press: repeat while the direction stays held.
			for (const d of next) repeatKey(d);
			lastRepeat = now;
		}
		dirs = next;
		pad.buttons.forEach((btn, i) => {
			const code = PAD_BUTTONS[i];
			if (code && btn.pressed && !prev[i]) tapKey(code);
		});
		prev = pad.buttons.map((btn) => btn.pressed);
	};
	requestAnimationFrame(loop);
}

/** Rumble on the connected pad (Settings → vibration); strength 0–1. */
export function rumble(game: Phaser.Game, ms: number, strong: number, weak = strong): void {
	const save = game.registry.get('save') as SaveData | undefined;
	if (save?.settings.padVibration === false) return;
	// Phones vibrate too (MOB4.2): shorter, so a hit stays a tick rather than a buzz.
	if (touchUi.on) vibrate(Math.round(Math.min(ms, 200) * Math.max(strong, weak)));
	if (!connected) return;
	const act = (
		connected as Gamepad & {
			vibrationActuator?: { playEffect(t: string, p: object): Promise<unknown> };
		}
	).vibrationActuator;
	act?.playEffect('dual-rumble', {
		duration: ms,
		strongMagnitude: strong,
		weakMagnitude: weak,
	}).catch(() => undefined);
}
