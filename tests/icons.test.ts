import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { VECTOR_ICONS } from '../src/art/icons';

const BITMAPS = [
	'gear',
	'book',
	'door',
	'back',
	'sound',
	'coin',
	'star',
	'lock',
	'trophy',
	'crown',
	'skull',
];

describe('UI icons', () => {
	test('the pixel icons cut from ui-icons.png exist as 32×32 PNGs with alpha', async () => {
		for (const name of BITMAPS) {
			const file = `public/assets/gfx/icon/${name}.png`;
			expect(existsSync(file)).toBe(true);
			const m = await sharp(file).metadata();
			expect([m.width, m.height, m.hasAlpha]).toEqual([32, 32, true]);
		}
	});

	test('only gear and sound have both: the vector drawing replaces the pixel one', () => {
		// Settings and the menus use one vector style (2026-10-27); flat.ts prefers the vector.
		expect(VECTOR_ICONS.filter((v) => (BITMAPS as readonly string[]).includes(v))).toEqual([
			'gear',
			'sound',
		]);
	});
});
