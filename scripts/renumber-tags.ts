/**
 * Renumbers the local release tags to the 0.0.x (ALPHA) -> 0.1.x (BETA) scheme (docs/git-and-versioning.md).
 * Tags are ordered by the commit they point to on `main`; the first ALPHA_COUNT become v0.0.1.., the rest v0.1.1..
 * Local only: remote tags and GitHub Releases are never touched. Usage: bun scripts/renumber-tags.ts [--dry-run]
 */
const ALPHA_COUNT = 52;
const dry = process.argv.includes('--dry-run');

function git(...args: string[]): string {
	const p = Bun.spawnSync(['git', ...args]);
	if (p.exitCode !== 0) throw new Error(`git ${args.join(' ')}: ${p.stderr.toString()}`);
	return p.stdout.toString().trim();
}

const order = git('rev-list', '--reverse', 'main').split('\n');
const position = new Map(order.map((sha, i) => [sha, i]));

const tags = git('tag', '--list', 'v*')
	.split('\n')
	.map((name) => ({ name, sha: git('rev-parse', `${name}^{commit}`) }))
	.map((t) => ({ ...t, pos: position.get(t.sha) }))
	.filter((t): t is { name: string; sha: string; pos: number } => t.pos !== undefined)
	.sort((a, b) => a.pos - b.pos);

const seen = new Set<string>();
for (const t of tags) {
	if (seen.has(t.sha)) throw new Error(`two tags on ${t.sha}: ${t.name}`);
	seen.add(t.sha);
}

const plan = tags.map((t, i) => ({
	...t,
	next: i < ALPHA_COUNT ? `v0.0.${i + 1}` : `v0.1.${i - ALPHA_COUNT + 1}`,
}));

for (const t of plan) console.log(`${t.name.padEnd(20)} -> ${t.next}`);
console.log(`${plan.length} tags`);
if (dry) process.exit(0);

const messages = new Map(
	plan.map((t) => [t.name, git('tag', '-l', '--format=%(contents)', t.name)]),
);
const next = new Set(plan.map((t) => t.next));
for (const t of plan) {
	if (t.name === t.next) continue;
	git('tag', '-f', '-a', t.next, t.sha, '-m', messages.get(t.name) || t.next);
}
for (const t of plan) if (!next.has(t.name)) git('tag', '-d', t.name);
console.log('done');
