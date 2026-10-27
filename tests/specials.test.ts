import { describe, expect, test } from 'bun:test';
import { SPECIAL_CARDS } from '../src/data/specials';
import { Match } from '../src/game/match';
import { Rng } from '../src/logic/rng';
import {
	type Card,
	fullDeck,
	isSpecial,
	jokerCard,
	parseCard,
	specialCards,
	strength,
} from '../src/logic/truco/cards';
import {
	apply,
	deal,
	legalActions,
	type PlayEffect,
	type Seat,
	type TableEvent,
	type TableState,
} from '../src/logic/truco/table';

const c = (id: string): Card => parseCard(id) as Card;
const special = (id: string): Card => specialCards().find((x) => x.id === id) as Card;

/**
 * A hand with chosen cards (vira 4h: the manilha is 5, the ZAP 6c); seat 0 plays first. Plays
 * `card` face up from seat 0 with the first seed whose draw is `effect`.
 */
function playEffect(
	card: Card,
	effect: PlayEffect,
	hands: Card[][],
	tweak: (s: TableState) => void = () => {},
): { before: TableState; after: TableState; events: TableEvent[] } {
	for (let seed = 1; seed < 500; seed++) {
		const s = deal(fullDeck(), 3, { us: 0, them: 0 }, new Rng(seed), { vira: c('4h') });
		for (const [i, h] of hands.entries()) s.hands[i as Seat] = [...h];
		s.stock = fullDeck().filter(
			(x) => !hands.flat().some((y) => y.id === x.id) && x.id !== '4h',
		);
		tweak(s);
		const before = structuredClone(s);
		const { state, events } = apply(
			s,
			{ kind: 'play', seat: 0, cardId: card.id },
			new Rng(seed),
		);
		const drawn = events.find((e) => e.type === 'joker');
		if (drawn?.type === 'joker' && drawn.effect === effect)
			return { before, after: state, events };
	}
	throw new Error(`no seed draws ${effect}`);
}

const TV = special('TV');
const OL = special('OL');
const RA = special('RA');
const rest = [c('4d'), c('4s')];
const others = [
	[c('6d'), c('7d'), c('Qd')],
	[c('6h'), c('7h'), c('Qh')],
	[c('6s'), c('7s'), c('Qs')],
];
const hands = (mine: Card[]): Card[][] => [mine, ...others];

