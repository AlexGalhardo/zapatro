/**
 * Records the gameplay clips of the trailer (PLAN RC3.2): Playwright at 1920×1080, fixed seeds and
 * the bot playing, in the game language of `--lang` (browser locale), one .webm per clip in
 * trailer/public/clips/<lang>/. A recording starts with the page, so clips.json keeps the second
 * each scene became ready plus timeline marks (each truco call, the count) for the edit.
 * Also copies the game art and audio into trailer/public/game.
 * Use the production build for short loads: `bun run build && bunx --bun vite preview --port 5192`.
 *   bun scripts/record-clips.ts --url http://localhost:5192 --lang en [clip…]
 *   bun scripts/record-clips.ts --assets-only   (only the art, audio and app icon)
 */
import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { chromium, type Page } from 'playwright';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const url = opt('url', 'http://localhost:5192');
const lang = opt('lang', 'en') === 'pt' ? 'pt' : 'en';
const only = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const OUT = `trailer/public/clips/${lang}`;
const W = 1920;
const H = 1080;
const TABLE_READY = 'window.__GAME__?.scene.keys.Table?.match !== undefined';
const MANHAS = 'seuZe,malandro,zapDeOuro';
/** Run screen with a strong build: rare and legendary Manhas, modified cards in the deck. */
const BUILD = `(() => {
	const s = window.__GAME__.scene.keys.Run; const r = s.run;
	Object.assign(r, { phase: 'shop', money: 31, manhaSlots: 5,
		manhas: ['zapDeOuro', 'trucoDeBoteco', 'viraDourada', 'blefeProfissional', 'reiDaMesa'] });
	const mods = ['vidro', 'hot', 'gold', 'heavy', 'nervosa'];
	r.deck.forEach((c, i) => { if (i % 4 === 0) c.mod = mods[(i / 4) % mods.length]; });
	r.shop = { offers: [
		{ kind: 'manha', id: 'teatro', price: 8, sold: false },
		{ kind: 'manha', id: 'zapZap', price: 9, sold: false },
		{ kind: 'consumable', item: { kind: 'lance', id: 'virada' }, price: 3, sold: false },
	], packs: [{ kind: 'pack', pack: 'baralho', price: 4, sold: false }, { kind: 'pack', pack: 'manha', price: 6, sold: false }],
	upgrade: null, rerolls: 0, opened: null };
	s.draw();
})()`;

interface Clip {
	query: string;
	/** JS condition for "the scene is on screen". */
	ready: string;
	/** What happens after it is ready (the footage the trailer uses). */
	act: (p: Page) => Promise<void>;
	/** Log truco calls and the count while it plays. */
	marks?: boolean;
}

const CLIPS: Record<string, Clip> = {
	// A full hand at normal speed with three Manhas: plays, tricks, truco and the count.
	table: {
		query: `?skipMenu=1&seed=3&auto=1&speed=1&goal=5000&manhas=${MANHAS}&qa=1`,
		ready: TABLE_READY,
		act: (p) => p.waitForTimeout(40_000),
		marks: true,
	},
	// Seed 7 climbs TRUCO → SIX → NINE → TWELVE in the first hand (scripts/find-seed.ts).
	escalate: {
		query: `?skipMenu=1&seed=7&auto=1&speed=1&goal=110&manhas=${MANHAS}&qa=1`,
		ready: TABLE_READY,
		act: (p) => p.waitForTimeout(40_000),
		marks: true,
	},
	// A boss table: the boss's name and rule on the sidebar's top card (docs/visual.md §5).
	boss: {
		query: '?skipMenu=1&seed=4&boss=stuart&goal=5000&auto=1&speed=1&qa=1',
		ready: TABLE_READY,
		act: (p) => p.waitForTimeout(16_000),
	},
	// The iron hand (11 × 11): vignette, blind cards.
	iron: {
		query: '?skipMenu=1&seed=5&auto=1&speed=1&score=11-11&qa=1',
		ready: TABLE_READY,
		act: (p) => p.waitForTimeout(12_000),
	},
	// The animated menu.
	menu: {
		query: '?seed=1&qa=1',
		ready: 'window.__GAME__?.scene.keys.Menu?.sys.isActive()',
		act: (p) => p.waitForTimeout(8_000),
	},
	// Next-table panels, then the shop with Manhas and packs.
	shop: {
		query: '?run=1&seed=6&qa=1',
		ready: 'window.__GAME__?.scene.keys.Run?.sys.isActive()',
		act: async (p) => {
			await p.evaluate(`window.__GAME__.scene.keys.Run.choosePartner('bruto')`);
			await p.waitForTimeout(3_000);
			await p.evaluate(BUILD);
			await p.waitForTimeout(5_000);
		},
	},
	// The build: the shop with five strong Manhas, then the deck full of modified cards, then a pack.
	build: {
		query: '?run=1&seed=7&qa=1',
		ready: 'window.__GAME__?.scene.keys.Run?.sys.isActive()',
		act: async (p) => {
			await p.evaluate(`window.__GAME__.scene.keys.Run.choosePartner('cida')`);
			await p.evaluate(BUILD);
			await p.waitForTimeout(3_000);
			await p.evaluate(
				`(() => { const s = window.__GAME__.scene.keys.Run; s.drawDeck(s.run); })()`,
			);
			await p.waitForTimeout(3_000);
			await p.evaluate(`(() => {
				const s = window.__GAME__.scene.keys.Run;
				for (const o of [...s.children.list]) if (o.depth === 40) o.destroy();
				s.run.shop.opened = [
					{ kind: 'card', card: { id: 'x1', rank: '3', suit: 'clubs', mod: 'vidro' } },
					{ kind: 'manha', id: 'zapZap' },
					{ kind: 'card', card: { id: 'x2', rank: 'A', suit: 'hearts', mod: 'hot' } },
					{ kind: 'consumable', item: { kind: 'lance', id: 'virada' } },
				];
				s.draw();
			})()`);
			await p.waitForTimeout(3_000);
		},
	},
};

