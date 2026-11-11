import { type Client, Room } from '@colyseus/core';
import { AI_PROFILE_IDS, AI_PROFILES } from '../src/data/ai-profiles';
import { COMPANION_IDS } from '../src/data/companions';
import { Match, type MatchOptions, type SeatBrain } from '../src/game/match';
import { rivalBrain } from '../src/game/run-table';
import { Rng, randomSeed } from '../src/logic/rng';
import { fullDeck } from '../src/logic/truco/cards';
import {
	type Action,
	IllegalAction,
	type Seat,
	type TableEvent,
	type Seats as TableSeats,
} from '../src/logic/truco/table';
import {
	AUTOPILOT_AFTER,
	type ClientMessage,
	type LobbyPlayer,
	type LobbyState,
	MAX_NAME,
	MODE_SEATS,
	RECONNECT_S,
	type ServerMessage,
	TABLE_MODE_DEFAULT,
	TABLE_MODES,
	type TableMode,
	type TableSnapshot,
	TURN_CLOCK_CHOICES_S,
	TURN_CLOCK_DEFAULT_S,
} from '../src/net/protocol';
import { fromView, realAction, toView, viewEvent, viewState } from '../src/net/view';

/** A bot thinks this long before it plays; the next hand is dealt this long after a count. */
const BOT_MS = 800;
const HAND_GAP_MS = 700;

const SEATS = [0, 1, 2, 3] as const;
type Seats = LobbyState['seats'];

const str = (v: unknown): v is string => typeof v === 'string';

/** The shape of a client message (`ClientMessage`); the match itself validates actions. */
export function isMessage(m: unknown): m is ClientMessage {
	if (typeof m !== 'object' || m === null) return false;
	const o = m as Record<string, unknown>;
	switch (o.type) {
		case 'profile':
			return str(o.name) && str(o.char);
		case 'sit':
			return SEATS.some((s) => s === o.seat);
		case 'clock':
			return TURN_CLOCK_CHOICES_S.some((c) => c === o.seconds);
		case 'mode':
			return TABLE_MODES.some((m) => m === o.mode);
		case 'start':
		case 'back':
		case 'resync':
			return true;
		case 'action': {
			const a = o.action as Record<string, unknown> | null;
			return (
				typeof a === 'object' &&
				a !== null &&
				str(a.kind) &&
				SEATS.some((s) => s === a.seat)
			);
		}
		default:
			return false;
	}
}

/** JSON drops `undefined` keys: msgpack would turn them into `null` and break `!== undefined`. */
const wire = (m: ServerMessage): ServerMessage => JSON.parse(JSON.stringify(m));

/**
 * The one table of a LAN server: a lobby where people pick a seat (0/2 against 1/3, or 0 against
 * 1 in the 1v1 mode the host picks), then a Truco match to 12 with the jokers and the special
 * cards that the server plays: it holds the real `Match`, validates every action and sends each
 * player its own masked view (`src/net/view.ts`). Empty seats are bots; a player who drops has
 * `RECONNECT_S` seconds to come back before a bot takes the seat.
 */
export class TrucoRoom extends Room {
	override maxClients = 4;
	override autoDispose = false;

	private seats: Seats = [null, null, null, null];
	private host = '';
	private mode: TableMode = TABLE_MODE_DEFAULT;
	private match: Match | null = null;
	/** Chars and names the clients draw, by real seat (bots have an empty name). */
	private chars: string[] = [];
	private names: string[] = [];
	private timer: ReturnType<typeof setTimeout> | undefined;

	/** Pauses in ms; the tests shorten them. */
	private botMs = BOT_MS;
	private gapMs = HAND_GAP_MS;
	/** Turn clock in seconds (0 = off); the tests inject fractions through `clockMs`. */
	private clockS: number = TURN_CLOCK_DEFAULT_S;
	/** Per real seat: consecutive timeouts, and whether the server plays the seat for it. */
	private timeouts = [0, 0, 0, 0];
	private auto = [false, false, false, false];
	/** The human decision being timed and when its clock ends (ms epoch). */
	private timed: Seat | null = null;
	private deadline = 0;

	override onCreate(options: { botMs?: number; gapMs?: number; clockMs?: number } = {}): void {
		this.botMs = options.botMs ?? BOT_MS;
		this.gapMs = options.gapMs ?? HAND_GAP_MS;
		if (options.clockMs !== undefined) this.clockS = options.clockMs / 1000;
		this.onMessage('m', (client, msg: unknown) => {
			// Anything on the network may be garbage: a bad message is dropped, never a crash.
			if (!isMessage(msg)) return;
			try {
				this.onClientMessage(client, msg);
			} catch (e) {
				console.warn('[lan] message failed', e);
				client.send('m', { type: 'rejected' });
			}
		});
	}

	override onJoin(client: Client, options: { name?: string; char?: string } = {}): void {
		const seat = this.seats.slice(0, this.seatCount).indexOf(null);
		// The room locks when full, but a seat can vanish between the check and the join.
		if (seat === -1) throw new Error('table full');
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
		this.sendTimer();
	}