describe('special cards (Trevo, Olho, Raio)', () => {
	test('every deck has 40 common cards, two jokers and the three special cards', () => {
		const deck = fullDeck();
		expect(deck).toHaveLength(45);
		expect(new Set(deck.map((x) => x.id)).size).toBe(45);
		expect(deck.filter((x) => x.rank === 'joker').map((x) => x.id)).toEqual(['JK', 'JK2']);
		expect(deck.filter(isSpecial)).toHaveLength(5);
		expect(
			new Match({ rng: new Rng(1), brains: Array(4).fill({ kind: 'human' }) as never }).deck,
		).toHaveLength(45);
		expect(parseCard('JK2')).toEqual(jokerCard(2));
		expect(parseCard('tv')).toEqual(TV);
	});

	test('each has three effects and counts as a 3, and is never turned as the vira', () => {
		for (const [rank, effects] of Object.entries(SPECIAL_CARDS)) {
			expect(effects).toHaveLength(3);
			expect(
				strength(special(rank === 'trevo' ? 'TV' : rank === 'olho' ? 'OL' : 'RA'), '5'),
			).toBe(strength(c('3d'), '5'));
		}
		for (let seed = 1; seed < 200; seed++)
			expect(isSpecial(deal(fullDeck(), 3, { us: 0, them: 0 }, new Rng(seed)).vira)).toBe(
				false,
			);
	});

	test('face down it is a covered card: no effect', () => {
		const s = deal(fullDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c('4h') });
		s.hands[0] = [c('4d'), TV, c('4s')];
		s.tricks = [
			{ opener: 0, plays: [], result: 'them' },
			{ opener: 0, plays: [] },
		];
		const { events } = apply(
			s,
			{ kind: 'play', seat: 0, cardId: 'TV', faceDown: true },
			new Rng(1),
		);
		expect(events.some((e) => e.type === 'joker')).toBe(false);
	});

	test('Trevo raise: the bet goes up one step for free', () => {
		const { before, after } = playEffect(TV, 'raise', hands([TV, ...rest]));
		expect(before.bet).toBe(1);
		expect(after.bet).toBe(3);
		expect(after.pending).toBeNull();
	});

	test('Trevo shield: the pair that folds loses only 1 tento', () => {
		const { after } = playEffect(TV, 'shield', hands([TV, ...rest]));
		expect(after.shield).toBe('us');
		// Seat 1 calls at bet 3, seat 2 (the pair of the Trevo) runs.
		const s: TableState = { ...after, bet: 3 };
		const call = apply(s, { kind: 'truco', seat: 1 }, new Rng(1)).state;
		const fold = apply(call, { kind: 'fold', seat: 2 }, new Rng(1));
		expect(fold.state.over).toMatchObject({ winner: 'them', tentos: 1, reason: 'fold' });
		// Without the shield the same fold costs the whole bet.
		const bare = apply(
			apply({ ...s, shield: null }, { kind: 'truco', seat: 1 }, new Rng(1)).state,
			{ kind: 'fold', seat: 2 },
			new Rng(1),
		);
		expect(bare.state.over?.tentos).toBe(3);
	});

	test('Trevo bonus: +2 tentos for the pair that wins the hand, never past 12', () => {
		const win = (score: number) => {
			const { after } = playEffect(TV, 'bonus', hands([TV, c('3d'), c('3h')]), (s) => {
				s.score = { us: score, them: 0 };
			});
			expect(after.bonus).toBe('us');
			let s = after;
			// The Trevo wins trick 1 (a 3 against a 6, a 7 and a 4 of the others).
			for (const [seat, id] of [
				[1, '6d'],
				[2, '6h'],
				[3, '6s'],
			] as const)
				s = apply(s, { kind: 'play', seat, cardId: id }, new Rng(1)).state;
			expect(s.tricks[0]?.result).toBe('us');
			for (const [seat, id] of [
				[0, '3d'],
				[1, '7d'],
				[2, '7h'],
				[3, '7s'],
			] as const)
				s = apply(s, { kind: 'play', seat, cardId: id }, new Rng(1)).state;
			return s.over;
		};
		expect(win(0)).toMatchObject({ winner: 'us', tentos: 3 });
		expect(win(10)).toMatchObject({ winner: 'us', tentos: 2 });
	});

	test('Olho peek: one card of each rival is shown to the pair', () => {
		const { after } = playEffect(OL, 'peek', hands([OL, ...rest]));
		expect(after.known).toHaveLength(2);
		for (const k of after.known) {
			expect([1, 3]).toContain(k.seat);
			expect(k.to).toBe('us');
			expect(after.hands[k.seat].some((x) => x.id === k.cardId)).toBe(true);
		}
	});

	test('Olho swap: the cards left are exchanged with the partner, the counts stay', () => {
		const mine = [OL, c('4d'), c('4s')];
		const { before, after } = playEffect(OL, 'swap', [
			mine,
			others[0] as Card[],
			[c('3d'), c('3h')],
			others[2] as Card[],
		]);
		expect(after.hands[0]).toHaveLength(2);
		expect(after.hands[2]).toHaveLength(2);
		// 4d and 4s are now the partner's; 3d and 3h are mine.
		expect(after.hands[2].map((x) => x.id).sort()).toEqual(['4d', '4s']);
		expect(after.hands[0].map((x) => x.id).sort()).toEqual(['3d', '3h']);
		expect(before.hands[0]).toHaveLength(3);
	});

	test('Olho swap with uneven hands keeps both counts', () => {
		const { after } = playEffect(OL, 'swap', [
			[OL, c('4d')],
			others[0] as Card[],
			[c('3d'), c('3h'), c('2d')],
			others[2] as Card[],
		]);
		expect(after.hands[0]).toHaveLength(1);
		expect(after.hands[2]).toHaveLength(3);
		expect(
			after.hands[0]
				.concat(after.hands[2])
				.map((x) => x.id)
				.sort(),
		).toEqual(['2d', '3d', '3h', '4d']);
	});

	test('Olho redraw: the cards left come back to the stock and new ones are dealt', () => {
		const { before, after } = playEffect(OL, 'redraw', hands([OL, ...rest]));
		expect(after.hands[0]).toHaveLength(2);
		const all = [
			...after.hands.flat(),
			...after.stock,
			...after.tricks.flatMap((t) => t.plays.map((p) => p.card)),
			after.vira,
		];
		const was = [...before.hands.flat(), ...before.stock, before.vira];
		expect(all.map((x) => x.id).sort()).toEqual(was.map((x) => x.id).sort());
		expect(after.hands[0].some((x) => isSpecial(x))).toBe(false);
	});

	test('Raio freeze: nobody can call truco until the hand ends', () => {
		const { before, after } = playEffect(RA, 'freeze', hands([RA, ...rest]));
		expect(legalActions({ ...before, turn: 1 }, 1).some((a) => a.kind === 'truco')).toBe(true);
		for (const seat of [0, 1, 2, 3] as const)
			expect(legalActions(after, seat).some((a) => a.kind === 'truco')).toBe(false);
	});

	test('Raio claim: the trick goes to the pair that played it, even against the ZAP', () => {
		const { after } = playEffect(RA, 'claim', [
			[RA, ...rest],
			[c('6c'), c('7d'), c('Qd')],
			others[1] as Card[],
			others[2] as Card[],
		]);
		let s = after;
		for (const [seat, id] of [
			[1, '6c'],
			[2, '6h'],
			[3, '6s'],
		] as const)
			s = apply(s, { kind: 'play', seat, cardId: id }, new Rng(1)).state;
		expect(s.tricks[0]).toMatchObject({ result: 'us', winner: 0 });
	});

	test('Raio reversed: for the rest of the hand the weakest card wins each trick', () => {
		const { after } = playEffect(RA, 'reversed', hands([RA, ...rest]));
		expect(after.reversed).toBe(true);
		let s = after;
		for (const [seat, id] of [
			[1, '6d'],
			[2, '7h'],
			[3, '7s'],
		] as const)
			s = apply(s, { kind: 'play', seat, cardId: id }, new Rng(1)).state;
		// 6d is the weakest face-up card: seat 1 (them) wins.
		expect(s.tricks[0]).toMatchObject({ result: 'them', winner: 1 });
	});
});
