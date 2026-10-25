// Electron shell (Steam build): one window that runs the Vite production build (`../dist`, or
// `resources/web` when packaged) from the privileged `app://truco-roguelite/` scheme.
// Why a custom scheme instead of file://: the save lives in localStorage, which is keyed by
// origin, and module scripts + fetch need a secure, standard origin to load the game's assets.
//   electron . [--smoke]   (--smoke: CI check, exits 0 once the game canvas exists)
import { existsSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app, BrowserWindow, ipcMain, Menu, net, protocol, shell } from 'electron';
import { initSteam, unlockAchievements } from './steam.js';

const here = dirname(fileURLToPath(import.meta.url));
const WEB = app.isPackaged ? join(process.resourcesPath, 'web') : join(here, '..', 'dist');
const SMOKE = process.argv.includes('--smoke');

protocol.registerSchemesAsPrivileged([
	{
		scheme: 'app',
		privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
	},
]);
// Software WebGL (SwiftShader) for when the GPU is unusable (CI runners, a blocklisted driver):
// Chromium no longer falls back to it on its own, so WebGL would be gone and the game could only
// show its no-WebGL screen. A working GPU is still used (checked: ANGLE D3D11 on an RTX 4060).
// Windows is left out: there ANGLE already falls back to WARP (Microsoft Basic Render Driver).
if (SMOKE || process.platform !== 'win32')
	app.commandLine.appendSwitch('enable-unsafe-swiftshader');

// Two instances would share (and lock) the same localStorage: focus the running one instead.
if (!SMOKE && !app.requestSingleInstanceLock()) app.quit();

/** @type {BrowserWindow | null} */
let win = null;

// The product used to be called Zapaco: keep its user-data folder so saves (localStorage) survive the rename.
app.setPath('userData', join(app.getPath('appData'), 'Zapaco'));

function createWindow() {
	win = new BrowserWindow({
		width: 1280,
		height: 720,
		minWidth: 960,
		minHeight: 540,
		backgroundColor: '#0a0b10',
		title: 'Zapatro',
		icon: join(here, 'build', 'icon.png'),
		show: !SMOKE,
		webPreferences: { backgroundThrottling: false, preload: join(here, 'preload.cjs') },
	});
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith('https://')) shell.openExternal(url);
		return { action: 'deny' };
	});
	win.loadURL('app://truco-roguelite/index.html');
	if (SMOKE) smoke(win);
}

/** @param {BrowserWindow} w */
function smoke(w) {
	const fail = (/** @type {string} */ why) => {
		console.error(`smoke: FAIL (${why})`);
		app.exit(1);
	};
	w.webContents.on('did-fail-load', (_e, code, desc) => fail(`${code} ${desc}`));
	w.webContents.on('render-process-gone', (_e, d) => fail(d.reason));
	const started = Date.now();
	const poll = async () => {
		const ok = await w.webContents.executeJavaScript(
			"!!document.querySelector('#game canvas')",
		);
		if (ok) {
			console.log(`smoke: ok (canvas in ${Date.now() - started} ms, web root ${WEB})`);
			app.exit(0);
		} else if (Date.now() - started > 30_000) fail('no canvas after 30 s');
		else setTimeout(poll, 250);
	};
	w.webContents.once('did-finish-load', poll);
}

app.on('second-instance', () => {
	if (!win) return;
	if (win.isMinimized()) win.restore();
	win.focus();
});

app.whenReady().then(() => {
	if (!existsSync(join(WEB, 'index.html'))) {
		console.error(`Web build missing at ${WEB}: run \`bun run build\` in the repository root.`);
		app.exit(1);
		return;
	}
	Menu.setApplicationMenu(null);
	if (!SMOKE) initSteam(here);
	ipcMain.on('steam:unlock', (_e, ids) => unlockAchievements(ids));
	// Once Chromium turns the GPU off after repeated crashes, only a new process gets WebGL back.
	ipcMain.on('app:relaunch', () => {
		app.relaunch();
		app.exit(0);
	});
	protocol.handle('app', (req) => {
		const path = normalize(join(WEB, decodeURIComponent(new URL(req.url).pathname)));
		if (!path.startsWith(WEB + sep)) return new Response('Forbidden', { status: 403 });
		return net.fetch(pathToFileURL(path).toString());
	});
	createWindow();
});

app.on('window-all-closed', () => app.quit());
