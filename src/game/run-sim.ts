import { SHOP_SIMPLE, TRINKETS } from '../config/features';
import { AI_PROFILES, type AiProfile } from '../data/ai-profiles';
import type { RunMode } from '../data/championships';
import { COMPANION_IDS, type CompanionId } from '../data/companions';
import type { Consumable } from '../data/consumables';
import type { DeckId } from '../data/decks';
import { ECONOMY } from '../data/economy';
import { DEFAULT_UNLOCKS } from '../data/feats';
import { MANHA_BY_ID, type ManhaId } from '../data/manhas';
import { FLAW_SCALE, PERK_SCALE, TRINKET_BY_ID } from '../data/trinkets';
import { Rng } from '../logic/rng';
import { drawCandidates } from '../logic/run/draw';
import {
	buy,
	discardConsumable,
	finishTable,
	leaveShop,
	newRun,
	offerPrice,
	type Phase,
	type RunState,
	sellManha,
	sellPrice,
	startTable,
	useConsumable,
} from '../logic/run/run';
import type { TrinketOffer } from '../logic/run/trinkets';
import { cardChips } from '../logic/score/score';
import type { SeatBrain } from './match';
import { tableMatch } from './run-table';

const DEFAULT_COMPANIONS = COMPANION_IDS.filter((id) =>
	(DEFAULT_UNLOCKS as readonly string[]).includes(`partner:${id}`),
);

/**
 * Headless runs for balance (PLAN A5, §10.2). `good`: the pro AI plays your seat and the shop
 * follows simple rules (tag synergy, rarity, keep the interest); `random`: random legal plays and
 * random purchases (the floor of D-39).
 */
export type RunBot = 'good' | 'random';

export interface RunSummary {
	mode: RunMode;
	stake: number;
	won: boolean;
	champ: number;
	tables: number;
	hands: number;
	money: number;
	bestHand: number;
	/** Hands per table played (pace: design wants 4–12). */
	handsPerTable: number[];
	manhas: ManhaId[];
	/** Where a lost run ended. */
	lostAt?: { champ: number; table: number; boss?: string; points: number; goal: number };
}

/**
 * The good bot's seat: the pro AI, but careful with the clock (the rivals' tentos end the table,
 * so it calls and bluffs less than a match-to-12 player).
 */
export const GOOD_BOT: AiProfile = {
	...AI_PROFILES.pro,
	courage: 0.2,
	aggression: 0.2,
	bluff: 0.02,
};

/** Money the good bot keeps for interest once it has this many Manhas. */
export const KEEP = { from: 3, steps: 2 };
const KEEP_FROM_GET = () => KEEP.from;
const RARITY_VALUE = { common: 1, uncommon: 2, rare: 3, legendary: 4 } as const;

/**
 * The good bot's B0.2 habits, switchable so `scripts/sim.ts` can measure each one
 * (docs/balancing.md). `sellMargin`: a new Manha must be worth this much more than the weakest
 * one to replace it.
 */
export const HABITS = {
	order: true,
	sell: true,
	sellMargin: 1,
	simpatias: true,
};

/** How much the good bot wants a Manha: rarity plus one per tag shared with the rest of the build. */
function manhaValue(run: RunState, id: ManhaId): number {
	const def = MANHA_BY_ID.get(id);
	if (!def) return 0;
	const tags = new Set(
		run.manhas.filter((m) => m !== id).flatMap((m) => MANHA_BY_ID.get(m)?.tags ?? []),
	);
	return RARITY_VALUE[def.rarity] + def.tags.filter((t) => tags.has(t)).length;
}

/** With full slots: the weakest Manha and how much `id` beats it (≤ 0 = not worth a swap). */
function swapFor(run: RunState, id: ManhaId): { index: number; gain: number } {
	const values = run.manhas.map((m) => manhaValue(run, m));
	const index = values.indexOf(Math.min(...values));
	return { index, gain: manhaValue(run, id) - (values[index] ?? 0) - HABITS.sellMargin };
}

/** Room for a Manha: free slot, or (good bot) sells the weakest one when `id` beats it. */
function makeRoom(run: RunState, id: ManhaId): void {
	if (run.manhas.length < run.manhaSlots || !HABITS.sell || SHOP_SIMPLE) return;
	const { index, gain } = swapFor(run, id);
	if (gain > 0) sellManha(run, index);
}

