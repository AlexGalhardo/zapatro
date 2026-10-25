// Headless smoke test (Playwright): boots the game, checks the menu and (once the table exists)
// plays a match with the bot at 4x; fails on any console/page error or when the expected scene
// never shows. Needs `bun run dev` (or `vite preview`) running.
// Usage: bun scripts/smoke.ts [--url http://localhost:5173] [--seconds 40] [--shot out.png]
import { chromium } from 'playwright';

const arg = (name: string, fallback: string): string => {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
};
// Origin only: the smoke adds its own query (qa=1 exposes the game in production builds).
const base = arg('url', 'http://localhost:5173').replace(/\/?(\?.*)?$/, '');
const seconds = Number(arg('seconds', '40'));
const shot = arg('shot', '');

const browser = await chromium.launch({
	headless: true,
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`page: ${e.message}`));

interface Probe {
	scenes: string[];
	hasTable: boolean;
	table: unknown;
}
const probe = (): Promise<Probe | null> =>
	page.evaluate(() => {
		type SceneLike = {
			sys: { settings: { key: string }; isActive: () => boolean };
			probe?: () => unknown;
		};
		const g = (
			window as unknown as {
				__GAME__?: { scene: { scenes: SceneLike[]; keys: Record<string, SceneLike> } };
			}
		).__GAME__;
		if (!g) return null;
		const table = g.scene.keys.Table;
		return {
			scenes: g.scene.scenes.filter((s) => s.sys.isActive()).map((s) => s.sys.settings.key),
			hasTable: Boolean(table),
			table: table?.sys.isActive() ? (table.probe?.() ?? null) : null,
		};
	});

let failed = false;
// 1. Menu boots.
await page.goto(`${base}/?seed=1&qa=1`);
// CI runners take longer than a fixed sleep to get past Boot; wait for the scene instead.
for (let i = 0; i < 60 && !(await probe())?.scenes.includes('Menu'); i++)
	await page.waitForTimeout(500);
const menu = await probe();
console.log('menu:', JSON.stringify(menu));
if (!menu?.scenes.includes('Menu')) {
	console.log('FAIL: the menu did not open');
	failed = true;
}
// 2. A match with the bot, once the table exists (PLAN PA3).
if (menu?.hasTable) {
	await page.goto(`${base}/?skipMenu=1&seed=1&auto=1&speed=4&qa=1`);
	for (let t = 0; t < seconds; t += 5) {
		await page.waitForTimeout(5000);
		console.log(`t=${t + 5}s`, JSON.stringify(await probe()));
	}
}
if (shot) await page.screenshot({ path: shot });
await browser.close();
if (errors.length) {
	console.log(`FAIL: ${errors.length} error(s)`);
	for (const e of errors.slice(0, 20)) console.log(e);
	failed = true;
} else console.log('no console errors');
process.exit(failed ? 1 : 0);
