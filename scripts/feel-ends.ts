/**
 * Frame sequences of the beginnings and ends (ROADMAP R5.7) for visual review, and stills of the
 * run-end screen (R6.4, R7.3).
 *   bun scripts/feel-ends.ts shots  --url http://localhost:5246 [--out <dir>] [--size 1920x1080] [--lang pt|en] [--reduced] [--mode 1v1] [--speed 1] [name…]
 *   bun scripts/feel-ends.ts runend --url http://localhost:5246 [--out <dir>] [--lang pt|en] [name…]
 * `shots` freezes the game loop and steps it by hand (like feel-table.ts); `runend` saves one still
 * per size for a victory and a defeat (names: win, lose; sizes: 1920x1080, 2560x1440, and the touch
 * sizes 2400x1080 and 3120x1440). Default folder: <os temp>/zapatro-ends. Production builds need
 * `?qa=1` (added here). The statements below run in the page of a local build only.
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { defaultSave, SAVE_KEY, serializeSave } from '../src/logic/save';
import { newReport, openPage, outDir, waitForPaintings, waitForScene } from './lib/capture';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const [cmd = 'shots'] = args;
const url = opt('url', 'http://localhost:5246');
const [w, h] = opt('size', '1920x1080').split('x').map(Number) as [number, number];
const speed = Number(opt('speed', '1'));
const mode = opt('mode', '2v2');
const lang = opt('lang', 'pt');
const reduced = args.includes('--reduced');
const out = outDir(opt('out', join(tmpdir(), 'zapatro-ends')));
const valued = ['--url', '--out', '--size', '--speed', '--mode', '--lang'];
const names = args
	.slice(1)
	.filter((a, i) => !a.startsWith('--') && !valued.includes(args[i] ?? ''));

interface Scenario {
	/** Quick match (default) or a run's first table (`run`). */
	query: string;
	run?: boolean;
	/** Statement run in the page once the table is ready; it ends with the game loop frozen. */
	go: string;
	frames: number;
	stepMs: number;
}

const SCENARIOS: Record<string, Scenario> = {
	boss: {
		query: '&boss=valentao',
		go: 'scene.introBoss(scene.match.boss)',
		frames: 14,
		stepMs: 150,
	},
	final: {
		query: '&boss=reiDoTruco',
		go: 'scene.introBoss(scene.match.boss)',
		frames: 18,
		stepMs: 160,
	},
	'queda-us': { query: '', go: "scene.quedaBeat('us')", frames: 14, stepMs: 100 },
	'queda-them': { query: '', go: "scene.quedaBeat('them')", frames: 14, stepMs: 100 },
	win: { query: '', go: "scene.showEnd('us')", frames: 12, stepMs: 100 },
	'win-boss': { query: '&boss=valentao', go: "scene.showEnd('us')", frames: 14, stepMs: 150 },
	'win-final': { query: '&boss=reiDoTruco', go: "scene.showEnd('us')", frames: 18, stepMs: 160 },
	lose: { query: '', go: "scene.showEnd('them')", frames: 12, stepMs: 100 },
	'lose-run': { query: '', run: true, go: "scene.showEnd('them')", frames: 12, stepMs: 100 },
	'win-run': { query: '', run: true, go: "scene.showEnd('us')", frames: 12, stepMs: 100 },
};

const browser = await chromium.launch({
	args:
		process.platform === 'win32'
			? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu']
			: [],
});

async function context(
	width = w,
	height = h,
	touch = false,
): ReturnType<typeof browser.newContext> {
	const ctx = await browser.newContext({
		viewport: { width, height },
		...(touch ? { hasTouch: true, isMobile: true, deviceScaleFactor: 1 } : {}),
	});
	const save = defaultSave(lang === 'en' ? 'en' : 'pt-BR');
	save.settings.reduceFlashes = reduced;
	const text = serializeSave(save, '0.0.0');
	await ctx.addInitScript(
		([key, value]) => localStorage.setItem(key as string, value as string),
		[SAVE_KEY, text] as const,
	);
	return ctx;
}

