import { describe, expect, test } from 'bun:test';
import {
	COMPANION_IDS,
	COMPANIONS,
	type CompanionId,
	PARTNER_TRAITS,
} from '../src/data/companions';
import { DEFAULT_UNLOCKS } from '../src/data/feats';
import { simulateRun } from '../src/game/run-sim';
import { TABLES_FOR_TEST } from '../src/i18n';
import { drawCandidates } from '../src/logic/run/draw';
import { newRun, startTable } from '../src/logic/run/run';

const all = [...COMPANION_IDS];
describe('companions data', () => {
	test('10 ids, each with its own Perk and Flaw numbers', () => {
		expect(COMPANION_IDS).toHaveLength(10);
		for (const id of COMPANION_IDS)
			expect(Object.keys(PARTNER_TRAITS[id]).length).toBeGreaterThan(1);
	});

	test('names and trait texts exist in EN and PT-BR', () => {
		for (const lang of ['en', 'pt-BR'] as const) {
			const table = TABLES_FOR_TEST[lang] as Record<string, string>;
			for (const id of COMPANION_IDS) expect(table[`char.${id}`]).toBeDefined();
			for (const id of COMPANION_IDS)
				for (const k of ['perk', 'flaw'])
					expect(table[`companion.${id}.${k}`]).toBeDefined();
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
			expect(drawCandidates(seed, all, 'bruto')).not.toContain('bruto');
	});

	test('only unlocked ids are offered', () => {
		const open: CompanionId[] = ['bruto', 'cida', 'mia'];
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
