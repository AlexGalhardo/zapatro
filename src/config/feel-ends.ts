import { PALETTE } from './palette';

/** Phases of an authored moment at 1× (ms): the table dims, the content comes in, holds, leaves. */
export interface Phases {
	freezeMs: number;
	inMs: number;
	holdMs: number;
	outMs: number;
}

/** No beginning or end lasts longer than this at 1× (ROADMAP R5.7); at 4× that is a quarter. */
export const MOMENT_MAX_MS = 3000;

export const momentMs = (p: Phases): number => p.freezeMs + p.inMs + p.holdMs + p.outMs;

export interface BossIntroLook extends Phases {
	color: number;
	/** Height of the painted card and font sizes (logical px). */
	card: number;
	name: number;
	rule: number;
	rays: number;
	dim: number;
	shake: { ms: number; intensity: number };
	zoom: number;
	duck: { gain: number; ms: number };
	/** Pulse on landing (alpha); dropped when flashes are reduced. */
	flash: number;
	volume: number;
	/** How far above its place the card falls from (logical px). */
	drop: number;
}

/** The boss table's introduction (docs/game-feel.md §9): the Championship boss and the final one. */
export const BOSS_INTRO: Record<'normal' | 'final', BossIntroLook> = {
	normal: {
		freezeMs: 60,
		inMs: 480,
		holdMs: 1100,
		outMs: 320,
		color: PALETTE.fame,
		card: 150,
		name: 20,
		rule: 9,
		rays: 12,
		dim: 0.5,
		shake: { ms: 160, intensity: 0.005 },
		zoom: 0.04,
		duck: { gain: 0.5, ms: 1200 },
		flash: 0.14,
		volume: 0.9,
		drop: 130,
	},
	final: {
		freezeMs: 80,
		inMs: 700,
		holdMs: 1500,
		outMs: 400,
		color: PALETTE.manilha,
		card: 184,
		name: 26,
		rule: 10,
		rays: 18,
		dim: 0.62,
		shake: { ms: 260, intensity: 0.01 },
		zoom: 0.07,
		duck: { gain: 0.3, ms: 1800 },
		flash: 0.3,
		volume: 1,
		drop: 170,
	},
};

export interface QuedaLook extends Phases {
	color: number;
	/** Height of the closers' painted cards. */
	card: number;
	word: number;
	sub: number;
	dim: number;
	shake: { ms: number; intensity: number };
	zoom: number;
	flash: number;
	/** Pitch of the queda sound in cents: the rivals' is lower and heavier. */
	detune: number;
	volume: number;
}

/** A queda: the pair that closed the match to 12 owns the felt for a beat. */
export const QUEDA: Record<'us' | 'them', QuedaLook> = {
	us: {
		freezeMs: 50,
		inMs: 260,
		holdMs: 900,
		outMs: 240,
		color: PALETTE.manilha,
		card: 96,
		word: 34,
		sub: 10,
		dim: 0.34,
		shake: { ms: 180, intensity: 0.006 },
		zoom: 0.04,
		flash: 0.16,
		detune: 0,
		volume: 1,
	},
	them: {
		freezeMs: 50,
		inMs: 300,
		holdMs: 800,
		outMs: 260,
		color: PALETTE.bad,
		card: 88,
		word: 30,
		sub: 10,
		dim: 0.46,
		shake: { ms: 140, intensity: 0.004 },
		zoom: 0.02,
		flash: 0,
		detune: -500,
		volume: 0.9,
	},
};

export type EndTier = 'win' | 'boss' | 'final' | 'lose' | 'loseFirst' | 'loseBoss';

export interface TableEndLook extends Phases {
	/** Colour of the mood (rays and sparks on a win, the cold dim on a loss). */
	color: number;
	won: boolean;
	dim: number;
	/** Sparks that fall behind the panel and rays that turn (0 on a loss). */
	sparks: number;
	rays: number;
	shake: { ms: number; intensity: number } | null;
	zoom: number;
	flash: number;
	/** How far the panel falls to land (logical px) and the scale it starts from. */
	drop: number;
	from: number;
	/** Music duck for the beat. */
	duck: { gain: number; ms: number };
}

