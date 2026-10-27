import { type Client, Room } from '@colyseus/core';
import { AI_PROFILE_IDS, AI_PROFILES } from '../src/data/ai-profiles';
import { COMPANION_IDS } from '../src/data/companions';
import { Match, type SeatBrain } from '../src/game/match';
import { rivalBrain } from '../src/game/run-table';
import { Rng, randomSeed } from '../src/logic/rng';
import { jokerCard, standardDeck } from '../src/logic/truco/cards';
import { type Action, IllegalAction, type Seat, type TableEvent } from '../src/logic/truco/table';
import {
	type ClientMessage,
	type LobbyPlayer,
	type LobbyState,
	MAX_NAME,
	RECONNECT_S,
	type ServerMessage,
	type TableSnapshot,
} from '../src/net/protocol';
import { realAction, viewEvent, viewState } from '../src/net/view';

/** A bot thinks this long before it plays; the next hand is dealt this long after a count. */
const BOT_MS = 800;
const HAND_GAP_MS = 700;

const SEATS = [0, 1, 2, 3] as const;
type Seats = LobbyState['seats'];

/** JSON drops `undefined` keys: msgpack would turn them into `null` and break `!== undefined`. */
const wire = (m: ServerMessage): ServerMessage => JSON.parse(JSON.stringify(m));

/**
 * The one table of a LAN server: a lobby where people pick a seat (0/2 against 1/3), then a
 * Truco match to 12 that the server plays: it holds the real `Match`, validates every action
 * and sends each player its own masked view (`src/net/view.ts`). Empty seats are bots; a player
 * who drops has `RECONNECT_S` seconds to come back before a bot takes the seat.
 */
export class TrucoRoom extends Room {
	override maxClients = 4;
	override autoDispose = false;

	private seats: Seats = [null, null, null, null];
	private host = '';
	private match: Match | null = null;
	/** Chars and names the clients draw, by real seat (bots have an empty name). */
	private chars: string[] = [];
	private names: string[] = [];
	private timer: ReturnType<typeof setTimeout> | undefined;

	/** Pauses in ms; the tests shorten them. */
	private botMs = BOT_MS;
	private gapMs = HAND_GAP_MS;

	override onCreate(options: { botMs?: number; gapMs?: number } = {}): void {
		this.botMs = options.botMs ?? BOT_MS;
		this.gapMs = options.gapMs ?? HAND_GAP_MS;
		this.onMessage('m', (client, msg: ClientMessage) => this.onClientMessage(client, msg));
	}

	override onJoin(client: Client, options: { name?: string; char?: string } = {}): void {
		const seat = this.seats.indexOf(null) as Seat;
		if (!this.host) this.host = client.sessionId;
		this.seats[seat] = {
			id: client.sessionId,
			name: '',
			char: '',
		};
		this.profile(client.sessionId, options.name, options.char, seat);
		this.sendLobby();
	}

	override async onDrop(client: Client): Promise<void> {
		// In the lobby a drop is a leave; mid-match the seat waits for the player.
		if (!this.match) return;
		try {
			await this.allowReconnection(client, RECONNECT_S);
		} catch {
			// Timed out: onLeave runs next and the bot takes over.
		}
	}

	override onReconnect(client: Client): void {
		this.sendStart(client.sessionId);
	}

	override onLeave(client: Client): void {
		const seat = this.seatOf(client.sessionId);
		if (seat === -1) return;
		this.seats[seat] = null;
		if (this.host === client.sessionId)
			this.host = this.seats.find((s) => s !== null)?.id ?? '';
		const m = this.match;
		if (m) {
			m.brains[seat] = { kind: 'ai', profile: AI_PROFILES.pro };
			if (!this.seats.some((s) => s !== null)) this.endMatch();
			else this.tick();
		}
		this.sendLobby();
	}

	override onDispose(): void {
		clearTimeout(this.timer);
	}

	// --- Lobby ------------------------------------------------------------------------------

	private seatOf(id: string): number {
		return this.seats.findIndex((s) => s?.id === id);
	}

	/** Name and portrait of a lobby player; a portrait another person has is not taken. */
	private profile(
		id: string,
		name: string | undefined,
		char: string | undefined,
		at: number,
	): void {
		const me = this.seats[at];
		if (!me) return;
		const taken = new Set(this.seats.flatMap((s) => (s && s.id !== id ? [s.char] : [])));
		const free = (c: string | undefined): c is string =>
			Boolean(c) && COMPANION_IDS.some((x) => x === c) && !taken.has(c as string);
		me.name = (name ?? '').trim().slice(0, MAX_NAME) || `${at + 1}`;
		me.char = free(char)
			? char
			: free(me.char)
				? me.char
				: (COMPANION_IDS.find((c) => !taken.has(c)) as string);
	}

