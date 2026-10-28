import { describe, expect, test } from 'bun:test';
import { TRINKETS } from '../src/config/features';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { BOSS_POOL } from '../src/data/bosses';
import { COMPANION_IDS } from '../src/data/companions';
import { PROMISES } from '../src/data/promises';
import { TRINKET_BY_ID, trinketValues } from '../src/data/trinkets';
import { Match, type MatchOptions, type SeatBrain } from '../src/game/match';
import { decide } from '../src/logic/ai/decide';
import { Rng } from '../src/logic/rng';
import {
	finishTable,
	leaveShop,
	newRun,
	type RunState,
	type TableResult,
	useConsumable,
} from '../src/logic/run/run';
import { scoreHand } from '../src/logic/score/score';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { observe } from '../src/logic/truco/observe';
import { apply, deal, legalActions, type Seat, type TableState } from '../src/logic/truco/table';

const c = (text: string): Card => {
	const [id = '', mod] = text.split('+');
	const card = parseCard(id);
	if (!card) throw new Error(text);
	return mod ? { ...card, mod } : card;
};

function play(hands: string[][], moves: string[]): TableState {
	let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c('4c') });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	const rng = new Rng(1);
	for (const m of moves)
		s = apply(s, { kind: 'play', seat: s.turn as Seat, cardId: c(m).id }, rng).state;
	return s;
}

const pro: SeatBrain = { kind: 'ai', profile: AI_PROFILES.pro };
const brains: MatchOptions['brains'] = [pro, pro, pro, pro];
const match = (o: Partial<MatchOptions> = {}): Match =>
	new Match({ rng: new Rng(7), brains, goal: 100, ...o });
const win = (o: Partial<TableResult> = {}): TableResult => ({
	won: true,
	rivalTentos: 6,
	money: 0,
	hands: 5,
	bestHand: 50,
	...o,
});

describe('card modifiers (B1.2)', () => {
	test('Nervosa: +10 Mult only in the 3rd trick', () => {
		const virada = (first: string) =>
			play(
				[
					['3h', '2h', first],
					['5c', '4s', '6d'],
					['7h', 'Kh', 'Qs'],
					['4h', '6s', '7d'],
				],
				[
					'3h',
					'5c',
					'7h',
					'4h',
					'4s',
					'Kh',
					'6s',
					'2h',
					first.split('+')[0] ?? '',
					'6d',
					'Qs',
					'7d',
				],
			);
		const plain = scoreHand({ state: virada('Ah'), queda: false }).mult;
		expect(scoreHand({ state: virada('Ah+nervosa'), queda: false }).mult).toBe(plain + 10);
	});

	test('Vidro: ×2 Mult after the base Mult', () => {
		const hands = (m: string) => [
			['3h', `2h${m}`, 'Ah'],
			['4d', '4s', '6d'],
			['7h', 'Kh', 'Qs'],
			['4h', '6s', '7d'],
		];
		const moves = ['3h', '4d', '7h', '4h', '2h', '4s', 'Kh', '6s'];
		const base = scoreHand({ state: play(hands(''), moves), queda: false });
		const glass = scoreHand({ state: play(hands('+vidro'), moves), queda: false });
		expect(glass.mult).toBe(base.mult * 2);
		expect(glass.steps.find((s) => s.source === 'mod:vidro')?.card).toBe('2h');
	});

	test('broken Vidro cards leave the run deck (never below the minimum)', () => {
		const run = newRun(1, 'bruto');
		finishTable(run, win({ broken: ['3c'] }));
		expect(run.deck.some((x) => x.id === '3c')).toBe(false);
	});

	test('Mentirosa: the rivals read it 3 ranks stronger and give up the trick', () => {
		let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(2), { vira: c('4c') });
		s.hands[0] = [c('Qh+mentirosa'), c('6h'), c('7h')];
		s.hands[1] = [c('Kd'), c('4d'), c('6d')];
		s = apply(s, { kind: 'play', seat: 0, cardId: 'Qh' }, new Rng(1)).state;
		const ctx = {
			profile: { ...AI_PROFILES.pro, error: 0, signalRate: 0 },
			deck: standardDeck(),
		};
		const a = decide(
			observe(s, 1),
			legalActions(s, 1).filter((x) => x.kind === 'play'),
			ctx,
			new Rng(1),
		);
		// Without the lie the K would win cheaply; with it the rival throws its lowest card.
		expect(a.kind === 'play' && a.cardId).toBe('4d');
	});

	test('Marcada: your partner sees your marked cards', () => {
		const s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(2));
		s.hands[0] = [c('3h+marcada'), c('6h'), c('7h')];
		expect(observe(s, 2).partnerMarked.map((x) => x.id)).toEqual(['3h']);
		expect(observe(s, 1).partnerMarked).toEqual([]);
	});
});

