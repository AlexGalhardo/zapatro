import { describe, expect, test } from 'bun:test';
import { Rng } from '../src/logic/rng';
import {
	type Card,
	manilhaOf,
	parseCard,
	RANKS,
	standardDeck,
	strength,
} from '../src/logic/truco/cards';
import {
	type Action,
	apply,
	canCallTruco,
	deal,
	elevenDecider,
	handWinner,
	IllegalAction,
	legalActions,
	matchWinner,
	nextDealer,
	type Seat,
	type TableState,
	teamOf,
} from '../src/logic/truco/table';
import { MS_PER_HAND, workTimeout } from './budget';

const c = (id: string): Card => {
	const card = parseCard(id);
	if (!card) throw new Error(id);
	return card;
};

/** Deal with fixed hands: seats 0..3 get `hands[i]`, vira fixed. Dealer 3 → seat 0 starts. */
function fixed(hands: string[][], vira: string, score = { us: 0, them: 0 }): TableState {
	const s = deal(standardDeck(), 3, score, new Rng(1), { vira: c(vira) });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	return s;
}

function run(s: TableState, actions: Action[], seed = 1): TableState {
	const rng = new Rng(seed);
	let cur = s;
	for (const a of actions) cur = apply(cur, a, rng).state;
	return cur;
}

const play = (seat: Seat, id: string, faceDown?: boolean): Action => ({
	kind: 'play',
	seat,
	cardId: id,
	...(faceDown ? { faceDown } : {}),
});

describe('cards and manilha (PA1.1, PLAN §5.1–5.2)', () => {
	test('40-card deck without 8, 9, 10', () => {
		const d = standardDeck();
		expect(d).toHaveLength(40);
		expect(new Set(d.map((x) => x.id)).size).toBe(40);
	});

	test('manilha is the rank above the vira for all 10 viras, wrapping 3 → 4', () => {
		const expected = ['5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3', '4'];
		RANKS.forEach((r, i) => {
			expect(manilhaOf(r)).toBe(expected[i] as (typeof RANKS)[number]);
		});
	});

	test('manilhas beat everything, ordered pica-fumo < espadilha < copas < zap', () => {
		const m = manilhaOf('7'); // Q
		const order = ['Qd', 'Qs', 'Qh', 'Qc'].map((x) => strength(c(x), m));
		expect(order).toEqual([...order].sort((a, b) => a - b));
		expect(strength(c('Qd'), m)).toBeGreaterThan(strength(c('3c'), m));
		expect(strength(c('3c'), m)).toBeGreaterThan(strength(c('2c'), m));
		expect(strength(c('4c'), m)).toBe(0);
	});

	test('a face-down card never wins', () => {
		expect(strength(c('Qc'), 'Q', true)).toBeLessThan(strength(c('4d'), 'Q'));
	});
});

describe('trick ties (PA1.3, PLAN §5.5)', () => {
	test.each([
		[['us', 'us'], 'us'],
		[['us', 'them'], undefined],
		[['tie', 'them'], 'them'],
		[['us', 'tie'], 'us'],
		[['tie', 'tie'], undefined],
		[['us', 'them', 'them'], 'them'],
		[['us', 'them', 'tie'], 'us'],
		[['tie', 'tie', 'us'], 'us'],
		[['tie', 'tie', 'tie'], null],
	] as const)('%j → %p', (results, winner) => {
		expect(handWinner(results)).toBe(winner);
	});
});

