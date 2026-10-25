/** Table presentation of the cast (the cast itself is in companions.ts). Art keys: `portrait.<id>.<expr>`. */

/** Portrait expressions (the six signals, plus moods). */
export const EXPRESSIONS = [
	'neutral',
	'happy',
	'angry',
	'sweat',
	'wink',
	'eyebrow',
	'mouth',
	'tongue',
	'lip',
	'up',
] as const;
export type Expression = (typeof EXPRESSIONS)[number];

/** Face that shows each signal (D-35). */
export const SIGN_FACE = {
	zap: 'wink',
	copas: 'eyebrow',
	espadilha: 'mouth',
	picafumo: 'tongue',
	three: 'lip',
	nothing: 'up',
} as const satisfies Record<string, Expression>;

/**
 * What your partner's signal says on the table: only the kind of card, never which one (the
 * ZAP and every manilha are "strong").
 */
export const SIGN_CATEGORY = {
	zap: 'strong',
	copas: 'strong',
	espadilha: 'strong',
	picafumo: 'strong',
	three: 'three',
	nothing: 'nothing',
} as const satisfies Record<string, 'strong' | 'three' | 'nothing'>;

/** Mark inside the partner's signal bubble, per category. */
export const SIGN_MARK = { strong: '★', three: '3', nothing: '✗' } as const;

/** Table timings (ms at 1×; divided by the animation speed). */
export const TABLE_TIMING = {
	deal: 90,
	play: 220,
	trickHold: 650,
	collect: 260,
	think: 420,
	speech: 1100,
	signalFace: 1500,
	handEnd: 1100,
} as const;
