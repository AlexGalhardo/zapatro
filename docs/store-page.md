# Página de loja (Steam, Google Play, itch.io)

Textos da página da Steam em EN e PT-BR (T-33, GD-013 em `game-director-feedback.md`), a partir do pitch da seção 7.5 do relatório e do GDD. Os números foram conferidos em `src/data/` (2026-10-25): 8 Campeonatos (`championships.ts`), 60 Manhas (`manhas.ts`), 10 chefes (9 em `BOSS_POOL` + o Rei do Truco, `bosses.ts`), 10 companheiros (`companions.ts`), 5 baralhos (`decks.ts`), 8 Estacas (`MAX_STAKE`, `stakes.ts`), 8 Simpatias, 7 modificadores de carta, 7 Lances e 6 Melhorias. Mudou o conteúdo, refaça a conta antes de publicar.

**Preço, data de lançamento e App ID: a definir** (decisão do dev).

## Arte da loja

Gerada pelo próprio jogo, sem IA: `bun scripts/store-art.ts` (sobe um Vite em 5195, desenha as cartas de `src/art/flat.ts`, os retratos 128 px e o wordmark em Rubik 700 e grava em `docs/media/`; `--url` reaproveita um servidor aberto). Rodar de novo sobrescreve tudo.

| Arquivo | Tamanho | Uso |
|---|---|---|
| `store-steam-header.png` | 920×430 | Steam, header capsule |
| `store-steam-small.png` | 462×174 | Steam, small capsule |
| `store-steam-main.png` | 616×353 | Steam, main capsule |
| `store-steam-vertical.png` | 748×896 | Steam, vertical capsule |
| `store-steam-library.png` | 600×900 | Steam, library capsule |
| `store-steam-hero.png` | 3840×1240 | Steam, library hero (sem logo) |
| `store-steam-logo.png` | 1280×720, alpha | Steam, library logo |
| `store-play-feature.png` | 1024×500, sem alpha | Google Play, gráfico de destaque |
| `store-play-icon.png` | 512×512 | Google Play, ícone (cópia de `mobile/assets/play-store-icon-512.png`, `bun run app-icons`) |
| `store-itch-cover.png` | 630×500 | itch.io, capa |
| `site-og.png` / `.jpg` / `.webp` | 1200×630 | Open Graph e Twitter |
| `presskit-logo.png` / `.svg` | 2048×640, alpha | press kit |

As capturas 1920×1080 (`store-shots-01..06`) saem de `bun scripts/shot.ts --size 1920x1080` num passo à parte.

## Dados da página

| Campo | EN | PT-BR |
|---|---|---|
| Nome | Zapatro | Zapatro |
| Gênero | Roguelike deckbuilder, card game | Roguelike deckbuilder, jogo de cartas |
| Tags sugeridas | Roguelike Deckbuilder, Card Game, Casual, Singleplayer, Roguelite, Strategy | idem (a Steam usa as tags em inglês) |
| Idiomas | English, Portuguese (Brazil): interface e legendas | Inglês e português (Brasil): interface e legendas |
| Jogadores | Single-player (you + an AI partner against two AI rivals) | Um jogador (você + parceiro IA contra dois rivais IA) |
| Controles | Mouse, keyboard, gamepad (and touch on Android) | Mouse, teclado, controle (e toque no Android) |
| Preço | to be decided | a definir |
| Lançamento | to be decided | a definir |

## Descrição curta

**EN** (212 caracteres):

> A Truco Paulista roguelite. You and your AI partner face two rivals: every hand scores Chips × Mult, and calling TRUCO multiplies it. Build absurd combos of Manhas and beat 8 Championships up to the Rei do Truco.

**PT-BR** (213 caracteres):

> Um roguelite de Truco Paulista. Você e seu parceiro IA contra dois rivais: toda mão vencida pontua Fichas × Mult, e pedir TRUCO multiplica. Monte combos absurdos de Manhas e vença 8 Campeonatos até o Rei do Truco.

## Descrição longa

### EN

**Call it. Raise it. Build it.**

Zapatro is a roguelite built on Truco Paulista, the 2v2 card game of Brazilian bars. You sit with an AI partner against an AI pair, with real Truco rules: the vira, the manilhas, the hand of 11 and the iron hand.

Every hand you win scores **Chips × Mult**, and the bet is your Mult: calling TRUCO raises the stake from 1 to 3, then 6, 9 and 12 points. Bluff, accept, run or raise again. Flash a secret signal to your partner, or fake one to fool the rivals.

Between tables, spend your money at the counter: Manhas that bend the rules, modified cards, Simpatias that edit your deck and upgrades for the boteco. Weak pieces on their own, absurd engines together, and every trigger shows why it scored.

Win 8 Championships, face bosses that change the rules of the table and reach the Rei do Truco. Then raise the Stakes.

### PT-BR

**Pede. Aumenta. Monta.**

Zapatro é um roguelite sobre o Truco Paulista, o jogo de cartas 2×2 do boteco. Você senta com um parceiro IA contra uma dupla IA, com as regras de verdade: vira, manilhas, mão de 11 e mão de ferro.

Toda mão vencida pontua **Fichas × Mult**, e a aposta é o seu Mult: pedir TRUCO leva a mão de 1 para 3, depois 6, 9 e 12 pontos. Blefe, aceite, corra ou aumente. Faça um sinal escondido para o parceiro, ou um sinal falso para enganar a dupla rival.

Entre as mesas, gaste no balcão: Manhas que dobram as regras, cartas modificadas, Simpatias que editam o baralho e melhorias para o boteco. Peças fracas sozinhas, motores absurdos juntas, e toda ativação mostra por que pontuou.

