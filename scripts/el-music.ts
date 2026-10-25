// Music with the ElevenLabs Music API (docs/audio.md), model music_v2_5 (newest stable music model),
// instrumental. One raw take per key in art-src/elevenlabs/music/<key>/1.mp3, skipped when present;
// scripts/audio-normalize.ts makes it loop (crossfade) and writes public/assets/audio/music/<key>.mp3.
// Never name games, bands or artists in prompts (the API rejects them).
// Usage: bun scripts/el-music.ts [--tier 1|2] [key ...]
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AUDIO, rawFile } from './el-catalog';
import { characterCredits, logAudio, postAudio } from './lib/elevenlabs';

const i = process.argv.indexOf('--tier');
const tier = i >= 0 ? Number(process.argv[i + 1]) : 1;
const wanted = process.argv
	.slice(2)
	.filter((a, n, all) => a !== '--tier' && all[n - 1] !== '--tier');

for (const a of AUDIO) {
	if (a.kind !== 'music' || a.tier > tier) continue;
	if (wanted.length && !wanted.includes(a.key)) continue;
	const out = rawFile(a, 1);
	if (existsSync(out)) continue;
	const before = await characterCredits();
	console.log(`composing ${a.key}…`);
	const audio = await postAudio('/v1/music?output_format=mp3_44100_128', {
		prompt: a.prompt,
		music_length_ms: a.seconds * 1000,
		model_id: 'music_v2_5',
		force_instrumental: true,
	});
	mkdirSync(dirname(out), { recursive: true });
	await Bun.write(out, audio);
	const used = before - (await characterCredits());
	logAudio({
		kind: 'music',
		key: a.key,
		model: 'music_v2_5',
		seconds: a.seconds,
		credits: used,
		prompt: a.prompt,
	});
	console.log(`${a.key}: ${Math.round(audio.byteLength / 1024)} KB, ${used} credits`);
}
