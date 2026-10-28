// Audio check (docs/audio.md, docs/audio-final-game.md): measures every voice and music file the
// catalog (scripts/el-catalog.ts → AUDIO) promises and exits ≠ 0 when one fails.
// Per take: exists, ffprobe decodes it as MP3, plausible length (voice 0.3–8 s, music 50–70 s),
// not near-empty, loudness on target (EBU R128, measured looped to 3 s like audio-normalize.ts so
// takes under the 400 ms block still read), sample peak ≤ −1 dBFS (+ MP3 overshoot tolerance), no
// clipping, no long silence in the middle (cut or broken take). Then: identical takes, the
// music loop seam (sample jump at the wrap) and the size per language and of the first download.
// Usage: bun scripts/audio-check.ts [key-prefix ...]   (FFMPEG= / FFPROBE= or on PATH)
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadPhase } from '../src/data/load-order';
import { AUDIO, type AudioKind, audioFile, TARGET_LUFS } from './el-catalog';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const FFPROBE = process.env.FFPROBE ?? FFMPEG.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const prefixes = process.argv.slice(2).filter((a) => !a.startsWith('--'));

/**
 * Limits per kind: length (s; music: the catalog length ±25 %), loudness tolerance (LU), longest
 * silence allowed mid-take (s).
 */
const LIMITS: Partial<Record<AudioKind, { min: number; max: number; lu: number; gap: number }>> = {
	vo: { min: 0.3, max: 8, lu: 2, gap: 1 },
	music: { min: 0.75, max: 1.25, lu: 2, gap: 3 },
};
const lengthRange = (t: Take): [number, number] => {
	const lim = LIMITS[t.kind] ?? { min: 0, max: Number.POSITIVE_INFINITY };
	return t.kind === 'music' ? [lim.min * t.seconds, lim.max * t.seconds] : [lim.min, lim.max];
};
/** The limiter sits at −1 dBFS; MP3 encoding overshoots it by a few tenths. */
const PEAK_MAX = -0.5;
const CLIP = -0.1;
/** A take whose mean level sits this low is near-empty. */
const EMPTY_MEAN = -45;
const FIRST_DOWNLOAD_MAX = 8 * 1024 * 1024;
const POOL = 8;

async function run(cmd: string, args: string[]): Promise<{ code: number; err: string }> {
	const p = Bun.spawn([cmd, '-hide_banner', ...args], { stderr: 'pipe', stdout: 'pipe' });
	const [err] = await Promise.all([new Response(p.stderr).text(), new Response(p.stdout).text()]);
	return { code: await p.exited, err };
}

interface Take {
	key: string;
	kind: AudioKind;
	file: string;
	tier: number;
	seconds: number;
	fails: string[];
	dur?: number;
	lufs?: number;
	peak?: number;
	mean?: number;
}

