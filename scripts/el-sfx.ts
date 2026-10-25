// Sound effects and ambience loops with ElevenLabs (docs/audio.md), model eleven_text_to_sound_v2
// (the newest sound model; ambiences use its seamless `loop`). Resumable: each raw take goes to
// art-src/elevenlabs/<kind>/<key>/<n>.mp3 and is skipped when present. Then run
// scripts/audio-normalize.ts to write the game files.
// Usage: bun scripts/el-sfx.ts [--tier 1|2] [key-prefix ...]
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AUDIO, rawFile } from './el-catalog';
import { characterCredits, logAudio, soundEffect } from './lib/elevenlabs';

const i = process.argv.indexOf('--tier');
const tier = i >= 0 ? Number(process.argv[i + 1]) : 1;
const prefixes = process.argv
	.slice(2)
	.filter((a, n, all) => a !== '--tier' && all[n - 1] !== '--tier');

const STYLE = 'clean close-mic foley for a cozy card game, no music, no voice';
const before = await characterCredits();
for (const a of AUDIO) {
	if (!['sfx', 'ui', 'amb'].includes(a.kind) || a.tier > tier) continue;
	if (prefixes.length && !prefixes.some((p) => a.key.startsWith(p))) continue;
	for (let n = 1; n <= a.takes; n++) {
		const out = rawFile(a, n);
		if (existsSync(out)) continue;
		const amb = a.kind === 'amb';
		const audio = await soundEffect({
			text: amb ? a.prompt : `${a.prompt}. ${STYLE}`,
			durationSeconds: a.seconds,
			promptInfluence: amb ? 0.4 : 0.6,
			loop: amb,
		});
		mkdirSync(dirname(out), { recursive: true });
		await Bun.write(out, audio);
		logAudio({ kind: a.kind, key: a.key, take: n, seconds: a.seconds, prompt: a.prompt });
		console.log(`ok ${a.key} #${n}`);
	}
}
const after = await characterCredits();
console.log(`credits used: ${before - after} (left ${after})`);
