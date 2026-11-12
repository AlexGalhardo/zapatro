import type { RunMode } from './championships';

/**
 * Bosses (design §3.6, PLAN A4.5): the third table of each Championship has a named rival and a
 * special rule. Championships 1–7 draw from the pool; the Rei do Truco is fixed at 8. Rules are
 * read by `Match` (src/game/match.ts), the scoring and the table scene. Art `boss.<id>`; texts
 * in i18n (`boss.<id>.name|rule`).
 */
export const BOSS_POOL = [
	'valentao',
	'cartomante',
	'juiz',
	'agiota',
	'tony',
	'stuart',
	'peter',
	'sortuda',
] as const;
export const FINAL_BOSS = 'reiDoTruco';
export type BossId = (typeof BOSS_POOL)[number] | typeof FINAL_BOSS;

/**
 * O Delegado: ×Mult of the Corrida Lance. The design says 0, but Corrida is most of the hands a
 * team wins, so 0 made the table a coin flip on the clock (docs/balancing.md, A5).
 */
export const TONY_CORRIDA_X = 0.5;

/** A Sortuda: chance that the vira makes a rival card a manilha. */
export const SORTUDA_CHANCE = 0.35;

/** Agiota: money lost per hand the player's team loses. */
export const AGIOTA_FINE = 1;

/**
 * Bosses left out of the 1v1 run (R3.4): Peter's rule is about the signals with your partner, and
 * the 1v1 table has neither. The Judge disables your leftmost Manha, so he is out while the shop
 * sells trinkets only (`src/logic/run/run.ts`, `bossPool`).
 */
export const BOSSES_NOT_1V1: readonly BossId[] = ['peter'];
export const BOSSES_NEED_MANHAS: readonly BossId[] = ['juiz'];

/** The i18n key of a boss rule; two bosses name "the rivals", so the 1v1 run has its own text. */
export const bossRuleKey = (id: BossId, mode: RunMode): string =>
	mode === '1v1' && (id === 'valentao' || id === 'sortuda')
		? `boss.${id}.rule1v1`
		: `boss.${id}.rule`;
