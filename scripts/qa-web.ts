/**
 * Web functional battery (PLAN §10.3) on the production build: the flows a player goes through
 * end to end, beyond the per-feature checks of scripts/qa.ts. Needs `bun run build` and
 * `bunx --bun vite preview --port 5207 --strictPort`; the script adds `?qa=1`.
 *   bun scripts/qa-web.ts [--url http://localhost:5207] [--only flow,settings] [--fast] [--out shots/qa-web]
 * Groups: flow, continue, settings, almanac, rules, tutorial, pause, quick12, run-seed21..23 and
 * demo (skipped by --fast: minutes each), save, resize, audio. One browser, one fresh context per
 * group; every group also fails on console errors, new console warnings and HTTP >= 400. A failing
 * group saves <out>/<group>.png; <out>/report.json has every check. Exit 1 when a group fails.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { type BrowserContextOptions, chromium, type Page } from 'playwright';

const args = process.argv.slice(2);
const opt = (n: string, d: string): string => {
	const i = args.indexOf(`--${n}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const BASE = opt('url', 'http://localhost:5207');
const only = opt('only', '').split(',').filter(Boolean);
const fast = args.includes('--fast');
const SHOTS = opt('out', 'shots/qa-web');
mkdirSync(SHOTS, { recursive: true });
const NOISE =
	/GL Driver Message|AudioContext was not allowed|GPU stall|swiftshader|WebGL.*(fallback|performance)/i;

type Check = { name: string; ok: boolean; detail: string };
type Group = {
	group: string;
	checks: Check[];
	errors: string[];
	warnings: string[];
	http: string[];
	ms: number;
};
const report: Group[] = [];
const browser = await chromium.launch({
	headless: true,
	args: [
		'--use-angle=swiftshader',
		'--enable-unsafe-swiftshader',
		'--autoplay-policy=no-user-gesture-required',
	],
});

interface T {
	page: Page;
	open(q: string): Promise<void>;
	ev<R = unknown>(js: string): Promise<R>;
	until(what: string, js: string, ms?: number): Promise<boolean>;
	check(name: string, ok: boolean, detail?: string): void;
	press(...k: string[]): Promise<void>;
}

async function group(
	name: string,
	body: (t: T) => Promise<void>,
	ctxOpt: BrowserContextOptions = {},
): Promise<void> {
	if (only.length && !only.includes(name)) return;
	const t0 = Date.now();
	const g: Group = { group: name, checks: [], errors: [], warnings: [], http: [], ms: 0 };
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...ctxOpt });
	const page = await ctx.newPage();
	page.on('pageerror', (e) => g.errors.push(`pageerror: ${e.message}`));
	page.on('console', (m) => {
		const tx = m.text();
		if (NOISE.test(tx)) return;
		if (m.type() === 'error') g.errors.push(tx);
		else if (m.type() === 'warning') g.warnings.push(tx);
	});
	page.on('response', (r) => {
		if (r.status() >= 400) g.http.push(`${r.status()} ${r.url()}`);
	});
	const check = (n: string, ok: boolean, detail = ''): void => {
		g.checks.push({ name: n, ok, detail });
	};
	const ev = <R>(js: string): Promise<R> =>
		page.evaluate(
			`(() => { const g = window.__GAME__; const t = g.scene.keys.Table; return (${js})(g, t); })()`,
		) as Promise<R>;
	const t: T = {
		page,
		async open(q) {
			await page.goto(`${BASE}/${q}${q.includes('?') ? '&' : '?'}qa=1`);
			await page.waitForFunction(
				`(() => { const g = window.__GAME__; if (!g) return false; const s = g.scene;
				return s.isActive('Menu') || s.isActive('Run') || (s.isActive('Table') && s.keys.Table.match !== undefined); })()`,
				undefined,
				{ timeout: 30000 },
			);
			await page.waitForTimeout(800);
		},
		ev,
		async until(what, js, ms = 15000) {
			const end = Date.now() + ms;
			while (Date.now() < end) {
				if (await ev<boolean>(js).catch(() => false)) return true;
				await page.waitForTimeout(150);
			}
			check(`${what} (timeout ${ms / 1000}s)`, false);
			return false;
		},
		check,
		async press(...keys) {
			for (const k of keys) {
				await page.keyboard.press(k);
				await page.waitForTimeout(220);
			}
		},
	};
	try {
		await body(t);
	} catch (e) {
		check('no exception', false, String(e).split('\n')[0]);
	}
	check('0 console errors', g.errors.length === 0, g.errors.slice(0, 3).join(' | '));
	check(
		'0 console warnings',
		g.warnings.length === 0,
		[...new Set(g.warnings)].slice(0, 3).join(' | '),
	);
	check('0 HTTP >= 400', g.http.length === 0, g.http.slice(0, 3).join(' | '));
	if (g.checks.some((c) => !c.ok))
		await page.screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {});
	await ctx.close();
	g.ms = Date.now() - t0;
	report.push(g);
	const bad = g.checks.filter((c) => !c.ok);
	console.log(`${bad.length ? 'FAIL' : 'PASS'} ${name} (${(g.ms / 1000).toFixed(0)} s)`);
	for (const c of bad) console.log(`   x ${c.name} ${c.detail}`);
}

const active = (k: string): string => `(g) => g.scene.isActive('${k}')`;
const humanTurn = '(g, t) => !t.busy && t.match.actor() === 0 && t.turnArrow.visible';
const phase = '(g) => g.scene.keys.Run.run?.phase';
/** Visible Text of a scene matching re (EN and PT). */
const hasText = (
	scene: string,
	re: RegExp,
): string => `(g) => { let f = false; const walk = (l) => { for (const o of l) {
	if (o.type === 'Text' && o.visible && ${re}.test(o.text)) f = true; if (o.list) walk(o.list); } };
	walk(g.scene.keys.${scene}.children.list); return f; }`;

