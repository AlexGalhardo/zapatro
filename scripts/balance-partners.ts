/**
 * Win rate of the good bot per partner (the Perk and Flaw of each companion, docs/balancing.md).
 *   bun scripts/balance-partners.ts [--runs 1000] [--stake 1]
 * Prints one line per partner: win rate, average Championship reached and money at the end.
 */
import { COMPANION_IDS } from '../src/data/companions';
import { simulateRun } from '../src/game/run-sim';

const args = process.argv.slice(2);
const opt = (name: string, d: number): number => {
	const i = args.indexOf(`--${name}`);
	return Number(i >= 0 ? (args[i + 1] ?? d) : d);
};
const runs = opt('runs', 1000);
const stake = opt('stake', 1);

for (const id of COMPANION_IDS) {
	const out = Array.from({ length: runs }, (_, i) =>
		simulateRun(700_000 + i, 'good', 8, stake, id),
	);
	const wins = out.filter((o) => o.won).length / runs;
	const champ = out.reduce((a, o) => a + o.champ, 0) / runs;
	const money = out.reduce((a, o) => a + o.money, 0) / runs;
	console.log(
		`${id.padEnd(11)} wins ${(wins * 100).toFixed(1).padStart(5)}%  champ ${champ.toFixed(2)}  money ${money.toFixed(1)}`,
	);
}
