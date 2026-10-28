import { describe, expect, test } from 'bun:test';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { CHAMPIONSHIP_GOALS, ENDLESS_GOAL_GROWTH } from '../src/data/championships';
import { type SeatBrain, simulateMatch } from '../src/game/match';
import { Rng } from '../src/logic/rng';
import { formatPoints } from '../src/logic/score/format';
import {
	afterQueda,
	cardChips,
	classifyLance,
	lanceValue,
	scoreHand,
	tableGoal,
	tableOutcome,
	totals,
} from '../src/logic/score/score';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { type Action, apply, deal, type Seat, type TableState } from '../src/logic/truco/table';
import { MS_PER_MATCH, workTimeout } from './budget';

const c = (id: string): Card => {
	const card = parseCard(id);
	if (!card) throw new Error(id);
	return card;
};

/** Plays a hand with fixed cards (vira 4♣ → manilha 5; dealer 3 → seat 0 starts). */
function play(
	hands: string[][],
	moves: (string | Action)[],
	kind?: TableState['kind'],
): TableState {
	let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c('4c') });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	if (kind) s = { ...s, kind, elevenDecided: true };
	const rng = new Rng(1);
	for (const m of moves) {
		const action: Action =
			typeof m === 'string'
				? { kind: 'play', seat: (s.pending?.responder ?? s.turn) as Seat, cardId: m }
				: m;
		s = apply(s, action, rng).state;
	}
	return s;
}

const HANDS = [
	['3h', '2h', 'Ah'],
	['4d', '4s', '6d'],
	['7h', 'Kh', 'Qs'],
	['4h', '6s', '7d'],
];

describe('scoring (A2, D-02)', () => {
	test('chips per card and manilha by suit', () => {
		expect(cardChips(c('4d'), '5')).toBe(1);
		expect(cardChips(c('3h'), '5')).toBe(10);
		expect(cardChips(c('5d'), '5')).toBe(12);
		expect(cardChips(c('5c'), '5')).toBe(15);
	});

	test('Vaza Limpa 2-0: (cards of both tricks + Lance) × (bet + Lance Mult)', () => {
		const s = play(HANDS, ['3h', '4d', '7h', '4h', '2h', '4s', 'Kh', '6s']);
		expect(s.over?.winner).toBe('us');
		const r = scoreHand({ state: s, queda: false });
		expect(r.lance).toBe('limpa');
		// (16 + 20 + 10) × (1 + 1)
		expect(r.chips).toBe(46);
		expect(r.mult).toBe(2);
		expect(r.points).toBe(92);
		expect(r.points).toBe(totals(r.steps).points);
	});

	test('Virada: lost the first trick, won the hand', () => {
		const hands = HANDS.map((h) => [...h]);
		hands[1] = ['5c', '4s', '6d'];
		const s = play(hands, [
			'3h',
			'5c',
			'7h',
			'4h',
			'4s',
			'Kh',
			'6s',
			'2h',
			'Ah',
			'6d',
			'Qs',
			'7d',
		]);
		const r = scoreHand({ state: s, queda: false });
		expect(r.lance).toBe('virada');
		// (20 + 20 + 20) × (1 + 2)
		expect(r.points).toBe(180);
	});

	test('Corrida: the rival ran from a truco', () => {
		const s = play(HANDS, [
			{ kind: 'truco', seat: 0 },
			{ kind: 'fold', seat: 1 },
		]);
		const r = scoreHand({ state: s, queda: false });
		expect(r.lance).toBe('corrida');
		expect(r.points).toBe(lanceValue('corrida').chips * (s.bet + lanceValue('corrida').mult));
	});

	test('losing or running scores 0', () => {
		const s = play(HANDS, [
			{ kind: 'truco', seat: 0 },
			{ kind: 'truco', seat: 1 },
			{ kind: 'fold', seat: 0 },
		]);
		expect(s.over?.winner).toBe('them');
		expect(scoreHand({ state: s, queda: false })).toMatchObject({ lance: null, points: 0 });
	});

	test('Lance priority: Queda > Ferro > Onze > trick pattern', () => {
		const moves = ['3h', '4d', '7h', '4h', '2h', '4s', 'Kh', '6s'];
		expect(classifyLance(play(HANDS, moves), 'us', true)).toBe('queda');
		expect(classifyLance(play(HANDS, moves, 'iron'), 'us', false)).toBe('ferro');
		expect(classifyLance(play(HANDS, moves, 'eleven'), 'us', false)).toBe('onze');
		expect(classifyLance(play(HANDS, moves), 'them', false)).toBeNull();
	});

	test('Lance level adds chips and Mult', () => {
		expect(lanceValue('limpa', 1)).toEqual({ chips: 10, mult: 1 });
		expect(lanceValue('limpa', 3)).toEqual({ chips: 30, mult: 3 });
	});

	test('Mult applies left to right (+Mult before ×Mult differs from after)', () => {
		const add = { source: 'a', addMult: 2 };
		const x = { source: 'x', xMult: 3 };
		const base = [
			{ source: 'c', chips: 10 },
			{ source: 'bet', addMult: 1 },
		];
		expect(totals([...base, add, x]).points).toBe(10 * (1 + 2) * 3);
		expect(totals([...base, x, add]).points).toBe(10 * (1 * 3 + 2));
	});

	test('table goal and outcome (§5.10)', () => {
		expect(CHAMPIONSHIP_GOALS).toEqual([130, 170, 220, 270, 350, 440, 550, 700]);
		expect(tableGoal(1, 'small')).toBe(CHAMPIONSHIP_GOALS[0]);
		expect(tableGoal(1, 'big')).toBe(Math.round(CHAMPIONSHIP_GOALS[0] * 1.5));
		expect(tableGoal(8, 'boss')).toBe(CHAMPIONSHIP_GOALS[7] * 2);
		expect(tableGoal(9, 'small')).toBe(Math.round(CHAMPIONSHIP_GOALS[7] * ENDLESS_GOAL_GROWTH));
		expect(tableOutcome(100, 100, { us: 12, them: 12 })).toBe('won');
		expect(tableOutcome(50, 100, { us: 3, them: 12 })).toBe('rivalQueda');
		expect(tableOutcome(50, 100, { us: 3, them: 12 }, 1)).toBe('lost');
		expect(afterQueda({ us: 4, them: 12 }, 'them')).toEqual({ us: 4, them: 0 });
		expect(tableOutcome(50, 100, { us: 12, them: 5 })).toBe('queda');
		expect(tableOutcome(50, 100, { us: 6, them: 5 })).toBe('playing');
		expect(afterQueda({ us: 12, them: 5 })).toEqual({ us: 0, them: 0 });
	});
});

