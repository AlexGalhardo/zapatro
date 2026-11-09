import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/** Files the Poki build leaves out (see the note in vite.config.ts). */
export const POKI_SKIP =
	/(audio\/(sfx|music)\/(amb\.(?!boteco)[^/]+|music\.(king|table\d)[^/]*|vo\.[^/]+)|gfx\/bg\/(menu-[1-9]|bg\d|street|partner)\.webp)$/;

/** Deletes the skipped files from a build output; `outDir` is the directory Vite wrote to, never a fixed `dist/`. */
export function trimPoki(outDir: string): void {
	for (const kind of ['audio/sfx', 'audio/music', 'gfx/bg']) {
		const dir = join(outDir, 'assets', kind);
		if (!existsSync(dir)) continue;
		for (const f of readdirSync(dir)) if (POKI_SKIP.test(`${kind}/${f}`)) rmSync(join(dir, f));
	}
}
