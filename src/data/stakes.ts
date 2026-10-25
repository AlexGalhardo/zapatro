/**
 * Stakes (design §6, PLAN B2.2): 8 difficulty levels; each adds one rule to the ones below it.
 * The rival tentos are the clock of a table, so most rules shorten it (tougher rivals, a head
 * start) instead of only raising goals. The balance bot loses 5–8 p.p. per Stake
 * (docs/balancing.md). Names in i18n (`stake.<n>`).
 */
export const MAX_STAKE = 8;

export interface StakeRules {
	/** All table goals ×. */
	goalMult: number;
	interestCap: number;
	/** The small table pays no prize. */
	smallPrize: boolean;
	startMoney: number | null;
	/** Rival profiles are drawn from the pool of this many Championships later. */
	rivalShift: number;
	/** The rivals start every table with these tentos. */
	rivalHeadStart: number;
	/** Shop prices ×. */
	priceMult: number;
}

/** Rules of a Stake (cumulative). */
export function stakeRules(stake: number): StakeRules {
	return {
		goalMult: [1, 1.15, 1.25, 1.3, 1.45, 1.5, 1.7, 1.8][stake - 1] ?? 1.8,
		interestCap: stake >= 3 ? 3 : 5,
		smallPrize: stake < 4,
		startMoney: null,
		rivalShift: stake >= 7 ? 2 : stake >= 4 ? 1 : 0,
		rivalHeadStart: [0, 0, 3, 3, 4, 6, 6, 7][stake - 1] ?? 7,
		priceMult: stake >= 8 ? 1.25 : 1,
	};
}