async function probe(t: Take): Promise<void> {
	const lim = LIMITS[t.kind];
	if (!lim) return;
	if (!existsSync(t.file)) {
		t.fails.push('missing');
		return;
	}
	const pr = Bun.spawn(
		[FFPROBE, '-v', 'error', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', t.file],
		{ stdout: 'pipe', stderr: 'pipe' },
	);
	const codec = (await new Response(pr.stdout).text()).trim();
	if ((await pr.exited) !== 0 || codec !== 'mp3') t.fails.push(`ffprobe: codec "${codec}"`);
	const a = await run(FFMPEG, [
		'-nostats',
		'-i',
		t.file,
		'-af',
		`volumedetect,silencedetect=n=-40dB:d=${lim.gap}`,
		'-f',
		'null',
		'-',
	]);
	if (a.code !== 0 || /Error while decoding|Invalid data/i.test(a.err))
		t.fails.push('decode error');
	const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(a.err);
	t.dur = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
	t.peak = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(a.err)?.[1] ?? Number.NaN);
	t.mean = Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(a.err)?.[1] ?? Number.NaN);
	const [min, max] = lengthRange(t);
	if (t.dur < min || t.dur > max) t.fails.push(`length ${t.dur.toFixed(2)} s`);
	if (!(t.mean > EMPTY_MEAN)) t.fails.push(`near-empty (mean ${t.mean} dB)`);
	if (t.peak >= CLIP) t.fails.push(`clipping (peak ${t.peak} dBFS)`);
	else if (t.peak > PEAK_MAX) t.fails.push(`peak ${t.peak} dBFS`);
	// A silence that neither starts at the head nor runs to the tail is a gap mid-take.
	const starts = [...a.err.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Number(m[1]));
	const ends = [...a.err.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)];
	for (const [i, s] of starts.entries()) {
		const end = Number(ends[i]?.[1] ?? t.dur);
		if (s > 0.05 && end < t.dur - 0.05)
			t.fails.push(`silence ${(end - s).toFixed(2)} s at ${s.toFixed(2)} s`);
	}
	const b = await run(FFMPEG, [
		'-nostats',
		'-stream_loop',
		'-1',
		'-t',
		String(Math.max(3, t.dur)),
		'-i',
		t.file,
		'-af',
		'ebur128=framelog=quiet',
		'-f',
		'null',
		'-',
	]);
	const m = /I:\s+(-?[\d.]+|-inf) LUFS/.exec(b.err.slice(b.err.lastIndexOf('Summary')));
	t.lufs = Number(m?.[1] ?? Number.NaN);
	const target = TARGET_LUFS[t.kind];
	if (!(Math.abs(t.lufs - target) <= lim.lu))
		t.fails.push(`loudness ${t.lufs} LUFS (target ${target} ±${lim.lu})`);
}

/**
 * Loop seam: the jump between the last and the first sample, against the largest sample-to-sample
 * step the music itself makes in the 2,000 samples on each side of the wrap. A click is a jump
 * far above what the music does there.
 */
async function seam(file: string): Promise<{ jump: number; local: number }> {
	const p = Bun.spawn(
		[FFMPEG, '-v', 'error', '-i', file, '-ac', '1', '-ar', '44100', '-f', 's16le', '-'],
		{ stdout: 'pipe', stderr: 'pipe' },
	);
	const buf = new Uint8Array(await new Response(p.stdout).arrayBuffer());
	await p.exited;
	const x = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
	const W = 2000;
	let local = 0;
	for (let i = 1; i < x.length; i++)
		if (i < W || i > x.length - W)
			local = Math.max(local, Math.abs((x[i] ?? 0) - (x[i - 1] ?? 0)));
	return { jump: Math.abs((x[0] ?? 0) - (x[x.length - 1] ?? 0)), local };
}

const takes: Take[] = AUDIO.filter(
	(a) => LIMITS[a.kind] && (!prefixes.length || prefixes.some((p) => a.key.startsWith(p))),
).flatMap((a) =>
	Array.from({ length: a.takes }, (_, i) => ({
		key: i ? `${a.key}.${i + 1}` : a.key,
		kind: a.kind,
		file: audioFile(a.key, i + 1),
		tier: a.tier,
		seconds: a.seconds,
		fails: [],
	})),
);
// Tier-2 music not generated yet (nothing on disk, the game does not load it) is only reported.
const pending = takes.filter((t) => t.kind !== 'vo' && t.tier === 2 && !existsSync(t.file));
for (const t of pending) takes.splice(takes.indexOf(t), 1);

let next = 0;
await Promise.all(
	Array.from({ length: POOL }, async () => {
		while (next < takes.length) {
			const t = takes[next++];
			if (t) await probe(t);
		}
	}),
);

const failures: string[] = takes.flatMap((t) => t.fails.map((f) => `${t.key}: ${f}`));

// Identical files (a take copied twice, or two lines with the same audio).
const byHash = new Map<string, string[]>();
for (const t of takes) {
	if (!existsSync(t.file)) continue;
	const h = createHash('sha1').update(readFileSync(t.file)).digest('hex');
	byHash.set(h, [...(byHash.get(h) ?? []), t.key]);
}
for (const keys of byHash.values())
	if (keys.length > 1) failures.push(`identical files: ${keys.join(', ')}`);

