import { describe, expect, test } from 'bun:test';
import { TABLES_FOR_TEST } from '../src/i18n';

/** Labels of another game's HUD that the art bible bans (docs/visual.md §5). */
const BANNED = [
	/banca/i,
	/a conta da m/i,
	/a m.o vale/i,
	// "bolso" was banned for the other game's HUD; two trinkets are named so by design (docs/trinkets.md).
	/Boteco do Z/i,
	/mesa 1\/4/i,
	/\bGuia\b/,
	/Truco . no grito/i,
	/Pedr.o/i,
	/malandragens/i,
	/\bsem truco\b/i,
	/\bno truco\b/i,
];

describe('vocabulary', () => {
	test('no banned label in any language', () => {
		for (const lang of ['en', 'pt-BR'] as const) {
			const table = TABLES_FOR_TEST[lang] as Record<string, string>;
			for (const [key, text] of Object.entries(table))
				for (const re of BANNED)
					expect(`${key}: ${re.test(text) ? text : ''}`).toBe(`${key}: `);
		}
	});
});
