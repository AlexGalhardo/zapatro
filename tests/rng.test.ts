import { describe, expect, it } from 'bun:test';
import { Rng } from '../src/logic/rng';

describe('Rng', () => {
	it('is deterministic for the same seed', () => {
		const a = new Rng(123);
		const b = new Rng(123);
		const seqA = Array.from({ length: 20 }, () => a.next());
		const seqB = Array.from({ length: 20 }, () => b.next());
		expect(seqA).toEqual(seqB);
	});

	it('differs for different seeds', () => {
		expect(new Rng(1).next()).not.toEqual(new Rng(2).next());
	});

	it('next() stays in [0, 1)', () => {
		const rng = new Rng(7);
		for (let i = 0; i < 10_000; i++) {
			const v = rng.next();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it('int() is inclusive on both ends and covers the range', () => {
		const rng = new Rng(42);
		const seen = new Set<number>();
		for (let i = 0; i < 2_000; i++) seen.add(rng.int(1, 6));
		expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('weightedIndex() respects weights roughly and never picks zero weight', () => {
		const rng = new Rng(99);
		const counts = [0, 0, 0];
		for (let i = 0; i < 10_000; i++) {
			const index = rng.weightedIndex([70, 30, 0]);
			counts[index] = (counts[index] ?? 0) + 1;
		}
		expect(counts[2]).toBe(0);
		expect((counts[0] ?? 0) / 10_000).toBeCloseTo(0.7, 1);
	});

	it('weightedIndex() throws without positive weights', () => {
		expect(() => new Rng(1).weightedIndex([0, 0])).toThrow();
	});

	it('pick() throws on empty array', () => {
		expect(() => new Rng(1).pick([])).toThrow();
	});
});
