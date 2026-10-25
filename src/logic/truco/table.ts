import { JOKER_EFFECTS, JOKER_WORTH, type JokerEffect } from '../../data/jokers';
import type { Rng } from '../rng';
import {
	type Card,
	isJoker,
	JOKER,
	manilhaOf,
	type Rank,
	strength,
	viraManilha,
	ZAP_STRENGTH,
} from './cards';

/**
 * One hand of Truco Paulista as a turn-based state machine (PLAN §4.2, §5). Every decision is an
 * `Action` from `legalActions`; `apply` returns the next state and the domain events the scene
 * animates. Seats go counter-clockwise: 0 = you (bottom), 1 = right rival, 2 = partner (top),
 * 3 = left rival.
 */

export type Seat = 0 | 1 | 2 | 3;
export type Team = 'us' | 'them';
export const SEATS: readonly Seat[] = [0, 1, 2, 3];

export const teamOf = (s: Seat): Team => (s % 2 === 0 ? 'us' : 'them');
export const otherTeam = (t: Team): Team => (t === 'us' ? 'them' : 'us');
export const nextSeat = (s: Seat): Seat => ((s + 1) % 4) as Seat;
export const partnerOf = (s: Seat): Seat => ((s + 2) % 4) as Seat;

export const BETS = [1, 3, 6, 9, 12] as const;
export type Bet = (typeof BETS)[number];
const nextBet = (b: Bet): Bet => BETS[Math.min(BETS.length - 1, BETS.indexOf(b) + 1)] as Bet;

/** Traditional signals (D-35): what the sender claims to hold. */
export const SIGNS = ['zap', 'copas', 'espadilha', 'picafumo', 'three', 'nothing'] as const;
export type Sign = (typeof SIGNS)[number];

/** Tentos to win a match. */
export const MATCH_POINTS = 12;
/** Hand value of a mão de 11 that is played (§5.9). */
const ELEVEN_BET: Bet = 3;

export type Action =
	| { kind: 'play'; seat: Seat; cardId: string; faceDown?: boolean }
	| { kind: 'truco'; seat: Seat }
	| { kind: 'accept'; seat: Seat }
	| { kind: 'fold'; seat: Seat }
	| { kind: 'signal'; seat: Seat; sign: Sign; honest: boolean }
	| { kind: 'eleven'; seat: Seat; play: boolean };

export interface Played {
	seat: Seat;
	card: Card;
	faceDown: boolean;
	/** What the joker drew when it was played face up. */
	effect?: JokerEffect;
}

export type TrickResult = Team | 'tie';

export interface Trick {
	opener: Seat;
	plays: Played[];
	result?: TrickResult;
	/** Seat whose card won (absent on a tie). */
	winner?: Seat;
}

/** A truco call (or raise) waiting for an answer. */
export interface Pending {
	by: Seat;
	to: Bet;
	responder: Seat;
	/** Whose turn it was when the betting started (play resumes there). */
	resume: Seat;
}

export type HandKind = 'normal' | 'eleven' | 'iron';
export type HandEndReason = 'tricks' | 'fold' | 'elevenFold';

export interface HandEnd {
	/** null = nobody scores (all three tricks tied, D-36). */
	winner: Team | null;
	tentos: number;
	reason: HandEndReason;
}

export interface SignalRecord {
	seat: Seat;
	sign: Sign;
	honest: boolean;
	/** Rival seats that caught the signal. */
	caughtBy: Seat[];
}

export interface TableRules {
	/** Signals each seat may send per hand. */
	signals: [number, number, number, number];
	/** Chance that this seat catches a rival's signal (profile, Manhas). */
	catchChance: [number, number, number, number];
	/** Normal hands start at this bet instead of 1 (Manha Rei da Mesa). */
	startBet?: Bet;
	/** The first accepted call of this team jumps one extra step, 3 → 6 (Manha Gritador). */
	bonusStep?: Team;
	/**
	 * Seat 0 answers every call against its team: the partner never accepts, raises or runs
	 * for the player (run option "partner may run").
	 */
	humanAnswers?: boolean;
}