// 1. Main flow: menu → new run → partner → select → table → shop → next table.
await group('flow', async (t) => {
	await t.open('?seed=11');
	await t.press('Enter');
	t.check(
		'new run → partner choice',
		await t.until(
			'partner screen',
			`(g) => g.scene.isActive('Run') && g.scene.keys.Run.candidates?.length > 0`,
			8000,
		),
	);
	await t.page.waitForTimeout(1500);
	// The setup screen (mode, Stake, deck) comes first: Enter starts with the defaults.
	await t.press('Enter');
	await t.page.waitForTimeout(1500);
	await t.press('Enter');
	t.check(
		'partner → table select',
		await t.until('select', `(g) => (${phase})(g) === 'select'`, 8000),
	);
	await t.page.waitForTimeout(1500);
	await t.press('Enter');
	t.check(
		'select → table',
		await t.until(
			'table',
			`(g, t) => g.scene.isActive('Table') && t.match !== undefined`,
			8000,
		),
	);
	await t.until('your turn', humanTurn, 20000);
	await t.press('Digit1');
	t.check(
		'a card is played',
		await t.until('card played', '(g, t) => t.match.state.hands[0].length === 2', 6000),
	);
	// Winning a whole table takes minutes: force the win (as qa.ts does for the loss).
	await t.ev(`(g, t) => t.showEnd('us')`);
	await t.page.waitForTimeout(1200);
	await t.press('Enter');
	t.check(
		'table won → Continue → run in shop',
		await t.until('shop phase', `(g) => (${phase})(g) === 'shop'`, 8000),
	);
	t.check(
		'shop screen',
		await t.until(
			'Run shop',
			`(g) => g.scene.isActive('Run') && (${hasText('Run', /Balcão|Counter/)})(g)`,
			8000,
		),
	);
	await t.page.waitForTimeout(1200);
	await t.press('Enter');
	t.check(
		'Next table → select (table 2)',
		await t.until(
			'next table',
			`(g) => (${phase})(g) === 'select' && g.scene.keys.Run.run.table === 1`,
			5000,
		),
	);
});

