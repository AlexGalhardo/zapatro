/**
 * LAN end-to-end smoke: a real server and two real browser pages play whole matches through the
 * game's own scenes (form, lobby, table, end panel, lobby), including a dropped connection, a
 * player who leaves mid-match and a fresh lobby afterwards. Exits non-zero on any failure or
 * console error. Not wired into CI yet.
 *   bun run build && bun scripts/lan-smoke.ts [--url http://localhost:5191] [--cli] [--shots docs/media/gta-after]
 * `--cli` runs the real `bun lan/cli.ts` (slow bots: a match takes minutes) instead of an
 * in-process server with short pauses.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { chromium, type Page } from 'playwright';
import { startLanServer } from '../lan/server';

const arg = (name: string, fallback: string): string => {
	const i = process.argv.indexOf(name);
	return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
};
// Default: the production build (`bun run build`) served from dist/. A dev server reloads the
// pages whenever someone edits a source file, which breaks a long run.
let url = arg('--url', '');
const dist = url
	? null
	: Bun.serve({
			port: 0,
			async fetch(req) {
				const path = new URL(req.url).pathname;
				const file = Bun.file(`dist${path.endsWith('/') ? `${path}index.html` : path}`);
				return (await file.exists())
					? new Response(file)
					: new Response('not found', { status: 404 });
			},
		});
if (dist) url = `http://localhost:${dist.port}`;
const shots = arg('--shots', '');
const PORT = 25990;
const errors: string[] = [];
const reconnected = new Set<string>();

let stop = async (): Promise<void> => {};
let cli: ChildProcess | null = null;
if (process.argv.includes('--cli')) {
	cli = spawn('bun', ['lan/cli.ts'], { env: { ...process.env, PORT: String(PORT) } });
	cli.stderr?.on('data', (d) => errors.push(`server: ${d}`));
	await Bun.sleep(1500);
	stop = async () => void cli?.kill();
} else {
	const server = await startLanServer(PORT, { botMs: 60, gapMs: 60 });
	stop = server.stop;
}

const browser = await chromium.launch();
const open = async (name: string): Promise<Page> => {
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
	const page = await context.newPage();
	page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(`${name}: ${m.text()}`);
		if (m.text().includes('reconnection successful')) reconnected.add(name);
	});
	await page.goto(`${url}/?qa=1&speed=4`);
	await page.waitForFunction('window.__GAME__?.scene?.keys?.Menu?.sys?.isActive()', null, {
		timeout: 30000,
	});
	return page;
};
const until = (p: Page, js: string, ms = 60000): Promise<unknown> =>
	p.waitForFunction(js, null, { timeout: ms, polling: 100 }).catch((e: Error) => {
		throw new Error(`${e.message.slice(0, 120)} while waiting for: ${js.slice(0, 160)}`);
	});

const LAN = 'window.__GAME__.scene.keys.Lan';
const TABLE = 'window.__GAME__.scene.keys.Table';

/** Menu to the LAN form to a joined lobby. */
const join = async (p: Page, name: string): Promise<void> => {
	await p.evaluate(`window.__GAME__.scene.keys.Menu.scene.start('Lan')`);
	await p.waitForSelector('input');
	const inputs = p.locator('input');
	await inputs.nth(0).fill(name);
	await inputs.nth(1).fill(`127.0.0.1:${PORT}`);
	await p.locator('button').first().click();
	await until(p, `${LAN}.client?.lobby`);
};

/** Plays a random legal action whenever it is this page's turn. */
const startBot = (p: Page): Promise<void> =>
	p.evaluate(`(() => {
		clearInterval(window.__bot);
		window.__bot = setInterval(() => {
			const t = ${TABLE};
			if (!t || !t.sys.isActive() || t.busy || t.endPanel?.visible || !t.net) return;
			if (t.match.actor() !== 0) return;
			const legal = t.match.legal(0);
			const pick = (k) => legal.filter((a) => a.kind === k)[0];
			const r = Math.random();
			let a;
			if (t.match.state.pending?.responder === 0) a = r < 0.5 ? pick('accept') : r < 0.75 ? pick('fold') : pick('truco');
			else if (r < 0.1) a = pick('signal');
			else if (r < 0.2) a = pick('truco');
			else if (r < 0.25) a = pick('fold');
			a = a ?? legal[Math.floor(Math.random() * legal.length)];
			if (a) t.human(a);
		}, 120);
	})()`);

