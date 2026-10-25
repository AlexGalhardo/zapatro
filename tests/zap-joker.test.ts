import { describe, expect, test } from 'bun:test';
import { JOKER_EFFECTS, type JokerEffect } from '../src/data/jokers';
import { honestSign, winChance } from '../src/logic/ai/decide';
import { Rng } from '../src/logic/rng';
import { scoreHand } from '../src/logic/score/score';
import {
	type Card,
	isZap,
	jokerCard,
	manilhaOf,
	parseCard,
	RANKS,
	standardDeck,
	strength,
	ZAP_STRENGTH,
} from '../src/logic/truco/cards';
import { observe } from '../src/logic/truco/observe';
import {
	apply,
	deal,
	drawJokerEffect,
	resolveTrick,
	type Seat,
	type TableState,
	type Trick,
} from '../src/logic/truco/table';

const c = (id: string): Card => {
	const card = parseCard(id);
	if (!card) throw new Error(id);
	return card;
};

/** Rng whose `pick` returns `effect` whenever it is among the options (forces a joker effect). */
class Forced extends Rng {
	constructor(private readonly effect: JokerEffect) {
		super(1);
	}
	override pick<T>(items: readonly T[]): T {
		return items.includes(this.effect as T) ? (this.effect as T) : super.pick(items);
	}
}

/** Vira 4 (manilha 5, ZAP 6♣), dealer 3 → seat 0 starts; hands fixed. */
function table(hands: string[][], vira = '4h'): TableState {
	const s = deal([...standardDeck(), jokerCard()], 3, { us: 0, them: 0 }, new Rng(1), {
		vira: c(vira),
	});
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	return s;
}

const play = (s: TableState, seat: Seat, id: string, rng: Rng = new Rng(1), faceDown = false) =>
	apply(s, { kind: 'play', seat, cardId: c(id).id, ...(faceDown ? { faceDown } : {}) }, rng);

const trick = (plays: [Seat, string, JokerEffect?][]): Trick => ({
	opener: plays[0]?.[0] ?? 0,
	plays: plays.map(([seat, id, effect]) => ({
		seat,
		card: c(id),
		faceDown: false,
		...(effect ? { effect } : {}),
	})),
});

describe('ZAP (PLAN §5.2)', () => {
	test('vira 4: the 5s are manilhas and the 6♣ is the ZAP, above all of them', () => {
		expect(manilhaOf('4')).toBe('5');
		expect(isZap(c('6c'), '5')).toBe(true);
		expect(isZap(c('6h'), '5')).toBe(false);
		expect(isZap(c('5c'), '5')).toBe(false);
		expect(strength(c('6c'), '5')).toBe(ZAP_STRENGTH);
		for (const m of ['5d', '5s', '5h', '5c'])
			expect(strength(c('6c'), '5')).toBeGreaterThan(strength(c(m), '5'));
	});

	test('always the clubs card two ranks above the vira, wrapping 3 → 4', () => {
		RANKS.forEach((vira, i) => {
			const zap = RANKS[(i + 2) % RANKS.length];
			const card = standardDeck().find((x) => x.rank === zap && x.suit === 'clubs') as Card;
			expect(isZap(card, manilhaOf(vira))).toBe(true);
		});
	});

	test('the ZAP wins the trick over the clubs manilha', () => {
		const t = trick([
			[0, '5c'],
			[1, '6c'],
			[2, '3h'],
			[3, '4d'],
		]);
		resolveTrick(t, '5');
		expect(t).toMatchObject({ result: 'them', winner: 1 });
	});

	test('the wink signal claims the ZAP; the clubs manilha signals copas', () => {
		expect(honestSign([c('6c'), c('5h'), c('4d')], '5')).toBe('zap');
		expect(honestSign([c('5c'), c('4d'), c('7h')], '5')).toBe('copas');
	});
});

