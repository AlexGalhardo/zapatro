import { describe, expect, test } from 'bun:test';
import { COMPANIONS, type CompanionId } from '../src/data/companions';
import { GOOD_BOT } from '../src/game/run-sim';
import { tableMatch } from '../src/game/run-table';
import { newRun, startTable } from '../src/logic/run/run';
import { strength } from '../src/logic/truco/cards';

/** How a partner (seat 2) played the bets over a few tables of a fresh run. */
function habits(partner: CompanionId, tables = 200) {
	const n = { chances: 0, calls: 0, weakChances: 0, weakCalls: 0, answers: 0, folds: 0 };
	for (let i = 0; i < tables; i++) {
		const run = newRun(1000 + i, partner, 'normal', 1);
		startTable(run);
		const m = tableMatch(run, { kind: 'ai', profile: GOOD_BOT });
		for (let hand = 0; hand < 12 && !m.winner; hand++) {
			for (let seat = m.actor(); seat !== null; seat = m.actor()) {
				const action = m.aiAction(seat);
				if (seat === 2) {
					const s = m.state;
					if (s.pending?.responder === 2) {
						n.answers++;
						if (action.kind === 'fold') n.folds++;
					} else if (
						action.kind !== 'signal' &&
						m.legal(2).some((a) => a.kind === 'truco')
					) {
						const best = Math.max(...s.hands[2].map((c) => strength(c, s.manilha)));
						const weak = best <= 4 && s.hands[2].length === 3;
						n.chances++;
						if (weak) n.weakChances++;
						if (action.kind === 'truco') {
							n.calls++;
							if (weak) n.weakCalls++;
						}
					}
				}
				m.act(action);
			}
			if (!m.winner) m.nextHand();
		}
	}
	return {
		callRate: n.calls / Math.max(1, n.chances),
		bluffRate: n.weakCalls / Math.max(1, n.weakChances),
		foldRate: n.folds / Math.max(1, n.answers),
	};
}

describe('partner styles (each partner plays the bets their own way)', () => {
	const h = Object.fromEntries(
		(['tonhao', 'donaCida', 'zeMalandro', 'juninho'] as const).map((p) => [p, habits(p)]),
	) as Record<CompanionId, ReturnType<typeof habits>>;

	test('every partner has a style', () => {
		for (const def of Object.values(COMPANIONS)) expect(def.style).toBeDefined();
	});

	test('Tonhão (aggressive) calls truco the most; Dona Cida (cautious) the least', () => {
		const rates = Object.values(h).map((x) => x.callRate);
		expect(h.tonhao.callRate).toBe(Math.max(...rates));
		expect(h.donaCida.callRate).toBe(Math.min(...rates));
	});

	test('Zé Malandro (bluffer) calls truco with weak hands far more than the others', () => {
		expect(h.zeMalandro.bluffRate).toBeGreaterThan(0.25);
		for (const p of ['tonhao', 'donaCida', 'juninho'] as const)
			expect(h.zeMalandro.bluffRate).toBeGreaterThan(h[p].bluffRate);
		expect(h.donaCida.bluffRate).toBeLessThan(0.1);
	});

	test('Juninho (fearless) runs from calls less than Dona Cida', () => {
		expect(h.juninho.foldRate).toBeLessThan(h.donaCida.foldRate);
	});
});
