import { AI_PROFILES, type AiProfile } from './ai-profiles';

/**
 * Companions (design §8): one cast for partners and rivals. Each run offers three of them as
 * partner; the other seven can sit as rivals, never the one you picked. As a rival a companion
 * plays only his style; as the player's partner he also brings his own Perk and Flaw
 * (`PARTNER_TRAITS`). Names in i18n (`char.<id>`); portrait `portrait.<id>.<expr>`.
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
	 * The companion's own AI: the archetype's profile with the style. As a partner it plays the
	 * bets his way (it never answers a rival's truco: only the player does); as a rival the
	 * Championship's pool profile gives `error` and `fameWeight` and this gives the personality.
	 */
	profile: AiProfile;
}

const base = (
	id: CompanionId,
	archetype: keyof typeof AI_PROFILES,
	style: PartnerStyle,
): AiProfile => ({ ...AI_PROFILES[archetype], id, ...PARTNER_STYLES[style] });

export const COMPANIONS: Record<CompanionId, CompanionDef> = {
	tonhao: { style: 'aggressive', profile: base('tonhao', 'bully', 'aggressive') },
	donaCida: { style: 'cautious', profile: base('donaCida', 'calculator', 'cautious') },
	zeMalandro: { style: 'bluffer', profile: base('zeMalandro', 'bluffer', 'bluffer') },
	juninho: { style: 'fearless', profile: base('juninho', 'rookie', 'fearless') },
	ze: { style: 'cautious', profile: base('ze', 'calculator', 'cautious') },
	bia: { style: 'aggressive', profile: base('bia', 'bully', 'aggressive') },
	joca: { style: 'cautious', profile: base('joca', 'coward', 'cautious') },
	lurdes: { style: 'bluffer', profile: base('lurdes', 'bluffer', 'bluffer') },
	tiao: { style: 'cautious', profile: base('tiao', 'calculator', 'cautious') },
	neide: { style: 'cautious', profile: base('neide', 'coward', 'cautious') },
};

/**
 * Each companion's own Perk and Flaw, roguelite ones that work only while he is the player's
 * partner (as a rival he just plays his style). Numbers live here, texts in i18n
 * `companion.<id>.perk|flaw`, effects in `scoreHand` (score steps) and `src/logic/run/run.ts`
 * (money and shop). Mirrored in docs/balancing.md.
 */
export const PARTNER_TRAITS = {
	/** Perk: +Mult per trick he wins. Flaw: his cards are worth half the Chips (rounded down). */
	tonhao: { trickMult: 3, chipsDivisor: 2 },
	/** Perk: money per hand won. Flaw: shop items cost more. */
	donaCida: { moneyPerWin: 1, priceUp: 1 },
	/** Perk: interest on saved money at the end of each table. Flaw: rerolling costs more. */
	zeMalandro: { interestStep: 5, interestPer: 1, interestCap: 5, rerollUp: 1 },
	/** Perk: +base Mult per level (a level per table won). Flaw: starts at -1 base Mult. */
	juninho: { multPerLevel: 1, startMult: -1 },
	/** Perk: the cheapest offer of the first shop of each Championship is free. Flaw: slots. */
	ze: { freeOffers: 1, manhaSlotsDown: 1 },
	/** Perk: manilhas worth more Chips. Flaw: common cards worth fewer. */
	bia: { manilhaChips: 15, commonChips: -2 },
	/** Perk: Chips per trick won with a club. Flaw: hearts and diamonds worth fewer Chips. */
	joca: { clubTrickChips: 20, redChips: -5 },
	/** Perk: a free reroll per shop. Flaw: Manhas cost more. */
	lurdes: { freeRerolls: 1, manhaPriceUp: 1 },
	/** Perk: ×Mult when the pair wins the first two tricks. Flaw: a lost hand costs money. */
	tiao: { firstTwoTricksX: 1.5, lostHandCost: 1 },
	/** Perk: chance to double the money earned winning a table. Flaw: bigger table goals. */
	neide: { doubleMoneyChance: 0.25, goalMult: 1.1 },
} as const satisfies Record<CompanionId, object>;

/** Companions offered as partner each run. */
export const CANDIDATE_COUNT = 3;

export const isCompanion = (id: string | undefined): id is CompanionId =>
	COMPANION_IDS.includes(id as CompanionId);
