export const LANGS = ['en', 'pt-BR'] as const;
export type Lang = (typeof LANGS)[number];

const en = {
	'meta.title': 'Zapatro — A Truco Paulista Roguelite',
	'meta.desc':
		'Zapatro is a Truco Paulista roguelite: 2v2 truco where the bet is your multiplier. Build Manhas, bluff with signals, beat 8 Championships. Steam, Google Play and a free web demo.',
	'meta.og.alt':
		'The golden Zapatro wordmark over a flat dark background, Fichas × Mult, two pixel-art portraits and a fan of three cards',
	skip: 'Skip to content',
	'nav.presskit': 'Press kit',
	'nav.lang.label': 'Language',
	'hero.tagline': 'A Truco Paulista Roguelite. Call it. Raise it. Build it.',
	'hero.pitch':
		'You and your partner against two rivals. Every hand you win scores Chips × Mult, and calling TRUCO multiplies it. Between tables, build an absurd engine of Manhas, upgraded cards and Simpatias, then beat 8 Championships and the Rei do Truco.',
	'cta.play': 'Play now',
	'cta.demo': 'Play the demo',
	'cta.soon': 'coming soon',
	'cta.newTab': '(opens in a new tab)',
	'badge.steam': 'Wishlist on Steam',
	'badges.label': 'Stores',
	'trailer.title': 'Trailer',
	'trailer.soon': 'Trailer coming soon',
	'trailer.soon.note': 'Placeholder: a still from the game until the trailer is ready.',
	'demo.body':
		'The full game in your browser, or a demo up to the first boss. Mouse, keyboard, touch and gamepad.',
	'footer.privacy': 'Privacy',
	'footer.presskit': 'Press kit',
	'footer.contact': 'Contact',
	'footer.credits': 'Made by Alex Galhardo · Pixel-art portraits · Audio with ElevenLabs',
	'press.title': 'Press kit',
	'press.factsheet': 'Factsheet',
	'press.developer': 'Developer',
	'press.release': 'Release',
	'press.release.value': 'To be announced',
	'press.platforms': 'Platforms',
	'press.platforms.value':
		'Windows, macOS, Linux (Steam) · Android (Google Play) · Web browser (full game and free demo)',
	'press.price': 'Price',
	'press.price.value': 'To be announced · free web demo',
	'press.languages': 'Languages',
	'press.description': 'Description',
	'press.history': 'History',
	'press.history.body':
		'Zapatro started from one question: what if the bet of a Truco hand were the multiplier of your whole score? The rest grew around it: a boteco from the São Paulo countryside, partners with personalities, rivals that read your bluffs and bosses that bend the rules.',
	'press.features': 'Features',
	'press.feat.1':
		'2v2 Truco Paulista with an AI partner and AI rivals that bluff and read signals',
	'press.feat.2': 'Chips × Mult scoring where the truco bet is the base Mult',
	'press.feat.3': '60 Manhas, 7 card modifiers, 8 Simpatias, 7 Lances and Boteco upgrades',
	'press.feat.4':
		'8 Championships and 10 bosses, the last one the Rei do Truco; 5 decks and 8 Stakes',
	'press.feat.6':
		'10 companions, each with a perk and a flaw; 3 of them are offered as your partner every run',
	'press.feat.5': 'Playable tutorial, full English and Brazilian Portuguese',
	'press.images': 'Images',
	'press.images.note': '1920×1080 captures from the game. Click an image for the full-size PNG.',
	'shot.truco':
		'A hand of Truco: the rival calls TRUCO! across a green felt table, with the vira and the manilha shown',
	'shot.count': 'Scoring a hand: 15 Chips × 3 Mult = 45 points toward the 110-point goal',
	'shot.shop':
		"The shop between tables, Seu Zé's Counter: two Manhas, a Lance card and a deck pack for sale",
	'shot.partner':
		'Choosing a partner: Bruto, Sheila and Beti, each with a playing style, a perk and a flaw',
	'shot.boss':
		'A boss table against The Professor, whose rule makes your Fame count double against you',
	'shot.almanac': 'The Almanac, with tabs for Manhas, bosses, companions, decks, feats and stats',
	'press.logo.alt': 'Zapatro logo: the name in gold with a solid dark shadow',
	'press.logo.svg': 'Logo in SVG (vector)',
	'press.icon.alt': 'Zapatro app icon',
	'press.header.alt':
		'Zapatro header: the gold name between two pixel-art portraits and a fan of three cards',
	'press.logos': 'Logo and icon',
	'press.download': 'Download everything (zip)',
	'press.credits': 'Credits',
	'press.contact': 'Contact',
	'privacy.title': 'Privacy policy',
	'privacy.body.1':
		'Zapatro does not collect, store or share personal data. There are no accounts, analytics, ads or trackers in the game or on this site.',
	'privacy.body.2':
		'Your progress is saved only on your own device (browser storage, or the app storage on Android and desktop). You can export it to a file or delete it at any time; nothing is sent to us.',
	'privacy.body.3':
		'Store versions are distributed by Steam and Google Play, and the web demo also runs on itch.io and Poki (its build shows ads from Poki); their own privacy policies apply on those platforms.',
	'privacy.updated': 'Last updated: 2026-10-25',
	'back.home': '← Back to the home page',
} as const;

export type Key = keyof typeof en;

