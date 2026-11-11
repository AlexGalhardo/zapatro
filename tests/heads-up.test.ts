import { describe, expect, test } from 'bun:test';
import { playHeadsUp } from '../scripts/lib/heads-up';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { SORTUDA_CHANCE } from '../src/data/bosses';
import { BONUS_TENTOS } from '../src/data/specials';
import { Match, type SeatBrain } from '../src/game/match';
import { winChance } from '../src/logic/ai/decide';
import { Rng } from '../src/logic/rng';
import {
	type Card,
	fullDeck,
	jokerCard,
	parseCard,
	specialCards,
	standardDeck,
	viraManilha,
} from '../src/logic/truco/cards';
import { observe } from '../src/logic/truco/observe';
import {
	apply,
	BETS,
	canCallTruco,
	currentTrick,
	type DealOptions,
	deal,
	drawEffect,
	elevenDecider,
	IllegalAction,
	legalActions,
	nextDealer,
	nextSeat,
	type PlayEffect,
	partnerOf,
	partnerSeat,
	rivalsOf,
	type Seat,
	type TableEvent,
	type TableState,
} from '../src/logic/truco/table';
import { MS_PER_MATCH, workTimeout } from './budget';

const c = (id: string): Card => parseCard(id) as Card;
const special = (id: string): Card => specialCards().find((x) => x.id === id) as Card;
const zero = { us: 0, them: 0 };

/** A two-seat hand with chosen cards; vira 4h makes 5 the manilha (ZAP is the 5 of clubs). */
function fixed(
	h0: string[],
	h1: string[],
	score = zero,
	dealer: Seat = 1,
	opts: DealOptions = {},
): TableState {
	const s = deal(standardDeck(), dealer, score, new Rng(1), {
		seats: 2,
		vira: c('4h'),
		...opts,
	});
	s.hands[0] = h0.map(c);
	s.hands[1] = h1.map(c);
	return s;
}

const play = (seat: Seat, cardId: string): { kind: 'play'; seat: Seat; cardId: string } => ({
	kind: 'play',
	seat,
	cardId,
});

function run(s: TableState, actions: Parameters<typeof apply>[1][], rng = new Rng(1)): TableState {
	return actions.reduce((state, a) => apply(state, a, rng).state, s);
}

const STRONG = ['5c', '5h', '3d'];
const WEAK = ['4d', '4s', '6d'];