describe('points format (D-56)', () => {
	test('grouped, abbreviated and scientific', () => {
		expect(formatPoints(12345, 'pt-BR')).toBe('12.345');
		expect(formatPoints(12345, 'en')).toBe('12,345');
		expect(formatPoints(1_250_000, 'pt-BR')).toBe('1,2M');
		expect(formatPoints(1_250_000, 'en')).toBe('1.2M');
		expect(formatPoints(3.4e9, 'en')).toBe('3.4B');
		expect(formatPoints(1.5e15, 'en')).toBe('1.5e15');
		expect(formatPoints(Number.POSITIVE_INFINITY, 'en')).toBe('∞');
	});
});

describe('roguelite table (A2.3)', () => {
	const pro = { kind: 'ai', profile: AI_PROFILES.pro } as const;
	const brains = [pro, pro, pro, pro] as [SeatBrain, SeatBrain, SeatBrain, SeatBrain];

	test('reaching the goal wins the table', () => {
		const { winner, match } = simulateMatch({ rng: new Rng(4), brains, goal: 1 });
		expect(winner).toBe('us');
		expect(match.points).toBeGreaterThanOrEqual(1);
	});

	test(
		'an unreachable goal: a Queda resets both pairs, rivals at 12 lose',
		() => {
			let quedas = 0;
			for (let seed = 1; seed <= 20; seed++) {
				const { winner, match } = simulateMatch({ rng: new Rng(seed), brains, goal: 1e12 });
				expect(winner).toBe('them');
				expect(match.state.score.them).toBeGreaterThanOrEqual(12);
				expect(Number.isFinite(match.points)).toBe(true);
				quedas += match.quedas;
			}
			expect(quedas).toBeGreaterThan(0);
		},
		workTimeout(20, MS_PER_MATCH),
	);
});
