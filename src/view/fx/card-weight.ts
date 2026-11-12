import type { CardTier } from '../../config/feel-cards';
import { type Card, RANKS, type Rank, strength, ZAP_STRENGTH } from '../../logic/truco/cards';

export interface CardWeight {
	tier: CardTier;
	/** 0 to 1 inside the manilha tier (diamonds to hearts); 0 elsewhere. */
	suit: number;
}

const STRONG_FROM = RANKS.indexOf('A');

/** Weight of a played card, read from the game's own strength order (the table never keeps its own). */
export function cardWeight(card: Card, manilha: Rank, faceDown = false): CardWeight {
	if (faceDown) return { tier: 'down', suit: 0 };
	const s = strength(card, manilha);
	if (s === ZAP_STRENGTH) return { tier: 'zap', suit: 1 };
	if (s >= RANKS.length) return { tier: 'manilha', suit: (s - RANKS.length) / 3 };
	return { tier: s >= STRONG_FROM ? 'strong' : 'common', suit: 0 };
}