export const DEFAULT_RULES: TableRules = {
	signals: [1, 1, 1, 1],
	catchChance: [0.2, 0.2, 0.2, 0.2],
};

export interface TableState {
	rules: TableRules;
	/** Tentos before this hand ends (updated when it does). */
	score: Record<Team, number>;
	dealer: Seat;
	hands: [Card[], Card[], Card[], Card[]];
	vira: Card;
	manilha: Rank;
	/** Cards left after the deal and the vira (the joker's `newVira` turns one). */
	stock: Card[];
	kind: HandKind;
	/** Team deciding the mão de 11 (kind 'eleven'). */
	elevenTeam: Team | null;
	elevenDecided: boolean;
	tricks: Trick[];
	turn: Seat;
	bet: Bet;
	/** Team whose call was last accepted: it cannot raise again (§5.7). */
	lastRaiser: Team | null;
	pending: Pending | null;
	signalsLeft: [number, number, number, number];
	signals: SignalRecord[];
	over: HandEnd | null;
}

export type TableEvent =
	| { type: 'played'; seat: Seat; card: Card; faceDown: boolean }
	| { type: 'joker'; seat: Seat; effect: JokerEffect }
	| { type: 'vira'; vira: Card; manilha: Rank }
	| { type: 'trick'; index: number; result: TrickResult; winner?: Seat }
	| { type: 'truco'; seat: Seat; to: Bet }
	| { type: 'accepted'; seat: Seat; bet: Bet }
	| { type: 'folded'; seat: Seat }
	| { type: 'signal'; seat: Seat; sign: Sign; caughtBy: Seat[] }
	| { type: 'eleven'; team: Team; play: boolean }
	| { type: 'handOver'; end: HandEnd; score: Record<Team, number> };

export class IllegalAction extends Error {}

/** First seat to play: right of the dealer (counter-clockwise, D-53). */
export const handStarter = (dealer: Seat): Seat => nextSeat(dealer);

export interface DealOptions {
	rules?: TableRules;
	/** Cards to force (debug, tests): the vira and seat 0's hand. */
	vira?: Card;
	hand0?: Card[];
	/** Chance that the vira makes a card of seat 0's hand a manilha (Manha Vira Viciada). */
	rigVira?: number;
	/** Chance that the vira makes a rival card a manilha (boss A Sortuda). */
	rigViraRivals?: number;
}

/** Cards a hand needs: 3 per seat plus the vira. */
export const CARDS_PER_HAND = 13;

/**
 * Deals a new hand from `deck` (the run's shared deck, any size ≥ 13): 3 cards per seat in turn
 * order from the starter, then the vira.
 */
export function deal(
	deck: readonly Card[],
	dealer: Seat,
	score: Record<Team, number>,
	rng: Rng,
	opts: DealOptions = {},
): TableState {
	if (deck.length < CARDS_PER_HAND) throw new Error('deal: deck too small');
	const forced = [...(opts.hand0 ?? []), ...(opts.vira ? [opts.vira] : [])];
	const pile = rng.shuffle(deck.filter((c) => !forced.some((f) => f.id === c.id)));
	const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];
	if (opts.hand0) hands[0] = opts.hand0.slice(0, 3);
	let seat = handStarter(dealer);
	for (let round = 0; round < 3; round++)
		for (let i = 0; i < 4; i++) {
			const h = hands[seat];
			if (h.length < 3) h.push(pile.pop() as Card);
			seat = nextSeat(seat);
		}
	let vira = opts.vira ?? turnVira(pile);
	if (!opts.vira && opts.rigVira && rng.chance(opts.rigVira)) {
		const mine = new Set(hands[0].map((c) => c.rank));
		const rigged = pile.filter((c) => c.rank !== JOKER && mine.has(manilhaOf(c.rank)));
		if (rigged.length) vira = rng.pick(rigged);
	}
	if (!opts.vira && opts.rigViraRivals && rng.chance(opts.rigViraRivals)) {
		const theirs = new Set([...hands[1], ...hands[3]].map((c) => c.rank));
		const rigged = pile.filter((c) => c.rank !== JOKER && theirs.has(manilhaOf(c.rank)));
		if (rigged.length) vira = rng.pick(rigged);
	}
	const eleven: Team[] = (['us', 'them'] as const).filter((t) => score[t] === MATCH_POINTS - 1);
	const kind: HandKind = eleven.length === 2 ? 'iron' : eleven.length === 1 ? 'eleven' : 'normal';
	const rules = opts.rules ?? DEFAULT_RULES;
	return {
		rules,
		score: { ...score },
		dealer,
		hands,
		vira,
		manilha: viraManilha(vira),
		stock: pile.filter((c) => c.id !== vira.id),
		kind,
		elevenTeam: kind === 'eleven' ? (eleven[0] ?? null) : null,
		elevenDecided: kind !== 'eleven',
		tricks: [{ opener: handStarter(dealer), plays: [] }],
		turn: handStarter(dealer),
		bet: kind === 'normal' ? (rules.startBet ?? 1) : 1,
		lastRaiser: null,
		pending: null,
		signalsLeft: kind === 'iron' ? [0, 0, 0, 0] : [...rules.signals],
		signals: [],
		over: null,
	};
}

