import type { CompanionId } from '../data/companions';
import { type I18nKey, t } from './index';

/** The companion's Perk and Flaw as sentences (only while he is the player's partner). */
export const perkText = (id: CompanionId): string =>
	t('companion.perk', { text: t(`companion.${id}.perk` as I18nKey) });
export const flawText = (id: CompanionId): string =>
	t('companion.flaw', { text: t(`companion.${id}.flaw` as I18nKey) });
