import { type ScoreStep, totals } from './score';

/**
 * What each Manha and trinket added to a hand (R6.4): the hand's points minus the points it
 * would have had without that item's steps. Items that only gave money, or whose flaw cost more
 * than the perk gave, come out at 0 or below. Reads `steps`; it never changes a scoring rule.
 */
export function itemPoints(steps: readonly ScoreStep[]): Record<string, number> {
	const all = totals(steps).points;
	const out: Record<string, number> = {};
	const ids = new Set(
		steps
			.map((s) => s.source)
			.filter((s) => s.startsWith('manha:') || s.startsWith('trinket:')),
	);
	for (const id of ids) out[id] = all - totals(steps.filter((s) => s.source !== id)).points;
	return out;
}
