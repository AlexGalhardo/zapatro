/**
 * Cuts the pixel-art UI icons out of references/concept-art/zapatro/ui-icons.png (a 4×3 sheet)
 * into 32×32 PNGs with alpha: public/assets/gfx/icon/<name>.png. The grey background is removed
 * from the corners and each icon is a connected group of pixels. The "ZAP" badge (first cell) is
 * left out: it is a portrait, not an icon. Local only. Usage: bun scripts/icons.ts
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = 'references/concept-art/zapatro/ui-icons.png';
const OUT = 'public/assets/gfx/icon';
const SIZE = 32;
/** Row-major names of the 4×3 sheet; null cells are skipped. */
const GRID: (string | null)[] = [
	null,
	'gear',
	'book',
	'door',
	'back',
	'sound',
	'coin',
	'star',
	'lock',
	'trophy',
	'crown',
	'skull',
];
const TOLERANCE = 40;
/** Groups smaller than this many pixels are noise (the sound icon's waves are kept: they touch). */
const MIN_AREA = 4000;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const at = (x: number, y: number): number => (y * w + x) * 4;
const ref = [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0] as const;

// Background: connected to the corners and close to the corner colour.
const isBg = new Uint8Array(w * h);
const stack: number[] = [0, 0, w - 1, 0, 0, h - 1, w - 1, h - 1];
while (stack.length) {
	const y = stack.pop() as number;
	const x = stack.pop() as number;
	if (x < 0 || y < 0 || x >= w || y >= h || isBg[y * w + x]) continue;
	const p = at(x, y);
	const d =
		Math.abs((data[p] ?? 0) - ref[0]) +
		Math.abs((data[p + 1] ?? 0) - ref[1]) +
		Math.abs((data[p + 2] ?? 0) - ref[2]);
	if (d > TOLERANCE) continue;
	isBg[y * w + x] = 1;
	data[p + 3] = 0;
	stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

// Connected groups of drawn pixels (a few pixels of gap are bridged by dilation).
const BRIDGE = 6;
const group = new Int32Array(w * h).fill(-1);
const boxes: { x0: number; y0: number; x1: number; y1: number; area: number }[] = [];
for (let y0 = 0; y0 < h; y0++)
	for (let x0 = 0; x0 < w; x0++) {
		if (isBg[y0 * w + x0] || group[y0 * w + x0] !== -1) continue;
		const id = boxes.length;
		const box = { x0, y0, x1: x0, y1: y0, area: 0 };
		const q: number[] = [x0, y0];
		group[y0 * w + x0] = id;
		while (q.length) {
			const y = q.pop() as number;
			const x = q.pop() as number;
			box.area++;
			box.x0 = Math.min(box.x0, x);
			box.x1 = Math.max(box.x1, x);
			box.y0 = Math.min(box.y0, y);
			box.y1 = Math.max(box.y1, y);
			for (let dy = -BRIDGE; dy <= BRIDGE; dy++)
				for (let dx = -BRIDGE; dx <= BRIDGE; dx++) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					const n = ny * w + nx;
					if (isBg[n] || group[n] !== -1) continue;
					group[n] = id;
					q.push(nx, ny);
				}
		}
		boxes.push(box);
	}

const icons = boxes.filter((b) => b.area >= MIN_AREA).sort((a, b) => a.y0 - b.y0);
if (icons.length !== GRID.length)
	throw new Error(`expected ${GRID.length} icons in ${SRC}, found ${icons.length}`);
// Three rows of four, each row left to right.
const rows = [0, 1, 2].map((r) => icons.slice(r * 4, r * 4 + 4).sort((a, b) => a.x0 - b.x0));

await mkdir(OUT, { recursive: true });
let n = 0;
for (const [i, b] of rows.flat().entries()) {
	const name = GRID[i];
	if (!name) continue;
	const id = boxes.indexOf(b);
	const bw = b.x1 - b.x0 + 1;
	const bh = b.y1 - b.y0 + 1;
	const crop = Buffer.alloc(bw * bh * 4);
	for (let y = b.y0; y <= b.y1; y++)
		for (let x = b.x0; x <= b.x1; x++) {
			const src = at(x, y);
			const dst = ((y - b.y0) * bw + (x - b.x0)) * 4;
			if (group[y * w + x] !== id) continue;
			crop[dst] = data[src] ?? 0;
			crop[dst + 1] = data[src + 1] ?? 0;
			crop[dst + 2] = data[src + 2] ?? 0;
			crop[dst + 3] = 255;
		}
	await sharp(crop, { raw: { width: bw, height: bh, channels: 4 } })
		.resize(SIZE, SIZE, {
			fit: 'contain',
			background: { r: 0, g: 0, b: 0, alpha: 0 },
			kernel: 'cubic',
		})
		.png({ palette: true, colours: 32, dither: 0 })
		.toFile(`${OUT}/${name}.png`);
	n++;
}
console.log(`${n} icons in ${OUT}`);
