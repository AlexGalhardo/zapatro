import type { Expression } from '../data/characters';
import type { Stamp } from '../view/fx/fx-tex';

/**
 * Game feel of the seats' characters (docs/game-feel.md §6). The painted cards have one image per
 * character, so a reaction is motion, a steady colour wash and an emotion stamp, never a new face.
 * Times are ms at 1×.
 */

export const REACTIONS = [
	'settle',
	'bounce',
	'shake',
	'sink',
	'lean',
	'tilt',
	'hop',
	'wobble',
	'rise',
] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface ReactionFeel {
	ms: number;
	/** Strength of the motion (1 = the reference size in `reactionOffset`). */
	amp: number;
	stamp: Stamp | null;
	/** Colour the portrait is washed towards while it reacts (null: none). */
	wash: number | null;
}

export const REACTION_FEEL: Record<Reaction, ReactionFeel> = {
	settle: { ms: 420, amp: 1, stamp: null, wash: null },
	bounce: { ms: 700, amp: 1, stamp: 'star', wash: 0xfff0c0 },
	shake: { ms: 700, amp: 1, stamp: 'anger', wash: 0xffb4a4 },
	sink: { ms: 800, amp: 1, stamp: 'drop', wash: 0xb8c8ff },
	lean: { ms: 650, amp: 1, stamp: 'heart', wash: null },
	tilt: { ms: 650, amp: 1, stamp: 'question', wash: null },
	hop: { ms: 520, amp: 1, stamp: 'bang', wash: null },
	wobble: { ms: 700, amp: 1, stamp: 'star', wash: null },
	rise: { ms: 650, amp: 1, stamp: 'dots', wash: null },
};

/** Every `Expression` the table can ask for, and the reaction it plays. */
export const REACTION_OF: Record<Expression, Reaction> = {
	neutral: 'settle',
	happy: 'bounce',
	angry: 'shake',
	sweat: 'sink',
	wink: 'lean',
	eyebrow: 'tilt',
	mouth: 'hop',
	tongue: 'wobble',
	lip: 'sink',
	up: 'rise',
};

/** A big moment (a queda, the end of a hand) reacts this much harder and longer. */
export const STRONG = { amp: 1.5, ms: 1.3 } as const;

/** The stamp: its size on the stage, when it has popped in and when it starts to fade (shares of the reaction). */
export const STAMP = { scale: 1, popIn: 0.18, fadeFrom: 0.72 } as const;

/** Resting breath: share the card grows by, and its period in ms, for a seat waiting and for the seat whose turn it is. */
export const BREATH = {
	asleep: { amp: 0.008, period: 3600 },
	awake: { amp: 0.016, period: 1700 },
	/** How far the awake card floats up (px at the top of the breath). */
	awakeLift: 0.8,
	/** Phase gap between seats, so they do not breathe together. */
	phase: 1.3,
} as const;
