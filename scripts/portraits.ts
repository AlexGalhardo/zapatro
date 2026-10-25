/**
 * Converts the character concept art (references/concept-art/zapatro/char-*.png, 1254×1254) into
 * the game's 128×128 portraits: area downscale, at most 32 colours, no dithering, and the flat
 * background removed from the image corners (the game paints the background by role).
 * O Mudo has no concept: it comes from PixelLab (art-src/portrait/mudo.png). Local only, no network. Usage: bun scripts/portraits.ts
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = 'references/concept-art/zapatro';
const OUT = 'public/assets/gfx/portrait';
const SIZE = 128;
const COLOURS = 32;
/** Colour distance (per channel sum) that still counts as the background. */
const TOLERANCE = 60;

/** Source file → portrait id. `char-pedrao.png` is left out on purpose (docs/visual.md). */
export const PORTRAITS: Record<string, string> = {
	'char-tonhao': 'tonhao',
	'char-dona-cida': 'donaCida',
	'char-ze-malandro': 'zeMalandro',
	'char-juninho': 'juninho',
	'char-ze': 'ze',
	'char-bia': 'bia',
	'char-joca': 'joca',
	'char-lurdes': 'lurdes',
	'char-tiao': 'tiao',
	'char-neide': 'neide',
	'char-valentao': 'valentao',
	'char-cartomante': 'cartomante',
	'char-juiz': 'juiz',
	'char-agiota': 'agiota',
	'char-delegado': 'delegado',
	'char-professor': 'professor',
	'char-irmaos': 'irmaos',
	'char-sortuda': 'sortuda',
	'char-rei-do-truco': 'reiDoTruco',
};

/** Clears the pixels connected to the corners that look like the corner colour. */
function cutBackground(rgba: Buffer, w: number, h: number): void {
	const at = (x: number, y: number): number => (y * w + x) * 4;
	const seen = new Uint8Array(w * h);
	const stack: number[] = [];
	for (const [x, y] of [
		[0, 0],
		[w - 1, 0],
		[0, h - 1],
		[w - 1, h - 1],
	] as const) {
		const o = at(x, y);
		const ref = [rgba[o] ?? 0, rgba[o + 1] ?? 0, rgba[o + 2] ?? 0] as const;
		stack.push(x, y);
		while (stack.length) {
			const cy = stack.pop() as number;
			const cx = stack.pop() as number;
			if (cx < 0 || cy < 0 || cx >= w || cy >= h || seen[cy * w + cx]) continue;
			const p = at(cx, cy);
			const d =
				Math.abs((rgba[p] ?? 0) - ref[0]) +
				Math.abs((rgba[p + 1] ?? 0) - ref[1]) +
				Math.abs((rgba[p + 2] ?? 0) - ref[2]);
			if (d > TOLERANCE) continue;
			seen[cy * w + cx] = 1;
			rgba[p + 3] = 0;
			stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
		}
	}
}

async function convert(file: string, id: string): Promise<void> {
	const { data, info } = await sharp(`${SRC}/${file}.png`)
		.ensureAlpha()
		.resize(SIZE * 2, SIZE * 2, { kernel: 'cubic' })
		.raw()
		.toBuffer({ resolveWithObject: true });
	cutBackground(data, info.width, info.height);
	await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
		.resize(SIZE, SIZE, { kernel: 'nearest' })
		.png({ palette: true, colours: COLOURS, dither: 0 })
		.toFile(`${OUT}/${id}.png`);
}

/** Portraits drawn at 128×128 with PixelLab (art-src/portrait/<id>.png): only the background is cut. */
export const NATIVE = ['mudo'] as const;

async function convertNative(id: string): Promise<void> {
	const { data, info } = await sharp(`art-src/portrait/${id}.png`)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	cutBackground(data, info.width, info.height);
	await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
		.png({ palette: true, colours: COLOURS, dither: 0 })
		.toFile(`${OUT}/${id}.png`);
}

if (import.meta.main) {
	await mkdir(OUT, { recursive: true });
	for (const [file, id] of Object.entries(PORTRAITS)) await convert(file, id);
	for (const id of NATIVE) await convertNative(id);
	const index = {
		images: Object.fromEntries(
			[...Object.values(PORTRAITS), ...NATIVE].map((id) => [
				`portrait.${id}`,
				{ w: SIZE, h: SIZE },
			]),
		),
	};
	await Bun.write('public/assets/gfx/index.json', `${JSON.stringify(index, null, '\t')}\n`);
	console.log(`${Object.keys(PORTRAITS).length + NATIVE.length} portraits in ${OUT}`);
}
