/**
 * Deploy rehearsal of the site (docs/site.md): serves site/out the way Vercel does (index.html per
 * directory, `.html` for routes) and checks it in headless Chromium before `bun run site:deploy`.
 *   bun run site:build && bun scripts/site-check.ts [--port 5211]
 * Checks: pages answer 200 (/, /pt/, presskit, privacy), `noindex` on /play/ and /demo/, /play/
 * hides __GAME__ without ?qa=1 and shows the menu with it, a quick match at 4x reaches 12 tentos,
 * /demo/ is the demo build; 0 console errors and 0 HTTP >= 400 everywhere (deferred audio included).
 * Prints one PASS/FAIL line per check; exit 1 when one fails.
 */
import { existsSync, statSync } from 'node:fs';
import { chromium, type Page } from 'playwright';

const args = process.argv.slice(2);
const port = Number(args.includes('--port') ? args[args.indexOf('--port') + 1] : 5211);
const server = Bun.serve({
	port,
	fetch(req) {
		let p = decodeURIComponent(new URL(req.url).pathname);
		if (p.endsWith('/')) p += 'index.html';
		let f = `site/out${p}`;
		if (!existsSync(f) && existsSync(`${f}/index.html`)) f = `${f}/index.html`;
		if (!existsSync(f) && existsSync(`${f}.html`)) f = `${f}.html`;
		return existsSync(f) && statSync(f).isFile()
			? new Response(Bun.file(f))
			: new Response('404', { status: 404 });
	},
});
const B = `http://localhost:${port}`;
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
for (const p of ['/', '/pt/', '/presskit/', '/pt/presskit/', '/privacy/']) await visit(p);
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
