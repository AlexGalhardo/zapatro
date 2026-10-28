import { describe, expect, test } from 'bun:test';
import { TENTOS_COUNT, type TentosGrid, tentosBead } from '../src/view/tentos-grid';

const grid: TentosGrid = {
	x: 17,
	y: 154,
	half: 57,
	top: 34,
	step: (116 - 34 - 8 - 5.5) / 3,
	r: 5.5,
	gap: 6,
};
const divider = grid.x + grid.half;

describe('tentos beads', () => {
	test('each side is 4 rows of 3, filled left to right', () => {
		for (const i of [0, 1]) {
			const pts = Array.from({ length: TENTOS_COUNT }, (_, d) => tentosBead(i, d, grid));
			expect(new Set(pts.map((p) => p[0])).size).toBe(3);
			expect(new Set(pts.map((p) => p[1])).size).toBe(4);
			expect(pts[0]?.[0]).toBeLessThan(pts[1]?.[0] ?? 0);
			expect(pts[1]?.[0]).toBeLessThan(pts[2]?.[0] ?? 0);
			expect(pts[3]?.[0]).toBe(pts[0]?.[0]);
			expect(pts[3]?.[1]).toBeGreaterThan(pts[0]?.[1] ?? 0);
			expect(pts[9]?.[1]).toBeGreaterThan(pts[6]?.[1] ?? 0);
		}
	});

	test('beads stay off the centre divider and inside the card', () => {
		for (const i of [0, 1]) {
			for (let d = 0; d < TENTOS_COUNT; d++) {
				const [x, y] = tentosBead(i, d, grid);
				expect(y - grid.r).toBeGreaterThan(grid.y + 24);
				expect(y + grid.r).toBeLessThanOrEqual(grid.y + 116 - 8);
				if (i === 0) expect(x + grid.r).toBeLessThanOrEqual(divider - grid.gap + 0.01);
				else expect(x - grid.r).toBeGreaterThanOrEqual(divider + grid.gap - 0.01);
			}
		}
	});
});
