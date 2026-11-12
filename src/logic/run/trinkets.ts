import {
	type EquippedTrinket,
	TRINKET_IDS,
	TRINKET_LEVELS,
	TRINKET_PRICE,
	TRINKET_SLOTS,
	type TrinketLevel,
	trinketValues,
} from '../../data/trinkets';
import type { Rng } from '../rng';

/** The trinkets the player holds: id → highest level (1–4) bought. */
export type Collection = Record<string, number>;

/** A trinket for sale: the id, the level (rarity) and its base price (before discounts). */
export interface TrinketOffer {
	kind: 'trinket';
	id: string;
	level: TrinketLevel;
	price: number;
	sold: boolean;
}

export const levelOf = (c: Collection, id: string): number => c[id] ?? 0;

/** Keeps the highest level of every id (old values and bad numbers are cleaned). */
export function mergeCollection(into: Collection, from: Collection): Collection {
	for (const [id, lv] of Object.entries(from)) {
		const level = Math.min(4, Math.floor(lv));
		if (TRINKET_IDS.includes(id) && level >= 1) into[id] = Math.max(into[id] ?? 0, level);
	}
	return into;
}

/** Equipped trinkets as the game plays them: each in the highest level the player holds. */
export const equippedList = (ids: readonly string[], c: Collection): EquippedTrinket[] =>
	ids.flatMap((id) => {
		const level = levelOf(c, id);
		return level >= 1 ? [{ id, level: Math.min(4, level) as TrinketLevel }] : [];
	});

/** Slots of a run: Zé takes one away (his Flaw). */
export const slotsFor = (partner: string | undefined): number =>
	TRINKET_SLOTS - (partner === 'ze' ? 1 : 0);

export function equip(equipped: string[], c: Collection, id: string, slots: number): boolean {
	if (levelOf(c, id) < 1 || equipped.includes(id) || equipped.length >= slots) return false;
	equipped.push(id);
	return true;
}

export function unequip(equipped: string[], id: string): boolean {
	const i = equipped.indexOf(id);
	if (i < 0) return false;
	equipped.splice(i, 1);
	return true;
}

/** Odds of the shop (docs/trinkets.md): one Rare 50%, one Epic 25%, each its own draw. */
export const SHOP_ODDS = { rare: 0.5, epic: 0.25 } as const;
export const SHOP_OFFERS = 4;

/**
 * The levels of one shop's offers, in no order: a Legendary after a boss (always), a Rare with
 * 50% and an Epic with 25% (independent draws), the rest Normal.
 */
export function shopLevels(rng: Rng, afterBoss: boolean, n = SHOP_OFFERS): TrinketLevel[] {
	const out: TrinketLevel[] = [];
	if (afterBoss) out.push(4);
	if (rng.chance(SHOP_ODDS.rare)) out.push(2);
	if (rng.chance(SHOP_ODDS.epic)) out.push(3);
	while (out.length < n) out.push(1);
	return rng.shuffle(out.slice(0, n));
}

/**
 * The four offers of a shop: for each level a trinket the player does not hold at that level or
 * above, never the same trinket twice. With none left at that level the offer becomes the next
 * level of a trinket the player holds (or is dropped when everything is maxed). `ids` limits the
 * pool (the 1v1 run leaves out the trinkets that read a partner).
 */
export function trinketOffers(
	rng: Rng,
	c: Collection,
	afterBoss: boolean,
	price: (base: number) => number,
	ids: readonly string[] = TRINKET_IDS,
): TrinketOffer[] {
	const taken = new Set<string>();
	const out: TrinketOffer[] = [];
	for (const want of shopLevels(rng, afterBoss)) {
		let pool = ids.filter((id) => !taken.has(id) && levelOf(c, id) < want);
		let level: TrinketLevel = want;
		if (!pool.length) {
			pool = ids.filter((id) => !taken.has(id) && levelOf(c, id) < 4);
			if (!pool.length) continue;
		}
		const id = rng.pick(pool);
		if (levelOf(c, id) >= level) level = (levelOf(c, id) + 1) as TrinketLevel;
		taken.add(id);
		out.push({
			kind: 'trinket',
			id,
			level,
			price: price(TRINKET_PRICE[level - 1] ?? 4),
			sold: false,
		});
	}
	return out;
}

/** Run-wide numbers the equipped trinkets add up to (read by the run and the table). */
export interface TrinketTotals {
	goalPct: number;
	goalPctPerChamp: number;
	shopPrice: number;
	speedFlat: number;
	speedX: number;
	interestStepsMax: number;
	interestPer: number;
	doubleChance: number;
	startTentos: number;
	startMoney: number;
	loseTento: number;
	rivalCatch: number;
}

export function trinketTotals(list: readonly EquippedTrinket[]): TrinketTotals {
	const t: TrinketTotals = {
		goalPct: 0,
		goalPctPerChamp: 0,
		shopPrice: 0,
		speedFlat: 0,
		speedX: 1,
		interestStepsMax: 0,
		interestPer: 0,
		doubleChance: 0,
		startTentos: 0,
		startMoney: 0,
		loseTento: 0,
		rivalCatch: 0,
	};
	for (const e of list) {
		const v = trinketValues(e.id, e.level, e.flawX);
		if (!v) continue;
		for (const fx of [v.perk, v.flaw]) {
			switch (fx.k) {
				case 'goalPct':
					t.goalPct += fx.n;
					break;
				case 'goalPctPerChamp':
					t.goalPctPerChamp += fx.n;
					break;
				case 'shopPrice':
					t.shopPrice += fx.n;
					break;
				case 'speedFlat':
					t.speedFlat += fx.n;
					break;
				case 'speedX':
					t.speedX *= fx.x;
					break;
				case 'interest':
					t.interestPer += fx.n;
					t.interestStepsMax += fx.max;
					break;
				case 'doubleChance':
					t.doubleChance = Math.min(1, t.doubleChance + fx.p);
					break;
				case 'startTentos':
					t.startTentos += fx.n;
					break;
				case 'startMoney':
					t.startMoney += fx.n;
					break;
				case 'loseTento':
					t.loseTento += fx.n;
					break;
				case 'rivalCatch':
					t.rivalCatch += fx.n;
					break;
			}
		}
	}
	return t;
}

export { TRINKET_LEVELS };
