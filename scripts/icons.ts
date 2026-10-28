/**
 * Cuts the painted UI icons out of the sheets in references/concept-art-gta/ into 32×32 PNGs with
 * alpha: public/assets/gfx/icon/<name>.png. Each sheet is a grid on a grey background: a cell is
 * cropped inside its white grid line, the grey is flood-filled from the cell corners, and the drawn
 * part is fitted in the box. A null cell is skipped. Local only. Usage: bun scripts/icons.ts
 */
import { copyFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = 'public/assets/gfx/icon';
const SIZE = 32;
/** Keeps the white grid lines out of each cell. */
const INSET = 14;
/** Background is neutral grey: a bluish grip close to it must not be flooded away. */
const CHROMA = 12;
/** Luminance from which a pixel is the white grid line. */
const WHITE = 235;
const TOLERANCE = 22;

interface Sheet {
	src: string;
	cols: number;
	rows: number;
	/** Row-major names of the sheet; null cells are skipped. */
	grid: (string | null)[];
}

const SHEETS: Sheet[] = [
	{
		src: 'references/concept-art-gta/icons.png',
		cols: 8,
		rows: 4,
		grid: [
			'coin',
			'star',
			'crown',
			'skull',
			'trophy',
			'lock',
			'book',
			'door',
			'gear',
			'sound',
			'mute',
			'back',
			'cards',
			'swords',
			'hand',
			'cart',
			'back2',
			'arrowRight',
			'arrowLeft',
			'chevron',
			'close',
			'check',
			'alert',
			'gamepad',
			'sparkle',
			'megaphone',
			'calc',
			'people',
			null,
			null,
			null,
			null,
		],
	},
	{
		src: 'references/concept-art-gta/icones-2.png',
		cols: 4,
		rows: 2,
		grid: ['list', 'doc', 'refresh', 'monitor', 'upload', 'download', 'note', 'pause'],
	},
];

await mkdir(OUT, { recursive: true });

let n = 0;
for (const sheet of SHEETS) {
	const meta = await sharp(sheet.src).metadata();
	const cw = Math.floor((meta.width ?? 0) / sheet.cols);
	const ch = Math.floor((meta.height ?? 0) / sheet.rows);
	for (const [i, name] of sheet.grid.entries()) {
		if (!name) continue;
		const left = (i % sheet.cols) * cw + INSET;
		const top = Math.floor(i / sheet.cols) * ch + INSET;
		const { data, info } = await sharp(sheet.src)
			.extract({ left, top, width: cw - 2 * INSET, height: ch - 2 * INSET })
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const { width: w, height: h } = info;
		const at = (x: number, y: number): number => (y * w + x) * 4;
		const refLum = ((data[0] ?? 0) + (data[1] ?? 0) + (data[2] ?? 0)) / 3;

		// Background: neutral grey or the white grid line, connected to the crop's border. Seeds are
		// every border pixel, so a grid line cut across the cell is removed as well.
		const isBg = new Uint8Array(w * h);
		const bgLike = (p: number): boolean => {
			const r = data[p] ?? 0;
			const g = data[p + 1] ?? 0;
			const bl = data[p + 2] ?? 0;
			const lum = (r + g + bl) / 3;
			if (Math.abs(r - bl) > CHROMA) return false;
			return Math.abs(lum - refLum) <= TOLERANCE || lum >= WHITE;
		};
		const stack: number[] = [];
		for (let x = 0; x < w; x++) stack.push(x, 0, x, h - 1);
		for (let y = 0; y < h; y++) stack.push(0, y, w - 1, y);
		while (stack.length) {
			const y = stack.pop() as number;
			const x = stack.pop() as number;
			if (x < 0 || y < 0 || x >= w || y >= h || isBg[y * w + x]) continue;
			const p = at(x, y);
			if (!bgLike(p)) continue;
			isBg[y * w + x] = 1;
			data[p + 3] = 0;
			stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
		}

		// Bounding box of what is drawn, so every icon fills the 32 px box the same way.
		let x0 = w;
		let y0 = h;
		let x1 = -1;
		let y1 = -1;
		for (let y = 0; y < h; y++)
			for (let x = 0; x < w; x++) {
				if (isBg[y * w + x]) continue;
				x0 = Math.min(x0, x);
				y0 = Math.min(y0, y);
				x1 = Math.max(x1, x);
				y1 = Math.max(y1, y);
			}
		if (x1 < 0) throw new Error(`no drawn pixels in cell ${name}`);

		await sharp(data, { raw: { width: w, height: h, channels: 4 } })
			.extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
			.resize(SIZE, SIZE, {
				fit: 'contain',
				background: { r: 0, g: 0, b: 0, alpha: 0 },
				kernel: 'cubic',
			})
			.png()
			.toFile(`${OUT}/${name}.png`);
		n++;
	}
}
// `next` shares the right arrow of the first sheet (the menus and the tutorial call it that way).
await copyFile(`${OUT}/arrowRight.png`, `${OUT}/next.png`);
console.log(`${n + 1} icons in ${OUT}`);
