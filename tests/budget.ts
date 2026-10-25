/**
 * Timeouts for the simulation tests, which prove correctness over many hands or matches, not
 * speed (speed has its own test: "a decision takes well under 5 ms"). The timeout only has to
 * catch a hang, so it grows with the work. The gates also run while QA browsers, builds and asset
 * batches saturate the CPU, and the 5 s default then failed at random. Measured on 2026-10-25 with
 * the CPU at 90–100 %: a random-play hand (PA1.8) took up to ~13 ms of wall clock (~0.8 ms of CPU;
 * the cost stays linear over 10,000 hands), an AI match up to ~775 ms (A2.3, ~21 hands each).
 * The budgets below are a few times those worst cases.
 */
export const MS_PER_HAND = 30;
export const MS_PER_MATCH = 3000;

export function workTimeout(units: number, msPerUnit: number): number {
	return Math.max(5000, units * msPerUnit);
}
