import { describe, expect, test } from 'bun:test';
import { DECK_IDS } from '../src/data/decks';
import { FEATS } from '../src/data/feats';
import { MAX_STAKE } from '../src/data/stakes';
import { recordRunStart } from '../src/logic/meta';
import { finishTable, newRun, parseRun, type TableResult } from '../src/logic/run/run';
import { nextUnlock, runSummary, unlockedThisRun } from '../src/logic/run/summary';
import { defaultSave } from '../src/logic/save';
import { itemPoints } from '../src/logic/score/item-points';
import { type ScoreStep, totals } from '../src/logic/score/score';

const meta = () => defaultSave('en').meta;
const win = (o: Partial<TableResult> = {}): TableResult => ({
	won: true,
	rivalTentos: 5,
	money: 0,
	hands: 4,
	bestHand: 100,
	...o,
});

describe('points per item (R6.4)', () => {
	const steps: ScoreStep[] = [
		{ source: 'lance:limpa', chips: 10 },
		{ source: 'bet', addMult: 3 },
		{ source: 'manha:zapZap', addMult: 2 },
		{ source: 'trinket:peDeCoelho', xMult: 2 },
		{ source: 'manha:rico', money: 3 },
	];

	test('each item is worth the hand minus the hand without it', () => {
		const items = itemPoints(steps);
		expect(totals(steps).points).toBe(100);
		expect(items['manha:zapZap']).toBe(40);
		expect(items['trinket:peDeCoelho']).toBe(50);
		expect(items['manha:rico']).toBe(0);
	});

	test('steps that are not items are not listed', () => {
		expect(Object.keys(itemPoints(steps)).sort()).toEqual([
			'manha:rico',
			'manha:zapZap',
			'trinket:peDeCoelho',
		]);
		expect(itemPoints([{ source: 'bet', addMult: 3 }])).toEqual({});
	});
});

describe('run summary (R6.4)', () => {
	test('the numbers are the ones in run.stats, and the top item is the one with most points', () => {
		const run = newRun(7, 'cida', 'interior', 3);
		run.trinkets = ['peDeCoelho'];
		finishTable(run, win({ hands: 5, bestHand: 300, items: { 'manha:zapZap': 40 } }));
		finishTable(
			run,
			win({
				hands: 6,
				bestHand: 120,
				items: { 'manha:zapZap': 10, 'trinket:peDeCoelho': 80 },
			}),
		);
		const s = runSummary(run);
		expect(s.tables).toBe(run.stats.tables);
		expect(s.hands).toBe(11);
		expect(s.bestHand).toBe(300);
		expect(s.topItem).toEqual({ kind: 'trinket', id: 'peDeCoelho', points: 80 });
		expect(s).toMatchObject({
			seed: 7,
			stake: 3,
			deck: 'interior',
			mode: '2v2',
			partner: 'cida',
			champ: run.champ,
			money: run.money,
			trinkets: ['peDeCoelho'],
		});
	});

	test('a lost table still counts its hands and items; with no item points there is no top item', () => {
		const run = newRun(1, undefined, 'normal', 1, false, false, '1v1');
		finishTable(run, { ...win({ items: { 'manha:x': 25 } }), won: false });
		expect(run.phase).toBe('lost');
		expect(runSummary(run).topItem).toEqual({ kind: 'manha', id: 'x', points: 25 });
		expect(
			runSummary(newRun(1, undefined, 'normal', 1, false, false, '1v1')).topItem,
		).toBeNull();
	});

	test('a save from before the summary has no items and still reads', () => {
		const run = newRun(2, 'bruto');
		const { items: _, ...stats } = { ...run.stats, items: undefined };
		const old = parseRun(JSON.parse(JSON.stringify({ ...run, stats })));
		expect(old && runSummary(old).topItem).toBeNull();
	});
});

describe('unlocks with direction (R7.3)', () => {
	test('a fresh save points at the first feat that opens something', () => {
		const next = nextUnlock(meta());
		expect(next).toMatchObject({ kind: 'feat', feat: 'ferro', unlocks: 'deck:viciado' });
	});

	test('a save in progress points at the one it is closest to', () => {
		const m = meta();
		m.stats.bluffsWon = 4;
		expect(nextUnlock(m)).toMatchObject({
			kind: 'feat',
			feat: 'mentiroso',
			unlocks: 'partner:jhony',
			have: 4,
			need: 5,
		});
		m.stats.bestChampionship = 3;
		m.stats.bluffsWon = 1;
		expect(nextUnlock(m)).toMatchObject({ feat: 'campeonato4', have: 3, need: 4 });
	});

	test('with everything open it points at the next Stake, and at nothing when all are won', () => {
		const m = meta();
		for (const f of FEATS) if (f.unlocks) m.unlocked.push(f.unlocks);
		expect(nextUnlock(m)).toEqual({ kind: 'stake', deck: 'normal', stake: 1 });
		m.stakes.normal = 3;
		for (const d of DECK_IDS) if (d !== 'normal') m.stakes[d] = 1;
		expect(nextUnlock(m)).toMatchObject({ kind: 'stake', stake: 2 });
		for (const d of DECK_IDS) m.stakes[d] = MAX_STAKE;
		expect(nextUnlock(m)).toBeNull();
	});

	test('a run lists what the profile gained since it began', () => {
		const m = meta();
		const run = newRun(3, 'bruto', 'normal', 2);
		m.stakes.normal = 1;
		recordRunStart(m, run);
		expect(run.before).toEqual({ feats: 0, stakeBest: 1 });
		m.feats.push('primeiraMao', 'ferro');
		m.unlocked.push('deck:viciado');
		run.phase = 'won';
		m.stakes.normal = 2;
		expect(unlockedThisRun(m, run)).toEqual({
			feats: ['primeiraMao', 'ferro'],
			content: ['deck:viciado'],
			stake: 3,
		});
		run.phase = 'lost';
		expect(unlockedThisRun(m, run).stake).toBeNull();
	});

	test('a run saved before the profile snapshot lists nothing', () => {
		const run = newRun(3, 'bruto');
		expect(unlockedThisRun(meta(), run)).toEqual({ feats: [], content: [], stake: null });
	});
});
