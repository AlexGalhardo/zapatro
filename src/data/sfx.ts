/**
 * Sound effects (PLAN §8): public/assets/audio/sfx/<key>.mp3 (extra takes <key>.2.mp3 …),
 * generated with ElevenLabs by the assets worktree (docs/audio.md). Mix rules per key.
 */
export interface SfxDef {
	/** Mixer bus: table effects or interface sounds (separate volume sliders). */
	bus: 'sfx' | 'ui';
	volume: number;
	/** Max overlapping instances of this sound. */
	voices: number;
	/** Random playback-rate variation (±). */
	pitch: number;
	/** Approximate length used by the limiter (ms). */
	ms: number;
	/** Takes on disk (<key>.mp3, <key>.2.mp3 …), picked at random. */
	takes?: number;
}

const fx = (volume: number, voices: number, pitch: number, ms: number, takes = 1): SfxDef => ({
	bus: 'sfx',
	volume,
	voices,
	pitch,
	ms,
	takes,
});
const ui = (volume: number, ms: number): SfxDef => ({
	bus: 'ui',
	volume,
	voices: 2,
	pitch: 0.03,
	ms,
});

export const SFX = {
	// Cards and table.
	'sfx.card.shuffle': fx(0.6, 1, 0.03, 900),
	'sfx.card.deal': fx(0.45, 4, 0.1, 200, 2),
	'sfx.card.play': fx(0.6, 3, 0.1, 300, 2),
	'sfx.card.flip': fx(0.55, 2, 0.06, 350),
	'sfx.trick.win': fx(0.55, 1, 0.05, 500),
	'sfx.truco': fx(0.9, 1, 0.04, 700, 2),
	'sfx.bet.accept': fx(0.6, 1, 0.04, 500),
	'sfx.bet.run': fx(0.55, 1, 0.04, 600),
	'sfx.signal': fx(0.4, 1, 0.08, 350),
	'sfx.signal.caught': fx(0.6, 1, 0.03, 600),
	'sfx.card.cover': fx(0.55, 2, 0.08, 250),
	'sfx.zap.reveal': fx(0.7, 1, 0.03, 600),
	'sfx.bet.doze': fx(0.9, 1, 0.02, 750),
	'sfx.queda': fx(0.8, 1, 0, 750),
	'sfx.hand.lose': fx(0.5, 1, 0.03, 500),
	// Scoring and economy.
	'sfx.score.chip': fx(0.35, 4, 0, 120),
	'sfx.score.mult': fx(0.5, 3, 0, 200),
	'sfx.score.xmult': fx(0.6, 2, 0, 350),
	'sfx.money': fx(0.45, 3, 0.1, 350),
	'sfx.manha.trigger': fx(0.45, 3, 0.08, 300),
	'sfx.table.win': fx(0.8, 1, 0, 1800),
	'sfx.table.lose': fx(0.8, 1, 0, 2000),
	// Shop and interface.
	'sfx.shop.buy': ui(0.6, 500),
	'sfx.shop.reroll': ui(0.5, 400),
	'sfx.pack.open': ui(0.7, 900),
	'sfx.ui.move': ui(0.35, 150),
	'sfx.ui.confirm': ui(0.55, 350),
	'sfx.ui.back': ui(0.45, 250),
	'sfx.ui.error': ui(0.5, 250),
} as const satisfies Record<string, SfxDef>;

export type SfxKey = keyof typeof SFX;
/**
 * Voice barks (PLAN §8, docs/audio-final-game.md): `vo.<lang>.<char>.<line>(.2).mp3` in the sfx
 * folder, one voice per character speaking Portuguese (`pt`) and English (`en`). Lines and their
 * take counts; a character without files is simply silent.
 */
export const VO_LINES = {
	truco: 2,
	seis: 2,
	nove: 2,
	doze: 2,
	bora: 2,
	ver: 2,
	corre: 2,
	sacanagem: 2,
	piada1: 2,
	piada2: 2,
	piada3: 2,
} as const;
export type VoLine = keyof typeof VO_LINES;
export const VO_JOKES = ['piada1', 'piada2', 'piada3'] as const satisfies readonly VoLine[];
export type VoJoke = (typeof VO_JOKES)[number];
export const VO_DEF: SfxDef = { bus: 'sfx', volume: 0.9, voices: 1, pitch: 0, ms: 1200 };
/** Folding a call worth this many points or more gets "Tá de sacanagem!" instead of "Tô fora!". */
export const VO_SACANAGEM_BET = 6;
/** Table jokes: at most one every `minHands` hand starts, with `chance`, `delayMs` after the deal. */
export const VO_JOKE = { minHands: 3, chance: 0.5, delayMs: 1800 } as const;

/** Minimum gap between two starts of the same sound (ms). */
export const SFX_MIN_INTERVAL = 45;

/** Music ducking for big moments: gain multiplier and duration. */
export const DUCK = {
	truco: { gain: 0.4, ms: 900 },
	tableWon: { gain: 0.3, ms: 2000 },
} as const;
