import { describe, expect, test } from 'bun:test';
import { TUTORIAL_DEAL, TUTORIAL_STEPS, tutorialStepFor } from '../src/data/tutorial';
import { parseCard } from '../src/logic/truco/cards';

const at = (id: string): number => TUTORIAL_STEPS.findIndex((s) => s.id === id);
/** Every step up to and including `id` already shown. */
const upTo = (id: string): Set<number> =>
	new Set(TUTORIAL_STEPS.slice(0, at(id) + 1).map((_, i) => i));

describe('tutorial coach (A6.1)', () => {
	test('starts on the welcome card and chains the intro cards', () => {
		expect(tutorialStepFor(TUTORIAL_STEPS, new Set(), 'start')).toBe(0);
		expect(tutorialStepFor(TUTORIAL_STEPS, upTo('welcome'), 'next')).toBe(1);
	});

	test('signals and truco are taught before the first card', () => {
		expect(at('signals')).toBeLessThan(at('play'));
		expect(at('truco')).toBeLessThan(at('play'));
	});

	test('a trigger for a later step does not jump over a required one', () => {
		expect(tutorialStepFor(TUTORIAL_STEPS, upTo('truco'), 'scored')).toBeNull();
		expect(tutorialStepFor(TUTORIAL_STEPS, upTo('truco'), 'truco')).toBeNull();
	});

	test('optional steps show in any order before the count', () => {
		const shown = upTo('play');
		expect(tutorialStepFor(TUTORIAL_STEPS, shown, 'truco')).toBe(at('answer'));
		shown.add(at('answer'));
		expect(tutorialStepFor(TUTORIAL_STEPS, shown, 'trick')).toBe(at('trick'));
	});

	test('the count drops unseen optional steps and the chain goes on', () => {
		const shown = upTo('play');
		expect(tutorialStepFor(TUTORIAL_STEPS, shown, 'scored')).toBe(at('scored'));
		shown.add(at('scored'));
		expect(tutorialStepFor(TUTORIAL_STEPS, shown, 'next')).toBe(at('lances'));
		expect(tutorialStepFor(TUTORIAL_STEPS, shown, 'trick')).toBeNull();
	});

	test('the fixed deal parses and the tutorial ends on done', () => {
		expect([TUTORIAL_DEAL.vira, ...TUTORIAL_DEAL.hand].every((c) => parseCard(c))).toBe(true);
		expect(TUTORIAL_STEPS.at(-1)?.id).toBe('done');
	});
});
