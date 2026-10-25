import { DECKS } from '../data/decks';
import { DEFAULT_UNLOCKS, FEATS, type FeatRule } from '../data/feats';
import { MANHA_BY_ID } from '../data/manhas';
import { MAX_STAKE } from '../data/stakes';
import type { RunState } from './run/run';
import { HISTORY_MAX, type MetaSave, type RunEnd } from './save';

/**
 * Meta-progression (PLAN B2): lifetime stats, history, feats, unlocks and the Almanac. Pure: the
 * scenes call these with the save's `meta` and persist it. Variety only, never power (D-11).
 */
export interface HandInfo {
	won: boolean;
	points: number;
	bet: number;
	lance: string | null;
	weak: boolean;
	/** Your team called truco this hand. */
	called: boolean;
	/** Won after you called truco without a manilha. */
	bluff: boolean;
}

export interface TableInfo {
	won: boolean;
	rivalTentos: number;
	boss?: string;
}

export const isUnlocked = (meta: MetaSave, key: string): boolean =>
	(DEFAULT_UNLOCKS as readonly string[]).includes(key) || meta.unlocked.includes(key);

/** Highest Stake playable with a deck: one above the best won (design §6). */
export const maxStake = (meta: MetaSave, deck: string): number =>
	Math.min(MAX_STAKE, (meta.stakes[deck] ?? 0) + 1);

export function markSeen(meta: MetaSave, ...ids: string[]): void {
	for (const id of ids) if (!meta.seen.includes(id)) meta.seen.push(id);
}

/** Records feats whose rule holds; returns the ids achieved now. */
function achieve(meta: MetaSave, holds: (r: FeatRule) => boolean): string[] {
	const out: string[] = [];
	for (const f of FEATS) {
		if (meta.feats.includes(f.id) || !holds(f.rule)) continue;
		meta.feats.push(f.id);
		if (f.unlocks && !meta.unlocked.includes(f.unlocks)) meta.unlocked.push(f.unlocks);
		out.push(f.id);
	}
	return out;
}

function lifeHolds(meta: MetaSave, r: FeatRule): boolean {
	if (r.on !== 'life') return false;
	const s = meta.stats;
	const v = {
		handsWon: s.handsWon,
		trucosCalled: s.trucosCalled,
		bluffsWon: s.bluffsWon,
		runs: s.runs,
	}[r.k];
	return v >= r.n;
}

export function recordHand(meta: MetaSave, h: HandInfo): string[] {
	const s = meta.stats;
	s.handsPlayed++;
	if (h.won) s.handsWon++;
	if (h.called) s.trucosCalled++;
	if (h.bluff) s.bluffsWon++;
	s.bestHand = Math.max(s.bestHand, h.points);
	return achieve(meta, (r) => {
		if (r.on === 'life') return lifeHolds(meta, r);
		if (r.on !== 'hand' || !h.won) return false;
		switch (r.k) {
			case 'points':
				return h.points >= r.n;
			case 'bet12':
				return h.bet >= 12;
			case 'iron':
				return h.lance === 'ferro';
			case 'weakWin':
				return h.weak;
			case 'bluffWin':
				return h.bluff;
			case 'queda':
			case 'virada':
			case 'onze':
				return h.lance === r.k;
		}
	});
}

export function recordTable(meta: MetaSave, t: TableInfo): string[] {
	if (t.boss) markSeen(meta, `boss:${t.boss}`);
	return achieve(meta, (r) => {
		if (r.on !== 'table' || !t.won) return false;
		if (r.k === 'perfect') return t.rivalTentos === 0;
		if (r.k === 'boss') return t.boss !== undefined;
		return r.k === 'bossId' && t.boss === r.id;
	});
}

/** Feats checked while a run goes on (Championship, money, build). */
export function recordRunState(meta: MetaSave, run: RunState): string[] {
	markSeen(
		meta,
		...run.manhas.map((m) => `manha:${m}`),
		`partner:${run.partner}`,
		`deck:${run.startDeck}`,
	);
	return achieve(meta, (r) => {
		if (r.on !== 'run') return false;
		switch (r.k) {
			case 'champ':
				return run.champ >= r.n;
			case 'endless':
				return run.endless && run.champ >= r.n;
			case 'money':
				return run.money >= r.n;
			case 'legendary':
				return run.manhas.some((m) => MANHA_BY_ID.get(m)?.rarity === 'legendary');
			case 'deckAtMost':
				return run.deck.length <= r.n;
			case 'deckAtLeast':
				return run.deck.length >= r.n;
			default:
				return false;
		}
	});
}

/** End of a run: stats, history, Stake progress and the run feats. */
export function recordRunEnd(meta: MetaSave, run: RunState, reason: RunEnd, at: number): string[] {
	const s = meta.stats;
	const won = reason === 'won';
	if (won) {
		s.wins++;
		meta.stakes[run.startDeck] = Math.max(meta.stakes[run.startDeck] ?? 0, run.stake);
	}
	s.bestChampionship = Math.max(s.bestChampionship, run.champ);
	s.history.unshift({
		at,
		reason,
		championship: run.champ,
		bestHand: run.stats.bestHand,
		deck: run.startDeck,
		partner: run.partner,
		stake: run.stake,
	});
	s.history.length = Math.min(s.history.length, HISTORY_MAX);
	const now = recordRunState(meta, run);
	return [
		...now,
		...achieve(meta, (r) => {
			if (r.on === 'life') return lifeHolds(meta, r);
			if (r.on !== 'run' || !won) return false;
			if (r.k === 'won') return true;
			if (r.k === 'wonWith') return run.partner === r.partner;
			if (r.k === 'wonDeck') return run.startDeck === r.deck;
			if (r.k === 'wonStake') return run.stake >= r.n;
			return false;
		}),
	];
}

/** Starting decks the player can pick. */
export const unlockedDecks = (meta: MetaSave): string[] =>
	Object.keys(DECKS).filter((d) => isUnlocked(meta, `deck:${d}`));
