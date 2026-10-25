import type { Rank, Suit } from '../logic/truco/cards';

/**
 * Chips per card (design §2.3, PLAN A2.1). Starting values; the balance bot calibrates them
 * (docs/balancing.md).
 */
export const RANK_CHIPS: Record<Rank, number> = {
	'4': 1,
	'5': 2,
	'6': 3,
	'7': 4,
	Q: 5,
	J: 6,
	K: 7,
	A: 8,
	'2': 9,
	'3': 10,
};

/** Chips of a manilha by suit: pica-fumo ♦, espadilha ♠, copas ♥, paus ♣. */
export const MANILHA_CHIPS: Record<Suit, number> = {
	diamonds: 12,
	spades: 13,
	hearts: 14,
	clubs: 15,
};

/** Chips of the ZAP (the clubs card two ranks above the vira, PLAN §5.2). */
export const ZAP_CHIPS = 18;
