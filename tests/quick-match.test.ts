import { describe, expect, test } from 'bun:test';
import { AI_PROFILES } from '../src/data/ai-profiles';
import { Match, type MatchOptions, type SeatBrain } from '../src/game/match';
import { Rng } from '../src/logic/rng';
import { MS_PER_MATCH, workTimeout } from './budget';

const pro: SeatBrain = { kind: 'ai', profile: AI_PROFILES.pro };
const brains: MatchOptions['brains'] = [pro, pro, pro, pro];

/** Plays hand by hand and checks the match only ends when a team closes 12 tentos. */
function playToEnd(m: Match): void {
	for (let hands = 0; hands < 200; hands++) {
		for (let seat = m.actor(); seat !== null; seat = m.actor()) m.act(m.aiAction(seat));
		const { us, them } = m.score;
		if (m.winner) {
			expect(Math.max(us, them)).toBeGreaterThanOrEqual(12);
			expect(m.score[m.winner]).toBeGreaterThanOrEqual(12);
			return;
		}
		expect(us).toBeLessThan(12);
		expect(them).toBeLessThan(12);
		m.nextHand();
	}
	throw new Error('the match never ended');
}

describe('quick match (GD-002): plain Truco to 12, no points goal', () => {
	test(
		'without a goal the match ends only when a team reaches 12',
		() => {
			for (let seed = 1; seed <= 20; seed++) {
				const m = new Match({ rng: new Rng(seed), brains });
				playToEnd(m);
				expect(m.points).toBe(0);
				expect(m.lastScore).toBeNull();
			}
		},
		workTimeout(20, MS_PER_MATCH),
	);

	test(
		'a quick match against a boss also plays to 12',
		() => {
			for (let seed = 1; seed <= 5; seed++)
				playToEnd(new Match({ rng: new Rng(seed), brains, boss: 'professor' }));
		},
		workTimeout(5, MS_PER_MATCH),
	);
});
