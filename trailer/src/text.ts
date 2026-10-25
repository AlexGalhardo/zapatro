export type Lang = 'en' | 'pt';

/**
 * On-screen lines of the trailer and its subtitles (the in-game voices stay in Portuguese in
 * both cuts). Vocabulary of the game (docs/visual.md §5): Fichas × Mult, Aposta, Manhas.
 */
export const TEXT = {
	en: {
		truco: 'TRUCO!',
		six: 'SIX!',
		hook: 'Truco Paulista. 2 vs 2.',
		partner: 'Signal your partner. Read the table.',
		accept: 'Truco accepted: the bet is your Mult',
		count: 'Every hand scores Chips × Mult',
		shop: 'Build an absurd engine',
		stack: 'Stack your Manhas',
		cards: 'Upgrade your cards',
		packs: 'Open packs. Break the game.',
		bosses: 'Bosses that bend the rules',
		rule: 'The rule is always on the table',
		tagline: 'A Truco Paulista Roguelite',
		cta: 'Steam · Google Play · Free demo',
		url: 'truco.lekzera.xyz',
	},
	pt: {
		truco: 'TRUCO!',
		six: 'SEIS!',
		hook: 'Truco Paulista. 2 contra 2.',
		partner: 'Faça sinal pro parceiro. Leia a mesa.',
		accept: 'Truco aceito: a aposta é o seu Mult',
		count: 'Cada mão pontua Fichas × Mult',
		shop: 'Monte um motor absurdo',
		stack: 'Empilhe suas Manhas',
		cards: 'Melhore suas cartas',
		packs: 'Abra pacotes. Quebre o jogo.',
		bosses: 'Chefes que entortam as regras',
		rule: 'A regra do chefe fica na mesa',
		tagline: 'Um Roguelite de Truco Paulista',
		cta: 'Steam · Google Play · Demo grátis',
		url: 'truco.lekzera.xyz',
	},
} as const satisfies Record<Lang, Record<string, string>>;

export type Line = keyof (typeof TEXT)['en'];
