/**
 * Good-bot win rate per Stake and per starting deck (R7.1, R7.2), one process per column in
 * parallel. Same seeds as `bun run balance` (100 000 + i).
 *   bun scripts/stakes.ts [--runs 300] [--mode 2v2|1v1]   the Stake curve (must fall monotonically)
 *   bun scripts/stakes.ts --stakes 7,8                     only some Stakes (to tune one step)
 *   bun scripts/stakes.ts --decks [--stake 1]              each deck against the normal one (±5 p.p.)
 */

import { RUN_MODES, type RunMode } from '../src/data/championships';
import { DECK_IDS, type DeckId } from '../src/data/decks';
import { MAX_STAKE } from '../src/data/stakes';
import { simulateRun } from '../src/game/run-sim';

const args = process.argv.slice(2);
const opt = (name: string): string | undefined => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : undefined;
};
const runs = Number(opt('runs') ?? 300) || 300;
const modeArg = opt('mode');
const mode: RunMode = RUN_MODES.find((m) => m === modeArg) ?? '2v2';
const decks = args.includes('--decks');
const stakeArg = Number(opt('stake') ?? 1) || 1;
/** Allowed gap between a deck and the normal one (ROADMAP R7.2). */
const DECK_BAND = 5;
/** Chunks per column: more processes finish sooner on a machine with free cores. */
const split = Number(opt('split') ?? 3) || 3;

if (opt('one') !== undefined) {
	// Child: runs `--from` to `--to` of one column (a Stake, or a deck at `--stake`); prints wins and champs.
	const key = opt('one') as string;
	const deck = (decks ? key : 'normal') as DeckId;
	const stake = decks ? stakeArg : Number(key);
	const from = Number(opt('from') ?? 0);
	const to = Number(opt('to') ?? runs);
	let won = 0;
	let champs = 0;
	for (let i = from; i < to; i++) {
		const r = simulateRun(100_000 + i, 'good', 8, stake, undefined, mode, deck);
		if (r.won) won++;
		champs += r.champ;
	}
	console.log(`${won} ${champs}`);
} else {
	const keys: string[] = decks
		? [...DECK_IDS]
		: (opt('stakes')?.split(',') ?? Array.from({ length: MAX_STAKE }, (_, i) => String(i + 1)));
	const cols = await Promise.all(
		keys.map(async (key) => {
			const parts = await Promise.all(
				Array.from({ length: split }, async (_, c) => {
					const p = Bun.spawn([
						'bun',
						import.meta.path,
						'--one',
						key,
						'--from',
						String(Math.floor((c * runs) / split)),
						'--to',
						String(Math.floor(((c + 1) * runs) / split)),
						'--mode',
						mode,
						'--stake',
						String(stakeArg),
						...(decks ? ['--decks'] : []),
					]);
					const [w = 0, ch = 0] = (await new Response(p.stdout).text()).trim().split(' ');
					return [Number(w), Number(ch)] as const;
				}),
			);
			return {
				rate: Math.round((parts.reduce((a, [w]) => a + w, 0) / runs) * 1000) / 10,
				champ: Math.round((parts.reduce((a, [, ch]) => a + ch, 0) / runs) * 100) / 100,
			};
		}),
	);
	const rates = cols.map((c) => c.rate);
	const champs = cols.map((c) => c.champ);
	console.log(`mode ${mode}, ${runs} runs each`);
	console.log(`mean Championship reached: ${keys.map((k, i) => `${k}:${champs[i]}`).join('  ')}`);
	if (decks) {
		const base = rates[0] ?? 0;
		console.log(
			`win % at Stake ${stakeArg}: ${keys.map((k, i) => `${k}:${rates[i]}`).join('  ')}`,
		);
		const ok = rates.every((r) => Math.abs(r - base) <= DECK_BAND);
		console.log(
			ok
				? `PASS every deck within ±${DECK_BAND} p.p. of normal`
				: 'FAIL a deck is outside the band',
		);
		process.exit(ok ? 0 : 1);
	}
	console.log(`win %: ${rates.map((r, i) => `${keys[i]}:${r}`).join('  ')}`);
	const steps = rates.slice(1).map((r, i) => (rates[i] ?? 0) - r);
	console.log(`drop p.p.: ${steps.map((d) => d.toFixed(1)).join('  ')}`);
	const ok = steps.every((d) => d >= 0);
	console.log(
		ok
			? 'PASS the rate never rises from one Stake to the next'
			: 'FAIL a Stake is easier than the one below',
	);
	process.exit(ok ? 0 : 1);
}
