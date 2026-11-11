import type { TableSize } from './championships';

/**
 * Money, shop and slots (design §2.5, §3.4, PLAN A4.2–A4.3). Starting values; calibrated by the
 * balance bot (docs/balancing.md).
 */
export const ECONOMY = {
	startMoney: 4,
	prize: { small: 3, big: 4, boss: 5 } satisfies Record<TableSize, number>,
	/** +$1 per tento the rivals still needed to reach 12, capped. */
	speedCap: 5,
	/** +$1 per `interestStep` saved, capped. */
	interestStep: 5,
	interestCap: 5,
	rerollBase: 5,
	rerollStep: 1,
	/** Selling a Manha returns this share of its price. */
	sellShare: 0.5,
	manhaSlots: 5,
	consumableSlots: 2,
	/** The deck never goes below this (4 × 3 cards + the vira must always deal). */
	deckMin: 20,
	/** Shop: offers per visit. */
	offers: 4,
	/** Offer kind weights: Manha, Simpatia, Lance card. */
	offerWeights: { manha: 6, simpatia: 2, lance: 2 },
	/** Manha rarity weights in shops. */
	/** Legendary ones only once unlocked (feat "doze"). */
	rarityWeights: { common: 66, uncommon: 25, rare: 7, legendary: 2 },
	consumablePrice: 3,
} as const;