describe('1v1: the deal and the turn order (R1.1)', () => {
	test('2 hands of 3 cards plus the vira; seats 2 and 3 stay empty', () => {
		for (let seed = 1; seed <= 20; seed++) {
			const s = deal(fullDeck(), 1, zero, new Rng(seed), { seats: 2 });
			expect(s.seats).toBe(2);
			expect(s.hands[0]).toHaveLength(3);
			expect(s.hands[1]).toHaveLength(3);
			expect(s.hands[2]).toHaveLength(0);
			expect(s.hands[3]).toHaveLength(0);
			const ids = [...s.hands.flat(), s.vira, ...s.stock].map((x) => x.id);
			expect(new Set(ids).size).toBe(fullDeck().length);
			expect(ids).toHaveLength(fullDeck().length);
		}
	});

	test('the default is still four seats', () => {
		const s = deal(standardDeck(), 3, zero, new Rng(1));
		expect(s.seats).toBe(4);
		expect(s.hands.map((h) => h.length)).toEqual([3, 3, 3, 3]);
	});

	test('a trick closes with 2 plays and the turn alternates', () => {
		let s = fixed(WEAK, STRONG);
		expect(s.turn).toBe(0);
		s = run(s, [play(0, '4d')]);
		expect(s.turn).toBe(1);
		expect(currentTrick(s).result).toBeUndefined();
		s = run(s, [play(1, '5c')]);
		expect(s.tricks).toHaveLength(2);
		expect(s.tricks[0]?.plays).toHaveLength(2);
		expect(s.tricks[0]?.result).toBe('them');
		// The trick winner opens the next one.
		expect(s.turn).toBe(1);
		expect(legalActions(s, 0)).toEqual([]);
	});

	test('a tie of strengths is a tie trick', () => {
		const s = run(fixed(['4d', '4s', '6d'], ['4h', '4c', '6s']), [
			play(0, '4d'),
			play(1, '4c'),
		]);
		expect(s.tricks[0]?.result).toBe('tie');
	});

	test('the non-dealer opens the hand and the dealer alternates', () => {
		expect(fixed(WEAK, STRONG, zero, 0).turn).toBe(1);
		expect(fixed(WEAK, STRONG, zero, 1).turn).toBe(0);
		expect(nextDealer(0, 2)).toBe(1);
		expect(nextDealer(1, 2)).toBe(0);
		expect(nextSeat(0, 2)).toBe(1);
		expect(nextSeat(1, 2)).toBe(0);
		const m = new Match({
			rng: new Rng(3),
			brains: [
				{ kind: 'ai', profile: AI_PROFILES.pro },
				{ kind: 'ai', profile: AI_PROFILES.pro },
			],
		});
		expect(m.seats).toBe(2);
		expect(m.state.turn).toBe(0);
		const dealers = [m.dealer];
		for (let i = 0; i < 3; i++) {
			for (let seat = m.actor(); seat !== null; seat = m.actor()) m.act(m.aiAction(seat));
			if (m.winner) break;
			m.nextHand();
			dealers.push(m.dealer);
		}
		for (let i = 1; i < dealers.length; i++) expect(dealers[i]).not.toBe(dealers[i - 1]);
	});

	test('there is no partner: the helpers say so and the type refuses a two-seat count', () => {
		expect(partnerSeat(0, 2)).toBeNull();
		expect(partnerSeat(0, 4)).toBe(2);
		expect(rivalsOf(0, 2)).toEqual([1]);
		expect(rivalsOf(1, 2)).toEqual([0]);
		expect(rivalsOf(0, 4)).toEqual([1, 3]);
		const seats = fixed(WEAK, STRONG).seats;
		// @ts-expect-error partnerOf only takes a four-seat table
		partnerOf(0, seats);
	});
});

describe('1v1: betting (R1.2)', () => {
	const callers: Seat[] = [0, 1, 0, 1];

	/** The chain truco → 6 → 9 → 12, each call raising the previous one. */
	const chain = (n: number): TableState => {
		const rng = new Rng(1);
		let s = fixed(STRONG, WEAK);
		for (const seat of callers.slice(0, n)) s = apply(s, { kind: 'truco', seat }, rng).state;
		return s;
	};

	test('the call goes to the single opponent and the chain climbs 3, 6, 9, 12', () => {
		for (let n = 1; n <= 4; n++) {
			const s = chain(n);
			const caller = callers[n - 1] as Seat;
			const responder = (1 - caller) as Seat;
			expect(s.pending?.to).toBe(BETS[n]);
			expect(s.pending?.responder).toBe(responder);
			expect(legalActions(s, caller)).toEqual([]);
			const kinds = legalActions(s, responder).map((a) => a.kind);
			expect(kinds).toContain('accept');
			expect(kinds).toContain('fold');
			expect(kinds.includes('truco')).toBe(n < 4);
		}
	});

	test('running at every step gives the bet already accepted to the caller', () => {
		for (let n = 1; n <= 4; n++) {
			const caller = callers[n - 1] as Seat;
			const responder = (1 - caller) as Seat;
			const s = apply(chain(n), { kind: 'fold', seat: responder }, new Rng(1)).state;
			expect(s.over).toEqual({
				winner: caller === 0 ? 'us' : 'them',
				tentos: BETS[n - 1] as number,
				reason: 'fold',
			});
		}
	});

	test('accepting 12 ends the chain; nobody can call again', () => {
		let s = apply(chain(4), { kind: 'accept', seat: 0 }, new Rng(1)).state;
		expect(s.bet).toBe(12);
		expect(s.pending).toBeNull();
		for (const seat of [0, 1] as const) expect(canCallTruco(s, seat)).toBe(false);
		s = run(s, [play(0, '5c'), play(1, '4d'), play(0, '5h'), play(1, '4s')]);
		expect(s.over).toEqual({ winner: 'us', tentos: 12, reason: 'tricks' });
	});

	test('a team cannot raise its own accepted call', () => {
		const rng = new Rng(1);
		let s = fixed(STRONG, WEAK);
		s = apply(s, { kind: 'truco', seat: 0 }, rng).state;
		s = apply(s, { kind: 'accept', seat: 1 }, rng).state;
		expect(s.bet).toBe(3);
		expect(canCallTruco(s, 0)).toBe(false);
		expect(legalActions(s, 0).some((a) => a.kind === 'truco')).toBe(false);
		expect(() => apply(s, { kind: 'truco', seat: 0 }, rng)).toThrow(IllegalAction);
		s = apply(s, play(0, '3d'), rng).state;
		expect(legalActions(s, 1).some((a) => a.kind === 'truco')).toBe(true);
	});
});

