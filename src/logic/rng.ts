/**
 * Seeded PRNG (mulberry32). All gameplay randomness must go through an Rng
 * so runs can be reproduced with ?seed=N.
 */
export class Rng {
	private state: number;

	constructor(seed: number) {
		this.state = seed >>> 0;
	}

	/** Current position: `new Rng(rng.position)` continues the same sequence (saves). */
	get position(): number {
		return this.state;
	}

	/** Float in [0, 1). */
	next(): number {
		this.state = (this.state + 0x6d2b79f5) >>> 0;
		let t = this.state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/** Float in [min, max). */
	range(min: number, max: number): number {
		return min + (max - min) * this.next();
	}

	/** Integer in [min, max] (inclusive). */
	int(min: number, max: number): number {
		return Math.floor(this.range(min, max + 1));
	}

	chance(probability: number): boolean {
		return this.next() < probability;
	}

	pick<T>(items: readonly T[]): T {
		if (items.length === 0) throw new Error('Rng.pick: empty array');
		return items[Math.floor(this.next() * items.length)] as T;
	}

	/** Fisher–Yates shuffle into a new array (the input is left untouched). */
	shuffle<T>(items: readonly T[]): T[] {
		const a = [...items];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(this.next() * (i + 1));
			[a[i], a[j]] = [a[j] as T, a[i] as T];
		}
		return a;
	}

	/** Picks an index proportionally to non-negative weights. */
	weightedIndex(weights: readonly number[]): number {
		const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
		if (total <= 0) throw new Error('Rng.weightedIndex: no positive weight');
		let roll = this.next() * total;
		for (let i = 0; i < weights.length; i++) {
			roll -= Math.max(0, weights[i] ?? 0);
			if (roll < 0) return i;
		}
		return weights.length - 1;
	}
}

/** Seed derived from the current time, for runs without ?seed. */
export function randomSeed(): number {
	return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}
