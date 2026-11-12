import { describe, expect, test } from 'bun:test';
import { trickMarks } from '../src/logic/truco/trick-marks';

describe('trickMarks (R5.3)', () => {
	test('nothing played: three open markers', () => {
		expect(trickMarks([{}])).toEqual(['open', 'open', 'open']);
		expect(trickMarks([])).toEqual(['open', 'open', 'open']);
	});

	test('a trick still being played stays open', () => {
		expect(trickMarks([{ result: 'us' }, {}])).toEqual(['won', 'open', 'open']);
	});

	test('won, lost and tied from the player seat, 2x2 and 1x1 alike', () => {
		const tricks = [
			{ result: 'us' as const },
			{ result: 'them' as const },
			{ result: 'tie' as const },
		];
		expect(trickMarks(tricks, 0)).toEqual(['won', 'lost', 'tied']);
	});

	test('the view follows the viewer seat: the partner shares the pair, a rival does not', () => {
		const tricks = [{ result: 'them' as const }, { result: 'us' as const }];
		expect(trickMarks(tricks, 2)).toEqual(['lost', 'won', 'open']);
		expect(trickMarks(tricks, 1)).toEqual(['won', 'lost', 'open']);
	});
});
