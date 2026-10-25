// Android QA on an emulator or a USB phone: installs the debug APK, opens the game, drives its
// WebView with Playwright's Android support (over adb) and checks what only the native app
// has: the Capacitor bridge and plugins, the back button (= Esc), immersive landscape, the save.
// Flow: menu, quick table, back = Pause, tap a card, Home and back.
// Usage: bun scripts/qa-android.ts [--serial emulator-5556] [--no-install] [--out qa-android]
// Needs: a debug APK (`bun run android:debug`), ANDROID_HOME, one booted device (or --serial).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { _android } from 'playwright';

const args = process.argv.slice(2);
const opt = (name: string, d: string) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const APP = 'com.alexgalhardo.trucoroguelite';
const APK = 'mobile/android/app/build/outputs/apk/debug/app-debug.apk';
const out = opt('out', 'qa-android');
const sdk = process.env.ANDROID_HOME ?? join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const serial = opt('serial', '');
const adb = (...a: string[]): string =>
	execFileSync(join(sdk, 'platform-tools', 'adb'), [...(serial ? ['-s', serial] : []), ...a], {
		encoding: 'latin1',
		maxBuffer: 64 << 20,
	});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail = '') => {
	results.push([name, ok, detail]);
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
mkdirSync(out, { recursive: true });
const shot = (name: string) =>
	writeFileSync(
		`${out}/${name}.png`,
		execFileSync(
			join(sdk, 'platform-tools', 'adb'),
			[...(serial ? ['-s', serial] : []), 'exec-out', 'screencap', '-p'],
			{ maxBuffer: 64 << 20 },
		),
	);

if (!args.includes('--no-install')) adb('install', '-r', APK);
adb('shell', 'am', 'force-stop', APP);
adb('shell', 'monkey', '-p', APP, '-c', 'android.intent.category.LAUNCHER', '1');
await sleep(6000);
const pid = adb('shell', 'pidof', APP).trim();
check('app process running', pid !== '', `pid ${pid}`);
// Needs the debug build: the WebView is only inspectable when web debugging is on.
const device = (await _android.devices()).find((d) => !serial || d.serial() === serial);
if (!device) throw new Error('no Android device found by adb');
const page = await (await device.webView({ pkg: APP })).page();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e)));

type Cap = { isNativePlatform(): boolean; Plugins: Record<string, unknown> };
const bridge = await page.evaluate(() => {
	const cap = (window as unknown as { Capacitor?: Cap }).Capacitor;
	return { native: cap?.isNativePlatform() ?? false, plugins: Object.keys(cap?.Plugins ?? {}) };
});
check('Capacitor native bridge', bridge.native);
check(
	'Filesystem and Share plugins (save export)',
	bridge.plugins.includes('Filesystem') && bridge.plugins.includes('Share'),
	bridge.plugins.join(', '),
);
const written = await page.evaluate(async () => {
	const fs = (window as unknown as { Capacitor: Cap }).Capacitor.Plugins.Filesystem as {
		writeFile(o: object): Promise<{ uri: string }>;
	};
	try {
		return (
			await fs.writeFile({
				path: 'qa.json',
				data: '{}',
				directory: 'CACHE',
				encoding: 'utf8',
			})
		).uri;
	} catch (e) {
		return `error: ${e}`;
	}
});
check('Filesystem.writeFile into the cache', written.startsWith('file://'), written);

const size = await page.evaluate(() => ({
	w: innerWidth * devicePixelRatio,
	h: innerHeight * devicePixelRatio,
}));
check('landscape', size.w > size.h, `${Math.round(size.w)}×${Math.round(size.h)} px`);
shot('menu');

// Same origin (https://localhost): ?qa=1 exposes window.__GAME__ in the production build.
await page.goto(`${new URL(page.url()).origin}/?qa=1&skipMenu=1&seed=3`);
await page.waitForFunction(() => 'Capacitor' in window && '__GAME__' in window, null, {
	timeout: 30_000,
});
type Table = {
	sys?: unknown;
	busy: boolean;
	match: { actor(): number | null; state: { hands: unknown[][] } };
	handCards: { getBounds(): { centerX: number; centerY: number } }[];
	cameras: { main: { zoom: number; x: number; y: number; worldView: { x: number; y: number } } };
};
type G = {
	canvas: HTMLCanvasElement;
	scene: {
		scenes: { sys: { isActive(): boolean; settings: { key: string } } }[];
		keys: { Table: Table };
	};
};
const active = () =>
	page.evaluate(() =>
		(window as unknown as { __GAME__: G }).__GAME__.scene.scenes
			.filter((s) => s.sys.isActive())
			.map((s) => s.sys.settings.key),
	);
