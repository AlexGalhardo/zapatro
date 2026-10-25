import { CANDIDATE_COUNT, COMPANIONS, type CompanionId } from '../../data/companions';
import { Rng } from '../rng';

/**
 * The partners offered at the start of a run: distinct, unlocked, from a sub-seed of their own
 * (it never moves the run's rng). A new style per pick when possible; the previous run's partner
 * sits out while there are 4 or more to choose from.
 */
export function drawCandidates(
	seed: number,
	unlocked: readonly CompanionId[],
	last?: CompanionId,
): CompanionId[] {
	const rng = new Rng((seed ^ 0x9e3779b9) >>> 0);
	const pool =
		unlocked.length >= CANDIDATE_COUNT + 1 ? unlocked.filter((id) => id !== last) : unlocked;
	const order = rng.shuffle([...pool]);
	const picks: CompanionId[] = [];
	for (const id of order) {
		const taken = picks.some((p) => COMPANIONS[p].style === COMPANIONS[id].style);
		if (!taken && picks.length < CANDIDATE_COUNT) picks.push(id);
	}
	for (const id of order)
		if (picks.length < CANDIDATE_COUNT && !picks.includes(id)) picks.push(id);
	return picks;
}