/** The end-of-table panel's entrance and mood, by the weight of the result. */
export const TABLE_END: Record<EndTier, TableEndLook> = {
	win: {
		freezeMs: 0,
		inMs: 380,
		holdMs: 500,
		outMs: 300,
		color: PALETTE.good,
		won: true,
		dim: 0.28,
		sparks: 10,
		rays: 10,
		shake: null,
		zoom: 0,
		flash: 0,
		drop: 40,
		from: 0.88,
		duck: { gain: 0.6, ms: 600 },
	},
	boss: {
		freezeMs: 60,
		inMs: 460,
		holdMs: 1000,
		outMs: 400,
		color: PALETTE.fame,
		won: true,
		dim: 0.4,
		sparks: 22,
		rays: 14,
		shake: { ms: 180, intensity: 0.006 },
		zoom: 0.03,
		flash: 0.14,
		drop: 70,
		from: 0.8,
		duck: { gain: 0.5, ms: 900 },
	},
	final: {
		freezeMs: 80,
		inMs: 600,
		holdMs: 1500,
		outMs: 500,
		color: PALETTE.manilha,
		won: true,
		dim: 0.5,
		sparks: 46,
		rays: 20,
		shake: { ms: 260, intensity: 0.01 },
		zoom: 0.06,
		flash: 0.28,
		drop: 100,
		from: 0.7,
		duck: { gain: 0.4, ms: 1300 },
	},
	lose: {
		freezeMs: 120,
		inMs: 520,
		holdMs: 500,
		outMs: 300,
		color: PALETTE.night,
		won: false,
		dim: 0.5,
		sparks: 0,
		rays: 0,
		shake: null,
		zoom: 0,
		flash: 0,
		drop: 24,
		from: 0.96,
		duck: { gain: 0.5, ms: 800 },
	},
	// The very first table of a run: a lighter blow, the run just began.
	loseFirst: {
		freezeMs: 80,
		inMs: 420,
		holdMs: 300,
		outMs: 250,
		color: PALETTE.night,
		won: false,
		dim: 0.38,
		sparks: 0,
		rays: 0,
		shake: null,
		zoom: 0,
		flash: 0,
		drop: 18,
		from: 0.97,
		duck: { gain: 0.6, ms: 500 },
	},
	loseBoss: {
		freezeMs: 160,
		inMs: 700,
		holdMs: 900,
		outMs: 400,
		color: PALETTE.night,
		won: false,
		dim: 0.62,
		sparks: 0,
		rays: 0,
		shake: { ms: 200, intensity: 0.004 },
		zoom: 0.02,
		flash: 0,
		drop: 36,
		from: 0.94,
		duck: { gain: 0.35, ms: 1200 },
	},
};

export interface EndFacts {
	won: boolean;
	/** Boss id of the table, if any. */
	boss?: string;
	/** The last Championship's boss (the Rei do Truco). */
	finalBoss: string;
	/** First table of the first Championship of a run. */
	first: boolean;
}

/** Weight of a table's result: a boss win outweighs a plain win, the Rei do Truco a boss. */
export function endTier(f: EndFacts): EndTier {
	if (f.won) return f.boss === f.finalBoss ? 'final' : f.boss ? 'boss' : 'win';
	return f.boss ? 'loseBoss' : f.first ? 'loseFirst' : 'lose';
}

/** Every timed moment at 1×, for the 3 s cap test. */
export const MOMENT_TIMES: Record<string, Phases> = {
	'boss.normal': BOSS_INTRO.normal,
	'boss.final': BOSS_INTRO.final,
	'queda.us': QUEDA.us,
	'queda.them': QUEDA.them,
	'end.win': TABLE_END.win,
	'end.boss': TABLE_END.boss,
	'end.final': TABLE_END.final,
	'end.lose': TABLE_END.lose,
	'end.loseFirst': TABLE_END.loseFirst,
	'end.loseBoss': TABLE_END.loseBoss,
};
