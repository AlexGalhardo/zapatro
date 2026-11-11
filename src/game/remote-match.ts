import { Rng } from '../logic/rng';
import type { TableSnapshot } from '../net/protocol';
import { Match } from './match';

/**
 * The table of a LAN match as the scene sees it: a `Match` that plays nothing itself. The server
 * sends a masked, turned snapshot after every step (`src/net/view.ts`); `load` swaps it in, and
 * `actor`, `legal`, `score` and `winner` read from it as they do on a local match. `seats` (2 or 4)
 * is the table's, as the snapshot carries it: read it after `load`.
 */
export class RemoteMatch extends Match {
	constructor() {
		super({
			rng: new Rng(1),
			brains: [{ kind: 'human' }, { kind: 'human' }, { kind: 'human' }, { kind: 'human' }],
		});
	}

	load(snap: TableSnapshot): void {
		this.state = snap.state;
		this.hands = snap.hands;
		// `seats` is readonly on a local match, where the brains fix it; here the server decides.
		Object.assign(this, { seats: snap.state.seats });
	}
}
