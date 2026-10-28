import { describe, expect, test } from 'bun:test';
import { finishTable, newRun, parseRun } from '../src/logic/run/run';

// Regression (QA B0.3, group `runend`): the Run screen reads the run back with parseRun after the
// last table; refusing finished runs showed the partner picker instead of the run summary.
describe('finished run in the save', () => {
	test('a lost run is read back so its summary can show', () => {
		const run = newRun(3, 'bruto');
		finishTable(run, { won: false, rivalTentos: 12, money: 0, hands: 5, bestHand: 0 });
		expect(run.phase).toBe('lost');
		expect(parseRun(JSON.parse(JSON.stringify(run)))?.phase).toBe('lost');
	});

	test('a won run is read back (the Endless button lives on its summary)', () => {
		const run = { ...newRun(3, 'bruto'), phase: 'won' as const };
		expect(parseRun(JSON.parse(JSON.stringify(run)))?.phase).toBe('won');
	});
});
