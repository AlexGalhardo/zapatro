/**
 * Cards of Truco Paulista (PLAN §5.1–5.2): 40-card French deck without 8, 9, 10, plus one
 * joker (coringa, src/data/jokers.ts). The run deck may hold copies and lose cards (D-06), so
 * every card has its own id.
 */

/** Base strength order, weakest first. */
export const RANKS = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'] as const;
export type Rank = (typeof RANKS)[number];

/** Manilha suit order, weakest first: pica-fumo ♦ < espadilha ♠ < copas ♥ < paus ♣. */
export const SUITS = ['diamonds', 'spades', 'hearts', 'clubs'] as const;
export type Suit = (typeof SUITS)[number];

/** The joker's rank: a card of its own, outside the strength order. */
export const JOKER = 'joker';
export type CardRank = Rank | typeof JOKER;

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
	if (text.trim().toUpperCase() === 'JK') return jokerCard();
	const m = /^([4567QJKA23])([dshc])$/i.exec(text.trim());
	if (!m) return null;
	const rank = RANKS.find((r) => r === m[1]?.toUpperCase());
	const suit = SUITS.find((s) => SUIT_INITIAL[s] === m[2]?.toLowerCase());
	return rank && suit ? { id: cardId(rank, suit), rank, suit } : null;
}

export function standardDeck(): Card[] {
	return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: cardId(rank, suit), rank, suit })));
}

/** The deck's joker. */
export function jokerCard(): Card {
	return { id: 'JK', rank: JOKER, suit: 'clubs' };
}

export const isJoker = (card: Card): boolean => card.rank === JOKER;

/** Manilha set by a vira (a joker never turns as the vira; one forced by debug reads as a 3). */
export const viraManilha = (vira: Card): Rank => manilhaOf(vira.rank === JOKER ? '3' : vira.rank);

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
 * the ZAP 14. The joker counts as a 3 unless its effect says otherwise (table.ts). A face-down
 * card (encoberta, D-34) is -1 and never wins.
 */
export function strength(card: Card, manilha: Rank, faceDown = false): number {
	if (faceDown) return -1;
	if (card.rank === JOKER) return RANKS.indexOf('3');
	if (isZap(card, manilha)) return ZAP_STRENGTH;
	if (card.rank === manilha) return RANKS.length + SUITS.indexOf(card.suit);
	return RANKS.indexOf(card.rank);
}
