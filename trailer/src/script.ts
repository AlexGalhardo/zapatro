import type { Line } from './text';

/**
 * The trailer script (game-director-feedback.md §7.6), the same for EN and PT-BR. Captions live
 * here, apart from the React shots, so the `.vtt` subtitles (scripts/vtt.ts) and the burned-in
 * captions come from one list.
 */
export const FPS = 60;
export const TRAILER_SECONDS = 60;
export const TEASER_SECONDS = 15;

export type Cue = { from: number; dur: number; line: Line };

/** 0–5 title + TRUCO! · 5–25 a hand · 25–40 shop and build · 40–52 boss · 52–60 end card. */
export const TRAILER_CUES: Cue[] = [
	{ from: 2.5, dur: 2.5, line: 'truco' },
	{ from: 5, dur: 4, line: 'hook' },
	{ from: 9, dur: 3, line: 'partner' },
	{ from: 12, dur: 4, line: 'accept' },
	{ from: 16, dur: 1.5, line: 'six' },
	{ from: 17.5, dur: 7.5, line: 'count' },
	{ from: 25, dur: 4, line: 'shop' },
	{ from: 29, dur: 3.5, line: 'stack' },
	{ from: 32.5, dur: 3.5, line: 'cards' },
	{ from: 36, dur: 4, line: 'packs' },
	{ from: 40, dur: 6, line: 'bosses' },
	{ from: 46, dur: 6, line: 'rule' },
	{ from: 52, dur: 8, line: 'tagline' },
	{ from: 53, dur: 7, line: 'cta' },
];

/** 15 s ad cut: hand, TRUCO!, the count, a boss, end card. */
export const TEASER_CUES: Cue[] = [
	{ from: 0, dur: 3, line: 'hook' },
	{ from: 3, dur: 2, line: 'truco' },
	{ from: 5, dur: 3.5, line: 'count' },
	{ from: 8.5, dur: 3, line: 'bosses' },
	{ from: 11.5, dur: 3.5, line: 'tagline' },
	{ from: 12, dur: 3, line: 'cta' },
];

/** Lines shown by the end card or as a shouted word, not as a caption band. */
export const NOT_BANDED: ReadonlySet<Line> = new Set(['truco', 'six', 'tagline', 'cta']);
