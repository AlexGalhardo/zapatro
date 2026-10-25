import { describe, expect, test } from 'bun:test';
import { versionCode } from '../scripts/lib/version-code';

describe('Android versionCode', () => {
	test('final releases', () => {
		expect(versionCode('1.0.0')).toBe(1_000_099);
		expect(versionCode('1.2.3')).toBe(1_020_399);
	});
	test('release candidates sort below their final version and above the previous one', () => {
		expect(versionCode('1.1.0-rc.1')).toBe(1_010_001);
		expect(versionCode('1.1.0-rc.1')).toBeLessThan(versionCode('1.1.0'));
		expect(versionCode('1.1.0-rc.1')).toBeGreaterThan(versionCode('1.0.9'));
	});
	test('0.0.x < 0.1.x < 1.0.x', () => {
		expect(versionCode('0.0.52')).toBeLessThan(versionCode('0.1.1'));
		expect(versionCode('0.1.80')).toBeLessThan(versionCode('1.0.0'));
	});
	test('rejects what cannot be encoded', () => {
		expect(() => versionCode('banana')).toThrow();
		expect(() => versionCode('1.100.0')).toThrow();
	});
});
