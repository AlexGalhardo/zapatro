import { type I18nKey, t, tDuel } from '../i18n';
import { jokerEffects, type TableState } from '../logic/truco/table';

/** The in-play box keeps this many lines. A newer one drops the oldest off the top. */
export const EFFECT_BOX_LIMIT = 2;

/** One line of the table's "in play" box: what changes the rules of the hand being played. */
export interface HandEffect {
	icon: 'sparkle' | 'skull' | 'alert';
	name: string;
	desc: string;
}

/**
 * Everything that changes the current hand, in the order it matters: the boss's rule, the hand's
 * kind (mão de 11, mão de ferro), then each joker or special-card effect played so far (once each).
 * Empty on a plain hand, so the box can hide. `revealed` keeps the effects whose draw is still
 * being animated (the roulette) out of the box: only the first `revealed` effects of the hand show.
 */
export function handEffects(
	s: TableState,
	boss: string | undefined,
	revealed = Number.POSITIVE_INFINITY,
): HandEffect[] {
	const out: HandEffect[] = [];
	if (boss)
		out.push({
			icon: 'skull',
			name: t(`boss.${boss}.name` as I18nKey),
			desc: tDuel(`boss.${boss}.rule` as I18nKey, s.seats === 2),
		});
	if (s.kind === 'iron') {
		const [name = '', desc = ''] = t('table.iron').split(' · ');
		out.push({ icon: 'alert', name, desc });
	} else if (s.kind === 'eleven')
		out.push({ icon: 'alert', name: t('table.eleven.title'), desc: '' });
	for (const e of new Set(jokerEffects(s).slice(0, revealed)))
		out.push({
			icon: 'sparkle',
			name: t(`joker.${e}.name` as I18nKey),
			desc: tDuel(`joker.${e}.desc` as I18nKey, s.seats === 2),
		});
	return out;
}

/** The lines the box actually draws: the newest `EFFECT_BOX_LIMIT`, oldest first among those. */
export function visibleHandEffects(all: readonly HandEffect[]): HandEffect[] {
	return all.slice(-EFFECT_BOX_LIMIT);
}
