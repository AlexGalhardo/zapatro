/**
 * Screenshots of the game screens for visual review (Playwright, headless Chromium).
 *   bun scripts/shot.ts --url http://localhost:5191 [--out <dir>] [--size 1920x1080] [--dpr 3 --mobile]
 *                       [--timeout <seconds per wait>] [screen…]
 * Screens: menu, settings, controls, table, eleven, iron, pause, signals, end (all by default).
 * Each one waits for its scene (and game state) before the shot and fails, with the scenes that
 * were active, when it never shows. Dev builds expose window.__GAME__; production needs `?qa=1`
 * (added here). `--out` defaults to <os temp>/zapatro-shots.
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import {
	capture,
	finish,
	newReport,
	openPage,
	outDir,
	waitForPaintings,
	waitForScene,
} from './lib/capture';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const url = opt('url', 'http://localhost:5191');
const out = outDir(opt('out', join(tmpdir(), 'zapatro-shots')));
const [w, h] = opt('size', '1920x1080').split('x').map(Number) as [number, number];
const dpr = Number(opt('dpr', '1'));
const mobile = args.includes('--mobile');
const timeoutMs = Number(opt('timeout', '60')) * 1000;
const valued = ['--url', '--out', '--size', '--dpr', '--timeout'];
const screens = args.filter((a, i) => !a.startsWith('--') && !valued.includes(args[i - 1] ?? ''));

// The turn is really the player's once the table handed it over (the arrow over the hand shows).
const humanTurn =
	'scene.match !== undefined && !scene.busy && scene.match.actor() === 0 && scene.turnArrow.visible';
const tableUntil = (cond: string): string => `(game, scene) => ${humanTurn} && ${cond}`;

interface Screen {
	query: string;
	scene: string;
	until?: string;
	/** Steps after the first scene is up; the final `scene`/`until` is awaited afterwards. */
	act?: (page: Page) => Promise<void>;
	/** The scene expected after `act` (defaults to `scene`). */
	after?: { scene: string; until?: string };
	ms?: number;
}

/** Pauses `from` and launches the overlay `to` over it, as the menu and settings buttons do. */
const overlay = (from: string, to: string): ((page: Page) => Promise<void>) => {
	return async (page) => {
		await page.evaluate(
			([a, b]) => {
				type Sc = { scene: { pause(): void; launch(k: string, d: object): void } };
				const g = (
					window as unknown as { __GAME__: { scene: { keys: Record<string, Sc> } } }
				).__GAME__;
				const from = g.scene.keys[a as string];
				if (!from) throw new Error(`no scene ${a}`);
				from.scene.pause();
				from.scene.launch(b as string, { returnTo: a });
			},
			[from, to] as const,
		);
	};
};

const SCREENS: Record<string, Screen> = {
	menu: { query: '?seed=1', scene: 'Menu' },
	settings: {
		query: '?seed=1',
		scene: 'Menu',
		act: overlay('Menu', 'Settings'),
		after: { scene: 'Settings' },
	},
	controls: {
		query: '?seed=1',
		scene: 'Menu',
		act: async (p) => {
			await overlay('Menu', 'Settings')(p);
			await waitForScene(p, 'Settings', { ms: timeoutMs });
			await overlay('Settings', 'Keybinds')(p);
		},
		after: { scene: 'Keybinds' },
	},
	table: { query: '?skipMenu=1&seed=3', scene: 'Table', until: tableUntil('true') },
	eleven: {
		query: '?skipMenu=1&seed=3&score=11-4',
		scene: 'Table',
		until: '(game, scene) => scene.match !== undefined && scene.match.state.kind === "eleven" && (scene.eleven.visible || scene.match.actor() !== 0)',
	},
	iron: {
		query: '?skipMenu=1&seed=3&score=11-11',
		scene: 'Table',
		until: tableUntil('scene.match.state.kind === "iron"'),
	},
	pause: {
		query: '?skipMenu=1&seed=3',
		scene: 'Table',
		until: tableUntil('true'),
		act: (p) => p.keyboard.press('Escape'),
		after: { scene: 'Pause' },
	},
	signals: {
		query: '?skipMenu=1&seed=3',
		scene: 'Table',
		until: tableUntil('true'),
		act: (p) => p.keyboard.press('KeyS'),
		after: { scene: 'Table', until: '(game, scene) => scene.signPicker.visible' },
	},
	end: {
		query: '?skipMenu=1&seed=1&auto=1&speed=4&score=10-10',
		scene: 'Table',
		until: '(game, scene) => scene.match !== undefined && scene.match.winner !== null && scene.endPanel.visible',
		ms: 180_000,
	},
};

const want = screens.length ? screens : Object.keys(SCREENS);
const report = newReport();
const browser = await chromium.launch({
	headless: true,
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
	viewport: { width: w, height: h },
	deviceScaleFactor: dpr,
	isMobile: mobile,
	hasTouch: mobile,
});
for (const name of want) {
	const s = SCREENS[name];
	if (!s) {
		console.log(`FAIL ${name}: unknown screen (known: ${Object.keys(SCREENS).join(', ')})`);
		report.failures.push(name);
		continue;
	}
	await capture(report, name, async () => {
		const page = await openPage(context, report, name, `${url}/${s.query}&qa=1`);
		try {
			const ms = s.ms ?? timeoutMs;
			await waitForScene(page, s.scene, {
				...(s.until ? { until: s.until } : {}),
				what: name,
				ms,
			});
			await waitForPaintings(page);
			if (s.act) await s.act(page);
			if (s.after)
				await waitForScene(page, s.after.scene, {
					...(s.after.until ? { until: s.after.until } : {}),
					what: name,
					ms,
				});
			await page.waitForTimeout(500);
			const file = join(out, `${name}-${w}x${h}.png`);
			await page.screenshot({ path: file });
			return file;
		} finally {
			await page.close();
		}
	});
}
await browser.close();
for (const e of report.errors) console.log(e);
finish(report, want.length);
