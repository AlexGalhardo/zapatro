/**
 * Lances: how a hand was won (design §2.4, PLAN A2.1). Each has base Chips and Mult and a level
 * that rises during the run (like Balatro's poker hands). Starting values; calibrated by the
 * balance bot (docs/balancing.md). Names in i18n (`lance.<id>`); art key `lance.<id>`.
 */
export const LANCE_IDS = ['limpa', 'virada', 'suada', 'corrida', 'onze', 'ferro', 'queda'] as const;
export type LanceId = (typeof LANCE_IDS)[number];

export interface LanceDef {
	chips: number;
	mult: number;
	/** Added per level above 1. */
	chipsPerLevel: number;
	multPerLevel: number;
}

export const LANCES: Record<LanceId, LanceDef> = {
	limpa: { chips: 10, mult: 1, chipsPerLevel: 10, multPerLevel: 1 },
	virada: { chips: 20, mult: 2, chipsPerLevel: 15, multPerLevel: 1 },
	suada: { chips: 15, mult: 2, chipsPerLevel: 15, multPerLevel: 1 },
	corrida: { chips: 15, mult: 2, chipsPerLevel: 5, multPerLevel: 1 },
	onze: { chips: 30, mult: 3, chipsPerLevel: 20, multPerLevel: 2 },
	ferro: { chips: 40, mult: 4, chipsPerLevel: 25, multPerLevel: 2 },
	queda: { chips: 50, mult: 5, chipsPerLevel: 25, multPerLevel: 2 },
};