/**
 * Turns the vira from the pile. The joker is never the vira: it goes to the bottom and the next
 * card turns (PLAN §5.12).
 */
function turnVira(pile: Card[]): Card {
	let vira = pile.pop() as Card;
	while (isJoker(vira) && pile.some((c) => !isJoker(c))) {
		pile.unshift(vira);
		vira = pile.pop() as Card;
	}
	return vira;
}

/** The seat that decides a mão de 11: the first of that team in playing order. */
export function elevenDecider(s: TableState): Seat | null {
	if (s.kind !== 'eleven' || s.elevenDecided || !s.elevenTeam) return null;
	let seat = handStarter(s.dealer);
	while (teamOf(seat) !== s.elevenTeam) seat = nextSeat(seat);
	return seat;
}

export const currentTrick = (s: TableState): Trick => s.tricks[s.tricks.length - 1] as Trick;

const hasPlayed = (s: TableState, seat: Seat): boolean =>
	s.tricks.some((t) => t.plays.some((p) => p.seat === seat));

/** Who answers a call against `seat`'s team: that seat, or the player when the rules say so. */
const answerer = (s: TableState, seat: Seat): Seat =>
	s.rules.humanAnswers && teamOf(seat) === 'us' ? 0 : seat;

export function canCallTruco(s: TableState, seat: Seat): boolean {
	return (
		s.kind === 'normal' &&
		!s.over &&
		s.elevenDecided &&
		s.bet < 12 &&
		s.lastRaiser !== teamOf(seat) &&
		(s.pending ? s.pending.responder === seat && s.pending.to < 12 : s.turn === seat)
	);
}

export function legalActions(s: TableState, seat: Seat): Action[] {
	if (s.over) return [];
	const decider = elevenDecider(s);
	if (decider !== null)
		return decider === seat
			? [
					{ kind: 'eleven', seat, play: true },
					{ kind: 'eleven', seat, play: false },
				]
			: [];
	if (s.pending) {
		if (s.pending.responder !== seat) return [];
		const out: Action[] = [
			{ kind: 'accept', seat },
			{ kind: 'fold', seat },
		];
		if (s.pending.to < 12) out.push({ kind: 'truco', seat });
		return out;
	}
	if (s.turn !== seat) return [];
	const out: Action[] = [];
	// Face down is allowed from the second trick on (D-34); the iron hand is blind anyway.
	const canCover = s.tricks.length >= 2 && s.kind !== 'iron';
	for (const card of s.hands[seat]) {
		out.push({ kind: 'play', seat, cardId: card.id });
		if (canCover) out.push({ kind: 'play', seat, cardId: card.id, faceDown: true });
	}
	if (canCallTruco(s, seat)) out.push({ kind: 'truco', seat });
	if (s.signalsLeft[seat] > 0 && !hasPlayed(s, seat))
		for (const sign of ['zap', 'copas', 'espadilha', 'picafumo', 'three', 'nothing'] as const)
			for (const honest of [true, false]) out.push({ kind: 'signal', seat, sign, honest });
	return out;
}

