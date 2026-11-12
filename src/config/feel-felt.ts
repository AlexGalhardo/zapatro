/**
 * The felt's centre (docs/game-feel.md §4): where the deck, the vira, the bet chips and the three
 * trick markers sit, in stage px (640×360), for the four-seat table and the two-seat duel.
 */
export interface FeltCenterLayout {
	/** Deck (the stack's centre) and the vira turned beside it. */
	deck: { x: number; y: number };
	vira: { x: number; y: number };
	/** Chip stack: the centre of its bottom chip. It grows upwards. */
	chips: { x: number; y: number };
	/** The centre of the middle trick marker. */
	markers: { x: number; y: number };
	/** Chip and marker size relative to the four-seat table. */
	scale: number;
}

export const FELT_CENTER: Record<'table' | 'duel', FeltCenterLayout> = {
	// Deck and vira in the felt's top-left corner; chips and markers in the gap between the four
	// played cards (x 352–428, y 157–201).
	table: {
		deck: { x: 172, y: 46 },
		vira: { x: 214, y: 46 },
		chips: { x: 390, y: 173 },
		markers: { x: 390, y: 192 },
		scale: 1,
	},
	// Two seats: deck and vira left of the played cards, chips and markers right of them.
	duel: {
		deck: { x: 258, y: 190 },
		vira: { x: 302, y: 190 },
		chips: { x: 494, y: 196 },
		markers: { x: 494, y: 230 },
		scale: 1.3,
	},
};

export const FELT_FEEL = {
	/** Chip radius, the lift of each chip over the one below, and the stack's longest height in chips. */
	chipR: 12,
	chipStep: 3,
	/** A pip (trick marker): side and gap. */
	pip: 11,
	pipGap: 4,
	/** The stack slams down when the bet rises: start scale and time (ms, before `dur`). */
	slamFrom: 1.4,
	slamMs: 260,
	/** A new trick marker pops in: start scale and time. */
	popFrom: 1.6,
	popMs: 220,
	/** Pending chips (a call waiting for an answer): fill opacity, and the pulse range and time. */
	ghostAlpha: 0.6,
	ghostPulse: [0.4, 0.75] as const,
	ghostMs: 600,
	/** Deck: cards in the stack and the offset between them. */
	deckLayers: 4,
	deckStep: 1.2,
	deckScale: 0.78,
} as const;
