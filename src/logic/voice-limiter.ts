/**
 * Decides whether a sound may start now: at most `maxVoices` overlapping instances
 * of the same key and a minimum interval between two starts.
 */
export class VoiceLimiter {
	private readonly active = new Map<string, number[]>();
	private readonly lastStart = new Map<string, number>();

	constructor(private readonly minIntervalMs: number) {}

	/** Returns true (and records the voice) if the sound can play at `nowMs`. */
	tryStart(key: string, nowMs: number, durationMs: number, maxVoices: number): boolean {
		const last = this.lastStart.get(key);
		if (last !== undefined && nowMs - last < this.minIntervalMs) return false;
		const ends = (this.active.get(key) ?? []).filter((end) => end > nowMs);
		if (ends.length >= maxVoices) {
			this.active.set(key, ends);
			return false;
		}
		ends.push(nowMs + durationMs);
		this.active.set(key, ends);
		this.lastStart.set(key, nowMs);
		return true;
	}
}

/** Playback rate with a random pitch variation of ±variation (roll in [0, 1)). */
export function pitchRate(variation: number, roll: number): number {
	return 1 + (roll * 2 - 1) * variation;
}
