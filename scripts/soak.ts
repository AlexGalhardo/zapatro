/**
 * Short soak (PLAN RC1.2): the bot plays whole runs back to back (`?run=1&auto=1&speed=4`) in
 * several pages at once, each with its own seeds. Fails on any console/page error or when a page's
 * heap after its last run (after a forced GC) is more than 2 MB above its baseline: the 2nd run
 * when the page played 3 or more, else the 1st. The 1st run is warm-up (a run lost early has
 * drawn fewer textures) and the post-GC heap is ~11 MB, so a relative 10% gate (~1 MB) flagged
 * that warm-up as a leak; a real leak (the ~30 MB per run once feared) still fails at once.
 * One run takes ~5 min at 4×, so 30 runs over 6 pages take ~25 min.
 *   bun scripts/soak.ts --url http://localhost:5191 [--runs 30] [--pages 6] [--minutes 40]
 */
import { type Browser, chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const url = opt('url', 'http://localhost:5191');
const runs = Number(opt('runs', '30'));
const pages = Math.min(runs, Number(opt('pages', '6')));
const deadline = Date.now() + Number(opt('minutes', '40')) * 60_000;
const MAX_GROWTH_MB = 2;

type Game = {
	registry: { get(k: string): Record<string, unknown> };
	scene: {
		keys: Record<
			string,
			{
				run?: { phase: string; champ: number } | null;
				sys: { isActive(): boolean };
				scene: { restart(d: object): void };
			}
		>;
	};
};

const errors: string[] = [];

/** Plays `count` runs in one page; returns the heap (MB) after each. */
async function soak(browser: Browser, id: number, count: number): Promise<number[]> {
	const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
	page.on('console', (m) => m.type() === 'error' && errors.push(`[page ${id}] ${m.text()}`));
	page.on('pageerror', (e) => errors.push(`[page ${id}] ${e.message}`));
	const cdp = await page.context().newCDPSession(page);
	const heaps: number[] = [];
	await page.goto(`${url}/?run=1&auto=1&speed=4&seed=${id * 1000}&qa=1`);
	for (let n = 1; n <= count && Date.now() < deadline && errors.length === 0; n++) {
		const start = Date.now();
		await page.waitForFunction(
			() => {
				const run = (window as unknown as { __GAME__?: Game }).__GAME__?.scene.keys.Run;
				return Boolean(
					run?.sys.isActive() && (run.run?.phase === 'won' || run.run?.phase === 'lost'),
				);
			},
			undefined,
			{ timeout: Math.max(1000, deadline - Date.now()), polling: 1000 },
		);
		await cdp.send('HeapProfiler.collectGarbage');
		const { usedSize } = (await cdp.send('Runtime.getHeapUsage')) as { usedSize: number };
		heaps.push(usedSize / 1048576);
		const end = await page.evaluate(
			() => (window as unknown as { __GAME__: Game }).__GAME__.scene.keys.Run?.run,
		);
		console.log(
			`page ${id} run ${n}: ${end?.phase} at Championship ${end?.champ} · ${Math.round((Date.now() - start) / 1000)} s · heap ${heaps.at(-1)?.toFixed(1)} MB`,
		);
		// Next run with a new seed: clear the run and let the bot pick a partner again.
		await page.evaluate(
			(seed) => {
				const g = (window as unknown as { __GAME__: Game }).__GAME__;
				g.registry.get('save').run = null;
				g.registry.get('debugParams').seed = seed;
				g.scene.keys.Run?.scene.restart({ fresh: true });
			},
			id * 1000 + n,
		);
		// The restart is queued: wait for the new run to exist before waiting for its end.
		await page.waitForFunction(
			() => {
				const run = (window as unknown as { __GAME__: Game }).__GAME__.scene.keys.Run?.run;
				return Boolean(run && run.phase !== 'won' && run.phase !== 'lost');
			},
			undefined,
			{ timeout: 60_000, polling: 250 },
		);
	}
	await page.close();
	return heaps;
}

const browser = await chromium.launch({
	headless: true,
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const share = (i: number) => Math.floor(runs / pages) + (i < runs % pages ? 1 : 0);
const results = await Promise.all(
	Array.from({ length: pages }, (_, i) => soak(browser, i + 1, share(i))),
);
await browser.close();

let done = 0;
let worst = 0;
for (const heaps of results) {
	done += heaps.length;
	const base = heaps[heaps.length >= 3 ? 1 : 0];
	const last = heaps.at(-1);
	if (base !== undefined && last !== undefined) worst = Math.max(worst, last - base);
}
console.log(
	`${done}/${runs} runs · worst heap growth ${worst.toFixed(1)} MB (limit ${MAX_GROWTH_MB}) · ${errors.length} errors`,
);
for (const e of errors.slice(0, 5)) console.log(`  ${e}`);
if (errors.length || done < runs || worst > MAX_GROWTH_MB) process.exit(1);
