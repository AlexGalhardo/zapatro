import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync } from 'node:fs';
import { VOICES } from '../scripts/el-catalog';
import { loadPhase } from '../src/data/load-order';
import { VO_JOKE, VO_LINES, type VoLine } from '../src/data/sfx';
import {
	acceptLine,
	foldLine,
	jokeDue,
	nextJoke,
	pickOther,
	voKey,
	voLang,
} from '../src/logic/voice-lines';

describe('voice lines', () => {
	test('the UI language picks the voice language', () => {
		expect(voLang('pt-BR')).toBe('pt');
		expect(voLang('en')).toBe('en');
		expect(voKey('pt', 'bruto', 'truco')).toBe('vo.pt.bruto.truco');
		expect(voKey(voLang('en'), 'mia', 'piada2')).toBe('vo.en.mia.piada2');
	});

	test('accepting says "bora" or "ver"; folding a 6+ call says "sacanagem"', () => {
		expect(acceptLine(0.1)).toBe('bora');
		expect(acceptLine(0.9)).toBe('ver');
		expect(foldLine(3)).toBe('corre');
		expect(foldLine(6)).toBe('sacanagem');
		expect(foldLine(12)).toBe('sacanagem');
	});

	test('jokes wait some hands, then come with a chance', () => {
		expect(jokeDue(VO_JOKE.minHands - 1, 0)).toBe(false);
		expect(jokeDue(VO_JOKE.minHands, 0)).toBe(true);
		expect(jokeDue(VO_JOKE.minHands, 0.999)).toBe(false);
	});

	test('a character never repeats the joke they told last', () => {
		for (const roll of [0, 0.3, 0.5, 0.99]) {
			expect(nextJoke('piada1', roll)).not.toBe('piada1');
			expect(nextJoke('piada3', roll)).not.toBe('piada3');
		}
		expect(nextJoke(undefined, 0)).toBe('piada1');
		expect(pickOther(['music.table'], 'music.table', 0.7)).toBe('music.table');
	});

	test('every voice has every line and take in both languages', () => {
		for (const lang of ['pt', 'en'] as const)
			for (const char of Object.keys(VOICES))
				for (const [line, takes] of Object.entries(VO_LINES))
					for (let n = 1; n <= takes; n++) {
						const key = voKey(lang, char, line as VoLine);
						const file = `public/assets/audio/sfx/${n === 1 ? key : `${key}.${n}`}.mp3`;
						expect(`${file}: ${existsSync(file)}`).toBe(`${file}: true`);
					}
	});

	test('only the Settings language loads, and voices and extra table loops load late', () => {
		expect(loadPhase('assets/audio/sfx/vo.pt.bruto.truco.mp3', 'pt')).toBe('later');
		expect(loadPhase('assets/audio/sfx/vo.en.bruto.truco.2.mp3', 'pt')).toBe('skip');
		expect(loadPhase('assets/audio/sfx/vo.en.mia.piada1.mp3', 'en')).toBe('later');
		expect(loadPhase('assets/audio/music/music.table.mp3', 'pt')).toBe('first');
		expect(loadPhase('assets/audio/music/music.table3.mp3', 'pt')).toBe('later');
		expect(loadPhase('assets/audio/sfx/sfx.truco.mp3', 'en')).toBe('first');
	});

	test('no voice file without a language is left', () => {
		const old = readdirSync('public/assets/audio/sfx').filter(
			(f) => f.startsWith('vo.') && !/^vo\.(pt|en)\./.test(f),
		);
		expect(old).toEqual([]);
	});
});