const onTable = `${TABLE}?.sys.isActive() && ${TABLE}.net`;
const ended = `${TABLE}?.endPanel?.visible`;
const inLobby = `${LAN}?.sys.isActive() && ${LAN}.client?.lobby && !${LAN}.client.lobby.playing`;
const toLobby = async (p: Page): Promise<void> => {
	await p.evaluate(`${TABLE}.endPanel.list[2].click()`);
	await until(p, inLobby);
};
const start = async (host: Page, ...players: Page[]): Promise<void> => {
	await host.evaluate(`${LAN}.client.send({ type: 'start' })`);
	for (const p of [host, ...players]) await until(p, onTable);
	for (const p of [host, ...players]) await startBot(p);
};
const step = (s: string): void => console.log(`- ${s}`);

try {
	const a = await open('A');
	const b = await open('B');
	await join(a, 'Ana');
	await join(b, 'Beto');
	await until(a, `${LAN}.client.lobby.seats.filter(Boolean).length === 2`);
	step('lobby: two players seated');

	// Match 1: a whole match, with the manual opened over the table (and closed) on A.
	await start(a, b);
	await Bun.sleep(600);
	if (shots) await a.screenshot({ path: `${shots}/05-table-lan-pt.png` });
	await a.keyboard.press('F1');
	await until(a, `window.__GAME__.scene.keys.Rules?.sys.isActive()`);
	await Bun.sleep(2000);
	await a.keyboard.press('Escape');
	await until(a, `${TABLE}.sys.isActive()`);
	step('manual (F1) opened over the LAN table and closed');
	await until(a, ended, 240000);
	await until(b, ended, 240000);
	step('match 1 ended on both clients');
	await toLobby(a);
	await toLobby(b);
	step('both back in the lobby after the match');

	// Match 2: B's socket drops mid-match and the SDK reconnects.
	await start(a, b);
	await Bun.sleep(1500);
	await b.evaluate(`${TABLE}.net.client.room.connection.transport.ws.close(4010)`);
	for (let i = 0; i < 100 && !reconnected.has('B'); i++) await Bun.sleep(100);
	if (!reconnected.has('B')) throw new Error('B did not reconnect after its socket dropped');
	step('B reconnected after a dropped socket');
	await until(a, ended, 240000);
	await until(b, ended, 240000);
	step('match 2 ended on both clients after the reconnection');
	await toLobby(a);
	await toLobby(b);

	// Match 3: B leaves for good mid-match; a bot takes the seat and A plays on.
	await start(a, b);
	await Bun.sleep(1500);
	await b.evaluate(`${TABLE}.scene.start('Menu')`);
	await until(a, ended, 240000);
	step('match 3 finished on A after B left (a bot took the seat)');
	await toLobby(a);
	await a.evaluate(`${LAN}.leave()`);
	await Bun.sleep(500);

	// A fresh lobby: a new player gets seat 0 and starts alone against bots.
	const c = await open('C');
	await join(c, 'Caio');
	const seats = await c.evaluate<number[]>(
		`${LAN}.client.lobby.seats.map((s, i) => (s ? i : -1)).filter((i) => i >= 0)`,
	);
	if (seats.join() !== '0') throw new Error(`new lobby should only hold seat 0, got ${seats}`);
	await c.evaluate(`${LAN}.client.send({ type: 'start' })`);
	await until(c, onTable);
	step('new lobby after everyone left: one player started a table against bots');
} finally {
	await browser.close();
	await stop();
	dist?.stop();
}

if (errors.length) {
	console.error(`console/server errors:\n${[...new Set(errors)].join('\n')}`);
	process.exit(1);
}
console.log('LAN smoke ok');
process.exit(0);
