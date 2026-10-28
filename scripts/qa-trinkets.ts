/**
 * QA dos trinkets (docs/trinkets.md). Só lê a lógica; não muda nada.
 *   bun scripts/qa-trinkets.ts [--runs 1000] [--seeds 3] [--shops 10000]
 * Modo 1: win rate do bot bom (base) com o bot que compra e equipa trinkets (`simulateRun`).
 * Modo 2: odds da loja em `shopLevels` com `--shops` lojas sorteadas, após o chefe e fora dele.
 * Saída: uma linha JSON por medida.
 */
import { simulateRun } from '../src/game/run-sim';
import { Rng } from '../src/logic/rng';
import { SHOP_ODDS, shopLevels } from '../src/logic/run/trinkets';

const args = process.argv.slice(2);
const opt = (name: string, d: number): number => {
	const i = args.indexOf(`--${name}`);
	return Number(i >= 0 ? (args[i + 1] ?? d) : d);
};
const runs = opt('runs', 1000);
const seeds = opt('seeds', 3);
const shops = opt('shops', 10000);

const winRate = (label: string): void => {
	const rows = Array.from({ length: seeds }, (_, s) =>
		Array.from({ length: runs }, (_, i) => simulateRun((s + 1) * 100_000 + i, 'good', 8, 1)),
	).flat();
	const wins = rows.filter((o) => o.won).length / rows.length;
	const champ = rows.reduce((a, o) => a + o.champ, 0) / rows.length;
	const hands = rows.flatMap((o) => o.handsPerTable);
	const perTable = hands.reduce((a, b) => a + b, 0) / Math.max(1, hands.length);
	console.log(
		JSON.stringify({
			label,
			runs: rows.length,
			winRate: Number(wins.toFixed(3)),
			avgChampReached: Number(champ.toFixed(2)),
			handsPerTable: Number(perTable.toFixed(2)),
		}),
	);
};

const odds = (afterBoss: boolean): void => {
	const rng = new Rng(afterBoss ? 7 : 11);
	const counts: Record<string, number> = { legendary: 0, rare: 0, epic: 0 };
	for (let i = 0; i < shops; i++) {
		const levels = shopLevels(rng, afterBoss);
		if (levels.includes(4)) counts.legendary = (counts.legendary ?? 0) + 1;
		if (levels.includes(2)) counts.rare = (counts.rare ?? 0) + 1;
		if (levels.includes(3)) counts.epic = (counts.epic ?? 0) + 1;
	}
	const share = (k: string): number => Number(((counts[k] ?? 0) / shops).toFixed(4));
	console.log(
		JSON.stringify({
			label: `loja ${afterBoss ? 'após chefe' : 'comum'}`,
			shops,
			legendary: share('legendary'),
			rare: share('rare'),
			epic: share('epic'),
			expected: { rare: SHOP_ODDS.rare, epic: SHOP_ODDS.epic, legendaryAfterBoss: 1 },
		}),
	);
};

odds(true);
odds(false);
winRate('base: bot bom com trinkets (compra e equipa)');
