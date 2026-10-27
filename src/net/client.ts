import { Client, type Room } from '@colyseus/sdk';
import {
	type ClientMessage,
	LAN_PORT,
	type LobbyState,
	ROOM_NAME,
	type ServerMessage,
} from './protocol';

/** `192.168.0.12` or `192.168.0.12:2567` (or a full `ws://` URL) → the server URL. */
export function lanUrl(address: string): string {
	const a = address.trim();
	if (/^wss?:\/\//.test(a)) return a;
	return `ws://${a}${a.includes(':') ? '' : `:${LAN_PORT}`}`;
}

/**
 * The connection to a LAN table. Messages that arrive while no scene listens (the fade between
 * the lobby and the table) wait in the inbox; the SDK reconnects a dropped socket by itself
 * while the server holds the seat.
 */
export class NetClient {
	lobby: LobbyState | null = null;
	/** Set when the room ended for good (the host closed it, or the reconnection failed). */
	closed = false;
	/** What the lobby shows as the table's address (the host lists all its addresses). */
	label = '';
	private inbox: ServerMessage[] = [];
	private handler: ((m: ServerMessage) => void) | null = null;

	private constructor(private readonly room: Room) {
		room.onMessage('m', (m: ServerMessage) => {
			if (m.type === 'lobby') this.lobby = m.lobby;
			if (this.handler) this.handler(m);
			else this.inbox.push(m);
		});
		room.onLeave(() => {
			this.closed = true;
			const m: ServerMessage = { type: 'closed' };
			if (this.handler) this.handler(m);
			else this.inbox.push(m);
		});
	}

	static async connect(address: string, name: string, char: string): Promise<NetClient> {
		const room = await new Client(lanUrl(address)).join(ROOM_NAME, { name, char });
		return new NetClient(room);
	}

	get id(): string {
		return this.room.sessionId;
	}

	send(msg: ClientMessage): void {
		this.room.send('m', msg);
	}

	/** Receives every message from now on, the ones already waiting first. */
	listen(handler: ((m: ServerMessage) => void) | null): void {
		this.handler = handler;
		if (!handler) return;
		for (const m of this.inbox.splice(0)) handler(m);
	}

	leave(): void {
		this.handler = null;
		void this.room.leave();
	}
}
