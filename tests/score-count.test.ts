import { describe, expect, test } from 'bun:test';
import { SCORE_COUNT } from '../src/config/feel-score';
import { Rng } from '../src/logic/rng';
import { buildCountQueue, queueMs } from '../src/logic/score/count-queue';
import { type ScoreStep, scoreHand, totals } from '../src/logic/score/score';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { apply, deal, type Seat, type TableState } from '../src/logic/truco/table';

const c = (id: string): Card => {
	const card = parseCard(id);
	if (!card) throw new Error(id);
	return card;
};

/** Vira 4 of clubs (manilha = 5); our team wins 2-0 (seat 2 takes trick 1, seat 0 trick 2). */
function wonHand(): TableState {
	let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c('4c') });
	s.hands = [
		['4d', 'Ah', 'Qs'],
		['4s', '6d', '7d'],
		['3h', 'Kh', '2s'],
		['4h', '6s', 'Qh'],
	].map((h) => h.map(c)) as TableState['hands'];
	const rng = new Rng(1);
	for (const m of ['4d', '4s', '3h', '4h', 'Kh', '6s', 'Ah', '6d'])
		s = apply(s, { kind: 'play', seat: s.turn as Seat, cardId: c(m).id }, rng).state;
	return s;
}

/** The queue is the steps: same count, same order, same sources, same running totals. */
function expectSameAsSteps(steps: readonly ScoreStep[]): void {
	const q = buildCountQueue(steps);
	expect(q.map((e) => e.step)).toEqual([...steps]);
	expect(q.map((e) => e.index)).toEqual(steps.map((_, i) => i));
	for (const [i, e] of q.entries()) {
		const now = totals(steps.slice(0, i + 1));
		expect([e.chips, e.mult, e.points]).toEqual([now.chips, now.mult, now.points]);
	}
	expect(q.at(-1)?.points).toBe(totals(steps).points);
}

describe('score count queue (R5.4)', () => {
	test('a plain hand: one entry per step, ending on the hand points', () => {
		const hand = scoreHand({ state: wonHand(), queda: false });
		expect(hand.steps.length).toBeGreaterThan(3);
		expectSameAsSteps(hand.steps);
		expect(buildCountQueue(hand.steps).at(-1)?.points).toBe(hand.points);
	});

	test('chips, +Mult and ×Mult steps weigh 1, 2 and 3', () => {
		const steps: ScoreStep[] = [
			{ source: 'lance:limpa', chips: 20 },
			{ source: 'bet', addMult: 3 },
			{ source: 'manha:peQuente', xMult: 2 },
		];
		expectSameAsSteps(steps);
		const q = buildCountQueue(steps);
		expect(q.map((e) => e.weight)).toEqual([1, 2, 3]);
		expect(q.map((e) => e.channel)).toEqual(['chips', 'addMult', 'xMult']);
		expect(q.map((e) => e.named)).toEqual([false, false, true]);
		expect(q[2]?.ms).toBeGreaterThan(q[1]?.ms ?? 0);
		expect(q[1]?.ms).toBeGreaterThan(q[0]?.ms ?? 0);
	});

	test('a trinket perk and flaw from a real hand are marked and keep the order', () => {
		const hand = scoreHand({
			state: wonHand(),
			queda: false,
			trinkets: [
				{ id: 'acoNaManga', level: 1 },
				{ id: 'zapDeOuro', level: 1 },
			],
		});
		const q = buildCountQueue(hand.steps);
		const perk = q.find((e) => e.id === 'acoNaManga');
		const flaw = q.find((e) => e.id === 'zapDeOuro');
		expect(perk?.kind).toBe('trinket');
		expect(perk?.flaw).toBe(false);
		expect(flaw?.flaw).toBe(true);
		expect(flaw?.step.addMult).toBeLessThan(0);
		expectSameAsSteps(hand.steps);
	});

	test('a money step keeps the running totals and a flaw drops the pitch', () => {
		const steps: ScoreStep[] = [
			{ source: 'lance:limpa', chips: 20 },
			{ source: 'bet', addMult: 3 },
			{ source: 'trinket:copoAmericano', money: 1 },
			{ source: 'trinket:x', addMult: -1 },
		];
		expectSameAsSteps(steps);
		const q = buildCountQueue(steps);
		expect(q[2]?.channel).toBe('money');
		expect([q[2]?.chips, q[2]?.mult]).toEqual([q[1]?.chips, q[1]?.mult]);
		expect(q[1]?.rate).toBeGreaterThan(q[0]?.rate ?? 0);
		expect(q[3]?.rate).toBeLessThan(q[2]?.rate ?? 0);
	});

	test('the pitch rises along the count', () => {
		const steps: ScoreStep[] = Array.from({ length: 8 }, (_, i) => ({
			source: `card:c${i}`,
			chips: 5,
		}));
		const rates = buildCountQueue(steps).map((e) => e.rate);
		expect([...rates].sort((a, b) => a - b)).toEqual(rates);
		expect(rates.at(-1)).toBeGreaterThan(rates[0] ?? 0);
	});

	test('a long count speeds up and never passes the ceiling', () => {
		const steps: ScoreStep[] = Array.from({ length: 60 }, (_, i) => ({
			source: i % 3 === 0 ? 'manha:peQuente' : 'bet',
			[i % 3 === 0 ? 'xMult' : 'addMult']: i % 3 === 0 ? 1.1 : 1,
		}));
		expectSameAsSteps(steps);
		const q = buildCountQueue(steps);
		expect(queueMs(q)).toBeLessThanOrEqual(SCORE_COUNT.ceilingMs + 1);
		const half = Math.floor(q.length / 2);
		const avg = (xs: readonly { ms: number }[]): number =>
			xs.reduce((a, e) => a + e.ms, 0) / xs.length;
		expect(avg(q.slice(half))).toBeLessThan(avg(q.slice(0, half)));
		// At 4x the whole count is a quarter of that.
		expect(queueMs(q) / 4).toBeLessThanOrEqual(SCORE_COUNT.ceilingMs / 4 + 1);
	});

	test('a short count is not stretched to the ceiling', () => {
		const q = buildCountQueue([
			{ source: 'lance:limpa', chips: 20 },
			{ source: 'bet', addMult: 3 },
		]);
		expect(queueMs(q)).toBeLessThan(SCORE_COUNT.ceilingMs / 2);
	});
});