describe('1v1: mão de 11 and mão de ferro (R1.3)', () => {
	test('score 11-4: the player on 11 sees their cards and decides; playing is worth 3', () => {
		let s = fixed(STRONG, WEAK, { us: 11, them: 4 });
		expect(s.kind).toBe('eleven');
		expect(elevenDecider(s)).toBe(0);
		expect(legalActions(s, 0).map((a) => a.kind)).toEqual(['eleven', 'eleven']);
		expect(legalActions(s, 1)).toEqual([]);
		const o = observe(s, 0);
		expect(o.hand?.map((x) => x.id)).toEqual(STRONG);
		expect(o.partnerHand).toBeNull();
		s = run(s, [{ kind: 'eleven', seat: 0, play: true }]);
		expect(s.bet).toBe(3);
		s = run(s, [play(0, '5c'), play(1, '4d'), play(0, '5h'), play(1, '4s')]);
		expect(s.over).toEqual({ winner: 'us', tentos: 3, reason: 'tricks' });
	});

	test('score 11-4: running gives the rival 1 tento', () => {
		const s = run(fixed(STRONG, WEAK, { us: 11, them: 4 }), [
			{ kind: 'eleven', seat: 0, play: false },
		]);
		expect(s.over).toEqual({ winner: 'them', tentos: 1, reason: 'elevenFold' });
	});

	test('score 4-11: the rival is the one that decides', () => {
		let s = fixed(WEAK, STRONG, { us: 4, them: 11 });
		expect(s.kind).toBe('eleven');
		expect(elevenDecider(s)).toBe(1);
		expect(legalActions(s, 0)).toEqual([]);
		expect(legalActions(s, 1).map((a) => a.kind)).toEqual(['eleven', 'eleven']);
		expect(observe(s, 1).partnerHand).toBeNull();
		s = run(s, [{ kind: 'eleven', seat: 1, play: true }]);
		s = run(s, [play(0, '4d'), play(1, '5c'), play(1, '5h'), play(0, '4s')]);
		expect(s.over).toEqual({ winner: 'them', tentos: 3, reason: 'tricks' });
		const ran = run(fixed(WEAK, STRONG, { us: 4, them: 11 }), [
			{ kind: 'eleven', seat: 1, play: false },
		]);
		expect(ran.over).toEqual({ winner: 'us', tentos: 1, reason: 'elevenFold' });
	});

	test('truco in a mão de 11 is not offered and is refused (D-54)', () => {
		const rng = new Rng(1);
		let s = fixed(STRONG, WEAK, { us: 11, them: 4 });
		expect(() => apply(s, { kind: 'truco', seat: 0 }, rng)).toThrow(IllegalAction);
		s = run(s, [{ kind: 'eleven', seat: 0, play: true }]);
		for (const seat of [0, 1] as const) {
			expect(legalActions(s, seat).some((a) => a.kind === 'truco')).toBe(false);
		}
		expect(() => apply(s, { kind: 'truco', seat: 0 }, rng)).toThrow(IllegalAction);
		s = run(s, [play(0, '5c')]);
		expect(() => apply(s, { kind: 'truco', seat: 1 }, rng)).toThrow(IllegalAction);
	});

	test('11 × 11 is the iron hand: blind, worth 1, no truco, no face-down card', () => {
		let s = fixed(STRONG, WEAK, { us: 11, them: 11 });
		expect(s.kind).toBe('iron');
		expect(elevenDecider(s)).toBeNull();
		expect(s.bet).toBe(1);
		expect(observe(s, 0).hand).toBeNull();
		expect(legalActions(s, 0).every((a) => a.kind === 'play')).toBe(true);
		s = run(s, [play(0, '5c'), play(1, '4d')]);
		expect(legalActions(s, 0).some((a) => a.kind === 'truco' || a.kind === 'signal')).toBe(
			false,
		);
		expect(legalActions(s, 0).some((a) => a.kind === 'play' && a.faceDown)).toBe(false);
		s = run(s, [play(0, '5h'), play(1, '4s')]);
		expect(s.over).toEqual({ winner: 'us', tentos: 1, reason: 'tricks' });
	});
});

