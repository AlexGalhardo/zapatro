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
