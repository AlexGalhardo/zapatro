import type { Card } from '../logic/truco/cards';
import {
	type Action,
	jokerEffects,
	otherTeam,
	partnerOf,
	type Seat,
	type TableEvent,
	type TableState,
	type Team,
	type Trick,
	teamOf,
} from '../logic/truco/table';

/**
 * The table as one player sees it (LAN multiplayer). The server owns the real `TableState`;
 * every client gets a copy turned so its own seat is seat 0 (the scene always draws "you" at the
 * bottom) with the cards it cannot know replaced by `HIDDEN`. Team names turn with the seats:
 * an odd real seat sees the real "them" as "us". Pure: no Phaser, no Colyseus.
 */

/** A card nobody at the table may read (the scene only counts and backs these). */
export const HIDDEN: Card = { id: 'hidden', rank: '4', suit: 'clubs' };

/** Seat as `me` sees it. */
export const toView = (seat: Seat, me: Seat): Seat => ((seat - me + 4) % 4) as Seat;
/** Real seat of a seat `me` sees. */
export const fromView = (seat: Seat, me: Seat): Seat => ((seat + me) % 4) as Seat;
const team = (t: Team, me: Seat): Team => (me % 2 === 0 ? t : otherTeam(t));

/** `list[real]` indexed by real seat → indexed by the seat `me` sees. */
function turn<T>(list: readonly T[], me: Seat): T[] {
	return [0, 1, 2, 3].map((v) => list[fromView(v as Seat, me)] as T);
}

/** Whether `me` may read the hand of the real seat `seat` (own, partner's on an 11, showdown). */
function sees(s: TableState, me: Seat, seat: Seat): boolean {
	if (seat === me || jokerEffects(s).includes('showdown')) return true;
	return s.kind === 'eleven' && s.elevenTeam === teamOf(me) && seat === partnerOf(me);
}

/** A signal `me` knows about: own, partner's, or a rival's it caught (same rule as `observe`). */
const knowsSignal = (me: Seat, seat: Seat, caughtBy: readonly Seat[]): boolean =>
	seat === me || seat === partnerOf(me) || caughtBy.includes(me);

export function viewState(s: TableState, me: Seat): TableState {
	const trick = (t: Trick): Trick => ({
		opener: toView(t.opener, me),
		plays: t.plays.map((p) => ({
			...p,
			seat: toView(p.seat, me),
			card: p.faceDown && p.seat !== me ? HIDDEN : p.card,
		})),
		...(t.result ? { result: t.result === 'tie' ? t.result : team(t.result, me) } : {}),
		...(t.winner !== undefined ? { winner: toView(t.winner, me) } : {}),
	});
	return {
		rules: {
			signals: turn(s.rules.signals, me) as TableState['rules']['signals'],
			catchChance: turn(s.rules.catchChance, me) as TableState['rules']['catchChance'],
			...(s.rules.startBet ? { startBet: s.rules.startBet } : {}),
			...(s.rules.bonusStep ? { bonusStep: team(s.rules.bonusStep, me) } : {}),
		},
		score: { us: s.score[team('us', me)], them: s.score[team('them', me)] },
		dealer: toView(s.dealer, me),
		hands: turn(
			s.hands.map((h, seat) => (sees(s, me, seat as Seat) ? h : h.map(() => HIDDEN))),
			me,
		) as TableState['hands'],
		vira: s.vira,
		manilha: s.manilha,
		stock: [],
		kind: s.kind,
		elevenTeam: s.elevenTeam ? team(s.elevenTeam, me) : null,
		elevenDecided: s.elevenDecided,
		tricks: s.tricks.map(trick),
		turn: toView(s.turn, me),
		bet: s.bet,
		lastRaiser: s.lastRaiser ? team(s.lastRaiser, me) : null,
		pending: s.pending
			? {
					by: toView(s.pending.by, me),
					to: s.pending.to,
					responder: toView(s.pending.responder, me),
					resume: toView(s.pending.resume, me),
				}
			: null,
		signalsLeft: turn(s.signalsLeft, me) as TableState['signalsLeft'],
		signals: s.signals
			.filter((g) => knowsSignal(me, g.seat, g.caughtBy))
			.map((g) => ({
				...g,
				seat: toView(g.seat, me),
				caughtBy: g.caughtBy.map((x) => toView(x, me)),
			})),
		over: s.over ? { ...s.over, winner: s.over.winner ? team(s.over.winner, me) : null } : null,
	};
}

export function viewEvent(e: TableEvent, me: Seat): TableEvent {
	switch (e.type) {
		case 'played':
			return {
				...e,
				seat: toView(e.seat, me),
				card: e.faceDown && e.seat !== me ? HIDDEN : e.card,
			};
		case 'joker':
		case 'truco':
		case 'accepted':
		case 'folded':
			return { ...e, seat: toView(e.seat, me) };
		case 'trick':
			return {
				...e,
				result: e.result === 'tie' ? e.result : team(e.result, me),
				...(e.winner !== undefined ? { winner: toView(e.winner, me) } : {}),
			};
		case 'signal':
			return {
				...e,
				seat: toView(e.seat, me),
				sign: knowsSignal(me, e.seat, e.caughtBy) ? e.sign : 'nothing',
				caughtBy: e.caughtBy.map((x) => toView(x, me)),
			};
		case 'eleven':
			return { ...e, team: team(e.team, me) };
		case 'handOver':
			return {
				...e,
				end: { ...e.end, winner: e.end.winner ? team(e.end.winner, me) : null },
				score: { us: e.score[team('us', me)], them: e.score[team('them', me)] },
			};
		default:
			return e;
	}
}

/** An action from the seat `me` sees ("seat 0"), turned back to the real table. */
export const realAction = (a: Action, me: Seat): Action => ({ ...a, seat: fromView(a.seat, me) });

/** The team of the real seat `me` as that player's own "us". */
export const viewTeam = team;
