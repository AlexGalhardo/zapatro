/**
 * WebVTT subtitles of the trailer and the teaser, EN and PT-BR, from the same cues the video
 * burns in (src/script.ts): out/trailer-<lang>.vtt and out/teaser-<lang>.vtt.
 *   bun scripts/vtt.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { type Cue, TEASER_CUES, TRAILER_CUES } from '../src/script';
import { type Lang, TEXT } from '../src/text';

const stamp = (sec: number): string => {
	const ms = Math.round(sec * 1000);
	const p = (n: number, w = 2) => String(n).padStart(w, '0');
	return `${p(Math.floor(ms / 3_600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
};

const vtt = (cues: Cue[], lang: Lang): string =>
	`WEBVTT\n\n${cues
		.map(
			(c, i) =>
				`${i + 1}\n${stamp(c.from)} --> ${stamp(c.from + c.dur)}\n${TEXT[lang][c.line]}\n`,
		)
		.join('\n')}`;

mkdirSync('out', { recursive: true });
for (const lang of ['en', 'pt'] as const) {
	writeFileSync(`out/trailer-${lang}.vtt`, vtt(TRAILER_CUES, lang));
	writeFileSync(`out/teaser-${lang}.vtt`, vtt(TEASER_CUES, lang));
}
console.log('subtitles in trailer/out: trailer-{en,pt}.vtt, teaser-{en,pt}.vtt');
