import { TRINKETS } from '../../config/features';
import { AI_PROFILE_IDS, type AiProfileId } from '../../data/ai-profiles';
import {
	BOSS_POOL,
	BOSSES_NEED_MANHAS,
	BOSSES_NOT_1V1,
	type BossId,
	FINAL_BOSS,
} from '../../data/bosses';
import {
	CHAMPIONSHIPS,
	RIVAL_POOLS,
	type RunMode,
	TABLE_SIZES,
	type TableSize,
} from '../../data/championships';
import { COMPANION_IDS, type CompanionId, PARTNER_TRAITS } from '../../data/companions';
import { type Consumable, SIMPATIA_IDS, SIMPATIAS } from '../../data/consumables';
import { DECKS, type DeckId } from '../../data/decks';
import { ECONOMY } from '../../data/economy';
import { LANCE_IDS } from '../../data/lances';
import { MANHA_BY_ID, MANHAS, type ManhaId, manhaNeedsPartner } from '../../data/manhas';
import { stakeRules } from '../../data/stakes';
import { type EquippedTrinket, TRINKET_IDS_1V1 } from '../../data/trinkets';
import { Rng } from '../rng';
import { type LanceLevels, tableGoal } from '../score/score';
import {
	type Card,
	cardId,
	fullDeck,
	JOKER,
	RANKS,
	type Rank,
	SUITS,
	standardDeck,
} from '../truco/cards';
import type { Seat, Team } from '../truco/table';
import {
	type Collection,
	equip,
	equippedList,
	levelOf,
	slotsFor,
	type TrinketOffer,
	trinketOffers,
	trinketTotals,
} from './trinkets';

/**
 * The run (PLAN A4, design §3): Championships of three tables, shop, bosses, partner
 * and the shared deck. Pure and serializable: the scenes keep one `RunState`, call these
 * functions (they mutate it) and save it after every change (D-32).
 */
export type Phase = 'select' | 'table' | 'shop' | 'won' | 'lost';

export interface RivalPair {
	/**
	 * Character ids of seats 1 and 3 (seat 1 is the boss at a boss table). In a 1v1 run there is one
	 * rival: both entries hold him.
	 */
	chars: [string, string];
	profiles: [AiProfileId, AiProfileId];
}

export type Offer =
	| { kind: 'manha'; id: ManhaId; price: number; sold: boolean }
	| { kind: 'consumable'; item: Consumable; price: number; sold: boolean }
	| TrinketOffer;

export interface ShopState {
	offers: Offer[];
	rerolls: number;
	/** Beti's discount on the first Manha bought in this shop was used. */
	firstManhaBought?: boolean;
}

export interface TableResult {
	won: boolean;
	/** Vidro cards that broke (they leave the deck, never below the minimum). */
	broken?: string[];
	/** Rival tentos at the end (speed bonus). */
	rivalTentos: number;
	/** Money earned at the table (Manhas, bosses); may be negative. */
	money: number;
	hands: number;
	bestHand: number;
}

export interface Reward {
	table: number;
	prize: number;
	speed: number;
	interest: number;
	/** The partner's own money (Jhony's interest). */
	partner: number;
	/** Sheila doubled everything earned at this table. */
	doubled: boolean;
}

/**
 * Where a table stands at the start of a hand (the save, D-32): resuming re-deals the same hand
 * from `rng`.
 */
export interface TableProgress {
	rng: number;
	dealer: Seat;
	score: Record<Team, number>;
	points: number;
	money: number;
	hands: number;
	quedas: number;
	rivalQuedas: number;
	gritadorUsed: boolean;
}

