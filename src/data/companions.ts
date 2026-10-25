import { AI_PROFILES, type AiProfile } from './ai-profiles';

/**
 * Companions (design §8, review 2026-10-24): one cast for partners and rivals. Each run offers
 * three of them as partner; the other seven can sit as rivals, never the one you picked. Every
 * companion has a perk and a flaw (`Trait`) that work for the pair he sits in, so the same
 * numbers help you as a partner and hurt you as a rival. Partners also have a level passive
 * (Chips × Mult exist only on the player's side). Names in i18n (`char.<id>`); portrait
 * `portrait.<id>.<expr>`; level 1–3 rises with each Championship won.
 */
export const COMPANION_IDS = [
	'tonhao',
	'donaCida',
	'zeMalandro',
	'juninho',
	'ze',
	'bia',
	'joca',
	'lurdes',
	'tiao',
	'neide',
] as const;
export type CompanionId = (typeof COMPANION_IDS)[number];

/**
 * A symmetric trait: it changes one number that both pairs have (tentos, signals, catching,
 * bets, AI error), never Chips × Mult. Texts in i18n `companion.trait.<k>`.
 * Proposal: numbers calibrated by `bun scripts/sim.ts` and `bun run balance` (docs/balancing.md).
 */
export type Trait =
	| { k: 'callTentos'; n: number } // a hand his pair wins after he called truco is worth +n tentos
	| { k: 'headStart'; n: number } // his pair starts every table with n tentos
	| { k: 'catch'; delta: number } // his pair catches rival signals ± delta
	| { k: 'caughtMult'; x: number } // rival catch chance against his pair ×x
	| { k: 'signals'; delta: number } // signals per hand of his pair ±
	| { k: 'honestSignals' } // he always signals and never lies
	| { k: 'falseSignals'; rate: number } // this share of his signals is a lie
	| { k: 'neverFolds' } // he never runs from a truco
	| { k: 'foldsRaises' } // he always runs from six, nine and twelve
	| { k: 'error'; x: number } // his AI error ×x
	| { k: 'weakWinTento'; n: number }; // a hand his pair wins with no manilha is worth +n tentos

/**
 * How a companion plays the bets: numbers that replace the archetype's courage, aggression and
 * bluff (src/logic/ai/decide.ts reads them).
 * - aggressive: calls and raises truco with fair hands and takes most calls;
 * - cautious: calls only with very strong hands, never bluffs, runs from doubtful calls;
 * - bluffer: calls truco with half of their weak hands;
 * - fearless: accepts almost every call, rarely runs.
 */
export const PARTNER_STYLES = {
	aggressive: { courage: 0.4, aggression: 0.95, bluff: 0.25 },
	cautious: { courage: 0.05, aggression: 0.05, bluff: 0 },
	bluffer: { courage: 0.25, aggression: 0.55, bluff: 0.5 },
	fearless: { courage: 0.6, aggression: 0.5, bluff: 0.1 },
} as const satisfies Record<string, Partial<AiProfile>>;
export type PartnerStyle = keyof typeof PARTNER_STYLES;

export interface CompanionDef {
	/** Unique way of playing the bets (i18n `partner.style.<style>`). */
	style: PartnerStyle;
	/**
	 * The companion's own AI: the archetype's profile with the style. As a partner it is careful
	 * when answering a call (the rivals' tentos end the table; calibrated in A5); as a rival the
	 * Championship's pool profile gives `error` and `fameWeight` and this gives the personality.
	 */
	profile: AiProfile;
	/** Advantage and disadvantage for the pair he sits in (partner or rival). */
	perk: Trait;
	flaw: Trait;
	/** Tonhão: +Mult when he calls truco, by level (partner only). */
	callMult?: readonly [number, number, number];
	/** Dona Cida: your chance to catch rival signals rises by level (partner only). */
	catchBonus?: readonly [number, number, number];
	/** Zé Malandro: his calls count as yours for Manhas (BLEFE); +Chips by level on his bluffs. */
	bluffChips?: readonly [number, number, number];
	/** Juninho: levels up after every table won, not every Championship. */
	levelsPerTable?: boolean;
}

const base = (
	id: CompanionId,
	archetype: keyof typeof AI_PROFILES,
	style: PartnerStyle,
): AiProfile => ({ ...AI_PROFILES[archetype], id, ...PARTNER_STYLES[style] });

export const COMPANIONS: Record<CompanionId, CompanionDef> = {
	tonhao: {
		style: 'aggressive',
		profile: base('tonhao', 'bully', 'aggressive'),
		perk: { k: 'callTentos', n: 1 },
		flaw: { k: 'neverFolds' },
		callMult: [3, 5, 8],
	},
	donaCida: {
		style: 'cautious',
		profile: base('donaCida', 'calculator', 'cautious'),
		perk: { k: 'honestSignals' },
		flaw: { k: 'foldsRaises' },
		catchBonus: [0, 0.1, 0.2],
	},
	zeMalandro: {
		style: 'bluffer',
		profile: base('zeMalandro', 'bluffer', 'bluffer'),
		perk: { k: 'signals', delta: 1 },
		flaw: { k: 'falseSignals', rate: 0.5 },
		bluffChips: [20, 40, 70],
	},
	juninho: {
		style: 'fearless',
		profile: base('juninho', 'rookie', 'fearless'),
		perk: { k: 'catch', delta: 0.15 },
		flaw: { k: 'error', x: 2 },
		levelsPerTable: true,
	},
	ze: {
		style: 'cautious',
		profile: base('ze', 'calculator', 'cautious'),
		perk: { k: 'headStart', n: 1 },
		flaw: { k: 'catch', delta: -0.15 },
	},
	bia: {
		style: 'aggressive',
		profile: base('bia', 'bully', 'aggressive'),
		perk: { k: 'caughtMult', x: 0.5 },
		flaw: { k: 'neverFolds' },
	},
	joca: {
		style: 'cautious',
		profile: base('joca', 'coward', 'cautious'),
		perk: { k: 'weakWinTento', n: 1 },
		flaw: { k: 'signals', delta: -1 },
	},
	lurdes: {
		style: 'bluffer',
		profile: base('lurdes', 'bluffer', 'bluffer'),
		perk: { k: 'catch', delta: 0.2 },
		flaw: { k: 'caughtMult', x: 2 },
	},
	tiao: {
		style: 'cautious',
		profile: base('tiao', 'calculator', 'cautious'),
		perk: { k: 'error', x: 0.25 },
		flaw: { k: 'foldsRaises' },
	},
	neide: {
		style: 'cautious',
		profile: base('neide', 'coward', 'cautious'),
		perk: { k: 'honestSignals' },
		flaw: { k: 'signals', delta: -1 },
	},
};

/** Partner AI error multiplier by level. */
export const PARTNER_ERROR_BY_LEVEL = [1, 0.7, 0.4] as const;
export const PARTNER_MAX_LEVEL = 3;

/** Companions offered as partner each run. */
export const CANDIDATE_COUNT = 3;

export const isCompanion = (id: string | undefined): id is CompanionId =>
	COMPANION_IDS.includes(id as CompanionId);

/** Whether the companion has a level passive as partner (i18n `partner.<id>.passive`). */
export const hasPassive = (id: CompanionId): boolean => {
	const c = COMPANIONS[id];
	return !!(c.callMult || c.catchBonus || c.bluffChips || c.levelsPerTable);
};
