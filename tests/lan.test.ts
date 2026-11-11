import { afterAll, describe, expect, test } from 'bun:test';
import { Client } from '@colyseus/sdk';
import { isMessage } from '../lan/room';
import { startLanServer } from '../lan/server';
import { RemoteMatch } from '../src/game/remote-match';
import { teamOf } from '../src/logic/truco/table';
import { NetClient } from '../src/net/client';
import {
	type LobbyState,
	ROOM_NAME,
	type ServerMessage,
	TURN_CLOCK_DEFAULT_S,
} from '../src/net/protocol';

const servers: { stop: () => Promise<void> }[] = [];
afterAll(async () => {
	for (const s of servers) await s.stop();
});

let nextPort = 25000 + Math.floor(Math.random() * 2000);
const serve = async (pauses: { botMs?: number; clockMs?: number } = {}) => {
	const port = nextPort++;
	// The default clock is off here: the older tests must not depend on it.
	servers.push(await startLanServer(port, { botMs: 1, gapMs: 1, clockMs: 0, ...pauses }));
	return `127.0.0.1:${port}`;
};

const until = async (cond: () => boolean, ms = 5000): Promise<void> => {
	const end = Date.now() + ms;
	while (!cond()) {
		if (Date.now() > end) throw new Error('timeout');
		await Bun.sleep(5);
	}
};

/** A person who plays a random legal action whenever it is their turn. */
function player(net: NetClient) {
	const match = new RemoteMatch();
	const seen: ServerMessage[] = [];
	let seat = -1;
	const act = () => {
		if (match.actor() !== 0) return;
		const legal = match.legal(0);
		const action = legal[Math.floor(Math.random() * legal.length)];
		if (action) net.send({ type: 'action', action });
	};
	net.listen((m) => {
		seen.push(m);
		if (m.type === 'start') seat = m.start.seat;
		if (m.type === 'start' || m.type === 'step' || m.type === 'deal') {
			match.load(m.snap);
			act();
		}
	});
	return { match, seen, seat: () => seat };
}

