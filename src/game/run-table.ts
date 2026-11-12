import { AI_PROFILES, type AiProfile, type AiProfileId } from '../data/ai-profiles';
import {
	COMPANIONS,
	type CompanionId,
	isCompanion,
	PARTNER_STYLES,
	RIVAL_PROFILES_1V1,
} from '../data/companions';
import { DECKS } from '../data/decks';
import { stakeRules } from '../data/stakes';
import { doubleFlaws } from '../data/trinkets';
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

/**
 * The rival of a 1v1 table: the archetype his style maps to (`RIVAL_PROFILES_1V1`) with the
 * Championship pool's `error`. Bosses and unknown ids keep the pool profile.
 */
export function rival1v1Brain(pool: AiProfileId, char: string): SeatBrain {
	const base = AI_PROFILES[pool];
	return {
		kind: 'ai',
		profile: isCompanion(char)
			? { ...AI_PROFILES[RIVAL_PROFILES_1V1[char]], id: char, error: base.error }
			: base,
	};
}

/** The partner's AI: his own profile (he plays the bets his way, he never answers a truco). */
const partnerProfile = (partner: CompanionId): AiProfile => COMPANIONS[partner].profile;

/** Seed of a table's own rng: fixed per run, Championship and table (replays match). */
export const tableSeed = (run: RunState): number =>
	(run.seed ^ Math.imul(run.champ * 977 + run.table * 131 + 1, 2654435761)) >>> 0;

/** The Match of the run's current table (resumes the saved hand when there is one). */
export function tableMatch(run: RunState, seat0: SeatBrain): Match {
	const [p1, p3] = run.rivals.profiles;
	const [c1, c3] = run.rivals.chars;
	// Mano a mano (D-78): you alone against one rival; no partner, trait or signal exists.
	const partner = run.mode === '1v1' ? undefined : run.partner;
	const brains: MatchOptions['brains'] = partner
		? [
				seat0,
				rivalBrain(p1, c1),
				{ kind: 'ai', profile: partnerProfile(partner) },
				rivalBrain(p3, c3),
			]
		: [seat0, rival1v1Brain(p1, c1)];
	const boss = currentBoss(run);
	const equipped = boss === 'stuart' ? doubleFlaws(equippedOf(run)) : equippedOf(run);
	const totals = trinketTotals(equipped);
	return new Match({
		rng: new Rng(tableSeed(run)),
		brains,
		deck: run.deck,
		goal: currentGoal(run),
		levels: run.levels,
		manhas: run.manhas,
		...(partner ? { partner: { id: partner, level: run.partnerLevel } } : {}),
		trinkets: equipped,
		tablesWon: run.stats.tables,
		startTentos: totals.startTentos,
		startMoney: totals.startMoney,
		loseTento: totals.loseTento,
		rivalCatch: totals.rivalCatch,
		boss,
		extraSignals: partner ? (DECKS[run.startDeck].extraSignals ?? 0) : 0,
		doubleChipRanks: DECKS[run.startDeck].doubleChipRanks,
		extraRivalQuedas: run.extraLife ? 1 : 0,
		score: { us: 0, them: stakeRules(run.stake).rivalHeadStart },
		...(run.tableSave ? { resume: run.tableSave } : {}),
	});
}
