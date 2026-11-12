import {
	COUNT_WEIGHT,
	type CountChannel,
	SCORE_COUNT,
	semitoneRate,
} from '../../config/feel-score';
import { type ScoreStep, totals } from './score';

/** One beat of the score count: a `ScoreStep` with what the view needs to play it. */
export interface CountEntry {
	step: ScoreStep;
	/** Position in the steps: the queue has exactly one entry per step, in order. */
	index: number;
	/** `card`, `lance`, `bet`, `mod`, `manha`, `trinket`, `joker`, `partner`, `boss`. */
	kind: string;
	/** The id after the colon (`''` for `bet`). */
	id: string;
	/** The strongest thing the step does: ×Mult over +Mult over Chips over money. */
	channel: CountChannel;
	weight: 1 | 2 | 3;
	/** The step comes from something with a name of its own (trinket, Manha, modifier...). */
	named: boolean;
	/** The step takes something away (a Flaw): shown in the bad colour. */
	flaw: boolean;
	/** Chips, Mult and points once this step is counted. */
	chips: number;
	mult: number;
	points: number;
	/** Playback rate of the step's sound: rises along the count, falls for a Flaw. */
	rate: number;
	/** Time the step holds the count, at 1×. */
	ms: number;
}

const NAMED = new Set(['manha', 'mod', 'joker', 'trinket', 'partner', 'boss']);

const channelOf = (st: ScoreStep): CountChannel =>
	st.xMult !== undefined
		? 'xMult'
		: st.addMult !== undefined
			? 'addMult'
			: st.chips !== undefined
				? 'chips'
				: 'money';

const isFlaw = (st: ScoreStep): boolean =>
	(st.chips ?? 0) < 0 ||
	(st.addMult ?? 0) < 0 ||
	(st.money ?? 0) < 0 ||
	(st.xMult !== undefined && st.xMult < 1);

/**
 * Turns the steps of a hand into the queue the count plays, one entry per step in the same
 * order, with the running totals from `totals`. Step time starts at its weight's beat and
 * shrinks along the count; the sum is then scaled to fit `ceilingMs`.
 */
export function buildCountQueue(steps: readonly ScoreStep[]): CountEntry[] {
	const c = SCORE_COUNT;
	const n = steps.length;
	const entries = steps.map((step, index): CountEntry => {
		const [kind = '', id = ''] = step.source.split(':');
		const channel = channelOf(step);
		const weight = COUNT_WEIGHT[channel];
		const named = NAMED.has(kind);
		const now = totals(steps.slice(0, index + 1));
		const rise = Math.min(c.pitch.maxSemitones, index * c.pitch.perStep);
		const flaw = isFlaw(step);
		const speedup = n > 1 ? 1 - (1 - c.endSpeedup) * (index / (n - 1)) : 1;
		return {
			step,
			index,
			kind,
			id,
			channel,
			weight,
			named,
			flaw,
			...now,
			rate: semitoneRate(rise + (flaw ? c.pitch.flawDrop : 0)),
			ms: (c.beatMs[weight] + (named ? c.namedExtraMs : 0)) * speedup,
		};
	});
	const sum = entries.reduce((a, e) => a + e.ms, 0);
	const k = sum > c.ceilingMs ? c.ceilingMs / sum : 1;
	for (const e of entries) e.ms *= k;
	return entries;
}

/** Total time of the queue at 1× (what the ceiling bounds). */
export const queueMs = (q: readonly CountEntry[]): number => q.reduce((a, e) => a + e.ms, 0);
