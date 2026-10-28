/**
 * Store and press art (game-director-feedback.md §9, GD-013) drawn from the game itself: the card
 * faces come from `drawKey` (src/art/flat.ts), the portraits are the 128 px pixel-art PNGs, the
 * wordmark is Rubik 700. No AI and no paid API: re-running overwrites docs/media/ with the same art.
 *   bun scripts/store-art.ts [--url http://localhost:5195]
 * Without --url it starts its own Vite dev server on 5195 (dev serves src/ as modules) and stops it.
 * The 1920×1080 store screenshots are taken separately (`bun scripts/shot.ts --size 1920x1080`).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const OUT = 'docs/media';
const PORT = 5195;
const args = process.argv.slice(2);
const urlArg = args.indexOf('--url');
const url = urlArg >= 0 ? (args[urlArg + 1] ?? '') : `http://localhost:${PORT}`;

const GOLD = '#F4C542';
const SHADOW = '#1A1A1A';
const LOGO_W = 2048;
const LOGO_H = 640;
const TRANSPARENT = ['store-steam-logo', 'presskit-logo'];

async function waitFor(target: string): Promise<void> {
	for (let i = 0; i < 120; i++) {
		try {
			if ((await fetch(target)).ok) return;
		} catch {}
		await Bun.sleep(500);
	}
	throw new Error(`no server at ${target}`);
}

/** Runs in the page: draws every art and returns name → PNG data URL. */
async function paintAll(flatUrl: string): Promise<Record<string, string>> {
	type Ctx = CanvasRenderingContext2D;
	const flat = (await import(flatUrl)) as {
		drawKey: (ctx: Ctx, key: string) => void;
		portraitBg: (id: string) => number;
	};
	await document.fonts.load('700 100px Rubik');
	const C = {
		bg: '#2B2B2B',
		felt: '#24644D',
		feltDark: '#1B4D3B',
		gold: '#F4C542',
		shadow: '#1A1A1A',
		chips: '#3F7FC0',
		mult: '#E4572E',
		light: '#F6EEDC',
	};
	const CARD_W = 48;
	const CARD_H = 64;
	const FONT = '"Rubik", sans-serif';
	const ZAP = 'card.4.clubs.z';
	const FAN = [ZAP, 'card.7.hearts', 'card.A.spades'];

	const images = new Map<string, HTMLImageElement>();
	for (const id of ['bruto', 'cida', 'jhony']) {
		const img = new Image();
		// Painted portraits are WebP (scripts/portraits.ts).
		img.src = `/assets/gfx/portrait/${id}.webp`;
		await img.decode();
		images.set(id, img);
	}

	const canvas = (w: number, h: number, bg: string | null): [HTMLCanvasElement, Ctx] => {
		const el = document.createElement('canvas');
		el.width = w;
		el.height = h;
		const ctx = el.getContext('2d');
		if (!ctx) throw new Error('no 2d context');
		if (bg) {
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, w, h);
		}
		return [el, ctx];
	};

	/** "ZAPATRO" as large as fits in maxW × maxH, centred on (cx, cy), with a solid offset shadow. */
	const wordmark = (ctx: Ctx, cx: number, cy: number, maxW: number, maxH: number): void => {
		const at = (size: number): TextMetrics => {
			ctx.font = `700 ${size}px ${FONT}`;
			ctx.letterSpacing = `${size * 0.03}px`;
			return ctx.measureText('ZAPATRO');
		};
		const m100 = at(100);
		const h100 = m100.actualBoundingBoxAscent + m100.actualBoundingBoxDescent;
		// The shadow adds ~6% to each side of the box.
		const size = Math.floor(100 * Math.min(maxW / (m100.width * 1.06), maxH / (h100 * 1.08)));
		const m = at(size);
		const off = Math.max(2, Math.round(size * 0.06));
		const x = cx - (m.width + off) / 2;
		const y = cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent - off) / 2;
		ctx.textBaseline = 'alphabetic';
		ctx.fillStyle = C.shadow;
		ctx.fillText('ZAPATRO', x + off, y + off);
		ctx.fillStyle = C.gold;
		ctx.fillText('ZAPATRO', x, y);
		ctx.letterSpacing = '0px';
	};

	/** A card face from flat.ts centred on (cx, cy), scaled and turned, over a solid shadow. */
	const card = (ctx: Ctx, key: string, cx: number, cy: number, s: number, deg: number): void => {
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate((deg * Math.PI) / 180);
		ctx.scale(s, s);
		ctx.translate(-CARD_W / 2, -CARD_H / 2);
		ctx.fillStyle = C.shadow;
		ctx.beginPath();
		ctx.roundRect(3, 3, CARD_W, CARD_H, 5);
		ctx.fill();
		flat.drawKey(ctx, key);
		ctx.restore();
	};

	/** The menu's fan (4♣ ZAP, 7♥, A♠) centred on (cx, cy); `s` is the card scale. */
	const fan = (ctx: Ctx, cx: number, cy: number, s: number): void => {
		const k = s / 2.3;
		const spots: [number, number, number][] = [
			[-91, 15, -13],
			[0, 0, -1],
			[91, 20, 12],
		];
		spots.forEach(([dx, dy, deg], i) => {
			card(ctx, FAN[i] ?? ZAP, cx + dx * k, cy + dy * k, s, deg);
		});
	};

	/** A 128 px pixel-art portrait at an integer scale (nearest neighbour) on its coloured card. */
	const portrait = (ctx: Ctx, id: string, x: number, y: number, scale: number): void => {
		const img = images.get(id);
		if (!img) throw new Error(`no portrait ${id}`);
		const s = 128 * scale;
		const r = Math.round(s * 0.1);
		const off = 4 * scale;
		ctx.fillStyle = C.shadow;
		ctx.beginPath();
		ctx.roundRect(x + off, y + off, s, s, r);
		ctx.fill();
		ctx.fillStyle = `#${flat.portraitBg(id).toString(16).padStart(6, '0')}`;
		ctx.beginPath();
		ctx.roundRect(x, y, s, s, r);
		ctx.fill();
		ctx.save();
		ctx.clip();
		ctx.imageSmoothingEnabled = true;
		ctx.drawImage(img, x, y, s, s);
		ctx.restore();
	};

	/** "Fichas × Mult" as the game's counter: a blue and a vermilion block around the ×. */
	const counter = (ctx: Ctx, cx: number, cy: number, size: number): void => {
		ctx.font = `700 ${size}px ${FONT}`;
		ctx.textBaseline = 'middle';
		const padX = size * 0.45;
		const boxH = size * 1.5;
		const gap = size * 0.4;
		const words = ['Fichas', '×', 'Mult'];
		const boxW = words.map((w, i) => ctx.measureText(w).width + (i === 1 ? 0 : padX * 2));
		let x = cx - (boxW.reduce((a, b) => a + b, 0) + gap * 2) / 2;
		const off = Math.round(size * 0.1);
		words.forEach((word, i) => {
			const w = boxW[i] ?? 0;
			if (i !== 1) {
				ctx.fillStyle = C.shadow;
				ctx.beginPath();
				ctx.roundRect(x + off, cy - boxH / 2 + off, w, boxH, size * 0.3);
				ctx.fill();
				ctx.fillStyle = i === 0 ? C.chips : C.mult;
				ctx.beginPath();
				ctx.roundRect(x, cy - boxH / 2, w, boxH, size * 0.3);
				ctx.fill();
			}
			ctx.fillStyle = C.shadow;
			ctx.fillText(word, x + (i === 1 ? 0 : padX) + off * 0.6, cy + off * 0.6);
			ctx.fillStyle = C.light;
			ctx.fillText(word, x + (i === 1 ? 0 : padX), cy);
			x += w + gap;
		});
	};

	/** Half the width of the fan at card scale `s`, shadow included. */
	const fanHalf = (s: number): number => (91 * s) / 2.3 + 34 * s;

	/** Portraits on the left, the logo in the middle, the fan on the right (wide capsules). */
	const wide = (w: number, h: number): HTMLCanvasElement => {
		const [el, ctx] = canvas(w, h, C.bg);
		const u = h / 430;
		const margin = Math.round(24 * u);
		const step = Math.round(72 * u);
		portrait(ctx, 'bruto', margin, Math.round(h / 2 - 128 - 14 * u), 1);
		portrait(ctx, 'cida', margin + step, Math.round(h / 2 + 14 * u), 1);
		const fanS = 1.8 * u;
		const fanX = w - margin - fanHalf(fanS);
		const left = margin + step + 128 + 4 + 12 * u;
		const right = fanX - fanHalf(fanS) + 8 * u;
		wordmark(ctx, (left + right) / 2, h / 2, right - left, h * 0.4);
		fan(ctx, fanX, h / 2, fanS);
		return el;
	};

	/** The logo on top, portraits bottom left, the fan bottom right (squarer capsules). */
	const stacked = (w: number, h: number, logoH: number, pScale: number, fanS: number) => {
		const [el, ctx] = canvas(w, h, C.bg);
		wordmark(ctx, w / 2, logoH * 0.62, w * 0.86, logoH * 0.7);
		const p = 128 * pScale;
		const top = logoH + (h - logoH - p) / 2;
		const left = w * 0.05;
		portrait(ctx, 'bruto', Math.round(left), Math.round(top), pScale);
		portrait(ctx, 'cida', Math.round(left + p + w * 0.03), Math.round(top), pScale);
		fan(ctx, w - left - fanHalf(fanS), top + p / 2, fanS);
		return [el, ctx] as const;
	};

	const out: Record<string, string> = {};
	const save = (name: string, el: HTMLCanvasElement): void => {
		out[name] = el.toDataURL('image/png');
	};

	save('store-steam-header', wide(920, 430));
	save('store-play-feature', wide(1024, 500));

	{
		const [el, ctx] = canvas(462, 174, C.bg);
		wordmark(ctx, 182, 87, 320, 96);
		card(ctx, ZAP, 392, 87, 2, 8);
		save('store-steam-small', el);
	}

	save('store-steam-main', stacked(616, 353, 130, 1, 1.5)[0]);
	save('store-itch-cover', stacked(630, 500, 170, 1, 1.9)[0]);

	{
		const [el, ctx] = stacked(1200, 630, 180, 2, 3);
		counter(ctx, 600, 224, 34);
		save('site-og', el);
	}

	{
		const [el, ctx] = canvas(748, 896, C.bg);
		wordmark(ctx, 374, 130, 660, 160);
		portrait(ctx, 'jhony', 40, 270, 2);
		portrait(ctx, 'cida', 100, 430, 2);
		portrait(ctx, 'bruto', 160, 590, 2);
		card(ctx, ZAP, 560, 570, 4, 8);
		save('store-steam-vertical', el);
	}

	{
		const [el, ctx] = canvas(600, 900, C.bg);
		wordmark(ctx, 300, 220, 520, 170);
		fan(ctx, 300, 580, 3.6);
		save('store-steam-library', el);
	}

	{
		// Library hero: the four cards played in a cross on flat felt, no logo (Steam overlays it).
		const [el, ctx] = canvas(3840, 1240, C.felt);
		ctx.fillStyle = C.feltDark;
		ctx.beginPath();
		ctx.ellipse(1920, 620, 760, 520, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = C.felt;
		ctx.beginPath();
		ctx.ellipse(1920, 620, 736, 496, 0, 0, Math.PI * 2);
		ctx.fill();
		card(ctx, 'card.7.hearts', 1920, 300, 6, -4);
		card(ctx, 'card.A.spades', 2330, 630, 6, 7);
		card(ctx, ZAP, 1920, 940, 6, 3);
		card(ctx, 'card.3.diamonds', 1510, 610, 6, -8);
		save('store-steam-hero', el);
	}

	{
		const [el, ctx] = canvas(1280, 720, null);
		wordmark(ctx, 640, 360, 1160, 400);
		save('store-steam-logo', el);
	}

	{
		const [el, ctx] = canvas(2048, 640, null);
		wordmark(ctx, 1024, 320, 1960, 600);
		save('presskit-logo', el);
	}

	return out;
}

