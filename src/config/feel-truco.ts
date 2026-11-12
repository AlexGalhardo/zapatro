import { PALETTE } from './palette';

export type TrucoStep = 3 | 6 | 9 | 12;

export interface TrucoCall {
	/** Colour of the name, the burst and the dim. */
	color: number;
	/** Phases of the event at 1× (ms): the table stops, the call comes in, holds, leaves. */
	freezeMs: number;
	inMs: number;
	holdMs: number;
	outMs: number;
	/** Height of the caller's painted card and the size of the call name (logical px). */
	card: number;
	text: number;
	/** Table dim (alpha) and burst rays. */
	dim: number;
	rays: number;
	/** Camera work, through `shake()` and `zoomPunch()`. */
	shake: { ms: number; intensity: number };
	zoom: number;
	/** Music duck (gain multiplier, ms) and the volume of the call sound. */
	duck: { gain: number; ms: number };
	volume: number;
	/** One pulse at the landing; absent in the reduced-flash variant. */
	flash?: { color: number; alpha: number; ms: number };
}

export const TRUCO_CALL: Record<TrucoStep, TrucoCall> = {
	3: {
		color: PALETTE.truco,
		freezeMs: 60,
		inMs: 160,
		holdMs: 380,
		outMs: 100,
		card: 96,
		text: 26,
		dim: 0.3,
		rays: 10,
		shake: { ms: 120, intensity: 0.003 },
		zoom: 0.03,
		duck: { gain: 0.5, ms: 500 },
		volume: 0.8,
		flash: { color: 0xffffff, alpha: 0.12, ms: 120 },
	},
	6: {
		color: PALETTE.cta,
		freezeMs: 60,
		inMs: 170,
		holdMs: 480,
		outMs: 110,
		card: 110,
		text: 31,
		dim: 0.4,
		rays: 12,
		shake: { ms: 150, intensity: 0.005 },
		zoom: 0.04,
		duck: { gain: 0.4, ms: 650 },
		volume: 0.9,
		flash: { color: 0xffffff, alpha: 0.18, ms: 130 },
	},
	9: {
		color: PALETTE.mult,
		freezeMs: 70,
		inMs: 180,
		holdMs: 600,
		outMs: 120,
		card: 124,
		text: 36,
		dim: 0.5,
		rays: 14,
		shake: { ms: 190, intensity: 0.007 },
		zoom: 0.05,
		duck: { gain: 0.3, ms: 800 },
		volume: 1,
		flash: { color: 0xffe6b0, alpha: 0.24, ms: 150 },
	},
	12: {
		color: PALETTE.manilha,
		freezeMs: 90,
		inMs: 200,
		holdMs: 800,
		outMs: 150,
		card: 140,
		text: 42,
		dim: 0.6,
		rays: 18,
		shake: { ms: 260, intensity: 0.01 },
		zoom: 0.07,
		duck: { gain: 0.2, ms: 1000 },
		volume: 1,
		flash: { color: 0xfff0a8, alpha: 0.3, ms: 180 },
	},
};

export const isTrucoStep = (n: number): n is TrucoStep => n === 3 || n === 6 || n === 9 || n === 12;

/** The step's config; with reduced flashes the pulse is gone and the rest stays (movement, steady colour). */
export function trucoCall(step: TrucoStep, reduceFlashes: boolean): TrucoCall {
	if (!reduceFlashes) return TRUCO_CALL[step];
	const { flash: _flash, ...rest } = TRUCO_CALL[step];
	return rest;
}

/** Awaited length of the event at game speed `speed` (1, 2, 4). */
export function trucoTotalMs(step: TrucoStep, speed = 1): number {
	const c = TRUCO_CALL[step];
	return (c.freezeMs + c.inMs + c.holdMs + c.outMs) / speed;
}
