import { AI_SAMPLES, type AiProfile } from '../../data/ai-profiles';
import { MENTIROSA_BONUS } from '../../data/card-mods';
import type { Rng } from '../rng';
import { type Card, isZap, type Rank, strength } from '../truco/cards';
import type { Observation } from '../truco/observe';
import {
	type Action,
	handWinner,
	MATCH_POINTS,
	nextSeat,
	partnerOf,
	type Seat,
	type Sign,
	type Team,
	type TrickResult,
	teamOf,
} from '../truco/table';

/**
 * Utility AI (PLAN PA2, design §5.4): a Monte Carlo estimate of the hand's win chance from what
 * the seat knows, read through the profile (courage, aggression, bluff) and the caller's Fame.
 */

/**
 * Signal that claims each manilha suit. The wink (`zap`) claims the ZAP itself (PLAN §5.2), so
 * the clubs manilha shares the copas signal ("a top manilha").
 */
const SUIT_SIGN: Record<string, Sign> = {
	clubs: 'copas',
	hearts: 'copas',
	spades: 'espadilha',
	diamonds: 'picafumo',
};
const SIGN_SUIT: Partial<Record<Sign, string>> = {
	copas: 'hearts',
	espadilha: 'spades',
	picafumo: 'diamonds',
};

interface SimPlay {
	seat: Seat;
	s: number;
}

/** Greedy card choice shared by the playout and the real decision. */
function greedyIndex(values: number[], trick: SimPlay[], seat: Seat): number {
	if (values.length === 1) return 0;
	const sorted = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
	const lowest = (sorted[0] as readonly [number, number])[1];
	if (trick.length === 0) {
		// Opening: the middle card keeps the best for later and the worst for sacrifice.
		return (sorted[Math.floor(sorted.length / 2)] as readonly [number, number])[1];
	}
	const best = Math.max(...trick.map((p) => p.s));
	const bestTeams = new Set(trick.filter((p) => p.s === best).map((p) => teamOf(p.seat)));
	if (bestTeams.size === 1 && bestTeams.has(teamOf(seat))) return lowest;
	const winner = sorted.find(([v]) => v > best);
	return winner ? winner[1] : lowest;
}

function trickResult(plays: SimPlay[]): { result: TrickResult; winner: Seat | null } {
	const best = Math.max(...plays.map((p) => p.s));
	const top = plays.filter((p) => p.s === best);
	const teams = new Set(top.map((p) => teamOf(p.seat)));
	if (teams.size > 1) return { result: 'tie', winner: null };
	const first = top[0] as SimPlay;
	return { result: teamOf(first.seat), winner: first.seat };
}

/** Plays the rest of the hand greedily from a full deal of strengths. */
function playout(obs: Observation, hands: number[][]): Team | null {
	const results: TrickResult[] = [];
	let opener: Seat = obs.tricks[0]?.opener ?? nextSeat(obs.dealer);
	let current: SimPlay[] = [];
	for (const t of obs.tricks) {
		if (t.result) {
			results.push(t.result);
			opener = t.winner ?? t.opener;
			continue;
		}
		opener = t.opener;
		current = t.plays.map((p) => ({
			seat: p.seat,
			s: p.card && !p.faceDown ? readStrength(p.card, p.seat, obs) : -1,
		}));
	}
	for (;;) {
		const w = handWinner(results);
		if (w !== undefined) return w;
		let seat = current.length
			? nextSeat((current[current.length - 1] as SimPlay).seat)
			: opener;
		while (current.length < 4) {
			const h = hands[seat] as number[];
			const i = greedyIndex(h, current, seat);
			current.push({ seat, s: h[i] as number });
			h.splice(i, 1);
			seat = nextSeat(seat);
		}
		const r = trickResult(current);
		results.push(r.result);
		opener = r.winner ?? (current[0] as SimPlay).seat;
		current = [];
		if (results.length === 3) return handWinner(results) ?? null;
	}
}

/**
 * Strength of a card on the table as this seat reads it: a Mentirosa played by the player's
 * team looks MENTIROSA_BONUS ranks stronger to the rivals.
 */
function readStrength(card: Card, seat: Seat, obs: Observation): number {
	const real = strength(card, obs.manilha);
	return card.mod === 'mentirosa' && teamOf(seat) === 'us' && obs.team === 'them'
		? real + MENTIROSA_BONUS
		: real;
}

/**
 * Chance that `obs.team` wins the hand: deals the unknown cards many times, honouring known
 * signals most of the time, and plays each deal out greedily.
 */
