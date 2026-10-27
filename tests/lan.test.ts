import { afterAll, describe, expect, test } from 'bun:test';
import { startLanServer } from '../lan/server';
import { RemoteMatch } from '../src/game/remote-match';
import { teamOf } from '../src/logic/truco/table';
import { NetClient } from '../src/net/client';
import type { LobbyState, ServerMessage } from '../src/net/protocol';

const servers: { stop: () => Promise<void> }[] = [];
afterAll(async () => {
	for (const s of servers) await s.stop();
});

let nextPort = 25000 + Math.floor(Math.random() * 2000);
const serve = async () => {
	const port = nextPort++;
	servers.push(await startLanServer(port, { botMs: 1, gapMs: 1 }));
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
		const a = await NetClient.connect(url, 'Ana', 'bia');
		const b = await NetClient.connect(url, 'Beto', 'bia');
		await until(() => b.lobby?.seats[1] != null);
		const lobby = b.lobby as LobbyState;
		expect(lobby.seats[0]?.name).toBe('Ana');
		expect(lobby.seats[1]?.name).toBe('Beto');
		expect(lobby.seats[1]?.char).not.toBe('bia');
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
		const net = await NetClient.connect(url, 'Solo', 'tonhao');
		const p = player(net);
		await until(() => net.lobby !== null);
		net.send({ type: 'start' });
		await until(() => p.match.winner !== null, 30000);
		const first = p.seen.find((m) => m.type === 'start');
		if (first?.type !== 'start') throw new Error('no start');
		// Seats other than yours are unknown at the deal.
		for (const seat of [1, 2, 3] as const)
			expect(first.snap.state.hands[seat].every((c) => c.id === 'hidden')).toBe(true);
		expect(first.start.chars[0]).toBe('tonhao');
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
});
