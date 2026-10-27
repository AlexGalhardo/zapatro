import { expect, test } from 'bun:test';
import { BOSS_POOL, FINAL_BOSS } from '../src/data/bosses';
import { JOKER_EFFECTS } from '../src/data/jokers';
import { SPECIAL_CARDS } from '../src/data/specials';
import { setLang } from '../src/i18n';
import type { TableState } from '../src/logic/truco/table';
import { handEffects } from '../src/view/hand-effects';

const effects = [...JOKER_EFFECTS, ...Object.values(SPECIAL_CARDS).flat()];
const state = (kind: TableState['kind'], played: string[]): TableState =>
	({
		kind,
		tricks: [{ opener: 0, plays: played.map((effect) => ({ seat: 0, card: {}, effect })) }],
	}) as unknown as TableState;

test('a plain hand has no effect line; every effect, boss and hand kind has a name', () => {
	for (const lang of ['en', 'pt-BR'] as const) {
		setLang(lang);
		expect(handEffects(state('normal', []), undefined)).toEqual([]);
		for (const e of effects) {
			const [line] = handEffects(state('normal', [e]), undefined);
			expect(line?.name).toBeTruthy();
			expect(line?.desc).toBeTruthy();
		}
		for (const b of [...BOSS_POOL, FINAL_BOSS])
			expect(handEffects(state('normal', []), b)[0]?.desc).toBeTruthy();
		expect(handEffects(state('iron', []), undefined)[0]?.desc).toBeTruthy();
		expect(handEffects(state('eleven', []), undefined)[0]?.name).toBeTruthy();
	}
	// An effect still spinning on the roulette stays out of the box.
	expect(handEffects(state('normal', ['freeze', 'claim']), undefined, 1)).toHaveLength(1);
	// The same effect twice in a hand shows once.
	expect(handEffects(state('normal', ['freeze', 'freeze']), undefined)).toHaveLength(1);
});
