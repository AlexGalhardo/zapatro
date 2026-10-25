// Loads PIXELLAB_API_TOKEN and ELEVENLABS_API_KEY from ./.env or from the main checkout's .env
// (worktrees have no .env). Imported by scripts/lib/elevenlabs.ts.
// Never prints the keys.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** The main checkout is the parent of the shared git dir (same for every worktree). */
function mainCheckoutEnv(): string | null {
	try {
		const common = execSync('git rev-parse --path-format=absolute --git-common-dir', {
			encoding: 'utf8',
		}).trim();
		return join(dirname(resolve(common)), '.env');
	} catch {
		return null;
	}
}

for (const name of ['PIXELLAB_API_TOKEN', 'ELEVENLABS_API_KEY']) {
	if (process.env[name]) continue;
	for (const f of ['.env', mainCheckoutEnv()]) {
		if (!f || !existsSync(f)) continue;
		const m = readFileSync(f, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
		if (m?.[1]) {
			process.env[name] = m[1].trim().replace(/^["']|["']$/g, '');
			break;
		}
	}
}
