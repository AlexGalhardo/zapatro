/**
 * Cross-browser smoke QA of the production build (Chrome, Edge, Firefox via Playwright).
 * Needs `bun run build` + `bunx --bun vite preview --port 4173` running, Chrome/Edge installed and
 * Playwright's Firefox (`bunx playwright install firefox`, once).
 * Usage: bun scripts/qa-browsers.ts [baseUrl=http://localhost:4173] [outDir=<tmp>]
 * Prints one JSON line per browser: load time, no-scroll, WebGL, FPS at the table, errors, 4xx/5xx.
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Browser, chromium, firefox } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173';
const outDir = process.argv[3] ?? tmpdir();
const targets: [string, () => Promise<Browser>][] = [
	['chrome', () => chromium.launch({ channel: 'chrome' })],
	['edge', () => chromium.launch({ channel: 'msedge' })],
	['firefox', () => firefox.launch()],
];

for (const [name, launch] of targets) {
	const browser = await launch();
	const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
	const errors: string[] = [];
	const failed: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(m.text());
	});
	page.on('response', (r) => {
		if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
	});
	const t0 = Date.now();
	await page.goto(base, { waitUntil: 'load' });
	await page.waitForFunction(() => document.querySelector('canvas') !== null);
	const loadMs = Date.now() - t0;
	await page.waitForTimeout(2500);
	const menu = await page.evaluate(() => {
		const canvas = document.querySelector('canvas') as HTMLCanvasElement;
		const root = document.documentElement;
		return {
			noScroll: root.scrollWidth <= innerWidth && root.scrollHeight <= innerHeight,
			webgl: Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl')),
			devHandle: '__GAME__' in window,
		};
	});
	await page.screenshot({ path: join(outDir, `qa-${name}-menu.png`) });
	// Unlock audio on an empty corner, then Menu → New run → the table.
	await page.mouse.click(8, 8);
	await page.keyboard.press('Enter');
	await page.waitForTimeout(4000);
	const fps = await page.evaluate(async () => {
		const t: number[] = [];
		await new Promise<void>((done) => {
			const step = (now: number) => {
				t.push(now);
				if (t.length < 300) requestAnimationFrame(step);
				else done();
			};
			requestAnimationFrame(step);
		});
		const span = (t[t.length - 1] ?? 0) - (t[0] ?? 0);
		return Number((1000 / (span / (t.length - 1))).toFixed(1));
	});
	await page.screenshot({ path: join(outDir, `qa-${name}-game.png`) });
	console.log(
		JSON.stringify({
			browser: name,
			version: browser.version(),
			loadMs,
			...menu,
			fps,
			errors,
			failed,
		}),
	);
	await browser.close();
}

// Resolutions (PLAN 7.1): full-window canvas, no scroll, from 1366×768 to 4K, ultrawide and Retina.
const RESOLUTIONS: [string, number, number, number][] = [
	['1366x768', 1366, 768, 1],
	['1920x1080', 1920, 1080, 1],
	['2560x1080-ultrawide', 2560, 1080, 1],
	['2560x1440', 2560, 1440, 1],
	['3840x2160', 3840, 2160, 1],
	['1440x900-retina', 1440, 900, 2],
];
const shell = await chromium.launch();
for (const [label, width, height, dpr] of RESOLUTIONS) {
	const page = await shell.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, { waitUntil: 'load' });
	await page.waitForFunction(() => document.querySelector('canvas') !== null);
	await page.waitForTimeout(1500);
	const layout = await page.evaluate(() => {
		const canvas = document.querySelector('canvas') as HTMLCanvasElement;
		const rect = canvas.getBoundingClientRect();
		const root = document.documentElement;
		return {
			noScroll: root.scrollWidth <= innerWidth && root.scrollHeight <= innerHeight,
			fillsWindow:
				Math.abs(rect.width - innerWidth) <= 1 && Math.abs(rect.height - innerHeight) <= 1,
			backing: `${canvas.width}x${canvas.height}`,
		};
	});
	await page.screenshot({ path: join(outDir, `qa-res-${label}.png`) });
	console.log(JSON.stringify({ resolution: label, dpr, ...layout, errors }));
	await page.close();
}
await shell.close();
