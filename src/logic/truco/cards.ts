import { SPECIAL_CARDS, type SpecialRank } from '../../data/specials';

/**
 * Cards of Truco Paulista (PLAN §5.1–5.2): 40-card French deck without 8, 9, 10, plus two
 * jokers (coringas, src/data/jokers.ts) and the three special cards (src/data/specials.ts). The
 * run deck may hold copies and lose cards (D-06), so every card has its own id.
 */

/** Base strength order, weakest first. */
export const RANKS = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'] as const;
export type Rank = (typeof RANKS)[number];

/** Manilha suit order, weakest first: pica-fumo ♦ < espadilha ♠ < copas ♥ < paus ♣. */
export const SUITS = ['diamonds', 'spades', 'hearts', 'clubs'] as const;
export type Suit = (typeof SUITS)[number];

/** The joker's rank: a card of its own, outside the strength order. */
export const JOKER = 'joker';
export type CardRank = Rank | typeof JOKER | SpecialRank;

export interface Card {
	/** Unique in the deck: `<rank><suit initial>` plus `#n` for copies (e.g. `3c`, `3c#2`, `JK`). */
	id: string;
	/** The joker's suit means nothing. */
	rank: CardRank;
	suit: Suit;
	/** Card modifier id (src/data, ALPHA); only works for the player's team. */
	mod?: string;
}

const SUIT_INITIAL: Record<Suit, string> = {
	diamonds: 'd',
	spades: 's',
	hearts: 'h',
	clubs: 'c',
};

export function cardId(rank: Rank, suit: Suit): string {
	return `${rank}${SUIT_INITIAL[suit]}`;
}

/** Parses `3c`, `Qh`, `Ad`… and `JK` (the joker; debug params, tests). */
export function parseCard(text: string): Card | null {
	const word = text.trim().toUpperCase();
	if (word === 'JK') return jokerCard();
	if (word === 'JK2') return jokerCard(2);
	const special = specialCards().find((c) => c.id === word);
	if (special) return special;
	const m = /^([4567QJKA23])([dshc])$/i.exec(text.trim());
	if (!m) return null;
	const rank = RANKS.find((r) => r === m[1]?.toUpperCase());
	const suit = SUITS.find((s) => SUIT_INITIAL[s] === m[2]?.toLowerCase());
	return rank && suit ? { id: cardId(rank, suit), rank, suit } : null;
}

export function standardDeck(): Card[] {
	return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: cardId(rank, suit), rank, suit })));
}

/** A joker of the deck: it has two (`JK` and `JK2`). */
export function jokerCard(copy: 1 | 2 = 1): Card {
	return { id: copy === 1 ? 'JK' : 'JK2', rank: JOKER, suit: 'clubs' };
}

const SPECIAL_ID: Record<SpecialRank, string> = { trevo: 'TV', olho: 'OL', raio: 'RA' };

/** The Trevo, the Olho and the Raio. */
export function specialCards(): Card[] {
	return (Object.keys(SPECIAL_CARDS) as SpecialRank[]).map((rank) => ({
		id: SPECIAL_ID[rank],
		rank,
		suit: 'clubs',
	}));
}

/** The whole deck of a run or a quick match: 40 common cards, two jokers, three special cards. */
export const fullDeck = (): Card[] => [
	...standardDeck(),
	jokerCard(),
	jokerCard(2),
	...specialCards(),
];

export const isJoker = (card: Card): boolean => card.rank === JOKER;

/** The joker and the special cards: outside the strength order, never the vira. */
export const isSpecial = (card: Card): boolean => card.rank === JOKER || card.rank in SPECIAL_CARDS;

/** Manilha set by a vira (a special card never turns as the vira; one forced by debug reads as a 3). */
export const viraManilha = (vira: Card): Rank =>
	manilhaOf(isSpecial(vira) ? '3' : (vira.rank as Rank));

/** The rank right above the vira, wrapping 3 → 4 (PLAN §5.2). */
export function manilhaOf(vira: Rank): Rank {
	return RANKS[(RANKS.indexOf(vira) + 1) % RANKS.length] as Rank;
}

export function isManilha(card: Card, manilha: Rank): boolean {
	return card.rank === manilha;
}

/** The ZAP: the clubs card two ranks above the vira (one above the manilhas, PLAN §5.2). */
export function isZap(card: Card, manilha: Rank): boolean {
	return card.rank === manilhaOf(manilha) && card.suit === 'clubs';
}

/** Strength of the ZAP, above every manilha. */
export const ZAP_STRENGTH = RANKS.length + SUITS.length;

/**
 * Strength for comparing cards in a trick: common cards 0–9 by rank, manilhas 10–13 by suit,
 * the ZAP 14. The joker and the special cards count as a 3 unless an effect says otherwise (table.ts). A face-down
 * card (encoberta, D-34) is -1 and never wins.
 */
export function strength(card: Card, manilha: Rank, faceDown = false): number {
	if (faceDown) return -1;
	if (isSpecial(card)) return RANKS.indexOf('3');
	if (isZap(card, manilha)) return ZAP_STRENGTH;
	if (card.rank === manilha) return RANKS.length + SUITS.indexOf(card.suit);
	return RANKS.indexOf(card.rank as Rank);
}
