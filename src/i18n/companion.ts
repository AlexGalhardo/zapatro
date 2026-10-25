import { COMPANIONS, type CompanionId, type Trait } from '../data/companions';
import { type I18nKey, t } from './index';

const signed = (n: number): string => (n > 0 ? `+${n}` : String(n));
const pct = (x: number): string => `${Math.round(x * 100)}%`;

/** One trait as a sentence in the current language. */
export function traitText(tr: Trait): string {
	const key = `companion.trait.${tr.k}` as I18nKey;
	switch (tr.k) {
		case 'callTentos':
		case 'headStart':
		case 'weakWinTento':
			return t(key, { n: tr.n });
		case 'catch':
			return t(key, { d: `${tr.delta > 0 ? '+' : ''}${pct(tr.delta)}` });
		case 'signals':
			return t(key, { d: signed(tr.delta) });
		case 'caughtMult':
		case 'error':
			return t(key, { x: tr.x });
		case 'falseSignals':
			return t(key, { p: pct(tr.rate) });
		default:
			return t(key);
	}
}

export const perkText = (id: CompanionId): string =>
	t('companion.perk', { text: traitText(COMPANIONS[id].perk) });
export const flawText = (id: CompanionId): string =>
	t('companion.flaw', { text: traitText(COMPANIONS[id].flaw) });
