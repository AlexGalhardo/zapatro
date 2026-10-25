/**
 * AI profiles (PLAN PA2.3, design §5.4). Numbers are starting points; the tournament and the
 * balance bot calibrate them (docs/balancing.md).
 */
export interface AiProfile {
	id: string;
	/** Willingness to accept a call: lowers the win chance needed to accept (0–1). */
	courage: number;
	/** Willingness to call/raise with a good hand: lowers the needed win chance (0–1). */
	aggression: number;
	/** Chance to call truco with a weak hand (bluff) when allowed. */
	bluff: number;
	/** How much the player's Fame shifts the reading of a call (0 = ignores it). */
	fameWeight: number;
	/** Chance to take a random legal action instead of the best one. */
	error: number;
	/** Chance to catch a rival's signal. */
	catchChance: number;
	/** Chance to send an honest signal to the partner at the start of a hand. */
	signalRate: number;
}

const p = (
	id: string,
	courage: number,
	aggression: number,
	bluff: number,
	fameWeight: number,
	error: number,
	catchChance: number,
	signalRate: number,
): AiProfile => ({ id, courage, aggression, bluff, fameWeight, error, catchChance, signalRate });

export const AI_PROFILES = {
	coward: p('coward', 0.1, 0.1, 0.03, 0.4, 0.05, 0.15, 0.6),
	bully: p('bully', 0.8, 0.8, 0.2, 0.3, 0.06, 0.15, 0.6),
	calculator: p('calculator', 0.45, 0.45, 0.02, 0.8, 0.02, 0.25, 0.8),
	bluffer: p('bluffer', 0.55, 0.6, 0.35, 0.4, 0.06, 0.2, 0.5),
	rookie: p('rookie', 0.5, 0.5, 0.1, 0.1, 0.25, 0.1, 0.4),
	pro: p('pro', 0.5, 0.55, 0.12, 0.9, 0.01, 0.3, 0.9),
} as const satisfies Record<string, AiProfile>;

export type AiProfileId = keyof typeof AI_PROFILES;
export const AI_PROFILE_IDS = Object.keys(AI_PROFILES) as AiProfileId[];

/** Monte Carlo samples per decision (PLAN §9: < 5 ms p99). */
export const AI_SAMPLES = 40;
