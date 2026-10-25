/**
 * Finds quick-match seeds (`?skipMenu=1&auto=1&seed=N`) whose bet climbs to 12 early, for the
 * trailer's escalation clip (PLAN RC3). Mirrors TableScene's quick-match setup and the match RNG
 * it spends on table talk (say.* lines), so the seed plays the same in the browser.
 *   bun scripts/find-seed.ts [--from 1] [--to 3000] [--manhas a,b,c] [--max-hand 2]
 */
import { AI_PROFILE_IDS, AI_PROFILES, type AiProfileId } from '../src/data/ai-profiles';
import { COMPANION_IDS, COMPANIONS } from '../src/data/companions';
import { isManhaId } from '../src/data/manhas';
import { Match, type SeatBrain } from '../src/game/match';
import { Rng } from '../src/logic/rng';
import { tableGoal } from '../src/logic/score/score';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const from = Number(opt('from', '1'));
const to = Number(opt('to', '3000'));
const maxHand = Number(opt('max-hand', '2'));
const manhas = opt('manhas', '')
	.split(',')
	.filter((m) => m && isManhaId(m));

for (let seed = from; seed <= to; seed++) {
	const rng = new Rng(seed);
	const partner = COMPANIONS.tonhao;
	rng.shuffle(COMPANION_IDS.filter((id) => id !== 'tonhao'));
	const profiles = [rng.pick(AI_PROFILE_IDS), rng.pick(AI_PROFILE_IDS)] as AiProfileId[];
	const ai = (id: AiProfileId): SeatBrain => ({ kind: 'ai', profile: AI_PROFILES[id] });
	const m = new Match({
		rng,
		brains: [
			ai('pro'),
			ai(profiles[0] as AiProfileId),
			{ kind: 'ai', profile: partner.profile },
			ai(profiles[1] as AiProfileId),
		],
		goal: tableGoal(1, 'small'),
		manhas: manhas.filter(isManhaId),
	});
	let found = '';
	for (let hand = 1; hand <= maxHand && !found && m.winner === null; hand++) {
		const calls: number[] = [];
		for (let seat = m.actor(); seat !== null; seat = m.actor()) {
			for (const e of m.act(m.aiAction(seat))) {
				// The table's talk lines draw from the match RNG (TableScene.line): keep in step.
				if (e.type === 'truco') {
					calls.push(e.to);
					if (e.seat !== 0) m.rng.int(0, 2);
				} else if ((e.type === 'accepted' || e.type === 'folded') && e.seat !== 0)
					m.rng.int(0, 2);
				else if (e.type === 'trick' && e.winner !== undefined && e.winner !== 0) {
					const top = m.state.tricks[e.index]?.plays.find((p) => p.seat === e.winner);
					if (top && top.card.rank === m.state.manilha) m.rng.int(0, 2);
				}
			}
		}
		if (calls.includes(12)) found = `hand ${hand}: ${calls.join(' → ')}`;
		if (m.winner === null) m.nextHand();
	}
	if (found) console.log(`seed ${seed}: ${found}`);
}
