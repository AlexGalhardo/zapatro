// GitHub Releases from this machine: releases are milestones (skill release-section).
// Run after pushing the tags: every `v*` tag without a GitHub Release gets one, oldest first,
// titled with the tag and with the notes in the format of AlexGalhardo/vukem (scripts/lib/release-notes.ts).
// The release of HEAD is the "Latest" and also gets the builds, named zapatro_<version>_<platform>:
// web zips (full, demo, Poki), Electron Windows (on Windows) and Linux, the Android debug APK and
// checksums.txt. macOS, the signed AAB, the SBOMs, the cosign signature of checksums.txt and the
// provenance only come from release.yml (it attaches them when Actions has budget).
// Every release also builds the portable Windows executable (bun run exe): Zapatro-<version>-win-x64.exe
// is left in the project root (gitignored) for local tests and attached as zapatro_<version>_windows_amd64.exe.
// Usage: bun scripts/release.ts [--no-build | --web-only]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changelogSection, releaseNotes } from './lib/release-notes';

const win = process.platform === 'win32';
const { version } = JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string };
const tag = `v${version}`;
const out = join(tmpdir(), `zapatro-release-${version}`);
const asset = (suffix: string): string => `zapatro_${version}_${suffix}`;
const run = (cmd: string, argv: string[], env: Record<string, string> = {}): void => {
	execFileSync(cmd, argv, { stdio: 'inherit', shell: win, env: { ...process.env, ...env } });
};
const git = (...argv: string[]): string[] =>
	execFileSync('git', argv, { encoding: 'utf-8' }).split('\n').filter(Boolean);

// HEAD must be the commit tagged with package.json's version.
if (git('rev-parse', `${tag}^{commit}`)[0] !== git('rev-parse', 'HEAD')[0])
	throw new Error(`${tag} must exist and point at HEAD`);
const order = git('rev-list', '--reverse', '--topo-order', 'HEAD');
const released = new Set(
	execFileSync(
		'gh',
		['release', 'list', '--limit', '1000', '--json', 'tagName', '-q', '.[].tagName'],
		{
			encoding: 'utf-8',
		},
	).split('\n'),
);
const pending = git('tag', '--list', 'v*', '--merged', 'HEAD')
	.filter((t) => !released.has(t))
	.map((t) => ({ t, i: order.indexOf(git('rev-parse', `${t}^{commit}`)[0] ?? '') }))
	.sort((a, b) => a.i - b.i)
	.map((x) => x.t);
for (const t of pending) changelogSection(t.slice(1)); // fail before any publish
rmSync(out, { recursive: true, force: true });
mkdirSync(out);

/** Pre-releases: only a SemVer pre-release suffix; 0.x releases are regular ones, like vukem's. */
const pre = (v: string): boolean => v.includes('-');

function publish(t: string, notes: string, files: string[] = [], latest = false): void {
	const file = join(out, '..', `zapatro-notes-${t}.md`);
	writeFileSync(file, `${notes}\n`);
	// gh.exe directly: cmd.exe (shell) would split arguments with spaces.
	execFileSync(
		'gh',
		[
			'release',
			'create',
			t,
			...files,
			'--title',
			t,
			'--notes-file',
			file,
			'--verify-tag',
			`--latest=${latest}`,
			...(pre(t.slice(1)) ? ['--prerelease'] : []),
		],
		{ stdio: 'inherit' },
	);
	console.log(`released ${t}`);
}

for (const t of pending.filter((t) => t !== tag)) publish(t, releaseNotes(t));
if (!pending.includes(tag)) process.exit(0);
const notes = releaseNotes(tag);
if (process.argv.includes('--no-build')) {
	publish(tag, notes, [], true);
	process.exit(0);
}

/** Zips a folder with Python's zipfile: keeps the Unix executable bit that 7z/tar drop on Windows. */
function zip(dir: string, name: string): void {
	const py = `
import os, sys, zipfile
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(src):
        for f in files:
            p = os.path.join(root, f)
            info = zipfile.ZipInfo.from_file(p, os.path.relpath(p, src).replace(os.sep, '/'), strict_timestamps=False)
            info.compress_type = zipfile.ZIP_DEFLATED
            exe = '.' not in f or '.so' in f or f.endswith('.node') or f in ('chrome-sandbox', 'chrome_crashpad_handler')
            info.external_attr = (0o100755 if exe else 0o100644) << 16
            info.create_system = 3
            with open(p, 'rb') as h:
                z.writestr(info, h.read())
`;
	execFileSync(win ? 'python' : 'python3', ['-I', '-c', py, dir, join(out, name)], {
		stdio: 'inherit',
	});
}

// Web: demo and Poki first, the full build last (Electron and Android package dist/).
run('bun', ['run', 'build'], { VITE_DEMO: '1' });
zip('dist', asset('web-demo.zip'));
run('bun', ['run', 'build'], { VITE_DEMO: '1', VITE_POKI: '1' });
const pokiBytes = readdirSync('dist', { recursive: true, withFileTypes: true })
	.filter((e) => e.isFile())
	.reduce((sum, e) => sum + readFileSync(join(e.parentPath, e.name)).length, 0);
if (pokiBytes >= 8 * 1024 * 1024) throw new Error(`Poki build is ${pokiBytes} bytes (limit 8 MB)`);
zip('dist', asset('web-poki.zip'));
run('bun', ['run', 'build']);
zip('dist', asset('web.zip'));

// Electron: each build rewrites desktop/release/, so zip before the next one.
const electron = (extra: string[], dir: string, name: string): void => {
	run('bun', ['scripts/build-electron.ts', '--skip-web', '--', ...extra], {
		CSC_IDENTITY_AUTO_DISCOVERY: 'false',
	});
	zip(`desktop/release/${dir}`, name);
};
// --web-only: the Linux Electron build comes from release.yml (the Windows .exe and the debug APK are always built).
const webOnly = process.argv.includes('--web-only');
if (win) {
	run('bun', ['scripts/build-electron.ts', '--skip-web', '--exe', '--', '--win', '--x64'], {
		CSC_IDENTITY_AUTO_DISCOVERY: 'false',
	});
	zip('desktop/release/win-unpacked', asset('windows_amd64.zip'));
	cpSync(`Zapatro-${version}-win-x64.exe`, join(out, asset('windows_amd64.exe')));
}

if (!webOnly) {
	electron(['--linux', '--x64'], 'linux-unpacked', asset('linux_amd64.zip'));
}

// Android: debug APK (no upload keystore on this machine); Gradle needs JDK 21.
const jdk = join(process.env.LOCALAPPDATA ?? '', 'Programs', 'jdk-21');
run(
	'bun',
	['scripts/build-android.ts', '--skip-web', '--debug'],
	existsSync(jdk) ? { JAVA_HOME: jdk } : {},
);
cpSync(
	'mobile/android/app/build/outputs/apk/debug/app-debug.apk',
	join(out, asset('android-debug.apk')),
);

const assets = readdirSync(out);
writeFileSync(
	join(out, 'checksums.txt'),
	`${assets
		.map(
			(f) =>
				`${createHash('sha256')
					.update(readFileSync(join(out, f)))
					.digest('hex')}  ${f}`,
		)
		.join('\n')}\n`,
);
publish(
	tag,
	notes,
	readdirSync(out).map((f) => join(out, f)),
	true,
);