/** ×Mult Manhas go right: they fire left to right, so they multiply everything added before. */
function orderManhas(run: RunState): void {
	if (!HABITS.order) return;
	const x = (id: ManhaId): number => (MANHA_BY_ID.get(id)?.effect.xMult ? 1 : 0);
	run.manhas.sort((a, b) => x(a) - x(b));
}

/** Whether the good bot wants this consumable (Figa only pays off with Mão Leve's ♦). */
function wantsConsumable(run: RunState, c: Consumable): boolean {
	return !HABITS.simpatias || c.id !== 'figa' || run.manhas.includes('maoLeve');
}

function useItems(run: RunState, bot: RunBot, rng: Rng): void {
	for (let i = run.consumables.length - 1; i >= 0; i--) {
		const c = run.consumables[i];
		if (!c) continue;
		if (c.kind === 'lance') {
			useConsumable(run, i);
			continue;
		}
		if (bot === 'random') {
			useConsumable(run, i, rng.pick(run.deck).id);
			continue;
		}
		const byChips = [...run.deck].sort((a, b) => cardChips(b, '4') - cardChips(a, '4'));
		const best = byChips.find((x) => !x.mod) ?? byChips[0];
		const worst = byChips[byChips.length - 1];
		let target = c.id === 'benzedeira' || c.id === 'figa' ? worst : best;
		if (HABITS.simpatias) {
			// Espelho copies the best modified card; Figa turns a strong card that is not ♦ (1 in 3
			// lands on ♦ for Mão Leve); Benzedeira never removes a modified card.
			if (c.id === 'espelho') target = byChips.find((x) => x.mod) ?? best;
			if (c.id === 'figa') target = byChips.find((x) => x.suit !== 'diamonds');
			if (c.id === 'benzedeira') target = [...byChips].reverse().find((x) => !x.mod);
			if (!wantsConsumable(run, c)) target = undefined;
		}
		if (!target || !useConsumable(run, i, target.id)) discardConsumable(run, i);
	}
}

/** How much the bot wants a trinket at a level: its worth times the Perk minus half the Flaw. */
const trinketValue = (id: string, level: number): number =>
	(TRINKET_BY_ID.get(id)?.worth ?? 1) *
	((PERK_SCALE[level - 1] ?? 1) - 0.5 * (FLAW_SCALE[level - 1] ?? 1));

/** Equips the best trinkets the run holds, as many as fit. */
function botEquip(run: RunState): void {
	run.trinkets = Object.entries(run.collection)
		.sort((a, b) => trinketValue(b[0], b[1]) - trinketValue(a[0], a[1]))
		.slice(0, run.trinketSlots)
		.map(([id]) => id);
}

/** The bot's trinket shopping: the offers with the best value for their price, then equip. */
function botTrinkets(run: RunState, bot: RunBot, rng: Rng): void {
	const s = run.shop;
	if (!s) return;
	for (let guard = 0; guard < 6; guard++) {
		const choices = s.offers
			.map((o, i) => ({ o, i }))
			.filter(
				(x): x is { o: TrinketOffer; i: number } =>
					x.o.kind === 'trinket' && !x.o.sold && offerPrice(run, x.o) <= run.money,
			);
		if (!choices.length) break;
		if (bot === 'random' && rng.chance(0.4)) break;
		const pick =
			bot === 'random'
				? rng.pick(choices)
				: choices.reduce((a, b) =>
						trinketValue(b.o.id, b.o.level) - offerPrice(run, b.o) * 0.15 >
						trinketValue(a.o.id, a.o.level) - offerPrice(run, a.o) * 0.15
							? b
							: a,
					);
		buy(run, pick.i);
		if (bot === 'good') botEquip(run);
	}
	if (bot === 'good') botEquip(run);
	leaveShop(run);
}