export interface RunState {
	v: 1;
	seed: number;
	/** Dupla 2×2 with an AI partner, or mano a mano 1×1 playing alone (D-77). */
	mode: RunMode;
	/** Starting deck and Stake (B2). */
	startDeck: DeckId;
	stake: number;
	/** Legendary Manhas show up in shops (unlocked by the feat "doze"). */
	legendary: boolean;
	/** Web demo (D-33): the run ends after Championship DEMO_LAST_CHAMP. */
	demo: boolean;
	/** Position of the run's rng (shops, rivals). */
	rng: number;
	champ: number;
	/** 0 small, 1 big, 2 boss. */
	table: 0 | 1 | 2;
	/** Boss of Championships 1–8. */
	bosses: BossId[];
	money: number;
	manhas: ManhaId[];
	manhaSlots: number;
	/** Equipped trinkets, left to right (docs/trinkets.md), and how many fit. */
	trinkets: string[];
	trinketSlots: number;
	/** Every trinket the player holds, at its highest level (also kept in the profile save). */
	collection: Collection;
	consumables: Consumable[];
	consumableSlots: number;
	deck: Card[];
	cardSerial: number;
	levels: LanceLevels;
	/** The AI partner of a 2×2 run; a 1v1 run has none (D-78). */
	partner?: CompanionId;
	/** Nino's level; 0 and unused without him. */
	partnerLevel: number;
	/** The rivals need one more queda at the next table (kept in saves; nothing sets it since D-82). */
	extraLife: boolean;
	rivals: RivalPair;
	phase: Phase;
	endless: boolean;
	shop: ShopState | null;
	tableSave: TableProgress | null;
	stats: { hands: number; bestHand: number; tables: number };
}

/** Runs `fn` with the run's rng and stores its new position. */
function roll<T>(run: RunState, fn: (rng: Rng) => T): T {
	const rng = new Rng(run.rng);
	const out = fn(rng);
	run.rng = rng.position;
	return out;
}

/** Bosses the run draws from: the 1v1 run drops the ones whose rule needs a partner or Manhas. */
export const bossPool = (mode: RunMode): readonly BossId[] =>
	mode === '2v2'
		? BOSS_POOL
		: BOSS_POOL.filter(
				(b) => !BOSSES_NOT_1V1.includes(b) && !(TRINKETS && BOSSES_NEED_MANHAS.includes(b)),
			);

/** `partner` is ignored in a 1v1 run (pass `undefined`). */
export function newRun(
	seed: number,
	chosen: CompanionId | undefined,
	startDeck: DeckId = 'normal',
	stake = 1,
	legendary = false,
	demo = false,
	mode: RunMode = '2v2',
): RunState {
	const partner = mode === '1v1' ? undefined : chosen;
	const d = DECKS[startDeck];
	const rules = stakeRules(stake);
	const rng = new Rng(seed);
	const pool = rng.shuffle(bossPool(mode));
	const bosses: BossId[] = [
		...Array.from({ length: 7 }, (_, i) => pool[i % pool.length] as BossId),
		FINAL_BOSS,
	];
	const run: RunState = {
		v: 1,
		seed,
		mode,
		startDeck,
		stake,
		legendary,
		demo,
		rng: rng.position,
		champ: 1,
		table: 0,
		bosses,
		money: (rules.startMoney ?? ECONOMY.startMoney) + (d.money ?? 0),
		manhas: [],
		trinkets: [],
		trinketSlots: Math.max(1, slotsFor(partner) + (d.manhaSlots ?? 0)),
		collection: {},
		manhaSlots: Math.max(
			1,
			ECONOMY.manhaSlots +
				(d.manhaSlots ?? 0) -
				(partner === 'ze' ? PARTNER_TRAITS.ze.manhaSlotsDown : 0),
		),
		consumables: [],
		consumableSlots: ECONOMY.consumableSlots,
		// Every deck has two jokers (PLAN §5.12) and the three special cards.
		deck: [
			...fullDeck(),
			...(d.extraSuit
				? standardDeck()
						.filter((c) => c.suit === d.extraSuit)
						.map((c, i) => ({ ...c, id: `${c.id}#${i + 1}` }))
				: []),
		],
		cardSerial: d.extraSuit ? 10 : 0,
		levels: {},
		...(partner ? { partner } : {}),
		partnerLevel: partner === 'nino' || !partner ? 0 : 1,
		extraLife: false,
		rivals: { chars: ['ze', 'mia'], profiles: ['rookie', 'rookie'] },
		phase: 'select',
		endless: false,
		shop: null,
		tableSave: null,
		stats: { hands: 0, bestHand: 0, tables: 0 },
	};
	rollRivals(run);
	return run;
}

