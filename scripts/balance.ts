/**
 * Balance gate (PLAN §10.2, D-39): fails when the good bot is outside 5–20% wins at stake 1, the
 * random bot wins 5% or more, a table averages fewer than 4 or more than 12 hands, or any number
 * is NaN. Results go to docs/balancing.md.
 *   bun scripts/balance.ts [--seeds 3] [--runs 500] [--stake 1] [--mode 2v2|1v1]
 * `--mode 1v1` checks the mano a mano run (its own goal table, `CHAMPIONSHIP_GOALS_1V1`) against
 * the same bands; the default stays the 2×2 run.
 * `--stake` has no effect until the Estacas exist (B2): then each Estaca takes 5–8 p.p. off the
 * good bot (D-39) and this gate gets its per-stake band.
 */
import { RUN_MODES, type RunMode } from '../src/data/championships';
import { simulateRun } from '../src/game/run-sim';

const args = process.argv.slice(2);
const opt = (name: string, d: string): number => {
	const i = args.indexOf(`--${name}`);
	return Number(i >= 0 ? (args[i + 1] ?? d) : d);
};
const seeds = opt('seeds', '3');
const runs = opt('runs', '500');
const stake = opt('stake', '1');
const modeArg = args[args.indexOf('--mode') + 1];
const mode: RunMode = RUN_MODES.find((m) => m === modeArg) ?? '2v2';
// Was 40–60%, then 20–35% after the 2026-10-25 doubling. Lowered on purpose on 2026-10-28
// after CHAMPIONSHIP_GOALS doubled again (×2 of 105…560): the good bot sits around 9–13%,
// and 5–20% leaves headroom so seed noise does not flake the gate. Random and pace stay put.
const GOOD = [0.05, 0.2] as const;
const RANDOM_MAX = 0.05;
const PACE = [4, 12] as const;

let fail = false;
const check = (what: string, ok: boolean): void => {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`);
	if (!ok) fail = true;
};
for (let s = 1; s <= seeds; s++) {
	const good = Array.from({ length: runs }, (_, i) =>
		simulateRun(s * 100_000 + i, 'good', 8, stake, undefined, mode),
	);
	const random = Array.from({ length: runs }, (_, i) =>
		simulateRun(s * 100_000 + i, 'random', 8, stake, undefined, mode),
	);
	const rate = (xs: typeof good): number => xs.filter((o) => o.won).length / xs.length;
	const hands = good.flatMap((o) => o.handsPerTable);
	const pace = hands.reduce((a, b) => a + b, 0) / Math.max(1, hands.length);
	const nan = [...good, ...random].some((o) => [o.money, o.bestHand, o.hands].some(Number.isNaN));
	check(
		`seed ${s}: good bot wins ${(rate(good) * 100).toFixed(1)}% (${GOOD[0] * 100}–${GOOD[1] * 100}%)`,
		rate(good) >= GOOD[0] && rate(good) <= GOOD[1],
	);
	check(
		`seed ${s}: random bot wins ${(rate(random) * 100).toFixed(1)}% (< 5%)`,
		rate(random) < RANDOM_MAX,
	);
	check(
		`seed ${s}: ${pace.toFixed(2)} hands per table (4–12)`,
		pace >= PACE[0] && pace <= PACE[1],
	);
	check(`seed ${s}: no NaN`, !nan);
}
process.exit(fail ? 1 : 0);
