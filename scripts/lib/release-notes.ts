/**
 * Release notes in the format of AlexGalhardo/vukem: the Keep a Changelog groups of the version
 * (`### Added`, `### Fixed`…), each entry as `- **scope:** Text ([abc1234](commit url))`. The
 * entries come from the CHANGELOG.md section of the version; the scope is the one of the
 * Conventional Commit the tag points at. Used by scripts/release.ts and by release.yml:
 *   bun scripts/lib/release-notes.ts v0.1.84 > notes.md
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (...argv: string[]): string => execFileSync('git', argv, { encoding: 'utf-8' }).trim();

/** The CHANGELOG.md section of version `v` (without its heading). */
export function changelogSection(v: string): string {
	const text = readFileSync('CHANGELOG.md', 'utf-8');
	const start = text.indexOf(`## [${v}]`);
	if (start < 0) throw new Error(`CHANGELOG.md has no section for ${v}`);
	const body = text.slice(text.indexOf('\n', start) + 1);
	const end = body.search(/^## \[/m);
	const section = (end < 0 ? body : body.slice(0, end)).trim();
	if (!section) throw new Error(`CHANGELOG.md section ${v} is empty`);
	return section;
}

/** `https://github.com/owner/repo` from the origin remote. */
export function repoUrl(): string {
	return git('remote', 'get-url', 'origin')
		.replace(/^git@github\.com:/, 'https://github.com/')
		.replace(/\.git$/, '');
}

/** Notes of tag `tag` (`vX.Y.Z`). */
export function releaseNotes(tag: string): string {
	const sha = git('rev-parse', `${tag}^{commit}`);
	const scope = /^\w+\(([^)]+)\)!?:/.exec(git('log', '-1', '--format=%s', sha))?.[1];
	const link = ` ([${sha.slice(0, 7)}](${repoUrl()}/commit/${sha}))`;
	return changelogSection(tag.slice(1))
		.split('\n')
		.map((line) =>
			// Merged milestone sections already carry each entry's own scope and commit link.
			line.startsWith('- ') && !line.includes('/commit/')
				? `- ${scope && !line.startsWith('- **') ? `**${scope}:** ` : ''}${line.slice(2)}${link}`
				: line,
		)
		.join('\n');
}

if (import.meta.main) {
	const tag = process.argv[2];
	if (!tag) throw new Error('usage: bun scripts/lib/release-notes.ts vX.Y.Z');
	process.stdout.write(`${releaseNotes(tag)}\n`);
}
