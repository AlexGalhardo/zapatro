/**
 * Good-bot win rate per Stake (PLAN B2.2, D-39: each Stake takes 5–8 p.p. off), one process per
 * Stake in parallel. Same seeds as `bun run balance` (100 000 + i).
 *   bun scripts/stakes.ts [--runs 300]
 */

import { MAX_STAKE } from '../src/data/stakes';
import { simulateRun } from '../src/game/run-sim';

const args = process.argv.slice(2);
const runs = Number(args[args.indexOf('--runs') + 1] ?? 300) || 300;
const one = args.indexOf('--one');

if (one >= 0) {
	// Child: one Stake, prints its win rate.
	const stake = Number(args[one + 1]);
	let won = 0;
	for (let i = 0; i < runs; i++) if (simulateRun(100_000 + i, 'good', 8, stake).won) won++;
	console.log(((won / runs) * 100).toFixed(1));
} else {
	const rates = await Promise.all(
		Array.from({ length: MAX_STAKE }, async (_, i) => {
			const p = Bun.spawn([
				'bun',
				import.meta.path,
				'--one',
				String(i + 1),
				'--runs',
				String(runs),
			]);
			return Number((await new Response(p.stdout).text()).trim());
		}),
	);
	const steps = rates.slice(1).map((r, i) => (rates[i] ?? 0) - r);
	console.log(`win %: ${rates.map((r, i) => `${i + 1}:${r}`).join('  ')}`);
	console.log(`drop p.p.: ${steps.map((d) => d.toFixed(1)).join('  ')}`);
	const ok = steps.every((d) => d >= 5 && d <= 8);
	console.log(ok ? 'PASS every Stake takes 5–8 p.p.' : 'FAIL some step is outside 5–8 p.p.');
	process.exit(ok ? 0 : 1);
}
