import { describe, expect, test } from 'bun:test';
import { renderSize } from '../src/logic/display';
import { computeView } from '../src/logic/viewport';

describe('renderSize', () => {
	test('auto uses native pixels (MacBook Air M1: 1440x900 css @2x)', () => {
		const r = renderSize(1440, 900, 2, 'auto');
		expect(r).toEqual({ width: 2880, height: 1800, cssScale: 0.5 });
		expect(computeView(r.width, r.height).zoom).toBe(5);
	});

	test('presets fix the height and keep the window aspect (ultrawide 2560x1080)', () => {
		const r = renderSize(2560, 1080, 1, 'fhd');
		expect(r.width).toBe(2560);
		expect(r.height).toBe(1080);
		const four = renderSize(2560, 1080, 1, '4k');
		expect(four.height).toBe(2160);
		expect(four.width).toBe(5120);
		expect(four.cssScale).toBeCloseTo(0.5);
		expect(computeView(four.width, four.height).zoom).toBe(6);
	});

	test('sd upscales on a big screen', () => {
		const r = renderSize(1920, 1080, 1, 'sd');
		expect(r).toEqual({ width: 853, height: 480, cssScale: 2.25 });
		expect(computeView(r.width, r.height).zoom).toBe(1);
	});
});
