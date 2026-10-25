import type { Card, Rank } from './cards';
import {
	type Bet,
	type HandKind,
	jokerEffects,
	nextSeat,
	type Pending,
	partnerOf,
	type Seat,
	type Sign,
	type TableState,
	type Team,
	teamOf,
} from './table';

/** A play as a seat saw it: face-down cards of others are unknown (null). */
export interface SeenPlay {
	seat: Seat;
	card: Card | null;
	faceDown: boolean;
}

export interface SeenTrick {
	opener: Seat;
	plays: SeenPlay[];
	result?: 'us' | 'them' | 'tie';
	winner?: Seat;
}

/** A signal this seat knows about (its partner's, or a rival's it caught). */
export interface KnownSignal {
	seat: Seat;
	sign: Sign;
}

/**
 * What one seat knows (PLAN §4.2): never another seat's cards, except the partner's hand in a
 * mão de 11 and every hand after the joker's `showdown`. AI and bots decide only from this.
 */
export interface Observation {
	seat: Seat;
	team: Team;
	/** Own cards; null in the iron hand (played blind). */
	hand: Card[] | null;
	handSize: number;
	partnerHand: Card[] | null;
	/** Cards of the partner this seat knows anyway (Marcada modifier). */
	partnerMarked: Card[];
	vira: Card;
	manilha: Rank;
	kind: HandKind;
	tricks: SeenTrick[];
	bet: Bet;
	pending: Pending | null;
	lastRaiser: Team | null;
	turn: Seat;
	score: Record<Team, number>;
	dealer: Seat;
	signals: KnownSignal[];
	/** Cards left in each seat's hand (public). */
	handSizes: [number, number, number, number];
	/** Every hand, after the joker's `showdown` (null otherwise). */
	shownHands: Card[][] | null;
}

export function observe(s: TableState, seat: Seat): Observation {
	const team = teamOf(seat);
	const partner = partnerOf(seat);
	const rivals = [nextSeat(seat), nextSeat(partner)];
	return {
		seat,
		team,
		hand: s.kind === 'iron' ? null : [...s.hands[seat]],
		handSize: s.hands[seat].length,
		partnerHand: s.kind === 'eleven' && s.elevenTeam === team ? [...s.hands[partner]] : null,
		partnerMarked: s.hands[partner].filter(
			(c) => c.mod === 'marcada' && teamOf(partner) === 'us',
		),
		vira: s.vira,
		manilha: s.manilha,
		kind: s.kind,
		tricks: s.tricks.map((t) => ({
			opener: t.opener,
			result: t.result,
			winner: t.winner,
			plays: t.plays.map((p) => ({
				seat: p.seat,
				faceDown: p.faceDown,
				card: p.faceDown && p.seat !== seat ? null : p.card,
			})),
		})),
		bet: s.bet,
		pending: s.pending ? { ...s.pending } : null,
		lastRaiser: s.lastRaiser,
		turn: s.turn,
		score: { ...s.score },
		dealer: s.dealer,
		signals: s.signals
			.filter(
				(g) =>
					g.seat === seat ||
					g.seat === partner ||
					(rivals.includes(g.seat) && g.caughtBy.includes(seat)),
			)
			.map((g) => ({ seat: g.seat, sign: g.sign })),
		handSizes: [s.hands[0].length, s.hands[1].length, s.hands[2].length, s.hands[3].length],
		shownHands: jokerEffects(s).includes('showdown') ? s.hands.map((h) => [...h]) : null,
	};
}
