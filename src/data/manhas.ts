import type { Rank, Suit } from '../logic/truco/cards';
import type { LanceId } from './lances';

/**
 * Manhas (the jokers; design §4.2, PLAN A3). Data only: the engine (`src/logic/score/manhas.ts`)
 * reads `when`, `per` and `effect`. They fire left to right. Chips/Mult only count in a won hand;
 * money counts either way. Names and texts in i18n (`manha.<id>.name|desc|why`); art `manha.<id>`.
 * Starting values; calibrated by the balance bot (docs/balancing.md).
 */
export type ManhaTag =
	| 'BLEFE'
	| 'MANILHA'
	| 'APOSTA'
	| 'PERDA'
	| 'VAZA-1'
	| 'VAZA-2'
	| 'VAZA-3'
	| 'PARCEIRO'
	| 'OURO'
	| 'SINAL';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** Hand-level condition (all must hold). */
export type ManhaWhen =
	/** You (seat 0) called or raised truco without holding a manilha. */
	| { k: 'calledNoManilha' }
	| { k: 'firstTrickLost' }
	| { k: 'lostFirstWonThird' }
	| { k: 'betAtLeast'; bet: number }
	/** A rival ran and you held no manilha. */
	| { k: 'rivalFoldedNoManilha' }
	/** You hold the ZAP: the clubs card two ranks above the vira (`isZap`, PLAN §5.2). */
	| { k: 'holdsZap' }
	| { k: 'lance'; lance: LanceId }
	| { k: 'anyTie' }
	/** Your team won the hand. */
	| { k: 'won' }
	| { k: 'lost' }
	/** Your team ran from a call. */
	| { k: 'weFolded' }
	/** The rivals ran (from any call of your team). */
	| { k: 'rivalFolded' }
	| { k: 'noTrucoCall' }
	| { k: 'iCalled' }
	| { k: 'partnerCalled' }
	| { k: 'rivalCalled' }
	/** Your team called or raised at least `n` times. */
	| { k: 'ourCalls'; n: number }
	/** Trick `index` (0-based) ended with `result`. */
	| { k: 'trick'; index: number; result: 'us' | 'them' | 'tie' }
	/** Your hand had no manilha, 3, 2 or A. */
	| { k: 'weakHand' }
	| { k: 'noManilha' }
	| { k: 'manilhasHeld'; n: number }
	| { k: 'manilhaRank'; rank: Rank }
	/** You and your partner each won at least one trick. */
	| { k: 'bothWon' };

/** The effect repeats once per trick your team won that matches the filter. */
export interface PerTrickWon {
	/** Only tricks won by this seat's card (`partner` = seat 2). */
	by?: 'partner';
	/** The winning card has one of these ranks. */
	ranks?: readonly Rank[];
	/** The winning card has this suit. */
	suit?: Suit;
	/** The winning card is a manilha. */
	manilha?: boolean;
}

export interface ManhaEffect {
	chips?: number;
	addMult?: number;
	xMult?: number;
	money?: number;
}

/**
 * Manhas that change the table instead of the score (the engine and the scene read them):
 * startBet3 Rei da Mesa · bonusStep Gritador · countManilhas Contador de Cartas · peek Bisbilhoteiro
 * · rigVira Vira Viciada · caraDePau Cara de Pau.
 */
export type ManhaRule =
	| 'startBet3'
	| 'bonusStep'
	| 'countManilhas'
	| 'peek'
	| 'rigVira'
	| 'caraDePau';

export interface ManhaDef {
	id: string;
	rule?: ManhaRule;
	rarity: Rarity;
	price: number;
	tags: readonly ManhaTag[];
	when: readonly ManhaWhen[];
	per?: PerTrickWon;
	effect: ManhaEffect;
}

/** Reads the partner (seat 2): it can never trigger on a two-seat table. */
export const manhaNeedsPartner = (d: ManhaDef): boolean =>
	d.per?.by === 'partner' || d.when.some((w) => w.k === 'partnerCalled' || w.k === 'bothWon');

