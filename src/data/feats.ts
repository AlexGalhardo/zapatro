import type { CompanionId } from './companions';
import type { DeckId } from './decks';

/**
 * Feats and unlocks (design §6, PLAN B2.3): variety, never power (D-11). Checked at the end of a
 * hand, a table and a run (src/logic/meta.ts). Names in i18n (`feat.<id>.name|desc`); art
 * `trophy.<id>` (Steam achievements mirror them, B5.1).
 */
export type FeatRule =
	| { on: 'hand'; k: 'points'; n: number }
	| { on: 'hand'; k: 'bet12' | 'iron' | 'weakWin' | 'bluffWin' | 'queda' | 'virada' | 'onze' }
	| { on: 'table'; k: 'perfect' | 'boss' }
	| { on: 'table'; k: 'bossId'; id: string }
	| { on: 'run'; k: 'champ'; n: number }
	| { on: 'run'; k: 'won' }
	| { on: 'run'; k: 'wonWith'; partner: CompanionId }
	| { on: 'run'; k: 'wonDeck'; deck: DeckId }
	| { on: 'run'; k: 'wonStake'; n: number }
	| { on: 'run'; k: 'endless'; n: number }
	| { on: 'run'; k: 'money'; n: number }
	| { on: 'run'; k: 'legendary' }
	| { on: 'run'; k: 'deckAtMost' | 'deckAtLeast'; n: number }
	| { on: 'life'; k: 'handsWon' | 'trucosCalled' | 'bluffsWon' | 'runs'; n: number };

export interface FeatDef {
	id: string;
	rule: FeatRule;
	/** Content it unlocks: `deck:<id>`, `partner:<id>`. */
	unlocks?: string;
}

export const FEATS: readonly FeatDef[] = [
	{ id: 'primeiraMao', rule: { on: 'hand', k: 'points', n: 1 } },
	{ id: 'cemPontos', rule: { on: 'hand', k: 'points', n: 100 } },
	{ id: 'milPontos', rule: { on: 'hand', k: 'points', n: 1000 } },
	{ id: 'dezMil', rule: { on: 'hand', k: 'points', n: 10000 } },
	{ id: 'doze', rule: { on: 'hand', k: 'bet12' } },
	{ id: 'ferro', rule: { on: 'hand', k: 'iron' }, unlocks: 'deck:viciado' },
	{ id: 'lixo', rule: { on: 'hand', k: 'weakWin' }, unlocks: 'deck:interior' },
	{ id: 'blefe', rule: { on: 'hand', k: 'bluffWin' }, unlocks: 'deck:blefe' },
	{ id: 'queda', rule: { on: 'hand', k: 'queda' } },
	{ id: 'virada', rule: { on: 'hand', k: 'virada' } },
	{ id: 'onze', rule: { on: 'hand', k: 'onze' } },
	{ id: 'mesaPerfeita', rule: { on: 'table', k: 'perfect' } },
	{ id: 'chefe', rule: { on: 'table', k: 'boss' } },
	{ id: 'valentao', rule: { on: 'table', k: 'bossId', id: 'valentao' } },
	{ id: 'stuart', rule: { on: 'table', k: 'bossId', id: 'stuart' } },
	{ id: 'sortuda', rule: { on: 'table', k: 'bossId', id: 'sortuda' } },
	{ id: 'campeonato2', rule: { on: 'run', k: 'champ', n: 2 } },
	{ id: 'campeonato4', rule: { on: 'run', k: 'champ', n: 4 }, unlocks: 'partner:nino' },
	{ id: 'campeonato6', rule: { on: 'run', k: 'champ', n: 6 } },
	{ id: 'reiDoTruco', rule: { on: 'run', k: 'won' } },
	{ id: 'comBruto', rule: { on: 'run', k: 'wonWith', partner: 'bruto' } },
	{ id: 'comCida', rule: { on: 'run', k: 'wonWith', partner: 'cida' } },
	{ id: 'comZe', rule: { on: 'run', k: 'wonWith', partner: 'jhony' } },
	{ id: 'comNino', rule: { on: 'run', k: 'wonWith', partner: 'nino' } },
	{ id: 'doInterior', rule: { on: 'run', k: 'wonDeck', deck: 'interior' } },
	{ id: 'doDinheiro', rule: { on: 'run', k: 'wonDeck', deck: 'dinheiro' } },
	{ id: 'estaca4', rule: { on: 'run', k: 'wonStake', n: 4 } },
	{ id: 'estaca8', rule: { on: 'run', k: 'wonStake', n: 8 } },
	{ id: 'infinito', rule: { on: 'run', k: 'endless', n: 10 } },
	{ id: 'rico', rule: { on: 'run', k: 'money', n: 30 }, unlocks: 'deck:dinheiro' },
	{ id: 'lendario', rule: { on: 'run', k: 'legendary' } },
	{ id: 'baralhoMagro', rule: { on: 'run', k: 'deckAtMost', n: 25 } },
	{ id: 'baralhoGordo', rule: { on: 'run', k: 'deckAtLeast', n: 50 } },
	{ id: 'cemMaos', rule: { on: 'life', k: 'handsWon', n: 100 } },
	{ id: 'trucador', rule: { on: 'life', k: 'trucosCalled', n: 100 } },
	{ id: 'mentiroso', rule: { on: 'life', k: 'bluffsWon', n: 5 }, unlocks: 'partner:jhony' },
	{ id: 'fregues', rule: { on: 'life', k: 'runs', n: 10 } },
];

/** Unlocked from the first run. */
export const DEFAULT_UNLOCKS = [
	'deck:normal',
	'partner:bruto',
	'partner:cida',
	'partner:ze',
	'partner:mia',
	'partner:chico',
	'partner:beti',
	'partner:ayla',
	'partner:sheila',
] as const;