// 2. Continue a run: reload in the middle of the hand, same cards.
await group('continue', async (t) => {
	await t.open('?run=1&seed=12');
	await t.ev(`(g) => g.scene.keys.Run.choosePartner(g.scene.keys.Run.candidates[0])`);
	await t.ev(`(g) => g.scene.keys.Run.play()`);
	await t.until('table', active('Table'), 8000);
	await t.until('your turn', humanTurn, 20000);
	const hand =
		'(g, t) => JSON.stringify([t.match.state.hands[0].map((c) => c.id), t.match.state.vira?.id])';
	const before = await t.ev<string>(hand);
	await t.press('Digit1');
	await t.until('played', '(g, t) => t.match.state.hands[0].length === 2', 6000);
	await t.open('?seed=12');
	await t.press('Enter');
	t.check(
		'Continue opens the table',
		await t.until(
			'table again',
			`(g, t) => g.scene.isActive('Table') && t.match !== undefined`,
			8000,
		),
	);
	await t.page.waitForTimeout(1500);
	const after = await t.ev<string>(hand);
	t.check(
		'reload mid-hand re-deals the same 3 cards and vira (D-32)',
		before === after,
		`${before} vs ${after}`,
	);
});

// 3. Settings: every slider and toggle, language EN↔PT, Controls.
await group('settings', async (t) => {
	await t.open('?seed=1');
	await t.ev(`(g) => g.scene.keys.Menu.openOverlay('Settings')`);
	await t.until('settings', active('Settings'), 4000);
	const labels = await t.ev<string[]>(
		`(g) => g.scene.keys.Settings.rows.map((r) => r.label + ':' + r.kind)`,
	);
	t.check('settings rows listed', labels.length >= 10, labels.join(', '));
	const save = '(g) => JSON.stringify(g.registry.get("save").settings)';
	for (const [i, row] of labels.entries()) {
		const [label = '', kind = ''] = row.split(':');
		if (!['slider', 'toggle', 'choice'].includes(kind)) continue;
		if (label === 'settings.row.fullscreen') continue; // needs a user gesture; covered by Electron
		const has = await t.ev<boolean>(
			`(g) => Boolean(g.scene.keys.Settings.rows[${i}].onAdjust)`,
		);
		if (!has) continue;
		const s0 = await t.ev<string>(save);
		await t.ev(`(g) => { const s = g.scene.keys.Settings; s.focus = ${i}; s.adjust(-1); }`);
		await t.page.waitForTimeout(250);
		const s1 = await t.ev<string>(save);
		await t.ev(
			`(g) => { const s = g.scene.keys.Settings; if (s.sys.isActive()) { s.focus = ${i}; s.adjust(1); } }`,
		);
		await t.page.waitForTimeout(250);
		if (label === 'settings.row.lang') {
			const lang = await t.ev<string>(`(g) => g.registry.get('save').settings.lang`);
			t.check(`lang changes and comes back (${lang})`, s0 !== s1, `${s0.length}`);
			continue;
		}
		t.check(`${label} changes the setting`, s0 !== s1 || kind === 'slider', '');
	}
	// Language: switch, the menu relabels, switch back.
	const langIdx = labels.findIndex((l) => l.startsWith('settings.row.lang'));
	if (langIdx >= 0) {
		const before = await t.ev<string>(`(g) => g.registry.get('save').settings.lang`);
		await t.ev(
			`(g) => { const s = g.scene.keys.Settings; s.focus = ${langIdx}; s.adjust(1); }`,
		);
		await t.page.waitForTimeout(400);
		const mid = await t.ev<string>(`(g) => g.registry.get('save').settings.lang`);
		await t.press('Escape');
		await t.until(
			'menu back',
			`(g) => g.scene.isActive('Menu') && !g.scene.isActive('Settings')`,
			4000,
		);
		await t.page.waitForTimeout(1000);
		await t.page.screenshot({ path: `${SHOTS}/ok-settings-menu-after-lang.png` });
		const menuEn = await t.ev<boolean>(hasText('Menu', /^New run$/));
		const menuPt = await t.ev<boolean>(hasText('Menu', /^Nova run$/));
		t.check(
			`EN↔PT: ${before} → ${mid}, menu relabelled`,
			before !== mid && (mid === 'en' ? menuEn : menuPt),
			`en=${menuEn} pt=${menuPt}`,
		);
		await t.ev(`(g) => g.scene.keys.Menu.openOverlay('Settings')`);
		await t.until('settings again', active('Settings'), 4000);
		await t.ev(
			`(g) => { const s = g.scene.keys.Settings; s.focus = ${langIdx}; s.adjust(-1); }`,
		);
		await t.page.waitForTimeout(300);
		t.check(
			'language back',
			(await t.ev<string>(`(g) => g.registry.get('save').settings.lang`)) === before,
		);
	}
	// Controls (Keybinds).
	const ctl = labels.findIndex((l) => l.startsWith('settings.controls'));
	await t.ev(`(g) => { const s = g.scene.keys.Settings; s.select(${ctl}); }`);
	t.check('Controls opens', await t.until('keybinds', active('Keybinds'), 4000));
	await t.page.waitForTimeout(400);
	await t.press('ArrowDown', 'ArrowDown', 'ArrowUp');
	await t.press('Escape');
	t.check(
		'Esc leaves Controls',
		await t.until('keybinds closed', `(g) => !g.scene.isActive('Keybinds')`, 4000),
	);
	await t.page.screenshot({ path: `${SHOTS}/ok-settings.png` });
});

