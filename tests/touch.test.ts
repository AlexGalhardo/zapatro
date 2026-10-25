import { describe, expect, test } from 'bun:test';
import { TOUCH_TEXT_MIN, touchActive, touchPx } from '../src/logic/touch';

describe('touch mode (MOB1.1)', () => {
	test.each([
		['auto', true, true],
		['auto', false, false],
		['on', false, true],
		['off', true, false],
	] as const)('%s on a touch device=%s → %s', (mode, device, on) => {
		expect(touchActive(mode, device)).toBe(on);
	});
});

describe('touch text size (MOB1.2)', () => {
	test('mouse mode keeps every size', () => {
		for (const s of [6, 7, 8, 12, 20]) expect(touchPx(s, false)).toBe(s);
	});
	test('small text grows to the touch minimum, big text stays', () => {
		expect(touchPx(6, true)).toBe(TOUCH_TEXT_MIN);
		expect(touchPx(7, true)).toBe(TOUCH_TEXT_MIN);
		expect(touchPx(8, true)).toBe(TOUCH_TEXT_MIN);
		expect(touchPx(9, true)).toBe(TOUCH_TEXT_MIN + 1);
		expect(touchPx(12, true)).toBe(12);
	});
});
