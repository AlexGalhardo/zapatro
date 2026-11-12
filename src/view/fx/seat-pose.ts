import { BREATH, type Reaction } from '../../config/feel-seats';

export interface Offset {
	dx: number;
	dy: number;
	/** Degrees. */
	rot: number;
	/** Share added to the card's scale on each axis. */
	sx: number;
	sy: number;
}

const ZERO: Offset = { dx: 0, dy: 0, rot: 0, sx: 0, sy: 0 };
const bell = (p: number): number => Math.sin(Math.PI * p);
const fade = (p: number): number => 1 - p;

/** Pose offset of a reaction at progress `p` (0 to 1) and strength `amp`; every one ends at rest. */
export function reactionOffset(kind: Reaction, p: number, amp = 1): Offset {
	const b = bell(p);
	switch (kind) {
		case 'bounce':
			return {
				...ZERO,
				dy: -6 * amp * Math.abs(Math.sin(Math.PI * 1.5 * p)) * fade(p),
				sy: 0.03 * amp * b,
			};
		case 'shake':
			return {
				...ZERO,
				dx: 3 * amp * Math.sin(Math.PI * 8 * p) * fade(p),
				rot: 2 * amp * Math.sin(Math.PI * 8 * p) * fade(p),
			};
		case 'sink':
			return { ...ZERO, dy: 4 * amp * b, sy: -0.05 * amp * b, rot: -1.5 * amp * b };
		case 'lean':
			return { ...ZERO, rot: 5 * amp * b, dx: 2 * amp * b };
		case 'tilt':
			return { ...ZERO, rot: -4 * amp * b, dy: -1 * amp * b };
		case 'hop':
			return { ...ZERO, dy: -4 * amp * Math.sqrt(b), sx: 0.04 * amp * b, sy: 0.04 * amp * b };
		case 'wobble':
			return { ...ZERO, rot: 5 * amp * Math.sin(Math.PI * 4 * p) * fade(p) };
		case 'rise':
			return { ...ZERO, dy: -3 * amp * b, sy: 0.02 * amp * b };
		case 'settle':
			return { ...ZERO, sy: -0.02 * amp * b };
	}
}

/** The resting breath at time `t` (ms): a slow swell of the card; the awake seat breathes bigger and faster. */
export function breathOffset(t: number, seat: number, awake: boolean): Offset {
	const b = awake ? BREATH.awake : BREATH.asleep;
	const k = Math.sin((2 * Math.PI * t) / b.period + seat * BREATH.phase);
	return {
		...ZERO,
		sy: b.amp * k,
		sx: (b.amp * k) / 2,
		dy: awake ? -BREATH.awakeLift * Math.max(0, k) : 0,
	};
}
