/**
 * Painted art (Art Bible v3, art-src/gta/*): for the cast in PAINTED, the character cards become
 * public/assets/gfx/card/<id>.webp (tall, name band and border cut) and the square bust
 * public/assets/gfx/portrait/<id>.webp; fund, menu, shop and card-back images become
 * public/assets/gfx/bg|back/*.webp. The pixel-art path below still serves the portraits with no
 * painted card yet (ze, bosses). Usage: bun scripts/portraits.ts
 *
 * Converts the pixel-art character concept art (references/concept-art/zapatro/char-*.png, 1254×1254) into
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

/** Painted card (art-src/gta/char-<file>.jpeg) → portrait id. Ids stay; only the cast names changed. */
export const PAINTED: Record<string, string> = {
	bruto: 'tonhao',
	cida: 'donaCida',
	jhony: 'zeMalandro',
	nino: 'juninho',
	chico: 'joca',
	beti: 'lurdes',
	mia: 'bia',
	shiela: 'neide',
	ayla: 'tiao',
	'truco-king': 'reiDoTruco',
};

/** Source file → portrait id (pixel art). `char-pedrao.png` is left out on purpose (docs/visual.md). */
export const PORTRAITS: Record<string, string> = {
	'char-ze': 'ze',
	'char-valentao': 'valentao',
	'char-cartomante': 'cartomante',
	'char-juiz': 'juiz',
	'char-agiota': 'agiota',
	'char-delegado': 'delegado',
	'char-professor': 'professor',
	'char-irmaos': 'irmaos',
	'char-sortuda': 'sortuda',
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

const G = 'public/assets/gfx';
const SRC_GTA = 'art-src/gta';
/** Painted area of the 1024×1536 cards, without the border, corners and the name band. */
const CARD_CROP = { left: 100, top: 115, width: 824, height: 1100 } as const;

async function painted(file: string, id: string): Promise<void> {
	const card = sharp(await sharp(`${SRC_GTA}/char-${file}.jpeg`).extract(CARD_CROP).toBuffer());
	await card.clone().resize(480, 640).webp({ quality: 82 }).toFile(`${G}/card/${id}.webp`);
	await card
		.clone()
		.extract({ left: 0, top: 0, width: CARD_CROP.width, height: CARD_CROP.width })
		.resize(PAINTED_SIZE, PAINTED_SIZE)
		.webp({ quality: 85 })
		.toFile(`${OUT}/${id}.webp`);
}
const PAINTED_SIZE = 256;
const PAINTED_IDS: Record<string, true> = Object.fromEntries(
	Object.values(PAINTED).map((i) => [i, true]),
);

/** Full-screen paintings: at most 1920 wide (the biggest screen the game fits), WebP. */
const BACKGROUNDS: Record<string, string> = {
	'menu-1': 'menu-1.jpeg',
	'menu-2': 'menu-2.jpeg',
	'menu-3': 'menu-3.jpeg',
	shop: 'shop2.jpeg',
	partner: 'background-1.png',
	table: 'board-game-1.jpeg',
	main: 'background-3.png',
};
/** Card backs: 2:3 art cropped to the middle 3:4 (the card is 48×64). */
const BACKS: Record<string, string> = {
	default: 'card-1.png',
	interior: 'card-2.png',
	blefe: 'card-3.png',
};

async function scenery(): Promise<void> {
	for (const [name, file] of Object.entries(BACKGROUNDS))
		await sharp(`${SRC_GTA}/${file}`)
			.resize(1920, 1080, { fit: 'cover' })
			.webp({ quality: 78 })
			.toFile(`${G}/bg/${name}.webp`);
	for (const [name, file] of Object.entries(BACKS))
		await sharp(`${SRC_GTA}/${file}`)
			.extract({ left: 115, top: 230, width: 794, height: 1058 })
			.resize(288, 384)
			.webp({ quality: 85 })
			.toFile(`${G}/back/${name}.webp`);
}

if (import.meta.main) {
	for (const d of ['portrait', 'card', 'bg', 'back'])
		await mkdir(`${G}/${d}`, { recursive: true });
	for (const [file, id] of Object.entries(PORTRAITS)) await convert(file, id);
	for (const id of NATIVE) await convertNative(id);
	for (const [file, id] of Object.entries(PAINTED)) await painted(file, id);
	await scenery();
	const sizeOf = (id: string): number => (id in PAINTED_IDS ? PAINTED_SIZE : SIZE);
	const index = {
		images: Object.fromEntries(
			[...Object.values(PORTRAITS), ...NATIVE, ...Object.values(PAINTED)].map((id) => [
				`portrait.${id}`,
				{ w: sizeOf(id), h: sizeOf(id) },
			]),
		),
	};
	await Bun.write(
		`${G}/index.json`,
		`${JSON.stringify(index, null, '	')}
`,
	);
	console.log(
		`${Object.keys(index.images).length} portraits, cards, backgrounds and backs in ${G}`,
	);
}
