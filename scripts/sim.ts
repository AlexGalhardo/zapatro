/**
 * Headless runs (PLAN §10.2): win rate, Championship reached, hands per table and favourite Manhas.
 *   bun scripts/sim.ts [--runs 500] [--bot good|random] [--seed 1] [--champ 8] [--stake 1]
 *     [--partner bruto|cida|jhony|nino]
 * `--stake` has no effect until the Estacas exist (B2); the bot already carries it.
 *
 * 1v1 quick matches (mano a mano, plain Truco to 12), invariants checked on every hand:
 *   bun scripts/sim.ts --mode 1v1 [--matches 2000] [--seed 1] [--bot good|random]
 * `--bot good` seats the `pro` AI against the random bot; `random` seats random against random.
 */
import { AI_PROFILES } from '../src/data/ai-profiles';
import type { CompanionId } from '../src/data/companions';
import type { SeatBrain } from '../src/game/match';
import { type RunBot, simulateRun } from '../src/game/run-sim';
import { playHeadsUp } from './lib/heads-up';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};

if (opt('mode', 'run') === '1v1') {
	const matches = Number(opt('matches', '2000'));
	const seed = Number(opt('seed', '1'));
	const random: SeatBrain = { kind: 'random' };
	const us: SeatBrain =
		opt('bot', 'good') === 'random' ? random : { kind: 'ai', profile: AI_PROFILES.pro };
	const t0 = performance.now();
	let wins = 0;
	let hands = 0;
	let aiMs = 0;
	let aiDecisions = 0;
	for (let i = 0; i < matches; i++) {
		const r = playHeadsUp(seed * 100_000 + i, [us, random]);
		if (r.winner === 'us') wins++;
		hands += r.hands;
		aiMs += r.aiMs;
		aiDecisions += r.aiDecisions;
	}
	console.log(
		JSON.stringify({
			mode: '1v1',
			bot: opt('bot', 'good'),
			matches,
			seed,
			winRate: Number((wins / matches).toFixed(3)),
			handsPerMatch: Number((hands / matches).toFixed(2)),
			aiDecisions,
			aiMsPerDecision: Number((aiMs / Math.max(1, aiDecisions)).toFixed(3)),
			ms: Math.round(performance.now() - t0),
		}),
	);
	process.exit(0);
}

const runs = Number(opt('runs', '500'));
const bot = opt('bot', 'good') as RunBot;
const seed = Number(opt('seed', '1'));
const champ = Number(opt('champ', '8'));
const stake = Number(opt('stake', '1'));
const partner = (opt('partner', '') || undefined) as CompanionId | undefined;

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
			partner: partner ?? 'bruto|cida',
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
