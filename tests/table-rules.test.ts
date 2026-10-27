import { describe, expect, test } from 'bun:test';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { Match, type MatchOptions, manilhasSeen, type SeatBrain } from '../src/game/match';
import { decide } from '../src/logic/ai/decide';
import { Rng } from '../src/logic/rng';
import { scoreHand } from '../src/logic/score/score';
import { parseCard, standardDeck, viraManilha } from '../src/logic/truco/cards';
import { observe } from '../src/logic/truco/observe';
import { apply, DEFAULT_RULES, deal, legalActions, type Seat } from '../src/logic/truco/table';

const pro: SeatBrain = { kind: 'ai', profile: AI_PROFILES.pro };
const brains: MatchOptions['brains'] = [pro, pro, pro, pro];
const match = (o: Partial<MatchOptions> = {}): Match =>
	new Match({ rng: new Rng(7), brains, goal: 100, ...o });

describe('table-rule Manhas (A3.2)', () => {
	test('Rei da Mesa (and the Rei do Truco boss): normal hands start at 3', () => {
		expect(match().state.bet).toBe(1);
		expect(match({ manhas: ['reiDaMesa'] }).state.bet).toBe(3);
		expect(match({ boss: 'reiDoTruco' }).state.bet).toBe(3);
	});

	test('Gritador: the first accepted call of your team jumps 3 → 6, once', () => {
		let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), {
			rules: { ...DEFAULT_RULES, bonusStep: 'us' },
		});
		const rng = new Rng(1);
		s = apply(s, { kind: 'truco', seat: 0 }, rng).state;
		s = apply(s, { kind: 'accept', seat: 1 }, rng).state;
		expect(s.bet).toBe(6);
		expect(s.rules.bonusStep).toBeUndefined();
		const m = match({ manhas: ['gritador'] });
		expect(m.state.rules.bonusStep).toBe('us');
	});

	test('Vira Viciada: the vira makes a card of your hand a manilha', () => {
		let hits = 0;
		for (let seed = 1; seed <= 50; seed++) {
			const s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(seed), { rigVira: 1 });
			if (s.hands[0].some((c) => c.rank === viraManilha(s.vira))) hits++;
		}
		expect(hits).toBeGreaterThanOrEqual(48);
	});

	test('Bisbilhoteiro shows one card of a rival; Contador counts shown manilhas', () => {
		const m = match({ manhas: ['bisbilhoteiro'] });
		const peek = m.peek;
		expect(peek).not.toBeNull();
		if (peek) expect(m.state.hands[peek.seat].some((c) => c.id === peek.cardId)).toBe(true);
		expect(match().peek).toBeNull();
		let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(2), {
			vira: parseCard('4c') ?? undefined,
		});
		s.hands[0] = ['5h', '3h', '2h'].map((x) => parseCard(x)).filter((c) => c !== null);
		s = apply(s, { kind: 'play', seat: 0, cardId: '5h' }, new Rng(1)).state;
		expect(manilhasSeen(s)).toBe(1);
	});

	test('Cara de Pau: armed after your team runs; a scaled reading makes the rival run', () => {
		const m = match({ manhas: ['caraDePau'] });
		m.act({ kind: 'truco', seat: 0 });
		expect(m.caraDePauArmed).toBe(false);
		m.nextHand();
		const caller = m.actor() as Seat;
		m.act({ kind: 'truco', seat: caller });
		const responder = m.actor() as Seat;
		if (
			(responder === 0 || responder === 2) &&
			legalActions(m.state, responder).some((a) => a.kind === 'fold')
		) {
			m.act({ kind: 'fold', seat: responder });
			expect(m.caraDePauArmed).toBe(true);
		}
		let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(3));
		s = apply(s, { kind: 'truco', seat: 0 }, new Rng(1)).state;
		const a = decide(
			observe(s, 1),
			legalActions(s, 1),
			{
				profile: { ...AI_PROFILES.pro, error: 0 },
				deck: standardDeck(),
				rivalFame: 0,
				callScale: 0,
			},
			new Rng(1),
		);
		expect(a.kind).toBe('fold');
	});
});

describe('bosses (A4.5)', () => {
	test('O Juiz disables the leftmost Manha', () => {
		expect(match({ boss: 'juiz', manhas: ['malandro', 'seuZe'] }).active).toEqual(['seuZe']);
		expect(match({ manhas: ['malandro', 'seuZe'] }).active).toEqual(['malandro', 'seuZe']);
	});

	test('O Valentão: the rivals call truco in every hand', () => {
		for (let seed = 1; seed <= 5; seed++) {
			const m = new Match({ rng: new Rng(seed), brains, goal: 100, boss: 'valentao' });
			let called = false;
			for (let seat = m.actor(); seat !== null && !called; seat = m.actor()) {
				const a = m.aiAction(seat);
				if (a.kind === 'truco' && (seat === 1 || seat === 3)) called = true;
				m.act(a);
			}
			expect(called || m.state.over?.reason === 'fold').toBe(true);
		}
	});

	test('O Delegado halves Corrida; O Agiota fines a lost hand', () => {
		let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1));
		const rng = new Rng(1);
		const won = apply(
			apply(s, { kind: 'truco', seat: 0 }, rng).state,
			{ kind: 'fold', seat: 1 },
			rng,
		).state;
		const full = scoreHand({ state: won, queda: false }).points;
		expect(full).toBeGreaterThan(0);
		expect(scoreHand({ state: won, queda: false, boss: 'delegado' }).points).toBe(full / 2);
		s = apply(
			apply(s, { kind: 'truco', seat: 0 }, rng).state,
			{ kind: 'truco', seat: 1 },
			rng,
		).state;
		const lost = apply(s, { kind: 'fold', seat: 0 }, rng).state;
		expect(scoreHand({ state: lost, queda: false, boss: 'agiota' }).money).toBe(-1);
	});
});

describe('table save (A4.8, D-32)', () => {
	test('resuming a saved hand deals the same cards and keeps the table', () => {
		const m = match({ manhas: ['seuZe'] });
		for (let seat = m.actor(); seat !== null; seat = m.actor()) m.act(m.aiAction(seat));
		m.nextHand();
		const saved = structuredClone(m.progress);
		const hands = structuredClone(m.state.hands);
		const again = new Match({
			rng: new Rng(999),
			brains,
			goal: 100,
			manhas: ['seuZe'],
			resume: saved,
		});
		expect(again.state.hands).toEqual(hands);
		expect(again.points).toBe(m.points);
		expect(again.hands).toBe(m.hands);
		expect(again.state.score).toEqual(m.state.score);
	});
});
