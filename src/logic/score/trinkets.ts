import {
	type EquippedTrinket,
	type Fx,
	type HandCond,
	type TrickFilter,
	trinketValues,
} from '../../data/trinkets';
import { type Card, isJoker, isSpecial, isZap } from '../truco/cards';
import { type Played, type TableState, teamOf } from '../truco/table';
import type { ScoreStep } from './score';

/** What the trinkets need to know about the hand and the table it was played on. */
export interface TrinketFacts {
	state: TableState;
	lance: string | null;
	/** Seat 0's three cards, played and unplayed. */
	myHand: Card[];
	/** Hand number in this table, from 1. */
	handNumber: number;
	/** Points of the table before this hand, and its goal (0 = plain Truco). */
	points: number;
	goal: number;
	/** Tables the player has won in this run (Rei do Pedaço). */
	tablesWon: number;
	/** Chips (without trinkets) and Mult at the point a trinket fires. */
	running: () => { chips: number; mult: number };
}

/** Winning plays of the tricks the pair took, in order. */
function wonPlays(s: TableState): Played[] {
	const out: Played[] = [];
	for (const t of s.tricks) {
		if (t.result !== 'us') continue;
		const win = t.plays.find((p) => p.seat === t.winner);
		if (win) out.push(win);
	}
	return out;
}

const trickMatches = (p: Played, f: TrickFilter, manilha: string): boolean =>
	(!f.manilha || p.card.rank === manilha) &&
	(f.by !== 'partner' || p.seat === 2) &&
	(f.by !== 'me' || p.seat === 0) &&
	(!f.ranks || f.ranks.some((r) => r === p.card.rank)) &&
	(!f.suit || (p.card.suit === f.suit && !isSpecial(p.card)));

function holds(c: HandCond, f: TrinketFacts): boolean {
	const s = f.state;
	const r = s.tricks.map((t) => t.result);
	switch (c) {
		case 'always':
			return true;
		case 'won':
			return s.over?.winner === 'us';
		case 'lost':
			return s.over?.winner === 'them';
		case 'noZapHeld':
			return !f.myHand.some((x) => isZap(x, s.manilha));
		case 'zapWonTrick':
			return wonPlays(s).some((p) => isZap(p.card, s.manilha));
		// The mão de onze is worth 3 with no truco at all, so the bet alone says nothing.
		case 'trucoAccepted':
			return s.lastRaiser !== null;
		case 'noTruco':
		case 'bet1':
			return s.lastRaiser === null && s.over?.reason !== 'fold';
		case 'bet6':
			return s.bet >= 6;
		case 'firstTwoWon':
			return r[0] === 'us' && r[1] === 'us';
		case 'lostFirstWonSecond':
			return r[0] === 'them' && r[1] === 'us';
		case 'wonFirst':
			return r[0] === 'us';
		case 'nearGoal':
			return f.goal > 0 && f.goal - f.points <= f.goal * 0.2;
		case 'farGoal':
			return f.goal > 0 && f.goal - f.points > f.goal * 0.5;
		case 'firstHand':
			return f.handNumber === 1;
		case 'otherHand':
			return f.handNumber > 1;
		case 'bigHand':
			return s.kind !== 'normal';
		case 'normalHand':
			return s.kind === 'normal';
		case 'weakTrucoWin':
			return (
				s.over?.winner === 'us' &&
				s.lastRaiser !== null &&
				f.myHand.every((x) => x.rank !== s.manilha && !['3', '2', 'A'].includes(x.rank))
			);
		case 'weFolded':
			return s.over?.reason === 'fold' && s.over.winner === 'them';
	}
}

