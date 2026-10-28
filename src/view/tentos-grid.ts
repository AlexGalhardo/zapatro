/** Twelve tentos: four rows of three, with a clear gap before the centre divider. */

export const TENTOS_COLS = 3;
export const TENTOS_ROWS = 4;
export const TENTOS_COUNT = TENTOS_COLS * TENTOS_ROWS;

export interface TentosGrid {
	/** Left of the inner area (after the card padding). */
	x: number;
	/** Top of the card. */
	y: number;
	/** Width of one half (ours or theirs). */
	half: number;
	/** First row's centre, measured from the card top. */
	top: number;
	step: number;
	r: number;
	/** Clear pixels between a bead's edge and the centre divider. */
	gap: number;
}

/** Centre of bead `d` (0–11, row-major) of half `i` (0 ours, 1 theirs). */
export function tentosBead(i: number, d: number, g: TentosGrid): [number, number] {
	const col = d % TENTOS_COLS;
	const row = Math.floor(d / TENTOS_COLS);
	const outer = 2;
	const left = i === 0 ? g.x + outer + g.r : g.x + g.half + g.gap + g.r;
	const right = i === 0 ? g.x + g.half - g.gap - g.r : g.x + 2 * g.half - outer - g.r;
	const x = left + (col * (right - left)) / (TENTOS_COLS - 1);
	const y = g.y + g.top + row * g.step;
	return [x, y];
}