describe('LAN table', () => {
	test('lobby: first free seat, sit, portraits are unique, only the host starts', async () => {
		const url = await serve();
		const a = await NetClient.connect(url, 'Ana', 'mia');
		const b = await NetClient.connect(url, 'Beto', 'mia');
		await until(() => b.lobby?.seats[1] != null);
		const lobby = b.lobby as LobbyState;
		expect(lobby.seats[0]?.name).toBe('Ana');
		expect(lobby.seats[1]?.name).toBe('Beto');
		expect(lobby.seats[1]?.char).not.toBe('mia');
		expect(lobby.host).toBe(a.id);
		b.send({ type: 'sit', seat: 2 });
		await until(() => a.lobby?.seats[2]?.name === 'Beto');
		expect(a.lobby?.seats[1]).toBeNull();
		b.send({ type: 'start' });
		await Bun.sleep(50);
		expect(a.lobby?.playing).toBe(false);
		a.leave();
		b.leave();
	});

	test('one person against three bots plays a match to 12', async () => {
		const url = await serve();
		const net = await NetClient.connect(url, 'Solo', 'bruto');
		const p = player(net);
		await until(() => net.lobby !== null);
		net.send({ type: 'start' });
		await until(() => p.match.winner !== null, 30000);
		const first = p.seen.find((m) => m.type === 'start');
		if (first?.type !== 'start') throw new Error('no start');
		// Seats other than yours are unknown at the deal.
		for (const seat of [1, 2, 3] as const)
			expect(first.snap.state.hands[seat].every((c) => c.id === 'hidden')).toBe(true);
		expect(first.start.chars[0]).toBe('bruto');
		net.leave();
	});

	test('four people play the same match, each sees themself at the bottom', async () => {
		const url = await serve();
		const nets: NetClient[] = [];
		for (const name of ['A', 'B', 'C', 'D']) nets.push(await NetClient.connect(url, name, ''));
		const players = nets.map(player);
		await until(() => nets.every((n) => n.lobby?.seats.every((s) => s !== null)));
		nets[0]?.send({ type: 'start' });
		await until(() => players.every((p) => p.match.winner !== null), 30000);
		// "us" for one is "them" for the next seat: all four agree on the real winner.
		const winners = players.map((p) => {
			const us = p.match.winner === 'us';
			return us ? teamOf(p.seat() as 0) : teamOf(((p.seat() + 1) % 4) as 0);
		});
		expect(new Set(winners).size).toBe(1);
		for (const n of nets) n.leave();
	});

	test('a player who leaves mid-match is replaced by a bot and the match goes on', async () => {
		const url = await serve();
		const a = await NetClient.connect(url, 'A', '');
		const b = await NetClient.connect(url, 'B', '');
		const pa = player(a);
		const pb = player(b);
		await until(() => b.lobby?.seats[1] != null);
		a.send({ type: 'start' });
		await until(() => pa.seat() >= 0 && pb.seat() >= 0);
		b.leave();
		await until(() => pa.match.winner !== null, 30000);
	});

	test('a player back in the lobby mid-match gets the table again (resync)', async () => {
		const url = await serve();
		const a = await NetClient.connect(url, 'Ana', 'mia');
		const b = await NetClient.connect(url, 'Beto', 'chico');
		const pa = player(a);
		const seen: ServerMessage[] = [];
		b.listen((m) => seen.push(m));
		await until(() => a.lobby?.seats[1] != null);
		a.send({ type: 'start' });
		await until(() => seen.some((m) => m.type === 'start'));
		seen.length = 0;
		b.send({ type: 'resync' });
		await until(() => seen.some((m) => m.type === 'start'));
		expect(pa.seat()).toBe(0);
		a.leave();
		b.leave();
	});

	test('garbage messages are dropped and the server keeps serving', async () => {
		const url = await serve();
		const raw = await new Client(`ws://${url}`).join(ROOM_NAME, { name: 'X' });
		for (const junk of [
			null,
			42,
			'start',
			{},
			{ type: 'nope' },
			{ type: 'profile', name: 7 },
			{ type: 'sit', seat: 9 },
			{ type: 'action' },
			{ type: 'action', action: { kind: 'play', seat: 0, cardId: {} } },
		])
			raw.send('m', junk);
		await Bun.sleep(100);
		const net = await NetClient.connect(url, 'Late', 'bruto');
		await until(() => net.lobby !== null);
		expect(net.lobby?.seats.filter(Boolean).length).toBe(2);
		void raw.leave();
		net.leave();
	});

	test('isMessage accepts only well-formed client messages', () => {
		expect(isMessage({ type: 'start' })).toBe(true);
		expect(isMessage({ type: 'back' })).toBe(true);
		expect(isMessage({ type: 'clock', seconds: 15 })).toBe(true);
		for (const seconds of [7, '15', -1, null])
			expect(isMessage({ type: 'clock', seconds })).toBe(false);
		expect(isMessage({ type: 'action', action: { kind: 'fold', seat: 0 } })).toBe(true);
		expect(isMessage({ type: 'profile', name: 'a', char: 'mia' })).toBe(true);
		for (const m of [
			null,
			1,
			'start',
			{},
			{ type: 'sit', seat: '1' },
			{ type: 'action', action: null },
		])
			expect(isMessage(m)).toBe(false);
	});

	test('the lobby carries the clock; only the host changes it, only to a listed value', async () => {
		const url = await serve({ clockMs: TURN_CLOCK_DEFAULT_S * 1000 });
		const a = await NetClient.connect(url, 'Ana', '');
		const b = await NetClient.connect(url, 'Beto', '');
		await until(() => b.lobby?.seats[1] != null);
		expect(b.lobby?.clockS).toBe(TURN_CLOCK_DEFAULT_S);
		b.send({ type: 'clock', seconds: 15 });
		await Bun.sleep(50);
		expect(a.lobby?.clockS).toBe(TURN_CLOCK_DEFAULT_S);
		a.send({ type: 'clock', seconds: 60 });
		await until(() => b.lobby?.clockS === 60);
		a.send({ type: 'clock', seconds: 0 });
		await until(() => b.lobby?.clockS === 0);
		a.leave();
		b.leave();
	});
});