/** Hand result from the trick results so far: a team, null (nobody) or undefined (go on). */
export function handWinner(results: readonly TrickResult[]): Team | null | undefined {
	const [a, b, c] = results;
	if (results.length < 2 || !a || !b) return undefined;
	if (results.length === 2) {
		if (a === 'tie') return b === 'tie' ? undefined : b;
		if (b === 'tie') return a;
		return a === b ? a : undefined;
	}
	if (!c) return undefined;
	if (c !== 'tie') return c;
	return a !== 'tie' ? a : null;
}

/** Strength of each play in a trick, the joker's effect included (`copycat` copies the best before it). */
export function trickValues(t: Trick, manilha: Rank): number[] {
	const values: number[] = [];
	for (const p of t.plays) {
		const base = strength(p.card, manilha, p.faceDown);
		values.push(
			p.effect === 'zap'
				? ZAP_STRENGTH
				: p.effect === 'dud'
					? -1
					: p.effect === 'copycat'
						? Math.max(base, ...values.filter((_, i) => !t.plays[i]?.faceDown))
						: base,
		);
	}
	return values;
}

/**
 * Winner of a full trick. Joker effects: `void` makes it a tie; `upsideDown` makes the weakest
 * face-up card win (face-down cards never win, D-34).
 */
export function resolveTrick(t: Trick, manilha: Rank): void {
	const values = trickValues(t, manilha);
	if (t.plays.some((p) => p.effect === 'void')) {
		t.result = 'tie';
		return;
	}
	const upside = t.plays.some((p) => p.effect === 'upsideDown');
	const open = t.plays.map((p, i) => (p.faceDown ? null : (values[i] as number)));
	const face = open.filter((v): v is number => v !== null);
	const best = !face.length ? -1 : upside ? Math.min(...face) : Math.max(...face);
	const top = t.plays.filter((_, i) => (face.length ? open[i] === best : true));
	const teams = new Set(top.map((p) => teamOf(p.seat)));
	if (teams.size > 1) t.result = 'tie';
	else {
		t.result = teamOf((top[0] as Played).seat);
		t.winner = (top[0] as Played).seat;
	}
}

/**
 * The joker's effect for a play (equal odds). Effects that cannot happen are left out: no
 * `newVira` without a card to turn, no `copycat` as the trick's first face-up card.
 */
export function drawJokerEffect(s: TableState, rng: Rng): JokerEffect {
	const canTurn = s.stock.some((c) => !isJoker(c));
	const canCopy = currentTrick(s).plays.some((p) => !p.faceDown);
	return rng.pick(
		JOKER_EFFECTS.filter((e) => (e !== 'newVira' || canTurn) && (e !== 'copycat' || canCopy)),
	);
}

/** Effects that change the hand right away (the rest act when the trick or the hand ends). */
function applyJoker(s: TableState, effect: JokerEffect, events: TableEvent[]): void {
	if (effect === 'worth3' && s.bet < JOKER_WORTH) s.bet = JOKER_WORTH;
	if (effect === 'newVira') {
		const i = s.stock.findIndex((c) => !isJoker(c));
		const vira = s.stock.splice(i, 1)[0] as Card;
		s.vira = vira;
		s.manilha = viraManilha(vira);
		events.push({ type: 'vira', vira, manilha: s.manilha });
	}
}

/** Joker effects drawn so far in the hand, in order. */
export const jokerEffects = (s: TableState): JokerEffect[] =>
	s.tricks.flatMap((t) => t.plays.flatMap((p) => (p.effect ? [p.effect] : [])));

function finish(s: TableState, end: HandEnd, events: TableEvent[]): void {
	s.over = end;
	s.pending = null;
	if (end.winner) s.score[end.winner] += end.tentos;
	events.push({ type: 'handOver', end, score: { ...s.score } });
}

const isSame = (a: Action, b: Action): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Applies a legal action. Throws IllegalAction otherwise (the UI and the AI only offer legal
 * ones). Returns a new state; the input is not modified.
 */