/** Vector wordmark: SVG text in Rubik 700 with the font embedded, so it renders without Rubik installed. */
function logoSvg(): string {
	const font = readFileSync('node_modules/@fontsource/rubik/files/rubik-latin-700-normal.woff2');
	const size = 360;
	const off = Math.round(size * 0.06);
	const text = (fill: string, dx: number): string =>
		`<text x="${LOGO_W / 2 + dx}" y="${LOGO_H / 2 + dx}" fill="${fill}" font-family="Rubik" font-weight="700" font-size="${size}" letter-spacing="${size * 0.03}" text-anchor="middle" dominant-baseline="central">ZAPATRO</text>`;
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_W}" height="${LOGO_H}" viewBox="0 0 ${LOGO_W} ${LOGO_H}" role="img" aria-label="Zapatro"><title>Zapatro</title>`,
		'<!-- Zapatro wordmark: Rubik 700 (SIL OFL), gold #F4C542 over a solid #1A1A1A shadow. The font is embedded; tools that ignore @font-face need Rubik installed or the PNG. -->',
		`<style>@font-face{font-family:"Rubik";font-weight:700;src:url(data:font/woff2;base64,${font.toString('base64')}) format("woff2");}</style>`,
		text(SHADOW, off),
		text(GOLD, 0),
		'</svg>',
		'',
	].join('\n');
}