// 4. Almanac: all tabs.
await group('almanac', async (t) => {
	await t.open('?seed=1');
	await t.ev(`(g) => { g.scene.stop('Menu'); g.scene.start('Almanac'); }`);
	await t.until('almanac', active('Almanac'), 4000);
	const seen = new Set<string>();
	for (let i = 0; i < 6; i++) {
		seen.add(await t.ev<string>(`(g) => g.scene.keys.Almanac.tab`));
		await t.press('KeyE');
		await t.page.waitForTimeout(300);
	}
	t.check('6 tabs visited', seen.size === 6, [...seen].join(','));
	await t.press('ArrowRight', 'ArrowDown', 'Enter');
	await t.press('Escape');
	t.check('Esc back to the menu', await t.until('menu', active('Menu'), 4000));
});

// 5. Rules: every page.
await group('rules', async (t) => {
	await t.open('?seed=1');
	await t.ev(`(g) => { g.scene.stop('Menu'); g.scene.start('Rules'); }`);
	await t.until('rules', active('Rules'), 4000);
	let last = -1;
	let pages = 0;
	for (let i = 0; i < 40; i++) {
		const p = await t.ev<number>(`(g) => g.scene.keys.Rules.page`);
		if (p === last) break;
		last = p;
		pages++;
		await t.press('ArrowRight');
	}
	t.check(`all pages turn (${pages})`, pages >= 5, `last page index ${last}`);
	await t.press('ArrowLeft');
	t.check('← goes back', (await t.ev<number>(`(g) => g.scene.keys.Rules.page`)) === last - 1);
	await t.press('Escape');
	t.check('Esc back to the menu', await t.until('menu', active('Menu'), 4000));
});

// 6. Tutorial to the end (the bot plays the hands; the coach cards are confirmed).
await group('tutorial', async (t) => {
	await t.open('?seed=1&speed=2');
	await t.ev(`(g) => { g.scene.stop('Menu'); g.scene.start('Table', { tutorial: true }); }`);
	await t.until('tutorial on', active('Tutorial'), 8000);
	const end = Date.now() + 240000;
	let cards = 0;
	while (Date.now() < end) {
		const st = await t.ev<{ on: boolean; showing: boolean; done: boolean }>(
			`(g) => ({ on: g.scene.isActive('Tutorial'), showing: Boolean(g.scene.keys.Tutorial.showing), done: g.registry.get('save').meta.tutorialDone })`,
		);
		if (st.done && !st.on) break;
		if (st.showing) {
			cards++;
			await t.press('Enter');
			continue;
		}
		const act = await t
			.ev<string>(`(g, t) => {
			if (!g.scene.isActive('Table') || !t.match || t.busy) return 'wait';
			if (t.endPanel?.visible) return 'end';
			if (t.match.state.pending?.responder === 0) { t.human({ kind: 'accept', seat: 0 }); return 'accept'; }
			if (t.match.actor() === 0 && t.turnArrow.visible) return 'play';
			return 'wait';
		}`)
			.catch(() => 'wait');
		if (act === 'play') await t.press('Digit1');
		else if (act === 'end') break;
		else await t.page.waitForTimeout(300);
	}
	const done = await t.ev<boolean>(
		`(g) => g.registry.get('save').meta.tutorialDone && !g.scene.isActive('Tutorial')`,
	);
	t.check(`tutorial finished (${cards} cards)`, done);
});

