// Minimal ElevenLabs client (https://elevenlabs.io/docs/api-reference). Key: ELEVENLABS_API_KEY in
// .env (worktrees read the main checkout's .env via scripts/pl-env.ts). Never print the key.
import '../pl-env';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = 'https://api.elevenlabs.io';
export const EL_LOG_FILE = 'art-src/elevenlabs/log.jsonl';

function key(): string {
	const k = process.env.ELEVENLABS_API_KEY;
	if (!k) throw new Error('ELEVENLABS_API_KEY missing in .env');
	return k;
}

/** POST returning the raw body; retries 5xx/429 with backoff. */
export async function postAudio(path: string, body: unknown): Promise<ArrayBuffer> {
	for (let attempt = 0; ; attempt++) {
		const res = await fetch(`${BASE}${path}`, {
			method: 'POST',
			headers: { 'xi-api-key': key(), 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (res.ok) return res.arrayBuffer();
		const text = await res.text();
		if ((res.status < 500 && res.status !== 429) || attempt >= 3)
			throw new Error(`ElevenLabs ${res.status} ${path}: ${text.slice(0, 400)}`);
		await Bun.sleep(2000 * 2 ** attempt);
	}
}

/** POST returning JSON (voice design endpoints); same retry policy as postAudio. */
export async function postJson(path: string, body: unknown): Promise<unknown> {
	const bytes = await postAudio(path, body);
	return JSON.parse(new TextDecoder().decode(bytes));
}

/** Credits left in the current billing cycle (character_limit − character_count). */
export async function characterCredits(): Promise<number> {
	const res = await fetch(`${BASE}/v1/user/subscription`, { headers: { 'xi-api-key': key() } });
	if (!res.ok) throw new Error(`ElevenLabs ${res.status} /v1/user/subscription`);
	const s = (await res.json()) as { character_count: number; character_limit: number };
	return s.character_limit - s.character_count;
}

export interface SfxRequest {
	text: string;
	durationSeconds?: number;
	promptInfluence?: number;
	loop?: boolean;
}

export function soundEffect(req: SfxRequest): Promise<ArrayBuffer> {
	return postAudio('/v1/sound-generation?output_format=mp3_44100_128', {
		text: req.text,
		duration_seconds: req.durationSeconds,
		prompt_influence: req.promptInfluence ?? 0.5,
		loop: req.loop ?? false,
		model_id: 'eleven_text_to_sound_v2',
	});
}

export function logAudio(entry: Record<string, unknown>): void {
	mkdirSync(dirname(EL_LOG_FILE), { recursive: true });
	appendFileSync(EL_LOG_FILE, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}
