import { expect, test } from 'bun:test';
import { defaultSave, validateSave } from '../src/logic/save';

test('key hints are off by default and for saves without the field', () => {
	expect(defaultSave('pt-BR').settings.keyHints).toBe(false);
	const old = JSON.parse(JSON.stringify(defaultSave('en'))) as {
		settings: Record<string, unknown>;
	};
	delete old.settings.keyHints;
	expect(validateSave(old, 'en').settings.keyHints).toBe(false);
	old.settings.keyHints = true;
	expect(validateSave(old, 'en').settings.keyHints).toBe(true);
});