describe('joker (PLAN §5.12)', () => {
	test('one joker in the deck; it is never the vira', () => {
		for (let seed = 1; seed <= 300; seed++) {
			const s = deal([jokerCard(), ...standardDeck()], 0, { us: 0, them: 0 }, new Rng(seed));
			expect(s.vira.rank).not.toBe('joker');
			const all = [...s.hands.flat(), s.vira, ...s.stock];
			expect(all.filter((x) => x.rank === 'joker')).toHaveLength(1);
			expect(all).toHaveLength(41);
		}
	});

	test('without an effect it counts as a 3', () => {
		expect(strength(jokerCard(), '5')).toBe(strength(c('3h'), '5'));
	});

	test('played face up it draws one of the 10 effects and says so; face down it does nothing', () => {
		expect(JOKER_EFFECTS).toHaveLength(10);
		const s = table([
			['JK', '4d', '7h'],
			['4s', '7s', 'Qd'],
			['Kh', '2d', '3d'],
			['Ah', 'Jd', 'Qh'],
		]);
		const r = play(s, 0, 'JK', new Forced('dud'));
		expect(r.events).toContainEqual({ type: 'joker', seat: 0, effect: 'dud' });
		expect(r.state.tricks[0]?.plays[0]?.effect).toBe('dud');
		const down = {
			...s,
			tricks: [
				{ opener: 0 as Seat, plays: [], result: 'us' as const },
				{ opener: 0 as Seat, plays: [] },
			],
		};
		const r2 = play(down, 0, 'JK', new Forced('dud'), true);
		expect(r2.events.some((e) => e.type === 'joker')).toBe(false);
	});

	test('void: the trick is a tie', () => {
		const t = trick([
			[0, 'JK', 'void'],
			[1, '6c'],
			[2, '3h'],
			[3, '4d'],
		]);
		resolveTrick(t, '5');
		expect(t.result).toBe('tie');
		expect(t.winner).toBeUndefined();
	});

	test('zap: the joker beats the manilhas; dud: it loses to a 4', () => {
		const zap = trick([
			[0, 'JK', 'zap'],
			[1, '5c'],
			[2, '4h'],
			[3, '4d'],
		]);
		resolveTrick(zap, '5');
		expect(zap).toMatchObject({ result: 'us', winner: 0 });
		const dud = trick([
			[0, 'JK', 'dud'],
			[1, '4s'],
			[2, '4h'],
			[3, '4d'],
		]);
		resolveTrick(dud, '5');
		expect(dud.result).toBe('tie');
	});

	test('upsideDown: the weakest face-up card wins', () => {
		const t = trick([
			[0, '3h'],
			[1, '4s'],
			[2, 'JK', 'upsideDown'],
			[3, '5c'],
		]);
		resolveTrick(t, '5');
		expect(t).toMatchObject({ result: 'them', winner: 1 });
	});

	test('copycat: ties the best card already played; never drawn as the first card', () => {
		const t = trick([
			[1, '5c'],
			[2, 'JK', 'copycat'],
			[3, '4d'],
			[0, '4h'],
		]);
		resolveTrick(t, '5');
		expect(t.result).toBe('tie');
		const s = table([
			['JK', '4d', '7h'],
			['4s', '7s', 'Qd'],
			['Kh', '2d', '3d'],
			['Ah', 'Jd', 'Qh'],
		]);
		for (let seed = 1; seed < 200; seed++)
			expect(drawJokerEffect(s, new Rng(seed))).not.toBe('copycat');
	});

	test('worth3: the hand is worth 3 (never less than it was)', () => {
		const s = table([
			['JK', '4d', '7h'],
			['4s', '7s', 'Qd'],
			['Kh', '2d', '3d'],
			['Ah', 'Jd', 'Qh'],
		]);
		expect(play(s, 0, 'JK', new Forced('worth3')).state.bet).toBe(3);
		expect(play({ ...s, bet: 6 }, 0, 'JK', new Forced('worth3')).state.bet).toBe(6);
	});

	test('newVira: a new vira turns from the stock and the manilhas change', () => {
		const s = table([
			['JK', '4d', '7h'],
			['4s', '7s', 'Qd'],
			['Kh', '2d', '3d'],
			['Ah', 'Jd', 'Qh'],
		]);
		s.stock = [c('Ks'), c('6d')];
		const r = play(s, 0, 'JK', new Forced('newVira'));
		expect(r.state.vira.id).toBe('Ks');
		expect(r.state.manilha).toBe('A');
		expect(r.events).toContainEqual({ type: 'vira', vira: c('Ks'), manilha: 'A' });
		expect(drawJokerEffect({ ...s, stock: [jokerCard()] }, new Forced('newVira'))).not.toBe(
			'newVira',
		);
	});

	test('showdown: every hand is shown, to the AI too', () => {
		const s = table([
			['JK', '4d', '7h'],
			['4s', '7s', 'Qd'],
			['Kh', '2d', '3d'],
			['Ah', 'Jd', 'Qh'],
		]);
		expect(observe(s, 1).shownHands).toBeNull();
		const after = play(s, 0, 'JK', new Forced('showdown')).state;
		const obs = observe(after, 1);
		expect(obs.shownHands?.[0]?.map((x) => x.id)).toEqual(['4d', '7h']);
		const p = winChance(obs, [...standardDeck(), jokerCard()], new Rng(2), 50);
		expect(p).toBeGreaterThanOrEqual(0);
		expect(p).toBeLessThanOrEqual(1);
	});

	test('double and zeroed act on the count, after everything else', () => {
		const run = (effect: JokerEffect) => {
			let s = table([
				['JK', '2h', 'Ah'],
				['4d', '4s', '6d'],
				['7h', 'Kh', 'Qs'],
				['4h', '6s', '7d'],
			]);
			const rng = new Forced(effect);
			for (const id of ['JK', '4d', '7h', '4h', '2h', '4s', 'Kh', '6s'])
				s = apply(s, { kind: 'play', seat: s.turn, cardId: c(id).id }, rng).state;
			return scoreHand({ state: s, queda: false });
		};
		const plain = run('worth3');
		const double = run('double');
		expect(double.steps.at(-1)).toEqual({ source: 'joker:double', xMult: 2 });
		expect(double.mult).toBe(2 * (plain.mult - 2));
		expect(run('zeroed').points).toBe(0);
	});
});
