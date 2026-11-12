import { PALETTE } from './palette';

/** Every notice the table can show (docs/game-feel.md §7). */
export type NoticeKind =
	| 'vira'
	| 'raise'
	| 'fold'
	| 'trickUs'
	| 'trickThem'
	| 'trickTie'
	| 'eleven'
	| 'iron'
	| 'handUs'
	| 'handThem'
	| 'handNone'
	| 'queda'
	| 'caught'
	| 'boss'
	| 'speed'
	| 'zap'
	| 'joker'
	| 'info';

export type NoticeWeight = 1 | 2 | 3 | 4 | 5;

/** `icon` is an `icon.<name>` key; `color` the accent of the badge and the strip's edge. */
export const NOTICE: Record<NoticeKind, { icon: string; color: number; weight: NoticeWeight }> = {
	vira: { icon: 'cards', color: PALETTE.chips, weight: 2 },
	raise: { icon: 'coin', color: PALETTE.cta, weight: 3 },
	fold: { icon: 'door', color: PALETTE.disabled, weight: 2 },
	trickUs: { icon: 'check', color: PALETTE.good, weight: 2 },
	trickThem: { icon: 'close', color: PALETTE.bad, weight: 2 },
	trickTie: { icon: 'handshake', color: PALETTE.rarityCommon, weight: 1 },
	eleven: { icon: 'alert', color: PALETTE.cta, weight: 3 },
	iron: { icon: 'anvil', color: PALETTE.mult, weight: 3 },
	handUs: { icon: 'trophy', color: PALETTE.good, weight: 3 },
	handThem: { icon: 'skull', color: PALETTE.bad, weight: 3 },
	handNone: { icon: 'question', color: PALETTE.rarityCommon, weight: 2 },
	queda: { icon: 'refresh', color: PALETTE.truco, weight: 5 },
	caught: { icon: 'monocle', color: PALETTE.signal, weight: 2 },
	boss: { icon: 'crown', color: PALETTE.fame, weight: 4 },
	speed: { icon: 'next', color: PALETTE.calm, weight: 1 },
	zap: { icon: 'star', color: PALETTE.manilha, weight: 2 },
	joker: { icon: 'dice', color: PALETTE.jokerPurple, weight: 3 },
	info: { icon: 'alert', color: PALETTE.textDim, weight: 2 },
};

/** Per weight: time on screen at 1× (ms) and text size (logical px). */
export const NOTICE_WEIGHT: Record<NoticeWeight, { ms: number; size: number }> = {
	1: { ms: 600, size: 9 },
	2: { ms: 900, size: 10 },
	3: { ms: 1200, size: 12 },
	4: { ms: 1800, size: 13 },
	5: { ms: 1800, size: 15 },
};

/** Strip geometry (logical px): centre, badge diameter, padding, wrap width, entry slide. */
export const NOTICE_BOX = { x: 390, y: 140, badge: 22, pad: 7, wrap: 250, rise: 8, inMs: 140 };

/** Notices waiting behind the current one; older ones are dropped past this. */
export const NOTICE_QUEUE = 2;
