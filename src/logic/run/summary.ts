import type { RunMode } from '../../data/championships';
import { DECK_IDS, type DeckId } from '../../data/decks';
import { FEATS } from '../../data/feats';
import { MAX_STAKE } from '../../data/stakes';
import { isUnlocked, maxStake } from '../meta';
import type { MetaSave } from '../save';
import type { RunState } from './run';

/** Everything the run-end screen lists about the run, read straight from `run` and `run.stats`. */
export interface RunSummary {
	won: boolean;
	demo: boolean;
	champ: number;
	table: 0 | 1 | 2;
	mode: RunMode;
	stake: number;
	deck: DeckId;
	seed: number;
	partner: string | null;
	tables: number;
	hands: number;
	bestHand: number;
	money: number;
	/** The item that added the most points over the run; null when none added any. */
	topItem: { kind: 'trinket' | 'manha'; id: string; points: number } | null;
	/** The trinkets the run ended with, left to right. */
	trinkets: string[];
}

export function runSummary(run: RunState): RunSummary {
	let top: [string, number] | null = null;
	for (const [key, points] of Object.entries(run.stats.items ?? {}))
		if (points > (top?.[1] ?? 0)) top = [key, points];
	const [kind = '', id = ''] = top?.[0].split(':') ?? [];
	return {
		won: run.phase === 'won',
		demo: run.demo,
		champ: run.champ,
		table: run.table,
		mode: run.mode,
		stake: run.stake,
		deck: run.startDeck,
		seed: run.seed,
		partner: run.partner ?? null,
		tables: run.stats.tables,
		hands: run.stats.hands,
		bestHand: run.stats.bestHand,
		money: run.money,
		topItem: top
			? { kind: kind === 'trinket' ? 'trinket' : 'manha', id, points: top[1] }
			: null,
		trinkets: [...run.trinkets],
	};
}

export interface RunUnlocks {
	/** Feats earned during this run (ids). */
	feats: string[];
	/** Content they opened: `deck:<id>`, `partner:<id>`. */
	content: string[];
	/** The highest Stake now playable with the deck, when this win opened a new one. */
	stake: number | null;
}

/** What the run unlocked: the feats the profile gained since it began, and a Stake it opened. */
export function unlockedThisRun(meta: MetaSave, run: RunState): RunUnlocks {
	const feats = run.before ? meta.feats.slice(run.before.feats) : [];
	const content = feats.flatMap((id) => FEATS.find((f) => f.id === id)?.unlocks ?? []);
	const opened =
		run.phase === 'won' &&
		run.before !== undefined &&
		(meta.stakes[run.startDeck] ?? 0) > run.before.stakeBest;
	return { feats, content, stake: opened ? maxStake(meta, run.startDeck) : null };
}

export type NextUnlock =
	| { kind: 'feat'; feat: string; unlocks: string; have: number; need: number }
	| { kind: 'stake'; deck: DeckId; stake: number };

/** Progress of a feat the profile already tracks, as `have` of `need`; 0 of 1 when it does not. */
function progress(meta: MetaSave, rule: (typeof FEATS)[number]['rule']): [number, number] {
	if (rule.on === 'life') return [meta.stats[rule.k], rule.n];
	if (rule.on === 'run' && rule.k === 'champ') return [meta.stats.bestChampionship, rule.n];
	return [0, 1];
}

/**
 * The unlock the player is closest to: among the feats that still open content, the one furthest
 * along (list order breaks ties); once all are open, the next Stake of the least-advanced deck;
 * null when nothing is left to unlock.
 */
export function nextUnlock(meta: MetaSave): NextUnlock | null {
	let best: NextUnlock | null = null;
	let ratio = -1;
	for (const f of FEATS) {
		if (!f.unlocks || isUnlocked(meta, f.unlocks)) continue;
		const [have, need] = progress(meta, f.rule);
		if (have / need > ratio) {
			ratio = have / need;
			best = { kind: 'feat', feat: f.id, unlocks: f.unlocks, have, need };
		}
	}
	if (best) return best;
	let low: DeckId | null = null;
	for (const d of DECK_IDS)
		if (isUnlocked(meta, `deck:${d}`) && (meta.stakes[d] ?? 0) < MAX_STAKE)
			if (low === null || (meta.stakes[d] ?? 0) < (meta.stakes[low] ?? 0)) low = d;
	return low ? { kind: 'stake', deck: low, stake: maxStake(meta, low) } : null;
}
