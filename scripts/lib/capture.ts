/**
 * Shared bits of the capture scripts (shot.ts, gta-shots.ts, store-shots.ts): open a page that
 * collects console errors, wait for a scene (and optionally a game state) instead of a fixed time,
 * and report one PASS/FAIL line per named capture with a non-zero exit when any failed.
 * The game must expose `window.__GAME__` (`?qa=1` in a production build; dev builds always do).
 */
import { mkdirSync } from 'node:fs';
import type { BrowserContext, Page } from 'playwright';
import type { CompanionId } from '../../src/data/companions';
import { finishTable, newRun, type RunState, startTable } from '../../src/logic/run/run';

export interface Report {
	/** Console and page errors, each prefixed with the page label. */
	errors: string[];
	failures: string[];
}

export const newReport = (): Report => ({ errors: [], failures: [] });

/** Output folder (created); defaults to a folder in the OS temp dir so committed images stay put. */
export const outDir = (dir: string): string => {
	mkdirSync(dir, { recursive: true });
	return dir;
};

/**
 * Opens `url` in a fresh page of `context` whose console errors land in `report.errors` under
 * `label`. Share one context across captures: the 500-odd late files then come from the cache.
 */
export async function openPage(
	context: BrowserContext,
	report: Report,
	label: string,
	url: string,
): Promise<Page> {
	const page = await context.newPage();
	page.on('console', (m) => {
		if (m.type() === 'error') report.errors.push(`${label}: ${m.text()}`);
	});
	page.on('pageerror', (e) => report.errors.push(`${label}: ${e.message}`));
	await page.goto(url);
	return page;
}

interface Snapshot {
	active: string[];
	ok: boolean;
}

/**
 * Waits until `scene` is active and, when given, `until` (a JS function source `(game, scene) =>
 * boolean`, run in the page) holds. On timeout throws naming the scenes that were active, so an
 * extra choice screen in front of the expected one is reported instead of photographed.
 */
export async function waitForScene(
	page: Page,
	scene: string,
	opts: { until?: string; what?: string; ms?: number } = {},
): Promise<void> {
	const { until = '', what = '', ms = 60_000 } = opts;
	const end = Date.now() + ms;
	let last: Snapshot = { active: [], ok: false };
	while (Date.now() < end) {
		last = await page
			.evaluate(
				([key, cond]): Snapshot => {
					type Sc = { sys: { isActive(): boolean; settings: { key: string } } };
					const g = (
						window as unknown as {
							__GAME__?: {
								scene: {
									scenes: Sc[];
									keys: Record<string, Sc>;
									isActive(k: string): boolean;
								};
							};
						}
					).__GAME__;
					if (!g) return { active: ['(no __GAME__)'], ok: false };
					const active = g.scene.scenes
						.filter((s) => s.sys.isActive())
						.map((s) => s.sys.settings.key);
					const target = g.scene.keys[key as string];
					if (!target || !g.scene.isActive(key as string)) return { active, ok: false };
					if (!cond) return { active, ok: true };
					try {
						return {
							active,
							ok: Boolean(
								new Function('game', 'scene', `return (${cond})(game, scene);`)(
									g,
									target,
								),
							),
						};
					} catch {
						return { active, ok: false };
					}
				},
				[scene, until] as const,
			)
			.catch(() => last);
		if (last.ok) return;
		await page.waitForTimeout(100);
	}
	throw new Error(
		`expected scene ${scene}${what ? ` (${what})` : ''}, active scenes: [${last.active.join(', ')}]`,
	);
}

/**
 * Waits until the Boot loader finished the late files (paintings, backs, extra faces), then a beat
 * for `registerPortraits` to swap the drawn fallbacks.
 */
export async function waitForPaintings(page: Page, ms = 900_000): Promise<void> {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		const idle = await page.evaluate(() => {
			const g = (
				window as unknown as {
					__GAME__?: { scene: { keys: { Boot?: { load: { isLoading(): boolean } } } } };
				}
			).__GAME__;
			const boot = g?.scene.keys.Boot;
			return boot !== undefined && !boot.load.isLoading();
		});
		if (idle) {
			await page.waitForTimeout(400);
			return;
		}
		await page.waitForTimeout(150);
	}
	throw new Error('the late-loaded paintings did not arrive');
}

/**
 * Runs one named capture: `fn` returns the path it wrote. Prints `PASS name path`, or `FAIL name:
 * reason` when it throws or the page logged a console error meanwhile.
 */
export async function capture(
	report: Report,
	name: string,
	fn: () => Promise<string>,
): Promise<void> {
	const before = report.errors.length;
	try {
		const path = await fn();
		const errs = report.errors.slice(before);
		if (errs.length) throw new Error(`console error: ${errs[0]}`);
		console.log(`PASS ${name} ${path}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		report.failures.push(name);
		console.log(`FAIL ${name}: ${msg}`);
	}
}

/** Prints the summary and exits non-zero when any capture failed. */
export function finish(report: Report, total: number): never {
	if (report.failures.length) {
		console.log(
			`${report.failures.length}/${total} capture(s) failed: ${report.failures.join(', ')}`,
		);
		process.exit(1);
	}
	console.log(`${total} capture(s) ok, no console errors`);
	process.exit(0);
}

/**
 * A run in its first shop, built by the game's own run logic (win the first table of a new run),
 * so the offers follow whatever the shop sells today. Hand it to the Run scene with `showShop`.
 */
export function shopRun(seed: number, partner: CompanionId = 'cida'): RunState {
	const run = newRun(seed, partner);
	startTable(run);
	finishTable(run, { won: true, rivalTentos: 3, money: 0, hands: 6, bestHand: 120 });
	if (run.phase !== 'shop' || !run.shop?.offers.length)
		throw new Error(`the run logic did not open a shop (phase ${run.phase})`);
	return run;
}

/** Puts `run` into the active Run scene and redraws it; waits until the shop is on screen. */
export async function showShop(page: Page, run: RunState, ms?: number): Promise<void> {
	await waitForScene(page, 'Run', { what: 'partner choice, before the shop', ms });
	await page.evaluate((r) => {
		const g = (
			window as unknown as {
				__GAME__: { scene: { keys: { Run: { run: unknown; draw(): void } } } };
			}
		).__GAME__;
		g.scene.keys.Run.run = r;
		g.scene.keys.Run.draw();
	}, run);
	await waitForScene(page, 'Run', {
		what: 'the shop',
		until: '(game, scene) => scene.run?.phase === "shop" && scene.run.shop.offers.length > 0',
		ms,
	});
	await page.waitForTimeout(600);
}
