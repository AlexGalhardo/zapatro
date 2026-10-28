import { GAME_SPEEDS, type GameSpeed } from '../config/constants';
import { RESOLUTION_IDS, type ResolutionId } from '../data/display';
import type { KeyBindings } from '../data/keybinds';
import { isTrinketId } from '../data/trinkets';
import { LANGS, type Lang } from '../i18n';
import { defaultKeys, parseKeys } from './keybinds';

/**
 * Local save (PLAN §4.5): one JSON document with schema version and checksum.
 * Bump SAVE_VERSION and add a step to MIGRATIONS whenever the payload shape changes.
 */
export const SAVE_VERSION = 2;
export const SAVE_KEY = 'truco-roguelite.save';

export const PAD_DEADZONES = ['low', 'normal', 'high'] as const;
export type PadDeadzone = (typeof PAD_DEADZONES)[number];
export const TOUCH_MODES = ['auto', 'on', 'off'] as const;
export type TouchMode = (typeof TOUCH_MODES)[number];
/** 0 = auto (largest integer zoom that keeps LOGICAL_H visible), else a fixed zoom. */
export const UI_SCALES = [0, 1, 2, 3, 4] as const;
export type UiScale = (typeof UI_SCALES)[number];
/** Most recent runs kept in the lifetime history. */
export const HISTORY_MAX = 20;

export interface Settings {
	lang: Lang;
	volume: { master: number; music: number; sfx: number; ui: number };
	muted: boolean;
	resolution: ResolutionId;
	/** Zoom: 0 = auto. */
	scale: UiScale;
	screenShake: boolean;
	/** Fewer flashes and pulses. */
	reduceFlashes: boolean;
	/** Four-colour deck: ♦ orange, ♣ green (D-57). */
	fourColor: boolean;
	/** Keycaps with the shortcut on buttons (Esc, Enter, pad glyphs); off by default. */
	keyHints: boolean;
	keys: KeyBindings;
	padVibration: boolean;
	padDeadzone: PadDeadzone;
	/** Touch UI: auto = touch devices only. */
	touchControls: TouchMode;
	/** Animation speed (D-57). */
	gameSpeed: GameSpeed;
}

export type RunEnd = 'won' | 'lost' | 'quit';
export const RUN_ENDS: readonly RunEnd[] = ['won', 'lost', 'quit'];

/** One finished run in the lifetime history. */
export interface RunRecord {
	/** Epoch ms when the run ended. */
	at: number;
	reason: RunEnd;
	/** Championship reached (1–8, more in endless). */
	championship: number;
	/** Best single-hand score. */
	bestHand: number;
	deck: string;
	partner: string;
	stake: number;
}

export interface LifetimeStats {
	runs: number;
	wins: number;
	handsPlayed: number;
	handsWon: number;
	trucosCalled: number;
	bluffsWon: number;
	bestHand: number;
	bestChampionship: number;
	/** Seconds played inside runs. */
	playTime: number;
	/** Most recent first, at most HISTORY_MAX. */
	history: RunRecord[];
}

/** Everything that survives between runs (D-11: variety, never power). */
export interface MetaSave {
	tutorialDone: boolean;
	/** Unlocked content ids (decks, partners, manhas…). */
	unlocked: string[];
	/** Achieved feats. */
	feats: string[];
	/** Highest stake beaten per starting deck. */
	stakes: Record<string, number>;
	/** Ids seen at least once (almanac). */
	seen: string[];
	/** Trinkets held across runs: id → highest level 1–4 (docs/trinkets.md). */
	trinkets: Record<string, number>;
	stats: LifetimeStats;
}

export interface SaveData {
	settings: Settings;
	meta: MetaSave;
	/** Snapshot of the run in progress (saved after every hand, D-32); shape owned by logic/run. */
	run: unknown;
}

export function emptyStats(): LifetimeStats {
	return {
		runs: 0,
		wins: 0,
		handsPlayed: 0,
		handsWon: 0,
		trucosCalled: 0,
		bluffsWon: 0,
		bestHand: 0,
		bestChampionship: 0,
		playTime: 0,
		history: [],
	};
}

