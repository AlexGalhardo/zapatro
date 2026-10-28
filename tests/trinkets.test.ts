import { describe, expect, test } from 'bun:test';
import {
	FLAW_SCALE,
	PERK_SCALE,
	TRINKET_IDS,
	TRINKET_LEVELS,
	TRINKET_PRICE,
	TRINKETS,
	trinketValues,
} from '../src/data/trinkets';
import { Rng } from '../src/logic/rng';
import { finishTable, newRun, parseRun, type TableResult } from '../src/logic/run/run';
import {
	equip,
	equippedList,
	levelOf,
	mergeCollection,
	shopLevels,
	slotsFor,
	trinketOffers,
	unequip,
} from '../src/logic/run/trinkets';
import { checksum, defaultSave, parseSave, serializeSave } from '../src/logic/save';
import { type ScoreStep, scoreHand } from '../src/logic/score/score';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { apply, deal, type Seat, type TableState } from '../src/logic/truco/table';

const c = (id: string): Card => {
	const card = parseCard(id);
	if (!card) throw new Error(id);
	return card;
};

/** Vira 4 of clubs (manilha = 5). Each move is played by whoever's turn it is. */
function play(hands: string[][], moves: string[]): TableState {
	let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c('4c') });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	const rng = new Rng(1);
	for (const m of moves)
		s = apply(s, { kind: 'play', seat: s.turn as Seat, cardId: c(m).id }, rng).state;
	return s;
}

/** Our team wins 2-0: seat 2 takes trick 1 with `p`, seat 0 trick 2 with `me`. */
const won = (p = '3h', me = 'Ah') =>
	play(
		[
			['4d', me, 'Qs'],
			['4s', '6d', '7d'],
			[p, 'Kh', '2s'],
			['4h', '6s', 'Qh'],
		],
		['4d', '4s', p, '4h', 'Kh', '6s', me, '6d'],
	);

const lost = () =>
	play(
		[
			['4d', '6s', '7d'],
			['3h', '2h', 'Ah'],
			['4h', 'Qs', 'Qh'],
			['6d', 'Jd', 'Jh'],
		],
		['4d', '3h', '4h', '6d', '2h', 'Qs', 'Jd', '6s'],
	);

type Level = 1 | 2 | 3 | 4;
const score = (state: TableState, ...trinkets: [string, Level][]) =>
	scoreHand({
		state,
		queda: false,
		trinkets: trinkets.map(([id, level]) => ({ id, level })),
	});
const from = (steps: ScoreStep[], id: string) => steps.filter((x) => x.source === `trinket:${id}`);
const chipsOf = (steps: ScoreStep[], id: string) =>
	steps.find((x) => x.source === `card:${id}`)?.chips ?? 0;
const LEVELS: Level[] = [1, 2, 3, 4];
const parseOk = (text: string) => {
	const r = parseSave(text, 'en');
	return r.ok ? r.save : null;
};

describe('trinket data', () => {
	test('32 trinkets, each with a different Perk and Flaw and four ready values', () => {
		expect(TRINKETS).toHaveLength(32);
		expect(new Set(TRINKET_IDS).size).toBe(32);
		for (const d of TRINKETS) {
			expect(JSON.stringify(d.perk)).not.toBe(JSON.stringify(d.flaw));
			for (const l of TRINKET_LEVELS) expect(trinketValues(d.id, l)).not.toBeNull();
		}
	});

	test('the numbers grow with the rarity and the Perk grows faster than the Flaw', () => {
		expect(PERK_SCALE).toEqual([1, 1.6, 2.3, 3.2]);
		expect(FLAW_SCALE).toEqual([1, 1.3, 1.6, 2]);
		expect(TRINKET_PRICE).toEqual([4, 7, 10, 14]);
		const val = (id: string, l: Level, side: 'perk' | 'flaw'): Record<string, number> => {
			const v = trinketValues(id, l);
			if (!v) throw new Error(id);
			return v[side] as unknown as Record<string, number>;
		};
		const num = (id: string, l: Level, side: 'perk' | 'flaw'): number =>
			Math.abs(val(id, l, side).n ?? 0);
		// Ás na Manga: +20 Chips per trick with an Ace; the Flaw takes 5 off every K.
		expect(LEVELS.map((l) => num('acoNaManga', l, 'perk'))).toEqual([20, 32, 46, 64]);
		expect(LEVELS.map((l) => num('acoNaManga', l, 'flaw'))).toEqual([5, 7, 8, 10]);
		const x = (l: Level) => val('zapDeOuro', l, 'perk').x;
		expect(LEVELS.map(x)).toEqual([1.5, 1.8, 2.2, 2.6]);
	});
});

