import { describe, expect, test } from 'bun:test';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { Match, type SeatBrain } from '../src/game/match';
import { Rng } from '../src/logic/rng';
import { newRun } from '../src/logic/run/run';
import { standardDeck } from '../src/logic/truco/cards';
import { apply, DEFAULT_RULES, deal, type Seat, type TableState } from '../src/logic/truco/table';

const table = (humanAnswers: boolean, turn: Seat): TableState => ({
	...deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), {
		rules: { ...DEFAULT_RULES, ...(humanAnswers ? { humanAnswers } : {}) },
	}),
	turn,
});

describe('run option: the partner may run from a truco', () => {
	test("on (classic): the rival's call is answered by the next seat, your partner", () => {
		const s = apply(table(false, 1), { kind: 'truco', seat: 1 }, new Rng(1)).state;
		expect(s.pending?.responder).toBe(2);
	});

	test('off: you answer every call against your team', () => {
		const s = apply(table(true, 1), { kind: 'truco', seat: 1 }, new Rng(1)).state;
		expect(s.pending?.responder).toBe(0);
		// The partner called, a rival raised: the answer is still yours.
		let r = apply(table(true, 2), { kind: 'truco', seat: 2 }, new Rng(1)).state;
		r = apply(r, { kind: 'truco', seat: 3 }, new Rng(1)).state;
		expect(r.pending?.responder).toBe(0);
		// The rivals' answers are unchanged.
		const u = apply(table(true, 0), { kind: 'truco', seat: 0 }, new Rng(1)).state;
		expect(u.pending?.responder).toBe(1);
	});

	test('the run carries the choice to the table (old saves: on)', () => {
		const pro: SeatBrain = { kind: 'ai', profile: AI_PROFILES.pro };
		const m = new Match({ rng: new Rng(7), brains: [pro, pro, pro, pro], partnerFolds: false });
		expect(m.state.rules.humanAnswers).toBe(true);
		expect(newRun(1, 'tonhao').partnerFolds).toBe(true);
		expect(newRun(1, 'tonhao', 'normal', 1, false, false, false).partnerFolds).toBe(false);
	});
});