/** The web demo stops after this Championship, i.e. after the first boss (D-33). */
export const DEMO_LAST_CHAMP = 1;

export const tableSize = (run: RunState): TableSize => TABLE_SIZES[run.table];

/** Boss of the current Championship's last table (known in advance, shown on the select screen). */
export const championshipBoss = (run: RunState): BossId | undefined =>
	run.bosses[run.champ - 1] ?? run.bosses[(run.champ - 1) % 7];

export function currentBoss(run: RunState): BossId | undefined {
	return run.table === 2 ? championshipBoss(run) : undefined;
}

export const championshipId = (run: RunState): (typeof CHAMPIONSHIPS)[number] =>
	CHAMPIONSHIPS[Math.min(run.champ, CHAMPIONSHIPS.length) - 1] ?? 'reiDoTruco';

export const goalOf = (run: RunState, size: TableSize): number =>
	Math.round(
		tableGoal(run.champ, size, run.mode) *
			stakeRules(run.stake).goalMult *
			(run.partner === 'sheila' ? PARTNER_TRAITS.sheila.goalMult : 1) *
			trinketGoalMult(run),
	);

/** Table goal multiplier from the equipped trinkets' Flaws (Pé de Coelho, Rei do Pedaço…). */
function trinketGoalMult(run: RunState): number {
	const t = trinketTotals(equippedOf(run));
	return 1 + (t.goalPct + t.goalPctPerChamp * Math.max(0, run.champ - 1)) / 100;
}

/** The equipped trinkets as the game plays them (highest level held). */
export const equippedOf = (run: RunState): EquippedTrinket[] =>
	equippedList(run.trinkets, run.collection);

export const currentGoal = (run: RunState): number => goalOf(run, tableSize(run));

function rollRivals(run: RunState): void {
	const shift = stakeRules(run.stake).rivalShift;
	const pool = RIVAL_POOLS[Math.min(run.champ + shift, RIVAL_POOLS.length) - 1] ?? AI_PROFILE_IDS;
	run.rivals = roll(run, (rng) => {
		if (run.mode === '1v1') return roll1v1Rival(run, rng, pool);
		const [a, b] = rng.shuffle(COMPANION_IDS.filter((id) => id !== run.partner));
		const boss = currentBoss(run);
		return {
			chars: [boss ?? a ?? 'ze', b ?? 'mia'],
			profiles: [rng.pick(pool), rng.pick(pool)],
		};
	});
}

/**
 * The one rival of a 1v1 table (D-78): a companion of the cast, never the one who sat at the
 * Championship's previous table; the boss at a boss table. The pool profile of the Championship
 * (`RIVAL_POOLS`) gives his `error`, as in 2×2, so he plays sharper later in the run.
 */
function roll1v1Rival(run: RunState, rng: Rng, pool: readonly AiProfileId[]): RivalPair {
	const prev = run.table === 1 ? run.rivals.chars[0] : undefined;
	const char = currentBoss(run) ?? rng.pick(COMPANION_IDS.filter((id) => id !== prev));
	const profile = rng.pick(pool);
	return { chars: [char, char], profiles: [profile, profile] };
}

export function startTable(run: RunState): void {
	run.phase = 'table';
	run.tableSave = null;
}

function interest(money: number, cap: number): number {
	return Math.min(cap, Math.floor(Math.max(0, money) / ECONOMY.interestStep));
}

