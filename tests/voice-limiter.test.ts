import { describe, expect, it } from 'bun:test';
import { pitchRate, VoiceLimiter } from '../src/logic/voice-limiter';

describe('VoiceLimiter', () => {
	it('enforces the minimum interval between starts', () => {
		const v = new VoiceLimiter(40);
		expect(v.tryStart('hit', 0, 100, 4)).toBe(true);
		expect(v.tryStart('hit', 20, 100, 4)).toBe(false);
		expect(v.tryStart('hit', 40, 100, 4)).toBe(true);
	});

	it('limits simultaneous voices per key', () => {
		const v = new VoiceLimiter(0);
		expect(v.tryStart('a', 0, 1000, 2)).toBe(true);
		expect(v.tryStart('a', 1, 1000, 2)).toBe(true);
		expect(v.tryStart('a', 2, 1000, 2)).toBe(false);
		expect(v.tryStart('b', 2, 1000, 2)).toBe(true);
		expect(v.tryStart('a', 1001, 1000, 2)).toBe(true);
	});

	it('pitch variation stays within ±variation', () => {
		expect(pitchRate(0.08, 0)).toBeCloseTo(0.92);
		expect(pitchRate(0.08, 0.5)).toBeCloseTo(1);
		expect(pitchRate(0.08, 0.9999)).toBeCloseTo(1.08, 3);
	});
});
