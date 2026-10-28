/**
 * The six 1920×1080 store screenshots (Steam, Google Play, itch.io) in EN and PT-BR, from the
 * production build: `bun run build && bunx --bun vite preview --port 4173`, then
 *   bun scripts/store-shots.ts [url] [en|pt-BR]
 * Writes docs/media/store-shot-0N-<name>-<lang>.png (truco call, count, shop, partner, boss rule,
 * Almanac). Prints the console errors it saw.
 */
import { chromium, type Page } from 'playwright';
import { MANHAS as ALL } from '../src/data/manhas';

const SEEN = ALL.slice(0, 40).map((m) => `manha:${m.id}`);
const base = process.argv[2] ?? 'http://localhost:4173';
const lang = process.argv[3] ?? 'en';
const out = (n: string) => `docs/media/store-shot-${n}-${lang}.png`;
const b = await chromium.launch();
const errs: string[] = [];
const page = async (q: string): Promise<Page> => {
	const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, locale: lang });
	p.on('pageerror', (e) => errs.push(e.message));
	p.on('console', (m) => {
		if (m.type() === 'error') errs.push(m.text());
	});
	await p.goto(`${base}/${q}`);
	await p.waitForTimeout(3000);
	return p;
};
const until = async (p: Page, js: string, ms = 90000) => {
	for (let t = 0; t < ms; t += 100) {
		if (await p.evaluate(js).catch(() => false)) return true;
		await p.waitForTimeout(100);
	}
	return false;
};
const MANHAS = 'peQuente,reviravolta,cangaceiro';
// 01 truco call on the table
let p = await page(`?skipMenu=1&seed=4&auto=1&speed=1&goal=110&manhas=${MANHAS}&qa=1`);
await until(
	p,
	'(() => { const t = window.__GAME__.scene.keys.Table; return (t.match.state.pending?.to ?? 0) > 0 && t.banner.visible && t.banner.alpha > 0.9; })()',
);
await p.waitForTimeout(250);
await p.screenshot({ path: out('01-truco') });
// 02 the count
await until(
	p,
	'(() => { const t = window.__GAME__.scene.keys.Table; return Boolean(t.scoreBox?.visible) && t.scoreTotal?.text !== ""; })()',
);
await p.waitForTimeout(150);
await p.screenshot({ path: out('02-count') });
await p.close();
// 03 shop
p = await page('?run=1&seed=7&qa=1');
await p.evaluate(
	`(() => { const g = window.__GAME__; g.scene.keys.Run.choosePartner('cida'); })()`,
);
await p.waitForTimeout(800);
await p.evaluate(`(() => { const g = window.__GAME__; const r = g.scene.keys.Run.run;
	Object.assign(r, { phase: 'shop', money: 23, manhas: ['seuZe', 'peQuente', 'cangaceiro'] });
	r.shop = { offers: [ { kind: 'manha', id: 'malandro', price: 6, sold: false }, { kind: 'manha', id: 'zapZap', price: 7, sold: false },
		{ kind: 'consumable', item: { kind: 'lance', id: 'limpa' }, price: 3, sold: false } ],
		packs: [{ kind: 'pack', pack: 'baralho', price: 4, sold: false }], upgrade: null, rerolls: 0, opened: null };
	g.scene.keys.Run.draw(); })()`);
await p.waitForTimeout(800);
await p.screenshot({ path: out('03-shop') });
await p.close();
// 04 partner choice
p = await page('?run=1&seed=1&qa=1');
await p.screenshot({ path: out('04-partner') });
await p.close();
// 05 boss table with its rule
p = await page('?skipMenu=1&seed=3&boss=stuart&qa=1');
await p.screenshot({ path: out('05-boss') });
await p.close();
// 06 Almanac (Bosses tab)
p = await page('?seed=1&qa=1');
await p.evaluate(`(() => { const g = window.__GAME__; const m = g.registry.get('save').meta;
	for (const id of ${JSON.stringify(SEEN)}) if (!m.seen.includes(id)) m.seen.push(id); g.scene.getScenes(true).filter((s) => s.scene.key !== 'Boot').forEach((s) => s.scene.stop()); g.scene.start('Almanac'); })()`);
await p.waitForTimeout(800);
await p.waitForTimeout(400);
await p.screenshot({ path: out('06-almanac') });
await p.close();
console.log(JSON.stringify({ errs }));
await b.close();
