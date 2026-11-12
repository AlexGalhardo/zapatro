import { describe, expect, test } from 'bun:test';
import {
	BOSS_INTRO,
	endTier,
	MOMENT_MAX_MS,
	MOMENT_TIMES,
	momentMs,
	QUEDA,
	TABLE_END,
} from '../src/config/feel-ends';

describe('beginnings and ends (R5.7)', () => {
	test('every moment lasts at most 3 s at 1x and fits a quarter of that at 4x', () => {
		for (const [name, p] of Object.entries(MOMENT_TIMES)) {
			expect(momentMs(p), name).toBeLessThanOrEqual(MOMENT_MAX_MS);
			expect(momentMs(p) / 4, name).toBeLessThanOrEqual(MOMENT_MAX_MS / 4);
		}
	});

	test('the final boss is a step above the others', () => {
		const { normal, final } = BOSS_INTRO;
		expect(momentMs(final)).toBeGreaterThan(momentMs(normal));
		expect(final.card).toBeGreaterThan(normal.card);
		expect(final.shake.intensity).toBeGreaterThan(normal.shake.intensity);
		expect(final.flash).toBeGreaterThan(normal.flash);
	});

	test('a queda of yours and the rivals differ in colour, pitch and pulse', () => {
		expect(QUEDA.us.color).not.toBe(QUEDA.them.color);
		expect(QUEDA.them.detune).toBeLessThan(QUEDA.us.detune);
		expect(QUEDA.them.flash).toBe(0);
	});

	test('a win weighs more by boss and by the Rei do Truco; a loss never has sparks', () => {
		const f = { finalBoss: 'rei', first: false };
		expect(endTier({ ...f, won: true })).toBe('win');
		expect(endTier({ ...f, won: true, boss: 'tony' })).toBe('boss');
		expect(endTier({ ...f, won: true, boss: 'rei' })).toBe('final');
		expect(endTier({ ...f, won: false })).toBe('lose');
		expect(endTier({ ...f, won: false, first: true })).toBe('loseFirst');
		expect(endTier({ ...f, won: false, boss: 'tony' })).toBe('loseBoss');
		expect(TABLE_END.final.sparks).toBeGreaterThan(TABLE_END.boss.sparks);
		expect(TABLE_END.boss.sparks).toBeGreaterThan(TABLE_END.win.sparks);
		for (const k of ['lose', 'loseFirst', 'loseBoss'] as const) {
			expect(TABLE_END[k].sparks).toBe(0);
			expect(TABLE_END[k].won).toBe(false);
		}
	});
});