describe('1v1: no signals (R1.4)', () => {
	test('no signal action is ever legal in 500 random hands; the face-down card still is', () => {
		const rng = new Rng(2026);
		let covered = 0;
		for (let i = 0; i < 500; i++) {
			const score = rng.pick([
				zero,
				{ us: 11, them: 4 },
				{ us: 5, them: 11 },
				{ us: 11, them: 11 },
			]);
			let s = deal(fullDeck(), (i % 2) as Seat, score, rng, { seats: 2 });
			while (!s.over) {
				const actor = elevenDecider(s) ?? s.pending?.responder ?? s.turn;
				for (const seat of [0, 1, 2, 3] as const) {
					const legal = legalActions(s, seat);
					expect(legal.some((a) => a.kind === 'signal')).toBe(false);
					if (seat > 1) expect(legal).toEqual([]);
				}
				const legal = legalActions(s, actor);
				if (legal.some((a) => a.kind === 'play' && a.faceDown)) covered++;
				s = apply(s, rng.pick(legal), rng).state;
			}
		}
		expect(covered).toBeGreaterThan(0);
	});
});

describe('1v1: joker, special cards and bosses (R1.5)', () => {
	const TV = special('TV');
	const OL = special('OL');
	const RA = special('RA');

	/** Plays `card` from seat 0 (it opens) with the first seed whose draw is `effect`. */
	function playEffect(
		card: Card,
		effect: PlayEffect,
		h0: Card[],
		h1: Card[],
		tweak: (s: TableState) => void = () => {},
	): { before: TableState; after: TableState; events: TableEvent[] } {
		for (let seed = 1; seed < 500; seed++) {
			const s = deal(fullDeck(), 1, zero, new Rng(seed), { seats: 2, vira: c('4h') });
			s.hands[0] = [...h0];
			s.hands[1] = [...h1];
			s.stock = fullDeck().filter(
				(x) => ![...h0, ...h1].some((y) => y.id === x.id) && x.id !== '4h',
			);
			tweak(s);
			const before = structuredClone(s);
			const { state, events } = apply(s, play(0, card.id), new Rng(seed));
			const drawn = events.find((e) => e.type === 'joker');
			if (drawn?.type === 'joker' && drawn.effect === effect)
				return { before, after: state, events };
		}
		throw new Error(`no seed draws ${effect}`);
	}
	const mine = [c('4d'), c('4s')];
	const theirs = [c('5d'), c('6d'), c('7d')];
	const ids = (cards: Card[]): string[] => cards.map((x) => x.id).sort();

	test('Olho peek: shows one card of the single rival to the player', () => {
		const { after } = playEffect(OL, 'peek', [OL, ...mine], theirs);
		expect(after.known).toHaveLength(1);
		const [k] = after.known;
		expect(k?.seat).toBe(1);
		expect(k?.to).toBe('us');
		expect(theirs.some((x) => x.id === k?.cardId)).toBe(true);
	});

	test('Olho peek is not drawn when the rival has no card left to show', () => {
		for (let seed = 1; seed <= 100; seed++) {
			const s = deal(fullDeck(), 1, zero, new Rng(seed), { seats: 2, vira: c('4h') });
			s.hands[1] = [];
			expect(drawEffect(s, OL, 0, new Rng(seed))).not.toBe('peek');
		}
	});

	test('Olho swap: the hands trade with the rival (there is no partner)', () => {
		const { before, after } = playEffect(OL, 'swap', [OL, ...mine], theirs);
		expect(after.hands[0]).toHaveLength(2);
		expect(after.hands[1]).toHaveLength(3);
		// Two cards of the rival moved to the player and the player's two went the other way.
		expect(after.hands[0].every((x) => theirs.some((y) => y.id === x.id))).toBe(true);
		expect(mine.every((x) => after.hands[1].some((y) => y.id === x.id))).toBe(true);
		expect(ids([...after.hands[0], ...after.hands[1]])).toEqual(ids([...mine, ...theirs]));
		expect(after.hands[2]).toEqual(before.hands[2]);
		expect(after.hands[3]).toEqual(before.hands[3]);
	});

	test('Olho swap drops a peeked card that moved to the player', () => {
		const { after } = playEffect(OL, 'swap', [OL, ...mine], [c('5d')], (s) => {
			s.known = [{ seat: 1, cardId: '5d', to: 'us' }];
		});
		expect(after.hands[0].map((x) => x.id)).toContain('5d');
		expect(after.known).toEqual([]);
	});

	test('Olho redraw: the player gets as many cards as they held, the rival is untouched', () => {
		const { before, after } = playEffect(OL, 'redraw', [OL, ...mine], theirs);
		expect(after.hands[0]).toHaveLength(2);
		expect(after.hands[1]).toEqual(before.hands[1]);
	});

	test('Trevo raise: the hand jumps one step', () => {
		const { before, after } = playEffect(TV, 'raise', [TV, ...mine], theirs);
		expect(after.bet).toBeGreaterThan(before.bet);
	});

	test('Trevo shield: the player loses only 1 tento when they run', () => {
		const { after } = playEffect(TV, 'shield', [TV, ...mine], theirs);
		expect(after.shield).toBe('us');
		const rng = new Rng(1);
		let s = apply(after, { kind: 'truco', seat: 1 }, rng).state;
		s = apply(s, { kind: 'truco', seat: 0 }, rng).state;
		s = apply(s, { kind: 'truco', seat: 1 }, rng).state;
		expect(s.pending?.to).toBe(9);
		s = apply(s, { kind: 'fold', seat: 0 }, rng).state;
		expect(s.over).toEqual({ winner: 'them', tentos: 1, reason: 'fold' });
	});

	test('Trevo bonus: the player wins BONUS_TENTOS extra with the hand', () => {
		const { after } = playEffect(
			TV,
			'bonus',
			[TV, c('3d'), c('3s')],
			[c('4d'), c('4s'), c('6d')],
		);
		expect(after.bonus).toBe('us');
		const s = run(after, [play(1, '4d'), play(0, '3d'), play(1, '4s')]);
		expect(s.over).toEqual({ winner: 'us', tentos: 1 + BONUS_TENTOS, reason: 'tricks' });
	});

	test('Raio freeze: nobody can call truco for the rest of the hand', () => {
		const { after } = playEffect(RA, 'freeze', [RA, ...mine], theirs);
		expect(after.frozen).toBe(true);
		expect(canCallTruco(after, 1)).toBe(false);
		expect(legalActions(after, 1).some((a) => a.kind === 'truco')).toBe(false);
	});

	test("Raio claim: the trick is the player's whatever the rival plays", () => {
		const { after } = playEffect(RA, 'claim', [RA, ...mine], [c('5c'), c('6d'), c('7d')]);
		const s = run(after, [play(1, '5c')]);
		expect(s.tricks[0]?.result).toBe('us');
		expect(s.tricks[0]?.winner).toBe(0);
	});

	test('Raio reversed: the weakest card wins the trick against the rival', () => {
		const { after } = playEffect(RA, 'reversed', [RA, ...mine], [c('4h'), c('6d'), c('7d')]);
		expect(after.reversed).toBe(true);
		const s = run(after, [play(1, '4h')]);
		expect(s.tricks[0]?.result).toBe('them');
	});

	test('Joker void: the trick against the single rival is a tie', () => {
		const joker = jokerCard();
		const { after } = playEffect(joker, 'void', [joker, ...mine], theirs);
		const s = run(after, [play(1, '5d')]);
		expect(s.tricks[0]?.result).toBe('tie');
	});

	test('Joker showdown: the observation shows both hands and nothing for the empty seats', () => {
		const joker = jokerCard();
		const { after } = playEffect(joker, 'showdown', [joker, ...mine], theirs);
		const o = observe(after, 0);
		expect(o.shownHands?.map((h) => h.length)).toEqual([2, 3, 0, 0]);
	});

	const brains: [SeatBrain, SeatBrain] = [
		{ kind: 'ai', profile: AI_PROFILES.pro },
		{ kind: 'ai', profile: AI_PROFILES.pro },
	];

	test('Bisbilhoteiro (peek Manha): the card shown is always the rival at seat 1', () => {
		for (let seed = 1; seed <= 30; seed++) {
			const m = new Match({ rng: new Rng(seed), brains, manhas: ['bisbilhoteiro'] });
			expect(m.peek?.seat).toBe(1);
			expect(m.state.hands[1].some((x) => x.id === m.peek?.cardId)).toBe(true);
		}
	});

	test('boss A Sortuda: the vira can make a card of the single rival a manilha', () => {
		expect(SORTUDA_CHANCE).toBeGreaterThan(0);
		let hits = 0;
		for (let seed = 1; seed <= 50; seed++) {
			const s = deal(standardDeck(), 1, zero, new Rng(seed), { seats: 2, rigViraRivals: 1 });
			if (s.hands[1].some((x) => x.rank === viraManilha(s.vira))) hits++;
		}
		expect(hits).toBeGreaterThanOrEqual(48);
	});

	test('boss Rei do Truco: hands start at 3 in 1v1', () => {
		expect(new Match({ rng: new Rng(1), brains, boss: 'reiDoTruco' }).state.bet).toBe(3);
	});

	test('boss O Valentão: the rival calls truco on its first turn in 1v1', () => {
		const m = new Match({ rng: new Rng(1), brains, boss: 'valentao' });
		const first = m.legal(0).find((a) => a.kind === 'play' && !a.faceDown);
		m.act(first as NonNullable<typeof first>);
		expect(m.actor()).toBe(1);
		expect(m.aiAction(1).kind).toBe('truco');
	});
});