function advance(run: RunState): void {
	if (run.table === 2) {
		run.champ++;
		run.table = 0;
		if (run.endless && run.champ > run.bosses.length)
			run.bosses.push(roll(run, (rng) => rng.pick(bossPool(run.mode))));
	} else run.table = (run.table + 1) as 0 | 1 | 2;
}

/**
 * What winning the current table pays, before Sheila's draw: the reward lines and the run's money
 * after them. `tableMoney` is what the table itself earned or cost so far (Manhas, traits, bosses);
 * `rivalTentos` the rivals' tentos (the speed bonus). Both the end of a table and the table's
 * "prize" card use it, so the shown value is the paid one.
 */
export function tableReward(
	run: RunState,
	tableMoney: number,
	rivalTentos: number,
): { reward: Reward; money: number } {
	const before = Math.max(0, run.money + tableMoney);
	const totals = trinketTotals(equippedOf(run));
	const reward: Reward = {
		table: tableMoney,
		prize:
			run.table === 0 && !stakeRules(run.stake).smallPrize
				? 0
				: ECONOMY.prize[tableSize(run)],
		// Jhony's flaw: the speed reward is halved (rounded down).
		speed: Math.max(
			0,
			Math.floor(
				(Math.min(ECONOMY.speedCap, Math.max(0, 12 - rivalTentos)) * totals.speedX) /
					(run.partner === 'jhony' ? PARTNER_TRAITS.jhony.speedDivisor : 1),
			) + totals.speedFlat,
		),
		interest:
			interest(before, stakeRules(run.stake).interestCap) +
			Math.min(
				totals.interestStepsMax,
				Math.floor(Math.max(0, before) / ECONOMY.interestStep) * totals.interestPer,
			),
		partner: 0,
		doubled: false,
	};
	// Jhony's perk: interest on the money he helps you keep.
	if (run.partner === 'jhony') {
		const t = PARTNER_TRAITS.jhony;
		reward.partner = Math.min(
			t.interestCap,
			Math.floor(before / t.interestStep) * t.interestPer,
		);
	}
	const money = before + reward.prize + reward.speed + reward.interest + reward.partner;
	return { reward, money };
}

/**
 * The money a win right now would add to the run (may be negative after fines), and whether
 * Sheila may double it (one table in four: shown as "×2?", never drawn here).
 */
export function projectedReward(
	run: RunState,
	tableMoney: number,
	rivalTentos: number,
): { gain: number; mayDouble: boolean } {
	return {
		gain: tableReward(run, tableMoney, rivalTentos).money - run.money,
		mayDouble: run.partner === 'sheila',
	};
}

/** Ends the current table: rewards and the next phase (shop, run won or run lost). */
export function finishTable(run: RunState, r: TableResult): Reward | null {
	run.tableSave = null;
	run.extraLife = false;
	for (const id of r.broken ?? []) {
		const i = run.deck.findIndex((c) => c.id === id);
		if (i >= 0 && run.deck.length > ECONOMY.deckMin) run.deck.splice(i, 1);
	}
	run.stats.hands += r.hands;
	run.stats.bestHand = Math.max(run.stats.bestHand, r.bestHand);
	if (!r.won) {
		run.money = Math.max(0, run.money + r.money);
		run.phase = 'lost';
		return null;
	}
	run.stats.tables++;
	const { reward, money } = tableReward(run, r.money, r.rivalTentos);
	run.money = money;
	// Sheila: one table win in four pays double.
	const chance = Math.min(
		1,
		(run.partner === 'sheila' ? PARTNER_TRAITS.sheila.doubleMoneyChance : 0) +
			trinketTotals(equippedOf(run)).doubleChance,
	);
	if (chance > 0 && roll(run, (rng) => rng.chance(chance))) {
		reward.doubled = true;
		run.money +=
			Math.max(0, r.money) + reward.prize + reward.speed + reward.interest + reward.partner;
	}
	const wonChampionship = run.table === 2;
	if (run.partner === 'nino') run.partnerLevel++;
	const last = run.demo ? DEMO_LAST_CHAMP : CHAMPIONSHIPS.length;
	if (wonChampionship && run.champ === last && !run.endless) {
		run.phase = 'won';
		return reward;
	}
	advance(run);
	openShop(run, wonChampionship);
	return reward;
}