export function defaultSave(lang: Lang): SaveData {
	return {
		settings: {
			lang,
			volume: { master: 0.8, music: 0.6, sfx: 0.8, ui: 0.7 },
			muted: false,
			resolution: 'auto',
			scale: 0,
			screenShake: true,
			reduceFlashes: false,
			fourColor: false,
			keyHints: false,
			keys: defaultKeys(),
			padVibration: true,
			padDeadzone: 'normal',
			touchControls: 'auto',
			gameSpeed: 1,
		},
		meta: {
			tutorialDone: false,
			unlocked: [],
			feats: [],
			stakes: {},
			seen: [],
			trinkets: {},
			stats: emptyStats(),
		},
		run: null,
	};
}

/** FNV-1a 32-bit hash of the serialized payload (corruption check, not security). */
export function checksum(text: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16).padStart(8, '0');
}

export interface SaveEnvelope {
	schemaVersion: number;
	savedAt: number;
	appVersion: string;
	checksum: string;
	payload: string;
}

export function serializeSave(save: SaveData, appVersion = '', savedAt = Date.now()): string {
	const payload = JSON.stringify(save);
	const env: SaveEnvelope = {
		schemaVersion: SAVE_VERSION,
		savedAt,
		appVersion,
		checksum: checksum(payload),
		payload,
	};
	return JSON.stringify(env);
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number, min = -Infinity, max = Infinity): number =>
	typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
const int = (v: unknown, d: number, min = 0, max = Infinity): number =>
	Math.floor(num(v, d, min, max));
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const oneOf = <T extends string | number>(v: unknown, list: readonly T[], d: T): T =>
	list.includes(v as T) ? (v as T) : d;
const strings = (v: unknown): string[] =>
	Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [];

function parseRecord(v: unknown): RunRecord | null {
	if (!isObj(v)) return null;
	return {
		at: num(v.at, 0, 0),
		reason: oneOf(v.reason, RUN_ENDS, 'quit'),
		championship: int(v.championship, 1, 1),
		bestHand: int(v.bestHand, 0),
		deck: typeof v.deck === 'string' ? v.deck : 'normal',
		partner: typeof v.partner === 'string' ? v.partner : '',
		stake: int(v.stake, 1, 1),
	};
}

/** Validates field by field, filling defaults, so an old or partial save still loads. */
export function validateSave(raw: unknown, lang: Lang): SaveData {
	const d = defaultSave(lang);
	if (!isObj(raw)) return d;
	const s = isObj(raw.settings) ? raw.settings : {};
	const vol = isObj(s.volume) ? s.volume : {};
	const m = isObj(raw.meta) ? raw.meta : {};
	const st = isObj(m.stats) ? m.stats : {};
	const stakes = isObj(m.stakes) ? m.stakes : {};
	return {
		settings: {
			lang: oneOf(s.lang, LANGS, d.settings.lang),
			volume: {
				master: num(vol.master, d.settings.volume.master, 0, 1),
				music: num(vol.music, d.settings.volume.music, 0, 1),
				sfx: num(vol.sfx, d.settings.volume.sfx, 0, 1),
				ui: num(vol.ui, d.settings.volume.ui, 0, 1),
			},
			muted: bool(s.muted, false),
			resolution: oneOf(s.resolution, RESOLUTION_IDS, 'auto'),
			scale: oneOf(s.scale, UI_SCALES, 0),
			screenShake: bool(s.screenShake, true),
			reduceFlashes: bool(s.reduceFlashes, false),
			fourColor: bool(s.fourColor, false),
			keyHints: bool(s.keyHints, false),
			keys: parseKeys(s.keys),
			padVibration: bool(s.padVibration, true),
			padDeadzone: oneOf(s.padDeadzone, PAD_DEADZONES, 'normal'),
			touchControls: oneOf(s.touchControls, TOUCH_MODES, 'auto'),
			gameSpeed: oneOf(s.gameSpeed, GAME_SPEEDS, 1),
		},
		meta: {
			tutorialDone: bool(m.tutorialDone, false),
			unlocked: strings(m.unlocked),
			feats: strings(m.feats),
			stakes: Object.fromEntries(
				Object.entries(stakes).map(([k, v]) => [k, int(v, 0, 0, 8)]),
			),
			seen: strings(m.seen),
			// Saves from before trinkets start with an empty collection (their Manhas are not converted).
			trinkets: Object.fromEntries(
				Object.entries(isObj(m.trinkets) ? m.trinkets : {})
					.filter(([k]) => isTrinketId(k))
					.map(([k, v]) => [k, int(v, 1, 1, 4)]),
			),
			stats: {
				runs: int(st.runs, 0),
				wins: int(st.wins, 0),
				handsPlayed: int(st.handsPlayed, 0),
				handsWon: int(st.handsWon, 0),
				trucosCalled: int(st.trucosCalled, 0),
				bluffsWon: int(st.bluffsWon, 0),
				bestHand: int(st.bestHand, 0),
				bestChampionship: int(st.bestChampionship, 0),
				playTime: num(st.playTime, 0, 0),
				history: (Array.isArray(st.history) ? st.history : [])
					.map(parseRecord)
					.filter((x): x is RunRecord => x !== null)
					.slice(0, HISTORY_MAX),
			},
		},
		run: isObj(raw.run) ? raw.run : null,
	};
}

