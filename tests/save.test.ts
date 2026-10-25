import { describe, expect, test } from 'bun:test';
import { type KV, loadSave, writeSave } from '../src/core/storage';
import { actionFor, defaultKeys, keyLabel, parseKeys, rebind } from '../src/logic/keybinds';
import {
	checksum,
	defaultSave,
	HISTORY_MAX,
	parseSave,
	recordRun,
	SAVE_KEY,
	SAVE_VERSION,
	serializeSave,
	validateSave,
} from '../src/logic/save';

class MemKV implements KV {
	readonly map = new Map<string, string>();
	failWrites = false;
	getItem(k: string): string | null {
		return this.map.get(k) ?? null;
	}
	setItem(k: string, v: string): void {
		if (this.failWrites) throw new Error('QuotaExceededError');
		this.map.set(k, v);
	}
	removeItem(k: string): void {
		this.map.delete(k);
	}
	key(i: number): string | null {
		return [...this.map.keys()][i] ?? null;
	}
	get length(): number {
		return this.map.size;
	}
}

/** Builds a stored document of a given schema (payload as given). */
function envelope(payload: unknown, version: number): string {
	const text = JSON.stringify(payload);
	return JSON.stringify({ schemaVersion: version, checksum: checksum(text), payload: text });
}

describe('save v1 (PLAN §4.5)', () => {
	test('envelope carries version, time and app version', () => {
		const env = JSON.parse(serializeSave(defaultSave('en'), '9.9.9', 1234));
		expect(env.schemaVersion).toBe(SAVE_VERSION);
		expect(env.savedAt).toBe(1234);
		expect(env.appVersion).toBe('9.9.9');
		expect(SAVE_KEY).toBe('truco-roguelite.save');
	});

	test('round-trips settings, meta and the run snapshot', () => {
		const s = defaultSave('pt-BR');
		s.settings.fourColor = true;
		s.meta.feats.push('feat.a');
		s.meta.stakes.normal = 3;
		s.run = { seed: 7, championship: 2 };
		const r = parseSave(serializeSave(s), 'en');
		expect(r.ok && r.save).toEqual(s);
	});

	test('partial or wrong fields fall back to defaults', () => {
		const v = validateSave(
			{
				settings: { gameSpeed: 3, lang: 'xx', volume: { master: 7 } },
				meta: { feats: [1, 'a', 'a'] },
			},
			'en',
		);
		expect(v.settings.gameSpeed).toBe(1);
		expect(v.settings.lang).toBe('en');
		expect(v.settings.volume.master).toBe(1);
		expect(v.meta.feats).toEqual(['a']);
		expect(v.run).toBeNull();
	});

	test('refuses a save from a newer version', () => {
		expect(parseSave(envelope({}, SAVE_VERSION + 1), 'en')).toEqual({
			ok: false,
			reason: 'future',
		});
	});

	test('run history keeps the newest HISTORY_MAX runs', () => {
		const s = defaultSave('en');
		for (let i = 1; i <= HISTORY_MAX + 5; i++)
			recordRun(
				s.meta.stats,
				{
					at: i,
					reason: i % 2 ? 'won' : 'lost',
					championship: i,
					bestHand: i * 10,
					deck: 'normal',
					partner: 'tonhao',
					stake: 1,
				},
				60,
			);
		const st = s.meta.stats;
		expect(st.history).toHaveLength(HISTORY_MAX);
		expect(st.history[0]?.championship).toBe(HISTORY_MAX + 5);
		expect(st.runs).toBe(HISTORY_MAX + 5);
		expect(st.wins).toBe(13);
		expect(st.bestHand).toBe((HISTORY_MAX + 5) * 10);
	});
});

describe('storage', () => {
	test('corrupt main save falls back to the backup and is quarantined', () => {
		const kv = new MemKV();
		const a = defaultSave('en');
		a.meta.stats.runs = 10;
		expect(writeSave(a, kv)).toBe(true);
		a.meta.stats.runs = 20;
		expect(writeSave(a, kv)).toBe(true);
		kv.map.set(SAVE_KEY, `${kv.getItem(SAVE_KEY)}garbage`);
		const r = loadSave('en', kv);
		expect(r.recovered).toBe(true);
		expect(r.reason).toBe('json');
		expect(r.save.meta.stats.runs).toBe(10);
		expect([...kv.map.keys()].some((k) => k.startsWith(`${SAVE_KEY}.corrupt.`))).toBe(true);
	});

	test('a newer-version save is not quarantined nor overwritten by loading', () => {
		const kv = new MemKV();
		const future = envelope({}, SAVE_VERSION + 1);
		kv.map.set(SAVE_KEY, future);
		const r = loadSave('en', kv);
		expect(r.reason).toBe('future');
		expect(kv.getItem(SAVE_KEY)).toBe(future);
		expect([...kv.map.keys()].some((k) => k.includes('.corrupt.'))).toBe(false);
	});

	test('quota errors make the write fail without throwing', () => {
		const kv = new MemKV();
		kv.failWrites = true;
		expect(writeSave(defaultSave('en'), kv)).toBe(false);
	});
});

describe('key bindings', () => {
	test('actions resolve from physical keys', () => {
		const k = defaultKeys();
		expect(actionFor(k, 'KeyT')).toBe('truco');
		expect(actionFor(k, 'Digit2')).toBe('card2');
		expect(actionFor(k, 'KeyQ')).toBeNull();
	});

	test('rebinding steals the key from the other action', () => {
		const k = defaultKeys();
		const r = rebind(k, 'pause', 0, 'KeyT');
		expect(r).toEqual({ ok: true, moved: 'truco' });
		expect(k.truco).toEqual(['', '']);
		expect(actionFor(k, 'KeyT')).toBe('pause');
		expect(rebind(k, 'truco', 0, 'F5')).toEqual({ ok: false, reason: 'reserved' });
	});

	test('parsing drops duplicates and restores an action left without keys', () => {
		const k = parseKeys({ truco: ['KeyT', 'KeyT'], accept: ['KeyT', ''], mute: ['', ''] });
		expect(k.truco).toEqual(['KeyT', '']);
		expect(k.accept).toEqual(['KeyA', '']);
		expect(k.mute).toEqual(['KeyM', '']);
		expect(keyLabel('KeyW')).toBe('W');
		expect(keyLabel('Digit1')).toBe('1');
		expect(keyLabel('')).toBe('—');
	});
});
