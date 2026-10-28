import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { leaveShop, parseRun, projectedReward } from '../src/logic/run/run';
import { checksum, parseSave } from '../src/logic/save';

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
] as const;

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