const ptBR: Record<Key, string> = {
	'meta.title': 'Zapatro — Roguelite de Truco Paulista',
	'meta.desc':
		'Zapatro é um roguelite de Truco Paulista: truco 2×2 em que a aposta é o seu multiplicador. Monte Manhas, blefe com sinais, vença 8 Campeonatos. Steam, Google Play e demo grátis na web.',
	'meta.og.alt':
		'O nome Zapatro em dourado sobre fundo escuro chapado, Fichas × Mult, dois retratos em pixel art e um leque de três cartas',
	skip: 'Pular para o conteúdo',
	'nav.presskit': 'Presskit',
	'nav.lang.label': 'Idioma',
	'hero.tagline': 'Um roguelite de Truco Paulista. Pede. Aumenta. Monta.',
	'hero.pitch':
		'Você e seu parceiro contra dois rivais. Toda mão vencida pontua Fichas × Mult, e pedir TRUCO multiplica. Entre as mesas, monte um motor absurdo de Manhas, cartas melhoradas e Simpatias e vença 8 Campeonatos até o Rei do Truco.',
	'cta.play': 'Jogar agora',
	'cta.demo': 'Jogar a demo',
	'cta.soon': 'em breve',
	'cta.newTab': '(abre em nova guia)',
	'badge.steam': 'Lista de desejos na Steam',
	'badges.label': 'Lojas',
	'trailer.title': 'Trailer',
	'trailer.soon': 'Trailer em produção',
	'trailer.soon.note': 'Imagem provisória: uma cena do jogo até o trailer ficar pronto.',
	'demo.body':
		'Jogo completo no navegador ou demo até o primeiro chefe. Mouse, teclado, toque e controle.',
	'footer.privacy': 'Privacidade',
	'footer.presskit': 'Presskit',
	'footer.contact': 'Contato',
	'footer.credits': 'Feito por Alex Galhardo · Retratos em pixel art · Áudio com ElevenLabs',
	'press.title': 'Presskit',
	'press.factsheet': 'Ficha técnica',
	'press.developer': 'Desenvolvedor',
	'press.release': 'Lançamento',
	'press.release.value': 'A definir',
	'press.platforms': 'Plataformas',
	'press.platforms.value':
		'Windows, macOS, Linux (Steam) · Android (Google Play) · navegador (jogo completo e demo grátis)',
	'press.price': 'Preço',
	'press.price.value': 'A definir · demo web grátis',
	'press.languages': 'Idiomas',
	'press.description': 'Descrição',
	'press.history': 'História',
	'press.history.body':
		'O Zapatro nasceu de uma pergunta: e se a aposta de uma mão de Truco fosse o multiplicador de toda a sua pontuação? O resto cresceu em volta: um boteco do interior paulista, parceiros com personalidade, rivais que leem seus blefes e chefes que entortam as regras.',
	'press.features': 'Destaques',
	'press.feat.1': 'Truco Paulista 2×2 com parceiro e rivais IA que blefam e leem sinais',
	'press.feat.2': 'Pontuação Fichas × Mult em que a aposta do truco é o Mult base',
	'press.feat.3':
		'60 Manhas, 7 modificadores de carta, 8 Simpatias, 7 Lances e Melhorias do Boteco',
	'press.feat.4':
		'8 Campeonatos e 10 chefes, o último deles o Rei do Truco; 5 baralhos e 8 Estacas',
	'press.feat.6':
		'10 companheiros, cada um com uma vantagem e um defeito; 3 deles são oferecidos como parceiro a cada run',
	'press.feat.5': 'Tutorial jogável, inglês e português do Brasil completos',
	'press.images': 'Imagens',
	'press.images.note':
		'Capturas do jogo em 1920×1080. Clique numa imagem para o PNG em tamanho cheio.',
	'shot.truco':
		'Uma mão de Truco: o rival pede TRUCO! na mesa de feltro verde, com a vira e a manilha à mostra',
	'shot.count': 'A contagem da mão: 15 Fichas × 3 Mult = 45 pontos rumo à meta de 110',
	'shot.shop':
		'A loja entre as mesas, o Balcão do Seu Zé: duas Manhas, uma carta de Lance e um pacote de baralho à venda',
	'shot.partner':
		'Escolha do parceiro: Bruto, Sheila e Beti, cada um com estilo de jogo, vantagem e defeito',
	'shot.boss':
		'Mesa de chefe contra O Professor, cuja regra faz a sua Fama contar em dobro contra você',
	'shot.almanac':
		'O Almanaque, com abas de Manhas, chefes, companheiros, baralhos, feitos e estatísticas',
	'press.logo.alt': 'Logo do Zapatro: o nome em dourado com sombra escura chapada',
	'press.logo.svg': 'Logo em SVG (vetor)',
	'press.icon.alt': 'Ícone do app Zapatro',
	'press.header.alt':
		'Cabeçalho do Zapatro: o nome em dourado entre dois retratos em pixel art e um leque de três cartas',
	'press.logos': 'Logo e ícone',
	'press.download': 'Baixar tudo (zip)',
	'press.credits': 'Créditos',
	'press.contact': 'Contato',
	'privacy.title': 'Política de privacidade',
	'privacy.body.1':
		'O Zapatro não coleta, guarda nem compartilha dados pessoais. Não há contas, analytics, anúncios ou rastreadores no jogo nem neste site.',
	'privacy.body.2':
		'Seu progresso fica salvo só no seu aparelho (armazenamento do navegador, ou do app no Android e no desktop). Você pode exportá-lo para um arquivo ou apagá-lo quando quiser; nada é enviado para nós.',
	'privacy.body.3':
		'As versões de loja são distribuídas pela Steam e pelo Google Play, e a demo web também roda no itch.io e no Poki (cuja versão mostra anúncios do Poki); as políticas de privacidade dessas plataformas valem lá.',
	'privacy.updated': 'Atualizada em: 2026-10-25',
	'back.home': '← Voltar à página inicial',
};

export const TEXTS: Record<Lang, Record<Key, string>> = { en, 'pt-BR': ptBR };
