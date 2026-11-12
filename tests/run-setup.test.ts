import { describe, expect, test } from 'bun:test';
import { DECK_IDS, DECKS, type DeckId, deckNeedsPartner } from '../src/data/decks';
import { DEFAULT_UNLOCKS, FEATS, type FeatDef } from '../src/data/feats';
import { MAX_STAKE, stakeChanges, stakeRules } from '../src/data/stakes';
import {
	canStartRun,
	type HandInfo,
	isUnlocked,
	maxStake,
	recordHand,
	recordRunEnd,
	recordRunState,
	recordTable,
	unlockFeat,
} from '../src/logic/meta';
import { buy, finishTable, newRun, type RunState, reroll, rerollCost } from '../src/logic/run/run';
import { defaultSave, parseSave, serializeSave, validateSave } from '../src/logic/save';

const meta = () => defaultSave('en').meta;

describe('New run setup (R7.1, R7.2)', () => {
	test('the setup choices reach the run', () => {
		const run = newRun(3, 'bruto', 'interior', 5);
		expect(run.startDeck).toBe('interior');
		expect(run.stake).toBe(5);
		expect(newRun(3, undefined, 'normal', 3, false, false, '1v1').mode).toBe('1v1');
	});

	test('a first-time player starts with the defaults in one confirm', () => {
		const m = meta();
		expect(canStartRun(m, '2v2', 'normal', 1)).toBe(true);
		expect(canStartRun(m, '1v1', 'normal', 1)).toBe(true);
	});

	test('a locked Stake or deck cannot be started', () => {
		const m = meta();
		expect(canStartRun(m, '2v2', 'normal', 2)).toBe(false);
		expect(canStartRun(m, '2v2', 'viciado', 1)).toBe(false);
		expect(canStartRun(m, '2v2', 'normal', 0)).toBe(false);
		// Winning at Stake 1 opens Stake 2 of that deck only.
		const won = newRun(1, 'bruto', 'normal', 1);
		won.champ = 8;
		recordRunEnd(m, won, 'won', 1);
		expect(maxStake(m, 'normal')).toBe(2);
		expect(canStartRun(m, '2v2', 'normal', 2)).toBe(true);
		expect(canStartRun(m, '2v2', 'normal', 3)).toBe(false);
		m.unlocked.push('deck:interior');
		expect(canStartRun(m, '2v2', 'interior', 2)).toBe(false);
	});

	test('a deck that needs a partner is closed in the 1×1 run', () => {
		const m = meta();
		m.unlocked.push('deck:blefe');
		expect(deckNeedsPartner('blefe')).toBe(true);
		expect(canStartRun(m, '2v2', 'blefe', 1)).toBe(true);
		expect(canStartRun(m, '1v1', 'blefe', 1)).toBe(false);
	});

	test('the last choices survive a save round trip; a broken one falls back', () => {
		const save = defaultSave('en');
		save.settings.runSetup = { mode: '1v1', stake: 4, deck: 'dinheiro' };
		const back = parseSave(serializeSave(save), 'en');
		expect(back.ok).toBe(true);
		if (!back.ok) return;
		expect(back.save.settings.runSetup).toEqual({ mode: '1v1', stake: 4, deck: 'dinheiro' });
		const broken = validateSave(
			{ settings: { runSetup: { mode: 'x', stake: 99, deck: 'nope' } } },
			'en',
		);
		expect(broken.settings.runSetup).toEqual({ mode: '2v2', stake: MAX_STAKE, deck: 'normal' });
		expect(validateSave({}, 'en').settings.runSetup).toBeUndefined();
	});

	test('every Stake past the first lists what it changes, read off its rules', () => {
		expect(stakeChanges(1)).toEqual([]);
		for (let n = 2; n <= MAX_STAKE; n++) expect(stakeChanges(n).length).toBeGreaterThan(0);
		expect(stakeChanges(8)).toContainEqual({ k: 'price', n: 25 });
	});

	test('the curve never eases: every rule is at least as hard as the Stake below', () => {
		for (let n = 2; n <= MAX_STAKE; n++) {
			const now = stakeRules(n);
			const was = stakeRules(n - 1);
			expect(now.goalMult).toBeGreaterThanOrEqual(was.goalMult);
			expect(now.rivalHeadStart).toBeGreaterThanOrEqual(was.rivalHeadStart);
			expect(now.rivalShift).toBeGreaterThanOrEqual(was.rivalShift);
			expect(now.priceMult).toBeGreaterThanOrEqual(was.priceMult);
			expect(now.interestCap).toBeLessThanOrEqual(was.interestCap);
		}
		expect(stakeRules(1).goalMult).toBe(1);
	});

	test('every deck has a card back of its own', () => {
		expect(new Set(DECK_IDS.map((d) => DECKS[d].back)).size).toBe(DECK_IDS.length);
	});
});