mkdirSync(OUT, { recursive: true });
const server =
	urlArg >= 0
		? null
		: Bun.spawn(
				['bun', 'node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'],
				{
					stdout: 'ignore',
					stderr: 'ignore',
				},
			);
try {
	await waitFor(url);
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(`${url}/?seed=1`);
	const arts = await page.evaluate(paintAll, '/src/art/flat.ts');
	await browser.close();
	for (const [name, data] of Object.entries(arts)) {
		const png = sharp(Buffer.from(data.split(',')[1] ?? '', 'base64'));
		// Opaque art drops the alpha channel: Google Play rejects a feature graphic with alpha.
		if (!TRANSPARENT.includes(name)) png.removeAlpha();
		await png.png({ compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
	}
} finally {
	server?.kill();
}

await sharp(`${OUT}/site-og.png`).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/site-og.jpg`);
await sharp(`${OUT}/site-og.png`).webp({ quality: 88 }).toFile(`${OUT}/site-og.webp`);
writeFileSync(`${OUT}/presskit-logo.svg`, logoSvg());
// The Play icon is the app icon (art-src/app-icon.svg) that `bun run app-icons` renders at 512 px.
copyFileSync('mobile/assets/play-store-icon-512.png', `${OUT}/store-play-icon.png`);

const files = [
	'store-steam-header.png',
	'store-steam-small.png',
	'store-steam-main.png',
	'store-steam-vertical.png',
	'store-steam-library.png',
	'store-steam-hero.png',
	'store-steam-logo.png',
	'store-play-feature.png',
	'store-play-icon.png',
	'store-itch-cover.png',
	'site-og.png',
	'site-og.jpg',
	'site-og.webp',
	'presskit-logo.png',
];
for (const file of files) {
	const meta = await sharp(`${OUT}/${file}`).metadata();
	const kb = (Bun.file(`${OUT}/${file}`).size / 1024).toFixed(0);
	console.log(`${OUT}/${file}  ${meta.width}×${meta.height}  alpha=${meta.hasAlpha}  ${kb} kB`);
}
console.log(
	`${OUT}/presskit-logo.svg  ${(Bun.file(`${OUT}/presskit-logo.svg`).size / 1024).toFixed(0)} kB`,
);
