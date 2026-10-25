# Pesquisa: design de jogos de cartas digitais e lições para o Zapatro

> Pesquisa feita em 2026-10-15 para orientar o design, a apresentação e o negócio do **Zapatro** (roguelite em pixel art sobre Truco Paulista 2×2, pontuação Fichas × Mult no estilo Balatro).
> Convenções: todo número traz **data e fonte**. Estimativas de terceiros (SteamDB, Gamalytic, AppMagic, Sensor Tower, Udonis) são marcadas como **estimativa**. Quando algo não pôde ser verificado nesta pesquisa, aparece **"não confirmado"**. Afirmações marcadas como **"observação de jogo"** vêm de conhecimento do jogo e não de uma fonte citada aqui.

## Sumário

1. [Panorama rápido](#1-panorama-rápido)
2. [Fichas por jogo](#2-fichas-por-jogo)
   - [Balatro](#21-balatro) · [Slay the Spire](#22-slay-the-spire) · [Slay the Spire 2](#23-slay-the-spire-2) · [Hearthstone](#24-hearthstone) · [Gwent e Thronebreaker](#25-gwent-e-thronebreaker) · [Legends of Runeterra](#26-legends-of-runeterra) · [Inscryption](#27-inscryption) · [Marvel Snap](#28-marvel-snap) · [Monster Train 1 e 2](#29-monster-train-1-e-2) · [Luck be a Landlord](#210-luck-be-a-landlord) · [Cobalt Core](#211-cobalt-core) · [Card Shark](#212-card-shark) · [Peglin](#213-peglin)
3. [Lições transversais](#3-lições-transversais)
4. [Mercado e contexto de negócio](#4-mercado-e-contexto-de-negócio)
5. [Lições priorizadas para o Zapatro](#5-lições-priorizadas-para-o-zapatro)
6. [O que evitar](#6-o-que-evitar)
7. [Lacunas desta pesquisa](#7-lacunas-desta-pesquisa)

---

## 1. Panorama rápido

| Jogo | Lançamento | Modelo | Engine/stack | Equipe | Vendas/receita (data, fonte) |
|---|---|---|---|---|---|
| Balatro | 2024-02-20 (PC/console), 2024-09-26 (mobile) | Premium, sem IAP | LÖVE (Lua) | Solo (LocalThunk) + compositor freelancer; publisher Playstack | 5 mi unidades em 2025-01 ([Playstack](https://www.playstack.com/news/balatro-5-million-copies-sold/)); mobile ~US$ 4,4 mi brutos em 2 meses (estimativa AppMagic, [PocketGamer.biz](https://www.pocketgamer.biz/balatro-nears-44m-on-mobile-amid-a-sudden-spending-surge/)) |
| Slay the Spire | 2017-11 (EA), 2019-01-23 (1.0) | Premium | libGDX (Java) | Pequena (Giovannetti, Yano + arte/música); tamanho exato não confirmado | 1,5 mi em 2019-03 ([PCGamesN](https://www.pcgamesn.com/slay-the-spire/slay-the-spire-sales)) |
| Slay the Spire 2 | 2026-03-05 (EA) | Premium, US$ 24,99 | Godot (migrou de Unity após ~2 anos) | Mega Crit; tamanho não confirmado | 3 mi na 1ª semana ([GamesRadar](https://www.gamesradar.com/games/roguelike/slay-the-spire-2-has-been-out-for-merely-a-week-and-we-have-already-hit-3-million-units-sold-with-more-than-25-million-runs-says-a-stunned-mega-crit-after-becoming-steams-biggest-roguelike/), 2026-03) |
| Hearthstone | 2014-03-11 | F2P, pacotes + cosméticos | Unity (regras no servidor) | 12–15 pessoas no início, 47 em 2015-11 ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)) | >100 mi jogadores em 2018-11 ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)) |
| Gwent | 2018 | F2P | Não confirmado | CD Projekt | Desenvolvimento ativo encerrado em 2023 ([Game Developer](https://www.gamedeveloper.com/business/cd-projekt-ending-active-development-on-gwent-after-2023)) |
| Legends of Runeterra | 2020 | F2P generoso → foco PvE | Unity, C# + Python para conteúdo ([Riot Tech](https://technology.riotgames.com/node/103)) | Riot; equipe reduzida em 2024 | Rodava "no prejuízo" segundo a própria Riot ([Game Developer](https://www.gamedeveloper.com/business/riot-games-overreached-with-big-bets-and-now-530-people-are-losing-their-jobs)) |
| Inscryption | 2021-10-19 | Premium | Unity | Daniel Mullins (estúdio pequeno), publisher Devolver | >1 mi em 2022-01 ([Game Developer](https://www.gamedeveloper.com/business/demonic-deck-builder-inscryption-passes-1-million-sales)) |
| Marvel Snap | 2022-10 | F2P, cosmético-primeiro, sem pacotes | Unity ([Wikipedia](https://en.wikipedia.org/wiki/Marvel_Snap)) | Second Dinner | Receita 2024–2025 divergente entre fontes (ver ficha) |
| Monster Train | 2020-05-21 | Premium | Unity | Shiny Shoe (~19 pessoas segundo o CEO, [gamepressure](https://www.gamepressure.com/newsroom/shiny-shoe-ceo-mark-cooke-explains-why-monster-train-needed-a-seq/zd8975)) | >1,5 mi (press release de 2025-02, [Cosmocover](https://www.cosmocover.com/newsroom/monster-train-2-announced-for-2025-launch-on-pc-and-consoles-play-the-debut-demo-today-for-a-heavenly-successor-to-the-acclaimed-million-selling-hit)) |
| Monster Train 2 | 2025-05-21 | Premium + DLC | Não confirmado | Shiny Shoe, Big Fan Games/Devolver | 500 mil (~2026-01, [TechRaptor](https://techraptor.net/gaming/news/monster-train-2-sales-500k-first-dlc)) |
| Luck be a Landlord | 2021-01 (EA), 2023-01-06 (1.0), 2023-07-21 (mobile) | Premium, sem IAP (US$ 4,99 mobile) | Godot | Solo (Dan DiIorio) | Vendas não confirmadas; Google Play 100 mil+ downloads ([TouchArcade](https://toucharcade.com/2023/07/25/luck-be-a-landlord-mobile-review-iphone-ipad-android/)) |
| Cobalt Core | 2023-11 | Premium | Não confirmado | Rocket Rat Games (publisher Brace Yourself Games) | ~127 mil unidades (estimativa [Sensor Tower](https://app.sensortower.com/vgi/game/cobalt-core)) |
| Card Shark | 2022-06 | Premium | Não confirmado | Nerial, publisher Devolver | Vendas não confirmadas; Metacritic 80 ([Metacritic](https://www.metacritic.com/game/card-shark/)) |
| Peglin | 2022-04 (EA), mobile 2023-04-11 | Premium | Unity (não confirmado nesta pesquisa) | Red Nexus Games (pequena) | 80.204 unidades na 1ª semana (~US$ 1,05 mi bruto, [HowToMarketAGame](https://howtomarketagame.com/2022/05/04/how-peglin-made-1049413-in-1-week/)); >400 mil no 1º ano de EA ([Red Nexus](https://rednexus.games/press/)) |

---

## 2. Fichas por jogo

### 2.1 Balatro

O modelo mais próximo do Zapatro. Vale ler com mais atenção que os outros.

| Aspecto | O que faz |
|---|---|
| **Loop momento a momento** | Escolher até 5 cartas, formar mão de pôquer, ver a pontuação montar Fichas × Mult carta a carta e Coringa a Coringa. Mãos e descartes limitados por blind. Toda a decisão é "qual mão jogar e o que descartar" ([Wikipedia](https://en.wikipedia.org/wiki/Balatro)). |
| **Loop da run** | 8 antes × 3 blinds (Small, Big, Boss). Small e Big podem ser **pulados** em troca de uma Tag (recompensa futura). Boss tem regra que atrapalha (desativa naipe, limita mãos). Loja entre blinds. Vence ao passar a ante 8; modo infinito até a ante 39, onde o número estoura para NaN ([Wikipedia](https://en.wikipedia.org/wiki/Balatro)). |
| **Meta** | Desbloqueio de baralhos ao completar runs; 8 stakes cumulativas; coleção de Coringas descobertos ([Wikipedia](https://en.wikipedia.org/wiki/Balatro), [Balatro Wiki](https://balatrowiki.org/w/Stakes)). |
| **Economia** | Recompensa por blind: Small US$ 3, Big US$ 4, Boss US$ 5, Showdown US$ 8. US$ 1 por mão não usada. **Juros**: US$ 1 a cada US$ 5 guardados, teto de US$ 5 por rodada (ou seja, guardar acima de US$ 25 não rende) ([Balatro Wiki, Money](https://balatrowiki.org/w/Money)). |
| **Loja** | 2 cartas aleatórias + 2 pacotes + 1 Voucher. Reroll começa em US$ 5 e sobe US$ 1 a cada reroll, zerando na próxima loja. Coringa comum US$ 1–6, incomum US$ 4–8, raro US$ 7–10. Pacotes US$ 4/6/8. Voucher US$ 10. Venda = metade do preço, arredondado para baixo, mínimo US$ 1. Peso das cartas: Coringa 71%, Tarô 14%, Planeta 14%. Raridade de Coringa: 70% comum, 25% incomum, 5% raro; lendário só via carta espectral The Soul ([Balatro Wiki, The Shop](https://balatrowiki.org/w/The_Shop)). |
| **Sinergia** | ~150 Coringas em slots limitados (5 por padrão); +Fichas, +Mult, ×Mult, e Coringas que mudam regras. Ordem importa: +Mult aditivo antes de ×Mult ([NexReview](https://nexreview.com/balatro-review/)). Edições (Foil, Holo, Polychrome, Negative) por cima. Planetas sobem o nível de uma mão de pôquer para o resto da run: cria "identidade de build" ([Wikipedia](https://en.wikipedia.org/wiki/Balatro)). |
| **Rampa de dificuldade (stakes)** | Branca (base) → Vermelha (Small Blind sem dinheiro) → Verde (alvo cresce mais rápido) → Preta (Coringas Eternos) → Azul (−1 descarte) → Roxa (alvo cresce ainda mais) → Laranja (Coringas Perecíveis) → Dourada (Coringas de Aluguel, US$ 3/rodada). Cada uma soma as anteriores ([Balatro Wiki, Stakes](https://balatrowiki.org/w/Stakes)). Observação: as stakes mexem em **economia e regras**, não só em números de vida/alvo. |
| **Legibilidade e juice** | Contadores rolando, cartas que pulam ao pontuar, partículas, tremor, e o **fogo no placar** quando a mão passa do alvo, sugerido por um streamer e inicialmente rejeitado pelo autor ([LocalThunk, timeline](https://localthunk.com/blog/balatro-timeline-3aarh)). Análises tratam o feedback como o produto, não como enfeite: a matemática é simples, o "show" é o que dá a sensação de fogos de artifício ([Blake Crosley](https://blakecrosley.com/guides/design/balatro), [DevIndieGame](https://devindiegame.com/articles/why-balatro-succeeded)). |
| **Cor e identidade visual** | Pixel art + shader de CRT (aberração cromática, curvatura) em GLSL sobre o canvas LÖVE ([foro3d](https://foro3d.com/en/2026/mayo/el-arte-del-crt-digital-balatro-y-la-magia-de-love.html)); o visual nasceu de limitação, não de pipeline grande ([Blake Crosley](https://blakecrosley.com/guides/design/balatro)). Fundo em espiral animada, de cor que muda por blind/boss (observação de jogo). **Fichas em azul e Mult em vermelho** de forma consistente em toda a UI (observação de jogo). Raridade de Coringa por cor de selo (comum azul, incomum verde, raro vermelho, lendário roxo): observação de jogo, **não confirmado** por fonte nesta pesquisa. Paleta comunitária com 82 cores extraídas dos Coringas ([Lospec](https://lospec.com/palette-list/balatro-jokers-palette)). |
| **Áudio** | Uma faixa principal lo-fi em loop, "melancólica e fácil de cantarolar", por LouisF/Luis Clemente, contratado no Fiverr em 2023-03 ([Wikipedia](https://en.wikipedia.org/wiki/Balatro), [GameGeeker](https://gamegeeker.com/es/games/balatro/review)). SFX "crocantes" que amplificam a mão grande. Variação de tom/andamento da música por contexto: **não confirmado** por fonte. |
| **Onboarding** | Tutorial curto com o mascote; tabela de mãos consultável a qualquer momento. Crítica: ensina o "como", não o "como jogar bem"; o jogador tropeça até vencer ([boorghani/tips](https://rss.boorghani.com/?p=237209)). Comunidade compensa (Balatro University). |
| **Sessão** | Uma run cabe em ~30–60 min; cada blind são poucos minutos (estimativa, não confirmado por fonte). |
| **Negócio** | Premium. PC/console 2024-02-20; Mac 2024-03-01; Android/iOS 2024-09-26 a US$ 9,99 sem anúncios nem IAP, e versão Balatro+ no Apple Arcade ([Wikipedia](https://en.wikipedia.org/wiki/Balatro), [TheGamer](https://www.thegamer.com/balatro-4-4-million-two-months-mobile-release/)). |
| **Números** | US$ 1 mi bruto em 8 h; 1 mi unidades no 1º mês; 3,5 mi em 2024-12; 5 mi em 2025-01, cerca de metade após o mobile ([Wikipedia](https://en.wikipedia.org/wiki/Balatro), [Game Developer](https://www.gamedeveloper.com/business/balatro-sells-5-million-copies-after-end-of-year-spike)). Mobile: ~US$ 937 mil em 7 dias, ~US$ 4,4 mi em 2 meses, sem contar Apple Arcade (estimativa AppMagic, [PocketGamer.biz](https://www.pocketgamer.biz/balatro-approaches-1-million-in-seven-days-on-mobile/)). Lista de desejos: 48 (2023-05) → 28.661 (2023-07) → 94.212 (2023-12) → 208.401 no lançamento, com 119 mil cópias no Steam no dia 1 ([LocalThunk](https://localthunk.com/blog/balatro-timeline-3aarh)). |
| **Desenvolvimento** | Começou em 2021-12 como hobby nas férias do emprego de TI; protótipo já tinha Fichas × Mult, inspirado em Luck be a Landlord; Coringas e chefes em 2022-02; pausa de 2 meses; beta com ~300 testers; Playstack achou o jogo no Twitter/Steam e assinou em 2023-07; ~2,5 anos no total ([LocalThunk](https://localthunk.com/blog/balatro-timeline-3aarh), [Wikipedia](https://en.wikipedia.org/wiki/Balatro)). Quase todo ajuste de balanceamento é trocar um número ([Rogueliker](https://rogueliker.com/balatro-interview/)). |
| **Demo** | Demo de 50 rodadas (2023-06) foi trocada por uma demo **limitada por conteúdo** (2023-09) porque limitar por rodadas "não era a melhor abordagem". Next Fest de 2023-10 e 2024-02 foram os grandes saltos de wishlist ([LocalThunk](https://localthunk.com/blog/balatro-timeline-3aarh)). |
| **Elogios** | Metacritic 90 (PC), 100% de recomendação no OpenCritic; GOTY no GDCA, 3 prêmios no TGA 2024 incluindo Melhor Jogo Mobile ([Wikipedia](https://en.wikipedia.org/wiki/Balatro)). |
| **Críticas e incidentes** | **PEGI subiu de 3+ para 18+ por "imagens proeminentes de jogo de azar"**, o jogo saiu de venda em alguns territórios; após recurso virou 12+ em 2025-02. Em 2025-03 o YouTube restringiu vídeos de Balatro como 18+ ([Wikipedia](https://en.wikipedia.org/wiki/Balatro)). |
| **Lições ditas pelo autor** | Planejar localização desde o início (textos num arquivo externo); ouvir os testers sobre balanceamento; publisher foi "crucial" para marketing e ports; o ritmo e a pressão pública prejudicaram a saúde ([LocalThunk](https://localthunk.com/blog/balatro-timeline-3aarh)). |

### 2.2 Slay the Spire

| Aspecto | O que faz |
|---|---|
| **Loop** | Combate por turnos com energia; o inimigo mostra a **intenção** do próximo turno. Fora do combate, mapa ramificado (inspirado em FTL) com combates, elites, eventos, loja, descanso; chefe ao fim de cada ato ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)). |
| **Intenções** | Começou oculta, virou "Next Turn", depois ícones de intenção; o playtest mostrou que **mostrar o número exato** engajava mais ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)). Transforma sorte em decisão. |
| **Progressão** | Relíquias (permanentes na run), poções (uso único), ~75 cartas por personagem. Meta: personagens desbloqueados e **Ascensão 1–20**, desbloqueadas em sequência, que estratifica habilidade ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire), [GDC 2019, slides](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf)). Daily com seed fixa e modo custom. |
| **Balanceamento** | Talk do GDC 2019 "Metrics Driven Design and Balance": servidor de métricas próprio, Slack de playtesters, bot de feedback, builds beta quase diárias, 18.168 feedbacks coletados. Meta declarada: "toda carta tem seu lugar, nada distorce demais". O autor alerta que métricas enganam sem interpretação ([GDC Vault](https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics), [slides PDF](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf)). |
| **Visual** | Moldura de carta por tipo (Ataque/Habilidade/Poder com formatos distintos) e cor da borda por raridade (cinza/azul/dourado): observação de jogo, **não confirmado** por fonte nesta pesquisa. Arte de Anailis Dorta; trilha de Clark Aboud ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)). |
| **Stack** | libGDX/Java pela portabilidade; mais tarde Casey Yano reclamou de quebras por atualizações de SO e da falta de suporte a console ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)). |
| **Números** | ~2 mil cópias nas primeiras semanas de EA; decolou após um streamer chinês; 1 mi em 2018-06; 1,5 mi em 2019-03, com a China perto de metade das vendas ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire), [PCGamesN](https://www.pcgamesn.com/slay-the-spire/slay-the-spire-sales)). Totais posteriores: não confirmados nesta pesquisa. |
| **Plataformas** | PC (EA 2017-11, 1.0 2019-01-23), PS4/Switch/Xbox 2019, iOS 2020-06, Android 2021-02. Os ports de console e mobile eram da Humble; com o fechamento do braço de publicação em 2024-07, a Mega Crit **perdeu a capacidade de atualizar** essas versões ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)). |
| **Elogios** | Metacritic 89, 98% OpenCritic; considerado o jogo que popularizou o gênero ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)). |

### 2.3 Slay the Spire 2

| Aspecto | O que faz |
|---|---|
| **Novidades** | 5 personagens (3 de volta + Necrobinder e Regent), atos com 2 versões sorteadas por run, linha do tempo "Epoch" que desbloqueia conteúdo por metas, **co-op até 4 jogadores** ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire_II)). |
| **Stack** | Começou em Unity; após a taxa de runtime da Unity (2023-09) migrou para **Godot**, refazendo ~2 anos de trabalho ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire_II)). |
| **Números** | EA em 2026-03-05, US$ 24,99. 177 mil simultâneos no dia 1, >400 mil no dia 2 ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire_II)), pico >573 mil ([GamingOnLinux](https://www.gamingonlinux.com/2026/03/the-godot-powered-slay-the-spire-2-has-already-hit-over-3-million-sales/)); 3 mi unidades e 25 mi runs na 1ª semana (Mega Crit via [GamesRadar](https://www.gamesradar.com/games/roguelike/slay-the-spire-2-has-been-out-for-merely-a-week-and-we-have-already-hit-3-million-units-sold-with-more-than-25-million-runs-says-a-stunned-mega-crit-after-becoming-steams-biggest-roguelike/)). Estimativas de terceiros: 5,3 mi e US$ 108 mi em março (Alinea, via [ziva.sh](https://ziva.sh/blogs/slay-the-spire-2-godot)); 7 mi unidades ([Sensor Tower](https://sensortower.com/blog/mega-crits-slay-the-spire-ii-slays-with-7-million-units-sold)). |
| **Críticas** | Patch que nerfou loops fortes gerou review bomb (sobretudo da China) e foi parcialmente revertido; arte provisória em cartas novas ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire_II)). Lição: **nerfar combos que os jogadores amam dói mais que deixar fortes**. |

### 2.4 Hearthstone

| Aspecto | O que faz |
|---|---|
| **Design** | Simplificação de Magic: mana sobe 1 por turno até 10, nada de ação do oponente no seu turno, timer de turno; "o jogador não deve gastar muito tempo entendendo as regras" (Eric Dodds) ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)). |
| **Juice e fisicalidade** | Cartas balançam na mão, batem no tabuleiro e saltam para atacar; o tabuleiro treme com dano grande; a interface imita uma plateia reagindo; cantos do tabuleiro clicáveis só por diversão ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)). Talk de UI no GDC "Designing an immersive user interface for Hearthstone" ([referência](https://robertoduncan.commons.gc.cuny.edu/2015/05/27/learn-how-to-design-user-interfaces-from-the-masters)). |
| **Áudio** | Trilha de Peter McConnell (celta + blues rock, "taverna"); stingers de Lendária por Jason Hayes; locução que reage às jogadas ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)). Identidade de "taverna" muito próxima do "boteco" do Zapatro. |
| **Raridade por cor** | Gema: sem gema (básica), branca (comum), azul (rara), roxa (épica), laranja (lendária), herdando a convenção de itens do WoW; no pacote, a carta virada brilha na cor da raridade ao passar o mouse ([Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/Rarity)). |
| **Onboarding** | Tutorial de 3 missões contra IA obrigatório; modos e recursos liberados aos poucos para não sobrecarregar ([Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/New_player_experience)). |
| **Stack e equipe** | Unity, regras no servidor; Team 5 começou com 12–15 pessoas (contra 60+ em outros jogos Blizzard), protótipo em Flash ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)). |
| **Negócio** | F2P com pacotes, ouro e pó arcano. Estimativa de ~US$ 600 mi/ano em 2019 (KeyBanc, via [Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)). Receita muito concentrada em lançamentos: ~US$ 19 mi em 2024-10 contra ~US$ 3,7 mi em 2025-02 (estimativa, [Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/hearthstone-player-count)). |
| **Críticas** | Pay-to-win, custo anual alto (~US$ 400/ano em 2017 segundo Polygon), power creep, ação coletiva em 2022 por incentivar menores a gastar em pacotes ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)). |

### 2.5 Gwent e Thronebreaker

| Aspecto | O que faz |
|---|---|
| **Design** | Melhor de 3 rodadas, gestão de vantagem de cartas (passar a rodada é decisão), sem mana. Detalhes de design: não aprofundados nesta pesquisa. |
| **Resultado** | Gwent foi descrito como decepção financeira (Kotaku, via [DSOGaming](https://www.dsogaming.com/news/thronebreaker-the-witcher-tales-has-not-met-cd-projekts-sales-expectations/)); Thronebreaker (campanha single-player) vendeu abaixo do esperado, com lançamento inicial exclusivo no GOG, de alcance "incomparavelmente menor" que o Steam, segundo o CEO ([DSOGaming](https://www.dsogaming.com/news/thronebreaker-the-witcher-tales-has-not-met-cd-projekts-sales-expectations/)). Desenvolvimento ativo encerrado em 2023, balanceamento entregue a um "conselho" de jogadores, 30 demissões ([Game Developer](https://www.gamedeveloper.com/business/cd-projekt-laying-off-30-members-of-the-gwent-dev-team-as-active-support-ends), [PC Gamer](https://www.pcgamer.com/gwents-official-development-ends-leaving-future-balance-patches-in-the-hands-of-the-community/)). |
| **Engine** | Não confirmado nesta pesquisa. |
| **Lição** | Lançar em loja pequena por exclusividade custou caro; um card game competitivo exige operação contínua que nem um estúdio grande sustentou. |

### 2.6 Legends of Runeterra

| Aspecto | O que faz |
|---|---|
| **Design** | Turnos alternados com ataque/bloqueio e respostas; reconhecido pela generosidade de cartas. |
| **Virada para PvE** | Em 2024 a Riot cortou o time e passou a focar no modo roguelike **Path of Champions**. Motivo declarado: aquisição de cartas generosa demais, quase ninguém gastava, cosméticos custavam mais para fazer do que rendiam. 70–80% dos jogadores estavam no PvE, mas 90% do esforço ia para o PvP. Depois a Riot disse que o PvE ficou "significativamente mais lucrativo" que o PvP ([mein-mmo](https://mein-mmo.de/en/legends-of-runeterra-the-lol-card-game-was-too-generous-never-made-money,1086801/), [TheGamer](https://www.thegamer.com/legends-of-runeterra-eric-shen-penelope-aretos-interview/), [AV Club](https://www.avclub.com/legends-of-runeterra-2025-freedom-dead-game)). |
| **Stack** | Unity (escolhido por PC + mobile), C#, designers escrevem cartas em Python ([Riot Tech](https://technology.riotgames.com/node/103), [DSOGaming](https://www.dsogaming.com/news/riot-games-will-be-using-unity-engine-for-legends-of-runeterra-and-league-of-legends-wild-rift/)). |
| **Lição** | Mesmo num card game de PvP, a maioria quer **PvE roguelike contra IA**: exatamente o espaço do Zapatro. E conteúdo como dado (cartas em script) é o que permite escalar com equipe pequena. |

### 2.7 Inscryption

| Aspecto | O que faz |
|---|---|
| **Design** | Card game de sacrifício (sangue e ossos) dentro de uma cabana com o mestre Leshy, com puzzle de escape room e meta-narrativa; os atos 2 e 3 mudam o sistema e o estilo visual ([GameSpot](https://gamespot.com/reviews/inscryption-review-house-of-cards/1900-6417788/)). |
| **Recepção** | O ato 1 (cabana) é o mais elogiado pela atmosfera; o ato 3 recebe mais críticas por perder o clima e ter mecânicas menos harmoniosas ([GameSpot](https://gamespot.com/reviews/inscryption-review-house-of-cards/1900-6417788/)). |
| **Origem e números** | Nasceu do jogo de Ludum Dare "Sacrifices Must Be Made" (2018); Unity; 100 mil em 3 dias, 250 mil em 9 dias, >1 mi em 2022-01 ([Wikipedia](https://en.wikipedia.org/wiki/Inscryption), [Game Developer](https://www.gamedeveloper.com/business/demonic-deck-builder-inscryption-passes-1-million-sales)). |
| **Lição** | **Lugar e personagem do outro lado da mesa** vendem o jogo tanto quanto as regras. A cabana do Leshy é o equivalente narrativo do boteco do Zapatro: os rivais e o dono do bar podem "falar" com o jogador. |

### 2.8 Marvel Snap

| Aspecto | O que faz |
|---|---|
| **Design** | 6 turnos, ~3 minutos, 3 locais com regras próprias, revelação simultânea. O **Snap** é o cubo de dobrar de gamão: qualquer jogador dobra a aposta a qualquer momento; **recuar** limita a perda ([GDC Vault](https://gdcvault.com/play/1029024/Designing-MARVEL-SNAP), [Wikipedia](https://en.wikipedia.org/wiki/Marvel_Snap)). Receita "de supermercado": gamão + revelação simultânea + locais do Smash Up + partidas curtas do Clash Royale ([mobilegamer.biz](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)). |
| **Recuo como vitória** | A tela de recuo mudou de "Você perdeu!" para **"Escapou!"**; segundo Ben Brode, "fez perder parecer vitória" ([Wikipedia](https://en.wikipedia.org/wiki/Ben_Brode), [GDC](https://www.youtube.com/watch?v=HjhsY2Zuo-c)). |
| **Negócio** | Sem pacotes aleatórios à venda; progresso por Collection Level (upgrades cosméticos) e passe de temporada ([PocketGamer.biz](https://www.pocketgamer.biz/is-marvel-snaps-laid-back-monetization-working), [Axios](https://www.axios.com/2022/11/10/marvel-snap-ben-brode-interview)). US$ 10 mi e 12 mi downloads no 1º mês ([mobilegamer.biz](https://mobilegamer.biz/marvel-snap-clears-10m-revenue-12m-downloads-in-its-first-month/)). Receita 2024–2025: fontes divergem (Udonis estima US$ 60 mi em 2024 e US$ 26 mi em 2025; outra fonte fala em US$ 175 mi → 150 mi), **não confirmado** ([Udonis](https://www.blog.udonis.co/statistics/marvel-snap), [Gameluster](https://gameluster.com/marvel-snap-second-dinner-layoffs-2026/)). Demissões e troca de publisher em 2025 após o caso TikTok/ByteDance ([Kidscreen](https://kidscreen.com/2025/01/21/marvel-snaps-developer-seeks-a-new-publisher/)). |
| **Lição** | É o paralelo mais direto ao **truco** do Zapatro: aumentar a aposta e "correr" são o coração do Snap. O truco já tem isso há um século; o Zapatro deve tratar o "correr" bem feito como pequena vitória, não como derrota seca. |

### 2.9 Monster Train 1 e 2

| Aspecto | O que faz |
|---|---|
| **Design** | Defender a pira no topo de um trem de 4 andares, invocando em 3 andares; dois clãs por run (primário + aliado) com acesso às cartas de ambos; 6 clãs e **25 níveis de Covenant** ([Wikipedia](https://en.wikipedia.org/wiki/Monster_Train), [PlayStation Store](https://www.playstation.com/en-ca/games/monster-train/)). A combinação de clãs multiplica a variedade sem multiplicar o conteúdo. |
| **Balanceamento** | Dashboards de taxa de escolha de cartas, vitória por combinação de clãs e vida perdida por batalha; mexer em um sistema obriga a ajustar outros (Mark Cooke, [Film Stories](https://filmstories.co.uk/gaming/monster-train-literally-a-train-full-of-monsters/)). |
| **Origem** | Game jam interno em 2018-09 num estúdio que vivia de serviço para terceiros ([Digitally Downloaded](https://www.digitallydownloaded.net/2020/02/developer-q-a-monster-train-a-deckbuilding-roguelike-with-a-hellish-theme.html)). |
| **Números** | MT1 >1,5 mi (2025-02, [Cosmocover](https://www.cosmocover.com/newsroom/monster-train-2-announced-for-2025-launch-on-pc-and-consoles-play-the-debut-demo-today-for-a-heavenly-successor-to-the-acclaimed-million-selling-hit)); MT2 500 mil cerca de 8 meses após o lançamento ([TechRaptor](https://techraptor.net/gaming/news/monster-train-2-sales-500k-first-dlc)). |
| **Lição** | "Escolha 2 de N" no início da run gera variedade combinatória barata. No Zapatro o análogo natural é **parceiro × baralho/estaca inicial**. |

### 2.10 Luck be a Landlord

| Aspecto | O que faz |
|---|---|
| **Design** | Caça-níquel customizável: a cada giro adiciona um símbolo; símbolos interagem (gato + leite, abelha + flor); o aluguel sobe a cada prazo; vence pagando 12 aluguéis. 152 símbolos, 227 itens ([Wikipedia](https://en.wikipedia.org/wiki/Luck_Be_a_Landlord), [App Store](https://apps.apple.com/us/app/luck-be-a-landlord/id6450724928)). |
| **Influência** | Inspirou diretamente o Fichas × Mult de Balatro ([LocalThunk](https://localthunk.com/blog/balatro-timeline-3aarh)). |
| **Negócio** | Solo, Godot; premium sem IAP (US$ 4,99 no mobile), com acelerar e pular animação ([TouchArcade](https://toucharcade.com/2023/07/25/luck-be-a-landlord-mobile-review-iphone-ipad-android/)). Port mobile foi mais difícil que "exportar com um clique": builds Android quebradas, rotação e resolução, escolha por retrato ([devlog](https://blog.trampolinetales.com/dans-devlog-april-2023/)). |
| **Risco de loja** | **Banido no Google Play em 13 países** por violar a política de jogos de azar (EAU, Arábia Saudita, Coreia do Sul etc.), apesar de não ter aposta real; recursos com respostas automáticas; na Coreia oscilou entre 12+ e 19+ ([TechRadar](https://www.techradar.com/gaming/satirical-indie-game-luck-be-a-landlord-banned-in-13-countries-by-google), [PocketGamer.biz](https://www.pocketgamer.biz/googles-inconsistent-app-store-stance-on-gambling-comes-under-fire)). |

### 2.11 Cobalt Core

| Aspecto | O que faz |
|---|---|
| **Design** | Deckbuilder de nave com posicionamento num único eixo (desviar, escudo, atacar), tripulação de 3 pilotos cujas cartas formam um baralho compartilhado; loop temporal em que cada run completa revela uma memória ([Rogueliker](https://rogueliker.com/cobalt-core-review/), [OpenCritic](https://opencritic.com/game/15820/cobalt-core)). |
| **Recepção** | 96% positivo no Steam (3.463 análises), PC Gamer 87; críticas: curto, chefes pouco aleatórios, pular recompensa não dá nada em troca ([PC Gamer](https://www.pcgamer.com/cobalt-core-review/), [Wikipedia](https://en.wikipedia.org/wiki/Cobalt_Core), [Steam](https://store.steampowered.com/app/2179850/Cobalt_Core/)). |
| **Números** | ~127 mil unidades, ~US$ 1,8 mi (estimativa [Sensor Tower](https://app.sensortower.com/vgi/game/cobalt-core)). Engine: não confirmado. |
| **Lição** | Escolher 3 personagens que se combinam num baralho único é parente próximo de **você + parceiro** no Zapatro. E sempre dar algo ao pular uma recompensa (Balatro faz isso com as Tags). |

### 2.12 Card Shark

| Aspecto | O que faz |
|---|---|
| **Design** | Não é deckbuilder: é um jogo de **trapaça** em cartas no séc. XVIII, com minijogos de memorização e sinais ao parceiro, sob tensão de ser pego ([Nintendo Life](https://www.nintendolife.com/reviews/switch-eshop/card-shark)). |
| **Recepção** | Metacritic 80; Steam ~88% positivo; críticas a crashes e bugs de animação ([Metacritic](https://www.metacritic.com/game/card-shark/), [Nintendo World Report](http://www.nintendoworldreport.com/review/60584/card-shark-switch-review)). Vendas: não confirmadas. |
| **Lição** | Comunicação **secreta com o parceiro** como mecânica é cativante. O truco tem os **sinais** (piscar, levantar a sobrancelha, morder o lábio): é um diferencial de identidade que nenhum jogo da lista tem, e o Zapatro já tem "sinais" na UI. |

### 2.13 Peglin

| Aspecto | O que faz |
|---|---|
| **Design** | Pachinko + roguelike: atirar orbes em pinos para causar dano; relíquias que domam parte da aleatoriedade ([TheGamer](https://www.thegamer.com/peglin-best-relics/), [Siliconera](https://siliconera.com/?p=1050661)). |
| **Recepção** | Elogio ao loop "só mais uma"; crítica: sorte demais, quantidade de orbes/relíquias confunde iniciantes ([mssv.net](https://mssv.net/2023/07/11/peglin/)). |
| **Números** | 80.204 unidades na 1ª semana a US$ 17,99 ([HowToMarketAGame](https://howtomarketagame.com/2022/05/04/how-peglin-made-1049413-in-1-week/)); >400 mil no 1º ano de EA ([Red Nexus](https://rednexus.games/press/)); Google Play 500 mil+ downloads ([Google Play](https://play.google.com/store/apps/details?id=com.RedNexusGamesInc.Peglin)). Mobile foi decisão "mais simples" porque só era preciso pagar o port ([TouchArcade](https://toucharcade.com/2023/09/11/pegilin-future-content-dlc-pricing-features-cross-save-steam-early-access-community-console-ports-interview/)). |
| **Lição** | Um jogo de **sorte física** precisa de alavancas visíveis de controle; senão a crítica "é tudo sorte" pega. Vale para o Truco (a mão que vem é sorte). |

---

## 3. Lições transversais

### 3.1 Mecânica e loop

| Lição | Evidência |
|---|---|
| **Uma decisão principal, bem clara, repetida muitas vezes.** | Balatro (qual mão jogar), StS (qual carta com a energia), Snap (onde jogar e se dar Snap). |
| **Transformar sorte em decisão mostrando informação.** | StS: intenções com números exatos engajaram mais ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)). Peglin é criticado justamente por sorte demais. |
| **Pular deve render algo.** | Balatro dá Tag ao pular blind; Cobalt Core é criticado por não dar nada ao pular recompensa ([Steam](https://store.steampowered.com/app/2179850/Cobalt_Core/)). |
| **Aposta crescente + recuo honroso.** | Snap (cubo de gamão + "Escapou!"). O truco já é isso. |
| **Combinação de 2 eixos na largada multiplica a variedade.** | Monster Train (2 clãs), Cobalt Core (3 pilotos), Balatro (baralho × stake). |
| **Regras simples, profundidade nas interações.** | Hearthstone simplificou Magic; Balatro é "aritmética simples" com 150 Coringas que interagem. |
| **Chefes com regra própria, não só mais vida.** | Boss Blinds de Balatro; chefes de StS; locais de Snap. |

### 3.2 Recompensa e ritmo

- **Recompensa a cada 2–5 minutos**: fim de blind/combate → dinheiro → loja → escolha. Balatro paga em toda blind, com bônus por mão sobrando e juros por guardar ([Balatro Wiki](https://balatrowiki.org/w/Money)).
- **Tensão entre gastar agora e investir**: juros com teto (US$ 5) evitam "acumular infinito" e criam um alvo claro (US$ 25).
- **Reroll com custo crescente que zera na loja seguinte** limita o rolar compulsivo sem frustrar.
- **Raridade com probabilidade clara** (70/25/5) e lendário só por via especial cria picos de emoção ([Balatro Wiki](https://balatrowiki.org/w/The_Shop)).
- **Recompensa variável e visível**: o brilho na cor da raridade no pacote do Hearthstone antecipa a emoção antes de virar a carta ([Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/Rarity)).

### 3.3 Progressão: poder na run × desbloqueio meta

| Jogo | Poder na run | Meta |
|---|---|---|
| Balatro | Coringas, Planetas, Vouchers, cartas modificadas | Baralhos, stakes, coleção |
| StS | Cartas, relíquias, upgrades | Personagens, Ascensão 20, cartas desbloqueadas |
| Monster Train | Cartas, artefatos, upgrades | Clãs, nível de clã, Covenant 25 |
| Inscryption | Cartas e sacrifícios | Narrativa |
| StS2 | Igual ao StS1 | "Epoch": conteúdo liberado por metas de uso |

Padrão: **o meta desbloqueia variedade e dificuldade, não poder bruto**. Isso preserva o balanceamento e a sensação de habilidade.

### 3.4 Rampa de dificuldade

- Níveis **cumulativos e desbloqueados em sequência** (8 stakes, 20 Ascensões, 25 Covenants).
- Cada nível muda **uma regra legível** (Balatro: "Small Blind sem dinheiro", "−1 descarte", "Coringas Perecíveis") em vez de só aumentar números. Os números ficam para alguns degraus (alvo cresce mais rápido).
- StS usa a Ascensão para estratificar habilidade e manter os veteranos ([slides GDC](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf)).

### 3.5 Loja e economia

- Poucos slots, tipos misturados (Coringa/consumível/pacote/voucher), preço por raridade, venda por metade.
- Um item "permanente" por loja (Voucher) dá uma decisão de longo prazo a cada parada.
- A primeira loja é garantida (Balatro sempre oferece um pacote de Buffoon na primeira): onboarding pela economia.

### 3.6 Legibilidade, UI e juice

- **Mostrar a conta passo a passo** com animação sincronizada ao som (Balatro). O Zapatro já faz isso com os `steps` de `scoreHand`.
- **Cores fixas para os dois termos da conta** (Fichas azul, Mult vermelho no Balatro): o jogador lê sem ler.
- **Escalada de feedback proporcional ao tamanho do número** (fogo no placar quando passa o alvo).
- **Fisicalidade**: cartas que balançam, batem e tremem (Hearthstone).
- **Velocidade ajustável e pular animação** (Luck be a Landlord no mobile, Balatro tem velocidade de jogo).
- **Consulta de regras sempre a um toque** (tabela de mãos do Balatro).

### 3.7 Cor e identidade visual

| Princípio | Exemplo |
|---|---|
| Estilo nascido da limitação (pixel + shader de CRT) | Balatro ([Blake Crosley](https://blakecrosley.com/guides/design/balatro)) |
| Raridade por cor com convenção herdada | Hearthstone: branca/azul/roxa/laranja do WoW ([Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/Rarity)) |
| Tipo de carta por **forma** da moldura, raridade por **cor** | StS (observação de jogo) |
| Lugar com identidade forte | Cabana (Inscryption), taverna (Hearthstone), boteco (Zapatro) |
| Evitar a linguagem visual "gamer" de fantasia | LocalThunk evitou o vocabulário de fantasia e combate ([Rogueliker](https://rogueliker.com/balatro-interview/)) |

Recomendação técnica: nunca codificar informação **só** por cor (daltonismo); combinar cor + forma/ícone, como StS faz com o formato da moldura.

### 3.8 Áudio

- **Uma trilha forte em loop basta** se for marcante (Balatro, faixa principal lo-fi do LouisF, contratado no Fiverr).
- **SFX são o motor do juice**: cada passo da contagem tem um som, com tom subindo (observação de jogo; não confirmado por fonte).
- **Stinger** para eventos raros (lendárias no Hearthstone).
- **Ambiente com plateia** reagindo (Hearthstone) é muito adequado a um boteco.

### 3.9 Onboarding

- Tutorial curto **dentro da partida real** (Hearthstone: 3 missões + dicas na primeira visita de cada tela).
- **Liberar sistemas aos poucos** (Hearthstone bloqueia modos no início).
- Ensinar **"como jogar bem"**, não só "como funciona": é a principal crítica ao tutorial do Balatro.

### 3.10 Duração de sessão

- Partida/round curto (Snap ~3 min; blind do Balatro alguns minutos), run de 30–90 min (estimativa; duração exata não confirmada por fonte), **com salvar e sair a qualquer momento**: é o que faz o jogo funcionar no celular.

### 3.11 Modelo de negócio

| Modelo | Quem | Resultado |
|---|---|---|
| Premium sem IAP, PC → console → mobile | Balatro, StS, LbaL, Peglin, Inscryption | Funciona para solo/pequenos; mobile premium pode ser muito relevante (metade das vendas de Balatro veio após o mobile) |
| F2P com pacotes | Hearthstone | Lucra, mas exige operação enorme e gera crítica de pay-to-win e processos |
| F2P generoso | LoR | Prejuízo, virou PvE |
| F2P cosmético-primeiro | Marvel Snap | Bom início, queda e demissões depois |
| Exclusividade em loja pequena | Thronebreaker no GOG | Vendas abaixo do esperado |

### 3.12 Stack, equipe e tempo

| Jogo | Stack | Equipe | Tempo até 1.0 |
|---|---|---|---|
| Balatro | LÖVE/Lua | 1 | ~2,5 anos |
| Luck be a Landlord | Godot | 1 | ~2 anos de EA (2021-01 → 2023-01) |
| StS | libGDX | pequena | EA de ~14 meses (2017-11 → 2019-01) |
| StS2 | Unity → Godot | Mega Crit | ~2 anos perdidos na migração; EA em 2026-03 |
| Inscryption | Unity | pequena | jam 2018 → 2021-10 |
| Monster Train | Unity | ~19 | jam 2018-09 → 2020-05 |
| Hearthstone | Unity | 12–15 → 47 | ~4 anos até 2014 (aproximado; não confirmado) |
| LoR | Unity | grande | não confirmado |

Nenhum dos sucessos exigiu engine sofisticada. O que pesou foi **iteração rápida e conteúdo como dado** (LoR com cartas em Python; Balatro com "balancear é trocar número").

---

## 4. Mercado e contexto de negócio

| Dado | Fonte |
|---|---|
| 212 roguelike deckbuilders no Steam em 2025 (~1 a cada 41 h); só 5,1% passaram de 1.000 análises (6,71% em 2024) | [Spawn Point Marketing](https://spawnpointmarketing.substack.com/p/roguelite-fatigue-is-brewing-on-the), [HowToMarketAGame](https://howtomarketagame.com/2026/01/27/what-the-hell-happened-in-2025/) |
| Publishers evitam roguelike deckbuilders em 2026; ~250 pitches do gênero recebidos por um único publisher em um ano | [Ingamenews](https://www.ingamenews.com/2026/05/gaming-news-why-publishers-are-avoiding.html) (fonte secundária) |
| Mediana de vendas na semana 1 ≈ 10,5% das wishlists (dataset GameDiscoverCo) | [GameDiscoverCo](https://newsletter.gamediscover.co/p/why-did-this-excellent-roguelike) |
| Poki: 100% da receita do tráfego direto, 50/50 do tráfego trazido pela Poki, em troca de **exclusividade na web** (Steam e lojas mobile continuam liberados) | [Poki SDK](https://sdk.poki.com/) |
| Apps de truco no Brasil: Smart Truco 10 mi+ instalações no Google Play; Truco Brasil (Brasmobi) "jogado por mais de 4 milhões"; Copag Play com Truco Paulista de manilha variável | [APKCombo](https://apkcombo.com/smart-truco/br.com.lge.smartTruco/), [App Store](https://apps.apple.com/BR/app/id1123052458), [BlueStacks](https://www.bluestacks.com/campaign/br.com.copag.truco/pt-br) |
| Jogos com estética de aposta sofrem com classificação: PEGI 18+ para Balatro (revertido para 12+); Luck be a Landlord banido em 13 países no Google Play | [Wikipedia](https://en.wikipedia.org/wiki/Balatro), [TechRadar](https://www.techradar.com/gaming/satirical-indie-game-luck-be-a-landlord-banned-in-13-countries-by-google) |

Leitura: o gênero está saturado no Steam, mas **o truco é um tema com público enorme no Brasil e quase nenhum concorrente roguelite**. A diferenciação do Zapatro não é "mais um deckbuilder": é **truco com parceiro, sinais e aposta**, com uma camada de build por cima. Não há dado confirmado de quantos jogadores de truco mobile pagariam por um jogo premium.

**Conflito a resolver:** a Poki pede exclusividade na web; o plano atual do Zapatro tem demo no itch.io **e** na Poki, e jogo no site próprio (Vercel). Isso precisa ser negociado (acordo não exclusivo com taxa fixa, segundo [Poki deals](https://sdk.poki.com/deals.html)) ou escolhido.

---

## 5. Lições priorizadas para o Zapatro

Ordem = impacto esperado ÷ custo. "P1" = fazer antes do lançamento.

### Mecânica e loop

1. **P1. Tratar "correr" como pequena vitória.** Ao fugir de um truco, mostrar quanto foi poupado ("Correu: evitou −9") em vez de só a derrota da mão, como o "Escapou!" do Snap. Custo baixo, efeito grande na frustração.
2. **P1. Expor a informação que transforma sorte em decisão.** Mostrar sempre a manilha da vez, a força relativa de cada carta na mão e (se o design permitir) uma "intenção" leve dos rivais nos chefes, como as intenções do StS. A crítica "é tudo sorte" (Peglin) é o maior risco de um jogo sobre um jogo de cartas tradicional.
3. **P1. Os chefes mudam uma regra do truco, não só o alvo.** Boss Blinds e intenções provam que a regra nova é o que se lembra da luta. Ex.: "manilha fixa", "sem pedir truco nesta mão", "parceiro mudo (sem sinais)".
4. **P1. Os sinais do parceiro como mecânica de identidade.** Nenhum concorrente tem comunicação com parceiro (Card Shark mostra que isso cativa). Manhas e parceiros que leem ou dão sinais são o diferencial mais barato que o Zapatro tem.
5. **P2. Pular mesa deve dar recompensa** (Tag de Balatro). Se o Zapatro permite pular mesa pequena/grande, sempre com algo em troca.
6. **P2. Variedade combinatória na largada:** parceiro × baralho/estaca, como 2 clãs no Monster Train. Melhor do que mais Manhas.

### Recompensa, economia e loja

7. **P1. Economia legível com juros com teto.** Copiar o princípio (não os números): pagamento por mesa, bônus por mão/recurso sobrando, juros com teto claro. Mostrar a quebra na tela de "fechar a conta".
8. **P1. Reroll com custo crescente que zera** e preço por raridade com probabilidade explícita (algo como 70/25/5), com a raridade máxima só por consumível especial.
9. **P2. Um item permanente por loja** (equivalente ao Voucher) para dar decisão de longo prazo.

### Progressão e dificuldade

10. **P1. Estacas cumulativas, cada uma mudando uma regra legível** (8 é o número validado por Balatro). Usar regras próprias do truco: "mão de 11 obrigatória", "rivais pedem truco mais cedo", "Manha Perecível". Números (alvo maior) só em alguns degraus.
11. **P1. O meta desbloqueia variedade e dificuldade, não poder bruto** (parceiros, baralhos, estacas, coleção de Manhas descobertas).
12. **P2. Balanceamento guiado por métricas**: o projeto já tem `sim.ts`, `balance` e o bot; acrescentar **taxa de escolha e de vitória por Manha** (dashboards do Monster Train, servidor de métricas do StS) e não nerfar combos queridos sem necessidade (review bomb do StS2).

### UI, visual e cor

13. **P1. Duas cores fixas para Fichas e Mult em todo lugar** (placar, tooltips, Manhas, loja), com ícone junto para quem é daltônico. Escolher a dupla da paleta do boteco (não a de Balatro).
14. **P1. Escalada de feedback proporcional ao número**: tremor, partículas e um efeito especial quando a mão passa do alvo. Cada aposta (1/3/6/9/12) com feedback mais forte que a anterior: o ZAP e o "Doze!" são o fogo no placar do Zapatro.
15. **P1. Raridade por cor + forma** (moldura/selo), convenção estável e explicada uma vez.
16. **P1. Velocidade de animação ajustável e pular animação** (já existe `?speed`; precisa estar no menu de opções, sobretudo no mobile).
17. **P2. A mesa como personagem**: dono do bar, rivais com falas e reações, plateia do boteco reagindo às jogadas grandes (a plateia do Hearthstone, a cabana do Inscryption).

### Áudio

18. **P1. Um SFX por passo da contagem, com tom subindo** a cada passo; som próprio para cada nível de aposta e um "stinger" para ZAP/Doze.
19. **P2. Uma trilha principal marcante em loop** (moda de viola/forró de boteco em lo-fi) vale mais que muitas faixas medianas; variações por contexto (loja, chefe) podem ser da mesma faixa.
20. **P2. Ambiente de bar** (copos, conversa, TV ao fundo) baixo, sobe na mão decisiva.

### Onboarding

21. **P1. Tutorial dentro de uma partida real**, ensinando truco para quem não sabe (o público internacional não sabe) e **dicas de "como jogar bem"** na primeira run (a crítica ao Balatro).
22. **P1. Tabela de força das cartas e de manilha sempre a um toque**, como a tabela de mãos do Balatro.
23. **P2. Liberar sistemas aos poucos** (Simpatias, Lances, modificadores) nas primeiras runs.

### Negócio e lançamento

24. **P1. Demo limitada por conteúdo, não por rodadas/tempo**, e concentrar o marketing em **Steam Next Fest** (lição explícita do LocalThunk; o plano atual de demo até o primeiro chefe já está alinhado).
25. **P1. Premium sem IAP em todas as lojas**, com mobile como segunda onda forte (metade das vendas de Balatro veio depois do mobile).
26. **P1. Preparar a classificação etária contra "jogo de azar"**: o truco é apostado em pontos, sem dinheiro real e sem compra aleatória paga, mas Balatro levou PEGI 18+ e Luck be a Landlord foi banido em 13 países no Google Play. Ter a justificativa pronta (IARC/PEGI), evitar fichas de cassino, moedas e caça-níquel na arte e no texto de loja, e testar o questionário de classificação cedo.
27. **P1. Resolver o conflito Poki × itch.io × site próprio** antes de assinar (exclusividade na web).
28. **P2. Localização desde o início** (já é EN + PT-BR); o espanhol (Argentina e Uruguai jogam truco) é o próximo idioma com maior afinidade temática. Não há dado de mercado confirmado nesta pesquisa.
29. **P2. Streamers**: StS decolou com um streamer chinês, LbaL com streamers, Balatro ganhou o efeito do fogo de um streamer. Um modo seed/daily facilita conteúdo; streamers brasileiros de truco são um nicho natural.

### Escopo (solo dev)

30. **P1. Fechar escopo com conteúdo como dado** (já é o caso em `src/data/`); ~150 Coringas foi o tamanho do Balatro com 1 pessoa em 2,5 anos, mas o protótipo vencedor tinha muito menos. Qualidade de 60–80 Manhas bem integradas vale mais que 150 rasas (estimativa de julgamento, não um dado).
31. **P1. Proteger a saúde e o ritmo**: o autor do Balatro cita a pressão do lançamento como a lição mais séria.
32. **P2. Não depender de terceiros para atualizar versões** (StS perdeu os ports da Humble): manter as builds Electron e Capacitor sob controle próprio, como já está planejado.

---

## 6. O que evitar

| Evitar | Por quê |
|---|---|
| Copiar arte, paleta, layout, fonte, espiral de fundo ou CRT do Balatro | Identidade e risco de "clone"; regra do projeto. Extrair princípios (legibilidade, escalada de feedback), não a aparência. |
| Vender pacotes aleatórios, IAP ou anúncios no jogo pago | Processos e crítica (Hearthstone), risco de classificação "jogo de azar", contrário ao posicionamento. |
| Iconografia de cassino (fichas de pôquer, caça-níquel, roleta, cifrões) na arte, nos trailers e no texto da loja | Gatilho de PEGI 18+ e de banimento no Google Play (Balatro, Luck be a Landlord). |
| Modo PvP competitivo online | Operação contínua cara; LoR e Gwent não se sustentaram; a maioria prefere PvE contra IA (70–80% no LoR). |
| Exclusividade em loja ou portal pequeno sem contrapartida | Thronebreaker no GOG; exclusividade web da Poki conflita com itch.io e site. |
| Demo limitada por tempo ou número de rodadas | Lição explícita do LocalThunk. |
| Dificuldade só por números (alvo maior, inimigo com mais vida) | Os melhores (stakes, Ascensão) mudam regras legíveis. |
| Excesso de sorte sem alavancas de controle | Crítica principal ao Peglin. |
| Nerfar combos que a comunidade ama, sem aviso | Review bomb do StS2. |
| Trocar de engine no meio do projeto | StS2 refez ~2 anos de trabalho. Ficar no Phaser 4 + TypeScript. |
| Muitos sistemas expostos na primeira run | Peglin é criticado pela sobrecarga; Hearthstone libera aos poucos. |
| Codificar raridade, tipo ou termo da conta só por cor | Acessibilidade (daltonismo); usar cor + forma/ícone. |
| Mudar o tom no meio do jogo (perder a "cabana") | O ato 3 de Inscryption é o mais criticado por perder a atmosfera; manter o boteco do começo ao fim. |

---

## 7. Lacunas desta pesquisa

- **Não confirmados**: engine de Gwent, Cobalt Core, Card Shark e Monster Train 2; tamanho das equipes da Mega Crit e da Rocket Rat; vendas de Luck be a Landlord e Card Shark; vendas totais atuais de Balatro (o último marco oficial encontrado é 5 mi em 2025-01) e de StS1.
- **Receita de Marvel Snap 2024–2025**: fontes divergem por um fator de ~3; nenhuma é oficial.
- **Cores de raridade do Balatro e cores de moldura do StS**: descritas por observação de jogo, sem fonte citável nesta pesquisa.
- **Variação de tom da música do Balatro e da contagem de SFX**: observação de jogo, não confirmado.
- **Mercado brasileiro de jogos premium de truco**: sem dado de conversão ou de vendas premium; só contagens de download de apps gratuitos.
- Estimativas de terceiros (Gamalytic, Alinea, Sensor Tower, AppMagic, Udonis) foram marcadas como estimativa e podem divergir muito entre si.
