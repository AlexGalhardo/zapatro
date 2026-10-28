import { type Fx, fxArgs, type TrinketLevel, trinketValues } from '../data/trinkets';
import { getLang, type I18nKey, t } from './index';

/** A number as the language writes it: 1,5 in Portuguese, 1.5 in English. */
const fmt = (n: number): string =>
	getLang() === 'pt-BR' ? String(n).replace('.', ',') : String(n);

const text = (id: string, side: 'perk' | 'flaw', fx: Fx): string => {
	const { n, m } = fxArgs(fx);
	return t(`trinket.${id}.${side}` as I18nKey, { n: fmt(n), m: fmt(m) });
};

export const trinketName = (id: string): string => t(`trinket.${id}.name` as I18nKey);
export const trinketRarityName = (level: number): string =>
	t(`trinket.rarity.${Math.min(4, Math.max(1, level))}` as I18nKey);

/** The Perk and the Flaw of a trinket at a level, as sentences. */
export function trinketTexts(
	id: string,
	level: TrinketLevel | number,
	flawX = 1,
): { perk: string; flaw: string } {
	const v = trinketValues(id, level, flawX);
	if (!v) return { perk: '', flaw: '' };
	return { perk: text(id, 'perk', v.perk), flaw: text(id, 'flaw', v.flaw) };
}
