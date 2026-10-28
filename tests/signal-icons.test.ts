import { expect, test } from 'bun:test';
import { SIGNAL_EMOJI } from '../src/data/characters';
import { SIGNS } from '../src/logic/truco/table';

test('every secret signal has one emoji, and no two signals share it', () => {
	expect(Object.keys(SIGNAL_EMOJI).sort()).toEqual([...SIGNS].sort());
	const faces = SIGNS.map((sign) => SIGNAL_EMOJI[sign]);
	expect(new Set(faces).size).toBe(SIGNS.length);
	for (const face of faces) expect(face.length).toBeGreaterThan(0);
});
