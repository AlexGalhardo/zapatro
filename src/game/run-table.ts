import { AI_PROFILES, type AiProfile, type AiProfileId } from '../data/ai-profiles';
import { COMPANIONS, type CompanionId, PARTNER_STYLES } from '../data/companions';
import { DECKS } from '../data/decks';
import { stakeRules } from '../data/stakes';
import { Rng } from '../logic/rng';
import { currentBoss, currentGoal, equippedOf, type RunState } from '../logic/run/run';
import { trinketTotals } from '../logic/run/trinkets';
import { Match, type MatchOptions, type SeatBrain } from './match';

/**
 * A rival's brain: the Championship pool profile (error, Fame weight) with the personality of
 * the companion who sits there. Bosses and unknown ids keep the pool profile.
 */
export function rivalBrain(pool: AiProfileId, char: string): SeatBrain {
	const companion = COMPANIONS[char as CompanionId];
	const base = AI_PROFILES[pool];
	return {
		kind: 'ai',
		profile: companion ? { ...base, ...PARTNER_STYLES[companion.style] } : base,
	};
}

/** The partner's AI: his own profile (he plays the bets his way, he never answers a truco). */
export const partnerProfile = (run: RunState): AiProfile => COMPANIONS[run.partner].profile;

/** Seed of a table's own rng: fixed per run, Championship and table (replays match). */
export const tableSeed = (run: RunState): number =>
	(run.seed ^ Math.imul(run.champ * 977 + run.table * 131 + 1, 2654435761)) >>> 0;

/** The Match of the run's current table (resumes the saved hand when there is one). */
export function tableMatch(run: RunState, seat0: SeatBrain): Match {
	const [p1, p3] = run.rivals.profiles;
	const [c1, c3] = run.rivals.chars;
	const brains: MatchOptions['brains'] = [
		seat0,
		rivalBrain(p1, c1),
		{ kind: 'ai', profile: partnerProfile(run) },
		rivalBrain(p3, c3),
	];
	const totals = trinketTotals(equippedOf(run));
	return new Match({
		rng: new Rng(tableSeed(run)),
		brains,
		deck: run.deck,
		fame: run.fame,
		goal: currentGoal(run),
		levels: run.levels,
		manhas: run.manhas,
		partner: { id: run.partner, level: run.partnerLevel },
		trinkets: equippedOf(run),
		tablesWon: run.stats.tables,
		startTentos: totals.startTentos,
		startMoney: totals.startMoney,
		loseTento: totals.loseTento,
		rivalCatch: totals.rivalCatch,
		boss: currentBoss(run),
		extraSignals:
			(run.upgrades.includes('maisSinal') ? 1 : 0) + (DECKS[run.startDeck].extraSignals ?? 0),
		doubleChipRanks: DECKS[run.startDeck].doubleChipRanks,
		peekPile: run.upgrades.includes('espiarMonte'),
		extraRivalQuedas: run.extraLife ? 1 : 0,
		score: { us: 0, them: stakeRules(run.stake).rivalHeadStart },
		...(run.tableSave ? { resume: run.tableSave } : {}),
	});
}
