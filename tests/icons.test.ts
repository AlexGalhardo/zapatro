import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const BITMAPS = [
	'coin',
	'star',
	'crown',
	'skull',
	'trophy',
	'lock',
	'book',
	'door',
	'gear',
	'sound',
	'mute',
	'back',
	'cards',
	'swords',
	'hand',
	'cart',
	'back2',
	'arrowRight',
	'arrowLeft',
	'chevron',
	'close',
	'check',
	'alert',
	'gamepad',
	'sparkle',
	'megaphone',
	'calc',
	'people',
	'next',
	'list',
	'doc',
	'refresh',
	'monitor',
	'upload',
	'download',
	'note',
	'pause',
];

describe('UI icons', () => {
	test('every painted icon from icons.png and icones-2.png exists as a 32×32 PNG with alpha', async () => {
		for (const name of BITMAPS) {
			const file = `public/assets/gfx/icon/${name}.png`;
			expect(existsSync(file)).toBe(true);
			const m = await sharp(file).metadata();
			expect([m.width, m.height, m.hasAlpha]).toEqual([32, 32, true]);
		}
	});
});
