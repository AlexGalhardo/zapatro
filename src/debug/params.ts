import { GAME_SPEEDS, type GameSpeed } from '../config/constants';
import { QUICK_MODES, type QuickMode } from '../logic/save';

/**
 * Debug/test options from the URL (PLAN §10.4), e.g.
 * ?skipMenu=1&seed=1&auto=1&speed=4&vira=3c&hand=3c,2h,4d&score=11-0&reveal=1&debug=1
 */
export interface DebugParams {
	seed?: number;
	speed?: GameSpeed;
	debug: boolean;
	skipMenu: boolean;
	/** Start a new run right away (with ?auto=1 the bot plays it). */
	run: boolean;
	/** The bot plays your seat too. */
	auto: boolean;
	/** Show the rivals' hands. */
	reveal: boolean;
	/** Forced vira of the first hand, e.g. `3c` (rank + suit initial: c h s d). */
	vira?: string;
	/** Forced first hand of seat 0, e.g. `3c,2h,4d`. */
	hand?: string[];
	/** Starting score `us-them`, e.g. `11-0` (mão de 11) or `11-11` (mão de ferro). */
	score?: { us: number; them: number };
	/** Start the run at this championship (1–8). */
	champ?: number;
	/** Start the run with this much money. */
	money?: number;
	/** Start the run with these manhas (ids, comma separated). */
	manhas?: string[];
	/** Start the run holding these trinkets: `id` or `id:level` (1-4), comma separated. */
	trinkets?: string[];
	partner?: string;
	/** Quick match format: `1v1` (mano a mano) or `2v2`; `?skipMenu=1` without it plays 2×2. */
	mode?: QuickMode;
	/** Quick match against this boss (and in its room, when it has concept art). */
	boss?: string;
	/** Quick match with a roguelite points goal (Fichas × Mult) instead of plain Truco to 12. */
	goal?: number;
	stake?: number;
	/** Build the web demo behaviour without VITE_DEMO. */
	demo: boolean;
}

const flag = (v: string | null): boolean => v === '1' || v === 'true';

function int(v: string | null, min: number): number | undefined {
	if (v === null || v === '') return undefined;
	const n = Number(v);
	return Number.isInteger(n) && n >= min ? n : undefined;
}

const list = (v: string | null): string[] | undefined =>
	v ? v.split(',').filter((s) => s.length > 0) : undefined;

function score(v: string | null): DebugParams['score'] {
	const m = v?.match(/^(\d{1,2})-(\d{1,2})$/);
	if (!m) return undefined;
	const us = Number(m[1]);
	const them = Number(m[2]);
	return us < 12 && them < 12 ? { us, them } : undefined;
}

export function parseDebugParams(search: string): DebugParams {
	const p = new URLSearchParams(search);
	const speed = int(p.get('speed'), 1);
	return {
		seed: int(p.get('seed'), 0),
		speed: GAME_SPEEDS.find((s) => s === speed),
		debug: flag(p.get('debug')),
		skipMenu: flag(p.get('skipMenu')),
		run: flag(p.get('run')),
		auto: flag(p.get('auto')),
		reveal: flag(p.get('reveal')),
		vira: p.get('vira') ?? undefined,
		hand: list(p.get('hand')),
		score: score(p.get('score')),
		champ: int(p.get('champ'), 1),
		money: int(p.get('money'), 0),
		manhas: list(p.get('manhas')),
		trinkets: list(p.get('trinkets')),
		partner: p.get('partner') ?? undefined,
		mode: QUICK_MODES.find((m) => m === p.get('mode')),
		boss: p.get('boss') ?? undefined,
		goal: int(p.get('goal'), 1),
		stake: int(p.get('stake'), 1),
		demo: flag(p.get('demo')),
	};
}