export function winChance(
	obs: Observation,
	deck: readonly Card[],
	rng: Rng,
	samples = AI_SAMPLES,
): number {
	const known = new Set<string>([obs.vira.id]);
	for (const c of obs.hand ?? []) known.add(c.id);
	for (const c of obs.partnerHand ?? []) known.add(c.id);
	for (const c of obs.partnerMarked) known.add(c.id);
	for (const h of obs.shownHands ?? []) for (const c of h) known.add(c.id);
	for (const t of obs.tricks) for (const p of t.plays) if (p.card) known.add(p.card.id);
	// Face-down cards of others are gone from the pool too, but we do not know which.
	const hidden = obs.tricks.reduce((n, t) => n + t.plays.filter((p) => !p.card).length, 0);
	const pool = deck.filter((c) => !known.has(c.id));
	const partner = partnerOf(obs.seat);
	let wins = 0;
	let ties = 0;
	for (let n = 0; n < samples; n++) {
		const cards = rng.shuffle(pool).slice(hidden);
		const hands: Card[][] = [[], [], [], []];
		for (const seat of [0, 1, 2, 3] as Seat[]) {
			const shown = obs.shownHands?.[seat];
			if (shown) hands[seat] = [...shown];
			else if (seat === obs.seat && obs.hand) hands[seat] = [...obs.hand];
			else if (seat === partner && obs.partnerHand) hands[seat] = [...obs.partnerHand];
			else if (seat === partner) hands[seat] = [...obs.partnerMarked];
		}
		// Signals: the claimed card goes to its sender most of the time (lies exist).
		for (const g of obs.signals) {
			if (g.seat === obs.seat || hands[g.seat]?.length === obs.handSizes[g.seat]) continue;
			const suit = SIGN_SUIT[g.sign];
			const want = cards.findIndex((c) =>
				g.sign === 'zap'
					? isZap(c, obs.manilha)
					: suit
						? c.rank === obs.manilha && c.suit === suit
						: g.sign === 'three' && c.rank === '3',
			);
			if (want >= 0 && rng.chance(0.75))
				hands[g.seat]?.push(cards.splice(want, 1)[0] as Card);
		}
		for (const seat of [0, 1, 2, 3] as Seat[]) {
			const h = hands[seat] as Card[];
			while (h.length < obs.handSizes[seat]) h.push(cards.pop() as Card);
		}
		const values = hands.map((h) => h.map((c) => strength(c, obs.manilha)));
		const w = playout(obs, values);
		if (w === obs.team) wins++;
		else if (w === null) ties++;
	}
	return (wins + ties * 0.5) / samples;
}

/** The honest signal for a hand: the ZAP, else the best manilha, else a 3, else "nothing". */
export function honestSign(hand: readonly Card[], manilha: Rank): Sign {
	if (hand.some((c) => isZap(c, manilha))) return 'zap';
	const manilhas = hand.filter((c) => c.rank === manilha);
	if (manilhas.length) {
		const best = manilhas.reduce((a, b) =>
			strength(b, manilha) > strength(a, manilha) ? b : a,
		);
		return SUIT_SIGN[best.suit] as Sign;
	}
	return hand.some((c) => c.rank === '3') ? 'three' : 'nothing';
}

export interface DecideContext {
	profile: AiProfile;
	/** The run deck (the AI knows its composition). */
	deck: readonly Card[];
	/** Scales the reading of a call when answering it (Manha Cara de Pau: 0.7). */
	callScale?: number;
}

/**
 * Chooses one of `legal` for the observing seat. `legal` must be non-empty
 * (legalActions of the seat).
 */
export function decide(
	obs: Observation,
	legal: readonly Action[],
	ctx: DecideContext,
	rng: Rng,
): Action {
	const { profile } = ctx;
	const core = legal.filter((a) => a.kind !== 'signal');
	if (core.length && rng.chance(profile.error)) return rng.pick(core);
	const has = (kind: Action['kind']) => legal.find((a) => a.kind === kind);

	const eleven = legal.filter((a) => a.kind === 'eleven');
	if (eleven.length) {
		const p = winChance(obs, ctx.deck, rng);
		const play = p > 0.42 - profile.courage * 0.1;
		return eleven.find((a) => a.kind === 'eleven' && a.play === play) as Action;
	}

	if (obs.pending) {
		const p = winChance(obs, ctx.deck, rng);
		// A call claims strength; a caller with a bluffing reputation claims less.
		const read = (p - 0.12) * (ctx.callScale ?? 1);
		const callerTeam = teamOf(obs.pending.by);
		const foldLoses = obs.score[callerTeam] + obs.bet >= MATCH_POINTS;
		const raise = has('truco');
		if (raise && read > 0.8 - profile.aggression * 0.15) return raise;
		if (read > 0.45 - profile.courage * 0.3 || (foldLoses && read > 0.15))
			return has('accept') as Action;
		return has('fold') as Action;
	}

	const signal = legal.find((a) => a.kind === 'signal');
	if (signal && obs.hand && rng.chance(profile.signalRate)) {
		const sign = honestSign(obs.hand, obs.manilha);
		return { kind: 'signal', seat: obs.seat, sign, honest: true };
	}

	const truco = has('truco');
	if (truco) {
		const p = winChance(obs, ctx.deck, rng);
		if (p > 0.72 - profile.aggression * 0.2) return truco;
		if (p < 0.35 && rng.chance(profile.bluff)) return truco;
	}

	const plays = legal.filter((a) => a.kind === 'play' && !a.faceDown);
	if (!plays.length) return rng.pick(legal);
	const hand = obs.hand;
	if (!hand) return rng.pick(plays); // iron hand: blind
	const current = obs.tricks[obs.tricks.length - 1];
	const trick: SimPlay[] = (current?.plays ?? []).map((p) => ({
		seat: p.seat,
		s: p.card && !p.faceDown ? readStrength(p.card, p.seat, obs) : -1,
	}));
	const values = hand.map((c) => strength(c, obs.manilha));
	const card = hand[greedyIndex(values, trick, obs.seat)] as Card;
	return plays.find((a) => a.kind === 'play' && a.cardId === card.id) ?? (plays[0] as Action);
}

/** Random bot: any legal action except signals (reference for the balance goals, D-39). */
export function randomAction(legal: readonly Action[], rng: Rng): Action {
	const core = legal.filter((a) => a.kind !== 'signal');
	return rng.pick(core.length ? core : legal);
}
