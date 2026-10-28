import { expect, test } from 'bun:test';
import { COMPANION_IDS } from '../src/data/companions';
import { finishTable, newRun, projectedReward, type TableResult } from '../src/logic/run/run';

const win = (money: number, rivalTentos: number): TableResult => ({
	won: true,
	rivalTentos,
	money,
	hands: 5,
	bestHand: 50,
});

test("the table's prize card shows exactly what the win pays", () => {
	let cases = 0;
	for (const partner of COMPANION_IDS)
		for (const stake of [1, 4, 8])
			for (const table of [0, 1, 2] as const)
				for (const [startMoney, tableMoney, rival] of [
					[0, 0, 0],
					[4, 3, 6],
					[27, -2, 11],
					[60, 5, 3],
					[1, -9, 12],
				] as const) {
					const run = newRun(7 + cases, partner, 'normal', stake);
					run.table = table;
					run.money = startMoney;
					const { gain, mayDouble } = projectedReward(run, tableMoney, rival);
					const before = run.money;
					const reward = finishTable(run, win(tableMoney, rival));
					const paid = run.money - before;
					expect(mayDouble).toBe(partner === 'sheila');
					if (reward?.doubled) {
						// Sheila doubles what the table earned (never its losses) and the reward lines.
						expect(paid).toBe(
							gain +
								Math.max(0, tableMoney) +
								reward.prize +
								reward.speed +
								reward.interest +
								reward.partner,
						);
					} else expect(paid).toBe(gain);
					cases++;
				}
	expect(cases).toBe(COMPANION_IDS.length * 45);
});
