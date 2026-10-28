import { describe, expect, test } from 'bun:test';
import { TRINKETS } from '../src/config/features';
import { CHAMPIONSHIP_GOALS } from '../src/data/championships';
import { ECONOMY } from '../src/data/economy';
import {
	buy,
	canSkip,
	choosePack,
	continueEndless,
	currentBoss,
	currentGoal,
	finishTable,
	leaveShop,
	moveManha,
	newRun,
	parseRun,
	type RunState,
	reroll,
	rerollCost,
	sellManha,
	skipTable,
	startTable,
	type TableResult,
	useConsumable,
} from '../src/logic/run/run';

const win = (o: Partial<TableResult> = {}): TableResult => ({
	won: true,
	rivalTentos: 6,
	money: 0,
	hands: 5,
	bestHand: 50,
	...o,
});

/** Wins tables until the given Championship/table, leaving each shop at once. */
function reach(run: RunState, champ: number, table: number): void {
	while (run.champ < champ || run.table < table) {
		startTable(run);
		finishTable(run, win());
		leaveShop(run);
	}
}

describe('run (A4)', () => {
	test('the demo ends after the first boss (Championship 1, D-33)', () => {
		const run = newRun(1, 'bruto', 'normal', 1, false, true);
		reach(run, 1, 2);
		startTable(run);
		finishTable(run, win());
		expect(run.phase).toBe('won');
		expect(run.champ).toBe(1);
	});

	test('a new run: Championship 1 small table, first goal, partner level 1, full deck', () => {
		const run = newRun(1, 'bruto');
		expect(run.champ).toBe(1);
		expect(run.table).toBe(0);
		expect(currentGoal(run)).toBe(CHAMPIONSHIP_GOALS[0]);
		// 40 cards plus two jokers (PLAN §5.12) and the Clover, the Eye and the Lightning.
		expect(run.deck).toHaveLength(45);
		expect(run.deck.filter((c) => c.rank === 'joker')).toHaveLength(2);
		for (const rank of ['trevo', 'olho', 'raio'])
			expect(run.deck.filter((c) => c.rank === rank)).toHaveLength(1);
		expect(run.bosses).toHaveLength(8);
		expect(run.bosses[7]).toBe('reiDoTruco');
		expect(run.money).toBe(ECONOMY.startMoney);
	});

	test('winning pays prize + speed + interest and opens the shop (A4.2)', () => {
		const run = newRun(1, 'bruto');
		run.money = 12;
		startTable(run);
		const r = finishTable(run, win({ rivalTentos: 9, money: 3 }));
		// Prize 3 (small), speed 12-9 = 3, interest floor(15/5) = 3.
		expect(r).toEqual({
			table: 3,
			prize: 3,
			speed: 3,
			interest: 3,
			partner: 0,
			doubled: false,
		});
		expect(run.money).toBe(12 + 3 + 3 + 3 + 3);
		expect(run.phase).toBe('shop');
		expect(run.table).toBe(1);
		expect(run.shop?.offers).toHaveLength(ECONOMY.offers);
	});

	test('speed and interest are capped', () => {
		const run = newRun(1, 'bruto');
		run.money = 100;
		const r = finishTable(run, win({ rivalTentos: 0 }));
		expect(r?.speed).toBe(ECONOMY.speedCap);
		expect(r?.interest).toBe(ECONOMY.interestCap);
	});

	test('losing a table ends the run', () => {
		const run = newRun(1, 'bruto');
		expect(finishTable(run, win({ won: false }))).toBeNull();
		expect(run.phase).toBe('lost');
	});

	test('the boss table; Championship 8 ends the run, endless goes on', () => {
		const run = newRun(3, 'cida');
		reach(run, 1, 2);
		expect(currentBoss(run)).toBe(run.bosses[0]);
		expect(canSkip(run)).toBe(false);
		finishTable(run, win());
		leaveShop(run);
		reach(run, 8, 2);
		expect(currentBoss(run)).toBe('reiDoTruco');
		finishTable(run, win());
		expect(run.phase).toBe('won');
		continueEndless(run);
		expect(run.champ).toBe(9);
		expect(run.phase).toBe('shop');
		expect(currentGoal(run)).toBeGreaterThan(CHAMPIONSHIP_GOALS[7]);
	});

	test.skipIf(TRINKETS)('skipping gives a Promise that is cashed at the next shop (A4.4)', () => {
		const run = newRun(5, 'bruto');
		const p = skipTable(run);
		expect(p).not.toBeNull();
		expect(run.table).toBe(1);
		const money = run.money;
		const offers = run.promises.includes('manhaRara');
		const packs = run.promises.includes('pacoteGratis');
		finishTable(run, win({ rivalTentos: 12 }));
		expect(run.promises).toHaveLength(0);
		if (p === 'dezReais') expect(run.money).toBeGreaterThanOrEqual(money + 10);
		if (offers) expect(run.shop?.offers.some((o) => o.price === 0)).toBe(true);
		if (packs) expect(run.shop?.packs.some((o) => o.price === 0)).toBe(true);
	});

	test.skipIf(TRINKETS)(
		'a Promise is only cashed if the next table is won (P-08, GD-020)',
		() => {
			const lost = newRun(5, 'bruto');
			const won = newRun(5, 'bruto');
			for (const run of [lost, won]) {
				skipTable(run);
				run.promises = ['dezReais'];
			}
			const money = lost.money;
			finishTable(lost, win({ won: false, money: 0 }));
			expect(lost.phase).toBe('lost');
			expect(lost.shop).toBeNull();
			expect(lost.money).toBe(money);
			finishTable(won, win({ money: 0, rivalTentos: 12 }));
			expect(won.phase).toBe('shop');
			expect(won.money).toBeGreaterThanOrEqual(money + 10);
			expect(won.promises).toHaveLength(0);
		},
	);

	test('skipping the next table too forfeits the Promise still waiting (P-08)', () => {
		const run = newRun(5, 'bruto');
		skipTable(run);
		const second = skipTable(run);
		expect(run.table).toBe(2);
		expect(run.promises).toEqual(second ? [second] : []);
	});
});

