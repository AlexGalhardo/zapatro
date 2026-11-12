import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { GOOD_BOT } from '../src/game/run-sim';
import { tableMatch } from '../src/game/run-table';
import {
	buy,
	finishTable,
	leaveShop,
	newRun,
	parseRun,
	projectedReward,
	type RunState,
	startTable,
} from '../src/logic/run/run';
import {
	checksum,
	defaultSave,
	emptyStats,
	parseSave,
	SAVE_VERSION,
	serializeSave,
} from '../src/logic/save';

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
			// Every run so far was 2×2, and so were the lifetime counts.
			expect(run?.mode).toBe('2v2');
			expect(res.save.meta.stats.byMode).toEqual({
				'2v2': { runs: 3, wins: res.save.meta.stats.wins },
				'1v1': { runs: 0, wins: 0 },
			});
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
		expect(SAVE_VERSION).toBeGreaterThanOrEqual(3);
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

describe('run mode and stats per mode (D-77, schema 4)', () => {
	const run = (): Record<string, unknown> => JSON.parse(JSON.stringify(newRun(5, 'cida')));
	/** A schema-3 save: the run has no `mode`, the stats no `byMode`, the history no `mode`. */
	const v3Save = (r: Record<string, unknown> | null): string => {
		const stats = {
			runs: 7,
			wins: 2,
			history: [{ at: 1, reason: 'won', championship: 8, bestHand: 90, deck: 'normal' }],
		};
		const payload = JSON.stringify({ meta: { stats }, run: r });
		return JSON.stringify({ schemaVersion: 3, checksum: checksum(payload), payload });
	};

	test('the schema is 4', () => {
		expect(SAVE_VERSION).toBe(4);
	});

	test('a schema-3 run becomes 2v2, the stats start from the totals', () => {
		const raw = run();
		delete raw.mode;
		const res = parseSave(v3Save(raw), 'en');
		expect(res.ok).toBe(true);
		if (!res.ok) return;
		expect(parseRun(res.save.run)?.mode).toBe('2v2');
		const st = res.save.meta.stats;
		expect(st.byMode).toEqual({ '2v2': { runs: 7, wins: 2 }, '1v1': { runs: 0, wins: 0 } });
		expect(st.history[0]?.mode).toBe('2v2');
	});

	test('a save with no run or no stats still loads', () => {
		const res = parseSave(v3Save(null), 'en');
		expect(res.ok && res.save.run).toBeNull();
		expect(emptyStats().byMode).toEqual({
			'2v2': { runs: 0, wins: 0 },
			'1v1': { runs: 0, wins: 0 },
		});
	});

	/** Writes the run into a save, reads it back and parses the run, as the game does. */
	const roundTrip = (r: RunState): RunState => {
		const save = defaultSave('en');
		save.run = r;
		const res = parseSave(serializeSave(save), 'en');
		if (!res.ok) throw new Error(res.reason);
		const back = parseRun(res.save.run);
		if (!back) throw new Error('the run did not load');
		return back;
	};
	const duel = (): RunState => newRun(21, undefined, 'normal', 1, false, false, '1v1');

	test('a 1v1 run saved in the middle of a table loads and continues', () => {
		const r = duel();
		startTable(r);
		const m = tableMatch(r, { kind: 'ai', profile: GOOD_BOT });
		for (let hand = 0; hand < 2; hand++) {
			for (let seat = m.actor(); seat !== null; seat = m.actor()) m.act(m.aiAction(seat));
			m.nextHand();
		}
		r.tableSave = m.progress;
		const back = roundTrip(r);
		expect(back.mode).toBe('1v1');
		expect(back.partner).toBeUndefined();
		expect(back.rivals).toEqual(r.rivals);
		expect(back.tableSave).toEqual(m.progress);
		// The saved hand is dealt again as it was.
		const again = tableMatch(back, { kind: 'ai', profile: GOOD_BOT });
		expect(again.seats).toBe(2);
		expect(again.state.hands).toEqual(m.state.hands);
		expect(again.state.vira).toEqual(m.state.vira);
		expect(again.hands).toBe(m.hands);
		for (;;) {
			for (let seat = again.actor(); seat !== null; seat = again.actor())
				again.act(again.aiAction(seat));
			if (again.winner || again.hands >= 80) break;
			again.nextHand();
		}
		expect(again.hands).toBeGreaterThan(m.hands);
	});

	test('a 1v1 run saved in the shop loads, buys and goes on to the next table', () => {
		const r = duel();
		startTable(r);
		finishTable(r, { won: true, rivalTentos: 4, money: 0, hands: 5, bestHand: 40 });
		expect(r.phase).toBe('shop');
		const back = roundTrip(r);
		expect(back.mode).toBe('1v1');
		expect(back.shop).toEqual(r.shop);
		expect(buy(back, 0)).toBeNull();
		leaveShop(back);
		expect(back.phase).toBe('select');
		expect(back.table).toBe(1);
		expect(back.rivals.chars[0]).not.toBe(r.rivals.chars[0]);
	});
});