describe('collection and equipping', () => {
	test('the highest level held wins; merging keeps the maximum and drops bad ids', () => {
		const col = mergeCollection({}, { acoNaManga: 2, nope: 3, seuZe: 9 });
		mergeCollection(col, { acoNaManga: 1, seuZe: 1 });
		expect(col).toEqual({ acoNaManga: 2, seuZe: 4 });
		expect(equippedList(['acoNaManga', 'seuZe', 'missing'], col)).toEqual([
			{ id: 'acoNaManga', level: 2 },
			{ id: 'seuZe', level: 4 },
		]);
	});

	test('up to the slots (Zé has one fewer), none is allowed, no repeats', () => {
		expect(slotsFor('tonhao')).toBe(4);
		expect(slotsFor('ze')).toBe(3);
		const col = Object.fromEntries(TRINKET_IDS.slice(0, 6).map((id) => [id, 1]));
		const on: string[] = [];
		for (const id of TRINKET_IDS.slice(0, 5)) equip(on, col, id, 4);
		expect(on).toHaveLength(4);
		expect(equip(on, col, on[0] as string, 4)).toBe(false);
		expect(equip([], {}, 'seuZe', 4)).toBe(false);
		for (const id of [...on]) unequip(on, id);
		expect(on).toHaveLength(0);
	});

	test('the profile save keeps the collection and an old save loads with none', () => {
		const save = defaultSave('en');
		save.meta.trinkets = { seuZe: 3 };
		expect(parseOk(serializeSave(save))?.meta.trinkets).toEqual({ seuZe: 3 });
		const old = JSON.parse(serializeSave(defaultSave('en')));
		const payload = JSON.parse(old.payload);
		payload.meta.trinkets = undefined;
		old.payload = JSON.stringify(payload);
		old.checksum = checksum(old.payload);
		expect(parseOk(JSON.stringify(old))?.meta.trinkets).toEqual({});
	});

	test('an old run (no trinket fields) loads with none equipped', () => {
		const run = newRun(1, 'tonhao') as unknown as Record<string, unknown>;
		run.trinkets = undefined;
		run.trinketSlots = undefined;
		run.collection = undefined;
		const back = parseRun(run);
		expect(back?.trinkets).toEqual([]);
		expect(back?.trinketSlots).toBe(4);
		expect(back?.collection).toEqual({});
	});
});

describe('the shop odds', () => {
	test('a Rare 50% and an Epic 25% (independent), the rest Normal; four offers', () => {
		const n = 4000;
		let rare = 0;
		let epic = 0;
		for (let seed = 1; seed <= n; seed++) {
			const levels = shopLevels(new Rng(seed), false);
			expect(levels).toHaveLength(4);
			if (levels.includes(2)) rare++;
			if (levels.includes(3)) epic++;
			expect(levels.includes(4)).toBe(false);
		}
		expect(rare / n).toBeGreaterThan(0.46);
		expect(rare / n).toBeLessThan(0.54);
		expect(epic / n).toBeGreaterThan(0.21);
		expect(epic / n).toBeLessThan(0.29);
	});

	test('after a boss there is always a Legendary', () => {
		for (let seed = 1; seed <= 300; seed++)
			expect(
				shopLevels(new Rng(seed), true).filter((l) => l === 4).length,
			).toBeGreaterThanOrEqual(1);
	});

	test('no repeats, and never a level at or below the one held', () => {
		const col: Record<string, number> = { acoNaManga: 2, seuZe: 1, bicheiro: 4 };
		for (let seed = 1; seed <= 400; seed++) {
			const offers = trinketOffers(new Rng(seed), col, seed % 3 === 0, (p) => p);
			const ids = offers.map((o) => o.id);
			expect(new Set(ids).size).toBe(ids.length);
			for (const o of offers) expect(o.level).toBeGreaterThan(levelOf(col, o.id));
			expect(offers.length).toBeLessThanOrEqual(4);
		}
	});

	test('the same seed gives the same shop', () => {
		const a = trinketOffers(new Rng(5), {}, true, (p) => p);
		const b = trinketOffers(new Rng(5), {}, true, (p) => p);
		expect(a).toEqual(b);
	});

	test('the shop after a table sells trinkets only', () => {
		const run = newRun(3, 'tonhao');
		const r: TableResult = {
			won: true,
			rivalTentos: 9,
			money: 0,
			hands: 5,
			bestHand: 50,
		};
		finishTable(run, r);
		expect(run.shop?.offers.length).toBeGreaterThan(0);
		expect(run.shop?.offers.every((o) => o.kind === 'trinket')).toBe(true);
	});
});

describe('scoring: only the equipped trinkets count', () => {
	test('nothing equipped scores as before', () => {
		expect(score(won()).points).toBe(scoreHand({ state: won(), queda: false }).points);
	});

	test('Ás na Manga: +20 Chips per trick won with an Ace at Normal, 64 at Legendary; K −5', () => {
		const s = won('3h', 'Ah');
		expect(from(score(s, ['acoNaManga', 1]).steps, 'acoNaManga')).toEqual([
			{ source: 'trinket:acoNaManga', chips: 20 },
		]);
		expect(from(score(s, ['acoNaManga', 4]).steps, 'acoNaManga')[0]?.chips).toBe(64);
		const withK = won('Kc', 'Ah');
		const plain = score(withK);
		const flawed = score(withK, ['acoNaManga', 1]);
		expect(chipsOf(flawed.steps, 'Kc')).toBe(Math.max(0, chipsOf(plain.steps, 'Kc') - 5));
	});

	test('Vaza Limpa multiplies the Mult when the pair wins the first two tricks', () => {
		const base = score(won()).mult;
		expect(score(won(), ['vazaLimpa', 1]).mult).toBe(base * 1.5);
		expect(score(won(), ['vazaLimpa', 4]).mult).toBe(base * 2.6);
	});

	test('Copo Americano pays $1 per hand won; Mão Leve takes $1 on a lost hand', () => {
		expect(score(won(), ['copoAmericano', 1]).money).toBe(1);
		expect(score(lost(), ['copoAmericano', 1]).money).toBe(0);
		expect(score(lost(), ['maoLeve', 1]).money).toBe(-1);
		expect(score(lost(), ['maoLeve', 4]).money).toBe(-2);
	});

	test('Confia em Mim never takes the base Mult below 1', () => {
		expect(score(won(), ['confiaEmMim', 4]).mult).toBeGreaterThanOrEqual(1);
	});

	test('the order of the trinkets is the order they fire', () => {
		const a = score(won(), ['vazaLimpa', 1], ['copoAmericano', 1]).steps.map((x) => x.source);
		expect(a.indexOf('trinket:vazaLimpa')).toBeLessThan(a.indexOf('trinket:copoAmericano'));
	});
});
