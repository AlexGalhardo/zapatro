import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NOTICE, NOTICE_WEIGHT, type NoticeKind } from '../src/config/feel-notice';
import {
	isTrucoStep,
	TRUCO_CALL,
	type TrucoStep,
	trucoCall,
	trucoTotalMs,
} from '../src/config/feel-truco';
import { TABLES_FOR_TEST } from '../src/i18n';

const STEPS: TrucoStep[] = [3, 6, 9, 12];

describe('notices (R5.5)', () => {
	test('every kind has an existing painted icon, a colour and a weight with size and time', () => {
		for (const [kind, def] of Object.entries(NOTICE)) {
			expect(existsSync(join('public/assets/gfx/icon', `${def.icon}.png`)), kind).toBe(true);
			expect(def.color, kind).toBeGreaterThan(0);
			expect(NOTICE_WEIGHT[def.weight].ms, kind).toBeGreaterThan(0);
			expect(NOTICE_WEIGHT[def.weight].size, kind).toBeGreaterThan(0);
		}
	});

	test('the kinds the table needs are all there', () => {
		const need: NoticeKind[] = [
			'vira',
			'raise',
			'trickUs',
			'trickThem',
			'trickTie',
			'eleven',
			'iron',
			'handUs',
			'handThem',
			'handNone',
			'queda',
			'caught',
			'boss',
			'speed',
		];
		for (const k of need) expect(NOTICE[k]).toBeDefined();
	});

	test('heavier weights stay longer and read bigger', () => {
		for (const w of [1, 2, 3, 4] as const) {
			expect(NOTICE_WEIGHT[(w + 1) as 2 | 3 | 4 | 5].ms).toBeGreaterThanOrEqual(
				NOTICE_WEIGHT[w].ms,
			);
			expect(NOTICE_WEIGHT[(w + 1) as 2 | 3 | 4 | 5].size).toBeGreaterThan(
				NOTICE_WEIGHT[w].size,
			);
		}
	});

	test('the new notice texts exist in both languages', () => {
		for (const k of ['table.raise', 'table.folded']) {
			expect((TABLES_FOR_TEST.en as Record<string, string>)[k]).toBeTruthy();
			expect((TABLES_FOR_TEST['pt-BR'] as Record<string, string>)[k]).toBeTruthy();
		}
	});
});

describe('truco call event (R5.1)', () => {
	test('at 4x the awaited phases of every step sum to 400 ms or less', () => {
		for (const s of STEPS) expect(trucoTotalMs(s, 4), `step ${s}`).toBeLessThanOrEqual(400);
	});

	test('the reduced-flash variant of every step has no flash; the normal one has', () => {
		for (const s of STEPS) {
			expect(trucoCall(s, true).flash, `step ${s}`).toBeUndefined();
			expect(trucoCall(s, false).flash, `step ${s}`).toBeDefined();
		}
	});

	test('intensity rises with the step', () => {
		for (let i = 1; i < STEPS.length; i++) {
			const a = TRUCO_CALL[STEPS[i - 1] as TrucoStep];
			const b = TRUCO_CALL[STEPS[i] as TrucoStep];
			expect(b.card).toBeGreaterThan(a.card);
			expect(b.text).toBeGreaterThan(a.text);
			expect(b.shake.intensity).toBeGreaterThan(a.shake.intensity);
			expect(b.zoom).toBeGreaterThan(a.zoom);
			expect(b.duck.gain).toBeLessThan(a.duck.gain);
			expect(trucoTotalMs(STEPS[i] as TrucoStep)).toBeGreaterThan(
				trucoTotalMs(STEPS[i - 1] as TrucoStep),
			);
		}
	});

	test('only 3, 6, 9 and 12 are steps', () => {
		expect([1, 3, 6, 9, 12, 13].filter(isTrucoStep)).toEqual(STEPS);
	});
});