describe('1v1: observation and AI (R1.6)', () => {
	test('observe: one hidden hand, no partner knowledge, public hand sizes', () => {
		const s = fixed(STRONG, WEAK);
		const o = observe(s, 0);
		expect(o.seats).toBe(2);
		expect(o.partnerHand).toBeNull();
		expect(o.partnerMarked).toEqual([]);
		expect(o.signals).toEqual([]);
		expect(o.handSizes).toEqual([3, 3, 0, 0]);
		expect(JSON.stringify(o)).not.toContain('"4s"');
	});

	test('winChance samples the one hidden hand: a strong hand beats a weak one', () => {
		const deck = standardDeck();
		const strong = winChance(observe(fixed(STRONG, WEAK), 0), deck, new Rng(1), 200);
		const weak = winChance(observe(fixed(WEAK, STRONG), 0), deck, new Rng(1), 200);
		expect(strong).toBeGreaterThan(0.8);
		expect(weak).toBeLessThan(0.2);
	});

	test(
		'the pro bot beats the random bot in at least 75% of 1,000 matches, deciding fast',
		() => {
			const pro: SeatBrain = { kind: 'ai', profile: AI_PROFILES.pro };
			const rand: SeatBrain = { kind: 'random' };
			let wins = 0;
			let ms = 0;
			let decisions = 0;
			const n = 1000;
			for (let seed = 1; seed <= n; seed++) {
				const r = playHeadsUp(seed, [pro, rand]);
				if (r.winner === 'us') wins++;
				ms += r.aiMs;
				decisions += r.aiDecisions;
			}
			console.log(
				`1v1 pro vs random: ${wins}/${n}, ${(ms / decisions).toFixed(3)} ms per decision`,
			);
			expect(wins / n).toBeGreaterThanOrEqual(0.75);
			expect(ms / decisions).toBeLessThanOrEqual(20);
		},
		workTimeout(1000, MS_PER_MATCH),
	);
});
