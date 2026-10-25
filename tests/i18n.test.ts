import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TABLES_FOR_TEST } from '../src/i18n';

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('i18n (D-29)', () => {
	const en = TABLES_FOR_TEST.en as Record<string, string>;
	const pt = TABLES_FOR_TEST['pt-BR'] as Record<string, string>;

	test('EN and PT-BR have the same keys', () => {
		expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
	});

	test('every text keeps the same placeholders in both languages', () => {
		const bad = Object.keys(en).filter(
			(k) => JSON.stringify(vars(en[k] ?? '')) !== JSON.stringify(vars(pt[k] ?? '')),
		);
		expect(bad).toEqual([]);
	});

	test('no empty text except on purpose', () => {
		const allowed = new Set<string>();
		const empty = Object.keys(en).filter(
			(k) => !allowed.has(k) && (!en[k]?.trim() || !pt[k]?.trim()),
		);
		expect(empty).toEqual([]);
	});
});

describe('no hard-coded UI text', () => {
	test('scenes, UI and views only show text from src/i18n', () => {
		const dirs = ['src/scenes', 'src/ui', 'src/view'];
		const offenders: string[] = [];
		for (const dir of dirs)
			for (const f of readdirSync(dir)) {
				if (!f.endsWith('.ts')) continue;
				const src = readFileSync(join(dir, f), 'utf-8');
				const re = /(?:\.text\([^,]+,[^,]+,\s*|setText\(\s*)(['`])((?:(?!\1).)*)\1/g;
				for (const m of src.matchAll(re)) {
					const literal = (m[2] ?? '').replace(/\$\{[^}]*\}/g, '');
					// The ?debug=1 overlay is developer-only and stays in English.
					if (literal.startsWith('FPS ')) continue;
					if (/[A-Za-zÀ-ú]{3,}/.test(literal)) offenders.push(`${f}: ${m[0]}`);
				}
			}
		expect(offenders).toEqual([]);
	});
});