/** The bot's shopping (also drives `?auto=1` in the game). */
export function botShop(run: RunState, bot: RunBot, rng: Rng): void {
	const s = run.shop;
	if (!s) return;
	if (TRINKETS) {
		botTrinkets(run, bot, rng);
		return;
	}
	// Keep money for interest once the build has a few Manhas.
	const keep =
		bot === 'good' && run.manhas.length >= KEEP_FROM_GET()
			? ECONOMY.interestStep * KEEP.steps
			: 0;
	for (let guard = 0; guard < 12; guard++) {
		const choices: { i: number; v: number }[] = [];
		s.offers.forEach((o, i) => {
			const price = offerPrice(run, o);
			if (o.sold || price > run.money - (price === 0 ? 0 : keep)) return;
			if (o.kind === 'manha' && run.manhas.length < run.manhaSlots)
				choices.push({ i, v: manhaValue(run, o.id) + 2 });
			else if (o.kind === 'manha' && bot === 'good' && HABITS.sell && !SHOP_SIMPLE) {
				const { index, gain } = swapFor(run, o.id);
				const old = run.manhas[index];
				if (gain > 0 && old && o.price <= run.money + sellPrice(old) - keep)
					choices.push({ i, v: gain + 1 });
			}
			// The reduced shop has no sidebar: consumables could not be used, so they are not bought.
			if (
				!SHOP_SIMPLE &&
				o.kind === 'consumable' &&
				run.consumables.length < run.consumableSlots &&
				(bot === 'random' || wantsConsumable(run, o.item))
			)
				choices.push({ i, v: 1 });
		});
		if (!choices.length) break;
		const c =
			bot === 'random' ? rng.pick(choices) : choices.reduce((a, b) => (b.v > a.v ? b : a));
		if (bot === 'random' && rng.chance(0.4)) break;
		const offer = s.offers[c.i];
		if (bot === 'good' && offer?.kind === 'manha') makeRoom(run, offer.id);
		buy(run, c.i);
		useItems(run, bot, rng);
	}
	useItems(run, bot, rng);
	if (bot === 'good') orderManhas(run);
	leaveShop(run);
}

/** Read through a call: finishTable changes the phase, but TS keeps the loop's narrowing. */
const phaseOf = (run: RunState): Phase => run.phase;

/**
 * Plays one run to the end (or to `maxChamp`). `stake` is the Estaca (D-39): carried to the summary
 * now and handed to `newRun` once the Estacas exist (B2). `partner` fixes the partner (default: one
 * of a fresh save's two, drawn by the seed); `mode` '1v1' plays the run alone (no partner).
 */
export function simulateRun(
	seed: number,
	bot: RunBot,
	maxChamp = 8,
	stake = 1,
	partner?: CompanionId,
	mode: RunMode = '2v2',
	deck: DeckId = 'normal',
): RunSummary {
	const rng = new Rng(seed ^ 0x5bd1e995);
	// The bot takes the first partner on offer to a fresh save.
	const drawn = drawCandidates(seed, DEFAULT_COMPANIONS)[0] ?? 'bruto';
	const run = newRun(seed, partner ?? drawn, deck, stake, false, false, mode);
	const seat0: SeatBrain =
		bot === 'good' ? { kind: 'ai', profile: GOOD_BOT } : { kind: 'random' };
	const perTable: number[] = [];
	let bestHand = 0;
	let lostAt: RunSummary['lostAt'];
	while (run.phase === 'select' && run.champ <= maxChamp) {
		startTable(run);
		const m = tableMatch(run, seat0);
		for (;;) {
			for (let seat = m.actor(); seat !== null; seat = m.actor()) m.act(m.aiAction(seat));
			bestHand = Math.max(bestHand, m.lastScore?.points ?? 0);
			if (m.winner || m.hands >= 80) break;
			m.nextHand();
		}
		perTable.push(m.hands);
		if (m.winner !== 'us')
			lostAt = {
				champ: run.champ,
				table: run.table,
				...(m.boss ? { boss: m.boss } : {}),
				points: m.points,
				goal: m.goal ?? 0,
			};
		finishTable(run, {
			won: m.winner === 'us',
			rivalTentos: m.state.score.them,
			money: m.money,
			hands: m.hands,
			bestHand,
			broken: m.broken,
		});
		if (phaseOf(run) === 'shop') botShop(run, bot, rng);
	}
	return {
		mode,
		stake,
		won: run.phase === 'won',
		champ: run.champ,
		tables: run.stats.tables,
		hands: run.stats.hands,
		money: run.money,
		bestHand,
		handsPerTable: perTable,
		manhas: run.manhas,
		...(lostAt ? { lostAt } : {}),
	};
}
