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
}

/** Client → server. */
export type ClientMessage =
	| { type: 'profile'; name: string; char: string }
	| { type: 'sit'; seat: Seat }
	| { type: 'start' }
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
	| { type: 'rejected' }
	| { type: 'closed' };
