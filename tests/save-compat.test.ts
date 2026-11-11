import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { buy, leaveShop, parseRun, projectedReward } from '../src/logic/run/run';
import { checksum, parseSave, SAVE_VERSION } from '../src/logic/save';

/**
 * Saves written by released builds must keep loading (RC1.3). Each fixture was produced by the
 * code at its tag (`git archive v<tag> src` + serializeSave), never by the current code.
 */
const FIXTURES = [
	{ version: '0.1.0-beta.1', partner: 'cida' },
	{ version: '0.10.0', partner: 'mia' },
	// partnerFolds false, the Interior deck and a run waiting in the shop (before the 0.13 traits,
	// the hidden table choice and the optional key hints).
	{ version: '0.12.0', partner: 'ayla' },
	// Schema 2, the trinket shop; the last build before packs, Melhorias and table skipping left (D-82).
	{ version: '0.19.0', partner: 'mia' },
] as const;

const REMOVED_RUN_KEYS = ['upgrades', 'upgradeChamp', 'promises'];
const REMOVED_SHOP_KEYS = ['packs', 'upgrade', 'opened'];

/** A schema-2 save (0.19.0 and before) holding `run`, written the way the game wrote it. */
const v2Save = (run: Record<string, unknown> | null): string => {
	const payload = JSON.stringify({ meta: { feats: ['primeiraMao'] }, run });
	return JSON.stringify({ schemaVersion: 2, checksum: checksum(payload), payload });
};

test('a v1 save is migrated to the real character names', () => {
	const payload = JSON.stringify({
		meta: { feats: ['comTonhao'], unlocked: ['partner:zeMalandro'], seen: ['boss:mudo'] },
		run: { partner: 'donaCida', rivals: { chars: ['ze', 'bia'] } },
	});
	const text = JSON.stringify({ schemaVersion: 1, checksum: checksum(payload), payload });
	const res = parseSave(text, 'en');
	expect(res.ok).toBe(true);
	if (!res.ok) return;
	expect(res.save.meta.feats).toEqual(['comBruto']);
	expect(res.save.meta.unlocked).toEqual(['partner:jhony']);
	expect(res.save.meta.seen).toEqual(['boss:peter']);
	expect(res.save.run).toEqual({ partner: 'cida', rivals: { chars: ['ze', 'mia'] } });
});

describe('save compatibility (RC1.3)', () => {
	for (const { version, partner } of FIXTURES) {
		test(`a ${version} save with a run in progress loads`, () => {
			const text = readFileSync(`tests/fixtures/save-${version}.json`, 'utf8');
			const res = parseSave(text, 'en');
			expect(res.ok).toBe(true);
			if (!res.ok) return;
			expect(res.save.settings.volume.music).toBe(0.4);
			expect(res.save.meta.tutorialDone).toBe(true);
			expect(res.save.meta.stats.runs).toBe(3);
			const raw = res.save.run as Record<string, unknown>;
			for (const k of REMOVED_RUN_KEYS) expect(raw).not.toHaveProperty(k);
			for (const k of REMOVED_SHOP_KEYS) expect(raw.shop ?? {}).not.toHaveProperty(k);
			const run = parseRun(res.save.run);
			expect(run?.partner).toBe(partner);
			expect(run?.stake).toBe(2);
			expect(run?.money).toBe(17);
			expect(run?.manhas).toEqual(['seuZe', 'malandro']);
			expect(res.save.settings.keyHints).toBe(false);
			// The current run code plays on from it.
			if (!run) return;
			expect(() => projectedReward(run, 0, 0)).not.toThrow();
			if (run.phase === 'shop') expect(() => leaveShop(run)).not.toThrow();
		});
	}
});

describe('removed run systems (D-82, schema 3)', () => {
	const base = {
		v: 1,
		seed: 7,
		startDeck: 'normal',
		stake: 1,
		legendary: false,
		demo: false,
		rng: 123,
		champ: 2,
		table: 1,
		bosses: [
			'valentao',
			'stuart',
			'sortuda',
			'valentao',
			'stuart',
			'sortuda',
			'valentao',
			'reiDoTruco',
		],
		money: 30,
		manhas: ['seuZe'],
		manhaSlots: 6,
		consumables: [],
		consumableSlots: 2,
		deck: [{ id: '3c', rank: '3', suit: 'clubs' }],
		cardSerial: 0,
		levels: {},
		partner: 'bruto',
		partnerLevel: 1,
		upgrades: ['maisManha', 'desconto'],
		upgradeChamp: 2,
		promises: ['vidaExtra'],
		extraLife: false,
		rivals: { chars: ['ze', 'mia'], profiles: ['rookie', 'rookie'] },
		endless: false,
		tableSave: null,
		stats: { hands: 4, bestHand: 20, tables: 2 },
	};

	test('the schema is bumped and a shop with a pack, an upgrade and an open pack loads', () => {
		expect(SAVE_VERSION).toBe(3);
		const offers = [{ kind: 'manha' as const, id: 'seuZe' as const, price: 5, sold: false }];
		const res = parseSave(
			v2Save({
				...base,
				phase: 'shop',
				shop: {
					offers,
					packs: [{ kind: 'pack', pack: 'baralho', price: 4, sold: true }],
					upgrade: { kind: 'upgrade', id: 'espiarMonte', price: 6, sold: false },
					rerolls: 1,
					opened: [{ kind: 'card', card: { id: 'pack0', rank: '3', suit: 'clubs' } }],
				},
			}),
			'en',
		);
		expect(res.ok).toBe(true);
		if (!res.ok) return;
		expect(res.save.meta.feats).toEqual(['primeiraMao']);
		const run = parseRun(res.save.run);
		if (!run) throw new Error('the run did not load');
		for (const k of REMOVED_RUN_KEYS) expect(run).not.toHaveProperty(k);
		expect(run.shop).toEqual({ offers, rerolls: 1 });
		expect(run.manhaSlots).toBe(6);
		expect(buy(run, 0)).toBeNull();
		leaveShop(run);
		expect(run.phase).toBe('select');
		expect(run.table).toBe(1);
	});

	test('a run on the table-choice phase with a pending Promise loads and plays on', () => {
		const res = parseSave(v2Save({ ...base, phase: 'select', shop: null }), 'en');
		expect(res.ok).toBe(true);
		if (!res.ok) return;
		const run = parseRun(res.save.run);
		expect(run?.phase).toBe('select');
		expect(run).not.toHaveProperty('promises');
		expect(run?.shop).toBeNull();
	});

	test('a save without a run is untouched', () => {
		const res = parseSave(v2Save(null), 'en');
		expect(res.ok).toBe(true);
		if (res.ok) expect(res.save.run).toBeNull();
	});
});
