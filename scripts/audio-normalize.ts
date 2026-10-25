// Audio post-processing (docs/audio.md): reads every raw ElevenLabs take in art-src/elevenlabs and
// writes the file the game loads (scripts/el-catalog.ts → audioFile). Idempotent: always starts
// from the raw take. Steps per kind:
// - sfx/ui/vo: trim leading/trailing silence, mono, 15 ms fade-out;
// - music (≥ 30 s): made loopable by crossfading its tail into its head (2 s), stereo;
// - amb (30 s loops): the same crossfade, because a take can come back with faded ends (amb.reiDoTruco
//   dipped to −83 dB at the seam every 30 s), mono;
// then a static gain to the kind's target (EBU R128 integrated loudness (sfx −16, ui −20, music −18, amb −30,
// vo −16 LUFS) with a −1 dBFS limiter, and MP3 at a bitrate chosen for the < 8 MB web budget.
// Usage: bun scripts/audio-normalize.ts [--report] [key-prefix ...]   (ffmpeg on PATH or FFMPEG=)
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { AUDIO, type AudioKind, audioFile, rawFile, TARGET_LUFS } from './el-catalog';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const TRUE_PEAK = -1;
const LOOP_XFADE = 2;
const TMP = 'art-src/elevenlabs/.tmp.wav';
const TMP2 = 'art-src/elevenlabs/.tmp2.wav';
const report = process.argv.includes('--report');
const prefixes = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const BITRATE: Record<AudioKind, { rate: string; channels: number }> = {
	sfx: { rate: '96k', channels: 1 },
	ui: { rate: '96k', channels: 1 },
	vo: { rate: '64k', channels: 1 },
	amb: { rate: '64k', channels: 1 },
	music: { rate: '96k', channels: 2 },
};

async function run(args: string[]): Promise<string> {
	const p = Bun.spawn([FFMPEG, '-hide_banner', '-nostats', ...args], {
		stderr: 'pipe',
		stdout: 'pipe',
	});
	const err = await new Response(p.stderr).text();
	if ((await p.exited) !== 0) throw new Error(`ffmpeg failed: ${err.slice(-400)}`);
	return err;
}

async function duration(file: string): Promise<number> {
	const err = await run(['-i', file, '-f', 'null', '-']);
	let last = 0;
	for (const x of err.matchAll(/time=(\d+):(\d+):([\d.]+)/g))
		last = Number(x[1]) * 3600 + Number(x[2]) * 60 + Number(x[3]);
	return last;
}

/** Trims silence at both ends, relative to the take's own peak (quiet takes keep their tails). */
async function trimSilence(src: string, out: string): Promise<void> {
	const vd = await run(['-i', src, '-af', 'volumedetect', '-f', 'null', '-']);
	const peak = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(vd)?.[1] ?? 0);
	const silence = `silenceremove=start_periods=1:start_threshold=${peak - 50}dB`;
	await run(['-y', '-i', src, '-af', `${silence},areverse,${silence},areverse`, out]);
}

/** Kind-specific shaping into the temporary WAV `TMP`. */
async function shape(raw: string, kind: AudioKind): Promise<void> {
	if (kind === 'music' || kind === 'amb') {
		// An ambience take can come back with faded ends: trim them so the crossfade joins sound.
		if (kind === 'amb') await trimSilence(raw, TMP2);
		const src = kind === 'amb' ? TMP2 : raw;
		const len = await duration(src);
		if (len >= 30) {
			// y = crossfade(tail → head) + x[f, L−f]: the end of y flows into its own start.
			const f = LOOP_XFADE;
			await run([
				'-y',
				'-i',
				src,
				'-filter_complex',
				'[0:a]asplit=3[a][b][c];' +
					`[a]atrim=${len - f}:${len},asetpts=PTS-STARTPTS,afade=t=out:d=${f}[tail];` +
					`[b]atrim=0:${f},asetpts=PTS-STARTPTS,afade=t=in:d=${f}[head];` +
					'[tail][head]amix=inputs=2:normalize=0[x];' +
					`[c]atrim=${f}:${len - f},asetpts=PTS-STARTPTS[body];` +
					'[x][body]concat=n=2:v=0:a=1[out]',
				'-map',
				'[out]',
				TMP,
			]);
		} else await run(['-y', '-i', src, TMP]);
		if (existsSync(TMP2)) rmSync(TMP2);
		return;
	}
	await trimSilence(raw, TMP2);
	const len = await duration(TMP2);
	await run(['-y', '-i', TMP2, '-af', `afade=t=out:st=${Math.max(0, len - 0.015)}:d=0.015`, TMP]);
	rmSync(TMP2);
}

/**
 * Integrated loudness (LUFS). Short sounds (< 3 s) are measured looped to 3 s: EBU R128 gates on
 * 400 ms blocks, so a 0.2 s click alone would read −inf.
 */
async function loudness(file: string): Promise<number> {
	const out = await run([
		'-stream_loop',
		'-1',
		'-t',
		String(Math.max(3, await duration(file))),
		'-i',
		file,
		'-af',
		'ebur128=framelog=quiet',
		'-f',
		'null',
		'-',
	]);
	const m = /I:\s+(-?[\d.]+|-inf) LUFS/.exec(out.slice(out.lastIndexOf('Summary')));
	return Number(m?.[1] ?? Number.NaN);
}

const rows: string[] = [];
for (const a of AUDIO) {
	if (prefixes.length && !prefixes.some((p) => a.key.startsWith(p))) continue;
	for (let n = 1; n <= a.takes; n++) {
		const src = rawFile(a, n);
		if (!existsSync(src)) continue;
		const target = TARGET_LUFS[a.kind];
		await shape(src, a.kind);
		const before = await loudness(TMP);
		if (report || !Number.isFinite(before)) {
			rows.push(
				`${a.key} #${n}: ${before.toFixed(1)} LUFS${report ? '' : ' (silent? skipped)'}`,
			);
			continue;
		}
		const dst = audioFile(a.key, n);
		mkdirSync(dirname(dst), { recursive: true });
		const b = BITRATE[a.kind];
		// Static gain to the target, then a limiter for the peak ceiling. The limiter eats some
		// loudness on transient-heavy sounds, so a second pass corrects by the measured miss.
		let gain = target - before;
		let after = before;
		for (let pass = 0; pass < 3; pass++) {
			await run([
				'-y',
				'-i',
				TMP,
				'-af',
				`volume=${gain.toFixed(2)}dB,alimiter=limit=${10 ** (TRUE_PEAK / 20)}:level=false:attack=1:release=50`,
				'-ar',
				'44100',
				'-ac',
				String(b.channels),
				'-b:a',
				b.rate,
				dst,
			]);
			after = await loudness(dst);
			if (Math.abs(after - target) <= 1) break;
			gain += Math.min(6, target - after);
		}
		rows.push(`${a.key} #${n}: ${before.toFixed(1)} → ${after.toFixed(1)} LUFS`);
	}
}
if (existsSync(TMP)) rmSync(TMP);
console.log(rows.join('\n') || 'no raw takes found');
