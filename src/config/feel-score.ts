/** The score count (docs/game-feel.md §8). Times at 1× in ms; the scene divides by the speed. */

export type CountChannel = 'chips' | 'addMult' | 'xMult' | 'money';

/** How hard a step hits: Chips lightest, +Mult heavier, ×Mult heaviest (money sits with Chips). */
export const COUNT_WEIGHT: Record<CountChannel, 1 | 2 | 3> = {
	chips: 1,
	addMult: 2,
	xMult: 3,
	money: 1,
};

export const SCORE_COUNT = {
	/** Beat of one step by weight, and the extra a named step (trinket, Manha...) holds for reading. */
	beatMs: { 1: 130, 2: 230, 3: 420 },
	namedExtraMs: 170,
	/** The step time shrinks to this fraction of itself by the last step: the count speeds up. */
	endSpeedup: 0.55,
	/** The whole run of steps never lasts more than this, however many there are. */
	ceilingMs: 2800,
	introMs: 120,
	/** Pause on the finished total before it flies, and the flight to the goal card. */
	totalHoldMs: 260,
	flightMs: 340,
	meterMs: 480,
	/** Pitch: semitones gained per step, the cap, and the drop of a Flaw below the running pitch. */
	pitch: { perStep: 1, maxSemitones: 12, flawDrop: -5 },
	/** Number bump per weight, and the size of the flying number (logical px). */
	bump: { 1: 1.18, 2: 1.32, 3: 1.6 },
	flyPx: { 1: 11, 2: 13, 3: 17 },
	/** Camera work for a ×Mult step (zoom amount; shake ms and intensity). */
	xMultZoom: 0.012,
	xMultShake: { ms: 90, intensity: 0.002 },
	/** Hit on the goal card by the hand's share of the goal: [min share, scale, shake intensity]. */
	hit: [
		[0, 1.08, 0],
		[0.1, 1.2, 0.0015],
		[0.3, 1.35, 0.003],
	],
	/** One hand alone reaching the table goal: the bigger finish. */
	beat: {
		dim: 0.5,
		rays: 14,
		inMs: 240,
		holdMs: 900,
		outMs: 220,
		textPx: 20,
		shake: { ms: 260, intensity: 0.008 },
		zoom: 0.06,
		sparks: 26,
	},
} as const;

/** Playback-rate multiplier for a pitch `semitones` above the sound's own. */
export const semitoneRate = (semitones: number): number => 2 ** (semitones / 12);
