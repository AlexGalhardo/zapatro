import { AI_PROFILES, type AiProfile, type AiProfileId } from '../data/ai-profiles';
import {
	COMPANIONS,
	type CompanionId,
	PARTNER_ERROR_BY_LEVEL,
	PARTNER_STYLES,
} from '../data/companions';
import { DECKS } from '../data/decks';
import { stakeRules } from '../data/stakes';
import { Rng } from '../logic/rng';
import { currentBoss, currentGoal, type RunState } from '../logic/run/run';
import { Match, type MatchOptions, type SeatBrain } from './match';
import { seatTraits } from './traits';

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

/** The partner's AI: its profile, less error per level. */
export function partnerProfile(run: RunState): AiProfile {
	const base = COMPANIONS[run.partner].profile;
	const scale = PARTNER_ERROR_BY_LEVEL[run.partnerLevel - 1] ?? 1;
	return {
		...base,
		error: base.error * scale,
	};
}

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
	return new Match({
		rng: new Rng(tableSeed(run)),
		brains,
		deck: run.deck,
		fame: run.fame,
		goal: currentGoal(run),
		levels: run.levels,
		manhas: run.manhas,
		partner: { id: run.partner, level: run.partnerLevel },
		traits: seatTraits({ 0: 'player', 1: c1, 2: run.partner, 3: c3 }),
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