/** A 1v1 run holds no trinket that reads a partner or signals (the profile's collection may). */
export function dropUnfitTrinkets(run: RunState): void {
	if (run.mode !== '1v1') return;
	for (const id of Object.keys(run.collection))
		if (!TRINKET_IDS_1V1.includes(id)) delete run.collection[id];
	run.trinkets = run.trinkets.filter((id) => TRINKET_IDS_1V1.includes(id));
}

/** After winning Championship 8: keep playing with growing goals. */
export function continueEndless(run: RunState): void {
	run.endless = true;
	advance(run);
	openShop(run, true);
}

// --- Shop ----------------------------------------------------------------------------------

export function priceOf(run: RunState, base: number, kind: Offer['kind'] = 'consumable'): number {
	const p = base * stakeRules(run.stake).priceMult;
	const own = Math.round(p);
	// Cida's flaw: everything costs more; Beti's: Manhas do.
	const up =
		(run.partner === 'cida' ? PARTNER_TRAITS.cida.priceUp : 0) +
		(run.partner === 'beti' && (kind === 'manha' || kind === 'trinket')
			? PARTNER_TRAITS.beti.manhaPriceUp
			: 0) +
		trinketTotals(equippedOf(run)).shopPrice;
	return Math.max(0, own + up);
}

export function rerollCost(run: RunState): number {
	return Math.max(0, ECONOMY.rerollBase + (run.shop?.rerolls ?? 0) * ECONOMY.rerollStep);
}

function pickManha(run: RunState, rng: Rng): ManhaId | null {
	const w = ECONOMY.rarityWeights;
	const want = (['common', 'uncommon', 'rare', 'legendary'] as const)[
		rng.weightedIndex([w.common, w.uncommon, w.rare, w.legendary])
	];
	const free = MANHAS.filter(
		(m) =>
			!run.manhas.includes(m.id) &&
			(run.legendary || m.rarity !== 'legendary') &&
			(run.mode === '2v2' || !manhaNeedsPartner(m)),
	);
	const pool = free.filter((m) => m.rarity === want);
	const from = pool.length ? pool : free;
	return from.length ? rng.pick(from).id : null;
}

function pickConsumable(rng: Rng, kind?: 'simpatia' | 'lance'): Consumable {
	const k = kind ?? (rng.chance(0.5) ? 'simpatia' : 'lance');
	return k === 'simpatia'
		? { kind: 'simpatia', id: rng.pick(SIMPATIA_IDS) }
		: { kind: 'lance', id: rng.pick(LANCE_IDS) };
}

/** Same Manha or same consumable: the shop never shows one twice in a visit. */
const offerKey = (o: Offer): string =>
	o.kind === 'manha'
		? `m:${o.id}`
		: o.kind === 'consumable'
			? `c:${o.item.kind}:${o.item.id}`
			: `${o.kind}`;

function makeOffers(run: RunState, rng: Rng): Offer[] {
	const w = ECONOMY.offerWeights;
	const out: Offer[] = [];
	const draw = (): Offer => {
		const k = rng.weightedIndex([w.manha, w.simpatia, w.lance]);
		const id = k === 0 ? pickManha(run, rng) : null;
		if (id) {
			const def = MANHA_BY_ID.get(id);
			return {
				kind: 'manha',
				id,
				price: priceOf(run, def?.price ?? 5, 'manha'),
				sold: false,
			};
		}
		return {
			kind: 'consumable',
			item: pickConsumable(rng, k === 2 ? 'lance' : 'simpatia'),
			price: priceOf(run, ECONOMY.consumablePrice),
			sold: false,
		};
	};
	for (let i = 0; i < ECONOMY.offers; i++) {
		let o = draw();
		// Redraw a repeat (bounded: the pools are far larger than the offers).
		for (let tries = 0; tries < 20 && out.some((x) => offerKey(x) === offerKey(o)); tries++)
			o = draw();
		out.push(o);
	}
	return out;
}

