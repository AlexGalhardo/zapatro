/**
 * Headless runs (PLAN §10.2): win rate, Championship reached, hands per table and favourite Manhas.
 *   bun scripts/sim.ts [--runs 500] [--bot good|random] [--seed 1] [--champ 8] [--stake 1]
 *     [--partner tonhao|donaCida|zeMalandro|juninho] [--skip none|small|both]
 * `--skip`: tables the good bot skips for a Promise (GD-020 measures the skip against `none`).
 * `--stake` has no effect until the Estacas exist (B2); the bot already carries it.
 */
import type { CompanionId } from '../src/data/companions';
import { HABITS, type RunBot, simulateRun } from '../src/game/run-sim';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const runs = Number(opt('runs', '500'));
const bot = opt('bot', 'good') as RunBot;
const seed = Number(opt('seed', '1'));
const champ = Number(opt('champ', '8'));
const stake = Number(opt('stake', '1'));
const partner = (opt('partner', '') || undefined) as CompanionId | undefined;
const skip = opt('skip', 'none');
HABITS.skip = { small: skip !== 'none', big: skip === 'both' };

const t0 = performance.now();
const out = Array.from({ length: runs }, (_, i) =>
	simulateRun(seed * 100_000 + i, bot, champ, stake, partner),
);
const wins = out.filter((o) => o.won).length;
const reached = out.map((o) => o.champ);
const perTable = out.flatMap((o) => o.handsPerTable);
const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const manhas = new Map<string, number>();
for (const o of out) for (const m of o.manhas) manhas.set(m, (manhas.get(m) ?? 0) + 1);
const byChamp = Array.from({ length: 9 }, (_, c) => reached.filter((r) => r === c + 1).length);
console.log(
	JSON.stringify(
		{
			bot,
			stake,
			partner: partner ?? 'tonhao|donaCida',
			skip,
			runs,
			seed,
			winRate: Number((wins / runs).toFixed(3)),
			avgChampReached: Number(avg(reached).toFixed(2)),
			endedAtChamp: byChamp,
			handsPerTable: Number(avg(perTable).toFixed(2)),
			avgMoney: Number(avg(out.map((o) => o.money)).toFixed(1)),
			topManhas: [...manhas.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 8)
				.map(([id, n]) => `${id}:${n}`),
			ms: Math.round(performance.now() - t0),
		},
		null,
		0,
	),
);