describe('Simpatias, upgrades and Promises (B1.2)', () => {
	test('the new Simpatias apply their modifier', () => {
		for (const [id, mod] of [
			['aguaBenta', 'heavy'],
			['velaAcesa', 'hot'],
			['olhoGrego', 'mentirosa'],
			['ferradura', 'vidro'],
		] as const) {
			const run = newRun(1, 'bruto');
			run.consumables = [{ kind: 'simpatia', id }];
			expect(useConsumable(run, 0, '3c')).toBe(true);
			expect(run.deck.find((x) => x.id === '3c')?.mod).toBe(mod);
		}
	});

	test.skipIf(TRINKETS)('8 Promises, each cashed at the next shop', () => {
		expect(PROMISES).toHaveLength(8);
		const after = (p: (typeof PROMISES)[number]): RunState => {
			const run = newRun(3, 'bruto');
			run.promises = [p];
			finishTable(run, win());
			return run;
		};
		expect(
			after('cartaNova').shop?.packs.some(
				(o) => o.kind === 'pack' && o.pack === 'baralho' && o.price === 0,
			),
		).toBe(true);
		expect(
			after('fichaExtra').shop?.offers.some(
				(o) => o.kind === 'consumable' && o.item.kind === 'lance' && o.price === 0,
			),
		).toBe(true);
		expect(
			after('simpatiaGratis').shop?.offers.some(
				(o) => o.kind === 'consumable' && o.item.kind === 'simpatia' && o.price === 0,
			),
		).toBe(true);
		expect(Object.values(after('multExtra').levels)).toEqual([2]);
		const life = after('vidaExtra');
		expect(life.extraLife).toBe(true);
		leaveShop(life);
		expect(match({ extraRivalQuedas: life.extraLife ? 1 : 0 }).rivalQuedasNeeded).toBe(3);
	});

	test('Espiar o monte shows a card that nobody holds', () => {
		const m = match({ peekPile: true });
		const inPlay = [...m.state.hands.flat(), m.state.vira].map((x) => x.id);
		expect(m.pileCard).not.toBeNull();
		expect(inPlay).not.toContain(m.pileCard?.id);
		expect(match().pileCard).toBeNull();
	});
});

describe('bosses and partners (B1.3)', () => {
	test('8 pool bosses + the Rei do Truco', () => {
		expect(BOSS_POOL).toHaveLength(8);
		expect(newRun(1, 'bruto').bosses[7]).toBe('reiDoTruco');
	});

	test('O Mudo: no signals between you and your partner', () => {
		expect(match({ boss: 'peter' }).rules.signals).toEqual([0, 1, 0, 1]);
	});

	test('A Sortuda: the vira often makes a rival card a manilha', () => {
		let hits = 0;
		for (let seed = 1; seed <= 200; seed++) {
			const s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(seed), {
				rigViraRivals: 1,
			});
			if ([...s.hands[1], ...s.hands[3]].some((x) => x.rank === s.manilha)) hits++;
		}
		expect(hits).toBeGreaterThan(190);
	});

	test('O Professor: equipped Flaws count double, Perks do not', () => {
		const list = [{ id: 'acoNaManga', level: 1 as const }];
		const plain = new Match({ rng: new Rng(7), brains, goal: 100, trinkets: list });
		const prof = new Match({
			rng: new Rng(7),
			brains,
			goal: 100,
			trinkets: list,
			boss: 'stuart',
		});
		expect(plain.trinketList[0]?.flawX).toBeUndefined();
		expect(prof.trinketList[0]?.flawX).toBe(2);
		const a = trinketValues('acoNaManga', 1);
		const b = trinketValues('acoNaManga', 1, 2);
		expect(b?.perk).toEqual(a?.perk);
		const n = (f?: { n?: number }) => Math.abs(f?.n ?? 0);
		expect(n(b?.flaw as { n?: number })).toBe(n(a?.flaw as { n?: number }) * 2);
		expect(TRINKET_BY_ID.has('acoNaManga')).toBe(true);
	});

	test('10 companions; Nino levels up every table won', () => {
		expect(COMPANION_IDS).toHaveLength(10);
		const run = newRun(1, 'nino');
		finishTable(run, win());
		expect(run.partnerLevel).toBe(1);
	});
});
