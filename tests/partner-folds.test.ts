import { describe, expect, test } from 'bun:test';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { Match, type SeatBrain } from '../src/game/match';
import { Rng } from '../src/logic/rng';
import { standardDeck } from '../src/logic/truco/cards';
import { apply, DEFAULT_RULES, deal, type Seat, type TableState } from '../src/logic/truco/table';

const table = (humanAnswers: boolean, turn: Seat): TableState => ({
	...deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), {
		rules: { ...DEFAULT_RULES, ...(humanAnswers ? { humanAnswers } : {}) },
	}),
	turn,
});

const pro: SeatBrain = { kind: 'ai', profile: AI_PROFILES.pro };
const human: SeatBrain = { kind: 'human' };

describe('only the player answers the rivals’ truco (the AI partner never does)', () => {
	test('rule off: the next seat, the partner, would answer', () => {
		const s = apply(table(false, 1), { kind: 'truco', seat: 1 }, new Rng(1)).state;
		expect(s.pending?.responder).toBe(2);
	});

	test('rule on: the player answers every call and raise against the team', () => {
		const s = apply(table(true, 1), { kind: 'truco', seat: 1 }, new Rng(1)).state;
		expect(s.pending?.responder).toBe(0);
		// The partner called, a rival raised: the answer is still the player's.
		let r = apply(table(true, 2), { kind: 'truco', seat: 2 }, new Rng(1)).state;
		r = apply(r, { kind: 'truco', seat: 3 }, new Rng(1)).state;
		expect(r.pending?.responder).toBe(0);
		// The rivals' answers are unchanged, and the partner can still call.
		const u = apply(table(true, 0), { kind: 'truco', seat: 0 }, new Rng(1)).state;
		expect(u.pending?.responder).toBe(1);
	});

	test('a match with an AI partner turns the rule on; a human partner (LAN) does not', () => {
		expect(
			new Match({ rng: new Rng(7), brains: [human, pro, pro, pro] }).state.rules.humanAnswers,
		).toBe(true);
		expect(
			new Match({ rng: new Rng(7), brains: [pro, pro, pro, pro] }).state.rules.humanAnswers,
		).toBe(true);
		expect(
			new Match({ rng: new Rng(7), brains: [human, pro, human, pro] }).state.rules
				.humanAnswers,
		).toBeUndefined();
	});

	test('LAN: a person whose partner is a bot answers for the pair, in any seat', () => {
		const rules = (brains: [SeatBrain, SeatBrain, SeatBrain, SeatBrain]) =>
			new Match({ rng: new Rng(7), brains }).state.rules;
		// Two people as opponents, each with a bot partner.
		expect(rules([human, human, pro, pro]).answers).toEqual({ them: 1 });
		expect(rules([human, pro, pro, human]).answers).toEqual({ them: 3 });
		// A lone person at seat 2 answers for a bot at seat 0.
		const r = rules([pro, human, human, pro]);
		expect(r.answers).toEqual({ us: 2, them: 1 });
		expect(r.humanAnswers).toBeUndefined();
		// Two people in a pair answer for themselves; a solo table keeps only `humanAnswers`.
		expect(rules([human, human, human, human]).answers).toBeUndefined();
		expect(rules([human, pro, pro, pro]).answers).toBeUndefined();

		const base = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), {
			rules: { ...DEFAULT_RULES, answers: { them: 1 } },
		});
		// Seat 2 calls: the next seat is the bot at 3, but the person at 1 answers.
		const s = apply({ ...base, turn: 2 }, { kind: 'truco', seat: 2 }, new Rng(1)).state;
		expect(s.pending?.responder).toBe(1);
	});

	test('a rival never gets to wait for the partner: the answerer of a call on us is seat 0', () => {
		const m = new Match({ rng: new Rng(3), brains: [pro, pro, pro, pro] });
		for (let i = 0; i < 400 && !m.winner; i++) {
			const a = m.actor();
			if (a === null) {
				m.nextHand();
				continue;
			}
			m.act(m.aiAction(a));
			const p = m.state.pending;
			if (p && [1, 3].includes(p.by)) expect(p.responder).toBe(0);
		}
	});
});
