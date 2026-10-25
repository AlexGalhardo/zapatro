import { describe, expect, test } from 'bun:test';
import { computeView, fitArt } from '../src/logic/viewport';

describe('computeView (integer zoom by height, LOGICAL_H = 360, D-35)', () => {
	test.each([
		[2560, 1080, 3, 2560 / 3, 360],
		[1920, 1080, 3, 640, 360],
		[2560, 1440, 4, 640, 360],
		[3840, 2160, 6, 640, 360],
		[1280, 720, 2, 640, 360],
		[800, 400, 1, 800, 400],
	])('%ix%i → zoom %i', (w, h, zoom, lw, lh) => {
		expect(computeView(w, h)).toEqual({ zoom, width: lw, height: lh });
	});
});

describe('phones whose height rounds a few pixels short', () => {
	// 411 CSS px × 2.625 (Galaxy S20 FE) → 1079; 411 × 1.75 (Galaxy A07) → 719.
	test.each([
		[2400, 1079, 3],
		[1599, 719, 2],
		[1276, 714, 2],
	])('%ix%i → zoom %i', (w, h, zoom) => {
		expect(computeView(w, h).zoom).toBe(zoom);
	});
	test('a real shortfall still drops a zoom level', () => {
		expect(computeView(1280, 700).zoom).toBe(1);
	});
});

describe('fixed zoom (Settings → Zoom, B5.4)', () => {
	test('keeps the choice inside the visible-height bounds', () => {
		expect(computeView(1920, 1080, 2).zoom).toBe(2);
		expect(computeView(1920, 1080, 4).zoom).toBe(4);
		expect(computeView(1920, 1080, 1).zoom).toBe(2); // 1080 px tall would exceed 720
		expect(computeView(1280, 720, 4).zoom).toBe(3); // 180 px tall is below 240
		expect(computeView(1280, 720, 0).zoom).toBe(2);
	});
});

describe('fitArt (fitted screens fit the view)', () => {
	test('16:9 draws the art 1:1 (pixel perfect)', () => {
		expect(fitArt({ width: 640, height: 360 })).toBe(1);
		expect(fitArt({ width: 683, height: 384 })).toBeCloseTo(1.067, 3);
	});
	test('phones (20:9) keep the whole art: scale by the height', () => {
		expect(fitArt({ width: 800, height: 360 })).toBe(1);
	});
	test('4:3 keeps the whole art: scale by the width', () => {
		expect(fitArt({ width: 512, height: 384 })).toBe(0.8);
	});
});