export function apply(
	state: TableState,
	action: Action,
	rng: Rng,
): { state: TableState; events: TableEvent[] } {
	const legal = legalActions(state, action.seat).some((a) =>
		isSame(
			a,
			action.kind === 'play' ? { ...action, faceDown: action.faceDown || undefined } : action,
		),
	);
	if (!legal) throw new IllegalAction(`illegal ${JSON.stringify(action)}`);
	const s = structuredClone(state);
	const events: TableEvent[] = [];
	const team = teamOf(action.seat);
	switch (action.kind) {
		case 'eleven': {
			s.elevenDecided = true;
			events.push({ type: 'eleven', team, play: action.play });
			if (action.play) s.bet = ELEVEN_BET;
			else finish(s, { winner: otherTeam(team), tentos: 1, reason: 'elevenFold' }, events);
			break;
		}
		case 'signal': {
			s.signalsLeft[action.seat]--;
			const caughtBy = [nextSeat(action.seat), nextSeat(partnerOf(action.seat))].filter((r) =>
				rng.chance(s.rules.catchChance[r]),
			);
			s.signals.push({
				seat: action.seat,
				sign: action.sign,
				honest: action.honest,
				caughtBy,
			});
			events.push({ type: 'signal', seat: action.seat, sign: action.sign, caughtBy });
			break;
		}
		case 'truco': {
			if (s.pending) {
				// Raising accepts the call on the table first.
				s.bet = s.pending.to;
				s.lastRaiser = teamOf(s.pending.by);
				s.pending = {
					by: action.seat,
					to: nextBet(s.pending.to),
					responder: answerer(s, s.pending.by),
					resume: s.pending.resume,
				};
			} else
				s.pending = {
					by: action.seat,
					to: nextBet(s.bet),
					responder: answerer(s, nextSeat(action.seat)),
					resume: action.seat,
				};
			events.push({ type: 'truco', seat: action.seat, to: s.pending.to });
			break;
		}
		case 'accept': {
			const p = s.pending as Pending;
			s.bet = p.to;
			if (s.rules.bonusStep === teamOf(p.by)) {
				s.bet = nextBet(p.to);
				s.rules = { ...s.rules, bonusStep: undefined };
			}
			s.lastRaiser = teamOf(p.by);
			s.turn = p.resume;
			s.pending = null;
			events.push({ type: 'accepted', seat: action.seat, bet: s.bet });
			break;
		}
		case 'fold': {
			const p = s.pending as Pending;
			events.push({ type: 'folded', seat: action.seat });
			finish(s, { winner: teamOf(p.by), tentos: s.bet, reason: 'fold' }, events);
			break;
		}
		case 'play': {
			const hand = s.hands[action.seat];
			const i = hand.findIndex((c) => c.id === action.cardId);
			const card = hand.splice(i, 1)[0] as Card;
			const faceDown = action.faceDown === true;
			const trick = currentTrick(s);
			const effect = isJoker(card) && !faceDown ? drawJokerEffect(s, rng) : undefined;
			trick.plays.push({ seat: action.seat, card, faceDown, ...(effect ? { effect } : {}) });
			events.push({ type: 'played', seat: action.seat, card, faceDown });
			if (effect) {
				events.push({ type: 'joker', seat: action.seat, effect });
				applyJoker(s, effect, events);
			}
			if (trick.plays.length < 4) {
				s.turn = nextSeat(action.seat);
				break;
			}
			resolveTrick(trick, s.manilha);
			events.push({
				type: 'trick',
				index: s.tricks.length - 1,
				result: trick.result as TrickResult,
				winner: trick.winner,
			});
			const winner = handWinner(s.tricks.map((t) => t.result as TrickResult));
			if (winner !== undefined) {
				finish(s, { winner, tentos: winner ? s.bet : 0, reason: 'tricks' }, events);
				break;
			}
			const opener = trick.winner ?? trick.opener;
			s.tricks.push({ opener, plays: [] });
			s.turn = opener;
			break;
		}
	}
	return { state: s, events };
}

/** Next dealer after a hand (counter-clockwise rotation). */
export const nextDealer = (dealer: Seat): Seat => nextSeat(dealer);

/** Match winner, if any team reached MATCH_POINTS. */
export function matchWinner(score: Record<Team, number>): Team | null {
	if (score.us >= MATCH_POINTS) return 'us';
	if (score.them >= MATCH_POINTS) return 'them';
	return null;
}
