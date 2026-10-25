import { describe, expect, test } from 'bun:test';
import { FpsGuard } from '../src/logic/fps-guard';

const run = (g: FpsGuard, seconds: number, fps: number, watch = true): boolean[] => {
	const out: boolean[] = [];
	for (let i = 0; i < seconds * 60; i++) out.push(g.sample(1000 / 60, fps, watch));
	return out;
};

describe('light mode trigger (MOB4.4)', () => {
	test('fires once after 5 slow seconds in a row', () => {
		const g = new FpsGuard(45, 5);
		expect(run(g, 4, 30).some(Boolean)).toBe(false);
		expect(run(g, 2, 30).filter(Boolean)).toHaveLength(1);
		expect(run(g, 10, 30).some(Boolean)).toBe(false);
	});
	test('a fast second resets the count', () => {
		const g = new FpsGuard(45, 5);
		run(g, 4, 30);
		run(g, 1, 60);
		expect(run(g, 4, 30).some(Boolean)).toBe(false);
	});
	test('nothing is measured while not watching', () => {
		const g = new FpsGuard(45, 5);
		expect(run(g, 20, 20, false).some(Boolean)).toBe(false);
	});
});
