import { expect, test } from 'bun:test';
import { SIGNAL_ICON } from '../src/art/icons';
import { SIGNS } from '../src/logic/truco/table';

test('every secret signal has its own icon and card badge', () => {
	for (const sign of SIGNS) {
		const look = SIGNAL_ICON[sign];
		expect(look?.gesture.length).toBeGreaterThan(0);
		expect(look?.badge.length).toBeGreaterThan(0);
	}
	const gestures = new Set(SIGNS.map((s) => SIGNAL_ICON[s].gesture));
	expect(gestures.size).toBe(SIGNS.length);
	expect(Object.keys(SIGNAL_ICON).sort()).toEqual([...SIGNS].sort());
});
