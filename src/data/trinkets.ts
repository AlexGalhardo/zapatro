import type { Rank, Suit } from '../logic/truco/cards';

/**
 * Trinkets (docs/trinkets.md): the item bought in the shop. Each has a Perk and a Flaw, and exists
 * in four rarities (Normal, Rare, Epic, Legendary) that are the same trinket with bigger numbers:
 * the Perk grows faster than the Flaw. The base (Normal) numbers are written below; the four
 * ready values of every trinket are built once into `TRINKET_VALUES`. Names and texts in i18n
 * (`trinket.<id>.name|bonus|contra`, `{n}` and `{m}` are the values of the rarity shown).
 */
export const TRINKET_LEVELS = [1, 2, 3, 4] as const;
export type TrinketLevel = (typeof TRINKET_LEVELS)[number];
export const TRINKET_RARITY_IDS = ['normal', 'rare', 'epic', 'legendary'] as const;
export type TrinketRarity = (typeof TRINKET_RARITY_IDS)[number];

/** Perk and Flaw multipliers and shop price by level 1–4 (docs/trinkets.md). */
export const PERK_SCALE = [1, 1.6, 2.3, 3.2] as const;
export const FLAW_SCALE = [1, 1.3, 1.6, 2] as const;
export const TRINKET_PRICE = [4, 7, 10, 14] as const;
/** Equipped trinkets per run (one fewer with Zé). */
export const TRINKET_SLOTS = 4;

/** Which tricks an effect counts: the winning card of a trick the pair won. */
export interface TrickFilter {
	/** Only tricks won by the partner (`partner`) or by you (`me`). */
	by?: 'partner' | 'me';
	ranks?: readonly Rank[];
	suit?: Suit;
	manilha?: boolean;
}

/** A hand-level condition. */
export type HandCond =
	| 'always'
	| 'won'
	| 'lost'
	| 'noZapHeld'
	| 'trucoAccepted'
	| 'noTruco'
	| 'bet6'
	| 'bet1'
	| 'firstTwoWon'
	| 'lostFirstWonSecond'
	| 'wonFirst'
	| 'nearGoal'
	| 'farGoal'
	| 'firstHand'
	| 'otherHand'
	| 'bigHand'
	| 'normalHand'
	| 'weakTrucoWin'
	| 'weFolded'
	| 'zapWonTrick';

/** One effect. `n` is the number that grows with the rarity (`x` for ×Mult: only the part over 1). */
export type Fx =
	// Per trick won (score steps)
	| { k: 'trickChips'; f: TrickFilter; n: number }
	| { k: 'trickMult'; f: TrickFilter; n: number }
	| { k: 'trickMoney'; f: TrickFilter; n: number }
	| { k: 'trickX'; f: TrickFilter; x: number }
	// Chips of the cards the pair played in won tricks (a negative `n` takes chips away)
	| {
			k: 'cardChips';
			ranks?: readonly Rank[];
			suit?: Suit;
			manilha?: boolean;
			common?: boolean;
			special?: boolean;
			n: number;
	  }
	// Per hand (score steps)
	| { k: 'handMult'; c: HandCond; n: number }
	| { k: 'handX'; c: HandCond; x: number }
	| { k: 'handChips'; c: HandCond; n: number }
	| { k: 'handChipsPct'; c: HandCond; n: number }
	| { k: 'handMoney'; c: HandCond; n: number }
	| { k: 'baseMult'; n: number }
	| { k: 'perSignal'; n: number }
	| { k: 'jokerOpen'; n: number; m: number }
	| { k: 'perTableWon'; n: number; max: number }
	// Run and table (read by src/logic/run and src/game/run-table.ts)
	| { k: 'goalPct'; n: number }
	| { k: 'goalPctPerChamp'; n: number }
	| { k: 'shopPrice'; n: number }
	| { k: 'speedFlat'; n: number }
	| { k: 'speedX'; x: number }
	| { k: 'interest'; n: number; max: number }
	| { k: 'doubleChance'; p: number }
	| { k: 'startTentos'; n: number }
	| { k: 'startMoney'; n: number }
	| { k: 'loseTento'; n: number }
	| { k: 'rivalCatch'; n: number };

export interface TrinketDef {
	id: string;
	/** Art key (an `icon.<name>`) of its medallion. */
	icon: string;
	/** How much the run bot wants it (1 weak … 3 strong); the bot only. */
	worth: number;
	perk: Fx;
	flaw: Fx;
}

const t = (id: string, icon: string, worth: number, perk: Fx, flaw: Fx): TrinketDef => ({
	id,
	icon,
	worth,
	perk,
	flaw,
});

