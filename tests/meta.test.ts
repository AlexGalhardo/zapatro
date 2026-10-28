import { describe, expect, test } from 'bun:test';
import { ECONOMY } from '../src/data/economy';
import { FEATS } from '../src/data/feats';
import { stakeRules } from '../src/data/stakes';
import { tableMatch } from '../src/game/run-table';
import {
	type HandInfo,
	isUnlocked,
	maxStake,
	recordHand,
	recordRunEnd,
	recordRunState,
	recordTable,
	unlockedDecks,
} from '../src/logic/meta';
import { Rng } from '../src/logic/rng';
import { currentGoal, finishTable, newRun, parseRun } from '../src/logic/run/run';
import { defaultSave } from '../src/logic/save';
import { scoreHand } from '../src/logic/score/score';
import { parseCard, standardDeck } from '../src/logic/truco/cards';
import { apply, deal, type Seat, type TableState } from '../src/logic/truco/table';

const meta = () => defaultSave('en').meta;
const hand = (o: Partial<HandInfo> = {}): HandInfo => ({
	won: true,
	points: 50,
	bet: 1,
	lance: 'limpa',
	weak: false,
	called: false,
	bluff: false,
	...o,
});

describe('starting decks (B2.1)', () => {
	test('do Dinheiro: +$10, one Manha slot less', () => {
		const money = newRun(1, 'tonhao', 'dinheiro');
		expect(money.money).toBe(ECONOMY.startMoney + 10);
		expect(money.manhaSlots).toBe(ECONOMY.manhaSlots - 1);
	});

	test('Viciado: an extra copy of every ♣ card, all ids unique', () => {
		const run = newRun(1, 'tonhao', 'viciado');
		expect(run.deck).toHaveLength(55);
		expect(new Set(run.deck.map((c) => c.id)).size).toBe(55);
	});

	test('do Interior: 4, 5 and 6 give Chips ×2 (unless manilha)', () => {
		const c = (x: string) =>
			parseCard(x) ??
			(() => {
				throw new Error(x);
			})();
		let s: TableState = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), {
			vira: c('3c'),
		});
		s.hands = [
			['6h', '2h', 'Ah'],
			['5d', '4s', '6d'],
			['7h', 'Kh', 'Qs'],
			['5h', '6s', '7d'],
		].map((h) => h.map(c)) as TableState['hands'];
		const rng = new Rng(1);
		for (const m of ['6h', '5d', '7h', '5h'])
			s = apply(s, { kind: 'play', seat: s.turn as Seat, cardId: m }, rng).state;
		while (!s.over) {
			const seat = s.turn as Seat;
			const card = s.hands[seat][0];
			if (!card) break;
			s = apply(s, { kind: 'play', seat, cardId: card.id }, rng).state;
		}
		const plain = scoreHand({ state: s, queda: false });
		const interior = scoreHand({ state: s, queda: false, doubleChipRanks: ['4', '5', '6'] });
		// Vira 3 → manilha 4: a 4 is a manilha and is not doubled.
		const low = plain.steps
			.filter((x) => x.source.startsWith('card:') && /^card:[56]/.test(x.source))
			.reduce((n, x) => n + (x.chips ?? 0), 0);
		expect(plain.lance).not.toBeNull();
		expect(interior.chips - plain.chips).toBe(low);
		expect(low).toBeGreaterThan(0);
	});

	test('the run table passes the deck rules to the Match', () => {
		const run = newRun(1, 'tonhao', 'blefe');
		expect(tableMatch(run, { kind: 'random' }).rules.signals[0]).toBe(2);
	});
});

describe('stakes (B2.2)', () => {
	test('rules pile up', () => {
		expect(stakeRules(1)).toMatchObject({
			goalMult: 1,
			rivalShift: 0,
			rivalHeadStart: 0,
			smallPrize: true,
		});
		expect(stakeRules(8)).toMatchObject({
			goalMult: 1.8,
			interestCap: 3,
			smallPrize: false,
			rivalShift: 2,
			rivalHeadStart: 7,
			priceMult: 1.25,
		});
	});

	test('higher stakes: bigger goals, no small-table prize, rivals start ahead', () => {
		const a = newRun(1, 'tonhao', 'normal', 1);
		const b = newRun(1, 'tonhao', 'normal', 8);
		expect(currentGoal(b)).toBe(Math.round(currentGoal(a) * 1.8));
		expect(tableMatch(b, { kind: 'random' }).state.score.them).toBe(7);
		const r = finishTable(b, {
			won: true,
			rivalTentos: 7,
			money: 0,
			hands: 4,
			bestHand: 10,
		});
		expect(r?.prize).toBe(0);
		expect(parseRun(JSON.parse(JSON.stringify(b)))?.stake).toBe(8);
	});
});

describe('feats, unlocks, almanac and stats (B2.3–B2.4)', () => {
	test('at least 30 feats with unique ids', () => {
		expect(FEATS.length).toBeGreaterThanOrEqual(30);
		expect(new Set(FEATS.map((f) => f.id)).size).toBe(FEATS.length);
	});

	test('a hand at 12 unlocks the legendary Manhas; the iron hand unlocks Viciado', () => {
		const m = meta();
		expect(isUnlocked(m, 'legendary')).toBe(false);
		expect(recordHand(m, hand({ bet: 12 }))).toContain('doze');
		expect(isUnlocked(m, 'legendary')).toBe(true);
		recordHand(m, hand({ lance: 'ferro' }));
		expect(unlockedDecks(m)).toEqual(['normal', 'viciado']);
		// Achieved once only.
		expect(recordHand(m, hand({ bet: 12 }))).not.toContain('doze');
	});

	test('lost hands count in the stats but give no hand feat', () => {
		const m = meta();
		expect(recordHand(m, hand({ won: false, points: 0, called: true }))).toEqual([]);
		expect(m.stats.handsPlayed).toBe(1);
		expect(m.stats.handsWon).toBe(0);
		expect(m.stats.trucosCalled).toBe(1);
	});

	test('tables: perfect and bosses; bosses enter the almanac', () => {
		const m = meta();
		expect(recordTable(m, { won: true, rivalTentos: 0, boss: 'valentao' })).toEqual([
			'mesaPerfeita',
			'chefe',
			'valentao',
		]);
		expect(m.seen).toContain('boss:valentao');
	});

	test('run end: history, Stake progress, partner feat; Championship 4 unlocks Juninho', () => {
		const m = meta();
		const run = newRun(1, 'tonhao', 'normal', 1);
		run.champ = 4;
		expect(recordRunState(m, run)).toContain('campeonato4');
		expect(isUnlocked(m, 'partner:juninho')).toBe(true);
		run.champ = 8;
		const got = recordRunEnd(m, run, 'won', 1000);
		expect(got).toContain('reiDoTruco');
		expect(got).toContain('comTonhao');
		expect(m.stats.wins).toBe(1);
		expect(m.stats.history[0]).toMatchObject({
			reason: 'won',
			championship: 8,
			partner: 'tonhao',
		});
		expect(maxStake(m, 'normal')).toBe(2);
		expect(maxStake(m, 'interior')).toBe(1);
	});
});
