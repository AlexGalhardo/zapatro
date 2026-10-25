import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { parseRun } from '../src/logic/run/run';
import { parseSave } from '../src/logic/save';

/**
 * Saves written by released builds must keep loading (RC1.3). Each fixture was produced by the
 * code at its tag (`git archive v<tag> src` + serializeSave), never by the current code.
 */
const FIXTURES = [
	{ version: '0.1.0-beta.1', partner: 'donaCida' },
	{ version: '0.10.0', partner: 'bia' },
] as const;

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
		});
	}
});