	override onLeave(client: Client): void {
		const seat = this.seatOf(client.sessionId);
		if (seat === -1) return;
		this.seats[seat] = null;
		this.auto[seat] = false;
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

	private get seatCount(): TableSeats {
		return MODE_SEATS[this.mode];
	}

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
		return {
			seats: this.seats,
			host: this.host,
			mode: this.mode,
			playing: this.match !== null,
			clockS: this.clockS,
		};
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
				if (this.match || to >= this.seatCount || this.seats[to]) break;
				this.seats[to] = this.seats[seat] as LobbyPlayer;
				this.seats[seat] = null;
				this.sendLobby();
				break;
			}
			case 'start':
				if (!this.match && client.sessionId === this.host) this.startMatch();
				break;
			case 'clock':
				if (!this.match && client.sessionId === this.host) {
					this.clockS = msg.seconds;
					this.sendLobby();
				}
				break;
			case 'mode': {
				// Refused (not moved, not dropped) while somebody sits in a seat the 1v1 lacks.
				const n = MODE_SEATS[msg.mode];
				if (
					this.match ||
					client.sessionId !== this.host ||
					this.seats.slice(n).some(Boolean)
				)
					break;
				this.mode = msg.mode;
				// Colyseus locks the room when full and unlocks it when it is not.
				this.maxClients = n;
				this.sendLobby();
				break;
			}
			case 'back':
				this.timeouts[seat] = 0;
				if (this.auto[seat]) {
					this.auto[seat] = false;
					// Its own turn restarts on the human clock; otherwise others' clocks run on.
					if (this.match?.actor() === seat) this.tick();
					else this.sendTimer();
				}
				break;
			case 'resync':
				this.sendStart(client.sessionId);
				this.sendTimer();
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
		this.timeouts = [0, 0, 0, 0];
		this.auto = [false, false, false, false];
		const brains = SEATS.slice(0, this.seatCount).map((seat): SeatBrain => {
			const p = this.seats[seat];
			this.chars[seat] = p?.char ?? (free.pop() as string);
			this.names[seat] = p?.name ?? '';
			return p
				? { kind: 'human' }
				: rivalBrain(rng.pick(AI_PROFILE_IDS), this.chars[seat] as string);
		}) as MatchOptions['brains'];
		this.match = new Match({ rng, brains, deck: fullDeck() });
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
		const n = m.seats;
		const at = (list: string[]): Record<Seat, string> =>
			Object.fromEntries(
				SEATS.map((v) => [v, v < n ? (list[fromView(v, me as Seat, n)] as string) : '']),
			) as Record<Seat, string>;
		this.clients.getById(id)?.send(
			'm',
			wire({
				type: 'start',
				start: { seat: me as Seat, seats: n, chars: at(this.chars), names: at(this.names) },
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
			events: events.map((e) => viewEvent(e, seat, (this.match as Match).seats)),
			snap: this.snapshot(seat),
		}));
	}

	private onAction(client: Client, seat: Seat, view: Action): void {
		const m = this.match;
		const action = realAction(view, seat, m?.seats);
		if (!m || m.actor() !== seat || action.seat !== seat || m.brains[seat].kind !== 'human')
			return void client.send('m', { type: 'rejected' });
		let events: TableEvent[];
		try {
			events = m.act(action);
		} catch (e) {
			if (e instanceof IllegalAction) return void client.send('m', { type: 'rejected' });
			throw e;
		}
		this.timeouts[seat] = 0;
		this.auto[seat] = false;
		this.sendStep(events);
		this.tick();
	}

	/** Tells each client whose decision is timed, the ms left and who is on autopilot. */
	private sendTimer(): void {
		const left = Math.max(0, this.deadline - Date.now());
		const n = this.match?.seats ?? 4;
		this.each((_c, me) => ({
			type: 'timer',
			seat: this.timed === null ? null : toView(this.timed, me, n),
			ms: left,
			auto: SEATS.filter((s) => this.auto[s]).map((s) => toView(s, me, n)),
		}));
	}

	/**
	 * Moves the match on: bots play after a pause, the next hand is dealt, humans are awaited
	 * against the turn clock (a timeout plays the bot's action for them; `AUTOPILOT_AFTER` in a
	 * row put the seat on autopilot, played like a bot until its player acts or says `back`).
	 */
	private tick(): void {
		clearTimeout(this.timer);
		this.timed = null;
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
			this.sendTimer();
			return;
		}
		const human = m.brains[actor].kind === 'human' && !this.auto[actor];
		const clockMs = this.clockS * 1000;
		if (human && clockMs <= 0) {
			this.sendTimer();
			return;
		}
		const ms = human ? clockMs : this.botMs;
		if (human) {
			this.timed = actor;
			this.deadline = Date.now() + ms;
		}
		this.timer = setTimeout(() => {
			if (human) {
				const n = (this.timeouts[actor] ?? 0) + 1;
				this.timeouts[actor] = n;
				if (n >= AUTOPILOT_AFTER) this.auto[actor] = true;
			}
			this.sendStep(m.act(m.aiAction(actor)));
			this.tick();
		}, ms);
		this.sendTimer();
	}
}
