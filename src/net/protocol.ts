import type { Action, Seat, TableEvent, TableState } from '../logic/truco/table';

/**
 * LAN multiplayer protocol (Colyseus room `truco`). Plain messages, no Schema: each client gets
 * its own masked copy of the table (`view.ts`), so a shared synced state would leak hands.
 * Pure types and constants: the game imports them without pulling Colyseus.
 */

export const LAN_PORT = 2567;
export const ROOM_NAME = 'truco';
/** Seconds the table waits for a dropped player before a bot takes the seat. */
export const RECONNECT_S = 30;
export const MAX_NAME = 12;
/** Turn clock the host can pick in the lobby (seconds; 0 = off) and its default. */
export const TURN_CLOCK_CHOICES_S = [0, 15, 30, 60] as const;
export const TURN_CLOCK_DEFAULT_S = 30;
/** Consecutive timeouts of one seat that put it on autopilot. */
export const AUTOPILOT_AFTER = 2;
/** The last seconds of a clock tick out loud. */
export const TURN_CLOCK_WARN_S = 5;

/** One person in the lobby; the id is the Colyseus session id. */
export interface LobbyPlayer {
	id: string;
	name: string;
	/** Companion portrait id (`portrait.<char>`). */
	char: string;
}

export interface LobbyState {
	/** Seats 0 and 2 are one pair, 1 and 3 the other; null = a bot sits there. */
	seats: [LobbyPlayer | null, LobbyPlayer | null, LobbyPlayer | null, LobbyPlayer | null];
	host: string;
	/** A match is running: nobody new can join, the lobby shows it only to those who left. */
	playing: boolean;
	/** Turn clock in seconds, 0 = off (one of `TURN_CLOCK_CHOICES_S`). */
	clockS: number;
}

/** Client → server. */
export type ClientMessage =
	| { type: 'profile'; name: string; char: string }
	| { type: 'sit'; seat: Seat }
	| { type: 'start' }
	/** Host only, in the lobby: the turn clock in seconds (one of `TURN_CLOCK_CHOICES_S`). */
	| { type: 'clock'; seconds: number }
	/** I am back: the server stops playing my seat for me. */
	| { type: 'back' }
	/** Back in the lobby while my match runs (I missed its `start`): send me the table again. */
	| { type: 'resync' }
	| { type: 'action'; action: Action };

/** What a client needs to draw the table (seats as it sees them, seat 0 = itself). */
export interface TableStart {
	/** Real seat of this client (the server knows it; the client only uses it for the lobby). */
	seat: Seat;
	chars: Record<Seat, string>;
	names: Record<Seat, string>;
}

/** The match as a client sees it. */
export interface TableSnapshot {
	state: TableState;
	hands: number;
}

/** Server → client. */
export type ServerMessage =
	| { type: 'lobby'; lobby: LobbyState }
	| { type: 'start'; start: TableStart; snap: TableSnapshot }
	| { type: 'step'; events: TableEvent[]; snap: TableSnapshot }
	| { type: 'deal'; snap: TableSnapshot }
	/**
	 * Whose decision is being timed (a seat as this client sees it, null = nobody) with the ms
	 * left (a duration, so a client's own wall clock does not matter), and the seats on autopilot.
	 */
	| { type: 'timer'; seat: Seat | null; ms: number; auto: Seat[] }
	| { type: 'rejected' }
	| { type: 'closed' };
