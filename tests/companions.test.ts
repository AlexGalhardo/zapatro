import { describe, expect, test } from 'bun:test';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { COMPANION_IDS, COMPANIONS, type CompanionId } from '../src/data/companions';
import { DEFAULT_UNLOCKS } from '../src/data/feats';
import { Match, type SeatBrain } from '../src/game/match';
import { simulateRun } from '../src/game/run-sim';
import { seatTraits } from '../src/game/traits';
import { TABLES_FOR_TEST } from '../src/i18n';
import { Rng } from '../src/logic/rng';
import { drawCandidates } from '../src/logic/run/draw';
import { newRun, startTable } from '../src/logic/run/run';

const all = [...COMPANION_IDS];
const ai = (id: keyof typeof AI_PROFILES = 'pro'): SeatBrain => ({
	kind: 'ai',
	profile: AI_PROFILES[id],
});
const brains: [SeatBrain, SeatBrain, SeatBrain, SeatBrain] = [ai(), ai(), ai(), ai()];

describe('companions data', () => {
	test('10 ids, each with a perk and a different flaw', () => {
		expect(COMPANION_IDS).toHaveLength(10);
		for (const id of COMPANION_IDS) {
			const c = COMPANIONS[id];
			expect(c.perk.k).not.toBe(c.flaw.k);
		}
	});

	test('names and trait texts exist in EN and PT-BR', () => {
		for (const lang of ['en', 'pt-BR'] as const) {
			const table = TABLES_FOR_TEST[lang] as Record<string, string>;
			for (const id of COMPANION_IDS) expect(table[`char.${id}`]).toBeDefined();
			for (const id of COMPANION_IDS)
				for (const tr of [COMPANIONS[id].perk, COMPANIONS[id].flaw])
					expect(table[`companion.trait.${tr.k}`]).toBeDefined();
			for (const id of COMPANION_IDS) expect(table[`partner.${id}.name`]).toBeUndefined();
		}
	});

	test('a fresh save unlocks 8 of them', () => {
		const open = COMPANION_IDS.filter((id) =>
			(DEFAULT_UNLOCKS as readonly string[]).includes(`partner:${id}`),
		);
		expect(open).toHaveLength(8);
	});
});

describe('drawCandidates', () => {
	test('3 distinct unlocked ids, the same for the same seed', () => {
		for (let seed = 1; seed <= 100; seed++) {
			const a = drawCandidates(seed, all);
			expect(a).toHaveLength(3);
			expect(new Set(a).size).toBe(3);
			expect(drawCandidates(seed, all)).toEqual(a);
		}
	});

	test('different seeds give different offers', () => {
		const keys = new Set(
			Array.from({ length: 100 }, (_, i) => drawCandidates(i + 1, all).join()),
		);
		expect(keys.size).toBeGreaterThan(60);
	});

	test('the last partner sits out when there are 4 or more', () => {
		for (let seed = 1; seed <= 100; seed++)
			expect(drawCandidates(seed, all, 'tonhao')).not.toContain('tonhao');
	});

	test('only unlocked ids are offered', () => {
		const open: CompanionId[] = ['tonhao', 'donaCida', 'bia'];
		for (let seed = 1; seed <= 20; seed++)
			expect([...drawCandidates(seed, open)].sort()).toEqual([...open].sort());
	});

	test('prefers a different style for each pick', () => {
		for (let seed = 1; seed <= 100; seed++) {
			const styles = drawCandidates(seed, all).map((id) => COMPANIONS[id].style);
			expect(new Set(styles).size).toBe(3);
		}
	});
});

describe('rivals are never the chosen partner', () => {
	test('over 300 simulated runs', () => {
		for (let seed = 1; seed <= 300; seed++) {
			const partner = drawCandidates(seed, all)[0] as CompanionId;
			const run = newRun(seed, partner, 'normal', 1);
			for (let i = 0; i < 6; i++) {
				startTable(run);
				expect(run.rivals.chars).not.toContain(partner);
				run.table = ((run.table + 1) % 3) as 0 | 1 | 2;
			}
		}
	});

	test('a whole run still plays', () => {
		expect(simulateRun(7, 'good', 1).champ).toBeGreaterThanOrEqual(1);
	});
});

/** A Match with `a` at seat 2 (our side) and `b` at seat 1 (their side), everybody else neutral. */
function seated(a: string, b: string, extra: object = {}): Match {
	const chars = { 0: 'player', 1: b, 2: a, 3: 'x' } as const;
	return new Match({ rng: new Rng(5), brains, traits: seatTraits(chars), ...extra });
}

describe('traits work for the pair the companion sits in', () => {
	test('headStart: his pair starts with tentos, wherever he sits', () => {
		expect(seated('ze', 'x').score).toEqual({ us: 1, them: 0 });
		expect(seated('x', 'ze').score).toEqual({ us: 0, them: 1 });
	});

	test('signals: the pair sends more (Zé Malandro) or fewer (Joca)', () => {
		expect(seated('zeMalandro', 'x').rules.signals).toEqual([2, 1, 2, 1]);
		expect(seated('x', 'zeMalandro').rules.signals).toEqual([1, 2, 1, 2]);
		expect(seated('joca', 'x').rules.signals).toEqual([0, 1, 0, 1]);
	});

	test('catch: Lurdes catches more for her pair and is caught twice as often', () => {
		const base = seated('x', 'x').rules.catchChance;
		const us = seated('lurdes', 'x').rules.catchChance;
		expect(us[0]).toBeGreaterThan(base[0]);
		expect(us[1]).toBeGreaterThan(base[1]);
		const them = seated('x', 'lurdes').rules.catchChance;
		expect(them[1]).toBeGreaterThan(base[1]);
		expect(them[0]).toBeGreaterThan(base[0]);
	});

	test("caughtMult: Bia's pair is caught half as often", () => {
		const base = seated('x', 'x').rules.catchChance;
		expect(seated('bia', 'x').rules.catchChance[1]).toBeCloseTo(base[1] * 0.5);
		expect(seated('x', 'bia').rules.catchChance[0]).toBeCloseTo(base[0] * 0.5);
	});

	test('neverFolds: Tonhão accepts every truco', () => {
		const m = seated('tonhao', 'x', {
			brains: [ai(), ai('coward'), ai('coward'), ai('coward')],
		});
		let answered = 0;
		for (let hand = 0; hand < 40 && !m.winner; hand++) {
			for (let seat = m.actor(); seat !== null; seat = m.actor()) {
				const a = m.aiAction(seat);
				if (seat === 2 && m.state.pending?.responder === 2) {
					answered++;
					expect(a.kind).not.toBe('fold');
				}
				m.act(a);
			}
			if (!m.winner) m.nextHand();
		}
		expect(answered).toBeGreaterThan(0);
	});
});
