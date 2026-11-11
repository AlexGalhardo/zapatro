import { describe, expect, test } from 'bun:test';
import { Match } from '../src/game/match';
import { Rng } from '../src/logic/rng';
import { fullDeck, jokerCard, standardDeck } from '../src/logic/truco/cards';
import {
	type Action,
	apply,
	deal,
	jokerEffects,
	legalActions,
	partnerSeat,
	type Seat,
	type Seats,
	type TableEvent,
	type TableState,
	teamOf,
} from '../src/logic/truco/table';
import { fromView, HIDDEN, realAction, toView, viewEvent, viewState } from '../src/net/view';

const SEATS = [0, 1, 2, 3] as const;
const PLAYERS_2 = [0, 1] as const;
const fresh = () => deal([...standardDeck(), jokerCard()], 3, { us: 0, them: 0 }, new Rng(7));

describe('net view', () => {
	test('seats turn and turn back', () => {
		for (const me of SEATS)
			for (const s of SEATS) {
				expect(fromView(toView(s, me), me)).toBe(s);
				expect(toView(me, me)).toBe(0);
			}
	});

	test('a player sees their own cards and only hidden ones of everybody else', () => {
		const s = fresh();
		for (const me of SEATS) {
			const v = viewState(s, me);
			expect(v.hands[0]).toEqual(s.hands[me]);
			for (const seat of [1, 2, 3] as const) {
				expect(v.hands[seat]).toHaveLength(3);
				expect(v.hands[seat].every((c) => c === HIDDEN)).toBe(true);
			}
			expect(v.stock).toEqual([]);
			expect(v.turn).toBe(toView(s.turn, me));
		}
	});

	test('legal actions of the view match the real ones, seat turned', () => {
		const s = fresh();
		for (const me of SEATS) {
			const real = legalActions(s, me);
			const seen = legalActions(viewState(s, me), 0);
			expect(seen.map((a) => realAction(a, me))).toEqual(real);
		}
	});

	test('an odd seat sees the real "them" as "us"', () => {
		let s = fresh();
		s = { ...s, score: { us: 5, them: 2 } };
		expect(viewState(s, 0).score).toEqual({ us: 5, them: 2 });
		expect(viewState(s, 1).score).toEqual({ us: 2, them: 5 });
	});

	test('a face-down card is hidden from everybody but who played it', () => {
		const s = fresh();
		const rng = new Rng(1);
		// Play out a trick, then cover the second one.
		let st = s;
		const events = [];
		for (let i = 0; i < 8 && !st.over; i++) {
			const legal = legalActions(st, st.pending ? st.pending.responder : st.turn);
			const a = legal.find((x) => x.kind === 'play' && (i >= 4 ? x.faceDown : !x.faceDown));
			if (!a) break;
			const r = apply(st, a, rng);
			st = r.state;
			events.push(...r.events);
		}
		const covered = events.find((e) => e.type === 'played' && e.faceDown);
		if (covered?.type !== 'played') throw new Error('no covered card');
		for (const me of SEATS) {
			const e = viewEvent(covered, me);
			if (e.type !== 'played') throw new Error('type');
			expect(e.card === HIDDEN).toBe(covered.seat !== me);
			expect(e.seat).toBe(toView(covered.seat, me));
		}
	});

	test('a rival signal is shown only to who caught it', () => {
		const e: TableEvent = { type: 'signal', seat: 1, sign: 'zap', caughtBy: [2] };
		const caught = viewEvent(e, 2);
		expect(caught.type === 'signal' && caught.sign).toBe('zap');
		const blind = viewEvent(e, 0);
		expect(blind.type === 'signal' && blind.sign).toBe('nothing');
		const partner = viewEvent({ ...e, seat: 3, caughtBy: [] }, 1);
		expect(partner.type === 'signal' && partner.sign).toBe('zap');
	});

	test('the view of a finished hand names the winner in the viewer’s own teams', () => {
		const s = fresh();
		const over = { ...s, over: { winner: 'us', tentos: 1, reason: 'tricks' } } as const;
		expect(viewState(over, 0).over?.winner).toBe('us');
		expect(viewState(over, 1).over?.winner).toBe('them');
		const a: Action = { kind: 'accept', seat: 0 };
		expect(teamOf(realAction(a, 3).seat)).toBe('them');
	});
});

