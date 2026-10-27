/**
 * The special cards (cartas especiais): one Trevo, one Olho and one Raio in every run and quick
 * match deck, next to the joker. Like the joker, a special card played face up draws one of its
 * three effects (seeded Rng, equal odds); face down it is a covered card; its strength is a 3's.
 * Rules in src/logic/truco/table.ts. Texts in i18n: `special.<rank>.name`, `joker.<effect>.*`.
 */
export const SPECIAL_CARDS = {
	/** Luck and the bet. */
	trevo: ['raise', 'shield', 'bonus'],
	/** Information and the hand. */
	olho: ['peek', 'swap', 'redraw'],
	/** Chaos on the table. */
	raio: ['freeze', 'claim', 'reversed'],
} as const;

export type SpecialRank = keyof typeof SPECIAL_CARDS;
export type SpecialEffect = (typeof SPECIAL_CARDS)[SpecialRank][number];

export const SPECIAL_RANKS = Object.keys(SPECIAL_CARDS) as SpecialRank[];

/** The special card an effect belongs to. */
export const specialOf = (effect: string): SpecialRank | undefined =>
	SPECIAL_RANKS.find((r) => (SPECIAL_CARDS[r] as readonly string[]).includes(effect));

/** `shield`: tentos lost when the pair folds. */
export const SHIELD_TENTOS = 1;
/** `bonus`: tentos on top of the bet for the pair that wins the hand (never past 12). */
export const BONUS_TENTOS = 2;