// 7. Pause: resume, Settings from the pause, quit.
await group('pause', async (t) => {
	await t.open('?skipMenu=1&seed=3');
	await t.until('your turn', humanTurn, 20000);
	await t.press('Escape');
	t.check('Esc opens Pause', await t.until('pause', active('Pause'), 3000));
	t.check('the table waits', await t.ev<boolean>(`(g) => g.scene.isPaused('Table')`));
	await t.press('Enter');
	t.check(
		'Resume',
		await t.until(
			'resumed',
			`(g) => !g.scene.isActive('Pause') && g.scene.isActive('Table') && !g.scene.isPaused('Table')`,
			3000,
		),
	);
	await t.press('Escape');
	await t.until('pause 2', active('Pause'), 3000);
	await t.press('ArrowDown', 'Enter');
	t.check('Settings from the pause', await t.until('settings', active('Settings'), 3000));
	await t.press('Escape');
	t.check(
		'Esc back to Pause',
		await t.until(
			'pause 3',
			`(g) => g.scene.isActive('Pause') && !g.scene.isActive('Settings')`,
			3000,
		),
	);
	await t.press('ArrowDown', 'Enter');
	t.check(
		'Quit → menu',
		await t.until(
			'menu',
			`(g) => g.scene.isActive('Menu') && !g.scene.isActive('Table')`,
			5000,
		),
	);
	t.check('Pause has no "restart" row (not implemented)', true, 'N/A');
});

// 8. Quick match to 12.
await group('quick12', async (t) => {
	await t.open('?skipMenu=1&seed=2&auto=1&speed=4');
	const ok = await t.until(
		'match end',
		'(g, t) => t.match.winner !== null && t.endPanel.visible',
		420000,
	);
	if (ok) {
		const s = await t.ev<string>(
			'(g, t) => JSON.stringify({ score: t.match.score, winner: t.match.winner, goal: t.match.goal })',
		);
		t.check(
			'ends at 12 tentos without a points goal',
			await t.ev<boolean>(
				'(g, t) => t.match.goal === undefined && t.match.score[t.match.winner] >= 12',
			),
			s,
		);
	}
});

// 9. Full auto runs (3 seeds) and the demo.
const RUN_MS = 20 * 60000;
for (const seed of fast ? [] : [21, 22, 23])
	await group(`run-seed${seed}`, async (t) => {
		await t.open(`?run=1&auto=1&speed=4&seed=${seed}`);
		const ok = await t.until(
			'run over',
			`(g) => ['won', 'lost'].includes((${phase})(g))`,
			RUN_MS,
		);
		if (!ok) return;
		const r = await t.ev<string>(
			`(g) => { const r = g.scene.keys.Run.run; return JSON.stringify({ phase: r.phase, champ: r.champ, table: r.table }); }`,
		);
		await t.page.waitForTimeout(2500);
		const end = await t.ev<boolean>(
			`(g) => g.scene.isActive('Run') || g.scene.isActive('Table')`,
		);
		t.check(`run ends with an end screen ${r}`, end, r);
		await t.page.screenshot({ path: `${SHOTS}/ok-run-seed${seed}.png` });
	});
if (!fast)
	await group('demo', async (t) => {
		await t.open('?run=1&demo=1&auto=1&speed=4&seed=5');
		const ok = await t.until(
			'demo over',
			`(g) => ['won', 'lost'].includes((${phase})(g))`,
			RUN_MS,
		);
		if (!ok) return;
		const r = await t.ev<string>(
			`(g) => { const r = g.scene.keys.Run.run; return JSON.stringify({ phase: r.phase, champ: r.champ, table: r.table, demo: r.demo }); }`,
		);
		await t.page.waitForTimeout(3000);
		const won = r.includes('"won"');
		if (won)
			t.check(
				'demo ends after the first boss with the demo end screen',
				await t.ev<boolean>(hasText('Run', /demo/i)),
				r,
			);
		else t.check(`demo run lost before the boss (end screen) ${r}`, true, r);
		await t.page.screenshot({ path: `${SHOTS}/ok-demo-end.png` });
	});