describe('net view, mano a mano', () => {
	const duel = () =>
		deal([...standardDeck(), jokerCard()], 1, { us: 0, them: 0 }, new Rng(7), { seats: 2 });

	test('two seats turn modulo two and turn back', () => {
		for (const me of PLAYERS_2)
			for (const s of PLAYERS_2) {
				expect(fromView(toView(s, me, 2), me, 2)).toBe(s);
				expect(toView(me, me, 2)).toBe(0);
			}
		expect(toView(0, 1, 2)).toBe(1);
		expect(toView(1, 1, 2)).toBe(0);
	});

	test('each player sees their own hand, a hidden one for the rival and nothing at seats 2 and 3', () => {
		const s = duel();
		for (const me of PLAYERS_2) {
			const v = viewState(s, me);
			expect(v.seats).toBe(2);
			expect(v.hands[0]).toEqual(s.hands[me]);
			expect(v.hands[1]).toHaveLength(3);
			expect(v.hands[1].every((c) => c === HIDDEN)).toBe(true);
			expect(v.hands[2]).toEqual([]);
			expect(v.hands[3]).toEqual([]);
			expect(v.turn).toBe(toView(s.turn, me, 2));
			expect(v.dealer).toBe(toView(s.dealer, me, 2));
		}
	});

	test('seat 1 sees the real "them" as "us" and gets the same legal actions', () => {
		const s = { ...duel(), score: { us: 5, them: 2 } };
		expect(viewState(s, 1).score).toEqual({ us: 2, them: 5 });
		for (const me of PLAYERS_2) {
			const seen = legalActions(viewState(s, me), 0);
			expect(seen.map((a) => realAction(a, me, 2))).toEqual(legalActions(s, me));
		}
	});

	test('a played hand turns every event and the winner into the viewer seats', () => {
		let s = duel();
		const rng = new Rng(3);
		while (!s.over) {
			const seat = (s.pending ? s.pending.responder : s.turn) as Seat;
			const a = legalActions(s, seat).find((x) => x.kind === 'play') as Action;
			const r = apply(s, a, rng);
			for (const me of PLAYERS_2)
				for (const e of r.events) {
					const v = viewEvent(e, me, 2);
					if (v.type === 'played' && e.type === 'played')
						expect(v.seat).toBe(toView(e.seat, me, 2));
					if (v.type === 'trick' && e.type === 'trick' && e.winner !== undefined)
						expect(v.winner).toBe(toView(e.winner, me, 2));
				}
			s = r.state;
		}
		expect(viewState(s, 0).over?.winner).toBe(s.over?.winner ?? null);
		expect(viewState(s, 1).tricks[0]?.opener).toBe(toView(s.tricks[0]?.opener as Seat, 1, 2));
	});
});

/** Card ids on the wire: every `id` and `cardId` of a message (a card or a peek record). */
const idsIn = (message: unknown): string[] =>
	[...JSON.stringify(message).matchAll(/"(?:id|cardId)":"([^"]+)"/g)].map((m) => m[1] as string);

/**
 * What `me` may read in the real state, worked out from the rules alone (not from view.ts): own
 * hand, every card played face up (and own face-down ones), the vira, what its pair peeked with the
 * Olho while that card is still in the rival's hand, the partner's hand on an 11, all hands after
 * the showdown.
 */
