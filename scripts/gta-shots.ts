/**
 * Before/after captures of the screens the visual refresh touches (menu, partner, shop, table).
 *   bun scripts/gta-shots.ts <outDir> [url] [en|pt-BR]
 * Prints the console errors it saw.
 */
import { mkdir } from 'node:fs/promises';
import { chromium, type Page } from 'playwright';

const outDir = process.argv[2] ?? 'docs/media/gta-after';
const base = process.argv[3] ?? 'http://localhost:5191';
const lang = process.argv[4] ?? 'en';
await mkdir(outDir, { recursive: true });
const b = await chromium.launch();
const errs: string[] = [];
const open = async (q: string, wait = 3500): Promise<Page> => {
	const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, locale: lang });
	p.on('pageerror', (e) => errs.push(e.message));
	p.on('console', (m) => {
		if (m.type() === 'error') errs.push(m.text());
	});
	await p.goto(`${base}/${q}`);
	await p.waitForTimeout(wait);
	return p;
};
const shot = async (p: Page, name: string): Promise<void> => {
	await p.screenshot({ path: `${outDir}/${name}-${lang}.png` });
	await p.close();
};
await shot(await open('?qa=1'), '01-menu');
await shot(await open('?run=1&seed=1&qa=1'), '02-partner');
const shop = await open('?run=1&seed=7&qa=1');
await shop.evaluate(`(() => { window.__GAME__.scene.keys.Run.choosePartner('cida'); })()`);
await shop.waitForTimeout(800);
await shop.evaluate(`(() => { const g = window.__GAME__; const r = g.scene.keys.Run.run;
	Object.assign(r, { phase: 'shop', money: 23, manhas: ['seuZe', 'peQuente', 'cangaceiro'] });
	r.shop = { offers: [ { kind: 'manha', id: 'malandro', price: 6, sold: false }, { kind: 'manha', id: 'zapZap', price: 7, sold: false },
		{ kind: 'consumable', item: { kind: 'lance', id: 'limpa' }, price: 3, sold: false } ],
		rerolls: 0 };
	g.scene.keys.Run.draw(); })()`);
await shop.waitForTimeout(900);
await shot(shop, '03-shop');
await shot(await open('?skipMenu=1&seed=1&vira=4c&hand=5h,6c,3d&goal=110&qa=1'), '04-table');
const play = await open('?skipMenu=1&seed=4&auto=1&speed=1&goal=110&qa=1', 3000);
await play.waitForTimeout(9000);
await shot(play, '05-table-playing');
console.log(JSON.stringify({ errs }));
await b.close();
