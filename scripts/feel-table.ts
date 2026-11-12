/**
 * Game feel of the table (ROADMAP R5.2 and R5.6): frame rate over a whole trick, and frame
 * sequences of the card effects and the seats' reactions for visual review.
 *   bun scripts/feel-table.ts fps    --url http://localhost:5243 [--size 1920x1080] [--speed 1] [--mode 1v1] [--tricks 3]
 *   bun scripts/feel-table.ts shots  --url http://localhost:5243 [--out <dir>] [--size 1920x1080] [--reduced] [--mode 1v1] [name…]
 * `fps` prints one JSON line: frames, mean fps, 95th percentile frame time and slow frames, from the
 * first card played to the last collected, bot playing every seat. `shots` saves a numbered JPEG
 * sequence per scenario (default folder: <os temp>/zapatro-feel), the game loop frozen and stepped
 * by hand. Production builds need `?qa=1` (added here). The scenario
 * predicates are constants of this file, evaluated in the page of a local build only.
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
const [cmd = 'fps'] = args;
const url = opt('url', 'http://localhost:5243');
const [w, h] = opt('size', '1920x1080').split('x').map(Number) as [number, number];
const speed = Number(opt('speed', '1'));
const tricks = Number(opt('tricks', '3'));
const mode = opt('mode', '2v2');
const reduced = args.includes('--reduced');
const out = outDir(opt('out', join(tmpdir(), 'zapatro-feel')));
const valued = ['--url', '--out', '--size', '--speed', '--tricks', '--mode'];
const names = args
	.slice(1)
	.filter((a, i) => !a.startsWith('--') && !valued.includes(args[i] ?? ''));

const base = (extra: string, seed: number): string =>
	`${url}/?skipMenu=1&qa=1&seed=${seed}&goal=110&mode=${mode}&speed=${speed}${extra}`;

/**
 * A scenario arms the table, waits for its moment (an event the bot plays, or a statement run at
 * once), then freezes the game loop and steps it by hand: `frames` frames, each `stepMs` of game
 * time apart, so the sequence does not depend on how fast the machine renders.
 */
interface Scenario {
	query: string;
	/** In-page predicate over a table event; the burst starts when it is true. */
	on?: string;
	/** In-page statement run once the table is ready, instead of waiting for an event. */
	run?: string;
	frames: number;
	stepMs: number;
}

const FELT = 'scene.playCard(0)';
const SCENARIOS: Record<string, Scenario> = {
	common: { query: '&vira=5c&hand=4d,5s,7h', run: FELT, frames: 14, stepMs: 30 },
	strong: { query: '&vira=5c&hand=2h,5s,7h', run: FELT, frames: 14, stepMs: 30 },
	manilha: { query: '&vira=4c&hand=5h,7s,3d', run: FELT, frames: 16, stepMs: 30 },
	zap: { query: '&vira=4c&hand=6c,5s,3d', run: FELT, frames: 30, stepMs: 40 },
	facedown: {
		query: '&vira=5c&hand=4d,5s,7h',
		run: 'scene.toggleCover(); scene.playCard(0)',
		frames: 12,
		stepMs: 30,
	},
	'trick-rival': {
		query: '&auto=1',
		on: "e.type==='trick'&&e.result==='them'",
		frames: 34,
		stepMs: 40,
	},
	'trick-player': {
		query: '&auto=1',
		on: "e.type==='trick'&&e.result==='us'",
		frames: 34,
		stepMs: 40,
	},
	// A tie cannot be waited for: four plain 5s are played, then the trick closes.
	tie: {
		query: '&vira=3c',
		run: `(async () => {
			const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
			for (let i = 0; i < 4; i++)
				await scene.animate({ type: 'played', seat: i, card: { id: '5' + i, rank: '5', suit: suits[i] }, faceDown: false });
			window.__freeze();
			scene.animate({ type: 'trick', index: 0, result: 'tie' });
		})()`,
		frames: 34,
		stepMs: 40,
	},
	truco: { query: '&auto=1', on: "e.type==='truco'&&e.seat!==0", frames: 16, stepMs: 60 },
	accepted: { query: '&auto=1', on: "e.type==='accepted'&&e.seat!==0", frames: 16, stepMs: 60 },
	folded: { query: '&auto=1', on: "e.type==='folded'&&e.seat!==0", frames: 16, stepMs: 60 },
	caught: {
		query: '&auto=1',
		on: "e.type==='signal'&&e.caughtBy.length>0",
		frames: 16,
		stepMs: 60,
	},
	handwon: {
		query: '&auto=1',
		on: "e.type==='handOver'&&e.end.winner==='us'",
		frames: 16,
		stepMs: 60,
	},
	handlost: {
		query: '&auto=1',
		on: "e.type==='handOver'&&e.end.winner==='them'",
		frames: 16,
		stepMs: 60,
	},
	queda: {
		query: '&auto=1',
		run: "scene.match.outcome='queda'; scene.reactTo({type:'handOver',end:{winner:'us',tentos:3},score:{us:0,them:0}}); window.__freeze()",
		frames: 20,
		stepMs: 60,
	},
};

