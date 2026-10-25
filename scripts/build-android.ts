// Android build (Google Play): vite build → cap sync → Gradle, versioned from package.json.
// Usage: bun scripts/build-android.ts [--apk] [--debug] [--skip-web] [--sync-only]
//   default: signed release AAB (needs ANDROID_KEYSTORE_* env, see docs/mobile.md)
//   --apk: APK instead of AAB (sideload on the phone) · --debug: debug build, no keystore needed
// Needs JDK 21 and the Android SDK (ANDROID_HOME); output in android/app/build/outputs/.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { versionCode } from './lib/version-code';

const args = process.argv.slice(2);
const has = (f: string) => args.includes(`--${f}`);
const win = process.platform === 'win32';
const pkg = JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string };
const run = (cmd: string, argv: string[], cwd = '.') =>
	execFileSync(cmd, argv, { cwd, stdio: 'inherit', shell: win });

if (!has('skip-web')) {
	run('bunx', ['--bun', 'vite', 'build']);
}
if (!existsSync('mobile/node_modules')) run('bun', ['install'], 'mobile');
run('bunx', ['cap', 'sync', 'android'], 'mobile');
if (has('sync-only')) process.exit(0);

const type = has('debug') ? 'Debug' : 'Release';
const task = `${has('apk') || has('debug') ? 'assemble' : 'bundle'}${type}`;
const code = versionCode(pkg.version);
console.log(`android ${task} · versionName ${pkg.version} · versionCode ${code}`);
run(
	// Explicit path: cmd.exe skips the current folder when NoDefaultCurrentDirectoryInExePath is set.
	win ? '.\\gradlew.bat' : './gradlew',
	[task, `-PversionCode=${code}`, `-PversionName=${pkg.version}`],
	'mobile/android',
);