describe('every unlock is reachable in the 1.0 configuration (R7.3)', () => {
	const hand = (o: Partial<HandInfo>): HandInfo => ({
		won: true,
		points: 50,
		bet: 1,
		lance: 'limpa',
		weak: false,
		called: false,
		bluff: false,
		...o,
	});

	/** Plays what the feat asks for through the same recorders the scenes call. */
	const achieve = (f: FeatDef): ReturnType<typeof meta> => {
		const m = meta();
		const r = f.rule;
		const run: RunState = newRun(1, 'bruto');
		switch (r.on) {
			case 'hand':
				recordHand(
					m,
					hand({
						points: r.k === 'points' ? r.n : 50,
						...(r.k === 'bet12' ? { bet: 12 } : {}),
						...(r.k === 'iron' ? { lance: 'queda', iron: true } : {}),
						...(r.k === 'weakWin' ? { weak: true } : {}),
						...(r.k === 'bluffWin' ? { bluff: true, called: true } : {}),
						...(r.k === 'queda' || r.k === 'virada' || r.k === 'onze'
							? { lance: r.k }
							: {}),
					}),
				);
				break;
			case 'table':
				recordTable(m, {
					won: true,
					rivalTentos: 0,
					boss: r.k === 'bossId' ? r.id : 'valentao',
				});
				break;
			case 'life':
				m.stats[r.k] = r.n;
				recordHand(m, hand({}));
				break;
			case 'run':
				if (r.k === 'champ') run.champ = r.n;
				if (r.k === 'money') run.money = r.n;
				if (r.k === 'wonStake') run.stake = r.n;
				if (r.k === 'endless') {
					run.endless = true;
					run.champ = r.n;
				}
				if (r.k === 'wonDeck') run.startDeck = r.deck;
				if (r.k === 'wonWith') run.partner = r.partner;
				if (r.k === 'won' || r.k === 'wonWith' || r.k === 'wonDeck' || r.k === 'wonStake')
					recordRunEnd(m, run, 'won', 1);
				else recordRunState(m, run);
		}
		return m;
	};

	test('each feat that unlocks something fires through the recorders', () => {
		const unlocking = FEATS.filter((f) => f.unlocks);
		expect(unlocking.length).toBeGreaterThanOrEqual(5);
		for (const f of unlocking) {
			const m = achieve(f);
			expect(m.feats).toContain(f.id);
			expect(isUnlocked(m, f.unlocks as string)).toBe(true);
		}
	});

	test('every unlock names content that exists and a feat that gives it', () => {
		const keys = [...DECK_IDS.map((d) => `deck:${d}`)];
		for (const k of keys) {
			const open = (DEFAULT_UNLOCKS as readonly string[]).includes(k);
			expect(open || unlockFeat(k) !== undefined).toBe(true);
		}
		for (const f of FEATS)
			if (f.unlocks?.startsWith('deck:'))
				expect(keys).toContain(f.unlocks as `deck:${DeckId}`);
	});

	test('no feat unlocks something a 1.0 run cannot use (Manhas are not sold)', () => {
		for (const f of FEATS) expect(f.unlocks).not.toBe('legendary');
	});
});

describe('the shop reroll (D-82)', () => {
	const shopRun = (money: number): RunState => {
		const run = newRun(21, 'bruto');
		finishTable(run, { won: true, rivalTentos: 0, money: 0, hands: 5, bestHand: 10 });
		run.money = money;
		return run;
	};

	test('it charges the price, which rises with each reroll in the same shop', () => {
		const run = shopRun(100);
		const first = rerollCost(run);
		expect(reroll(run)).toBeNull();
		expect(run.money).toBe(100 - first);
		const second = rerollCost(run);
		expect(second).toBeGreaterThan(first);
		expect(reroll(run)).toBeNull();
		expect(run.money).toBe(100 - first - second);
		expect(run.shop?.rerolls).toBe(2);
	});

	test('it rolls trinkets again, never one the run holds at that level', () => {
		const run = shopRun(500);
		for (let i = 0; i < 6; i++) {
			expect(reroll(run)).toBeNull();
			const offers = run.shop?.offers ?? [];
			expect(offers.length).toBeGreaterThan(0);
			for (const [k, o] of offers.entries()) {
				expect(o.kind).toBe('trinket');
				if (o.kind !== 'trinket') continue;
				expect(o.sold).toBe(false);
				expect(o.level).toBeGreaterThan(run.collection[o.id] ?? 0);
				if (k === 0 && buy(run, 0) !== null) throw new Error('buy failed');
			}
		}
	});

	test('no money: the error comes back and nothing changes', () => {
		const run = shopRun(1);
		const before = JSON.stringify(run.shop);
		expect(reroll(run)).toBe('money');
		expect(run.money).toBe(1);
		expect(JSON.stringify(run.shop)).toBe(before);
	});

	test('a shop that follows a won Championship keeps its level-4 offer', () => {
		const run = newRun(5, 'bruto');
		run.table = 2;
		run.money = 500;
		finishTable(run, { won: true, rivalTentos: 0, money: 0, hands: 5, bestHand: 10 });
		expect(run.shop?.afterBoss).toBe(true);
		for (let i = 0; i < 4; i++) {
			expect(reroll(run)).toBeNull();
			expect(run.shop?.offers.some((o) => o.kind === 'trinket' && o.level === 4)).toBe(true);
		}
	});
});
