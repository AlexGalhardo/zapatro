/**
 * Before/after captures of the screens the visual refresh touches (menu, partner, shop, table).
 *   bun scripts/gta-shots.ts [outDir] [url] [en|pt-BR]
 * outDir defaults to <os temp>/zapatro-gta-shots. Each capture waits for its scene and state; the
 * shop is a real run (the first table won through the run logic). Exits 1 on a missing screen or
 * a console error.
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
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

const dir = outDir(process.argv[2] || join(tmpdir(), 'zapatro-gta-shots'));
const base = process.argv[3] ?? 'http://localhost:5191';
const lang = process.argv[4] ?? 'en';
const humanTurn =
	'(game, scene) => scene.match !== undefined && !scene.busy && scene.match.actor() === 0 && scene.turnArrow.visible';

const report = newReport();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: lang });
const shots = [
	{ name: '01-menu', q: '?', scene: 'Menu' },
	{ name: '02-partner', q: '?run=1&seed=1&mode=2v2', scene: 'Run' },
	{ name: '03-shop', q: '?run=1&seed=7', scene: 'Run' },
	{
		name: '04-table',
		q: '?skipMenu=1&seed=1&vira=4c&hand=5h,6c,3d&goal=110',
		scene: 'Table',
		until: humanTurn,
	},
	{
		name: '05-table-playing',
		q: '?skipMenu=1&seed=4&auto=1&speed=1&goal=110',
		scene: 'Table',
		until: '(game, scene) => scene.match !== undefined && scene.match.state.tricks.length > 0 && scene.match.state.tricks[0].plays.length > 1',
	},
];
for (const s of shots) {
	await capture(report, s.name, async () => {
		const page = await openPage(context, report, s.name, `${base}/${s.q}&qa=1`);
		try {
			if (s.name === '03-shop') await showShop(page, shopRun(7));
			else
				await waitForScene(page, s.scene, {
					...(s.until ? { until: s.until } : {}),
					what: s.name,
				});
			await waitForPaintings(page);
			const file = join(dir, `${s.name}-${lang}.png`);
			await page.screenshot({ path: file });
			return file;
		} finally {
			await page.close();
		}
	});
}
await browser.close();
for (const e of report.errors) console.log(e);
finish(report, shots.length);
