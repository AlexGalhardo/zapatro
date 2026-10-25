import { describe, expect, test } from 'bun:test';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { type SeatBrain, simulateMatch } from '../src/game/match';
import { decide, honestSign, winChance } from '../src/logic/ai/decide';
import { fameAfterShowdown, isStrongCall } from '../src/logic/ai/fame';
import { Rng } from '../src/logic/rng';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { observe } from '../src/logic/truco/observe';
import { apply, deal, legalActions, type TableState } from '../src/logic/truco/table';
import { MS_PER_MATCH, workTimeout } from './budget';

const c = (id: string): Card => parseCard(id) as Card;

function fixed(hands: string[][], vira: string): TableState {
	const s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c(vira) });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	return s;
}

describe('observe (PA1.7)', () => {
	test('a seat never sees other hands, nor face-down cards of others', () => {
		let s = fixed(
			[
				['3c', '3d', 'Qh'],
				['2s', '6s', '7s'],
				['4h', '5h', '6h'],
				['4c', '6c', '7c'],
			],
			'Kh',
		);
		const o = observe(s, 1);
		expect(o.hand?.map((x) => x.id)).toEqual(['2s', '6s', '7s']);
		expect(o.partnerHand).toBeNull();
		expect(JSON.stringify(o)).not.toContain('"3d"');
		const rng = new Rng(1);
		for (const a of [
			{ kind: 'play', seat: 0, cardId: '3c' },
			{ kind: 'play', seat: 1, cardId: '2s' },
			{ kind: 'play', seat: 2, cardId: '4h' },
			{ kind: 'play', seat: 3, cardId: '4c' },
			{ kind: 'play', seat: 0, cardId: 'Qh', faceDown: true },
		] as const)
			s = apply(s, a, rng).state;
		expect(observe(s, 1).tricks[1]?.plays[0]?.card).toBeNull();
		expect(observe(s, 0).tricks[1]?.plays[0]?.card?.id).toBe('Qh');
	});

	test('mão de 11: the team at 11 sees the partner hand; the iron hand hides your own', () => {
		const eleven = deal(standardDeck(), 3, { us: 11, them: 2 }, new Rng(5));
		expect(observe(eleven, 0).partnerHand).toHaveLength(3);
		expect(observe(eleven, 1).partnerHand).toBeNull();
		const iron = deal(standardDeck(), 3, { us: 11, them: 11 }, new Rng(5));
		expect(observe(iron, 0).hand).toBeNull();
	});
});

describe('AI decisions (PA2)', () => {
	test('win chance grows with the hand', () => {
		const strong = fixed(
			[
				['Kc', 'Kh', '3c'],
				['4s', '5s', '6s'],
				['4h', '5h', '6h'],
				['4c', '5c', '6c'],
			],
			'Jd',
		);
		const weak = fixed(
			[
				['4d', '5d', '6d'],
				['4s', '5s', '6s'],
				['4h', '5h', '6h'],
				['4c', '5c', '6c'],
			],
			'Jd',
		);
		const rng = new Rng(3);
		const deck = standardDeck();
		expect(winChance(observe(strong, 0), deck, rng, 200)).toBeGreaterThan(0.8);
		expect(winChance(observe(weak, 0), deck, rng, 200)).toBeLessThan(0.5);
	});

	test('monotonic: a stronger hand never folds more often than a weaker one', () => {
		const deck = standardDeck();
		const foldRate = (hand: string[]): number => {
			let folds = 0;
			for (let seed = 1; seed <= 60; seed++) {
				const s = fixed(
					[['4s', '5s', '6s'], hand, ['4h', '5h', '6h'], ['4c', '5c', '6c']],
					'Jd',
				);
				const rng = new Rng(seed);
				const called = apply(s, { kind: 'truco', seat: 0 }, rng).state;
				const a = decide(
					observe(called, 1),
					legalActions(called, 1),
					{ profile: { ...AI_PROFILES.calculator, error: 0 }, deck, rivalFame: 0 },
					rng,
				);
				if (a.kind === 'fold') folds++;
			}
			return folds;
		};
		const strongFolds = foldRate(['Kc', 'Kh', '3d']);
		const weakFolds = foldRate(['4d', '5d', '6d']);
		expect(strongFolds).toBeLessThanOrEqual(weakFolds);
		expect(weakFolds).toBeGreaterThan(0);
	});

	test('honest sign names the ZAP, the best manilha, then a 3, else nothing', () => {
		// Manilha K: the ZAP is the A♣; the clubs manilha signals copas (PLAN §5.8).
		expect(honestSign([c('Ac'), c('Kd'), c('4s')], 'K')).toBe('zap');
		expect(honestSign([c('Kd'), c('Kc'), c('4s')], 'K')).toBe('copas');
		expect(honestSign([c('Kd'), c('Ks'), c('4s')], 'K')).toBe('espadilha');
		expect(honestSign([c('3d'), c('4s'), c('5s')], 'K')).toBe('three');
		expect(honestSign([c('4d'), c('4s'), c('5s')], 'K')).toBe('nothing');
	});

	test('a decision takes well under 5 ms (PLAN §9)', () => {
		const rng = new Rng(9);
		const deck = standardDeck();
		const times: number[] = [];
		for (let i = 0; i < 200; i++) {
			const s = deal(deck, 3, { us: 0, them: 0 }, rng);
			// Each decision runs 5 times on the same state and seed and keeps the fastest: the
			// scheduler can stall any single run when the machine is busy (wall clock, not CPU),
			// but a decision that really costs 5 ms costs it every time. CPU time would be the
			// direct measure, but process.cpuUsage() ticks every ~15.6 ms on Windows.
			let best = Number.POSITIVE_INFINITY;
			for (let k = 0; k < 5; k++) {
				const t0 = performance.now();
				decide(
					observe(s, 0),
					legalActions(s, 0),
					{ profile: AI_PROFILES.pro, deck, rivalFame: 0 },
					new Rng(1000 + i),
				);
				best = Math.min(best, performance.now() - t0);
			}
			times.push(best);
		}
		times.sort((a, b) => a - b);
		expect(times[Math.floor(times.length * 0.99)]).toBeLessThan(5);
	});
});

describe('Fame (design §5.3)', () => {
	test('weak shown calls push towards bluffer, strong towards honest, clamped', () => {
		expect(isStrongCall([c('3d')], 'K')).toBe(true);
		expect(isStrongCall([c('4d'), c('Kc')], 'K')).toBe(true);
		expect(isStrongCall([c('4d')], 'K')).toBe(false);
		expect(fameAfterShowdown(0, false)).toBeGreaterThan(0);
		expect(fameAfterShowdown(0, true)).toBeLessThan(0);
		expect(fameAfterShowdown(0.95, false)).toBe(1);
	});
});

describe('tournament (PA2.8)', () => {
	test(
		'the good bot beats the random bot in at least 85% of 1,000 matches',
		() => {
			const good: SeatBrain = { kind: 'ai', profile: AI_PROFILES.pro };
			const rand: SeatBrain = { kind: 'random' };
			let wins = 0;
			const n = 1000;
			for (let seed = 1; seed <= n; seed++) {
				const { winner } = simulateMatch({
					rng: new Rng(seed),
					brains: [good, rand, good, rand],
					dealer: (seed % 4) as 0 | 1 | 2 | 3,
				});
				if (winner === 'us') wins++;
			}
			console.log(`good vs random: ${wins}/${n}`);
			expect(wins / n).toBeGreaterThanOrEqual(0.85);
		},
		workTimeout(1000, MS_PER_MATCH),
	);
});
