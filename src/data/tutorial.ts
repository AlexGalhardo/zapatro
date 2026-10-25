/**
 * Played tutorial (PLAN A6.1): a quick match with a fixed deal and a coach that pauses the table
 * to explain what just happened. Texts: `tutorial.<id>.title` / `.body` in i18n.
 */

/** Moments of the match the coach waits for (TableScene emits them as `tutorial` events). */
export type TutorialTrigger = 'start' | 'yourTurn' | 'trick' | 'truco' | 'scored';

/** What the step points at on the table (TableScene.anchor). */
export const TUTORIAL_ANCHORS = [
	'partner',
	'rivals',
	'score',
	'hud',
	'hand',
	'vira',
	'played',
	'signal',
	'truco',
	'answer',
	'points',
	'manhas',
] as const;
export type TutorialAnchor = (typeof TUTORIAL_ANCHORS)[number];

export interface TutorialStep {
	id: string;
	/** Shown when this happens; `next` = right after the previous card is closed. */
	on: TutorialTrigger | 'next';
	anchor?: TutorialAnchor;
	/** May never happen in the match (nobody calls truco): a later step's trigger skips it. */
	optional?: boolean;
	/** The body names keys: it has a `.touch` variant for touch screens. */
	keys?: boolean;
}

/** The deal: vira 4♣ makes the 5s manilhas and the 6♣ the ZAP; the hand holds the ZAP, a 3 and a low 7. */
export const TUTORIAL_DEAL = {
	seed: 7,
	vira: '4c',
	hand: ['6c', '3h', '7d'],
	manhas: ['seuZe'],
} as const;

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
	{ id: 'welcome', on: 'start', anchor: 'partner' },
	{ id: 'rivals', on: 'next', anchor: 'rivals' },
	{ id: 'goal', on: 'next', anchor: 'score' },
	{ id: 'hand', on: 'next', anchor: 'hand' },
	{ id: 'vira', on: 'next', anchor: 'vira' },
	{ id: 'signals', on: 'next', anchor: 'signal', keys: true },
	{ id: 'truco', on: 'next', anchor: 'truco', keys: true },
	{ id: 'play', on: 'yourTurn', anchor: 'hand', keys: true },
	{ id: 'trick', on: 'trick', anchor: 'played', optional: true },
	{ id: 'answer', on: 'truco', anchor: 'answer', optional: true },
	{ id: 'scored', on: 'scored', anchor: 'points' },
	{ id: 'lances', on: 'next', anchor: 'points' },
	{ id: 'manhas', on: 'next', anchor: 'manhas' },
	{ id: 'eleven', on: 'next', anchor: 'hud' },
	{ id: 'run', on: 'next' },
	{ id: 'done', on: 'next' },
];

/**
 * Index of the step to show when `trigger` happens, or null. `shown` holds the steps already seen;
 * the optional steps before the next required one may show in any order (a rival can call truco
 * before the first trick ends) and are dropped once a later required step shows. `next` only
 * ever shows the first unseen step.
 */
export function tutorialStepFor(
	steps: readonly TutorialStep[],
	shown: ReadonlySet<number>,
	trigger: TutorialTrigger | 'next',
): number | null {
	let from = 0;
	for (const i of shown) if (!steps[i]?.optional) from = Math.max(from, i + 1);
	for (let i = from; i < steps.length; i++) {
		const step = steps[i];
		if (!step || shown.has(i)) continue;
		if (step.on === trigger) return i;
		if (trigger === 'next' || !step.optional) break;
	}
	return null;
}
