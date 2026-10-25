/**
 * The joker (coringa, PLAN §5.12): one per deck. Played face up, it draws one of these effects
 * (seeded Rng, equal odds); face down it is just a covered card. Rules in
 * src/logic/truco/table.ts, scoring in src/logic/score/score.ts.
 */
export const JOKER_EFFECTS = [
	/** The trick is void: it counts as a tie. */
	'void',
	/** The joker becomes the ZAP for this trick. */
	'zap',
	/** The joker is worth less than a 4. */
	'dud',
	/** The hand is worth JOKER_WORTH (if it was worth less). */
	'worth3',
	/** The hand's Chips × Mult is zeroed. */
	'zeroed',
	/** In this trick the weakest card wins (face-down cards still never win). */
	'upsideDown',
	/** A new vira is turned: manilhas and ZAP change from this trick on. */
	'newVira',
	/** The joker copies the strongest card already on the table. */
	'copycat',
	/** The hand's Chips × Mult is doubled (JOKER_DOUBLE_X). */
	'double',
	/** Every hand is shown to everyone until the hand ends. */
	'showdown',
] as const;
export type JokerEffect = (typeof JOKER_EFFECTS)[number];

/** Hand value after the `worth3` effect. */
export const JOKER_WORTH = 3;
/** ×Mult of the `double` effect. */
export const JOKER_DOUBLE_X = 2;
/** Chips of the joker in a won trick (as a 3). */
export const JOKER_CHIPS = 10;
