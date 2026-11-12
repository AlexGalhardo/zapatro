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
		goalMult: [1, 1.1, 1.18, 1.25, 1.3, 1.38, 1.45, 1.55][stake - 1] ?? 1.55,
		interestCap: stake >= 3 ? 3 : 5,
		smallPrize: stake < 4,
		startMoney: null,
		rivalShift: stake >= 8 ? 2 : stake >= 4 ? 1 : 0,
		rivalHeadStart: [0, 0, 1, 1, 2, 2, 3, 3][stake - 1] ?? 3,
		priceMult: stake >= 8 ? 1.25 : 1,
	};
}

export type StakeChange =
	| { k: 'goals' | 'head' | 'interest' | 'price'; n: number }
	| { k: 'prize' | 'rivals' };

/** What a Stake adds to the one below it, read off `stakeRules` so the screen never drifts from it. */
export function stakeChanges(stake: number): StakeChange[] {
	if (stake <= 1) return [];
	const now = stakeRules(stake);
	const was = stakeRules(stake - 1);
	const out: StakeChange[] = [];
	if (now.goalMult !== was.goalMult)
		out.push({ k: 'goals', n: Math.round((now.goalMult - 1) * 100) });
	if (now.rivalHeadStart !== was.rivalHeadStart) out.push({ k: 'head', n: now.rivalHeadStart });
	if (now.interestCap !== was.interestCap) out.push({ k: 'interest', n: now.interestCap });
	if (now.smallPrize !== was.smallPrize) out.push({ k: 'prize' });
	if (now.rivalShift !== was.rivalShift) out.push({ k: 'rivals' });
	if (now.priceMult !== was.priceMult)
		out.push({ k: 'price', n: Math.round((now.priceMult - 1) * 100) });
	return out;
}
