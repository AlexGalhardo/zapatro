import { afterEach, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { trimPoki } from '../scripts/lib/poki-trim';

const dirs: string[] = [];
function build(): string {
	const out = mkdtempSync(join(tmpdir(), 'poki-trim-'));
	dirs.push(out);
	mkdirSync(join(out, 'assets/audio/sfx'), { recursive: true });
	for (const f of ['vo.pt.bia.hello.mp3', 'ui.click.mp3'])
		writeFileSync(join(out, 'assets/audio/sfx', f), 'x');
	return out;
}
afterEach(() => {
	for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

test('trimPoki removes the voices from the given outDir only', () => {
	const poki = build();
	const normal = build();
	trimPoki(poki);
	expect(existsSync(join(poki, 'assets/audio/sfx/vo.pt.bia.hello.mp3'))).toBe(false);
	expect(existsSync(join(poki, 'assets/audio/sfx/ui.click.mp3'))).toBe(true);
	expect(existsSync(join(normal, 'assets/audio/sfx/vo.pt.bia.hello.mp3'))).toBe(true);
});
