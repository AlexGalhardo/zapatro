import { TABLE_TIMING } from '../data/characters';

/**
 * Game feel of the played cards (docs/game-feel.md §5). Times are ms at 1×; the table divides
 * them by the animation speed. The awaited ones (`travel`, `zapBeat`, `gather` + `sweep`) never
 * exceed what the table waited before the effects existed (plus the ZAP's beat); everything else
 * runs on top of the game.
 */

/** Weight of a played card, light to heavy. */
export const CARD_TIERS = ['down', 'common', 'strong', 'manilha', 'zap'] as const;
export type CardTier = (typeof CARD_TIERS)[number];

export interface TierFeel {
	/** Height of the arc over the straight line (logical px) and the card's growth at its top. */
	arc: number;
	lift: number;
	/** Degrees the card leans in flight. */
	tilt: number;
	/** Landing squash (share of the card's size) and how long it takes to settle. */
	squash: number;
	squashMs: number;
	/** Dust puffs on landing and how far they spread (logical px). */
	dust: number;
	reach: number;
	/** Pitch of the card sound in cents (negative = deeper) and its volume. */
	detune: number;
	volume: number;
}

export const TIER_FEEL: Record<CardTier, TierFeel> = {
	down: {
		arc: 5,
		lift: 0.02,
		tilt: 2,
		squash: 0.05,
		squashMs: 110,
		dust: 0,
		reach: 0,
		detune: 0,
		volume: 0.5,
	},
	common: {
		arc: 12,
		lift: 0.07,
		tilt: 5,
		squash: 0.12,
		squashMs: 140,
		dust: 3,
		reach: 14,
		detune: 0,
		volume: 1,
	},
	strong: {
		arc: 16,
		lift: 0.1,
		tilt: 6,
		squash: 0.17,
		squashMs: 170,
		dust: 5,
		reach: 20,
		detune: -200,
		volume: 1,
	},
	manilha: {
		arc: 22,
		lift: 0.13,
		tilt: 8,
		squash: 0.22,
		squashMs: 190,
		dust: 7,
		reach: 26,
		detune: -400,
		volume: 1,
	},
	zap: {
		arc: 30,
		lift: 0.18,
		tilt: 10,
		squash: 0.3,
		squashMs: 260,
		dust: 10,
		reach: 36,
		detune: -700,
		volume: 1,
	},
};

/** Extra weight a manilha gets from its suit (diamonds 0 to hearts 1), as a share of its squash and dust. */
export const SUIT_BOOST = 0.25;

export const CARD_FLIGHT = {
	/** Awaited: the travel, as long as the table always waited for a play. */
	travel: TABLE_TIMING.play,
	/** Awaited, ZAP only: the card rises and holds before it flies (the most a play may grow by is 250). */
	zapBeat: 160,
	zapRise: 14,
	zapGrow: 0.12,
} as const;

/** Ghosts a manilha leaves behind: one every `step` of the flight, each fading in `life`. */
export const TRAIL = { step: 0.16, life: 170, alpha: 0.4 } as const;

/** The ZAP's ring on the felt: scale it grows to, how flat it lies, time and opacity. */
export const ZAP_RING = { to: 2.6, flat: 0.5, ms: 460, alpha: 0.85 } as const;

/** Screen shake of the ZAP's landing (respects Settings → Screen shake). */
export const ZAP_SHAKE = { ms: 140, intensity: 0.004 } as const;

/** Dust puff: size, growth, life, opacity and how far it floats up. */
export const DUST = { size: 0.5, grow: 1.7, life: 320, alpha: 0.55, rise: 5 } as const;

export const TRICK_SWEEP = {
	/** Awaited together, at most `TABLE_TIMING.collect`: the cards pile up, then run to the winner. */
	gather: 90,
	sweep: 170,
	/** Degrees each card turns while it is gathered, and the size the pile shrinks to at the winner. */
	twist: 7,
	shrink: 0.6,
	/** A tie: the cards bump (turn and come back), on top of the hold. */
	bump: 190,
	bumpTurn: 5,
	bumpPush: 4,
} as const;