export const MANHAS = [
	{
		id: 'malandro',
		rarity: 'common',
		price: 4,
		tags: ['BLEFE', 'APOSTA'],
		when: [{ k: 'calledNoManilha' }],
		effect: { addMult: 4 },
	},
	{
		id: 'maoDeLixo',
		rarity: 'common',
		price: 4,
		tags: ['PERDA', 'VAZA-1', 'OURO'],
		when: [{ k: 'firstTrickLost' }],
		effect: { money: 2 },
	},
	{
		id: 'seuZe',
		rarity: 'common',
		price: 5,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { ranks: ['4', '5', '6', '7'] },
		effect: { chips: 15 },
	},
	{
		id: 'maoLeve',
		rarity: 'common',
		price: 4,
		tags: ['OURO'],
		when: [],
		per: { suit: 'diamonds' },
		effect: { money: 1 },
	},
	{
		id: 'ultimaCartada',
		rarity: 'uncommon',
		price: 6,
		tags: ['PERDA', 'VAZA-3'],
		when: [{ k: 'lostFirstWonThird' }],
		effect: { xMult: 2 },
	},
	{
		id: 'sangueFrio',
		rarity: 'uncommon',
		price: 6,
		tags: ['APOSTA'],
		when: [{ k: 'betAtLeast', bet: 6 }],
		effect: { addMult: 8 },
	},
	{
		id: 'duplaDinamica',
		rarity: 'uncommon',
		price: 6,
		tags: ['PARCEIRO'],
		when: [],
		per: { by: 'partner' },
		effect: { addMult: 3 },
	},
	{
		id: 'teatro',
		rarity: 'rare',
		price: 8,
		tags: ['BLEFE'],
		when: [{ k: 'rivalFoldedNoManilha' }],
		effect: { xMult: 3 },
	},
	{
		id: 'zapZap',
		rarity: 'rare',
		price: 8,
		tags: ['MANILHA'],
		when: [{ k: 'holdsZap' }],
		per: {},
		effect: { xMult: 1.5 },
	},
	{
		id: 'ferroQuente',
		rarity: 'legendary',
		price: 10,
		tags: ['MANILHA'],
		when: [{ k: 'lance', lance: 'ferro' }],
		effect: { xMult: 4 },
	},
	{
		id: 'cangaceiro',
		rarity: 'common',
		price: 5,
		tags: ['VAZA-1', 'VAZA-2'],
		when: [{ k: 'anyTie' }],
		effect: { addMult: 8 },
	},
	{
		id: 'peQuente',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1', 'VAZA-2'],
		when: [{ k: 'lance', lance: 'limpa' }],
		effect: { chips: 30 },
	},
	{
		id: 'reviravolta',
		rarity: 'uncommon',
		price: 6,
		tags: ['PERDA', 'VAZA-1'],
		when: [{ k: 'lance', lance: 'virada' }],
		effect: { addMult: 6 },
	},
	{
		id: 'onzeLetras',
		rarity: 'uncommon',
		price: 6,
		tags: ['APOSTA'],
		when: [{ k: 'lance', lance: 'onze' }],
		effect: { xMult: 2 },
	},
	{
		id: 'gritador',
		rarity: 'common',
		price: 5,
		tags: ['APOSTA'],
		rule: 'bonusStep',
		when: [],
		effect: {},
	},
	{
		id: 'contadorDeCartas',
		rarity: 'common',
		price: 4,
		tags: ['MANILHA'],
		rule: 'countManilhas',
		when: [],
		effect: {},
	},
	{
		id: 'caraDePau',
		rarity: 'uncommon',
		price: 6,
		tags: ['BLEFE', 'PERDA'],
		rule: 'caraDePau',
		when: [],
		effect: {},
	},
	{
		id: 'bisbilhoteiro',
		rarity: 'uncommon',
		price: 6,
		tags: ['SINAL'],
		rule: 'peek',
		when: [],
		effect: {},
	},
	{
		id: 'viraViciada',
		rarity: 'rare',
		price: 8,
		tags: ['MANILHA'],
		rule: 'rigVira',
		when: [],
		effect: {},
	},
	{
		id: 'reiDaMesa',
		rarity: 'legendary',
		price: 10,
		tags: ['APOSTA'],
		rule: 'startBet3',
		when: [],
		effect: {},
	},
	{
		id: 'rendaExtra',
		rarity: 'common',
		price: 4,
		tags: ['OURO'],
		when: [{ k: 'won' }, { k: 'noTrucoCall' }],
		effect: { money: 1 },
	},
	{
		id: 'naoDouNada',
		rarity: 'common',
		price: 4,
		tags: ['BLEFE'],
		when: [{ k: 'weakHand' }],
		effect: { chips: 25 },
	},
	{
		id: 'figurao',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { ranks: ['Q', 'J', 'K'] },
		effect: { chips: 12 },
	},
	{
		id: 'coracaoMole',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { suit: 'hearts' },
		effect: { addMult: 2 },
	},
	{
		id: 'espadachim',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { suit: 'spades' },
		effect: { addMult: 2 },
	},
	{
		id: 'pauFerro',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { suit: 'clubs' },
		effect: { chips: 15 },
	},
	{
		id: 'asNaManga',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { ranks: ['A'] },
		effect: { chips: 20 },
	},
	{
		id: 'doisDeOuro',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { ranks: ['2'] },
		effect: { chips: 18 },
	},
	{
		id: 'tresSecos',
		rarity: 'common',
		price: 5,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: { ranks: ['3'] },
		effect: { addMult: 2 },
	},
	{
		id: 'saidaBoa',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-1'],
		when: [{ k: 'trick', index: 0, result: 'us' }],
		effect: { chips: 20 },
	},
	{
		id: 'vazaDoMeio',
		rarity: 'common',
		price: 4,
		tags: ['VAZA-2'],
		when: [{ k: 'trick', index: 1, result: 'us' }],
		effect: { addMult: 3 },
	},
	{
		id: 'humildade',
		rarity: 'common',
		price: 4,
		tags: ['PERDA', 'OURO'],
		when: [{ k: 'weFolded' }],
		effect: { money: 2 },
	},
	{
		id: 'apanhouLevantou',
		rarity: 'common',
		price: 4,
		tags: ['PERDA', 'OURO'],
		when: [{ k: 'lost' }],
		effect: { money: 1 },
	},
	{
		id: 'copoAmericano',
		rarity: 'common',
		price: 4,
		tags: ['APOSTA'],
		when: [{ k: 'lance', lance: 'corrida' }],
		effect: { chips: 25 },
	},
	{
		id: 'olharSerio',
		rarity: 'common',
		price: 4,
		tags: ['APOSTA'],
		when: [{ k: 'iCalled' }],
		effect: { addMult: 2 },
	},
	{
		id: 'desafio',
		rarity: 'common',
		price: 4,
		tags: ['BLEFE', 'OURO'],
		when: [{ k: 'iCalled' }, { k: 'rivalFolded' }],
		effect: { money: 1 },
	},
	{
		id: 'seisMaldito',
		rarity: 'uncommon',
		price: 6,
		tags: ['MANILHA'],
		when: [{ k: 'manilhaRank', rank: '6' }],
		effect: { xMult: 3 },
	},
	{
		id: 'caoDeGuarda',
		rarity: 'uncommon',
		price: 6,
		tags: ['PERDA', 'VAZA-2'],
		when: [
			{ k: 'trick', index: 0, result: 'them' },
			{ k: 'trick', index: 1, result: 'us' },
		],
		effect: { addMult: 6 },
	},
	{
		id: 'contragolpe',
		rarity: 'uncommon',
		price: 6,
		tags: ['VAZA-3'],
		when: [{ k: 'lance', lance: 'suada' }],
		effect: { addMult: 6 },
	},
	{
		id: 'vaiASeis',
		rarity: 'uncommon',
		price: 6,
		tags: ['APOSTA'],
		when: [{ k: 'betAtLeast', bet: 6 }],
		effect: { chips: 40 },
	},
	{
		id: 'parceiroDeAco',
		rarity: 'uncommon',
		price: 6,
		tags: ['PARCEIRO', 'APOSTA'],
		when: [{ k: 'partnerCalled' }],
		effect: { addMult: 4 },
	},
	{
		id: 'confiaEmMim',
		rarity: 'uncommon',
		price: 5,
		tags: ['PARCEIRO'],
		when: [],
		per: { by: 'partner' },
		effect: { chips: 15 },
	},
	{
		id: 'manilhaDeReserva',
		rarity: 'uncommon',
		price: 5,
		tags: ['MANILHA'],
		when: [{ k: 'won' }, { k: 'noManilha' }],
		effect: { addMult: 4 },
	},
	{
		id: 'peitudo',
		rarity: 'uncommon',
		price: 6,
		tags: ['APOSTA'],
		when: [{ k: 'won' }, { k: 'rivalCalled' }],
		effect: { addMult: 6 },
	},
	{
		id: 'caixaDeFosforo',
		rarity: 'uncommon',
		price: 6,
		tags: ['MANILHA', 'OURO'],
		when: [],
		per: { manilha: true },
		effect: { money: 1 },
	},
	{
		id: 'ouTudoOuNada',
		rarity: 'rare',
		price: 8,
		tags: ['APOSTA'],
		when: [{ k: 'betAtLeast', bet: 9 }],
		effect: { xMult: 3 },
	},
	{
		id: 'viraDourada',
		rarity: 'rare',
		price: 8,
		tags: ['MANILHA'],
		when: [],
		per: { manilha: true },
		effect: { xMult: 1.5 },
	},
	{
		id: 'blefeProfissional',
		rarity: 'rare',
		price: 8,
		tags: ['BLEFE'],
		when: [{ k: 'won' }, { k: 'calledNoManilha' }],
		effect: { xMult: 2 },
	},
	{
		id: 'caraDeTacho',
		rarity: 'rare',
		price: 7,
		tags: ['BLEFE', 'PERDA', 'OURO'],
		when: [{ k: 'lost' }, { k: 'iCalled' }],
		effect: { money: 3 },
	},
	{
		id: 'duplaQuasePerfeita',
		rarity: 'rare',
		price: 8,
		tags: ['PARCEIRO'],
		when: [{ k: 'bothWon' }],
		effect: { xMult: 2 },
	},
	{
		id: 'quedaLivre',
		rarity: 'rare',
		price: 8,
		tags: ['APOSTA'],
		when: [{ k: 'lance', lance: 'queda' }],
		effect: { xMult: 2 },
	},
	{
		id: 'trucoDeBoteco',
		rarity: 'rare',
		price: 8,
		tags: ['APOSTA'],
		when: [{ k: 'ourCalls', n: 2 }],
		effect: { xMult: 2 },
	},
	{
		id: 'cartaNaManga',
		rarity: 'rare',
		price: 8,
		tags: ['PERDA'],
		when: [{ k: 'lance', lance: 'virada' }],
		effect: { xMult: 2 },
	},
	{
		id: 'faxina',
		rarity: 'rare',
		price: 8,
		tags: ['VAZA-1', 'VAZA-2'],
		when: [{ k: 'lance', lance: 'limpa' }],
		effect: { xMult: 1.5 },
	},
	{
		id: 'zapDeOuro',
		rarity: 'legendary',
		price: 10,
		tags: ['MANILHA'],
		when: [{ k: 'won' }, { k: 'holdsZap' }],
		effect: { xMult: 3 },
	},
	{
		id: 'maoDeOuro',
		rarity: 'legendary',
		price: 10,
		tags: ['MANILHA'],
		when: [{ k: 'manilhasHeld', n: 2 }],
		effect: { xMult: 4 },
	},
	{
		id: 'dozeOuNada',
		rarity: 'legendary',
		price: 10,
		tags: ['APOSTA'],
		when: [{ k: 'betAtLeast', bet: 12 }],
		effect: { xMult: 5 },
	},
	{
		id: 'lendaDoBoteco',
		rarity: 'legendary',
		price: 10,
		tags: ['VAZA-1', 'VAZA-2', 'VAZA-3'],
		when: [],
		per: {},
		effect: { xMult: 1.5 },
	},
] as const satisfies readonly ManhaDef[];

/** Chance of Vira Viciada; Cara de Pau's scale on the rival's reading. */
export const RIG_VIRA_CHANCE = 0.25;
export const CARA_DE_PAU_SCALE = 0.7;

export type ManhaId = (typeof MANHAS)[number]['id'];

export const MANHA_BY_ID: ReadonlyMap<string, ManhaDef> = new Map(MANHAS.map((m) => [m.id, m]));

export const isManhaId = (id: string): id is ManhaId => MANHA_BY_ID.has(id);

/** Manha slots at the start of a run (design §4.2). */
export const MANHA_SLOTS = 5;
