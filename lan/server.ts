import { networkInterfaces } from 'node:os';
import { matchMaker, Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { LAN_PORT, ROOM_NAME } from '../src/net/protocol';
import { TrucoRoom } from './room';

export interface LanServer {
	port: number;
	stop: () => Promise<void>;
}

/** Private IPv4 addresses of this machine: what the other players type to join. */
export function lanAddresses(): string[] {
	return Object.values(networkInterfaces())
		.flatMap((list) => list ?? [])
		.filter((n) => n.family === 'IPv4' && !n.internal)
		.map((n) => n.address);
}

/** Starts the LAN table: one Colyseus room (`truco`) that lives as long as the server. */
export async function startLanServer(
	port = LAN_PORT,
	pauses: { botMs?: number; gapMs?: number } = {},
): Promise<LanServer> {
	const server = new Server({ transport: new WebSocketTransport() });
	server.define(ROOM_NAME, TrucoRoom);
	await server.listen(port);
	await matchMaker.createRoom(ROOM_NAME, pauses);
	return { port, stop: () => server.gracefullyShutdown(false) };
}
