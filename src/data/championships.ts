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
 * ~×1.27 per Championship (A5, D-60). Doubled on 2026-10-25, later cut back while calibrating,
 * then tripled on 2026-10-28 (tables were too short). Every table goal, Stake and endless goal
 * derives from these; `tableGoal` still rounds base × size.
 */
export const CHAMPIONSHIP_GOALS = [315, 405, 525, 645, 840, 1050, 1320, 1680] as const;

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
