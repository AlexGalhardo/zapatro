import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { SFX } from '../src/data/sfx';

describe('sfx files', () => {
	test('every sound effect has all its takes on disk', () => {
		for (const [key, def] of Object.entries(SFX))
			for (let n = 1; n <= (def.takes ?? 1); n++) {
				const file = `public/assets/audio/sfx/${n === 1 ? key : `${key}.${n}`}.mp3`;
				expect(`${file}: ${existsSync(file)}`).toBe(`${file}: true`);
			}
	});
});