/**
 * Chained migrations: MIGRATIONS[v] turns a payload of schema v into v + 1. They only reshape
 * data; validateSave fills whatever is still missing with defaults afterwards.
 */
export const MIGRATIONS: Record<number, (payload: Obj) => Obj> = {
	1: (payload) => renameIds(payload) as Obj,
};

/** v1 → v2: characters (and the feats named after them) go by their real names, not nicknames. */
const ID_RENAMES: Record<string, string> = {
	tonhao: 'bruto',
	donaCida: 'cida',
	zeMalandro: 'jhony',
	juninho: 'nino',
	joca: 'chico',
	lurdes: 'beti',
	tiao: 'ayla',
	neide: 'sheila',
	bia: 'mia',
	professor: 'stuart',
	mudo: 'peter',
	delegado: 'tony',
	comTonhao: 'comBruto',
	comDonaCida: 'comCida',
	comJuninho: 'comNino',
};
const OLD_ID = new RegExp(
	`(?<![A-Za-z0-9])(${Object.keys(ID_RENAMES).join('|')})(?![A-Za-z0-9])`,
	'g',
);

/** Renames every old id inside strings and object keys (ids appear as `partner:tonhao`, `boss.mudo`…). */
function renameIds(v: unknown): unknown {
	const fix = (s: string): string => s.replace(OLD_ID, (id) => ID_RENAMES[id] ?? id);
	if (typeof v === 'string') return fix(v);
	if (Array.isArray(v)) return v.map(renameIds);
	if (isObj(v))
		return Object.fromEntries(Object.entries(v).map(([k, x]) => [fix(k), renameIds(x)]));
	return v;
}

export function migrate(payload: Obj, from: number): Obj {
	let p = payload;
	for (let v = from; v < SAVE_VERSION; v++) {
		const step = MIGRATIONS[v];
		if (step) p = step(p);
	}
	return p;
}

export type ParseFailure = 'empty' | 'json' | 'envelope' | 'checksum' | 'future' | 'payload';
export type ParseResult =
	| { ok: true; save: SaveData; version: number; savedAt: number }
	| { ok: false; reason: ParseFailure };

/** Parses a stored document: envelope → checksum → version → migration → validation. */
export function parseSave(text: string | null, lang: Lang): ParseResult {
	if (!text) return { ok: false, reason: 'empty' };
	let env: unknown;
	try {
		env = JSON.parse(text);
	} catch {
		return { ok: false, reason: 'json' };
	}
	if (!isObj(env) || typeof env.payload !== 'string') return { ok: false, reason: 'envelope' };
	if (env.checksum !== checksum(env.payload)) return { ok: false, reason: 'checksum' };
	const version = int(env.schemaVersion, 1, 1);
	if (version > SAVE_VERSION) return { ok: false, reason: 'future' };
	let payload: unknown;
	try {
		payload = JSON.parse(env.payload);
	} catch {
		return { ok: false, reason: 'payload' };
	}
	if (!isObj(payload)) return { ok: false, reason: 'payload' };
	return {
		ok: true,
		save: validateSave(migrate(payload, version), lang),
		version,
		savedAt: num(env.savedAt, 0, 0),
	};
}

/** Adds a finished run to the lifetime stats. */
export function recordRun(stats: LifetimeStats, rec: RunRecord, playTime: number): void {
	stats.runs++;
	if (rec.reason === 'won') stats.wins++;
	stats.bestHand = Math.max(stats.bestHand, rec.bestHand);
	stats.bestChampionship = Math.max(stats.bestChampionship, rec.championship);
	stats.playTime += playTime;
	stats.history.unshift(rec);
	stats.history.length = Math.min(stats.history.length, HISTORY_MAX);
}
