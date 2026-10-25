/**
 * Screenshots of the game screens for visual review (Playwright, headless Chromium).
 *   bun scripts/shot.ts --url http://localhost:5191 --out shots [--size 1280x720] [--dpr 3 --mobile] [screen…]
 * Screens: menu, settings, controls, table, eleven, iron, pause, signals, end. Needs `bun run dev` (dev builds
 * expose window.__GAME__). Prints "no console errors" when the run was clean.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const url = opt('url', 'http://localhost:5191');
const out = opt('out', 'shots');
const [w, h] = opt('size', '1280x720').split('x').map(Number) as [number, number];
const dpr = Number(opt('dpr', '1'));
const mobile = args.includes('--mobile');
const valued = ['--url', '--out', '--size', '--dpr'];
const screens = args.filter((a, i) => !a.startsWith('--') && !valued.includes(args[i - 1] ?? ''));
const want = screens.length ? screens : ['menu', 'settings', 'controls', 'table', 'pause'];

/** URL and the steps after load for each screen. */
const SCREENS: Record<string, { query: string; keys?: string[]; wait?: number }> = {
	menu: { query: '?seed=1' },
	settings: { query: '?seed=1', keys: ['ArrowUp', 'Enter'] },
	controls: {
		query: '?seed=1',
		keys: ['ArrowDown', 'Enter', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'Enter'],
	},
	table: { query: '?skipMenu=1&seed=3', wait: 2500 },
	eleven: { query: '?skipMenu=1&seed=3&score=11-4', wait: 2500 },
	iron: { query: '?skipMenu=1&seed=3&score=11-11', wait: 2500 },
	pause: { query: '?skipMenu=1&seed=3', keys: ['Escape'], wait: 2500 },
	signals: { query: '?skipMenu=1&seed=3', keys: ['KeyS'], wait: 2500 },
	end: { query: '?skipMenu=1&seed=1&auto=1&speed=4', wait: 30000 },
};

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
	headless: true,
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
	viewport: { width: w, height: h },
	deviceScaleFactor: dpr,
	isMobile: mobile,
	hasTouch: mobile,
});
const errors: string[] = [];
for (const name of want) {
	const s = SCREENS[name];
	if (!s) {
		console.log(`unknown screen ${name}`);
		continue;
	}
	const page = await context.newPage();
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(`${name}: ${m.text()}`);
	});
	page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
	await page.goto(`${url}/${s.query}`);
	await page.waitForFunction(
		() => (window as unknown as { __GAME__?: unknown }).__GAME__ !== undefined,
	);
	await page.waitForTimeout(s.wait ?? 2000);
	for (const k of s.keys ?? []) {
		await page.keyboard.press(k);
		await page.waitForTimeout(250);
	}
	await page.waitForTimeout(500);
	const file = `${out}/${name}-${w}x${h}.png`;
	await page.screenshot({ path: file });
	console.log(file);
	await page.close();
}
await browser.close();
if (errors.length) {
	for (const e of errors) console.log(e);
	process.exit(1);
}
console.log('no console errors');