/** A human who never plays: it only records what the server sends (and the table it implies). */
function idle(net: NetClient) {
	const match = new RemoteMatch();
	const seen: { at: number; m: ServerMessage }[] = [];
	net.listen((m) => {
		seen.push({ at: Date.now(), m });
		if (m.type === 'start' || m.type === 'step' || m.type === 'deal') match.load(m.snap);
	});
	const timers = () => seen.flatMap(({ m }) => (m.type === 'timer' ? [m] : []));
	/** Steps with at least one event of the seat I draw at the bottom. */
	const mine = () =>
		seen.filter(
			({ m }) => m.type === 'step' && m.events.some((e) => 'seat' in e && e.seat === 0),
		);
	return { match, seen, timers, mine };
}

describe('LAN turn clock', () => {
	const CLOCK = 250;
	const begin = async (pauses: { botMs?: number; clockMs?: number }) => {
		const net = await NetClient.connect(await serve(pauses), 'Idle', '');
		const p = idle(net);
		await until(() => net.lobby !== null);
		net.send({ type: 'start' });
		return { net, ...p };
	};

	test('an idle human gets the bot action when the clock ends', async () => {
		const { net, seen, timers, mine } = await begin({ clockMs: CLOCK });
		await until(() => timers().some((m) => m.seat === 0));
		const t0 = seen.find(({ m }) => m.type === 'timer' && m.seat === 0);
		const first = timers().find((m) => m.seat === 0);
		expect(first?.ms).toBeGreaterThan(CLOCK - 100);
		expect(first?.ms).toBeLessThanOrEqual(CLOCK);
		const before = mine().length;
		await until(() => mine().length > before);
		const waited = (mine()[before]?.at ?? 0) - (t0?.at ?? 0);
		expect(waited).toBeGreaterThanOrEqual(CLOCK - 50);
		expect(waited).toBeLessThan(CLOCK + 500);
		net.leave();
	});

	test('two timeouts in a row turn autopilot on and the seat keeps playing fast', async () => {
		const { net, timers, mine } = await begin({ clockMs: CLOCK });
		await until(() => timers().some((m) => m.auto.includes(0)));
		const n = mine().length;
		const t = Date.now();
		await until(() => mine().length > n + 1);
		// Autopilot plays with the bot delay (1 ms here), not the clock.
		expect(Date.now() - t).toBeLessThan(CLOCK);
		net.leave();
	});

	test('"back" and a real action turn autopilot off and the clock runs again', async () => {
		const { net, match, timers } = await begin({ clockMs: CLOCK, botMs: 40 });
		await until(() => timers().some((m) => m.auto.includes(0)));
		net.send({ type: 'back' });
		await until(() => timers().at(-1)?.auto.includes(0) === false);
		const n = timers().length;
		await until(() =>
			timers()
				.slice(n)
				.some((m) => m.seat === 0),
		);
		await until(() => timers().at(-1)?.auto.includes(0) === true, 5000);
		// An action alone (no "back") also ends it.
		await until(() => match.actor() === 0);
		const action = match.legal(0)[0];
		if (!action) throw new Error('no legal action');
		net.send({ type: 'action', action });
		await until(() => timers().at(-1)?.auto.includes(0) === false);
		net.leave();
	});

	test('with the clock off a human is waited for as before', async () => {
		const { net, seen, match, timers } = await begin({ clockMs: 0 });
		await until(() => match.actor() === 0);
		const n = seen.length;
		await Bun.sleep(CLOCK * 2);
		expect(seen.slice(n).filter(({ m }) => m.type === 'step')).toHaveLength(0);
		expect(timers().every((m) => m.seat === null)).toBe(true);
		net.leave();
	});

	test('a full match with one idle human never stalls longer than clock + 1 s', async () => {
		const { net, seen, match } = await begin({ clockMs: 100 });
		await until(() => match.winner !== null, 30000);
		const stamps = seen.filter(({ m }) => m.type !== 'timer').map(({ at }) => at);
		const gaps = stamps.slice(1).map((at, i) => at - (stamps[i] ?? at));
		expect(Math.max(...gaps)).toBeLessThan(100 + 1000);
		net.leave();
	});
});