const seams: string[] = [];
for (const t of takes.filter((x) => x.kind === 'music' && existsSync(x.file))) {
	const s = await seam(t.file);
	seams.push(`${t.key}: jump ${s.jump}, largest step near the wrap ${s.local}`);
	if (s.jump > Math.max(2 * s.local, 1000))
		failures.push(`${t.key}: loop seam click (jump ${s.jump} > 2 × ${s.local})`);
}

// Report: loudness/length per group, sizes per language and first download.
const stat = (xs: number[]): string =>
	xs.length
		? `min ${Math.min(...xs).toFixed(1)} · max ${Math.max(...xs).toFixed(1)} · avg ${(xs.reduce((s, v) => s + v, 0) / xs.length).toFixed(1)}`
		: '-';
const mb = (b: number): string => `${(b / 1024 / 1024).toFixed(2)} MB`;
const groups: Record<string, Take[]> = {
	'vo.pt': takes.filter((t) => t.key.startsWith('vo.pt.')),
	'vo.en': takes.filter((t) => t.key.startsWith('vo.en.')),
	music: takes.filter((t) => t.kind === 'music'),
};
console.log('group  | takes | LUFS | peak dBFS | seconds | size');
for (const [name, ts] of Object.entries(groups)) {
	if (!ts.length) continue;
	const ok = ts.filter((t) => t.lufs !== undefined && Number.isFinite(t.lufs));
	const size = ts.reduce((s, t) => s + (existsSync(t.file) ? statSync(t.file).size : 0), 0);
	console.log(
		`${name} | ${ts.length} | ${stat(ok.map((t) => t.lufs ?? 0))} | ${stat(ok.map((t) => t.peak ?? 0))} | ${stat(ok.map((t) => t.dur ?? 0))} | ${mb(size)}`,
	);
}
for (const s of seams) console.log(`seam ${s}`);
const hot = takes.filter((t) => (t.peak ?? -99) > -1);
console.log(
	`sample peak above −1 dBFS (MP3 overshoot, allowed up to ${PEAK_MAX}): ${hot.length} takes${hot.length ? ` (max ${Math.max(...hot.map((t) => t.peak ?? -99))})` : ''}`,
);
if (pending.length)
	console.log(`not generated yet (tier 2, not loaded): ${pending.map((t) => t.key).join(', ')}`);

const files = readdirSync('public/assets', { recursive: true, withFileTypes: true })
	.filter((e) => e.isFile() && !e.name.startsWith('.'))
	.map((e) =>
		join(e.parentPath, e.name)
			.replace(/\\/g, '/')
			.replace(/^public\//, ''),
	);
const code = existsSync('dist/index.html')
	? readdirSync('dist', { withFileTypes: true })
			.filter((e) => e.isFile())
			.concat(
				readdirSync('dist/assets', { withFileTypes: true }).filter(
					(e) => e.isFile() && /\.(js|css)$/.test(e.name),
				),
			)
			.reduce((s, e) => s + statSync(join(e.parentPath, e.name)).size, 0)
	: 0;
for (const lang of ['pt', 'en']) {
	const first = files
		.filter((f) => loadPhase(f, lang) === 'first')
		.reduce((s, f) => s + statSync(`public/${f}`).size, 0);
	console.log(
		`first download (${lang}): ${mb(first + code)} (assets ${mb(first)} + code ${code ? mb(code) : 'no dist/'})`,
	);
	if (first + code >= FIRST_DOWNLOAD_MAX)
		failures.push(`first download (${lang}) ${mb(first + code)} ≥ 8 MB`);
}

if (failures.length) {
	console.log(`\n${failures.length} failure(s):\n${failures.join('\n')}`);
	process.exit(1);
}
console.log(`\nall ${takes.length} takes pass`);
