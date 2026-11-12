import { describe, expect, test } from 'bun:test';
import { JOKER_EFFECTS } from '../src/data/jokers';
import { SPECIAL_CARDS } from '../src/data/specials';
import { parseDebugParams } from '../src/debug/params';
import { setLang, TABLES_FOR_TEST } from '../src/i18n';
import { defaultSave, validateSave } from '../src/logic/save';
import type { TableState } from '../src/logic/truco/table';
import { handEffects } from '../src/view/hand-effects';

/** What a two-seat table must never tell the player: there is no pair and no partner. */
const PAIR_WORDS = /dupla|nós|\bnos\b|parceiro|partner|\bpair|\bteam|\bus\b|\bwe\b|\bour/i;

describe('mano a mano wording (R2.3)', () => {
	test('every .duel text of the table avoids pair and partner words, in both languages', () => {
		for (const lang of ['en', 'pt-BR'] as const) {
			const table = TABLES_FOR_TEST[lang] as Record<string, string>;
			const keys = Object.keys(table).filter(
				(k) => k.endsWith('.duel') || k.startsWith('say.trick.duel.'),
			);
			expect(keys.length).toBeGreaterThan(10);
			for (const k of keys)
				expect(`${lang} ${k}: ${PAIR_WORDS.test(table[k] ?? '')}`).toBe(
					`${lang} ${k}: false`,
				);
		}
	});

	test('the Mano a mano rules page and the mode names exist in both languages', () => {
		for (const lang of ['en', 'pt-BR'] as const) {
			const table = TABLES_FOR_TEST[lang] as Record<string, string>;
			for (const k of ['rules.duel.title', 'rules.duel.body', 'run.mode.2v2', 'run.mode.1v1'])
				expect(table[k]?.length).toBeGreaterThan(0);
		}
	});
});

describe('in-play box at a two-seat table', () => {
	test('no joker or special effect names a pair or a partner', () => {
		const state = (effect: string): TableState =>
			({
				kind: 'normal',
				seats: 2,
				tricks: [{ opener: 0, plays: [{ seat: 0, card: {}, effect }] }],
			}) as unknown as TableState;
		for (const lang of ['en', 'pt-BR'] as const) {
			setLang(lang);
			for (const e of [...JOKER_EFFECTS, ...Object.values(SPECIAL_CARDS).flat()]) {
				const [line] = handEffects(state(e), undefined);
				expect(`${lang} ${e}: ${PAIR_WORDS.test(line?.desc ?? '')}`).toBe(
					`${lang} ${e}: false`,
				);
			}
		}
		setLang('en');
	});
});

describe('quick match mode (R2.1)', () => {
	test('the last choice is optional in the save: absent means 2×2, invalid is dropped', () => {
		expect(defaultSave('en').settings.quickMode).toBeUndefined();
		const raw = JSON.parse(JSON.stringify(defaultSave('en'))) as {
			settings: Record<string, unknown>;
		};
		expect(validateSave(raw, 'en').settings.quickMode).toBeUndefined();
		raw.settings.quickMode = '1v1';
		expect(validateSave(raw, 'en').settings.quickMode).toBe('1v1');
		raw.settings.quickMode = '3v3';
		expect(validateSave(raw, 'en').settings.quickMode).toBeUndefined();
	});

	test('?mode=1v1 and ?mode=2v2 are read, anything else is ignored', () => {
		expect(parseDebugParams('?skipMenu=1&mode=1v1').mode).toBe('1v1');
		expect(parseDebugParams('?mode=2v2').mode).toBe('2v2');
		expect(parseDebugParams('?mode=9').mode).toBeUndefined();
		expect(parseDebugParams('?skipMenu=1').mode).toBeUndefined();
	});
});
