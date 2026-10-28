import { describe, expect, test } from 'bun:test';
import { TRINKETS } from '../src/config/features';
import { RANK_CHIPS } from '../src/data/cards';
import { type CompanionId, PARTNER_TRAITS } from '../src/data/companions';
import { ECONOMY } from '../src/data/economy';
import { Rng } from '../src/logic/rng';
import {
	buy,
	finishTable,
	goalOf,
	newRun,
	offerPrice,
	priceOf,
	type TableResult,
} from '../src/logic/run/run';
import { type ScoreStep, scoreHand } from '../src/logic/score/score';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { apply, deal, type Seat, type TableState } from '../src/logic/truco/table';

const c = (id: string): Card => {
	const card = parseCard(id);
	if (!card) throw new Error(id);
	return card;
};

/** Vira 4 of clubs (manilha = 5): plays the moves, each by whoever's turn it is. */
function play(hands: string[][], moves: string[]): TableState {
	let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c('4c') });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	const rng = new Rng(1);
	for (const m of moves)
		s = apply(s, { kind: 'play', seat: s.turn as Seat, cardId: c(m).id }, rng).state;
	return s;
}

/** Our team wins 2-0: seat 2 takes the first trick with `three`, seat 0 the second with `last`. */
const won = (three = '3h', last = 'Ah') =>
	play(
		[
			['4d', last, 'Qs'],
			['4s', '6d', '7d'],
			[three, 'Kh', '2s'],
			['4h', '6s', 'Qh'],
		],
		['4d', '4s', three, '4h', 'Kh', '6s', last, '6d'],
	);

/** The rivals win 2-0. */
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

const score = (state: TableState, partner?: CompanionId, level = 1) =>
	scoreHand({ state, queda: false, ...(partner ? { partner: { id: partner, level } } : {}) });
const chipsOf = (steps: ScoreStep[], id: string) =>
	steps.find((x) => x.source === `card:${id}`)?.chips ?? 0;
const of = (steps: ScoreStep[], who: string) => steps.filter((x) => x.source === `partner:${who}`);

const win = (o: Partial<TableResult> = {}): TableResult => ({
	won: true,
	rivalTentos: 9,
	money: 0,
	hands: 5,
	bestHand: 50,
	...o,
});

describe('Bruto (bruto)', () => {
	test('+3 Mult for each trick he wins; his own cards are worth half the Chips (down)', () => {
		const base = score(won());
		const r = score(won(), 'bruto');
		expect(of(r.steps, 'bruto')).toEqual([
			{ source: 'partner:bruto', addMult: PARTNER_TRAITS.bruto.trickMult },
		]);
		expect(r.mult).toBe(base.mult + 3);
		expect(chipsOf(r.steps, '3h')).toBe(Math.floor(chipsOf(base.steps, '3h') / 2));
		expect(chipsOf(r.steps, '4s')).toBe(chipsOf(base.steps, '4s'));
	});
});

describe('Cida (cida)', () => {
	test('+$1 per hand won, nothing on a lost hand; shop items cost +$1', () => {
		expect(score(won(), 'cida').money).toBe(1);
		expect(score(lost(), 'cida').money).toBe(0);
		const a = newRun(1, 'cida');
		const b = newRun(1, 'bruto');
		expect(priceOf(a, 5)).toBe(priceOf(b, 5) + 1);
		expect(priceOf(a, 5, 'manha')).toBe(priceOf(b, 5, 'manha') + 1);
	});
});

describe('Jhony (jhony)', () => {
	test('interest on saved money at the end of the table (+$1 per $5, max +$5)', () => {
		const run = newRun(1, 'jhony');
		run.money = 12;
		expect(finishTable(run, win({ money: 3 }))?.partner).toBe(3);
		const rich = newRun(1, 'jhony');
		rich.money = 200;
		expect(finishTable(rich, win())?.partner).toBe(PARTNER_TRAITS.jhony.interestCap);
		const other = newRun(1, 'bruto');
		other.money = 12;
		expect(finishTable(other, win({ money: 3 }))?.partner).toBe(0);
	});

	test('the speed reward is halved (rounded down)', () => {
		for (const [partner, tentos] of [
			['jhony', 9],
			['jhony', 6],
			['bruto', 9],
		] as const) {
			const run = newRun(1, partner);
			const full = Math.min(ECONOMY.speedCap, Math.max(0, 12 - tentos));
			const r = finishTable(run, win({ rivalTentos: tentos }));
			expect(r?.speed).toBe(partner === 'jhony' ? Math.floor(full / 2) : full);
		}
	});
});

describe('Nino (nino)', () => {
	test('starts at -1 base Mult and gains one per table won', () => {
		const base = score(won());
		expect(newRun(1, 'nino').partnerLevel).toBe(0);
		expect(score(won(), 'nino', 0).mult).toBe(base.mult - 1);
		expect(of(score(won(), 'nino', 1).steps, 'nino')).toHaveLength(0);
		expect(score(won(), 'nino', 2).mult).toBe(base.mult + 1);
		const run = newRun(1, 'nino');
		finishTable(run, win());
		expect(run.partnerLevel).toBe(1);
		finishTable(run, win());
		expect(run.partnerLevel).toBe(2);
	});

	test('the base Mult never drops below 1', () => {
		const r = score(won(), 'nino', 0);
		expect(r.mult).toBeGreaterThanOrEqual(1);
	});
});

