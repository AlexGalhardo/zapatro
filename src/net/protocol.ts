import type { Action, Seat, Seats, TableEvent, TableState } from '../logic/truco/table';

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
/** Table modes the host picks in the lobby: two pairs, or mano a mano. */
export const TABLE_MODES = ['2v2', '1v1'] as const;
export type TableMode = (typeof TABLE_MODES)[number];
export const TABLE_MODE_DEFAULT: TableMode = '2v2';
/** Seats a mode plays with (the first ones: 0 and 1 in the 1v1). */
export const MODE_SEATS: Record<TableMode, Seats> = { '2v2': 4, '1v1': 2 };

/** One person in the lobby; the id is the Colyseus session id. */
export interface LobbyPlayer {
	id: string;
	name: string;
	/** Companion portrait id (`portrait.<char>`). */
	char: string;
}

export interface LobbyState {
	/** Seats 0 and 2 are one pair, 1 and 3 the other; null = a bot sits there. In the 1v1 only 0 and 1 are used. */
	seats: [LobbyPlayer | null, LobbyPlayer | null, LobbyPlayer | null, LobbyPlayer | null];
	host: string;
	mode: TableMode;
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
	/**
	 * Host only, in the lobby: the table mode. Switching to the 1v1 is refused while somebody
	 * sits in seat 2 or 3 (nobody is moved or dropped silently: they sit elsewhere first).
	 */
	| { type: 'mode'; mode: TableMode }
	/** I am back: the server stops playing my seat for me. */
	| { type: 'back' }
	/** Back in the lobby while my match runs (I missed its `start`): send me the table again. */
	| { type: 'resync' }
	| { type: 'action'; action: Action };

/** What a client needs to draw the table (seats as it sees them, seat 0 = itself). */
export interface TableStart {
	/** Real seat of this client (the server knows it; the client only uses it for the lobby). */
	seat: Seat;
	/** The table's seats (also in `snap.state.seats`); at 2, chars and names of seats 2 and 3 are empty. */
	seats: Seats;
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
