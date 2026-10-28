import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
	version: string;
	buildName?: string;
};

/**
 * Poki build (B5.4): the first download must stay under 8 MB, so the ambiences of the later
 * Championships, the final music, the extra table loops and the voice barks stay out (the speech bubbles remain), and so
 * do the extra paintings: the menu keeps menu-1 and the table the always-loaded backdrops.
 */
const POKI = ['1', 'true'].includes(process.env.VITE_POKI ?? '');
const POKI_SKIP =
	/(audio\/(sfx|music)\/(amb\.(?!boteco)[^/]+|music\.(king|table\d)[^/]*|vo\.[^/]+)|gfx\/bg\/(menu-[1-9]|bg\d|street|partner)\.webp)$/;

/** Files under public/assets (relative, e.g. "assets/ui/x.png"): Boot loads only what exists. */
function assetFiles(dir = 'public/assets'): string[] {
	if (!existsSync(dir)) return [];
	return (
		readdirSync(dir, { recursive: true, withFileTypes: true })
			.filter((e) => e.isFile() && !e.name.startsWith('.'))
			// parentPath uses backslashes on Windows; the game expects URL-style paths.
			.map((e) => `${e.parentPath}/${e.name}`.replace(/\\/g, '/').replace(/^public\//, ''))
			.filter((f) => !(POKI && POKI_SKIP.test(f)))
	);
}

export default defineConfig({
	base: './',
	// SOUND_* variables from .env are exposed to the game (import.meta.env.…).
	envPrefix: ['VITE_', 'SOUND_'],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		// Playtest build nickname shown next to the version (package.json "buildName").
		__BUILD_NAME__: JSON.stringify(pkg.buildName ?? ''),
		// Final art atlas (1.0): loaded only when it exists; placeholders cover the rest.
		__HAS_ATLAS__: JSON.stringify(existsSync('public/assets/atlas')),
		__ASSET_FILES__: JSON.stringify(assetFiles()),
	},
	build: {
		target: 'es2022',
		chunkSizeWarningLimit: 2000,
	},
	plugins: [
		{
			// Vite copies all of public/: drop the files the Poki build leaves out.
			name: 'poki-trim',
			apply: 'build',
			closeBundle() {
				if (!POKI) return;
				for (const kind of ['audio/sfx', 'audio/music', 'gfx/bg']) {
					const dir = `dist/assets/${kind}`;
					if (!existsSync(dir)) continue;
					for (const f of readdirSync(dir))
						if (POKI_SKIP.test(`${kind}/${f}`)) rmSync(`${dir}/${f}`);
				}
			},
		},
	],
});
