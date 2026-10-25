import { describe, expect, test } from 'bun:test';
import { ambienceVolume } from '../src/core/music';

describe('ambience volume', () => {
	test('follows Master and Music with the ambience gain', () => {
		expect(ambienceVolume({ master: 1, music: 1 })).toBeCloseTo(0.35);
		expect(ambienceVolume({ master: 0.8, music: 0.6 })).toBeCloseTo(0.168);
		expect(ambienceVolume({ master: 0.5, music: 0.5 })).toBeCloseTo(0.0875);
	});

	test('Music or Master at 0 silences it', () => {
		expect(ambienceVolume({ master: 0.8, music: 0 })).toBe(0);
		expect(ambienceVolume({ master: 0, music: 1 })).toBe(0);
	});
});