async function open(
	browser: Awaited<ReturnType<typeof chromium.launch>>,
	query: string,
	seed = 7,
): Promise<Page> {
	const context = await browser.newContext({ viewport: { width: w, height: h } });
	if (reduced) {
		const save = defaultSave('en');
		save.settings.reduceFlashes = true;
		const text = serializeSave(save, '0.0.0');
		await context.addInitScript(
			([key, value]) => localStorage.setItem(key as string, value as string),
			[SAVE_KEY, text] as const,
		);
	}
	const page = await openPage(context, newReport(), 'feel', base(query, seed));
	await waitForScene(page, 'Table', { what: 'the table' });
	await waitForPaintings(page);
	return page;
}

async function fps(browser: Awaited<ReturnType<typeof chromium.launch>>): Promise<void> {
	const page = await open(browser, '&auto=1');
	const result = await page.evaluate(async (count) => {
		let want = count;
		const scene = (
			window as unknown as { __GAME__: { scene: { keys: { Table: { played: unknown[] } } } } }
		).__GAME__.scene.keys.Table;
		const frames: number[] = [];
		let last = performance.now();
		let seen = 0;
		let started = false;
		const done = new Promise<void>((res) => {
			let prev = 0;
			const step = (now: number) => {
				if (started) frames.push(now - last);
				last = now;
				const n = scene.played.length;
				if (n > 0) started = true;
				if (n > prev) seen = Math.max(seen, n);
				prev = n;
				// A trick is over once its cards are collected after the table filled.
				if (started && n === 0) {
					started = false;
					want--;
					if (want <= 0) return res();
					seen = 0;
				}
				requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
		});
		await done;
		const sorted = [...frames].sort((a, b) => a - b);
		const mean = frames.reduce((s, f) => s + f, 0) / frames.length;
		return {
			frames: frames.length,
			fps: Number((1000 / mean).toFixed(1)),
			p95Ms: Number((sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(1)),
			maxMs: Number((sorted[sorted.length - 1] ?? 0).toFixed(1)),
			over20ms: frames.filter((f) => f > 20).length,
		};
	}, tricks);
	console.log(JSON.stringify({ size: `${w}x${h}`, speed, mode, tricks, ...result }));
}

/** Rare events (a tie, a queda) may not come in one seed's first minute: the next seed is tried. */
const SEEDS = [7, 3, 11, 5, 13, 17, 19, 23];

async function shots(
	browser: Awaited<ReturnType<typeof chromium.launch>>,
	name: string,
	seeds: number[] = SEEDS,
): Promise<void> {
	const sc = SCENARIOS[name];
	if (!sc) throw new Error(`unknown scenario ${name}; have ${Object.keys(SCENARIOS).join(', ')}`);
	const [seed = 7, ...rest] = seeds;
	const page = await open(browser, sc.query, seed);
	// The first screenshot of a page is slow: take it before the scenario is armed.
	await page.screenshot({ type: 'jpeg', quality: 10 });
	await page.evaluate(
		([on, run]) => {
			type Game = { step(time: number, delta: number): void; loop: { sleep(): void } };
			const win = window as unknown as {
				__GAME__: Game & { scene: { keys: { Table: Record<string, unknown> } } };
				__burst: boolean;
				__t: number;
				__freeze(): void;
				__advance(ms: number): void;
			};
			const scene = win.__GAME__.scene.keys.Table as Record<string, unknown> & {
				animate(e: unknown): Promise<void>;
			};
			win.__burst = false;
			win.__freeze = () => {
				win.__t = performance.now();
				win.__GAME__.loop.sleep();
				win.__burst = true;
			};
			win.__advance = (ms) => {
				for (let left = ms; left > 0; left -= 1000 / 60) {
					win.__t += 1000 / 60;
					win.__GAME__.step(win.__t, 1000 / 60);
				}
			};
			if (on) {
				const test = new Function('e', `return ${on}`) as (e: unknown) => boolean;
				const orig = scene.animate.bind(scene);
				scene.animate = (e: unknown) => {
					if (!win.__burst && test(e)) {
						const done = orig(e);
						win.__freeze();
						return done;
					}
					return orig(e);
				};
			} else {
				new Function('scene', 'window', run as string)(scene, window);
				if (!run?.includes('__freeze')) win.__freeze();
			}
		},
		[sc.on ?? '', sc.run ?? ''] as const,
	);
	try {
		await page.waitForFunction('window.__burst === true', undefined, { timeout: 45_000 });
	} catch (e) {
		await page.context().close();
		if (rest.length === 0) throw e;
		return shots(browser, name, rest);
	}
	const prefix = `${reduced ? 'reduced-' : ''}${mode === '1v1' ? 'duel-' : ''}${name}`;
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
	await page.context().close();
}

// Software GL (the headless default) runs this table at 6 fps whatever the effects are: measure on the GPU.
const GPU = ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'];
const browser = await chromium.launch({
	args: process.env.GL_ARGS
		? process.env.GL_ARGS.split(' ')
		: process.platform === 'win32'
			? GPU
			: [],
});
try {
	if (cmd === 'fps') await fps(browser);
	else if (cmd === 'shots')
		for (const n of names.length ? names : Object.keys(SCENARIOS)) await shots(browser, n);
	else throw new Error('use `fps` or `shots`');
} finally {
	await browser.close();
}
