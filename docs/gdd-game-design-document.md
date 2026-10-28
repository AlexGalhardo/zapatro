# GDD (Game Design Document): Zapatro

> **Data/versão:** 2026-10-15 · jogo em `1.0.0-rc.3` · documento v2 (absorveu `game-design-principles.md` e `game-design.md`, apagados).
> **Status:** consolidação do design implementado + propostas da pesquisa [card-games-research.md](card-games-research.md). Nada aqui muda código sozinho.
> **Fonte da verdade para:** o *porquê* e o *o quê* do design (pilares, loops, sistemas, conteúdo, alvos). Regras exatas do Truco: [PLAN §5](../PLAN.md#5-especificação-de-regras). Números: `src/data/*.ts`, espelhados em [balancing.md](balancing.md). Visual: [visual.md](visual.md).
> **Precedência em conflito:** `AGENTS.md` > `.claude/rules/` > **GDD** > `visual.md` > `PLAN.md` (pedido do dev em 2026-10-15). **A confirmar:** `AGENTS.md`/`CLAUDE.md` ainda dizem "PLAN.md é a fonte da verdade"; até o dev alinhar, regra exata do Truco continua no PLAN §5 e número continua no `src/data`.
> **Marcadores:** ⚖ número de balanceamento que mora em `src/data` (este doc só espelha; o código vence) · **Fixo** decidido pelo dev · **Proposta** não validada (pesquisa ou agente) · **a confirmar** fato que este doc não conseguiu verificar.
> Citação entre docs: "GDD 5.4", "Visual 3.2", "PLAN §5.7", "Pesquisa §5 item 13".

## Mapa de seções antigas

Código e PLAN citam "design §N" (o antigo `game-design-principles.md`). Equivalência:

| design § | GDD | design § | GDD |
|---|---|---|---|
| 1 Visão · 1.1 Pilares | 1 · 1.4 | 4.3 Modificadores | 7.3 |
| 2 A mesa · 2.1 Regras do Truco | 3 | 4.4 Consumíveis | 7.4, 7.5 |
| 2.2 Vitória, derrota e Queda | 5.2 | 4.5 Melhorias do Boteco | 7.6 |
| 2.3 Pontuação | 4.1, 4.3 | 5 · 5.1 Parceiro | 8 · 8.1 |
| 2.4 Lances | 4.4 | 5.2 Sinais | 8.4 |
| 2.5 Dinheiro | 6 | 5.4 IA rival | 8.3 |
| 3 A run · 3.1 Estrutura · 3.2 Metas | 5 · 5.1 | 6 Meta-progressão | 10 |
| 3.3 Pular mesa e Promessas | 5.3, 7.7 | 7.1 Tela e arte · 7.2 Game feel | 13.4 · 13.5 |
| 3.4 Loja | 7.1 | 7.3 Áudio · 7.4 Textos | 14 · 1.1 |
| 3.5 Perfis de rival | 8.3 | 8 Plataformas · 9 Arquitetura | 13, 19 · 15 |
| 3.6 Chefes | 9 | 10 Fases | 18.4 |
| 4 A build · 4.1 Baralho compartilhado | 7 · 7.9 | 11 Fora de escopo · 12 Checklist | 18.3 · 16 |
| 4.2 Manhas | 7.2 | `game-design.md` (estado por versão) | 18.4 |

## Sumário

1. Visão · 2. Loops · 3. Regras do Truco Paulista · 4. Pontuação · 5. Mesa e estrutura da run · 6. Economia · 7. Loja e conteúdo · 8. Personagens · 9. Chefes · 10. Meta-progressão e Estacas · 11. Modos · 12. Telas e fluxo · 13. Interface, controles e acessibilidade · 14. Áudio · 15. Regras técnicas que o design impõe · 16. Princípios de diversão · 17. Balanceamento e métricas · 18. Escopo até a 1.0 · 19. Negócio e plataformas · 20. Glossário · 21. Lições da pesquisa aplicadas · 22. Pendências e contradições

---

## 1. Visão

### 1.1 Ficha

| Campo | Valor | Origem |
|---|---|---|
| Título | **Zapatro** ("A Truco Paulista Roguelite"); codinome técnico permanente `truco-roguelite` | Q-01, 2026-10-01 · D-21 |
| Gênero | Roguelite de cartas (estrutura de run tipo Balatro) sobre Truco Paulista 2×2 | D-05 |
| Câmera | Mesa vista de cima, 4 jogadores em cruz (você embaixo, parceiro em cima, rivais nas laterais) | PLAN §6 |
| Arte | Art Bible v3 (2026-10-27): personagens, fundos, versos e especiais pintados; cartas comuns e UI vetoriais por código; ícones de UI em pixel; palco 640×360, zoom inteiro (docs/visual.md §0) | revisão de direção |
| Engine | Phaser 4.2.x + TypeScript + Vite sobre Bun 1.4.2 | **Fixo** |
| Plataformas | Steam (Electron), Google Play (Capacitor, Android), web (itch.io, Poki, `truco.lekzera.xyz`); um único build Phaser 4 | D-23, D-24, decisão 2026-10-15 |
| Sessão | Mão ≈ segundos; mesa ≈ 4,1 mãos ⚖; run = até 24 mesas. Duração em minutos: **a confirmar** (medir no playtest) | balancing.md |
| Modelo | Premium nas lojas, sem anúncios nem microtransação; demo web grátis | D-24 |
| Idiomas | EN + PT-BR desde o dia 1; "Truco" e nomes de Manhas em português nas duas, com tooltip | D-29 |
| Jogadores | 1 humano + 3 IAs (parceiro e dupla rival), o que gera variedade quase ilimitada de situações; a run é solo. Partida Rápida também em **LAN com até 4 pessoas** (os vazios são bots) | PLAN §1.5, [multiplayer.md](multiplayer.md) |

### 1.2 Experiência essencial

> **"Eu não ganhei porque tinha as melhores cartas: ganhei porque montei uma forma absurda de jogar Truco."** Balatro na estrutura, Truco Paulista na alma.

### 1.3 Tema e tom

| Item | Definição |
|---|---|
| Lugar | Boteco do interior paulista: fórmica, azulejo, ventilador, TV de tubo, rádio AM, copo americano, engradado |
| Tom | Humor de mesa de bar, provocação amigável, nunca cassino nem violência |
| Progressão do lugar | Do boteco do bairro ao Rei do Truco (8 Campeonatos, GDD 5.1); o clima de boteco se mantém do começo ao fim (Pesquisa §6, Inscryption ato 3) |
| Voz | Gritos curtos em PT-BR ("TRUCO!", "SEIS!", "Corre!", "Bora!") nas duas línguas (D-30) |

### 1.4 Pilares

| # | Pilar | Teste de design |
|---|---|---|
| P1 | **Truco primeiro** | Isso deixa o Truco mais interessante? Se cabe em qualquer card game, é questionado |
| P2 | **Pedir truco é a alavanca** | A aposta (1/3/6/9/12) é o Mult base; blefar, aceitar, correr e aumentar são as decisões centrais |
| P3 | **Blefe com regra legível** | A IA decide por crença (o que viu + sinais flagrados); blefe é leitura de sistema, não sorteio |
| P4 | **Builds quebradas, mas explicáveis** | Peças fracas sozinhas formam motores absurdos juntas; toda ativação mostra `[Manha] motivo · ganho`; o total vem dos `steps` |
| P5 | **Dificuldade por regra, não por número** | Chefes e Estacas mudam regras; rival nunca é só "+50%" |

O PLAN §1.3 (e o design original) lista um 6º pilar, **informação incompleta como recurso** (sinais, Manhas de leitura, contagem de manilhas; o jogo nunca mostra probabilidade exata), tratado aqui como princípio de diversão (GDD 16).

### 1.5 Jogador-alvo

| Segmento | O que procura | O que o jogo precisa dar |
|---|---|---|
| Brasileiro que joga truco (Smart Truco 10 mi+ instalações, Pesquisa §4) | O truco de verdade, com zoeira | Regras reconhecíveis (vira, manilha, mão de 11, mão de ferro), vozes, sinais |
| Fã de roguelite/deckbuilder (Balatro, StS) | Builds, sinergias, "só mais uma run" | Manhas que quebram o jogo de forma explicável, Estacas |
| Público internacional que não conhece truco | Novidade cultural | Tutorial jogado (D-37), força da carta no hover, Regras e Almanaque |

### 1.6 O que o jogo não é

- Não é simulador de truco online nem PvP (Pesquisa §6: LoR e Gwent).
- Não é jogo de aposta: não há dinheiro real, pacote pago nem compra aleatória (D-24).
- Não é clone do Balatro: não copia arte, paleta, layout, fonte, espiral nem CRT (rule `content-and-assets`).
- Não tem mapa de rotas, relíquias, dívida, superstições, barra de confiança ou desafios diários até a 1.0 (GDD 18.3).

### 1.7 Inspirações (estudo, nunca cópia)

| Jogo | O que se estuda | O que **não** se pega |
|---|---|---|
| Balatro | Run 8×3, Fichas × Mult, loja, Estacas, contagem animada, demo por conteúdo | Arte, paleta, fonte, layout, espiral, CRT, iconografia de cassino |
| Slay the Spire | Intenções expostas, Ascensão, métricas de balanceamento | Mapa ramificado (fora do escopo) |
| Marvel Snap | Aposta crescente + recuo honroso ("Escapou!") | Monetização F2P |
| Hearthstone | Fisicalidade, plateia, taverna, raridade por cor | Pacotes pagos |
| Inscryption | Lugar e personagem do outro lado da mesa | Troca de tom no meio |
| Card Shark | Comunicação secreta com o parceiro | — |
| Monster Train / Cobalt Core | Combinação de eixos na largada | — |

---

## 2. Loops

| Escala | Duração | Loop | Recompensa |
|---|---|---|---|
| **Mão** | segundos | Sinal → (truco?) → 3 vazas → Lance → contagem Fichas × Mult | Pontos, dinheiro dos trinkets |
| **Mesa** | ≈ 4,1 mãos ⚖ | Mãos até Pontos ≥ meta (vitória) ou rivais fecharem 12 tentos 2 vezes (derrota) | Prêmio + rapidez + juros → loja |
| **Campeonato** | 3 mesas | Pequena → loja → Grande → loja → Chefe → loja; Pequena/Grande puláveis por Promessa | Nível do parceiro, Melhoria do Boteco |
| **Run** | 8 Campeonatos | Build cresce (Manhas, baralho, Lances); vencer o C8 vence a run; infinito opcional | Feitos, destraves |
| **Meta** | várias runs | Feitos → baralhos, parceiros, Manhas lendárias; Estaca seguinte por baralho | Variedade, nunca poder (D-11) |

```text
Menu → Nova run (baralho · parceiro · Estaca)
→ Campeonato N: Pequena → Loja → Grande → Loja → Chefe → Loja
→ Mesa: mãos até Pontos ≥ meta | rivais 2 quedas = fim da run
→ C8 vencido → vitória → infinito opcional → resumo → destraves → Menu
```

### 2.1 Curva de interesse

| Momento | Pico | Vale |
|---|---|---|
| Mão | TRUCO! aceito, contagem subindo, ZAP na mão | Mão sem manilha jogada "no automático" |
| Mesa | Virada contra rivais com 11; Queda (Lance de 50 × 5) | Mesa decidida na 1ª mão |
| Campeonato | Revelação do chefe e da regra torta | Loja sem nada que combine |
| Run | Build "fecha" (ex.: Manha ×Mult + Lance alto) | C3–C5 sem sinergia: **Proposta** medir onde as runs são abandonadas (GDD 17) |

---

## 3. Regras do Truco Paulista

Resumo; o texto normativo é o [PLAN §5](../PLAN.md#5-especificação-de-regras).

| Regra | Resumo | Ref. |
|---|---|---|
| Baralho | 40 cartas (sem 8, 9, 10) + **2 coringas** + 3 cartas especiais (Trevo, Olho, Raio); força base 4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3; mínimo 20 cartas, cópias permitidas | §5.1, D-06 |
| Vira e manilha | Manilha = valor acima da vira (com volta: vira 7 → Q; vira 3 → 4); naipes pica-fumo ♦ < espadilha ♠ < copas ♥ < paus ♣ | §5.2 |
| **ZAP (regra da casa)** | Carta de paus **duas** acima da vira; vence todas as manilhas (força 14); aviso "Você tem o ZAP!" | §5.2, **Fixo** 2026-10-15 |
| Turno | Anti-horário; "mão" à direita de quem dá; quem dá roda; quem vence a vaza abre a próxima (vaza cangada: abre quem abriu a cangada) | §5.3, D-53 |
| Vazas | 3 cartas por jogador, melhor de 3; cartas idênticas na mesma vaza cangam | §5.4 |
| Empates (cangar) | 1ª empata → decide a 2ª (ou 3ª); 2ª/3ª empata → vence quem ganhou a 1ª; 3 empates → ninguém pontua | §5.5, D-36 |
| Encoberta | A partir da 2ª vaza; nunca vence; não revela a carta; vale 0 Fichas | §5.6, D-34 |
| Aposta | 1 → truco 3 → 6 → 9 → 12; qualquer um dos 4 pede, aceita, corre ou aumenta; responde o assento à direita de quem pediu (no aumento, quem pediu antes); correr dá o valor anterior ao pedido; a dupla que teve o pedido aceito não pede de novo em seguida; "eu decido" 1×/mão | §5.7 |
| Sinais | 6 sinais fixos (piscada = ZAP …); 1 por mão; flagra base 20%; sinal falso permitido; balão só do parceiro, só categoria (★ / 3 / ✗) | §5.8, D-35 |
| Mão de 11 | Dupla com 11 vê as cartas do parceiro; joga (vale 3) ou corre (rival +1); pedir truco perde a mão (a UI nem oferece o botão) | §5.9, D-54 |
| Mão de ferro | 11×11: todos às cegas (ninguém vê a própria mão), sem truco nem sinais | §5.9 |
| Placar | Rivais a 12 = uma queda deles (2 quedas = derrota); sua dupla a 12 antes da meta = **Queda** (Lance, só seus tentos zeram) | §5.10, D-04, D-59 |
| **Cartas especiais** | Trevo, Olho e Raio, 1 de cada na run e na Partida Rápida (LAN e tutorial sem); valem um 3; abertas sorteiam 1 dos 3 efeitos delas (GDD 7.9) | §5.12.1, **Fixo** 2026-10-27 |
| **Coringa** | 2 por baralho (tutorial sem); nunca é a vira; sem efeito vale um 3; aberto sorteia 1 de 10 efeitos (GDD 7.8) | §5.12, **Fixo** 2026-10-15 |

---

## 4. Pontuação

### 4.1 Fórmula (D-02)

```text
Pontos = (Fichas das vazas + Fichas do Lance + Σ +Fichas) × Mult
Mult   = (Aposta + Mult do Lance + Σ +Mult) × Π ×Mult
```

- Só pontua a mão **vencida pela sua dupla**; perder ou correr dá 0 Pontos (dinheiro de Manha conta sempre).
- Fichas das vazas = soma das **4 cartas** de cada vaza que sua dupla levou (D-03): se o seu ZAP derrota o 3 do rival, o 3 também conta para você; encoberta vale 0.
- Aposta = valor final da mão (1, 3, 6, 9 ou 12). O design original não tinha o termo Σ +Fichas (Manhas de Fichas e modificadores entraram depois).

### 4.2 Ordem dos `steps` (a UI anima a mesma lista)

| # | Passo | Fonte |
|---|---|---|
| 1 | Fichas carta por carta (vazas da dupla) + modificadores de carta | `cards.ts`, `card-mods.ts` |
| 2 | Aposta (Mult base) | 1/3/6/9/12 |
| 3 | Lance (Fichas + Mult pelo nível) | `lances.ts` |
| 4 | Manhas da esquerda para a direita | `manhas.ts` |
| 5 | Efeitos do coringa `joker:double` (×2) / `joker:zeroed` (×0), depois das Manhas | `jokers.ts` |
| 6 | Total = derivado dos `steps` (nunca calculado à parte) | `scoreHand` |

A contagem anima carta por carta, depois o Mult, Manha por Manha; o painel de Lances (tecla L) mostra o nível de cada um.

### 4.3 Fichas por carta ⚖ (`src/data/cards.ts`)

Força base: 4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3 < manilhas < ZAP. As Fichas seguem a força (o ZAP, 18, entrou com a regra da casa em 2026-10-15; a manilha de paus segue 15).

| 4 | 5 | 6 | 7 | Q | J | K | A | 2 | 3 | Pica-fumo | Espadilha | Copas | Paus | ZAP | Coringa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 13 | 14 | 15 | 18 | 10 |

### 4.4 Lances ⚖ (`src/data/lances.ts`)

Classifica **como** a mão foi vencida. Prioridade: Queda > Mão de Ferro > Mão de 11 > Corrida > Virada > Suada > Vaza Limpa.

| Lance | Quando | Fichas | Mult | +Fichas/nível | +Mult/nível |
|---|---|---|---|---|---|
| Vaza Limpa (`limpa`) | 2 vazas sem perder nenhuma, inclusive cangou + venceu (era "2-0") | 10 | 1 | 10 | 1 |
| Virada | Perdeu a 1ª e venceu | 20 | 2 | 15 | 1 |
| Suada | Precisou das 3 vazas (e não é Virada) | 15 | 2 | 15 | 1 |
| Corrida | Rival correu de uma aposta | 15 | 2 | 5 | 1 |
| Mão de 11 (`onze`) | Venceu a mão de 11 | 30 | 3 | 20 | 2 |
| Mão de Ferro (`ferro`) | Venceu a mão de ferro | 40 | 4 | 25 | 2 |
| Queda | Sua dupla fechou 12 | 50 | 5 | 25 | 2 |

Nível sobe com cartas de Lance (consumível) e Promessas; Lance = "mão de pôquer" do Balatro.

---

## 5. Mesa e estrutura da run

Run **linear**, no formato do Balatro: 8 Campeonatos de 3 mesas. Pequena e Grande trazem uma dupla aleatória de perfis (puláveis); o Chefe, uma dupla nomeada com regra especial (não pulável). Vencer o C8 vence a run; depois, modo infinito opcional.

### 5.1 Campeonatos ⚖ (`src/data/championships.ts`)

| # | Campeonato (`id`) | Meta Pequena | Grande (×1,5) | Chefe (×2) | Rivais sorteados (`RIVAL_POOLS`) |
|---|---|---|---|---|---|
| 1 | Boteco do Bairro (`botecoBairro`) | 210 | 315 | 420 | covarde, novato |
| 2 | Bar de Estrada (`barDeEstrada`) | 270 | 405 | 540 | covarde, novato, calculista |
| 3 | Quermesse | 350 | 525 | 700 | novato, calculista, covarde |
| 4 | Clube | 430 | 645 | 860 | calculista, blefador, novato |
| 5 | Festa do Peão (`festaDoPeao`) | 560 | 840 | 1.120 | calculista, blefador, valentão |
| 6 | Regional | 700 | 1.050 | 1.400 | blefador, valentão, profissional |
| 7 | Estadual | 880 | 1.320 | 1.760 | valentão, profissional, calculista |
| 8 | Rei do Truco (`reiDoTruco`) | 1.120 | 1.680 | 2.240 | profissional, valentão, blefador |
| ∞ | Infinito | última meta × **1,4** por Campeonato | | | último pool |

As metas do design original (era 100 · 250 · 600 · 1.500 · 3.500 · 8.000 · 16.000 · 30.000) foram trocadas na calibragem do A5 (D-60): o relógio dos tentos domina, metas menores quase não mudam a taxa de vitória. O multiplicador por mesa (×1 / ×1,5 / ×2) é o original. Em 2026-10-25 o dev pediu o dobro da dificuldade: todas as metas (`CHAMPIONSHIP_GOALS`) foram dobradas, o que vale para as três mesas, todas as Estacas e o infinito (resultado medido em `docs/balancing.md`). Em 2026-10-28 essas metas (105 · 135 · 175 · 215 · 280 · 350 · 440 · 560) foram dobradas de novo, porque um humano passava a mesa fácil demais. O bot bom fica em cerca de 9–13% e a faixa da D-39 passou de 20–35% para **5–20%** de propósito. Estacas, Sheila e o infinito continuam multiplicando a base.

### 5.2 Vitória, derrota e quedas

| Evento | Regra | Ref. |
|---|---|---|
| Vitória da mesa | Pontos ≥ meta, conferido ao fim de cada mão (antes da derrota) | §5.10 |
| Queda rival | Rivais fecham 12: zera só os tentos deles | D-59 |
| Derrota da mesa | Rivais fecham 12 **2 vezes** (`RIVAL_QUEDAS_TO_WIN = 2`) ⚖ → **fim da run** (sem vidas) | D-04, D-59 |
| Queda (sua) | Sua dupla fecha 12 antes da meta: Lance Queda pontua, só seus tentos zeram, a mesa segue | D-04 |
| Vida extra | Promessa `vidaExtra`: na próxima mesa os rivais precisam de 3 quedas | `promises.ts` |

Consequência de design: os tentos rivais são o **relógio** da mesa. Correr é barato em pontos, mas dá tentos ao rival e gasta tempo. (O design original tinha derrota na 1ª vez que os rivais fechavam 12; a mesa "melhor de três quedas" veio com o D-59.)

### 5.3 Pular mesa

- Pequena e Grande podem ser puladas (botão "Pular (Promessa)"); o Chefe, nunca.
- Pular dá uma **Promessa** (GDD 7.7, o equivalente às Tags do Balatro), resgatada na loja seguinte **só se a mesa seguinte for vencida** (P-08, 2026-10-25): perder encerra a run antes da loja, e pular a mesa seguinte também perde a Promessa que esperava (pular Pequena e Grande rende só a Promessa da Grande). Custa ainda o prêmio, a loja e o avanço da build que a mesa daria.
- ⚠ Medido em 2026-10-25 (`bun scripts/sim.ts --skip`, 1000 runs, seeds 1 e 2; `docs/balancing.md`): pular Pequenas **+4,5 a +4,7 p.p.** (dentro do aceite de +5); pular Pequenas e Grandes **+12 a +15,5 p.p.**, ainda dominante, porque a vantagem é jogar menos mesas. Meta +15% após o pulo (testada, não aplicada) deixa +9 a +10 p.p. Próximo custo é decisão do dev (ex.: um pulo por Campeonato).

---

## 6. Economia ⚖ (`src/data/economy.ts`)

| Item | Valor | Nota |
|---|---|---|
| Dinheiro inicial | $4 | Baralho do Dinheiro: +$10 |
| Prêmio da mesa | Pequena $3 · Grande $4 · Chefe $5 | Estaca ≥ 4: Pequena sem prêmio |
| Rapidez | +$1 por tento que faltava ao rival fechar 12, teto $5 | recompensa mesa curta |
| Juros | +$1 a cada $5 guardados, teto $5 | Estaca ≥ 3: teto $3 |
| Reroll | $5, +$1 por troca na mesma loja (zera na loja seguinte) | Melhoria "Amigo do dono": −$2 |
| Venda de Manha | 50% do preço | |
| Consumível avulso | $3 | |
| Desconto ("Freguês da casa") | preços × 0,75 | |
| Estaca 8 | preços × 1,25 | |

Pago no fim de cada mesa vencida: prêmio + rapidez + juros. **Princípio** (Pesquisa §3.2): recompensa a cada mesa, tensão gastar × juros com alvo claro ($25 rende o teto). **Proposta (Pesquisa §5 item 7):** mostrar a quebra prêmio + rapidez + juros na tela de fim de mesa como "fechar a conta" — **a confirmar** se a tela atual já mostra os três termos separados.

---

## 7. Loja e conteúdo

### 7.1 Loja ⚖

| Elemento | Regra |
|---|---|
| Quando | Depois de cada mesa vencida |
| Ofertas | **2** vagas sorteadas: Manha 6 : Simpatia 2 : carta de Lance 2 |
| Pacotes | **2** por visita: Baralho ($4, 4 opções; 40% de chance de carta com modificador) · Simpatia ($4, 3) · Lance ($4, 3) · Manha ($6, 3); escolhe 1, "Dispensar" permitido (o design original previa 3 a 5 opções) |
| Melhoria do Boteco | **1 por Campeonato**, permanente na run (o "Voucher") |
| Espaços | **5 Manhas** + **2 consumíveis** (Melhorias e baralhos mudam) |
| Raridade (lojas e pacotes) | Comum 66 · Incomum 25 · Rara 7 · Lendária 2; lendárias só após o feito `doze` (mão valendo 12) |
| Preço da Manha | Comum $4–5 · Incomum $6 · Rara $8 · Lendária $10 |

**Proposta** (Pesquisa §3.5): garantir algo útil na primeira loja da run (Balatro garante um pacote) — a confirmar se já acontece.

### 7.1.1 Trinkets — 32 ⚖ (`src/data/trinkets.ts`, spec em [trinkets.md](trinkets.md))

Substituem as Manhas na loja (flag `TRINKETS`; o código das Manhas fica). Cada trinket tem um **Bônus** (verde) e um **Contra** (vermelho) próprios e vem em 4 raridades: Normal, Raro, Épico e Lendário. O Bônus escala ×1 · 1,6 · 2,3 · 3,2, o Contra ×1 · 1,3 · 1,6 · 2 (um ×Mult só cresce a parte acima de 1) e o preço é $4 · 7 · 10 · 14. A **coleção** fica no save do perfil (vale a maior raridade que o jogador já teve); a run equipa até **4** (0 é permitido; Zé tem 1 a menos) e só os equipados contam. A loja oferece 4 trinkets por parada: depois de um chefe um é sempre Lendário; senão 50% de um Raro e 25% de um Épico (sorteios independentes, por seed), o resto Normal; nunca repete na mesma loja nem oferece raridade igual ou menor que a já possuída. Bônus e Contra entram nos mesmos `steps` da contagem (`trinket:<id>`); efeitos de run (meta, preço, Prêmio de Rapidez, juros, tentos iniciais) vêm de `trinketTotals`. **O Professor** dobra o Contra dos equipados na mesa dele. A mesa só perde quando os rivais fecham 2 quedas; a Queda da nossa dupla zera os tentos das duas duplas.

### 7.2 Manhas (os "Coringas") — 60 ⚖

| Raridade | Quantidade |
|---|---|
| Comum | 24 |
| Incomum | 18 |
| Rara | 12 |
| Lendária | 6 |

O equivalente dos Jokers do Balatro.

- Disparam da esquerda para a direita, depois da Aposta e do Lance; o jogador reordena (◀ ▶) na loja.
- Fichas e Mult só contam na mão vencida; dinheiro conta sempre (Mão de Lixo paga mesmo perdendo). Toda ativação aparece como `[MÃO DE LIXO] Perdeu a 1ª vaza · +$2`.
- Condições típicas: pediu truco sem manilha (`malandro`), perdeu a 1ª vaza (`maoDeLixo`), perdeu a 1ª e venceu a 3ª (`ultimaCartada`), aposta ≥ N (`sangueFrio`), rival correu sem você ter manilha (`teatro`), tem o ZAP (`zapZap`), Lance X (`ferroQuente`, `onzeLetras`), alguma vaza cangou (`cangaceiro`). Efeitos "por vaza vencida" filtram por quem venceu (parceiro), posto ou naipe da carta, ou manilha.
- Algumas Manhas mudam a mesa em vez da conta (`rule`): Rei da Mesa, Gritador, Contador de Cartas, Bisbilhoteiro, Vira Viciada, Cara de Pau.
- 10 tags de sinergia: `BLEFE`, `MANILHA`, `APOSTA`, `PERDA`, `VAZA-1`, `VAZA-2`, `VAZA-3`, `PARCEIRO`, `OURO`, `SINAL`; ligam Manhas a parceiros (Jhony) e ao bot.
- Meta de conteúdo cumprida: 20 no MVP, 60 na 1.0 (fonte de ideias: [brainstorm.md](brainstorm.md) §9).
- Lista completa e números: [balancing.md](balancing.md) e `src/data/manhas.ts`. Conteúdo novo segue a skill `add-game-content`.

As 16 Manhas fundadoras (pacote do MVP, todas no código com estes efeitos):

| Manha | Raridade | Efeito |
|---|---|---|
| Malandro | Comum | +4 Mult se você pediu truco sem manilha |
| Mão de Lixo | Comum | Perder a 1ª vaza dá +$2 |
| Seu Zé | Comum | +15 Fichas por vaza vencida com 4, 5, 6 ou 7 |
| Mão Leve | Comum | +$1 por vaza vencida com carta de ♦ |
| Gritador | Comum | O 1º truco aceito da mesa sobe um degrau a mais (3 → 6) |
| Contador de Cartas | Comum | Mostra quantas manilhas já saíram na mão |
| Última Cartada | Incomum | ×2 Mult se perdeu a 1ª vaza e venceu a 3ª |
| Cara de Pau | Incomum | Depois de correr, o próximo truco reduz a crença do rival em 30% |
| Sangue Frio | Incomum | +8 Mult com aposta ≥ 6 |
| Dupla Dinâmica | Incomum | +3 Mult por vaza vencida pelo parceiro |
| Bisbilhoteiro | Incomum | Revela 1 carta aleatória de um rival por mão |
| Vira Viciada | Rara | 25% de chance de a vira tornar manilha uma carta da sua mão |
| Teatro | Rara | ×3 Mult se o rival correu e você não tinha manilha |
| Zap Zap | Rara | Com o ZAP na mão, ×1,5 Mult por vaza vencida |
| Ferro Quente | Lendária | Na mão de ferro, você vê as suas cartas e ganha ×4 Mult |
| Rei da Mesa | Lendária | Toda mão começa valendo 3 para a sua dupla |

### 7.3 Modificadores de carta — 7 ⚖ (1 por carta; só valem para a sua dupla em vaza que ela levou)

O modificador fica na carta mesmo quando ela cai na mão de um rival, mas lá funciona como carta normal.

| Id | Nome | Efeito |
|---|---|---|
| `gold` | Dourada | +$1 |
| `heavy` | Pesada | +20 Fichas |
| `hot` | Quente | +4 Mult se a mão foi trucada |
| `nervosa` | Nervosa | +10 Mult na 3ª vaza |
| `mentirosa` | Mentirosa | Rivais leem a carta 3 postos mais forte |
| `marcada` | Marcada | O parceiro sabe que você tem a carta |
| `vidro` | Vidro | ×2 Mult; 25% de quebrar e sair do baralho |

### 7.4 Simpatias — 8 (consumíveis que editam o baralho)

O equivalente do Tarot. Consumíveis ocupam **2 espaços** e hoje são usados fora da mesa (o design original previa uso também durante a mesa).

Reza de Vó (Dourada) · Benzedeira (remove carta) · Espelho (duplica) · Figa (troca naipe) · Água Benta (Pesada) · Vela Acesa (Quente) · Olho Grego (Mentirosa) · Ferradura (Vidro).

### 7.5 Cartas de Lance

Consumível que sobe 1 nível de um Lance (+Fichas e +Mult, GDD 4.4): o equivalente dos Planetas do Balatro.

### 7.6 Melhorias do Boteco — 6 ⚖

| Id | Nome | Preço | Efeito |
|---|---|---|---|
| `maisManha` | Banqueta extra | $10 | +1 espaço de Manha |
| `maisConsumivel` | Bolso maior | $8 | +1 espaço de consumível |
| `desconto` | Freguês da casa | $10 | preços × 0,75 |
| `rerollBarato` | Amigo do dono | $8 | reroll −$2 |
| `maisSinal` | Cara de conversa | $8 | +1 sinal por mão |
| `espiarMonte` | Espiar o monte | $6 | mostra uma carta fora do jogo (era "a 1ª carta do monte") |

### 7.7 Promessas — 8 (ganhas ao pular mesa; resgatadas na próxima loja)

Promessa rara (Manha rara grátis) · Promessa de dinheiro (+$10) · Promessa de pacote (pacote grátis) · Ficha extra · Mult extra · Carta nova · Simpatia grátis · Vida extra (3 quedas na próxima mesa).

### 7.8 Coringa (2 por baralho, PLAN §5.12) ⚖ (`src/data/jokers.ts`)

| Efeito | O que faz |
|---|---|
| `void` | Vaza anulada (empate) |
| `zap` | Vira o ZAP nesta vaza |
| `dud` | Furou: vale menos que um 4 |
| `worth3` | A mão passa a valer 3 (se valia menos) |
| `zeroed` | Fichas × Mult da mão = 0 |
| `upsideDown` | A mais fraca vence a vaza (encoberta nunca vence) |
| `newVira` | Nova vira do monte: mudam manilhas e ZAP |
| `copycat` | Copia a carta mais forte já jogada na vaza |
| `double` | ×2 Mult da mão |
| `showdown` | Todas as mãos à mostra, inclusive para a IA |

Sorteio com `Rng` de seed, chances iguais; efeito impossível não entra no sorteio. Na mesa: roleta de nomes no banner + popup. ⚠ Tensão com o pilar P3/16.2 (informação → decisão): o coringa é sorte pura; **Proposta**: mostrar a lista dos 10 efeitos no tooltip da carta antes de jogá-la.

### 7.9 Cartas especiais: Trevo, Olho e Raio (PLAN §5.12.1) ⚖ (`src/data/specials.ts`)

Três cartas únicas por baralho, no espírito dos Jokers do Balatro mas na mesa, não na contagem: cada uma, aberta, sorteia 1 de 3 efeitos.

| Carta | Tema | Efeitos |
|---|---|---|
| Trevo | Sorte e aposta | Aposta sobe (um degrau de graça) · Escudo (se a dupla correr, perde só 1 tento) · Bônus (+2 tentos se a dupla vencer a mão, até 12) |
| Olho | Informação e mão | Espiar (uma carta de cada rival à mostra para a dupla) · Troca (cartas que sobram com as do parceiro) · Nova mão (as cartas que sobram são trocadas por novas) |
| Raio | Caos na mesa | Gelo (ninguém pede truco) · Vaza garantida (a vaza é da dupla de quem jogou) · De ponta-cabeça (a mais fraca vence cada vaza do resto da mão) |

Proposta de revisão no playtest: a IA hoje joga as cartas como um 3 e não se aproveita de "espiar".

### 7.9 Baralho compartilhado

Existe **um único baralho**, editado durante a run, do qual **os 4 jogadores compram**.

- Remover, duplicar e modificar cartas muda as probabilidades **para todos**: encher o monte de cartas fortes é uma aposta, o rival também pode tirá-las.
- Efeitos de carta só ativam quando alguém da sua dupla joga a carta.
- **Mínimo de 20 cartas**, para a distribuição de 4 × 3 cartas mais a vira nunca travar; cópias permitidas.

---

## 8. Personagens

### 8.1 Companheiros — 10 ⚖ (`src/data/companions.ts`)

Um só elenco para parceiros e rivais (revisão de direção de 2026-10-24). A cada run o jogo sorteia **3 candidatos** entre os destravados (`src/logic/run/draw.ts`: determinístico pela seed, estilos diferentes quando dá, o parceiro da run anterior fica de fora com 4+ destravados) e você escolhe 1. Os outros 9 podem sentar como rivais; **o escolhido nunca é rival** na mesma run.

Cada companheiro tem **uma Vantagem e um Defeito roguelite exclusivos**, que valem **só quando ele é o parceiro do jogador**; como rival ele joga apenas pelo estilo (perfil de IA). Os efeitos entram na pontuação como `ScoreStep`s em `scoreHand` (o total continua derivado dos steps) ou na economia da run (`src/logic/run/run.ts`); os números estão em `PARTNER_TRAITS` (`src/data/companions.ts`) e em `docs/balancing.md`. Nenhum traço mexe em aceitar ou correr de truco nem em flagrar sinais dos rivais: o parceiro IA **nunca responde** ao truco dos rivais (quem aceita, corre ou aumenta é só o jogador; ele ainda pode pedir truco na vez dele, conforme o estilo), e a chance base de os rivais flagrarem sinais não tem bônus nem defeito.

| Companheiro | Estilo | Vantagem | Defeito | Destrave |
|---|---|---|---|---|
| Bruto | agressivo | +3 Mult por vaza que ele vence | as cartas dele valem metade das Fichas (arredonda para baixo) | inicial |
| Cida | conservadora | +$1 por mão vencida | itens da loja custam +$1 | inicial |
| Jhony | blefador | juros: +$1 a cada $5 guardados no fim de cada mesa (máx +$5) | a recompensa de Rapidez cai pela metade (arredonda para baixo) | feito `mentiroso` |
| Nino | destemido | sobe 1 nível a cada mesa vencida: +1 Mult base por nível | começa a run com −1 Mult base (nível 0 = −1; o Mult base nunca fica abaixo de 1) | feito `campeonato4` |
| Zé | conservador | o item mais barato da primeira loja de cada Campeonato sai de graça | 1 espaço de Manha a menos | inicial |
| Mia | agressiva | manilhas valem +15 Fichas | cartas comuns valem −2 Fichas (mín 0) | inicial |
| Chico | conservador | +20 Fichas por vaza vencida com carta de paus | copas e ouros valem −5 Fichas (mín 0) | inicial |
| Beti | blefadora | a primeira Manha comprada em cada loja custa $1 a menos | Manhas custam +$1 | inicial |
| Ayla | conservadora | ×1,5 Mult quando a dupla vence as duas primeiras vazas | mão perdida custa $1 (mín $0) | inicial |
| Sheila | conservadora | 1 chance em 4 de dobrar o dinheiro ganho ao vencer a mesa | metas de pontos da mesa +10% | inicial |

A tela de escolha mostra, em três cards por parceiro, o **Estilo**, a **Vantagem** e o **Defeito** (`companion.<id>.perk|flaw` em i18n). Chefes ficam fora do elenco.

### 8.2 Rivais (personagens das mesas comuns)

Os 9 companheiros que você não escolheu. O perfil de IA do assento é o do pool do Campeonato (erro; GDD 5.1) com a coragem, agressividade e blefe do estilo do companheiro (`rivalBrain`, `src/game/run-table.ts`) mais os traços. Na seleção de mesas, passar o mouse no retrato do rival mostra vantagem e defeito.

### 8.3 Perfis de IA ⚖ (`src/data/ai-profiles.ts`)

| Perfil | Comportamento | Coragem | Agressividade | Blefe | Erro | Flagra | Sinaliza |
|---|---|---|---|---|---|---|---|
| Covarde (`coward`) | Corre com frequência | 0,10 | 0,10 | 0,4 | 0,05 | 0,15 | 0,6 |
| Valentão (`bully`) | Pede e aceita truco com facilidade | 0,80 | 0,80 | 0,3 | 0,06 | 0,15 | 0,6 |
| Calculista (`calculator`) | Joga pela força real, quase não blefa | 0,45 | 0,45 | 0,8 | 0,02 | 0,25 | 0,8 |
| Blefador (`bluffer`) | Pede truco sem força | 0,55 | 0,60 | 0,4 | 0,06 | 0,20 | 0,5 |
| Novato (`rookie`) | Erra decisões com frequência | 0,50 | 0,50 | 0,1 | 0,25 | 0,10 | 0,4 |
| Profissional (`pro`) | Consistente, quase não erra | 0,50 | 0,55 | 0,9 | 0,01 | 0,30 | 0,9 |

IA de **utilidade**, determinística por seed, só sobre `observe(state, seat)`: nunca lê a mão alheia nem a encoberta dos outros; vê a mão do parceiro na mão de 11 e não vê a própria na mão de ferro. Cada rival estima a força da sua dupla (crença) pelas cartas jogadas e sinais flagrados, e compara com a força da própria dupla. Um **bot** joga runs inteiras para o balanceamento.

Limiares (`src/logic/ai/decide.ts`, PA2; `p` = chance de vencer a mão):

| Decisão | Regra |
|---|---|
| Chance `p` | Monte Carlo: 40 distribuições das cartas desconhecidas, respeitando em 75% das vezes os sinais conhecidos, jogadas até o fim de forma gulosa |
| Responder truco | leitura = `p` − 0,12, pois quem pede costuma ter força; aumenta se leitura > 0,80 − agressividade × 0,15; aceita se > 0,45 − coragem × 0,3; se correr entrega a partida, aceita com > 0,15 |
| Pedir truco | `p` > 0,72 − agressividade × 0,2, ou blefe (`p` < 0,35 e sorteio do blefe do perfil) |
| Carta | Abrindo a vaza, a do meio; se a dupla já vence a vaza, a menor; senão a menor que vence, ou a menor |
| Mão de 11 | Joga se `p` (vendo a mão do parceiro) > 0,42 − coragem × 0,1 |
| Sinal | Honesto (ZAP, senão melhor manilha, senão 3, senão "nada"), com a chance do perfil |

### 8.4 Sinais

| Sistema | Regra |
|---|---|
| Sinais | Tabela fixa ensinada no tutorial (PLAN §5.8): piscada = ZAP · sobrancelha = copas (ou paus) · boca torta = espadilha · língua = pica-fumo · morder o lábio = um 3 · olhar para o alto = nada. 1 por mão antes da 1ª carta (baralho do Blefe e "Cara de conversa" dão +1); flagra base 20%, ajustada pelo perfil; sinal flagrado vira informação real na crença da IA rival |
| Sinal falso | Permitido de propósito, para ser flagrado: blefe em outra camada. O parceiro também acredita (exceto Cida) |
| Sinal do parceiro | Balão com o gesto exato que ele fez (ícone do sinal com o selo da carta que o gesto afirma); pode ser mentira (sinal falso), mas é sempre o gesto feito; a linha de status diz a categoria em palavras |

---

## 9. Chefes ⚖ (`src/data/bosses.ts`)

Mesa 3 de cada Campeonato. C1–C7 sorteiam do pool de 9; o Rei do Truco é fixo no C8. Card pintado 3:4 (`charcard.<id>`) quando há pintura (Sortuda, Rei do Truco); os outros 8 seguem no retrato 128×128 em pixel art (`public/assets/gfx/portrait/<id>.png`, GD-015) até ganharem pintura.

| Chefe | Regra | Eixo do Truco mexido |
|---|---|---|
| O Valentão | Os rivais pedem truco em toda mão | Aposta |
| A Cartomante | A vira fica oculta até o fim da 1ª vaza | Informação |
| O Juiz | A Manha mais à esquerda fica desativada | Build |
| O Agiota | Cada mão perdida custa $1 | Economia |
| O Delegado | O Lance Corrida vale **metade** (`DELEGADO_CORRIDA_X = 0,5`; o design pedia 0) | Lance |
| O Professor | Os contras dos seus trinkets equipados contam em dobro | Trinkets |
| Os Irmãos | Sinais deles nunca flagrados; os seus com o dobro de chance | Sinais |
| O Mudo | Sem sinais com o parceiro | Sinais |
| A Sortuda | 35% de chance de a vira dar manilha a um rival | Sorte |
| **O Rei do Truco** | Toda mão começa valendo 3 | Aposta |

**Proposta** (Pesquisa §5 item 2, StS): uma "intenção" leve do chefe por mão (ex.: balão "vou trucar" do Valentão) para transformar a regra em decisão.

---

## 10. Meta-progressão e Estacas

### 10.1 Princípio (D-11, **Fixo**)

Meta só desbloqueia **variedade e dificuldade**, nunca poder: a run 1 tem a força da run 100 (Pesquisa §3.3 confirma o padrão).

### 10.2 Baralhos iniciais — 5 (`src/data/decks.ts`)

| Baralho | Regra | Destrave |
|---|---|---|
| Normal | sem alteração | inicial |
| do Interior | 4, 5 e 6 dão ×2 Fichas | feito `lixo` (vencer com mão fraca) |
| do Blefe | +1 sinal por mão | feito `blefe` |
| do Dinheiro | +$10; −1 espaço de trinket | feito `rico` (juntar $30 numa run) |
| Viciado | cópia extra de toda carta de ♣ (era "começa com 2 zaps") | feito `ferro` (vencer mão de ferro) |

### 10.3 Feitos — 37 (`src/data/feats.ts`)

Checados no fim da mão, da mesa e da run; espelham as conquistas Steam (D-28). Destravam: 4 baralhos, 2 parceiros (Jhony, Nino) e as Manhas lendárias (`doze`). O design original listava outros destraves (mão com 3 cartas fracas → Manha de `PERDA`; vencer o C8 com o Nino → parceiro); o código ficou com a tabela de GDD 10.2 e 8.1. Cada Estaca destrava a seguinte ao ser vencida com aquele baralho.

### 10.4 Estacas — 8 por baralho ⚖ (`src/data/stakes.ts`, cumulativas)

| Estaca | Metas | Rivais começam com | Outras regras |
|---|---|---|---|
| 1 | ×1 | 0 | jogo base |
| 2 | ×1,15 | 0 | — |
| 3 | ×1,25 | 3 tentos | juros com teto $3 |
| 4 | ×1,3 | 3 | rivais um Campeonato mais duros; Pequena sem prêmio |
| 5 | ×1,45 | 4 | — |
| 6 | ×1,5 | 6 | — |
| 7 | ×1,7 | 6 | rivais dois Campeonatos mais duros |
| 8 | ×1,8 | 7 | preços +25% |

⚠ Contra o pilar P5 e a Pesquisa §3.4: as Estacas atuais são quase só **números** (meta, vantagem); o design original pedia uma **regra** por degrau (ex.: rivais com Manhas, vira sempre oculta, juros menores). **Proposta** (Pesquisa §5 item 10): manter a curva medida (−5 a −8 p.p. por degrau, D-39) mas trocar alguns degraus por regras do truco legíveis, por exemplo "rivais pedem truco mais cedo", "mão de 11 obrigatória", "1 Manha Perecível na loja", "sem sinal na 1ª mão da mesa". Toda troca passa por `bun scripts/stakes.ts`.

### 10.5 Almanaque e dados

Coleção do que já foi visto (Manhas, parceiros, chefes, baralhos) + Estatísticas (totais e últimas runs).

---

## 11. Modos

| Modo | O que é | Estado |
|---|---|---|
| Run | 8 Campeonatos × 3 mesas, baralho · parceiro · Estaca | implementado |
| Infinito | Depois do C8, metas × 1,4 por Campeonato; números grandes abreviados (`1,2M`, `1,5e15`, D-56) | implementado |
| Partida rápida | Truco puro até 12 tentos contra a IA (sala Boteco), sem meta de pontos; `?goal=N` só para testes | implementado |
| Tutorial | Mesa roteirizada, seed fixa, sem coringa, pulável (D-37); `src/data/tutorial.ts` | implementado |
| Demo | `VITE_DEMO=1`: Campeonato 1 até o primeiro chefe, depois tela de wishlist (D-33 revista 2026-10-15) | implementado |
| Poki | `VITE_POKI=1`: SDK Poki, sem vozes nem ambiências tardias (< 8 MB) | implementado |
| Seed/diário | `?seed` só como debug; desafios diários fora do escopo | **Proposta** pós-1.0 (Pesquisa §5 item 29) |

---

## 12. Telas e fluxo

```text
Boot → Preload → Menu
Menu: Continuar run · Nova run · Partida rápida · Tutorial · Regras · Almanaque e dados · Configurações · Sair (só Electron)
Nova run (baralho · parceiro · Estaca) → Apresentação da mesa (rivais/chefe; Pular)
→ Mesa (+ Pausa) → fim de mesa (prêmio) → Loja → Pacote → próxima mesa … → Fim da run (resumo: parceiro, dados e Manhas; feitos) → Menu
```

| Tela | Fonte visual | Estado |
|---|---|---|
| Menu | concept `concept.menu.*` | concept aplicado |
| Configurações | concept | concept aplicado |
| Mesa (Boteco, Bar de Estrada, oficina do Professor) | concept | concept aplicado; demais salas: `bg.<campeonato>` + fórmica |
| Loja, Baralho | concept | concept aplicado |
| Controles, Pausa, Próximas mesas, Regras | mockups pedidos (`bugs/15-10-2026/fazer-mockup-*.png`; Visual 12) | concept aplicado (visual híbrido, Art Bible v2; pausa e fim de run refeitos por código) |

Configurações: volumes, mudo, tela cheia, resolução, zoom, idioma, reduzir piscadas, tremor de tela, velocidade das animações, baralho de 4 cores, controles (teclas da mesa, vibração, zona morta, modo toque), exportar/importar save.

Regra de fluxo: nada de tela de confirmação desnecessária; Esc/voltar do Android = Pausa/voltar. Rivais e chefe aparecem antes de jogar.

---

## 13. Interface, controles e acessibilidade

### 13.1 Controles (D-27)

| Entrada | Mesa |
|---|---|
| Mouse/toque | Clique na carta joga; botões Truco/Aceitar/Correr; arrastar não é necessário |
| Teclado | 1/2/3 cartas · T truco · A aceitar · C correr · S sinal · E encoberta · L Lances · Esc pausa (via `onKey`; remapeável em `keybinds.ts`) |
| Gamepad | Setas/analógico movem o foco por botões e mão; ✕ joga/escolhe (meta: Steam Deck Verified) |

### 13.2 HUD da mesa (resumo; detalhe em Visual 10)

Sidebar esquerda congelada, com os cartões: trinkets equipados, Meta e Aposta (uma linha cada) e o painel de Tentos NÓS | ELES (3 × 4 contas; a contagem de Fichas × Mult aparece no popup do feltro); abaixo, botões (Regras, Manhas em lista, Configurações). Nada mais entra nela. O feltro ocupa o resto da tela: vira no canto superior esquerdo, cruz de cartas no centro (você embaixo, parceiro em cima, rivais à esquerda e à direita), botões de ação empilhados no canto inferior direito, com selo de tecla. No canto superior direito do feltro fica o bloco HUD: os 4 slots de trinkets equipados (detalhe no hover). Balão de fala só do parceiro e do "TRUCO!" de quem pediu. Detalhe em [visual.md](visual.md) §5.

### 13.3 Acessibilidade

| Recurso | Estado |
|---|---|
| Baralho de 4 cores (♦ laranja, ♣ verde) | implementado (D-57) |
| Velocidade das animações 1×/2×/4× | implementado (D-57) |
| Reduzir piscadas, intensidade do tremor | implementado |
| Modo toque (texto maior, alvos ≥ 44 px, dicas `.touch`) | implementado |
| Remapear teclas, zona morta do gamepad, vibração | implementado |
| Informação nunca só por cor (raridade = borda + nome; Fichas/Mult = cor + rótulo) | regra (Visual 3.5) |
| Pular a contagem de pontos | **a confirmar** (Pesquisa §5 item 16 pede) |
| Força da carta no hover + Regras a um toque | parcial (D-37); **Proposta**: tabela de força/manilha a uma tecla na mesa (Pesquisa §5 item 22) |

### 13.4 Tela e arte

- Paisagem 16:9 em todas as plataformas (no celular o jogo gira para paisagem); 640×360 lógico, zoom inteiro.
- Layout: fundo neutro cinza-grafite, sidebar esquerda de cartões (Campeonato · Mesa, Meta, Fichas × Mult, Aposta, Tentos deles, $; na mesa de chefe, também a regra do chefe), mesa de feltro com 4 jogadores em cruz paralela e, no canto superior direito do feltro, o cartão de trinkets equipados.
- Cartas 48×64 px; manilha com placa dourada e ZAP com brilho em todas as cores. Personagens em card pintado 3:4 e busto 256×256 (Art Bible v3; os chefes sem pintura em pixel 128×128), uma expressão só; o sinal do parceiro vira selo e balão, e um sinal flagrado vira selo no retrato do rival que o flagrou. Chefes iguais aos companheiros. Detalhe em [visual.md](visual.md).

### 13.5 Game feel

- **TRUCO!** é o momento mais satisfatório: batida seca na mesa, zoom rápido, balão com fala do perfil ("Bora!", "Calma aí…") e o valor da aposta subindo com tremor.
- Contagem de pontos animada carta por carta e Manha por Manha.
- Mão de 11 e mão de ferro: a tela escurece e o som do boteco fica abafado.
- Ritmo: pensar, escolher, animação, reação; partida rápida, sem confirmação desnecessária.
- Botões têm estado pressionado (afundam ao clicar ou apertar), e o botão em foco mostra o que confirma (Enter / ✕), igual no teclado, no controle e no toque.

---

## 14. Áudio

Detalhe em [audio.md](audio.md); tudo ElevenLabs, normalizado com ffmpeg. Identidade: fundo de boteco (rádio AM, ventilador, copo americano), trilha de viola, SFX de carta e mesa.

| Camada | Conteúdo | Alvo |
|---|---|---|
| Música | `music.menu` (viola calma), `music.table` (rádio AM com viola), `music.boss`, `music.king`, vinhetas `win`/`lose` | −18 LUFS |
| Ambiência | `amb.<campeonato>` (8): conversa, ventilador, copo, TV | −30 LUFS |
| SFX | baralho, vaza, truco, aceitar/correr, sinal/flagra, contagem (`score.chip` tique crescente, `mult`, `xmult` garrafas), dinheiro, loja | −16 (UI −20) |
| Vozes | `vo.<char>.<linha>`: truco/seis/nove/doze/bora/corre/caiu/oloco, 14 personagens | −16 LUFS |
| Mão de 11/ferro | low-pass + −8 dB na música | — |

Na web, as ambiências e vozes tardias são baixadas em segundo plano, depois do menu: a mesa abre sem esperar por elas. O build Poki não as inclui (`VITE_POKI=1`).

Gatilhos já ligados (`TableScene`, evento `handOver`): `caiu` toca quando a dupla dos rivais leva a mão (rival do assento 1); `oloco` quando a dupla do jogador leva a mão com 6 tentos ou mais (rival do assento 3). Pendente: `vo.juninho.oloco.2`; orçamento web 8,5 MB > 8 MB do Poki. **Proposta** (Pesquisa §5 itens 18–20): stinger próprio para ZAP e para "Doze!", e ambiência que sobe na mão decisiva.

---

## 15. Regras técnicas que o design impõe

| Regra | Por quê | Ref. |
|---|---|---|
| Lógica pura, sem Phaser, determinística por seed | Bot, testes, replays, save por mão | D-50 |
| Toda decisão é `Action` validada por `legalActions` | Um caminho para UI, IA, bot e testes | D-52 |
| IA só vê `observe(state, seat)` | Blefe legível (P3), sem trapaça da IA | PLAN §4.2 |
| `scoreHand` devolve `steps`; total derivado | A animação é a conta (P4) | PLAN §4.3 |
| A render consome eventos de domínio (`TableEvent`: vaza vencida, truco pedido, Manha ativou) e anima em sequência | Cena burra, lógica testável com `bun:test` | D-51 |
| Conteúdo data-driven (Manhas, Lances, modificadores, Simpatias, parceiros, perfis, chefes, metas) | Conteúdo novo = dado + teste | skill `add-game-content` |
| Números só em `src/data/`, textos só em `src/i18n/` (EN + PT-BR), cores em `palette.ts` | Balancear = trocar número; localização desde o início | D-55 |
| Save no início de cada mão (`truco-roguelite.save`), todas as plataformas; recarregar volta à mesma mão | Fechar o app no celular sem perder a run; sessões curtas (Poki) | D-32 |
| `appId` e origem nunca mudam | Save do `localStorage` é por origem | D-21 |
| Sem telemetria | Política de privacidade simples | D-31 |
| `Math.random()` proibido na lógica | Determinismo | rule `code-architecture` |

---

## 16. Princípios de diversão (heurísticas)

| # | Heurística | Aplicação no Zapatro |
|---|---|---|
| 16.1 | Uma decisão principal, clara, repetida muitas vezes | Pedir/aceitar/correr truco em toda mão |
| 16.2 | Sorte vira decisão quando a informação aparece | Manilha e ZAP na plaquinha da vira; sinais; força no hover |
| 16.3 | Aposta crescente + recuo honroso | Correr dá o valor anterior; **Proposta**: mostrar "Correu: poupou N" (GDD 21 item 1) |
| 16.4 | Feedback proporcional ao tamanho do número | Tremor e escala da contagem; cada aposta mais forte que a anterior |
| 16.5 | Toda ativação explica o motivo | `[Manha] motivo · ganho` |
| 16.6 | Peça fraca sozinha, forte em conjunto | Tags de Manha; Manha ×Mult à direita |
| 16.7 | Regra nova se lembra; número não | Chefes por regra; Estacas (GDD 10.4) |
| 16.8 | Pular rende algo, mas não domina | Promessa condicional (P-08, 2026-10-25): pular só Pequenas +4,5 p.p.; pular Pequenas e Grandes ainda +12 a +15,5 p.p. (GDD 5.3) |
| 16.9 | Sistemas aparecem aos poucos | **Proposta**: Simpatias, Lances e modificadores liberados nas primeiras runs |
| 16.10 | O lugar é personagem | Boteco, vozes, rivais com expressão; **Proposta**: plateia reagindo a ZAP/Doze |

**Checklist de design** (toda feature nova):

- [ ] O Truco continua reconhecível (vira, manilhas, vazas, aposta, mão de 11, mão de ferro).
- [ ] Pedir truco é a principal alavanca de pontos.
- [ ] O parceiro influencia decisões.
- [ ] O blefe funciona por regra legível (crença).
- [ ] Toda ativação de Manha mostra o motivo.
- [ ] Chefes mudam regras, não números.
- [ ] A meta-progressão só adiciona variedade.
- [ ] Uma mão é rápida e o botão TRUCO! é satisfatório.

---

## 17. Balanceamento e métricas

### 17.1 Alvos (D-39, **Fixo**)

| Métrica | Alvo | Último resultado |
|---|---|---|
| Bot bom, Estaca 1 | 5–20% das runs (era 20–35% até 2026-10-28, e 40–60% antes; baixada de propósito quando as metas dobraram de novo) | 10,0 · 13,3 · 9,3% (2026-10-28, metas ×2, 300 runs) |
| Bot aleatório | < 5% | 0,6 · 0,0 · 0,0% |
| Degrau por Estaca | −5 a −8 p.p. | 4,3 · 5,7 · 1,6 · 2,4 · 4,6 · 1,7 · 3,0 (2026-10-25, metas ×2, 300 runs; fora da faixa) |
| Mãos por mesa | ≥ 4 (piso informal) | ≈ 6,0 (era 4,5 antes das metas ×2) |
| IA `pro` × aleatória | ≥ 85% das partidas | 95,1% |
| Decisão da IA | p99 < 5 ms | ok |

### 17.2 Ferramentas

`bun scripts/sim.ts`, `bun run balance` (portão), `bun scripts/stakes.ts`, `bun scripts/soak.ts`. Toda mudança de número ⚖ roda o portão e registra em [balancing.md](balancing.md).

### 17.3 Métricas propostas

**Proposta** (Pesquisa §5 item 12): taxa de escolha e de vitória por Manha, por parceiro e por baralho no `sim.ts` (sem telemetria de jogador, D-31); onde as runs morrem (Campeonato/mesa); quanto dinheiro sobra no fim (hoje ~$54: sinal de economia folgada).

---

## 18. Escopo até a 1.0

### 18.1 Nunca se corta

Regras do Truco do PLAN §5 · Fichas × Mult com `steps` · parceiro + sinais · 8 Campeonatos com chefes · EN + PT-BR · save por mão · Steam + Android + demo web.

### 18.2 Ordem de corte (se faltar tempo)

| Ordem | Corta primeiro | Custo do corte |
|---|---|---|
| 1 | Concept art das salas 4–8 (ficam `bg.<id>` + fórmica) | Baixo |
| 2 | Vozes que faltam (`vo.juninho.oloco.2`) | Baixo |
| 3 | Mockups novos de Regras/Controles/Pausa (ficam as telas atuais) | Médio |
| 4 | Ampliação de conteúdo além de 60 Manhas | Baixo (qualidade > quantidade, Pesquisa §5 item 30) |
| 5 | Steam Deck Verified | Médio |

### 18.3 Fora do escopo

iOS · espanhol e outros idiomas · multiplayer pela internet e co-op na run (a LAN da Partida Rápida existe: multiplayer.md) · backend/contas/telemetria · newsletter · mapa de rotas e eventos de mapa · relíquias (cobertas pelas Melhorias) · dívida, investimento e agiota como sistema · superstições · confiança do parceiro, tilt, temperamento e pressão global · medidores psicológicos (a Fama saiu do jogo em 2026-10-27; Respeito e Pressão nunca entraram) · desafios diários, contratos e modos alternativos · cartas com memória e carta de estimação (PLAN §1.5). Cortados no brainstorm para manter o jogo legível e viável para um dev solo; ficam como ideias futuras.

### 18.4 Fases e histórico

Fases do design original (todas entregues):

| Fase | Entrega | Critério de sucesso |
|---|---|---|
| 1. Diversão | Truco completo a 4, aposta, IA com 3 perfis, sinais | Uma mão diverte sem camada roguelite |
| 2. Build | Fórmula de pontos, 20 Manhas, 3 modificadores, 4 Simpatias, Lances, 2 parceiros, Fama | Dá vontade de outra run |
| 3. Run | 8 Campeonatos, loja, pacotes, 5 chefes, pular mesa, dinheiro, bot | A run tem ritmo e o bot atinge as metas |
| 4. Conteúdo | 60 Manhas, 10 chefes, 4 parceiros, 5 baralhos, 8 Estacas | Builds variadas entre runs |
| 5. Polimento e publicação | Game feel, áudio, lojas | Pronto para lançamento |

Estado implementado por versão (antigo `game-design.md`; detalhe no [CHANGELOG](../CHANGELOG.md)):

| Versão | Entrou |
|---|---|
| `0.0.1` (FASE 0) | Menu (Nova run desabilitada, Configurações, Sair só no desktop) e Configurações completas; sem regras ainda |
| `0.0.2` (PA1) | Motor de regras: baralho com id por carta, vira e manilha, turnos, empates, encoberta, aposta, mão de 11 e de ferro, sinais |
| `0.0.3` (PA2) | IA por `observe`, Monte Carlo, limiares (GDD 8.3), sinais honestos, Fama |
| `0.0.4` (PA3) | Mesa jogável a 12 em placeholder: retratos, balões, TRUCO!/Aceitar/Correr, painel da mão de 11, pausa; mouse, toque e teclas |
| A2 | Meta de Pontos, Fichas × Mult, Lances, Queda, contagem animada, números abreviados |
| A3 | Manhas (entravam por `?manhas=`), modificadores Dourada/Pesada/Quente |
| `0.1.0-alpha.1` | Run completa: Tonhão e Dona Cida, Campeonatos, Promessas, quedas, prêmio/rapidez/juros, loja, Rei do Truco, infinito, save por mão |
| `0.1.0-beta.1` | 60 Manhas, 7 modificadores, 8 Simpatias, 6 Melhorias, 8 Promessas, 10 chefes, 4 parceiros, 5 baralhos, 8 Estacas, feitos, Almanaque, Estatísticas, gamepad, demo e build Poki |

---

## 19. Negócio e plataformas

| Canal | Produto | Estado |
|---|---|---|
| Steam (Electron) | Jogo completo, pago; conquistas + Steam Cloud | Q-02: US$ 9,99 sugerido (**a confirmar**) |
| Google Play (Capacitor) | Jogo completo, pago, sem IAP | preço menor que Steam (a confirmar) |
| itch.io | Demo web grátis | D-24 |
| Poki | Demo web grátis com SDK; download < 8 MB | D-24; ⚠ exclusividade web (Pesquisa §4) |
| `truco.lekzera.xyz` | `/play/` **jogo completo** e `/demo/` (C1) | decisão 2026-10-15 |
| Trailer | Remotion, 1 min, EN + PT-BR | RC3 |

⚠ **Conflitos abertos:** (a) jogo completo grátis em `/play/` contra o modelo premium (D-24) — **a confirmar** se `/play/` é público; (b) Poki exige exclusividade na web, e a demo também está no itch.io e no site (Pesquisa §4, §5 item 27); (c) `AGENTS.md`/`CLAUDE.md` ainda citam `zapaco.vercel.app` em comandos.

**Propostas** (Pesquisa §5 itens 24–26): marketing concentrado em Steam Next Fest com a demo por conteúdo; mobile como segunda onda; preparar IARC/PEGI contra "jogo de azar" (sem dinheiro real, sem compra aleatória, sem iconografia de cassino: Visual 15).

---

## 20. Glossário

| Termo | Significado |
|---|---|
| Vira | Carta virada após a distribuição; define a manilha |
| Manilha | Valor logo acima da vira, nos 4 naipes; vence as comuns |
| Pica-fumo / Espadilha / Copas / Paus | Manilhas de ♦ / ♠ / ♥ / ♣, da mais fraca à mais forte |
| **ZAP** | Regra da casa: paus duas acima da vira; vence todas as manilhas |
| Vaza | Rodada de 4 cartas; mão = melhor de 3 vazas |
| Cangar | Empatar uma vaza |
| Encoberta | Carta jogada virada; nunca vence |
| Tento | Ponto do placar do Truco (até 12) |
| Queda | Fechar 12 tentos; rivais precisam de 2 quedas; a sua vira Lance |
| Correr | Recusar o truco (o outro lado ganha o valor anterior) |
| Mão de 11 / de ferro | Dupla com 11 decide jogar; 11×11 todos às cegas |
| Fichas / Mult | Os dois termos da pontuação (azul / vermelho) |
| Lance | Forma de vencer a mão; tem nível (a "mão de pôquer") |
| Manha | Item passivo em 5 espaços (o "Coringa" do Balatro) |
| Simpatia | Consumível que edita o baralho |
| Melhoria do Boteco | Upgrade permanente da run, 1 por Campeonato |
| Promessa | Recompensa por pular mesa |
| Campeonato / Mesa | "Ante" / "blind" |
| Estaca | Nível de dificuldade cumulativo por baralho |
| Coringa | Duas cartas por baralho com 10 efeitos sorteados |
| Carta especial | Trevo, Olho ou Raio: carta única por baralho com 3 efeitos sorteados |
| Flagra | Rival percebe um sinal |

---

## 21. Lições da pesquisa aplicadas

Fonte: [card-games-research.md §5](card-games-research.md#5-lições-priorizadas-para-o-zapatro). Status: **Feito** (já no jogo) · **Parcial** · **Proposta** (não decidido) · **Fora** (contra decisão vigente).

| # | Lição | Onde no GDD | Status |
|---|---|---|---|
| 1 | Correr como pequena vitória ("Correu: poupou N") | 16.3 | Proposta |
| 2 | Expor informação (manilha, força relativa, intenção de chefe) | 9, 13.3, 16.2 | Parcial |
| 3 | Chefes mudam regra do truco | 9 | Feito |
| 4 | Sinais do parceiro como identidade | 8.4 | Feito |
| 5 | Pular mesa rende algo | 5.3 | Feito; Promessa condicional (P-08); pular Pequenas e Grandes ainda dominante |
| 6 | Variedade combinatória na largada (parceiro × baralho × Estaca) | 8.1, 10.2 | Feito (4 × 5 × 8) |
| 7 | Juros com teto + quebra visível | 6 | Feito; quebra a confirmar |
| 8 | Reroll crescente que zera; probabilidade de raridade explícita | 6, 7.1 | Feito; mostrar % = Proposta |
| 9 | Um item permanente por parada | 7.6 | Feito (Melhoria 1×/Campeonato) |
| 10 | Estacas com regra legível | 10.4 | Parcial (hoje números) → Proposta |
| 11 | Meta = variedade | 10.1 | Feito (D-11) |
| 12 | Métricas por Manha; não nerfar combo querido | 17.3 | Proposta |
| 13 | Duas cores fixas Fichas/Mult + ícone | Visual 3.2 | Feito (cor); ver Visual 3.6 |
| 14 | Feedback proporcional; ZAP/Doze = "fogo no placar" | 16.4, Visual 7 | Parcial |
| 15 | Raridade por cor + forma | Visual 3.3 | Parcial (regra existe; loja usa outra convenção) |
| 16 | Velocidade e pular animação | 13.3 | Velocidade feito; pular a confirmar |
| 17 | Mesa como personagem, plateia | 16.10 | Proposta |
| 18 | SFX por passo com tom subindo; stinger ZAP/Doze | 14 | Parcial |
| 19 | Uma trilha marcante | 14 | Feito (a validar no playtest) |
| 20 | Ambiente de bar que sobe na mão decisiva | 14 | Parcial |
| 21 | Tutorial em partida real + "como jogar bem" | 11, 13.3 | Tutorial feito; dicas de estratégia Proposta |
| 22 | Tabela de força/manilha a um toque | 13.3 | Parcial |
| 23 | Liberar sistemas aos poucos | 16.9 | Proposta |
| 24 | Demo por conteúdo + Next Fest | 11, 19 | Feito (demo); Next Fest Proposta |
| 25 | Premium sem IAP; mobile 2ª onda | 19 | Feito; `/play/` grátis a confirmar |
| 26 | Classificação etária × "jogo de azar" | 19, Visual 15 | Proposta |
| 27 | Resolver Poki × itch × site | 19 | Aberto |
| 28 | Espanhol | 18.3 | Fora (pós-1.0) |
| 29 | Seed/diário para streamers | 11 | Fora até 1.0 (Proposta pós-1.0) |
| 30 | Conteúdo como dado, qualidade > quantidade | 7.2, 15 | Feito |
| 31 | Proteger saúde e ritmo | — | Nota ao dev |
| 32 | Builds sob controle próprio | 19 | Feito |

---

## 22. Pendências e contradições

| # | Item | Docs × código | Encaminhamento |
|---|---|---|---|
| 1 | Demo: `AGENTS.md`/rule `code-architecture` dizem "Campeonatos 1–2"; código e D-33 revista: **C1** | docs desatualizados | **fechado** (2026-10-24): AGENTS e rules dizem C1 |
| 2 | `balancing.md` tabela de Lances: Corrida 5/1 (antigo) × código 15/2 | histórico | anotar no balancing |
| 3 | `characters.ts` `PARTNERS` lista 2 parceiros; `partners.ts` tem 4 | código | **fechado** (2026-10-24): `companions.ts` é a única fonte (GDD 8.1) |
| 4 | Precedência deste doc × "PLAN é a fonte da verdade" | `AGENTS.md` | dev decide |
| 5 | Pular Pequenas e Grandes ainda dominante (+12 a +15,5 p.p.) depois da Promessa condicional | balancing 2026-10-25 | dev decide o próximo custo (ex.: um pulo por Campeonato) |

Resolvidas pela fusão de 2026-10-15 (o código venceu e o valor antigo ficou anotado como "era"): Dona Cida (8.1), Viciado (10.2), Delegado (9), metas (5.1), nome "zap" da manilha de paus (4.3), Espiar o monte (7.6), Vaza Limpa (4.4).