export const TRINKETS: readonly TrinketDef[] = [
	t(
		'acoNaManga',
		'cards',
		2,
		{ k: 'trickChips', f: { ranks: ['A'] }, n: 20 },
		{ k: 'cardChips', ranks: ['K'], n: -5 },
	),
	t(
		'peDeCoelho',
		'star',
		2,
		{ k: 'trickMult', f: { manilha: true }, n: 3 },
		{ k: 'goalPct', n: 5 },
	),
	t(
		'zapDeOuro',
		'crown',
		3,
		{ k: 'handX', c: 'zapWonTrick', x: 1.5 },
		{ k: 'handMult', c: 'noZapHeld', n: -1 },
	),
	t('copoAmericano', 'coin', 2, { k: 'handMoney', c: 'won', n: 1 }, { k: 'shopPrice', n: 1 }),
	t(
		'baralhoMarcado',
		'cards',
		2,
		{ k: 'trickChips', f: { suit: 'clubs' }, n: 15 },
		{ k: 'cardChips', suit: 'hearts', n: -5 },
	),
	t(
		'coracaoMole',
		'people',
		2,
		{ k: 'trickMult', f: { suit: 'hearts' }, n: 2 },
		{ k: 'cardChips', suit: 'spades', n: -5 },
	),
	t(
		'espadachim',
		'swords',
		2,
		{ k: 'trickMult', f: { suit: 'spades' }, n: 2 },
		{ k: 'cardChips', suit: 'diamonds', n: -5 },
	),
	t(
		'maoLeve',
		'hand',
		1,
		{ k: 'trickMoney', f: { suit: 'diamonds' }, n: 1 },
		{ k: 'handMoney', c: 'lost', n: -1 },
	),
	t(
		'tresSecos',
		'star',
		2,
		{ k: 'trickMult', f: { ranks: ['3'] }, n: 3 },
		{ k: 'cardChips', ranks: ['2'], n: -10 },
	),
	t(
		'figurao',
		'crown',
		2,
		{ k: 'trickChips', f: { ranks: ['Q', 'J', 'K'] }, n: 12 },
		{ k: 'cardChips', ranks: ['4', '5', '6', '7'], n: -4 },
	),
	t(
		'seuZe',
		'people',
		2,
		{ k: 'trickChips', f: { ranks: ['4', '5', '6', '7'] }, n: 15 },
		{ k: 'cardChips', ranks: ['Q', 'J', 'K'], n: -4 },
	),
	t(
		'duplaDinamica',
		'people',
		2,
		{ k: 'trickMult', f: { by: 'partner' }, n: 3 },
		{ k: 'trickChips', f: { by: 'me' }, n: -10 },
	),
	t(
		'confiaEmMim',
		'check',
		2,
		{ k: 'trickChips', f: { by: 'partner' }, n: 20 },
		{ k: 'baseMult', n: -1 },
	),
	t(
		'vazaLimpa',
		'sparkle',
		3,
		{ k: 'handX', c: 'firstTwoWon', x: 1.5 },
		{ k: 'handMoney', c: 'lost', n: -1 },
	),
	t(
		'virada',
		'refresh',
		2,
		{ k: 'handMult', c: 'lostFirstWonSecond', n: 6 },
		{ k: 'handMult', c: 'wonFirst', n: -1 },
	),
	t(
		'gritoDeTruco',
		'megaphone',
		2,
		{ k: 'handMult', c: 'trucoAccepted', n: 4 },
		{ k: 'handMult', c: 'noTruco', n: -2 },
	),
	t(
		'seisMaldito',
		'alert',
		3,
		{ k: 'handX', c: 'bet6', x: 2 },
		{ k: 'handChipsPct', c: 'bet1', n: -20 },
	),
	t('cofrinho', 'coin', 2, { k: 'interest', n: 1, max: 3 }, { k: 'speedFlat', n: -2 }),
	t('relogioDeBolso', 'next', 1, { k: 'speedX', x: 2 }, { k: 'goalPct', n: 10 }),
	t(
		'pingaDeAbertura',
		'cart',
		1,
		{ k: 'handChips', c: 'firstHand', n: 25 },
		{ k: 'handChips', c: 'otherHand', n: -2 },
	),
	t(
		'saideira',
		'trophy',
		2,
		{ k: 'handMult', c: 'nearGoal', n: 10 },
		{ k: 'handMult', c: 'farGoal', n: -1 },
	),
	t(
		'viraDourada',
		'star',
		3,
		{ k: 'trickX', f: { manilha: true }, x: 1.5 },
		{ k: 'cardChips', manilha: true, n: -10 },
	),
	t('lendaDoBoteco', 'trophy', 3, { k: 'trickX', f: {}, x: 1.5 }, { k: 'loseTento', n: 1 }),
	t(
		'caixaDeFosforo',
		'coin',
		2,
		{ k: 'trickMoney', f: { manilha: true }, n: 1 },
		{ k: 'shopPrice', n: 1 },
	),
	t(
		'carteado',
		'cards',
		1,
		{ k: 'cardChips', common: true, n: 2 },
		{ k: 'cardChips', special: true, n: -10 },
	),
	t(
		'maoDeFerro',
		'swords',
		2,
		{ k: 'handMult', c: 'bigHand', n: 8 },
		{ k: 'handMult', c: 'normalHand', n: -1 },
	),
	t('bicheiro', 'coin', 2, { k: 'doubleChance', p: 0.25 }, { k: 'goalPct', n: 8 }),
	t('cantoria', 'note', 1, { k: 'perSignal', n: 5 }, { k: 'rivalCatch', n: 10 }),
	t(
		'malandragem',
		'mute',
		2,
		{ k: 'handMult', c: 'weakTrucoWin', n: 6 },
		{ k: 'handMoney', c: 'weFolded', n: -2 },
	),
	t('diaDeSorte', 'sparkle', 2, { k: 'startTentos', n: 1 }, { k: 'startMoney', n: -1 }),
	t(
		'reiDoPedaco',
		'crown',
		2,
		{ k: 'perTableWon', n: 1, max: 5 },
		{ k: 'goalPctPerChamp', n: 5 },
	),
	t(
		'coringaNoBolso',
		'gamepad',
		2,
		{ k: 'jokerOpen', n: 20, m: 2 },
		{ k: 'cardChips', special: true, n: -10 },
	),
];

