// Electron build (Steam): vite build → electron-builder --dir in desktop/.
// Output: desktop/release/<os>-unpacked/ (the folder a Steam depot uploads).
// Usage: bun scripts/build-electron.ts [--skip-web] [--exe] [-- extra electron-builder args, e.g. --x64]
// --exe: also builds the single portable Windows executable and copies it to the repository root as
// Zapatro-<version>-win-x64.exe (gitignored), the file to double-click to test the game. Every release
// builds it (scripts/release.ts, release.yml).
// ELECTRON_DIST_WIN / ELECTRON_DIST_LINUX: an unpacked Electron of the same version for that
// target (electron-builder `electronDist`). Windows Defender can lock the freshly extracted
// electron.exe and fail electron-builder's own extract + rename with EPERM; a ready folder
// skips that step.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';

const args = process.argv.slice(2);
const extra = args.includes('--') ? args.slice(args.indexOf('--') + 1) : [];
const pkg = JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string };
const dist = extra.includes('--win')
	? process.env.ELECTRON_DIST_WIN
	: extra.includes('--linux')
		? process.env.ELECTRON_DIST_LINUX
		: undefined;
if (dist) extra.push(`-c.electronDist=${dist}`);
const run = (cmd: string, argv: string[], cwd = '.') =>
	execFileSync(cmd, argv, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

if (!args.includes('--skip-web')) {
	run('bunx', ['--bun', 'vite', 'build']);
}
// The LAN table the desktop app can host: lan/server.ts bundled for Electron's Node.
run('bun', ['build', 'lan/server.ts', '--target=node', '--outfile=desktop/build/lan-server.mjs']);
if (!existsSync('desktop/node_modules')) run('bun', ['install'], 'desktop');
// --exe builds the portable executable below (it leaves desktop/release/win-unpacked too).
if (!args.includes('--exe'))
	run(
		'bunx',
		['electron-builder', '--dir', `-c.extraMetadata.version=${pkg.version}`, ...extra],
		'desktop',
	);

if (args.includes('--exe')) {
	const name = `Zapatro-${pkg.version}-win-x64.exe`;
	const winDist = process.env.ELECTRON_DIST_WIN;
	run(
		'bunx',
		[
			'electron-builder',
			'--win',
			'portable',
			'--x64',
			`-c.extraMetadata.version=${pkg.version}`,
			`-c.artifactName=${name}`,
			...(winDist ? [`-c.electronDist=${winDist}`] : []),
		],
		'desktop',
	);
	// Only the current version stays in the root: older builds are removed.
	for (const f of readdirSync('.'))
		if (/^Zapatro-.*-win-x64\.exe$/.test(f) && f !== name) rmSync(f);
	// Defender may still be scanning the fresh file (EBUSY): retry a few times.
	for (let i = 0; ; i++) {
		try {
			rmSync(name, { force: true });
			copyFileSync(`desktop/release/${name}`, name);
			break;
		} catch (e) {
			if (i === 9) throw e;
			Bun.sleepSync(1500);
		}
	}
	console.log(`exe: ${name}`);
}