/** Chips a played card gains or loses from the trinkets (Flaws and Carteado). Never below 0. */
export function trinketCardChips(
	list: readonly EquippedTrinket[],
	card: Card,
	manilha: string,
	chips: number,
): number {
	let total = chips;
	for (const e of list) {
		const v = trinketValues(e.id, e.level, e.flawX);
		if (!v) continue;
		for (const fx of [v.perk, v.flaw]) {
			if (fx.k !== 'cardChips') continue;
			const special = isSpecial(card);
			const hit =
				(fx.special ? special : true) &&
				(!fx.common ? true : !special && card.rank !== manilha) &&
				(!fx.ranks || fx.ranks.some((r) => r === card.rank)) &&
				(!fx.suit || (card.suit === fx.suit && !special)) &&
				(!fx.manilha || card.rank === manilha);
			if (hit) total += fx.n;
		}
	}
	return Math.max(0, total);
}

/** The steps of one Perk or Flaw (empty when its condition fails). */
function fxSteps(fx: Fx, source: string, f: TrinketFacts): ScoreStep[] {
	const s = f.state;
	const won = wonPlays(s);
	const many = (n: number, make: () => ScoreStep): ScoreStep[] => Array.from({ length: n }, make);
	switch (fx.k) {
		case 'trickChips':
			return many(won.filter((p) => trickMatches(p, fx.f, s.manilha)).length, () => ({
				source,
				chips: fx.n,
			}));
		case 'trickMult':
			return many(won.filter((p) => trickMatches(p, fx.f, s.manilha)).length, () => ({
				source,
				addMult: fx.n,
			}));
		case 'trickMoney':
			return many(won.filter((p) => trickMatches(p, fx.f, s.manilha)).length, () => ({
				source,
				money: fx.n,
			}));
		case 'trickX':
			return many(won.filter((p) => trickMatches(p, fx.f, s.manilha)).length, () => ({
				source,
				xMult: fx.x,
			}));
		case 'handMult':
			return holds(fx.c, f) ? [{ source, addMult: fx.n }] : [];
		case 'handX':
			return holds(fx.c, f) ? [{ source, xMult: fx.x }] : [];
		case 'handChips':
			return holds(fx.c, f) ? [{ source, chips: fx.n }] : [];
		case 'handChipsPct': {
			if (!holds(fx.c, f)) return [];
			return [{ source, chips: Math.round((f.running().chips * fx.n) / 100) }];
		}
		case 'handMoney':
			return holds(fx.c, f) ? [{ source, money: fx.n }] : [];
		case 'baseMult': {
			// A Flaw: it never takes the base Mult below 1.
			const take = Math.min(-fx.n, Math.max(0, f.running().mult - 1));
			return take > 0 ? [{ source, addMult: -take }] : [];
		}
		case 'perSignal': {
			const sent = s.signals.filter((x) => teamOf(x.seat) === 'us').length;
			return many(sent, () => ({ source, chips: fx.n }));
		}
		case 'jokerOpen': {
			const jokers = won.length
				? s.tricks
						.filter((t) => t.result === 'us')
						.flatMap((t) => t.plays)
						.filter((p) => isJoker(p.card) && !p.faceDown && teamOf(p.seat) === 'us')
						.length
				: 0;
			return many(jokers, () => ({ source, chips: fx.n, addMult: fx.m }));
		}
		case 'perTableWon': {
			const n = Math.min(fx.max, f.tablesWon * fx.n);
			return n > 0 ? [{ source, addMult: n }] : [];
		}
		default:
			return [];
	}
}

/**
 * Adds the score steps of the equipped trinkets to `into`, left to right, each Perk then its Flaw. Chips and
 * Mult only count in a won hand and money either way (`scoreHand` drops the rest). Effects that
 * change the card chips themselves (`cardChips`) are applied by `trinketCardChips` instead.
 */
export function trinketSteps(
	list: readonly EquippedTrinket[],
	f: TrinketFacts,
	into: ScoreStep[],
): void {
	for (const e of list) {
		const v = trinketValues(e.id, e.level, e.flawX);
		if (!v) continue;
		const source = `trinket:${e.id}`;
		// Each effect is read after the one before it was added: `running` sees the steps so far.
		into.push(...fxSteps(v.perk, source, f));
		into.push(...fxSteps(v.flaw, source, f));
	}
}
