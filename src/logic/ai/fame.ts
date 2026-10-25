import { type Card, isZap, type Rank } from '../truco/cards';

/**
 * Fame (design §5.3): one meter from -1 (honest) to +1 (bluffer), for the whole run. It only
 * moves when a truco of the player's team was accepted and the cards were shown at the end of
 * the hand: a weak hand pushes towards "bluffer", a strong one towards "honest". A fold never
 * shows the cards, so it never moves Fame.
 */
export const FAME_BLUFF_STEP = 0.25;
export const FAME_HONEST_STEP = 0.15;

/** A hand is "strong" for Fame when it holds the ZAP, a manilha or a 3 at the moment of the call. */
export function isStrongCall(hand: readonly Card[], manilha: Rank): boolean {
	return hand.some((c) => isZap(c, manilha) || c.rank === manilha || c.rank === '3');
}

export function fameAfterShowdown(fame: number, strongCall: boolean): number {
	const next = fame + (strongCall ? -FAME_HONEST_STEP : FAME_BLUFF_STEP);
	return Math.max(-1, Math.min(1, next));
}
