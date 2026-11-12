/**
 * Builds the official site (PLAN RC2, Astro static build) into site/out:
 *   1. icons from art-src; logo, header and the store captures from docs/media → site/public/img
 *   2. social preview (docs/media/site-og.*) → site/public/img/og.jpg
 *   3. the full game (`bun run build`) → site/public/play and the demo (`bun run build:demo`) → site/public/demo
 *   4. trailer renders, if any (trailer/out/*.mp4) → site/public/trailer
 *   5. press kit zip → site/public/presskit/truco-roguelite-presskit.zip
 *   6. `astro build` in site/ → site/out, plus .nojekyll (GitHub Pages)
 *   bun scripts/site-build.ts [--skip-demo]
 * Everything under site/public is generated (gitignored).
 */
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import sharp from 'sharp';

const args = process.argv.slice(2);
const PUB = 'site/public';
const IMG = `${PUB}/img`;

const run = (cmd: string[], cwd = '.'): void => {
	const p = Bun.spawnSync(cmd, { cwd, stdout: 'inherit', stderr: 'inherit' });
	if (p.exitCode !== 0) throw new Error(`${cmd.join(' ')} failed (${p.exitCode})`);
};

// 1. Art (Art Bible v2: no key art; logo, header, OG and store captures from docs/media,
// made by `bun scripts/store-art.ts`). Old outputs go first so site/out never ships stale art.
rmSync(IMG, { recursive: true, force: true });
mkdirSync(`${IMG}/press`, { recursive: true });
for (const size of [64, 256, 1024])
	await sharp('art-src/app-icon.svg')
		.resize(size, size, { kernel: 'nearest' })
		.png()
		.toFile(`${IMG}/icon-${size}.png`);
// Favicon, Apple touch icon and the web manifest sizes (site/src/pages/manifest.webmanifest.ts).
cpSync('art-src/app-icon.svg', `${IMG}/favicon.svg`);
await sharp('art-src/app-icon.svg').resize(180).png().toFile(`${IMG}/apple-touch-icon.png`);
for (const size of [192, 512])
	await sharp('art-src/app-icon.svg').resize(size).png().toFile(`${IMG}/icon-${size}.png`);
// favicon.ico: sharp cannot write ICO, but an ICO is only a directory of embedded PNGs
// (ICONDIR 6 bytes + one 16-byte ICONDIRENTRY per image, then the PNG data).
const ICO_SIZES = [32, 48];
const icoPngs = await Promise.all(
	ICO_SIZES.map((s) => sharp('art-src/app-icon.svg').resize(s, s).png().toBuffer()),
);
const icoHead = Buffer.alloc(6 + 16 * icoPngs.length);
icoHead.writeUInt16LE(1, 2); // type 1 = icon
icoHead.writeUInt16LE(icoPngs.length, 4);
let icoOffset = icoHead.length;
icoPngs.forEach((png, i) => {
	const e = 6 + 16 * i;
	const size = ICO_SIZES[i] ?? 0;
	icoHead.writeUInt8(size, e);
	icoHead.writeUInt8(size, e + 1);
	icoHead.writeUInt16LE(1, e + 4); // colour planes
	icoHead.writeUInt16LE(32, e + 6); // bits per pixel
	icoHead.writeUInt32LE(png.length, e + 8);
	icoHead.writeUInt32LE(icoOffset, e + 12);
	icoOffset += png.length;
});
writeFileSync(`${PUB}/favicon.ico`, Buffer.concat([icoHead, ...icoPngs]));
cpSync('docs/media/presskit-logo.png', `${IMG}/press/logo.png`);
cpSync('docs/media/presskit-logo.svg', `${IMG}/press/logo.svg`);
await sharp('docs/media/presskit-logo.png')
	.resize(640)
	.webp({ quality: 85 })
	.toFile(`${IMG}/press/logo-640.webp`);