describe('a hand (PA1.2–PA1.6)', () => {
	test('turn goes counter-clockwise and the trick winner opens the next trick', () => {
		// Vira 4 → manilha 5. Seat 1 wins trick 1 with the 3.
		let s = fixed(
			[
				['2c', '4d', '6d'],
				['3c', '4s', '6s'],
				['Ac', 'Kd', '7d'],
				['Qd', 'Jd', '7s'],
			],
			'4h',
		);
		expect(s.turn).toBe(0);
		s = run(s, [play(0, '2c'), play(1, '3c'), play(2, 'Ac'), play(3, 'Qd')]);
		expect(s.tricks[0]?.result).toBe('them');
		expect(s.turn).toBe(1);
	});

	test('two tricks for one team end the hand without a third', () => {
		let s = fixed(
			[
				['3c', '3d', '4d'],
				['4s', '6s', '7s'],
				['2h', '2d', '5d'],
				['4c', '6c', '7c'],
			],
			'Kh',
		);
		s = run(s, [play(0, '3c'), play(1, '4s'), play(2, '2h'), play(3, '4c')]);
		s = run(s, [play(0, '3d'), play(1, '6s'), play(2, '2d'), play(3, '6c')]);
		expect(s.over).toEqual({ winner: 'us', tentos: 1, reason: 'tricks' });
		expect(s.score.us).toBe(1);
		expect(legalActions(s, 0)).toEqual([]);
	});

	test('equal cards of opposite teams tie ("cangou"); then the 2nd trick decides', () => {
		let s = fixed(
			[
				['3c', '2c', '4d'],
				['3d', '4s', '5s'],
				['4h', '5h', '6h'],
				['4c', '6c', '7c'],
			],
			'Kh',
		);
		s = run(s, [play(0, '3c'), play(1, '3d'), play(2, '4h'), play(3, '4c')]);
		expect(s.tricks[0]?.result).toBe('tie');
		expect(s.turn).toBe(0); // the tied trick's opener starts again
		s = run(s, [play(0, '2c'), play(1, '4s'), play(2, '5h'), play(3, '6c')]);
		expect(s.over?.winner).toBe('us');
	});

	test('face-down play is refused in the first trick and loses afterwards', () => {
		let s = fixed(
			[
				['3c', '3d', 'Qh'],
				['2s', '6s', '7s'],
				['4h', '5h', '6h'],
				['4c', '6c', '7c'],
			],
			'Kh',
		);
		expect(() => run(s, [play(0, '3c', true)])).toThrow(IllegalAction);
		s = run(s, [play(0, '3c'), play(1, '2s'), play(2, '4h'), play(3, '4c')]);
		expect(legalActions(s, 0).some((a) => a.kind === 'play' && a.faceDown)).toBe(true);
		s = run(s, [play(0, '3d', true), play(1, '6s'), play(2, '5h'), play(3, '6c')]);
		expect(s.tricks[1]?.result).toBe('them');
	});

	test('three tied tricks score nothing (D-36)', () => {
		let s = fixed(
			[
				['3c', '2c', 'Ac'],
				['3d', '2d', 'Ad'],
				['4h', '4d', '5d'],
				['4s', '5s', '5c'],
			],
			'7h',
		);
		s = run(s, [
			play(0, '3c'),
			play(1, '3d'),
			play(2, '4h'),
			play(3, '4s'),
			play(0, '2c'),
			play(1, '2d'),
			play(2, '4d'),
			play(3, '5s'),
			play(0, 'Ac'),
			play(1, 'Ad'),
			play(2, '5d'),
			play(3, '5c'),
		]);
		expect(s.over).toEqual({ winner: null, tentos: 0, reason: 'tricks' });
		expect(s.score).toEqual({ us: 0, them: 0 });
	});
});

describe('betting (PA1.5, PLAN §5.7)', () => {
	const base = (): TableState =>
		fixed(
			[
				['3c', '3d', '4d'],
				['4s', '6s', '7s'],
				['2c', '2d', '5d'],
				['4c', '6c', '7c'],
			],
			'Kh',
		);

	test('truco → accept raises the hand to 3 and play resumes with the caller', () => {
		const s = run(base(), [
			{ kind: 'truco', seat: 0 },
			{ kind: 'accept', seat: 1 },
		]);
		expect(s.bet).toBe(3);
		expect(s.turn).toBe(0);
		// The same team cannot raise again right after its call was accepted.
		expect(canCallTruco(s, 0)).toBe(false);
	});

	test('folding gives the caller the value before the call', () => {
		const s = run(base(), [
			{ kind: 'truco', seat: 0 },
			{ kind: 'fold', seat: 1 },
		]);
		expect(s.over).toEqual({ winner: 'us', tentos: 1, reason: 'fold' });
	});

	test('raise chain 3 → 6 → 9 → 12, answered by the previous caller, capped at 12', () => {
		let s = run(base(), [
			{ kind: 'truco', seat: 0 },
			{ kind: 'truco', seat: 1 },
		]);
		expect(s.bet).toBe(3);
		expect(s.pending).toMatchObject({ by: 1, to: 6, responder: 0 });
		s = run(s, [
			{ kind: 'truco', seat: 0 },
			{ kind: 'truco', seat: 1 },
		]);
		expect(s.pending).toMatchObject({ to: 12, responder: 0 });
		expect(legalActions(s, 0).some((a) => a.kind === 'truco')).toBe(false);
		const folded = run(s, [{ kind: 'fold', seat: 0 }]);
		expect(folded.over).toEqual({ winner: 'them', tentos: 9, reason: 'fold' });
	});

	test('only the responder may answer, and nobody plays while a call is pending', () => {
		const s = run(base(), [{ kind: 'truco', seat: 0 }]);
		expect(legalActions(s, 0)).toEqual([]);
		expect(legalActions(s, 2)).toEqual([]);
		expect(
			legalActions(s, 1)
				.map((a) => a.kind)
				.sort(),
		).toEqual(['accept', 'fold', 'truco']);
	});
});

