import { describe, expect, test } from 'bun:test';
import { COMPANION_IDS } from '../src/data/companions';
import { DECK_IDS } from '../src/data/decks';
import { FEATS } from '../src/data/feats';
import { TABLES_FOR_TEST } from '../src/i18n';

/** Systems removed from the game (D-82): no feat may be earned or described through them. */
const REMOVED = /pack|pacote|upgrade|melhoria|promis|promessa|skip|pular|table.?select/i;

describe('feats (R0.4)', () => {
	test('no feat depends on a removed system', () => {
		for (const f of FEATS) {
			expect(JSON.stringify(f)).not.toMatch(REMOVED);
			for (const lang of ['en', 'pt-BR'] as const) {
				const t = TABLES_FOR_TEST[lang] as Record<string, string>;
				expect(`${t[`feat.${f.id}.name`]} ${t[`feat.${f.id}.desc`]}`).not.toMatch(REMOVED);
			}
		}
	});

	test('every unlock names content that exists', () => {
		const known = new Set<string>([
			'legendary',
			...DECK_IDS.map((id) => `deck:${id}`),
			...COMPANION_IDS.map((id) => `partner:${id}`),
		]);
		for (const f of FEATS) if (f.unlocks) expect(known.has(f.unlocks)).toBe(true);
	});
});
