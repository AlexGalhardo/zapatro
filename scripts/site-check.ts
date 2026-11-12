/**
 * Deploy rehearsal of the site (docs/site.md): serves site/out the way GitHub Pages does (under the
 * repository prefix, index.html per directory, 404 outside the prefix) and checks it in headless
 * Chromium before the push to main publishes it.
 *   bun run site:build && bun scripts/site-check.ts [--port 5211] [--base /zapatro/]
 * Checks: pages answer 200 (/, /pt/, presskit, privacy, both languages), robots.txt, sitemap.xml,
 * the manifest and one image, no HTML with a root-absolute URL outside the base, `noindex` on /play/
 * and /demo/, /play/ hides __GAME__ without ?qa=1 and shows the menu with it, a quick match at 4x
 * reaches 12 tentos, /demo/ is the demo build; 0 console errors and 0 HTTP >= 400 everywhere.
 * Prints one PASS/FAIL line per check; exit 1 when one fails.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { chromium, type Page } from 'playwright';

const args = process.argv.slice(2);
const arg = (name: string, fallback: string): string =>
	args.includes(name) ? (args[args.indexOf(name) + 1] ?? fallback) : fallback;
const port = Number(arg('--port', '5211'));
const prefix = `/${arg('--base', '/zapatro/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const ROOT = 'site/out';
const server = Bun.serve({
	port,
	async fetch(req) {
		const path = decodeURIComponent(new URL(req.url).pathname);
		if (!path.startsWith(prefix)) return new Response('404', { status: 404 });
		let f = `${ROOT}/${path.slice(prefix.length)}`;
		if (f.endsWith('/')) f += 'index.html';
		if (!existsSync(f) && existsSync(`${f}/index.html`)) f = `${f}/index.html`;
		return existsSync(f) && statSync(f).isFile()
			? new Response(await Bun.file(f).bytes(), {
					headers: { 'Content-Type': Bun.file(f).type },
				})
			: new Response('404', { status: 404 });
	},
});
const B = `http://localhost:${port}${prefix.slice(0, -1)}`;
const NOISE = /GL Driver Message|AudioContext was not allowed|GPU stall|swiftshader/i;
const browser = await chromium.launch({
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const out: string[] = [];
const ok = (n: string, c: boolean, d = '') =>
	out.push(`${c ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`);
async function visit(path: string, body?: (p: Page) => Promise<void>) {
	const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
	const errs: string[] = [];
	const http: string[] = [];
	page.on('pageerror', (e) => errs.push(e.message));
	page.on('console', (m) => {
		if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text());
	});
	page.on('response', (r) => {
		if (r.status() >= 400) http.push(`${r.status()} ${r.url()}`);
	});
	const res = await page.goto(B + path, { waitUntil: 'load' });
	ok(`${path} responds 200`, res?.status() === 200, String(res?.status()));
	if (body) await body(page);
	else await page.waitForTimeout(1500);
	ok(`${path} 0 console errors`, errs.length === 0, errs.slice(0, 3).join(' | '));
	ok(`${path} 0 HTTP >= 400`, http.length === 0, http.slice(0, 3).join(' | '));
	await page.close();
}
for (const p of ['/', '/pt/', '/presskit/', '/pt/presskit/', '/privacy/', '/pt/privacy/'])
	await visit(p);

// Static files and the image of the home; the manifest and the sitemap must name the base too.
for (const [path, type] of [
	['/robots.txt', 'text/plain'],
	['/sitemap.xml', 'xml'],
	['/manifest.webmanifest', ''],
	['/img/og.jpg', 'image/jpeg'],
] as const) {
	const r = await fetch(`${B}${path}`);
	ok(
		`${path} responds 200`,
		r.status === 200 && r.headers.get('content-type')?.includes(type) === true,
		`${r.status} ${r.headers.get('content-type')}`,
	);
}
const manifestText = await (await fetch(`${B}/manifest.webmanifest`)).text();
const manifest = JSON.parse(manifestText) as {
	start_url: string;
	icons: { src: string }[];
};
ok(
	'manifest start_url and icons under the base',
	manifest.start_url === prefix && manifest.icons.every((i) => i.src.startsWith(prefix)),
);
const sitemap = await (await fetch(`${B}/sitemap.xml`)).text();
ok('sitemap lists the pages under the base', sitemap.includes(`${prefix}pt/presskit/</loc>`));
ok(
	'robots.txt names the sitemap',
	(await (await fetch(`${B}/robots.txt`)).text()).includes(`${prefix}sitemap.xml`),
);
ok(
	'nothing is served outside the base',
	(await fetch(`${B.replace(prefix.slice(0, -1), '')}/`)).status === 404,
);

// No page may point at a root-absolute URL outside the base (it would 404 on a project site).
const htmlFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? ['play', 'demo'].includes(e.name) && dir === ROOT
				? []
				: htmlFiles(`${dir}/${e.name}`)
			: e.name.endsWith('.html')
				? [`${dir}/${e.name}`]
				: [],
	);
const stray: string[] = [];
for (const f of htmlFiles(ROOT))
	for (const m of readFileSync(f, 'utf8').matchAll(
		/(?:href|src|srcset|content)="(\/[^"/][^"]*)"|url\(["']?(\/[^"')/][^"')]*)/g,
	)) {
		const u = m[1] ?? m[2] ?? '';
		if (!u.startsWith(prefix)) stray.push(`${f}: ${u}`);
	}
ok(
	'no root-absolute URL outside the base in the HTML',
	stray.length === 0,
	stray.slice(0, 3).join(' | '),
);
const ev = (page: Page, js: string) =>
	page.evaluate(
		`(() => { const g = window.__GAME__; const t = g?.scene.keys.Table; return (${js})(g, t); })()`,
	);
for (const game of ['/play/', '/demo/']) {
	const html = await (await fetch(`${B}${game}`)).text();
	ok(`${game} has meta noindex`, /<meta name="robots" content="noindex"/.test(html));
}
await visit('/play/', async (page) => {
	await page.waitForTimeout(4000);
	ok('/play/ hides __GAME__ without ?qa=1', !(await page.evaluate(() => '__GAME__' in window)));
	await page.mouse.click(5, 5);
	await page.waitForTimeout(8000); // deferred audio after the menu
});
await visit('/play/?qa=1&seed=1', async (page) => {
	await page.waitForFunction(`window.__GAME__?.scene.isActive('Menu')`, undefined, {
		timeout: 30000,
	});
	ok('/play/?qa=1 exposes __GAME__ and the menu', true);
	await page.mouse.click(5, 5);
	await page.waitForTimeout(6000);
});
await visit('/play/?qa=1&skipMenu=1&seed=2&auto=1&speed=4', async (page) => {
	await page.waitForFunction(
		`window.__GAME__?.scene.keys.Table?.match !== undefined`,
		undefined,
		{ timeout: 30000 },
	);
	let end = false;
	for (let i = 0; i < 2400 && !end; i++) {
		end = Boolean(
			await ev(page, '(g, t) => t.match.winner !== null && t.endPanel.visible').catch(
				() => false,
			),
		);
		if (!end) await page.waitForTimeout(250);
	}
	const s = end ? await ev(page, '(g, t) => JSON.stringify(t.match.score)') : 'timeout';
	ok(
		'/play/ quick match at 4× to the end (12)',
		end && (await ev(page, '(g, t) => t.match.score[t.match.winner] >= 12')) === true,
		String(s),
	);
});
await visit('/demo/?qa=1&seed=1', async (page) => {
	await page.waitForFunction(`window.__GAME__?.scene.isActive('Menu')`, undefined, {
		timeout: 30000,
	});
	await page.mouse.click(5, 5);
	await page.waitForTimeout(6000);
	await page.keyboard.press('Enter');
	await page.waitForTimeout(2000);
	await ev(page, `(g) => g.scene.keys.Run.choosePartner(g.scene.keys.Run.candidates[0])`);
	await page.waitForTimeout(800);
	ok(
		'/demo/ is the demo build (new run flagged demo)',
		(await ev(page, `(g) => g.scene.keys.Run.run?.demo === true`)) === true,
	);
});
await browser.close();
server.stop(true);
console.log(out.join('\n'));
process.exit(out.some((l) => l.startsWith('FAIL')) ? 1 : 0);