/** Length of a recorded clip in seconds (ffprobe comes with the ffmpeg that scripts/audio-normalize.ts needs). */
function videoSeconds(file: string): number {
	const out = Bun.spawnSync([
		'ffprobe',
		'-v',
		'error',
		'-show_entries',
		'format=duration',
		'-of',
		'csv=p=0',
		file,
	]);
	const sec = Number(out.stdout.toString().trim());
	if (!Number.isFinite(sec) || sec <= 0) throw new Error(`ffprobe could not read ${file}`);
	return sec;
}

/** Polls the table while `act` runs: first time each call value is pending, first count. */
async function watch(
	page: Page,
	start: number,
	done: Promise<void>,
): Promise<Record<string, number>> {
	const marks: Record<string, number> = {};
	let running = true;
	done.finally(() => {
		running = false;
	});
	while (running) {
		const s = await page
			.evaluate(`(() => { const t = window.__GAME__?.scene.keys.Table; const st = t?.match?.state;
				return { call: st?.pending?.to ?? 0, count: Boolean(t?.scoreBox?.visible) }; })()`)
			.catch(() => null);
		const now = (Date.now() - start) / 1000;
		const v = s as { call: number; count: boolean } | null;
		if (v?.call && marks[`call${v.call}`] === undefined) marks[`call${v.call}`] = now;
		if (v?.count && marks.count === undefined) marks.count = now;
		await page.waitForTimeout(100).catch(() => {});
	}
	return marks;
}

mkdirSync(OUT, { recursive: true });
const indexFile = `${OUT}/clips.json`;
const index: Record<string, { ready: number; marks?: Record<string, number> }> = existsSync(
	indexFile,
)
	? JSON.parse(readFileSync(indexFile, 'utf8'))
	: {};
// --assets-only refreshes trailer/public/game without recording (e.g. a render on old clips).
if (!args.includes('--assets-only')) {
	const browser = await chromium.launch();
	for (const name of only.length ? only : Object.keys(CLIPS)) {
		const clip = CLIPS[name];
		if (!clip) continue;
		// One context per clip: the recording starts with the page and ends when it closes.
		const context = await browser.newContext({
			viewport: { width: W, height: H },
			locale: lang === 'en' ? 'en-US' : 'pt-BR',
			recordVideo: { dir: `${OUT}/raw`, size: { width: W, height: H } },
		});
		const start = Date.now();
		const page = await context.newPage();
		await page.goto(`${url}/${clip.query}`);
		await page.waitForFunction(clip.ready, undefined, { timeout: 120_000 });
		const ready = (Date.now() - start) / 1000;
		const acting = clip.act(page);
		const marks = clip.marks ? await watch(page, start, acting) : undefined;
		await acting;
		const end = (Date.now() - start) / 1000;
		const video = page.video();
		await page.close();
		await context.close();
		const file = await video?.path();
		if (!file) continue;
		renameSync(file, `${OUT}/${name}.webm`);
		// The recorder writes few frames while the page loads, so the video is shorter than the
		// wall clock (table: 43 s of video for 65 s). Once the scene is up it repaints every frame,
		// so times are anchored on the end of the video: video time = duration − (end − wall time).
		const duration = videoSeconds(`${OUT}/${name}.webm`);
		const toVideo = (wall: number): number => Math.max(0, duration - (end - wall));
		const videoMarks = marks
			? Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, toVideo(v)]))
			: undefined;
		index[name] = { ready: toVideo(ready), ...(videoMarks ? { marks: videoMarks } : {}) };
		console.log(
			`clip ${lang}/${name}: ${duration.toFixed(1)} s of video for ${end.toFixed(1)} s · ${JSON.stringify(index[name])}`,
		);
	}
	await browser.close();
	rmSync(`${OUT}/raw`, { recursive: true, force: true });
	writeFileSync(indexFile, `${JSON.stringify(index, null, '\t')}\n`);
}

// Game art and audio for the stills and the soundtrack.
rmSync('trailer/public/game', { recursive: true, force: true });
cpSync('public/assets', 'trailer/public/game', { recursive: true });
await sharp('art-src/app-icon.svg').resize(512).png().toFile('trailer/public/game/app-icon.png');
console.log('assets copied to trailer/public/game');