// The emulator boots the 266 asset files slowly (over 30 s with software GL).
const yourTurn = () =>
	page.waitForFunction(
		() => {
			const t = (window as unknown as { __GAME__: G }).__GAME__.scene.keys.Table;
			return t.sys !== undefined && t.match !== undefined && !t.busy && t.match.actor() === 0;
		},
		null,
		{ timeout: 120_000 },
	);
await yourTurn();
shot('table');
adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
await sleep(1200);
const paused = await active();
check('back button pauses the table', paused.includes('Pause'), paused.join(','));
shot('pause');
adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
await sleep(1200);
const resumed = await active();
check('back button resumes', !resumed.includes('Pause'), resumed.join(','));
check('app still in front after back', adb('shell', 'pidof', APP).trim() !== '');

// A real touch sequence on the first card of your hand (the page context has no Playwright
// touchscreen). pageX/screenX default to 0 and Phaser reads pageX: set every coordinate.
await yourTurn();
const cards = () =>
	page.evaluate(
		() =>
			(window as unknown as { __GAME__: G }).__GAME__.scene.keys.Table.match.state.hands[0]
				?.length ?? 0,
	);
const before = await cards();
await page.evaluate(() => {
	const g = (window as unknown as { __GAME__: G }).__GAME__;
	const t = g.scene.keys.Table;
	const b = t.handCards[0]?.getBounds();
	if (!b) return;
	const cam = t.cameras.main;
	const r = g.canvas.getBoundingClientRect();
	const k = r.width / g.canvas.width;
	const x = r.left + ((b.centerX - cam.worldView.x) * cam.zoom + cam.x) * k;
	const y = r.top + ((b.centerY - cam.worldView.y) * cam.zoom + cam.y) * k;
	const touch = new Touch({
		identifier: 7,
		target: g.canvas,
		clientX: x,
		clientY: y,
		pageX: x,
		pageY: y,
		screenX: x,
		screenY: y,
	});
	for (const type of ['touchstart', 'touchend'])
		g.canvas.dispatchEvent(
			new TouchEvent(type, {
				touches: type === 'touchstart' ? [touch] : [],
				targetTouches: type === 'touchstart' ? [touch] : [],
				changedTouches: [touch],
				bubbles: true,
				cancelable: true,
			}),
		);
});
await sleep(1500);
const after = await cards();
check('tapping a card plays it', after < before, `${before} → ${after} cards`);
shot('card-played');
adb('shell', 'input', 'keyevent', 'KEYCODE_HOME');
await sleep(1500);
adb('shell', 'monkey', '-p', APP, '-c', 'android.intent.category.LAUNCHER', '1');
await sleep(2500);
const back = await active();
// MainActivity tells the page it went hidden (MOB4.1): the table waits under its pause menu.
const tablePaused = await page.evaluate(() =>
	(
		window as unknown as { __GAME__: { scene: { isPaused(k: string): boolean } } }
	).__GAME__.scene.isPaused('Table'),
);
check(
	'Home and back reopens the same table under the pause menu',
	back.includes('Pause') && tablePaused,
	back.join(','),
);
check('Haptics plugin (phone vibration)', bridge.plugins.includes('Haptics'));
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await device.close();
const failed = results.filter((r) => !r[1]).length;
writeFileSync(
	`${out}/report.md`,
	`# QA Android\n\n| Check | Result | Detail |\n|---|---|---|\n${results
		.map(([n, ok, d]) => `| ${n} | ${ok ? 'PASS' : 'FAIL'} | ${d.replace(/\|/g, '/')} |`)
		.join('\n')}\n`,
);
console.log(`${results.length - failed}/${results.length} passed · screenshots in ${out}/`);
process.exit(failed ? 1 : 0);