cpSync('docs/media/store-steam-header.png', `${IMG}/press/header.png`);
// Six 1920×1080 captures per language: the PNG for the press, a 1280 WebP for the page.
for (const f of readdirSync('docs/media').filter((f) => /^store-shot-.*\.png$/.test(f))) {
	const name = f.replace(/^store-shot-\d+-/, '').replace(/\.png$/, '');
	cpSync(`docs/media/${f}`, `${IMG}/press/${name}.png`);
	await sharp(`docs/media/${f}`)
		.resize(1280)
		.webp({ quality: 80 })
		.toFile(`${IMG}/press/${name}.webp`);
}
// Trailer poster per language until the render has its own still (§7.6): the count capture, in
// the widths of its srcset (site/src/components/trailer.ts): phones fetch the small one.
for (const lang of ['en', 'pt-BR'])
	for (const w of [480, 720, 960])
		await sharp(`docs/media/store-shot-02-count-${lang}.png`)
			.resize(w)
			.webp({ quality: 74 })
			.toFile(`${IMG}/trailer-poster-${lang}${w === 960 ? '' : `-${w}`}.webp`);
console.log('art ok');

// Painted page background (art-src/gta/background-2.png): one size per breakpoint, see site/src/styles/global.css.
for (const w of [640, 1280, 1920])
	await sharp('art-src/gta/background-2.png')
		.resize(w, Math.round((w * 9) / 16), { fit: 'cover' })
		.webp({ quality: 72 })
		.toFile(`${IMG}/bg-${w}.webp`);

// 2. Social preview 1200×630 (docs/media/site-og.*, from scripts/store-art.ts).
const ogSrc = ['docs/media/site-og.jpg', 'docs/media/site-og.png'].find((f) => existsSync(f));
if (!ogSrc) throw new Error('docs/media/site-og.{jpg,png} missing: run bun scripts/store-art.ts');
await sharp(ogSrc)
	.resize(1200, 630, { fit: 'cover' })
	.jpeg({ quality: 84 })
	.toFile(`${IMG}/og.jpg`);

// 3. Games: the full build at /play, the demo at /demo.
if (!args.includes('--skip-demo')) {
	for (const [script, dir] of [
		['build', 'play'],
		['build:demo', 'demo'],
	] as const) {
		run(['bun', 'run', script]);
		rmSync(`${PUB}/${dir}`, { recursive: true, force: true });
		cpSync('dist', `${PUB}/${dir}`, { recursive: true });
		console.log(`${dir} ok`);
	}
}
// The games are apps, not pages: keep them out of search results.
for (const dir of ['play', 'demo']) {
	const index = `${PUB}/${dir}/index.html`;
	if (!existsSync(index)) continue;
	const html = readFileSync(index, 'utf8');
	if (!html.includes('name="robots"'))
		writeFileSync(
			index,
			html.replace('<head>', '<head><meta name="robots" content="noindex" />'),
		);
}

// 4. Trailer.
if (existsSync('trailer/out')) {
	mkdirSync(`${PUB}/trailer`, { recursive: true });
	for (const f of readdirSync('trailer/out').filter(
		(f) => f.endsWith('.mp4') || f.endsWith('.vtt'),
	))
		cpSync(`trailer/out/${f}`, `${PUB}/trailer/${f}`);
}

// 5. Press kit zip (bsdtar ships with Windows 10+ and macOS; zip on Linux).
mkdirSync(`${PUB}/presskit`, { recursive: true });
const zip = `${PUB}/presskit/truco-roguelite-presskit.zip`;
rmSync(zip, { force: true });
// Full-size PNGs and the SVG logo; the WebPs are only for the page.
const files = [
	'icon-1024.png',
	...readdirSync(`${IMG}/press`)
		.filter((f) => !f.endsWith('.webp'))
		.map((f) => `press/${f}`),
];
if (process.platform === 'win32')
	run(
		[
			// Windows' own bsdtar (Git's GNU tar on the PATH cannot write zip).
			`${process.env.SystemRoot ?? 'C:/Windows'}/System32/tar.exe`,
			'-a',
			'-c',
			'-f',
			'../presskit/truco-roguelite-presskit.zip',
			...files,
		],
		IMG,
	);
else run(['zip', '-q', '../presskit/truco-roguelite-presskit.zip', ...files], IMG);
console.log('press kit ok');

// 6. Site: the Astro static build (site/astro.config.ts; SITE_URL and SITE_BASE set the origin and
// the path prefix, GitHub Pages default /zapatro/). public/ (art, /play, /demo) is copied as-is.
if (!existsSync('site/node_modules')) run(['bun', 'install', '--frozen-lockfile'], 'site');
rmSync('site/out', { recursive: true, force: true });
run(['bun', 'run', 'build'], 'site');
// GitHub Pages runs Jekyll unless told not to, which would drop folders that start with "_".
writeFileSync('site/out/.nojekyll', '');
console.log('site/out ready');
