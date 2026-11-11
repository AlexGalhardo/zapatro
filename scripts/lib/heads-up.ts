import { Match, type SeatBrain } from '../../src/game/match';
import { Rng } from '../../src/logic/rng';
import type { Card } from '../../src/logic/truco/cards';
import type { Seat, TableEvent, Team } from '../../src/logic/truco/table';

export interface HeadsUpResult {
	winner: Team | null;
	hands: number;
	/** Decisions taken by AI brains and the wall-clock time they used. */
	aiDecisions: number;
	aiMs: number;
}

/**
 * Plays one 1v1 quick match (no goal) and throws on a broken invariant: every card of the deck is
 * accounted for at the end of each hand, tentos never decrease, no `signal` is ever legal and the
 * match ends with exactly one side at 12 or more.
 */
export function playHeadsUp(seed: number, brains: [SeatBrain, SeatBrain]): HeadsUpResult {
	const m = new Match({ rng: new Rng(seed), brains, dealer: (seed % 2) as Seat });
	const deckIds = m.deck.map((c) => c.id).sort();
	let aiDecisions = 0;
	let aiMs = 0;
	for (;;) {
		const dealt: Card[] = [m.state.vira];
		for (let seat = m.actor(); seat !== null; seat = m.actor()) {
			if (m.legal(seat).some((a) => a.kind === 'signal'))
				throw new Error('signal offered 1v1');
			const t0 = performance.now();
			const action = m.aiAction(seat);
			if (m.brains[seat].kind === 'ai') {
				aiMs += performance.now() - t0;
				aiDecisions++;
			}
			const events: TableEvent[] = m.act(action);
			for (const e of events) if (e.type === 'vira') dealt.push(e.vira);
		}
		const s = m.state;
		const last = dealt[dealt.length - 1] as Card;
		if (last.id !== s.vira.id) throw new Error('vira out of sync');
		const seen = [
			...s.hands.flat(),
			...s.tricks.flatMap((t) => t.plays.map((p) => p.card)),
			...s.stock,
			...dealt,
		]
			.map((c) => c.id)
			.sort();
		if (seen.join() !== deckIds.join())
			throw new Error(`seed ${seed}: cards not accounted for`);
		const before = m.progress.score;
		if (s.score.us < before.us || s.score.them < before.them)
			throw new Error(`seed ${seed}: tentos decreased`);
		if (m.winner) {
			const w = m.winner;
			const l = w === 'us' ? 'them' : 'us';
			if (s.score[w] < 12 || s.score[l] >= 12)
				throw new Error(`seed ${seed}: match ended off 12`);
			return { winner: w, hands: m.hands, aiDecisions, aiMs };
		}
		if (m.hands >= 200) throw new Error(`seed ${seed}: match did not end`);
		m.nextHand();
	}
}
