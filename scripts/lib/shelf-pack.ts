export interface PackInput {
	key: string;
	file: string;
	w: number;
	h: number;
}

export interface PackRect extends PackInput {
	x: number;
	y: number;
}

/** Simple shelf packer: tallest first, rows up to `maxWidth`, `pad` px between sprites. */
export function shelfPack(
	items: readonly PackInput[],
	maxWidth: number,
	pad: number,
): { width: number; height: number; rects: PackRect[] } {
	const sorted = [...items].sort((a, b) => b.h - a.h || b.w - a.w);
	const rects: PackRect[] = [];
	let x = 0;
	let y = 0;
	let rowH = 0;
	let width = 0;
	for (const it of sorted) {
		if (x > 0 && x + it.w > maxWidth) {
			x = 0;
			y += rowH + pad;
			rowH = 0;
		}
		rects.push({ ...it, x, y });
		x += it.w + pad;
		rowH = Math.max(rowH, it.h);
		width = Math.max(width, x - pad);
	}
	const pow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));
	return { width: pow2(width), height: pow2(y + rowH), rects };
}