	private lobby(): LobbyState {
		return { seats: this.seats, host: this.host, playing: this.match !== null };
	}

	private sendLobby(): void {
		this.broadcast('m', wire({ type: 'lobby', lobby: this.lobby() }));
	}

	private onClientMessage(client: Client, msg: ClientMessage): void {
		const seat = this.seatOf(client.sessionId);
		if (seat === -1) return;
		switch (msg.type) {
			case 'profile':
				if (!this.match) this.profile(client.sessionId, msg.name, msg.char, seat);
				this.sendLobby();
				break;
			case 'sit': {
				const to = msg.seat;
				if (this.match || !SEATS.includes(to) || this.seats[to]) break;
				this.seats[to] = this.seats[seat] as LobbyPlayer;
				this.seats[seat] = null;
				this.sendLobby();
				break;
			}
			case 'start':
				if (!this.match && client.sessionId === this.host) this.startMatch();
				break;
			case 'action':
				this.onAction(client, seat as Seat, msg.action);
				break;
		}
	}

	// --- Match ------------------------------------------------------------------------------

	private startMatch(): void {
		const rng = new Rng(randomSeed());
		const taken = new Set(this.seats.map((s) => s?.char));
		const free = rng.shuffle(COMPANION_IDS.filter((c) => !taken.has(c)));
		this.chars = [];
		this.names = [];
		const brains = SEATS.map((seat): SeatBrain => {
			const p = this.seats[seat];
			this.chars[seat] = p?.char ?? (free.pop() as string);
			this.names[seat] = p?.name ?? '';
			return p
				? { kind: 'human' }
				: rivalBrain(rng.pick(AI_PROFILE_IDS), this.chars[seat] as string);
		}) as [SeatBrain, SeatBrain, SeatBrain, SeatBrain];
		// LAN decks have the two jokers but not the special cards (their views are not masked for them).
		this.match = new Match({
			rng,
			brains,
			deck: [...standardDeck(), jokerCard(), jokerCard(2)],
		});
		void this.lock();
		for (const c of this.clients) this.sendStart(c.sessionId);
		this.sendLobby();
		this.tick();
	}

	private endMatch(): void {
		clearTimeout(this.timer);
		this.match = null;
		void this.unlock();
		this.sendLobby();
	}

	private snapshot(seat: Seat): TableSnapshot {
		const m = this.match as Match;
		return { state: viewState(m.state, seat), hands: m.hands };
	}

	/** What `me` draws: the seats turned so it sits at the bottom. */
	private sendStart(id: string): void {
		const me = this.seatOf(id);
		const m = this.match;
		if (me === -1 || !m) return;
		const at = (list: string[]): Record<Seat, string> =>
			Object.fromEntries(SEATS.map((v) => [v, list[(v + me) % 4] as string])) as Record<
				Seat,
				string
			>;
		this.clients.getById(id)?.send(
			'm',
			wire({
				type: 'start',
				start: { seat: me as Seat, chars: at(this.chars), names: at(this.names) },
				snap: this.snapshot(me as Seat),
			}),
		);
	}

	private each(fn: (client: Client, seat: Seat) => ServerMessage): void {
		for (const client of this.clients) {
			const seat = this.seatOf(client.sessionId);
			if (seat !== -1) client.send('m', wire(fn(client, seat as Seat)));
		}
	}

	private sendStep(events: TableEvent[]): void {
		this.each((_c, seat) => ({
			type: 'step',
			events: events.map((e) => viewEvent(e, seat)),
			snap: this.snapshot(seat),
		}));
	}

	private onAction(client: Client, seat: Seat, view: Action): void {
		const m = this.match;
		const action = realAction(view, seat);
		if (!m || m.actor() !== seat || action.seat !== seat || m.brains[seat].kind !== 'human')
			return void client.send('m', { type: 'rejected' });
		let events: TableEvent[];
		try {
			events = m.act(action);
		} catch (e) {
			if (e instanceof IllegalAction) return void client.send('m', { type: 'rejected' });
			throw e;
		}
		this.sendStep(events);
		this.tick();
	}

	/** Moves the match on: bots play after a pause, the next hand is dealt, humans are awaited. */
	private tick(): void {
		clearTimeout(this.timer);
		const m = this.match;
		if (!m) return;
		const actor = m.actor();
		if (actor === null) {
			if (m.winner) {
				this.endMatch();
				return;
			}
			this.timer = setTimeout(() => {
				m.nextHand();
				this.each((_c, seat) => ({ type: 'deal', snap: this.snapshot(seat) }));
				this.tick();
			}, this.gapMs);
			return;
		}
		if (m.brains[actor].kind === 'human') return;
		this.timer = setTimeout(() => {
			this.sendStep(m.act(m.aiAction(actor)));
			this.tick();
		}, this.botMs);
	}
}
