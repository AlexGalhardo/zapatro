// Voice barks in PT-BR (D-30, docs/audio.md). Per character: designs a voice from its description
// (Voice Design, eleven_ttv_v3), saves it (uses one voice slot), speaks every line of
// scripts/el-catalog.ts with Eleven v4 (Text to Dialogue, the newest TTS model) using a different
// audio tag per take, then deletes the voice to free the slot. Raw takes:
// art-src/elevenlabs/vo/<key>/<n>.mp3 (skipped when present); normalize with audio-normalize.ts.
// Usage: bun scripts/el-voices.ts [char ...]
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AUDIO, rawFile, VOICES } from './el-catalog';
import { characterCredits, logAudio, postAudio, postJson } from './lib/elevenlabs';

/** Audio tags (Eleven v4 delivery) per line; take n uses tag n. */
const TAGS: Record<string, string[]> = {
	truco: ['[shouting]', '[excited]', '[laughing]'],
	seis: ['[shouting]', '[defiant]'],
	nove: ['[shouting]', '[confident]'],
	doze: ['[shouting]', '[triumphant]'],
	bora: ['[excited]', '[defiant]'],
	corre: ['[disappointed]', '[sighs]'],
	caiu: ['[triumphant]', '[laughing]'],
	oloco: ['[surprised]', '[laughing]'],
};

const SAMPLE =
	'Truco! Seis! Nove! Doze! Bora, desce essa carta! Tô fora, essa mão não é minha. Caiu! Ô loco, meu! Que jogo bom de truco nesse boteco, hein?';

const wanted = process.argv.slice(2);
const headers = (): Record<string, string> => ({
	'xi-api-key': process.env.ELEVENLABS_API_KEY ?? '',
});

const before = await characterCredits();
for (const [char, description] of Object.entries(VOICES)) {
	if (wanted.length && !wanted.includes(char)) continue;
	const lines = AUDIO.filter((a) => a.kind === 'vo' && a.voice === char);
	const missing = lines.flatMap((a) =>
		Array.from({ length: a.takes }, (_, i) => ({ a, n: i + 1 })).filter(
			({ a, n }) => !existsSync(rawFile(a, n)),
		),
	);
	if (!missing.length) continue;

	const design = (await postJson('/v1/text-to-voice/design?output_format=mp3_44100_128', {
		voice_description: `${description}. Speaks Brazilian Portuguese.`,
		model_id: 'eleven_ttv_v3',
		text: SAMPLE,
		seed: 7,
	})) as { previews: { generated_voice_id: string; audio_base_64: string }[] };
	const preview = design.previews[0];
	if (!preview) throw new Error(`${char}: no voice preview`);
	const sample = `art-src/elevenlabs/vo/_design/${char}.mp3`;
	mkdirSync(dirname(sample), { recursive: true });
	await Bun.write(sample, Buffer.from(preview.audio_base_64, 'base64'));
	const voice = (await postJson('/v1/text-to-voice', {
		voice_name: `truco-${char}`,
		voice_description: description,
		generated_voice_id: preview.generated_voice_id,
	})) as { voice_id: string };
	try {
		for (const { a, n } of missing) {
			const line = a.key.split('.')[2] as string;
			const tag = TAGS[line]?.[n - 1] ?? '';
			const audio = await postAudio('/v1/text-to-dialogue?output_format=mp3_44100_128', {
				inputs: [{ text: `${tag} ${a.prompt}`.trim(), voice_id: voice.voice_id }],
				model_id: 'eleven_v4',
				language_code: 'pt',
			});
			const out = rawFile(a, n);
			mkdirSync(dirname(out), { recursive: true });
			await Bun.write(out, audio);
			logAudio({
				kind: 'vo',
				key: a.key,
				take: n,
				model: 'eleven_v4',
				text: `${tag} ${a.prompt}`,
			});
			console.log(`ok ${a.key} #${n}`);
		}
	} finally {
		await fetch(`https://api.elevenlabs.io/v1/voices/${voice.voice_id}`, {
			method: 'DELETE',
			headers: headers(),
		});
	}
}
console.log(`credits used: ${before - (await characterCredits())}`);