function entitled(s: TableState, me: Seat): Set<string> {
	const ok = new Set<string>(['hidden', s.vira.id]);
	for (const c of s.hands[me]) ok.add(c.id);
	if (jokerEffects(s).includes('showdown'))
		for (const h of s.hands) for (const c of h) ok.add(c.id);
	const mate = partnerSeat(me, s.seats);
	if (s.kind === 'eleven' && s.elevenTeam === teamOf(me) && mate !== null)
		for (const c of s.hands[mate]) ok.add(c.id);
	for (const k of s.known)
		if (k.to === teamOf(me) && s.hands[k.seat].some((c) => c.id === k.cardId)) ok.add(k.cardId);
	for (const t of s.tricks)
		for (const p of t.plays) if (!p.faceDown || p.seat === me) ok.add(p.card.id);
	return ok;
}

describe('net view with the special cards: nothing hidden leaks', () => {
	/** Plays seeded matches of random bots with the full deck and checks every view of every message. */
	const run = (seats: Seats, seed: number) => {
		const brains = Array.from({ length: seats }, () => ({ kind: 'random' as const }));
		const m = new Match({
			rng: new Rng(seed),
			brains: brains as ConstructorParameters<typeof Match>[0]['brains'],
			deck: fullDeck(),
		});
		const effects = new Set<string>();
		let peeked = 0;
		let messages = 0;
		const players = Array.from({ length: seats }, (_, i) => i as Seat);
		const check = (events: TableEvent[]): void => {
			for (const me of players) {
				const ok = entitled(m.state, me);
				const v = viewState(m.state, me);
				for (const piece of [v, ...events.map((e) => viewEvent(e, me, seats))]) {
					for (const id of idsIn(piece)) expect(ok.has(id)).toBe(true);
					messages++;
				}
				const rivalCards = v.hands.slice(1, seats).flat();
				if (
					v.known.length > 0 &&
					rivalCards.some((c) => c !== HIDDEN) &&
					!jokerEffects(m.state).includes('showdown') &&
					m.state.kind !== 'eleven'
				)
					peeked++;
			}
		};
		for (let hand = 0; hand < 40 && !m.winner; hand++) {
			check([]);
			for (let a = m.actor(); a !== null; a = m.actor()) {
				const events = m.act(m.aiAction(a));
				for (const e of events) if (e.type === 'joker') effects.add(e.effect);
				check(events);
			}
			if (!m.winner) m.nextHand();
		}
		return { effects, peeked, messages };
	};

	for (const seats of [4, 2] as const)
		test(`${seats} seats: each view of each message holds only what the rules let that seat read`, () => {
			const all = new Set<string>();
			let peeked = 0;
			let messages = 0;
			for (let seed = 1; seed <= 60; seed++) {
				const r = run(seats, seed);
				for (const e of r.effects) all.add(e);
				peeked += r.peeked;
				messages += r.messages;
			}
			// The masking-relevant effects really happened, and the Olho showed cards to its pair.
			for (const e of ['peek', 'showdown', 'swap', 'redraw', 'shield', 'freeze'])
				expect(all.has(e)).toBe(true);
			expect(peeked).toBeGreaterThan(0);
			expect(messages).toBeGreaterThan(1000);
		});

	test('a peeked card is shown to the pair that played the Olho and to nobody else', () => {
		const s = deal(fullDeck(), 3, { us: 0, them: 0 }, new Rng(5));
		const card = s.hands[1][0] as { id: string };
		const peek: TableState = { ...s, known: [{ seat: 1, cardId: card.id, to: 'us' }] };
		for (const me of SEATS) {
			const v = viewState(peek, me);
			const pair = teamOf(me) === 'us';
			// Seat 1 owns the card, so it reads it in its own hand.
			const reads = pair || me === 1;
			expect(v.hands[toView(1, me)].some((c) => c.id === card.id)).toBe(reads);
			expect(v.known).toHaveLength(pair ? 1 : 0);
			expect(JSON.stringify(v).includes(`"${card.id}"`)).toBe(reads);
		}
	});
});
