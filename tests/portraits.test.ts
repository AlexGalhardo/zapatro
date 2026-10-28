import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { NATIVE, PAINTED, PORTRAITS } from '../scripts/portraits';
import { BOSS_POOL, FINAL_BOSS } from '../src/data/bosses';
import { COMPANION_IDS } from '../src/data/companions';

const painted = Object.values(PAINTED);
const file = (id: string): string =>
	`public/assets/gfx/portrait/${id}.${painted.includes(id) ? 'webp' : 'png'}`;

describe('portraits', () => {
	test('every companion and boss has a portrait (painted WebP or pixel PNG)', () => {
		for (const id of [...COMPANION_IDS, ...BOSS_POOL, FINAL_BOSS])
			expect(existsSync(file(id))).toBe(true);
	});

	test('the pixel converter maps only Juiz and leaves Pedrão out', () => {
		expect(Object.keys(PORTRAITS)).toEqual(['char-juiz']);
		expect(Object.keys(PORTRAITS)).not.toContain('char-pedrao');
	});

	test('pixel PNGs are 128×128 with alpha', async () => {
		for (const id of [...Object.values(PORTRAITS), ...NATIVE]) {
			const m = await sharp(file(id)).metadata();
			expect([m.width, m.height]).toEqual([128, 128]);
			expect(m.hasAlpha).toBe(true);
		}
	});

	test('painted busts are 256×256 and each has a tall 480×640 card', async () => {
		for (const id of painted) {
			const bust = await sharp(file(id)).metadata();
			expect([bust.width, bust.height]).toEqual([256, 256]);
			const card = await sharp(`public/assets/gfx/card/${id}.webp`).metadata();
			expect([card.width, card.height]).toEqual([480, 640]);
		}
	});
});
