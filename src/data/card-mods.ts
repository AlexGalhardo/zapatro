/**
 * Card modifiers (design §4.3, PLAN A3.4). A modifier stays on the card even when a rival draws
 * it, but only works when your team plays it in a trick your team won. Overlay art
 * `card.mod.<id>`; names in i18n (`mod.<id>.name|desc`). Starting values (docs/balancing.md).
 */
export interface CardModDef {
	chips?: number;
	addMult?: number;
	money?: number;
	/** ×Mult (applied after the bet and the Lance, like a Manha). */
	xMult?: number;
	/** Only when the hand was trucado (bet ≥ 3). */
	trucado?: boolean;
	/** Only in the 3rd trick. */
	lastTrick?: boolean;
	/** Chance to break after scoring (it leaves the run deck). */
	breakChance?: number;
}

/**
 * Mentirosa and Marcada change the AI, not the score: the rivals read a Mentirosa played by your
 * team as 3 ranks stronger; your partner knows your Marcada cards (src/logic/ai, observe).
 */
export const CARD_MODS = {
	gold: { money: 1 },
	heavy: { chips: 20 },
	hot: { addMult: 4, trucado: true },
	nervosa: { addMult: 10, lastTrick: true },
	mentirosa: {},
	marcada: {},
	vidro: { xMult: 2, breakChance: 0.25 },
} as const satisfies Record<string, CardModDef>;

/** How much stronger the rivals read a Mentirosa card. */
export const MENTIROSA_BONUS = 3;

export type CardModId = keyof typeof CARD_MODS;

export const isCardModId = (id: string): id is CardModId => id in CARD_MODS;
