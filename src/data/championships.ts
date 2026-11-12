import type { AiProfileId } from './ai-profiles';

/**
 * Championships and table goals (design §3.1–3.2, PLAN A2.3/A4.1). Starting values; calibrated by
 * the balance bot (docs/balancing.md). Names in i18n (`champ.<id>`); backgrounds `bg.<id>`.
 */
export const CHAMPIONSHIPS = [
	'botecoBairro',
	'barDeEstrada',
	'quermesse',
	'clube',
	'festaDoPeao',
	'regional',
	'estadual',
	'reiDoTruco',
] as const;
export type ChampionshipId = (typeof CHAMPIONSHIPS)[number];

/**
 * ~×1.27 per Championship (A5, D-60). Doubled on 2026-10-28 from 105 · 135 · … · 560:
 * a human was clearing tables too easily, so the good bot is allowed to win less (band 5–20%).
 * Every table goal, Stake and endless goal derives from these; `tableGoal` still rounds.
 */
export const CHAMPIONSHIP_GOALS = [210, 270, 350, 430, 560, 700, 880, 1120] as const;

/** The two kinds of run (D-77): dupla 2×2 with an AI partner, or mano a mano 1×1 playing alone. */
export const RUN_MODES = ['2v2', '1v1'] as const;
export type RunMode = (typeof RUN_MODES)[number];

/**
 * Goals of the 1v1 run (R3.3). A trick has 2 cards instead of 4, but halving the 2×2 table was far
 * too easy (the good bot won 38%): the Mult, not the Chips, makes most of a hand, and a duel is
 * decided in fewer, sharper hands. About ×1.14 of the 2×2 goals puts the good bot at ~10% of the
 * runs (band 5–20%, docs/balancing.md). `TABLE_GOAL_MULT` and the endless growth are shared.
 */
export const CHAMPIONSHIP_GOALS_1V1 = [240, 310, 400, 490, 640, 800, 1000, 1280] as const;

/** Endless mode (after Championship 8): each Championship multiplies the last goal by this. */
export const ENDLESS_GOAL_GROWTH = 1.4;

export const TABLE_SIZES = ['small', 'big', 'boss'] as const;
export type TableSize = (typeof TABLE_SIZES)[number];

export const TABLE_GOAL_MULT: Record<TableSize, number> = { small: 1, big: 1.5, boss: 2 };

/**
 * Rival profiles drawn per Championship (difficulty curve): early tables face cautious rivals,
 * the escalating and professional ones come later. Index = Championship − 1 (endless: last).
 */
export const RIVAL_POOLS: readonly (readonly AiProfileId[])[] = [
	['coward', 'rookie'],
	['coward', 'rookie', 'calculator'],
	['rookie', 'calculator', 'coward'],
	['calculator', 'bluffer', 'rookie'],
	['calculator', 'bluffer', 'bully'],
	['bluffer', 'bully', 'pro'],
	['bully', 'pro', 'calculator'],
	['pro', 'bully', 'bluffer'],
];

/**
 * The rivals beat you at a table the second time they reach 12 tentos (a rival Queda resets only
 * their tentos). Reaching 12 yourself closes a Queda: both pairs go back to 0 tentos.
 */
export const QUEDAS_TO_LOSE = 2;