/** The shop of trinkets (docs/trinkets.md): four offers, nothing else. */
function openTrinketShop(run: RunState, afterBoss: boolean): void {
	run.phase = 'shop';
	run.shop = roll(run, (rng) => {
		const offers: Offer[] = trinketOffers(
			rng,
			run.collection,
			afterBoss,
			(base) => priceOf(run, base, 'trinket'),
			run.mode === '1v1' ? TRINKET_IDS_1V1 : undefined,
		);
		// Zé: in the first shop of each Championship the cheapest offer is free.
		if (run.partner === 'ze' && run.table === 1) {
			const cheapest = offers.filter((o) => o.price > 0).sort((a, b) => a.price - b.price)[0];
			if (cheapest) cheapest.price = 0;
		}
		return { offers, rerolls: 0 };
	});
}

function openShop(run: RunState, afterBoss = false): void {
	if (TRINKETS) {
		openTrinketShop(run, afterBoss);
		return;
	}
	run.phase = 'shop';
	run.shop = roll(run, (rng) => {
		const offers = makeOffers(run, rng);
		// Zé: in the first shop of each Championship the cheapest offer is free.
		if (run.partner === 'ze' && run.table === 1) {
			const cheapest = offers.filter((o) => o.price > 0).sort((a, b) => a.price - b.price)[0];
			if (cheapest) cheapest.price = 0;
		}
		return { offers, rerolls: 0 };
	});
}

export type ShopError = 'money' | 'slots' | 'sold' | 'none';

const hasRoom = (run: RunState, o: Offer): boolean =>
	o.kind === 'manha'
		? run.manhas.length < run.manhaSlots
		: o.kind === 'consumable'
			? run.consumables.length < run.consumableSlots
			: true;

/** What `o` costs the player now: Beti's first Manha of each shop is $1 cheaper. */
export function offerPrice(run: RunState, o: Offer): number {
	const first =
		run.partner === 'beti' &&
		(o.kind === 'manha' || o.kind === 'trinket') &&
		!run.shop?.firstManhaBought;
	return Math.max(0, o.price - (first ? PARTNER_TRAITS.beti.firstManhaOff : 0));
}

/** Buys the offer at `index` of the shop. */
export function buy(run: RunState, index = 0): ShopError | null {
	const shop = run.shop;
	if (!shop) return 'none';
	const o = shop.offers[index];
	if (!o) return 'none';
	if (o.sold) return 'sold';
	const price = offerPrice(run, o);
	if (run.money < price) return 'money';
	if (!hasRoom(run, o)) return 'slots';
	run.money -= price;
	o.sold = true;
	if (o.kind === 'manha' || o.kind === 'trinket') shop.firstManhaBought = true;
	if (o.kind === 'trinket') {
		run.collection[o.id] = Math.max(levelOf(run.collection, o.id), o.level);
		equip(run.trinkets, run.collection, o.id, run.trinketSlots);
	}
	if (o.kind === 'manha') run.manhas.push(o.id);
	if (o.kind === 'consumable') run.consumables.push(o.item);
	return null;
}

function newCard(run: RunState, rank: Card['rank'], suit: Card['suit'], mod?: string): Card {
	run.cardSerial++;
	const base =
		rank === JOKER
			? 'JK'
			: (RANKS as readonly string[]).includes(rank)
				? cardId(rank as Rank, suit)
				: 'SP';
	return { id: `${base}#${run.cardSerial}`, rank, suit, ...(mod ? { mod } : {}) };
}

