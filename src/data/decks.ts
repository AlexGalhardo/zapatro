/**
 * Starting decks (design §6, PLAN B2.1): variety, never power over the whole run (D-11).
 * Names in i18n (`deck.<id>.name|desc`); card back `card.back.<back>`.
 */
export const DECK_IDS = ['normal', 'interior', 'blefe', 'dinheiro', 'viciado'] as const;
export type DeckId = (typeof DECK_IDS)[number];

export interface DeckDef {
	back: string;
	/** Chips ×2 for cards of these ranks (do Interior). */
	doubleChipRanks?: readonly string[];
	extraSignals?: number;
	money?: number;
	manhaSlots?: number;
	/** Extra copy of every card of this suit (Viciado: more zaps around). */
	extraSuit?: 'clubs';
}

export const DECKS: Record<DeckId, DeckDef> = {
	normal: { back: 'default' },
	interior: { back: 'interior', doubleChipRanks: ['4', '5', '6'] },
	blefe: { back: 'blefe', extraSignals: 1 },
	dinheiro: { back: 'dinheiro', money: 10, manhaSlots: -1 },
	viciado: { back: 'viciado', extraSuit: 'clubs' },
};

/** The Bluff deck's extra signal is one a partner reads: the 1×1 run has none. */
export const deckNeedsPartner = (id: DeckId): boolean => (DECKS[id].extraSignals ?? 0) > 0;