describe('Zé (ze)', () => {
	test('one Manha slot fewer; the cheapest offer of the first shop of a Championship is free', () => {
		expect(newRun(1, 'ze').manhaSlots).toBe(newRun(1, 'bruto').manhaSlots - 1);
		const run = newRun(4, 'ze');
		finishTable(run, win());
		const free = (run.shop?.offers ?? []).filter((o) => o.price === 0);
		expect(free).toHaveLength(1);
		const later = newRun(4, 'ze');
		later.table = 1;
		finishTable(later, win());
		expect((later.shop?.offers ?? []).some((o) => o.price === 0)).toBe(false);
	});
});

describe('Mia (mia)', () => {
	test('manilhas +15 Chips; common cards -2 (never below 0)', () => {
		const s = won('3h', '5s');
		const base = score(s);
		const r = score(s, 'mia');
		expect(chipsOf(r.steps, '5s')).toBe(chipsOf(base.steps, '5s') + 15);
		expect(chipsOf(r.steps, '4d')).toBe(Math.max(0, RANK_CHIPS['4'] - 2));
		expect(chipsOf(r.steps, '3h')).toBe(chipsOf(base.steps, '3h') - 2);
	});
});

describe('Chico (chico)', () => {
	test('+20 Chips for a trick won with a club; hearts and diamonds -5', () => {
		const s = won('3c');
		const base = score(s);
		const r = score(s, 'chico');
		expect(of(r.steps, 'chico')).toEqual([
			{ source: 'partner:chico', chips: PARTNER_TRAITS.chico.clubTrickChips },
		]);
		// The hearts and diamonds played in the two tricks lose up to 5 Chips each.
		const reds = ['4d', '4h', 'Kh', 'Ah', '6d'];
		const drop = reds.reduce((n, id) => n + Math.min(5, chipsOf(base.steps, id)), 0);
		expect(r.chips).toBe(base.chips + 20 - drop);
	});
});

describe('Beti (beti)', () => {
	test('the first trinket bought in each shop costs $1 less; trinkets cost +$1', () => {
		const run = newRun(1, 'beti');
		run.money = 40;
		finishTable(run, win());
		const [first, second] = (run.shop?.offers ?? []).filter((o) => o.kind === 'trinket');
		if (!first || !second)
			throw new Error('the shop has fewer than two trinkets for this seed');
		expect(offerPrice(run, first)).toBe(first.price - 1);
		const before = run.money;
		expect(buy(run, 'offers', (run.shop?.offers ?? []).indexOf(first))).toBeNull();
		expect(before - run.money).toBe(first.price - 1);
		expect(offerPrice(run, second)).toBe(second.price);
		const other = newRun(1, 'bruto');
		expect(priceOf(run, 5, 'trinket')).toBe(priceOf(other, 5, 'trinket') + 1);
		expect(priceOf(run, 5, 'pack')).toBe(priceOf(other, 5, 'pack'));
	});
});

describe('Ayla (ayla)', () => {
	test('×1.5 Mult when the pair wins the first two tricks; a lost hand costs $1', () => {
		const base = score(won());
		expect(score(won(), 'ayla').mult).toBe(base.mult * PARTNER_TRAITS.ayla.firstTwoTricksX);
		expect(score(lost(), 'ayla').money).toBe(-1);
		expect(score(won(), 'ayla').money).toBe(0);
	});
});

describe('Sheila (sheila)', () => {
	test('table goals +10%', () => {
		const a = newRun(1, 'sheila');
		const b = newRun(1, 'bruto');
		expect(goalOf(a, 'small')).toBe(Math.round(goalOf(b, 'small') * 1.1));
	});

	test('about 1 table win in 4 pays double (seeded)', () => {
		let doubled = 0;
		const n = 400;
		for (let seed = 1; seed <= n; seed++) {
			const run = newRun(seed, 'sheila');
			run.money = 0;
			const r = finishTable(run, win());
			if (r?.doubled) {
				doubled++;
				expect(run.money).toBe(2 * (r.prize + r.speed + r.interest + r.partner));
			}
		}
		expect(doubled / n).toBeGreaterThan(0.18);
		expect(doubled / n).toBeLessThan(0.32);
	});
});

describe('shop offers', () => {
	test.skipIf(TRINKETS)('a visit never shows the same Manha or consumable twice', () => {
		for (let seed = 1; seed <= 300; seed++) {
			const run = newRun(seed, 'bruto');
			finishTable(run, win());
			const keys = (run.shop?.offers ?? []).map((o) =>
				o.kind === 'manha'
					? `m:${o.id}`
					: o.kind === 'consumable'
						? `c:${o.item.id}`
						: o.kind,
			);
			expect(new Set(keys).size).toBe(keys.length);
		}
	});
});