async function shots(name: string): Promise<void> {
	const sc = SCENARIOS[name];
	if (!sc) throw new Error(`unknown scenario ${name}; have ${Object.keys(SCENARIOS).join(', ')}`);
	const ctx = await context();
	const base = sc.run
		? `${url}/?qa=1&run=1&mode=${mode}&partner=cida&seed=5&speed=${speed}`
		: `${url}/?skipMenu=1&qa=1&seed=7&goal=110&mode=${mode}&speed=${speed}${sc.query}`;
	const page = await openPage(ctx, newReport(), 'ends', base);
	if (sc.run) {
		await waitForScene(page, 'Run', { what: 'the run' });
		await page.evaluate('window.__GAME__.scene.keys.Run.play()');
	}
	await waitForScene(page, 'Table', { what: 'the table' });
	await waitForPaintings(page);
	// The boss tables open with their own introduction: let the first one end before replaying it.
	await page.waitForFunction('window.__GAME__.scene.keys.Table.busy === false', undefined, {
		timeout: 20_000,
	});
	await page.screenshot({ type: 'jpeg', quality: 10 });
	await page.evaluate((go) => {
		type Game = { step(time: number, delta: number): void; loop: { sleep(): void } };
		const win = window as unknown as {
			__GAME__: Game & { scene: { keys: { Table: object } } };
			__t: number;
			__advance(ms: number): void;
		};
		win.__advance = (ms) => {
			for (let left = ms; left > 0; left -= 1000 / 60) {
				win.__t += 1000 / 60;
				win.__GAME__.step(win.__t, 1000 / 60);
			}
		};
		new Function('scene', go)(win.__GAME__.scene.keys.Table);
		win.__t = performance.now();
		win.__GAME__.loop.sleep();
	}, sc.go);
	const prefix = `${lang}-${reduced ? 'reduced-' : ''}${mode === '1v1' ? 'duel-' : ''}${name}`;
	for (let i = 0; i < sc.frames; i++) {
		await page.screenshot({
			path: join(out, `${prefix}-${String(i).padStart(2, '0')}.jpg`),
			type: 'jpeg',
			quality: 72,
		});
		await page.evaluate(
			(ms) => (window as unknown as { __advance(ms: number): void }).__advance(ms),
			sc.stepMs,
		);
	}
	console.log(`ok ${name}: ${sc.frames} frames in ${out}`);
	await ctx.close();
}

const SIZES: [number, number, boolean][] = [
	[1920, 1080, false],
	[2560, 1440, false],
	[2400, 1080, true],
	[3120, 1440, true],
];

/** A finished run: forced to the end through the save, then the Run scene draws its summary. */
async function runend(name: 'win' | 'lose', width: number, height: number, touch: boolean) {
	const ctx = await context(width, height, touch);
	const page: Page = await openPage(
		ctx,
		newReport(),
		'runend',
		`${url}/?qa=1&run=1&mode=${mode}&partner=cida&seed=5&speed=1`,
	);
	await waitForScene(page, 'Run', { what: 'the run' });
	await page.evaluate((won) => {
		type Run = Record<string, unknown>;
		type Meta = { feats: string[]; unlocked: string[]; stakes: Record<string, number> };
		type Scene = { run: Run; play(): void; choosePartner(id: string): void; draw(): void };
		type G = {
			registry: { get(k: string): { meta: Meta } };
			scene: { keys: { Run: Scene } };
		};
		const g = (window as unknown as { __GAME__: G }).__GAME__;
		const scene = g.scene.keys.Run;
		// The new run would walk on to its first table: keep it on this screen.
		scene.play = () => {};
		scene.choosePartner('cida');
		const run = scene.run;
		const meta = g.registry.get('save').meta;
		run.phase = won ? 'won' : 'lost';
		run.champ = won ? 8 : 3;
		run.table = won ? 2 : 1;
		run.trinkets = ['peDeCoelho', 'acoNaManga'];
		run.collection = { peDeCoelho: 2, acoNaManga: 1 };
		run.stats = {
			hands: 41,
			bestHand: 18420,
			tables: won ? 24 : 7,
			items: { 'trinket:peDeCoelho': 9000, 'manha:zapZap': 4200 },
		};
		run.before = { feats: meta.feats.length, stakeBest: 0 };
		meta.feats.push('primeiraMao', 'ferro');
		meta.unlocked.push('deck:viciado');
		if (won) meta.stakes[run.startDeck as string] = 1;
		scene.draw();
	}, name === 'win');
	await new Promise((r) => setTimeout(r, 1500));
	const tag = `${lang}-runend-${name}-${width}x${height}${touch ? '-touch' : ''}`;
	await page.screenshot({ path: join(out, `${tag}.png`) });
	console.log(`ok ${tag}`);
	await ctx.close();
}

try {
	if (cmd === 'shots')
		for (const n of names.length ? names : Object.keys(SCENARIOS)) await shots(n);
	else if (cmd === 'runend')
		for (const n of names.length ? names : ['win', 'lose'])
			for (const [sw, sh, touch] of SIZES) await runend(n as 'win' | 'lose', sw, sh, touch);
	else throw new Error('use `shots` or `runend`');
} finally {
	await browser.close();
}