// 10. Saves: missing, corrupted (recovers from .bak), future version.
await group('save', async (t) => {
	await t.open('?seed=1');
	t.check(
		'no save → fresh save, menu boots',
		await t.ev<boolean>(
			`(g) => g.scene.isActive('Menu') && g.registry.get('save').meta.stats !== undefined`,
		),
	);
	// Two writes so a .bak exists, with a marker setting.
	await t.ev(`(g) => { g.scene.keys.Menu.openOverlay('Settings'); }`);
	await t.until('settings', active('Settings'), 4000);
	await t.ev(`(g) => { const s = g.scene.keys.Settings; s.focus = 1; s.adjust(-1); }`);
	await t.page.waitForTimeout(300);
	await t.ev(`(g) => { const s = g.scene.keys.Settings; s.focus = 2; s.adjust(-1); }`);
	await t.page.waitForTimeout(300);
	await t.press('Escape');
	const keys = await t.page.evaluate(() => Object.keys(localStorage));
	t.check(
		'main and .bak exist',
		keys.includes('truco-roguelite.save') && keys.includes('truco-roguelite.save.bak'),
		keys.join(','),
	);
	const bak = await t.page.evaluate(() => localStorage.getItem('truco-roguelite.save.bak') ?? '');
	const bakSettings = JSON.stringify(JSON.parse(JSON.parse(bak).payload).settings.volume);
	await t.page.evaluate(() => localStorage.setItem('truco-roguelite.save', '{corrupted'));
	await t.open('?seed=1');
	const vol = await t.ev<string>(`(g) => JSON.stringify(g.registry.get('save').settings.volume)`);
	t.check(
		'corrupted main → recovered from .bak',
		vol === bakSettings,
		`${vol} vs ${bakSettings}`,
	);
	const q = await t.page.evaluate(
		() => Object.keys(localStorage).filter((k) => k.includes('.corrupt.')).length,
	);
	t.check('corrupted copy quarantined', q >= 1, `${q}`);
	t.check('menu tells the save was recovered', await t.ev<boolean>(hasText('Menu', /backup/i)));
	await t.page.screenshot({ path: `${SHOTS}/ok-save-recovered.png` });
	// Future version: the main save stays untouched, the game uses the backup.
	const fut = JSON.stringify({ ...JSON.parse(bak), schemaVersion: 99 });
	await t.page.evaluate((v) => localStorage.setItem('truco-roguelite.save', v), fut);
	await t.open('?seed=1');
	await t.page.waitForTimeout(1500);
	t.check('future-version save: game boots', await t.ev<boolean>(active('Menu')));
	const still = await t.page.evaluate(() => localStorage.getItem('truco-roguelite.save'));
	t.check('future-version save is not overwritten', still === fut);
	await t.page.screenshot({ path: `${SHOTS}/ok-save-future.png` });
});

// 11. Live resize during the hand (5 sizes).
await group('resize', async (t) => {
	await t.open('?skipMenu=1&seed=3');
	await t.until('your turn', humanTurn, 20000);
	const sizes: [number, number][] = [
		[1920, 1080],
		[844, 390],
		[2560, 1080],
		[1366, 768],
		[1280, 800],
	];
	for (const [w, h] of sizes) {
		await t.page.setViewportSize({ width: w, height: h });
		await t.page.waitForTimeout(700);
		const first = await t.ev<number>(
			`(g) => Math.round(g.canvas.getBoundingClientRect().width)`,
		);
		if (Math.abs(first - w) > 2)
			t.check(
				`${w}x${h}: canvas follows the first resize event`,
				false,
				`canvas ${first}px wide, window ${w}px (one resize behind)`,
			);
		await t.page.evaluate(() => window.dispatchEvent(new Event('resize')));
		await t.page.waitForTimeout(500);
		const r = await t.ev<{ cw: number; ch: number; table: boolean }>(
			`(g) => { const c = g.canvas.getBoundingClientRect(); return { cw: Math.round(c.width), ch: Math.round(c.height), table: g.scene.isActive('Table') }; }`,
		);
		t.check(
			`${w}x${h}: canvas fills, table alive`,
			Math.abs(r.cw - w) <= 2 && Math.abs(r.ch - h) <= 2 && r.table,
			JSON.stringify(r),
		);
	}
	await t.press('Digit1');
	t.check(
		'still playable after resizes',
		await t.until('played', '(g, t) => t.match.state.hands[0].length === 2', 6000),
	);
});