describe('shop (A4.3)', () => {
	const shopRun = (): RunState => {
		const run = newRun(11, 'bruto');
		finishTable(run, win());
		run.money = 100;
		return run;
	};

	test('buy a Manha, sell it for half, reorder', () => {
		const run = shopRun();
		const shop = run.shop;
		if (!shop) throw new Error('no shop');
		shop.offers = [
			{ kind: 'manha', id: 'seuZe', price: 5, sold: false },
			{ kind: 'manha', id: 'malandro', price: 4, sold: false },
		];
		expect(buy(run, 'offers', 0)).toBeNull();
		expect(buy(run, 'offers', 0)).toBe('sold');
		expect(buy(run, 'offers', 1)).toBeNull();
		expect(run.manhas).toEqual(['seuZe', 'malandro']);
		expect(run.money).toBe(91);
		moveManha(run, 1, 0);
		expect(run.manhas).toEqual(['malandro', 'seuZe']);
		sellManha(run, 1);
		expect(run.manhas).toEqual(['malandro']);
		expect(run.money).toBe(93);
	});

	test('no money, no room', () => {
		const run = shopRun();
		const shop = run.shop;
		if (!shop) throw new Error('no shop');
		run.money = 1;
		shop.offers = [{ kind: 'manha', id: 'teatro', price: 8, sold: false }];
		expect(buy(run, 'offers', 0)).toBe('money');
		run.money = 50;
		run.manhas = ['malandro', 'seuZe', 'maoLeve', 'cangaceiro', 'peQuente'];
		expect(buy(run, 'offers', 0)).toBe('slots');
	});

	test('reroll costs more each time in the same shop', () => {
		const run = shopRun();
		const first = rerollCost(run);
		expect(reroll(run)).toBeNull();
		expect(rerollCost(run)).toBe(first + ECONOMY.rerollStep);
		expect(run.money).toBe(100 - first);
	});

	test('a deck pack adds the chosen card to the shared deck', () => {
		const run = shopRun();
		const shop = run.shop;
		if (!shop) throw new Error('no shop');
		shop.packs = [{ kind: 'pack', pack: 'baralho', price: 4, sold: false }];
		expect(buy(run, 'packs', 0)).toBeNull();
		expect(shop.opened?.length).toBe(4);
		expect(choosePack(run, 0)).toBeNull();
		expect(run.deck).toHaveLength(46);
		expect(new Set(run.deck.map((c) => c.id)).size).toBe(46);
		expect(shop.opened).toBeNull();
	});

	test('the upgrade: one per Championship, applied at once', () => {
		const run = shopRun();
		const shop = run.shop;
		if (!shop) throw new Error('no shop');
		shop.upgrade = { kind: 'upgrade', id: 'maisManha', price: 10, sold: false };
		expect(buy(run, 'upgrade')).toBeNull();
		expect(run.manhaSlots).toBe(ECONOMY.manhaSlots + 1);
		leaveShop(run);
		startTable(run);
		finishTable(run, win());
		expect(run.shop?.upgrade).toBeNull();
	});
});

describe('consumables (A3.5)', () => {
	const withItem = (item: RunState['consumables'][number]): RunState => {
		const run = newRun(2, 'bruto');
		run.consumables = [item];
		return run;
	};

	test('Reza de Vó gilds a card; Espelho copies it; Figa changes its suit', () => {
		let run = withItem({ kind: 'simpatia', id: 'rezaDeVo' });
		expect(useConsumable(run, 0, '3c')).toBe(true);
		expect(run.deck.find((c) => c.id === '3c')?.mod).toBe('gold');
		expect(run.consumables).toHaveLength(0);
		run = withItem({ kind: 'simpatia', id: 'espelho' });
		useConsumable(run, 0, '3c');
		expect(run.deck.filter((c) => c.rank === '3' && c.suit === 'clubs')).toHaveLength(2);
		run = withItem({ kind: 'simpatia', id: 'figa' });
		useConsumable(run, 0, '3c');
		expect(run.deck.filter((c) => c.rank === '3' && c.suit === 'clubs')).toHaveLength(0);
		expect(run.deck).toHaveLength(45);
	});

	test('Benzedeira removes a card but never below the minimum deck', () => {
		const run = withItem({ kind: 'simpatia', id: 'benzedeira' });
		expect(useConsumable(run, 0, '4d')).toBe(true);
		expect(run.deck).toHaveLength(44);
		run.deck = run.deck.slice(0, ECONOMY.deckMin);
		run.consumables = [{ kind: 'simpatia', id: 'benzedeira' }];
		expect(useConsumable(run, 0, run.deck[0]?.id)).toBe(false);
		expect(run.deck).toHaveLength(ECONOMY.deckMin);
	});

	test('a Lance card levels that Lance up', () => {
		const run = withItem({ kind: 'lance', id: 'virada' });
		useConsumable(run, 0);
		expect(run.levels.virada).toBe(2);
	});
});

describe('run save (A4.8)', () => {
	test('a run survives JSON and bad data is refused', () => {
		const run = newRun(9, 'cida');
		finishTable(run, win());
		const back = parseRun(JSON.parse(JSON.stringify(run)));
		expect(back).toEqual(run);
		expect(parseRun({ v: 2 })).toBeNull();
		expect(parseRun(null)).toBeNull();
	});
});
