import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { loadPhase } from '../src/data/load-order';
import { SFX } from '../src/data/sfx';

const SFX_KEYS = [
	'sfx.joker.spin',
	'sfx.boss.intro',
	'sfx.eleven.enter',
	'sfx.iron.enter',
	'sfx.feat.unlock',
	'sfx.ui.toggle',
	'sfx.ui.slider',
] as const;
const LOOPS = ['music.shop', 'amb.decisive'] as const;

/** Every source file except the sound table itself, where a key is only declared. */
function sources(dir = 'src'): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		if (e.isDirectory()) return sources(p);
		return p.endsWith('.ts') && p.replaceAll(sep, '/') !== 'src/data/sfx.ts' ? [p] : [];
	});
}

describe('tier 2 sounds', () => {
	const code = sources()
		.map((p) => readFileSync(p, 'utf8'))
		.join('\n');

	test('every effect is mapped, on disk and played by some scene', () => {
		for (const key of SFX_KEYS) {
			expect(key in SFX).toBe(true);
			expect(existsSync(`public/assets/audio/sfx/${key}.mp3`)).toBe(true);
			expect(`${key}: ${code.includes(`'${key}'`)}`).toBe(`${key}: true`);
		}
	});

	test('the shop music and decisive ambience exist, are used and load after the first screen', () => {
		for (const key of LOOPS) {
			const file = `assets/audio/music/${key}.mp3`;
			expect(existsSync(`public/${file}`)).toBe(true);
			expect(`${key}: ${code.includes(`'${key}'`)}`).toBe(`${key}: true`);
			expect(loadPhase(file, 'en')).toBe('later');
		}
	});

	test('the slider tick never stacks', () => {
		expect(SFX['sfx.ui.slider'].voices).toBe(1);
		expect(SFX['sfx.ui.slider'].bus).toBe('ui');
	});
});