Vença 8 Campeonatos, enfrente chefes que mudam a regra da mesa e chegue ao Rei do Truco. Depois, suba a Estaca.

## Destaques

| EN | PT-BR |
|---|---|
| Real Truco Paulista 2v2: vira, manilhas, Hand of 11, Iron Hand | Truco Paulista 2×2 de verdade: vira, manilhas, mão de 11, mão de ferro |
| The bet is the multiplier: TRUCO, SIX, NINE, TWELVE | A aposta é o multiplicador: TRUCO, SEIS, NOVE, DOZE |
| 60 Manhas, 7 card modifiers, 8 Simpatias and 6 boteco upgrades | 60 Manhas, 7 modificadores de carta, 8 Simpatias e 6 melhorias do boteco |
| 10 companions, each with a perk and a flaw; 3 offered as your partner each run | 10 companheiros, cada um com vantagem e defeito; 3 oferecidos como parceiro a cada run |
| 10 bosses that change the rules, up to the Rei do Truco | 10 chefes que mudam as regras, até o Rei do Truco |
| Signals and Fame: bluff with your face, fake signals included | Sinais e Fama: blefe com a cara, sinal falso incluído |
| 5 decks and 8 Stakes; unlocks add variety, never power | 5 baralhos e 8 Estacas; destravar dá variedade, nunca poder |
| Playable tutorial, Almanac and full English and Brazilian Portuguese support | Tutorial jogável, Almanaque e textos completos em inglês e português |

## Requisitos de sistema (Windows)

| | Mínimo (EN) | Mínimo (PT-BR) |
|---|---|---|
| SO | Windows 10 64-bit | Windows 10 64 bits |
| Memória | 4 GB RAM | 4 GB de RAM |
| Placa de vídeo | GPU with WebGL 2 support | GPU com suporte a WebGL 2 |
| Armazenamento | 200 MB available space | 200 MB disponíveis |

macOS e Linux saem do mesmo build Electron (`ci.yml`), mas só entram na página depois de testados.

## Fatos conferidos (todas as lojas)

Os números batem com `src/data/` e com `docs/steam-achievements.md`: 8 Campeonatos, 60 Manhas, 10 chefes, 10 companheiros, 5 baralhos, 8 Estacas e 37 conquistas na Steam. Sem preço e sem data de lançamento: são decisões do dev e ficam em "a definir" até lá.

## Google Play

Limites da Play Console (conferidos em `docs/launch-game.md` §4.3): título até 30 caracteres, descrição curta até 80 e descrição completa até 4000.

| Campo | EN | PT-BR |
|---|---|---|
| Título (≤ 30) | Zapatro: Truco Roguelite | Zapatro: Truco Roguelite |
| Descrição curta (≤ 80; EN 70 caracteres, contados por script) | Truco Paulista roguelite: bet the multiplier and beat 8 Championships. | Roguelite de Truco Paulista: aposte no multiplicador e vença 8 Campeonatos. (75) |
| Descrição completa (≤ 4000) | A descrição longa acima, na seção "Descrição longa" (bem abaixo de 4000 caracteres). | A mesma descrição longa, em PT-BR. |
| Categoria | Jogos → Cartas | Jogos → Cartas |
| Tags | cards, roguelike, strategy | cartas, roguelike, estratégia |

Os limites da Play podem mudar; conferir na Play Console antes de publicar.

## itch.io

O itch.io não está confirmado aqui: os limites de tagline e de descrição devem ser conferidos em <https://itch.io/docs/creators>. Conferir também a tag `pixel-art`: desde a Art Bible v3 (2026-10-27) os personagens e fundos são pintados, então a tag não descreve mais o jogo (ver `pending-decisions.md`). Antes: os retratos eram pixel art, mas o resto da arte era vetor (Art Bible v2), então a tag pode ficar imprecisa.

| Campo | EN | PT-BR |
|---|---|---|
| Tagline (conferir limite) | A Truco Paulista roguelite. Call it. Raise it. Build it. | Um roguelite de Truco Paulista. Pede. Aumenta. Monta. |
| Descrição | A descrição longa acima. Inclua o aviso de IA: arte e áudio gerados por IA (PixelLab e ElevenLabs). | A mesma descrição, com o mesmo aviso de IA. |
| Gênero | Card Game | Card Game |
| Tags | roguelite, deckbuilding, card-game, pixel-art (conferir), truco, brazil | idem |
| Nota da versão web | The full game is on the website. This web build is the demo: it goes up to the first boss. | O jogo completo está no site. Esta versão web é a demo: vai até o primeiro chefe. |

## Poki

A política do Poki não aceita menção a outras lojas nem links externos: o texto abaixo não cita Steam, Google Play nem itch.io, e o botão "Wishlist" fica escondido no build Poki (ver `docs/launch-game.md` §6.1 e §6.5). Limites de texto da Poki: conferir em <https://developers.poki.com>.

| Campo | EN | PT-BR |
|---|---|---|
| Descrição curta (conferir limite) | A Truco Paulista roguelite: bet the multiplier, build Manhas, beat the first Championship boss. | Roguelite de Truco Paulista: a aposta é o multiplicador e monte Manhas até o primeiro chefe. |
| Controles | Mouse, touch and keyboard, landscape | Mouse, toque e teclado, paisagem |
| Idiomas | English, Portuguese (Brazil) | Inglês e português (Brasil) |
| Categoria (sugerida) | Card / Strategy | Cartas / Estratégia |