describe('mão de 11 and mão de ferro (PA1.6, PLAN §5.9)', () => {
	test('the team at 11 decides; folding gives the rivals 1', () => {
		const s = deal(standardDeck(), 3, { us: 11, them: 4 }, new Rng(2));
		expect(s.kind).toBe('eleven');
		expect(elevenDecider(s)).toBe(0);
		expect(legalActions(s, 1)).toEqual([]);
		const folded = run(s, [{ kind: 'eleven', seat: 0, play: false }]);
		expect(folded.over).toEqual({ winner: 'them', tentos: 1, reason: 'elevenFold' });
		const played = run(s, [{ kind: 'eleven', seat: 0, play: true }]);
		expect(played.bet).toBe(3);
		expect(legalActions(played, 0).some((a) => a.kind === 'truco')).toBe(false);
	});

	test('11 × 11 is the iron hand: no truco, no signals', () => {
		const s = deal(standardDeck(), 3, { us: 11, them: 11 }, new Rng(3));
		expect(s.kind).toBe('iron');
		expect(legalActions(s, 0).every((a) => a.kind === 'play' && !a.faceDown)).toBe(true);
	});
});

describe('signals (PA2.5 base)', () => {
	test('one signal per hand, before your first card; rivals may catch it', () => {
		let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(4), {
			rules: { signals: [1, 1, 1, 1], catchChance: [1, 1, 1, 1] },
		});
		s = run(s, [{ kind: 'signal', seat: 0, sign: 'zap', honest: false }]);
		expect(s.signals[0]).toMatchObject({ seat: 0, sign: 'zap', caughtBy: [1, 3] });
		expect(legalActions(s, 0).some((a) => a.kind === 'signal')).toBe(false);
	});
});

describe('match flow', () => {
	test('dealer rotates and the match ends at 12', () => {
		expect(nextDealer(3)).toBe(0);
		expect(matchWinner({ us: 12, them: 3 })).toBe('us');
		expect(matchWinner({ us: 11, them: 11 })).toBeNull();
		expect(teamOf(2)).toBe('us');
	});
});

describe('property: random legal play (PA1.8)', () => {
	test.each([1, 2, 3])(
		'10,000 hands with seed %i never break the rules',
		(seed) => {
			const rng = new Rng(seed);
			let score = { us: 0, them: 0 };
			let dealer: Seat = 0;
			for (let h = 0; h < 10_000; h++) {
				let s = deal(standardDeck(), dealer, score, rng);
				const ids = s.hands.flat().map((x) => x.id);
				expect(new Set([...ids, s.vira.id]).size).toBe(13);
				let steps = 0;
				while (!s.over) {
					const acts = [0, 1, 2, 3].flatMap((seat) => legalActions(s, seat as Seat));
					expect(acts.length).toBeGreaterThan(0);
					s = apply(s, rng.pick(acts), rng).state;
					expect(++steps).toBeLessThan(60);
				}
				expect(Number.isFinite(s.score.us) && Number.isFinite(s.score.them)).toBe(true);
				score = matchWinner(s.score) ? { us: 0, them: 0 } : s.score;
				dealer = nextDealer(dealer);
			}
		},
		workTimeout(10_000, MS_PER_HAND),
	);
});
