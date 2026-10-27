import { describe, expect, test } from 'bun:test';
import { Rng } from '../src/logic/rng';
import { jokerCard, standardDeck } from '../src/logic/truco/cards';
import {
	type Action,
	apply,
	deal,
	legalActions,
	type TableEvent,
	teamOf,
} from '../src/logic/truco/table';
import { fromView, HIDDEN, realAction, toView, viewEvent, viewState } from '../src/net/view';

const SEATS = [0, 1, 2, 3] as const;
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
