import { en, type I18nKey } from './en';
import { ptBR } from './pt-BR';

export const LANGS = ['en', 'pt-BR'] as const;
export type Lang = (typeof LANGS)[number];

const TABLES: Record<Lang, Record<I18nKey, string>> = { en, 'pt-BR': ptBR };

let current: Lang = 'en';

export function setLang(lang: Lang): void {
	current = lang;
}

export function getLang(): Lang {
	return current;
}

/** Browser language → supported language (Portuguese variants → pt-BR). */
export function detectLang(navigatorLang: string | undefined): Lang {
	return navigatorLang?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
	const text = TABLES[current][key];
	if (!vars) return text;
	return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export type { I18nKey };
export const TABLES_FOR_TEST = TABLES;