export type TrinketId = string;
export const TRINKET_BY_ID: ReadonlyMap<string, TrinketDef> = new Map(
	TRINKETS.map((d) => [d.id, d]),
);
export const TRINKET_IDS: readonly string[] = TRINKETS.map((d) => d.id);
export const isTrinketId = (id: unknown): id is TrinketId =>
	typeof id === 'string' && TRINKET_BY_ID.has(id);

const round1 = (x: number): number => Math.round(x * 10 + 1e-9) / 10;
/** Rounds half up, ignoring float noise (5 × 1.3 is 6.5, not 6.499…). */
const whole = (x: number): number => Math.sign(x) * Math.round(Math.abs(x) + 1e-9);

/** The effect at `scale`: the number that grows is multiplied, a ×Mult only grows over 1. */
export function scaleFx(fx: Fx, scale: number): Fx {
	switch (fx.k) {
		case 'trickX':
		case 'handX':
		case 'speedX':
			return { ...fx, x: round1(1 + (fx.x - 1) * scale) };
		case 'doubleChance':
			return { ...fx, p: Math.min(1, Math.round(fx.p * scale * 100 + 1e-9) / 100) };
		case 'jokerOpen':
			return { ...fx, n: whole(fx.n * scale), m: whole(fx.m * scale) };
		case 'perTableWon':
		case 'interest':
			return { ...fx, n: whole(fx.n * scale), max: whole(fx.max * scale) };
		default:
			return { ...fx, n: whole(fx.n * scale) } as Fx;
	}
}

export interface TrinketValues {
	perk: Fx;
	flaw: Fx;
}

/** The four ready (Perk, Flaw) pairs of every trinket, level 1 first. */
export const TRINKET_VALUES: ReadonlyMap<string, readonly TrinketValues[]> = new Map(
	TRINKETS.map((d) => [
		d.id,
		TRINKET_LEVELS.map((l) => ({
			perk: scaleFx(d.perk, PERK_SCALE[l - 1] ?? 1),
			flaw: scaleFx(d.flaw, FLAW_SCALE[l - 1] ?? 1),
		})),
	]),
);

export function trinketValues(id: string, level: number, flawX = 1): TrinketValues | null {
	const lv = Math.min(4, Math.max(1, level));
	const v = TRINKET_VALUES.get(id)?.[lv - 1];
	if (!v || flawX === 1) return v ?? null;
	const base = TRINKET_BY_ID.get(id);
	return base
		? { perk: v.perk, flaw: scaleFx(base.flaw, (FLAW_SCALE[lv - 1] ?? 1) * flawX) }
		: null;
}

/** The number an i18n text shows (`{n}`), and the second one (`{m}`). */
export function fxArgs(fx: Fx): { n: number; m: number } {
	switch (fx.k) {
		case 'trickX':
		case 'handX':
		case 'speedX':
			return { n: fx.x, m: 0 };
		case 'doubleChance':
			return { n: Math.round(fx.p * 100), m: 0 };
		case 'jokerOpen':
			return { n: fx.n, m: fx.m };
		case 'perTableWon':
		case 'interest':
			return { n: Math.abs(fx.n), m: fx.max };
		default:
			return { n: Math.abs((fx as { n: number }).n), m: 0 };
	}
}

/** An equipped trinket as the game plays it: the id and the highest level the player holds. */
export interface EquippedTrinket {
	id: string;
	level: TrinketLevel;
	/** Extra factor on the Flaw (Stuart doubles it). */
	flawX?: number;
}

/** Stuart: every equipped Flaw counts double on his table. */
export const doubleFlaws = (list: readonly EquippedTrinket[]): EquippedTrinket[] =>
	list.map((e) => ({ ...e, flawX: 2 }));