export function reroll(run: RunState): ShopError | null {
	const shop = run.shop;
	if (!shop) return 'none';
	const cost = rerollCost(run);
	if (run.money < cost) return 'money';
	run.money -= cost;
	shop.rerolls++;
	shop.offers = roll(run, (rng) => makeOffers(run, rng));
	return null;
}

export const sellPrice = (id: ManhaId): number =>
	Math.floor((MANHA_BY_ID.get(id)?.price ?? 0) * ECONOMY.sellShare);

export function sellManha(run: RunState, index: number): void {
	const id = run.manhas[index];
	if (!id) return;
	run.money += sellPrice(id);
	run.manhas.splice(index, 1);
}

/** Moves a Manha (they fire left to right). */
export function moveManha(run: RunState, from: number, to: number): void {
	const [id] = run.manhas.splice(from, 1);
	if (id) run.manhas.splice(Math.max(0, Math.min(to, run.manhas.length)), 0, id);
}

/** Leaves the shop for the next table. */
export function leaveShop(run: RunState): void {
	run.shop = null;
	run.phase = 'select';
	rollRivals(run);
}

// --- Consumables ---------------------------------------------------------------------------

export const needsTarget = (c: Consumable): boolean => c.kind === 'simpatia';

/** Uses a consumable; Simpatias need a deck card. Returns false when it cannot be used. */
export function useConsumable(run: RunState, index: number, targetId?: string): boolean {
	const c = run.consumables[index];
	if (!c) return false;
	if (c.kind === 'lance') run.levels[c.id] = (run.levels[c.id] ?? 1) + 1;
	else {
		const i = run.deck.findIndex((x) => x.id === targetId);
		const card = run.deck[i];
		if (!card) return false;
		const op = SIMPATIAS[c.id];
		if (op.op === 'mod') run.deck[i] = { ...card, mod: op.mod };
		if (op.op === 'remove') {
			if (run.deck.length <= ECONOMY.deckMin) return false;
			run.deck.splice(i, 1);
		}
		if (op.op === 'duplicate') run.deck.push(newCard(run, card.rank, card.suit, card.mod));
		if (op.op === 'suit') {
			const suit = roll(run, (rng) => rng.pick(SUITS.filter((s) => s !== card.suit)));
			run.deck[i] = newCard(run, card.rank, suit, card.mod);
		}
	}
	run.consumables.splice(index, 1);
	return true;
}

export function discardConsumable(run: RunState, index: number): void {
	run.consumables.splice(index, 1);
}

/** Validates a stored run (save): the shape the game writes, or null. */
export function parseRun(raw: unknown): RunState | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const r = raw as Partial<RunState>;
	if (
		r.v !== 1 ||
		!Array.isArray(r.deck) ||
		!Array.isArray(r.manhas) ||
		typeof r.champ !== 'number'
	)
		return null;
	// Finished runs too: the Run screen reads them back to show the summary (and Endless).
	if (!['select', 'table', 'shop', 'won', 'lost'].includes(r.phase as string)) return null;
	const run = raw as RunState;
	const mode: RunMode = run.mode === '1v1' ? '1v1' : '2v2';
	// Saves from 0.1.0-alpha.1 have no extraLife, startDeck, stake, legendary or demo; from before
	// the 1v1 run (D-77), no mode. A 1v1 run never keeps a partner.
	const { partner: _, ...noPartner } = run;
	return {
		...(mode === '1v1' ? noPartner : run),
		mode,
		extraLife: run.extraLife ?? false,
		startDeck: run.startDeck ?? 'normal',
		stake: run.stake ?? 1,
		legendary: run.legendary ?? false,
		demo: run.demo ?? false,
		// Saves from before trinkets: no equipped or held ones (their Manhas stay unused).
		trinkets: Array.isArray(run.trinkets) ? run.trinkets : [],
		trinketSlots: run.trinketSlots ?? slotsFor(mode === '1v1' ? undefined : run.partner),
		collection: run.collection ?? {},
	};
}
