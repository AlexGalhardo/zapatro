/**
 * The six 1920×1080 store screenshots (Steam, Google Play, itch.io) in EN and PT-BR, from the
 * production build: `bun run build && bunx --bun vite preview --port 4173`, then
 *   bun scripts/store-shots.ts [url] [en|pt-BR] [outDir]
 * Writes store-shot-0N-<name>-<lang>.png (truco call, count, shop, partner, boss rule, Almanac) to
 * outDir, which defaults to <os temp>/zapatro-store-shots: copy to docs/media/ by hand once the art
 * is final. Each shot waits for its scene and state (the shop is a real run: the first table won
 * through the run logic); exits 1 on a missing screen or a console error.
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { MANHAS as ALL } from '../src/data/manhas';
import {
	capture,
	finish,
	newReport,
	openPage,
	outDir,
	shopRun,
	showShop,
	waitForPaintings,
	waitForScene,
} from './lib/capture';

const SEEN = ALL.slice(0, 40).map((m) => `manha:${m.id}`);
const base = process.argv[2] ?? 'http://localhost:4173';
const lang = process.argv[3] ?? 'en';
const dir = outDir(process.argv[4] ?? join(tmpdir(), 'zapatro-store-shots'));
const file = (n: string): string => join(dir, `store-shot-${n}-${lang}.png`);
const MANHAS = 'peQuente,reviravolta,cangaceiro';

const report = newReport();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: lang });

const shoot = (name: string, query: string, steps: (p: Page) => Promise<void>): Promise<void> =>
	capture(report, name, async () => {
		const p = await openPage(context, report, name, `${base}/${query}&qa=1`);
		try {
			await steps(p);
			await waitForPaintings(p);
			const path = file(name);
			await p.screenshot({ path });
			return path;
		} finally {
			await p.close();
		}
	});

// 01 truco call on the table: the bot's call is pending and the banner is up
await shoot(
	'01-truco',
	`?skipMenu=1&seed=4&auto=1&speed=1&goal=110&manhas=${MANHAS}`,
	async (p) => {
		await waitForScene(p, 'Table', {
			what: 'truco call',
			until: '(game, scene) => scene.match !== undefined && (scene.match.state.pending?.to ?? 0) > 0 && scene.banner.visible && scene.banner.alpha > 0.9',
			ms: 120_000,
		});
		await p.waitForTimeout(250);
	},
);
// 02 the count popup
await shoot(
	'02-count',
	`?skipMenu=1&seed=4&auto=1&speed=1&goal=110&manhas=${MANHAS}`,
	async (p) => {
		await waitForScene(p, 'Table', {
			what: 'the count',
			until: '(game, scene) => scene.match !== undefined && Boolean(scene.scoreBox?.visible) && scene.scoreTotal?.text !== ""',
			ms: 120_000,
		});
		await p.waitForTimeout(150);
	},
);
// 03 the shop, with the trinket offers on the chalkboard
await shoot('03-shop', '?run=1&seed=7', (p) => showShop(p, shopRun(7)));
// 04 partner choice
await shoot('04-partner', '?run=1&seed=1', (p) =>
	waitForScene(p, 'Run', {
		what: 'partner choice',
		until: '(game, scene) => scene.run === null || scene.run === undefined',
	}),
);
// 05 boss table with its rule
await shoot('05-boss', '?skipMenu=1&seed=3&boss=stuart', (p) =>
	waitForScene(p, 'Table', {
		what: 'boss table',
		until: '(game, scene) => scene.match !== undefined && scene.match.boss === "stuart"',
	}),
);
// 06 Almanac (Bosses tab)
await shoot('06-almanac', '?seed=1', async (p) => {
	await waitForScene(p, 'Menu', { what: 'menu before the Almanac' });
	await p.evaluate((seen) => {
		const g = (
			window as unknown as {
				__GAME__: {
					registry: { get(k: string): { meta: { seen: string[] } } };
					scene: {
						start(k: string): void;
						getScenes(active: boolean): { scene: { key: string; stop(): void } }[];
					};
				};
			}
		).__GAME__;
		const m = g.registry.get('save').meta;
		for (const id of seen) if (!m.seen.includes(id)) m.seen.push(id);
		for (const s of g.scene.getScenes(true)) if (s.scene.key !== 'Boot') s.scene.stop();
		g.scene.start('Almanac');
	}, SEEN);
	await waitForScene(p, 'Almanac', { what: 'Almanac' });
	await p.waitForTimeout(800);
});
await browser.close();
for (const e of report.errors) console.log(e);
finish(report, 6);