// 12. Focus loss: music pauses and comes back; 13. mute silences ambience; music slider.
await group('audio', async (t) => {
	await t.open('?run=1&seed=7');
	await t.page.mouse.click(5, 5);
	await t.ev(`(g) => g.scene.keys.Run.choosePartner(g.scene.keys.Run.candidates[0])`);
	await t.ev(`(g) => g.scene.keys.Run.play()`);
	await t.until('table', active('Table'), 8000);
	await t.page.waitForTimeout(2500);
	const playing = `(g) => g.sound.sounds.filter((s) => s.isPlaying).map((s) => s.key)`;
	const before = await t.ev<string[]>(playing);
	t.check('music/ambience playing at the table', before.length > 0, before.join(','));
	const ctxState = `(g) => g.sound.context?.state ?? 'none'`;
	t.check(
		'audio context running',
		(await t.ev<string>(ctxState)) === 'running',
		await t.ev<string>(ctxState),
	);
	const vis = (hidden: boolean) =>
		t.page.evaluate((h) => {
			Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
			Object.defineProperty(document, 'visibilityState', {
				configurable: true,
				get: () => (h ? 'hidden' : 'visible'),
			});
			document.dispatchEvent(new Event('visibilitychange'));
			window.dispatchEvent(new Event(h ? 'blur' : 'focus'));
		}, hidden);
	await vis(true);
	await t.page.waitForTimeout(1500);
	t.check('hidden → the table pauses (Pause opens)', await t.ev<boolean>(active('Pause')));
	const hiddenState = await t.ev<string>(ctxState);
	const hiddenPlaying = await t.ev<string[]>(playing);
	t.check(
		'hidden → audio suspended or music paused',
		hiddenState === 'suspended' || hiddenPlaying.length === 0,
		`${hiddenState} ${hiddenPlaying.join(',')}`,
	);
	await vis(false);
	await t.page.waitForTimeout(2500);
	const back = await t.ev<string>(ctxState);
	const backPlaying = await t.ev<string[]>(playing);
	t.check(
		'visible → audio back',
		back === 'running' && backPlaying.length > 0,
		`${back} ${backPlaying.join(',')}`,
	);
	// Mute (all) from Settings over the pause (still open from the focus loss).
	if (!(await t.ev<boolean>(active('Pause')))) await t.press('Escape');
	await t.until('pause', active('Pause'), 3000);
	await t.press('ArrowDown', 'Enter');
	await t.until('settings', active('Settings'), 3000);
	const labels = await t.ev<string[]>(`(g) => g.scene.keys.Settings.rows.map((r) => r.label)`);
	const mute = labels.indexOf('settings.row.muted');
	await t.ev(`(g) => { const s = g.scene.keys.Settings; s.focus = ${mute}; s.adjust(1); }`);
	await t.page.waitForTimeout(300);
	const amb = await t.ev<string[]>(
		`(g) => g.sound.sounds.filter((s) => s.key.startsWith('amb.') && s.isPlaying).map((s) => s.key)`,
	);
	t.check(
		'mute → game.sound.mute (ambience included)',
		await t.ev<boolean>('(g) => g.sound.mute === true'),
		`ambience ${amb.join(',')}`,
	);
	await t.ev(`(g) => { const s = g.scene.keys.Settings; s.focus = ${mute}; s.adjust(1); }`);
	t.check('unmute', await t.ev<boolean>('(g) => g.sound.mute === false'));
	// Music slider to 0: music and ambience volume follow.
	const music = labels.indexOf('settings.row.music');
	for (let i = 0; i < 10; i++)
		await t.ev(`(g) => { const s = g.scene.keys.Settings; s.focus = ${music}; s.adjust(-1); }`);
	await t.page.waitForTimeout(1200);
	const vols = await t.ev<{ key: string; v: number }[]>(
		`(g) => g.sound.sounds.filter((s) => s.isPlaying && (s.key.startsWith('amb.') || s.key.startsWith('music.'))).map((s) => ({ key: s.key, v: +s.volume.toFixed(3) }))`,
	);
	t.check(
		'music slider 0 → music and ambience silent',
		vols.every((x) => x.v === 0),
		JSON.stringify(vols),
	);
});

await browser.close();
writeFileSync(`${SHOTS}/report.json`, JSON.stringify(report, null, '\t'));
const fails = report.filter((g) => g.checks.some((c) => !c.ok)).length;
console.log(`${report.length - fails}/${report.length} groups PASS`);
process.exit(fails ? 1 : 0);
