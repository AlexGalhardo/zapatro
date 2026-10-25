import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { NATIVE, PORTRAITS } from '../scripts/portraits';
import { BOSS_POOL, FINAL_BOSS } from '../src/data/bosses';
import { COMPANION_IDS } from '../src/data/companions';

/** Bosses and companions without a converted concept (docs/visual.md). */
const NO_PORTRAIT: string[] = [];

describe('portraits', () => {
	test('every companion and boss has a 128×128 PNG, except the listed ones', () => {
		for (const id of [...COMPANION_IDS, ...BOSS_POOL, FINAL_BOSS]) {
			if (NO_PORTRAIT.includes(id)) continue;
			expect(existsSync(`public/assets/gfx/portrait/${id}.png`)).toBe(true);
		}
	});

	test('the converter maps 19 files and leaves Pedrão out', () => {
		expect(Object.keys(PORTRAITS)).toHaveLength(19);
		expect(Object.keys(PORTRAITS)).not.toContain('char-pedrao');
	});

	test('PNGs are 128×128 with alpha', async () => {
		for (const id of [...Object.values(PORTRAITS), ...NATIVE]) {
			const m = await sharp(`public/assets/gfx/portrait/${id}.png`).metadata();
			expect([m.width, m.height]).toEqual([128, 128]);
			expect(m.hasAlpha).toBe(true);
		}
	});
});
