import { describe, expect, test } from 'bun:test';
import { parseDebugParams } from '../src/debug/params';

describe('debug params (PLAN §10.4)', () => {
	test('score us-them for the mão de 11 and the iron hand', () => {
		expect(parseDebugParams('?score=11-4').score).toEqual({ us: 11, them: 4 });
		expect(parseDebugParams('?score=11-11').score).toEqual({ us: 11, them: 11 });
		expect(parseDebugParams('?score=12-0').score).toBeUndefined();
		expect(parseDebugParams('?score=abc').score).toBeUndefined();
	});

	test('mode is 1v1 or 2v2 (quick match and new run); anything else leaves it unset', () => {
		expect(parseDebugParams('?run=1&mode=1v1').mode).toBe('1v1');
		expect(parseDebugParams('?skipMenu=1&mode=2v2').mode).toBe('2v2');
		expect(parseDebugParams('?run=1&mode=3v3').mode).toBeUndefined();
		expect(parseDebugParams('?run=1').mode).toBeUndefined();
	});
});
