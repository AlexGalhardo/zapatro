# ROADMAP — Zapatro 1.0

> Plano de entrega da **1.0 comercial** (Steam e Google Play), com a demo no **Steam Next Fest de fevereiro de 2027 (22/02 a 01/03/2027)**.
> O [PLAN.md](PLAN.md) continua sendo a fonte da verdade de regras, arquitetura e decisões (`D-xx`); este arquivo diz **o que será entregue, em que ordem e como conferir**. Decisão nova entra no PLAN §2 e em [docs/decisions.md](docs/decisions.md).
> Escrito em 2026-11-11 sobre a `0.19.0` (branch `improve/2026-11-next`), depois de ler o projeto e jogar o build de dev em 1920×1080 e em toque 20:9.
> Legenda: `[ ]` pendente · `[x]` feito · `[~]` incompleto ou bloqueado (motivo em uma linha) · **Aceite:** o que precisa ser verdade para marcar o item · 🧑 depende de uma pessoa (conta, aparelho, escuta, arte) · `(D-xx)` decisão fechada e `(Q-xx)` decisão aberta, as duas em [§4](#4-decisões).

## Sumário

1. [Diagnóstico](#1-diagnóstico-2026-11-11)
2. [Calendário e marcos](#2-calendário-e-marcos)
3. [Aceite global](#3-aceite-global-vale-para-todo-item)
4. [Decisões](#4-decisões)
5. Grupos de trabalho: [R0](#r0--base-e-higiene) · [R1](#r1--motor-11-lógica-pura) · [R2](#r2--11-jogável-na-partida-rápida) · [R3](#r3--run-11-mano-a-mano) · [R4](#r4--multiplayer-local) · [R5](#r5--game-feel) · [R6](#r6--interface) · [R7](#r7--conteúdo-e-profundidade) · [R8](#r8--primeira-hora-do-jogador) · [R9](#r9--áudio) · [R10](#r10--steam) · [R11](#r11--google-play) · [R12](#r12--loja-marketing-e-next-fest) · [R13](#r13--qa-performance-e-release)
6. [Fora do escopo da 1.0](#6-fora-do-escopo-da-10)
7. [Riscos](#7-riscos)

---

## 1. Diagnóstico (2026-11-11)

O que o jogo já tem de forte: regras completas do Truco Paulista em lógica pura com seed, IA por Monte Carlo, run de 8 Campeonatos com chefes, 836 falas em PT e EN, pinturas de personagens e fundos com identidade própria, cascas Electron e Capacitor, CI de três sistemas e 18 releases. A base técnica é de jogo pronto. O que falta é o que separa um beta de um produto de prateleira:

| # | Achado | Evidência | Grupo |
|---|---|---|---|
| 1 | Só existe mesa 2×2. Quatro assentos e "parceiro = assento 2" estão cravados no motor, na IA, na pontuação, na cena e na LAN | `src/logic/truco/table.ts:28-35` (`Seat = 0\|1\|2\|3`, `nextSeat = (s+1)%4`, `partnerOf = (s+2)%4`), `:588` (vaza fecha com 4 cartas), `src/logic/ai/decide.ts:90-165`, `src/logic/score/score.ts:182`, `src/scenes/TableScene.ts:188` | R1, R2, R3 |
| 2 | Multiplayer local é só Truco puro 2×2 e trava se um humano não joga | `lan/room.ts:311` (sem relógio para humanos), [docs/multiplayer.md](docs/multiplayer.md) "Fora desta versão" | R4 |
| 3 | O formulário de entrada da LAN usa pixels fixos de CSS: em 1920×1080 a fonte tem 13 px ao lado de uma UI de ~40 px | `src/scenes/LanScene.ts:276-311`; captura do menu "Multiplayer local" | R4.1 |
| 4 | A mesa tem pouco "juice": avisos ("Nova vira", "Aposta sobe", "Eles +1") são texto sobre retângulo, o feltro fica vazio no meio, o pedido de truco não tem peso | Capturas da run jogada pelo bot (seed 11) | R5 |
| 5 | Tela de carregamento é texto cinza "Carregando… N%" sobre fundo liso | Captura do boot | R6.1 |
| 6 | No celular 20:9 o jogo fica em 16:9 com faixas laterais (~22% da largura sem uso) | Captura 2400×1080 da mesa | R6.6 |
| 7 | Sistemas de profundidade existem mas estão desligados por flags: Estacas, baralhos, pacotes, renovação, Melhorias, pular mesa | `src/config/features.ts` (`TABLE_SELECT`, `SHOP_SIMPLE`), PLAN §1.4.4 | R0.4, R7 (D-82) |
| 8 | Marcas reais nas pinturas (camisa de seleção do Nino, "Las Vegas", Brahma, "51"), um chefe ainda em pixel art, vendedor sem arte, "JOKER" em inglês | PLAN §1.4.4; captura da mesa com o Nino | R7.4 |
| 9 | Material de loja e scripts de captura desatualizados: `store-shots.ts` e `gta-shots.ts` fotografam a mesa onde deveria estar a loja; `shot.ts settings` cai na escolha de parceiro | Capturas geradas nesta sessão | R0.2, R12 |
| 10 | Steam ainda sem App ID (Steamworks desligado), Play sem conta nem teste fechado, LAN nunca testada entre duas máquinas | PLAN B5.1, RC4.2, RC4.3, §1.4.1 | R10, R11, R4.9 |
| 11 | Playtests humanos pendentes desde a pré-alpha (PA4.2, A6.4), escuta dos takes pendente | PLAN | R8.4, R9.1 |

Pontos de atenção de calendário (fontes oficiais lidas em 2026-11-11; confirmar no Steamworks antes de agir):

- **Next Fest é para jogo não lançado e só uma vez por título.** A 1.0 não pode sair antes de 01/03/2027; o que vai ao festival é a **demo**. ([regras](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest))
- Inscrição até **10/01/2027**; demo e página enviadas para revisão até **18/01/2027** para entrar no Press Preview; todos os itens obrigatórios até **01/02/2027**; Press Preview em **11/02/2027**. ([edição de fevereiro de 2027](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027))
- Steam Direct: taxa de US$ 100, espera depois do pagamento (a página oficial diz 21 dias) e página "em breve" pública por pelo menos 2 semanas antes do lançamento. ([Steam Direct](https://partner.steamgames.com/steamdirect))
- Google Play, conta pessoal criada depois de 13/11/2023: teste fechado com **12 testadores por 14 dias seguidos** antes de pedir produção. ([ajuda do Play Console](https://support.google.com/googleplay/android-developer/answer/14151465))

## 2. Calendário e marcos

Cada marco é um release (`bun run release`, só com pedido do dev), com `.exe` de teste na raiz e notas no padrão do [vukem](https://github.com/AlexGalhardo/vukem/releases) (título = tag, seções `### Added/Changed/Fixed`, `**escopo:**` e link do commit), que o `scripts/release.ts` já gera.

| Marco | Data-alvo | Versão | Entrega | Grupos |
|---|---|---|---|---|
| M0 | 2026-11-15 | — | Roadmap aprovado e decisões fechadas (feito em 2026-11-11); 🧑 contas da Steam e do Play abertas; lista de pinturas entregue ao dev | R0, R7.0, §4 |
| M1 | 2026-11-29 | `0.20.0` | Motor 1×1 e Partida Rápida 1×1 | R1, R2 |
| M2 | 2026-12-13 | `0.21.0` | Multiplayer local completo: 2×2 e 1×1, qualquer combinação de humanos e NPCs, relógio de jogada | R4 |
| M3 | 2026-12-27 | `0.22.0` | Run 1×1 balanceada e sistemas de profundidade decididos e ligados | R3, R7 |
| M4 | 2027-01-10 | `0.23.0` | Game feel e interface; arte final sem marcas; congelamento de conteúdo. **Inscrição no Next Fest** | R5, R6, R7.4, R9 |
| M5 | 2027-01-18 | `1.0.0-rc.1` | Demo e página da Steam enviadas para revisão (entra no Press Preview); trailer e capturas novos; **início do teste fechado do Play** | R10, R11, R12 |
| M6 | 2027-02-01 | `1.0.0-rc.2` | Todos os itens do Next Fest aprovados; bug bash fechado | R13 |
| Fest | 2027-02-22 a 03-01 | demo | Demo ao vivo, transmissões, coleta de feedback | R12.6 |
| M7 | 2027-03-16 | `1.0.0` | Lançamento Steam e Google Play (D-76) | R13.6 |

Caminho crítico: R1 → R2 → (R3, R4) → R5/R6 → R12. R10 e R11 têm espera de terceiros (revisões, 14 dias de teste) e começam em M0, em paralelo ao código. A arte (R7.0, R7.4, R6.2, R6.8) é a frente de acabamento prioritária (D-83) e corre em paralelo desde M0, porque depende de geração e aprovação do dev.

Fluxo de entrega (D-86): cada item fechado vira um commit na branch `improve/2026-11-next` (push liberado); cada marco vira um PR, merge por rebase na `main` com o CI verde e release com o `.exe`.

## 3. Aceite global (vale para todo item)

Um item só é marcado `[x]` quando, no commit que o fecha:

- [ ] `bun run check`, `bun run lint:md`, `bun run typecheck` e `bun test` passam; `bun run build` e `bun scripts/smoke.ts` antes de qualquer push.
- [ ] Lógica nova tem teste em `tests/` que falha sem a mudança; número de gameplay novo está em `src/data/` e espelhado em [docs/balancing.md](docs/balancing.md), com `bun run balance` passando.
- [ ] Texto novo existe em EN e PT-BR (teste de paridade de chaves verde) e tem variante `.touch` quando cita tecla.
- [ ] Tela nova ou alterada foi capturada e conferida em **1920×1080**, **2560×1440** e toque **2400×1080** (e 3120×1440, o 6,8"), sem texto cortado nem sobreposição; a captura fica anexada no PR ou em `docs/media/`.
- [ ] `CHANGELOG.md` (`[Unreleased]`), o doc afetado em `docs/` e este arquivo foram atualizados no mesmo lote.
- [ ] Nenhuma mesa 2×2 mudou de comportamento sem que o item diga isso: os testes existentes passam sem alterar valores esperados.

## 4. Decisões

Fechadas na entrevista de 2026-11-11 (registradas no PLAN §2.4 e em [docs/decisions.md](docs/decisions.md)):

| ID | Decisão |
|---|---|
| D-76 | A demo vai ao Next Fest (22/02 a 01/03/2027) e a **1.0 paga sai em 2027-03-16** na Steam e no Google Play |
| D-77 | O **1×1 (mano a mano)** existe na Partida Rápida, na rede local e como run roguelite própria |
| D-78 | Na run 1×1 **você joga sozinho**: os companheiros do elenco viram os **rivais** das mesas (rosto, voz e estilo de jogo); regra especial só nos chefões; não há traço de parceiro |
| D-79 | Rede local na 1.0: **Truco até 12 com coringas e cartas especiais**, 2×2 e 1×1, em qualquer formação de humanos e NPCs, com revanche e placar da sessão. Sem pontuação roguelite e sem run cooperativa |
| D-80 | **Android também cria mesa** (o servidor roda dentro do app); a dependência nativa precisa de aprovação antes de instalar |
| D-81 | Relógio de jogada de **30 s**: no estouro o servidor faz a jogada do bot; dois estouros seguidos ligam o piloto automático até a pessoa agir; o anfitrião escolhe desligado, 15, 30 ou 60 s |
| D-82 | **Voltam** Estacas, baralhos iniciais e renovação da loja. **Saem do código** pacotes, Melhorias do Boteco e pular mesa (com as Promessas). Revê D-69 e D-72 |
| D-83 | A frente de acabamento que manda é **arte e visual**. O agente entrega a lista e os prompts ([docs/art-requests-1.0.md](docs/art-requests-1.0.md)), o dev gera e aprova as pinturas, o agente integra |
| D-84 | Áudio novo: até **5.000 créditos** do ElevenLabs sem perguntar; o gasto fica registrado em [docs/audio.md](docs/audio.md) |
| D-85 | Demo: **Campeonato 1 nas runs 2×2 e 1×1** mais Partida Rápida nos dois modos; rede local só no jogo pago |
| D-86 | Execução até a 1.0: commit por item fechado, agentes em paralelo e worktrees liberados, push na branch `improve/2026-11-next`; a cada marco, PR, merge por rebase na `main` com o CI verde e release, sem pedir de novo |
| D-87 | O chat deste projeto é em prosa normal (sem caveman) |

Abertas:

| ID | Decisão | Recomendação | Trava |
|---|---|---|---|
| Q-12 | Preço e classificação etária pretendida (álcool, cigarro do Bruto, figurino da Sheila e da Beti) | Decidir antes de M5: os questionários da Steam e do IARC pedem | R10, R11 |
| Q-13 | Como o app Android cria mesa (D-80): opções, custos e perguntas em [docs/pending-decisions.md](docs/pending-decisions.md) §10 | Plugin nativo fino só para o socket, com a lógica da sala na WebView e um transporte JSON que o desktop também fala | R4.12 |
| Q-14 | Desafio do dia (R7.5) entra na 1.0? | Só se sobrar prazo depois de M4 | R7.5 |

## R0 — Base e higiene

- [x] **R0.1 Linha de base dos gates** (2026-11-11, commit `3783613`: tudo verde, números no doc de QA). Rodar `bun run check`, `bun run lint:md`, `bun run typecheck`, `bun test`, `bun run build`, `bun scripts/smoke.ts` e `bun run balance` no commit de partida.
  **Aceite:** resultado de cada comando registrado em [docs/quality-assurance-functional-systems-global-test.md](docs/quality-assurance-functional-systems-global-test.md) com a data e o hash.
- [ ] **R0.2 Scripts de captura confiáveis.** `scripts/shot.ts`, `scripts/gta-shots.ts` e `scripts/store-shots.ts` esperam a cena certa em vez de tempo fixo e teclas cegas.
  **Aceite:** cada captura nomeada confere a cena ativa (`scene.isActive`) e a fase da run antes de fotografar; o script sai com código ≠ 0 se a tela esperada não apareceu; a captura `03-shop` mostra a loja.
- [ ] **R0.3 Cabeçalho do PLAN em dia.** O "Estado atual" do PLAN ainda diz "PA2 concluído (`0.0.3`)".
  **Aceite:** o cabeçalho cita a versão corrente e aponta para este roadmap; `AGENTS.md` ("Comece aqui") cita o `ROADMAP.md` como foco até a 1.0.
- [ ] **R0.4 Flags sem dono (D-82).** Pacotes, Melhorias, pular mesa e Promessas saem do código (dados, lógica, cena, i18n, testes, feitos, save com migração); Estacas, baralhos e renovação voltam em R7.
  **Aceite:** nenhum sistema inalcançável pelo jogador permanece no build; teste novo falha se um feito (`src/data/feats.ts`) depender de sistema desligado.

## R1 — Motor 1×1 (lógica pura)

Objetivo: a mesma máquina de regras joga com 2 ou 4 assentos. Nada de Phaser aqui.

- [ ] **R1.1 Mesa com número de assentos.** `TableState` ganha a quantidade de assentos (2 ou 4); `nextSeat`, `partnerOf`, distribuição e fechamento de vaza passam a depender dela. Em 1×1 os assentos são 0 (você) e 1 (rival).
  **Aceite:** `tests/heads-up.test.ts`: 2 mãos de 3 cartas mais a vira; a vaza fecha com 2 cartas; a vez alterna; quem não deu abre a mão; o dador alterna; `partnerOf` não existe em 1×1 (o tipo impede o uso).
- [ ] **R1.2 Aposta no mano a mano.** Truco, seis, nove e doze respondidos pelo único adversário; correr, aceitar e aumentar com as regras de hoje.
  **Aceite:** testes cobrem a cadeia 1 → 3 → 6 → 9 → 12, correr em cada degrau e a proibição de aumentar o próprio pedido.
- [ ] **R1.3 Mão de 11 e mão de ferro.** Com 11, o jogador vê as próprias cartas e decide jogar (vale 3) ou correr; em 11×11 vale a regra atual da mão de ferro.
  **Aceite:** testes de `score=11-4`, `4-11` e `11-11` em 1×1, incluindo truco pedido na mão de 11 (D-54).
- [ ] **R1.4 Sem sinais.** Em 1×1 `legalActions` nunca oferece `signal`; a carta encoberta continua valendo.
  **Aceite:** teste de propriedade: em 500 mãos 1×1 nenhuma ação `signal` aparece.
- [ ] **R1.5 Coringa, cartas especiais e chefes em 2 assentos.** Revisar cada efeito que cita rivais, parceiro ou assento fixo (`match.ts:390` sorteia entre `[1,3]`).
  **Aceite:** tabela em [docs/gdd-game-design-document.md](docs/gdd-game-design-document.md) com o comportamento de cada efeito em 1×1; um teste por efeito alterado.
- [ ] **R1.6 IA para 1×1.** `observe` e o Monte Carlo amostram uma mão escondida, sem conhecimento de parceiro; o blefe pesa mais.
  **Aceite:** em 1.000 partidas com seed, o perfil `pro` vence o aleatório em ≥ 75%; decisão média ≤ 20 ms (medida no teste).
- [ ] **R1.7 Robustez.** Simulação em massa do 1×1.
  **Aceite:** `bun scripts/sim.ts --mode 1v1 --matches 2000` termina sem exceção; invariantes conferidas a cada mão (toda carta do baralho contabilizada, tentos nunca diminuem, a partida acaba em 12).
- [ ] **R1.8 Zero regressão no 2×2.**
  **Aceite:** `git diff --stat tests/` do grupo mostra só arquivos novos ou ajustes de tipo; `bun run balance` no 2×2 dá o mesmo resultado de R0.1 para as mesmas seeds.

## R2 — 1×1 jogável na Partida Rápida

- [ ] **R2.1 Escolha de modo.** "Partida rápida" abre a escolha **Dupla (2×2)** ou **Mano a mano (1×1)**; `?skipMenu=1&mode=1v1` para testes ([test-hacks.md](test-hacks.md)).
  **Aceite:** teclado, mouse, toque e controle escolhem o modo; a última escolha é lembrada no save.
- [ ] **R2.2 Mesa de dois.** Layout próprio: rival grande no topo, suas cartas embaixo, vira e monte juntos, sem botão "Enviar sinal", placar "Você × Rival".
  **Aceite:** capturas nas quatro resoluções do §3; nenhum elemento do 2×2 (retratos laterais, sinal do parceiro) aparece.
- [ ] **R2.3 Textos e regras.** Página "Mano a mano" nas Regras e no manual da mesa (F1); nomes e avisos sem "dupla", "nós" e "parceiro" no 1×1.
  **Aceite:** busca por `partner`/`dupla` nas chaves usadas pela mesa 1×1 não retorna aviso exibido ao jogador; paridade EN e PT-BR.
- [ ] **R2.4 Smoke e QA.** `bun scripts/smoke.ts --mode 1v1` joga uma partida inteira com o bot; `bun scripts/qa.ts` ganha o grupo 1×1.
  **Aceite:** os dois passam no CI (`ci.yml`), sem erro de console.

## R3 — Run 1×1 (mano a mano)

- [ ] **R3.1 Nova run com modo.** A tela de nova run pergunta o modo (Dupla ou Mano a mano); no 1×1 a escolha de parceiro não aparece. A run guarda `mode` no save (schema novo com migração; save antigo vira 2×2).
  **Aceite:** `tests/save-compat.test.ts` carrega um save `0.19.0` e continua a run; run 1×1 fecha e reabre no meio de uma mesa sem perder estado.
- [ ] **R3.2 O elenco é o rival (D-78).** Na run 1×1 não há escolha de parceiro nem traço de companheiro: cada mesa comum sorteia um dos 10 companheiros como adversário, com o retrato, as falas e o perfil de IA dele; os chefões mantêm a regra própria.
  **Aceite:** tabela dos 10 rivais com o perfil de IA de cada um em [docs/gdd-game-design-document.md](docs/gdd-game-design-document.md) §8; o mesmo rival não se repete dentro de um Campeonato (teste com seed); nenhum traço de parceiro entra na pontuação do 1×1 (teste).
- [ ] **R3.3 Pontuação e metas.** A vaza tem 2 cartas, então as Fichas caem pela metade: metas, Lances e prêmios do 1×1 têm tabela própria em `src/data/`.
  **Aceite:** `bun run balance --mode 1v1` dentro da faixa da D-39 (bot bom 5 a 20% na Estaca 1, aleatório < 5%) e 4 a 12 mãos por mesa; números em [docs/balancing.md](docs/balancing.md).
- [ ] **R3.4 Manhas, trinkets e chefes no 1×1.** Itens que dependem de parceiro saem do sorteio do 1×1 ou ganham texto próprio; cada chefe tem a regra conferida em dois assentos.
  **Aceite:** teste percorre todos os itens e chefes e falha se algum disponível no 1×1 tiver efeito impossível de ativar.
- [ ] **R3.5 Conteúdo exclusivo.** De 5 a 8 Manhas ou trinkets que só existem no mano a mano, centrados em blefe e leitura (skill `add-game-content`).
  **Aceite:** cada um com dado, i18n, ícone, teste e linha no Almanaque.
- [ ] **R3.6 Estatísticas e feitos por modo.** Almanaque separa vitórias 2×2 e 1×1; feitos novos do 1×1 espelhados nas conquistas da Steam ([docs/steam-achievements.md](docs/steam-achievements.md)).
  **Aceite:** run 1×1 jogada pelo bot (`?run=1&mode=1v1&auto=1&speed=4`) chega ao fim e atualiza as estatísticas certas.

## R4 — Multiplayer local

Objetivo: sentar com quem estiver na sala e jogar sem atrito, em qualquer formação.

- [~] **R4.1 Formulário legível.** O formulário de entrada escala com a altura da tela (`FORM_FONT` em `src/scenes/LanScene.ts`, 2026-11-11). Medido: rótulo 22,8 px e painel 730 px em 1920×1080; 30,4 px e 973 px em 2560×1440; no celular (360 px de altura) igual a antes (13 px, 416 px). Falta conferir num aparelho com o teclado aberto (R11.3).
  **Aceite:** em 1920×1080 a fonte dos campos tem ≥ 22 px e o painel ≥ 600 px de largura; em 2560×1440 cresce na mesma proporção; no celular continua cabendo com o teclado aberto.
- [ ] **R4.2 Mesa 2×2 ou 1×1 no lobby.** O anfitrião escolhe o modo; o lobby mostra 2 ou 4 assentos. Formações cobertas: dois humanos parceiros contra dois NPCs; dois humanos adversários, cada um com um NPC de parceiro; três ou quatro humanos; humano contra humano no 1×1; humano contra NPC.
  **Aceite:** `tests/lan.test.ts` joga uma partida completa em cada formação com um servidor real; `src/net/view.ts` gira e mascara certo com 2 assentos (`tests/net-view.test.ts`).
- [ ] **R4.3 Relógio de jogada (D-81).** Contagem no servidor, anel visível no assento da vez, aviso sonoro nos últimos 5 s.
  **Aceite:** teste com relógio falso: humano parado recebe a ação do bot no tempo configurado; dois estouros seguidos ligam o piloto automático; qualquer ação do jogador o desliga; a mesa nunca fica parada mais que o tempo configurado mais 1 s.
- [ ] **R4.4 Saída do anfitrião.** Quem criou a mesa sai no lobby ou no meio da partida.
  **Aceite:** no lobby, o próximo jogador vira anfitrião; na partida, um NPC assume o assento e o jogo segue; nenhum cliente fica em tela morta (teste em `tests/lan.test.ts`).
- [ ] **R4.5 Achar a mesa.** Endereço do anfitrião em destaque no lobby, últimas mesas lembradas e, no desktop, lista de mesas da rede.
  **Aceite:** dois Electron na mesma rede: o segundo vê a mesa sem digitar IP; no Android, entrar exige no máximo um campo.
- [ ] **R4.6 Queda e volta.** Faixa "Fulano caiu, volta em 30 s", NPC assume, o retorno devolve o assento.
  **Aceite:** `scripts/lan-smoke.ts` derruba e reconecta um cliente no meio da mão e termina a partida.
- [ ] **R4.7 Revanche e placar da sessão.** Fim de partida com "Jogar de novo", troca de assentos e vitórias por dupla na sessão.
  **Aceite:** três partidas seguidas no `lan-smoke` sem voltar ao formulário.
- [ ] **R4.8 Provocações.** Seis frases rápidas por personagem, com as vozes que já existem, limitadas a uma a cada 5 s.
  **Aceite:** a frase toca para todos os clientes com o balão no assento certo; dá para silenciar nas Configurações.
- [ ] **R4.9 Cartas especiais na LAN (D-79).** A mesa da rede local joga com os coringas e com Trevo, Olho e Raio; a visão mascarada esconde o que o Olho revela de quem não deve ver.
  **Aceite:** `tests/net-view.test.ts` prova que nenhum cliente recebe carta que não deveria ver, com o Olho em jogo.
- [ ] **R4.10 `lan-smoke` no CI.**
  **Aceite:** job no `ci.yml` roda `bun scripts/lan-smoke.ts` nos modos 2×2 e 1×1.
- [ ] **R4.12 Android cria mesa (D-80, Q-13).** O app Android embute o servidor da mesa e mostra o endereço para os outros entrarem, sem PC.
  **Aceite:** dois celulares na mesma rede jogam uma partida inteira, um deles como anfitrião; o servidor para quando o app fica em segundo plano por mais de 30 s e a mesa avisa os clientes; `docs/mobile.md` e `docs/multiplayer.md` descrevem a dependência nativa aprovada.
- [ ] 🧑 **R4.11 Duas máquinas de verdade.** Matriz: Electron Windows anfitrião × Electron Windows cliente × Android cliente × Android anfitrião, com o firewall do Windows no padrão.
  **Aceite:** planilha em [docs/multiplayer.md](docs/multiplayer.md) com data, aparelhos e resultado; passo a passo do firewall no próprio lobby.

## R5 — Game feel

Princípio: todo evento de regra tem resposta visual e sonora proporcional ao peso dele. Tudo respeita "Reduzir piscadas", "Tremor de tela" e a velocidade 1×/2×/4×.

- [ ] **R5.1 O pedido de truco é um evento.** Congelamento curto, retrato de quem pediu entrando na tela, grito, a ficha da aposta batendo no centro; intensidade sobe a cada degrau (3, 6, 9, 12) em cor, tremor e música.
  **Aceite:** tabela de durações e intensidades em `docs/game-feel.md`; a 4× o efeito inteiro dura ≤ 400 ms; com "Reduzir piscadas" ligado não há flash.
- [ ] **R5.2 Cartas com peso.** Arco e amassado ao jogar, poeira no feltro, som mais grave para carta forte, rastro em manilha, entrada própria do ZAP.
  **Aceite:** 60 FPS em 1920×1080 durante uma vaza inteira (`bun scripts/qa-browsers.ts`); nenhum efeito atrasa a vez do jogador.
- [ ] **R5.3 Centro do feltro vivo.** Monte e vira juntos, fichas da aposta empilhando no centro, marcadores das três vazas (ganhou, perdeu, empatou) sempre visíveis.
  **Aceite:** captura de uma mão no meio: o jogador responde "quanto vale" e "quem levou cada vaza" sem olhar a barra lateral.
- [ ] **R5.4 Contagem de pontos.** Passo a passo dos `steps` com som subindo de tom, cada Manha ou trinket pulsa na sua vez, total batendo no medidor; efeito especial quando uma mão sozinha bate a meta.
  **Aceite:** a animação mostra exatamente os `steps` de `scoreHand` (teste compara a fila animada com os `steps`); pode ser pulada com um toque.
- [ ] **R5.5 Avisos redesenhados.** "Nova vira", "Aposta sobe", "Vaza nossa", "Mão de 11" como faixas com ícone e cor por tipo, no lugar do texto sobre retângulo.
  **Aceite:** uma função única desenha todos os avisos; captura de cada tipo nas quatro resoluções.
- [ ] **R5.6 Personagens reagem.** Expressões que já existem (`EXPRESSIONS`) em vitória, derrota, blefe descoberto e truco; respiração leve em repouso.
  **Aceite:** cada evento da tabela de `docs/game-feel.md` dispara uma expressão; nenhuma fala cobre outra.
- [ ] **R5.7 Começos e fins.** Apresentação do chefe (retrato, nome, regra), Queda, vitória e derrota de mesa, vitória e derrota de run com música própria.
  **Aceite:** cada um dura ≤ 3 s a 1×, é pulável e tem captura.

## R6 — Interface

Frente prioritária de acabamento (D-83): quando faltar prazo, R6 e R7.4 passam na frente de R5.

- [ ] **R6.1 Carregamento com identidade.** Arte do menu, logo, barra de progresso e uma dica por carregamento.
  **Aceite:** primeiro quadro pintado em ≤ 1 s no build de produção; primeiro download web segue < 8 MB (GD-017).
- [ ] **R6.2 Loja com vendedor.** Pintura do Seu Zé atrás do balcão (🧑 arte), falas dele ao comprar e ao sair sem comprar, renovação da oferta (D-82).
  **Aceite:** capturas nas quatro resoluções; toda oferta mostra raridade, efeito e preço sem abreviar.
- [ ] **R6.3 Caminho do Campeonato.** Entre as mesas, uma tela curta mostra Mesa 1, Mesa 2 e Chefão com a regra do chefe e o prêmio.
  **Aceite:** o jogador vê a regra do chefe antes de entrar na Mesa 1; a tela some em um toque.
- [ ] **R6.4 Fim de run.** Resumo com mão mais valiosa, item que mais pontuou, seed copiável e "Nova run" em um toque.
  **Aceite:** os números batem com `run.stats` (teste); captura de vitória e de derrota.
- [ ] **R6.5 Ajuda no ponto.** Força da carta ao passar o mouse ou segurar o dedo; "por que perdi esta vaza" em uma linha para quem liga as dicas.
  **Aceite:** a explicação vem da mesma função que resolve a vaza (teste com manilha, empate e encoberta).
- [ ] **R6.6 Celular 20:9 e 6,8".** A mesa usa a largura toda: barra lateral e botões de ação nas bordas, feltro mais largo.
  **Aceite:** em 2400×1080 e 3120×1440 o palco ocupa ≥ 95% da largura; alvos de toque ≥ 48 dp; `bun scripts/qa-devices.ts --set mobile` sem sobreposição.
- [ ] **R6.7 Steam Deck.** Layout conferido em 1280×800, menor texto ≥ 9 px físicos, glifos do controle em uso, teclado virtual no formulário da LAN.
  **Aceite:** captura de cada tela em 1280×800 e teste que mede a menor fonte renderizada.
- [ ] **R6.8 Ícones das Manhas e trinkets.** Os ícones genéricos por código (rosto, raio, gota) dão lugar a ilustrações com identidade (🧑 arte, D-83).
  **Aceite:** nenhum item à venda usa ícone compartilhado com outro; todos legíveis a 48 px lógicos.
- [ ] **R6.9 Acessibilidade.** Tamanho de texto (normal ou grande), baralho de 4 cores revisado para daltonismo, tudo alcançável por teclado e controle.
  **Aceite:** roteiro do QA percorre todas as telas só com teclado e só com controle; contraste de texto ≥ 4,5:1 nos painéis.

## R7 — Conteúdo e profundidade

- [ ] **R7.0 Lista de pinturas e prompts (D-83).** [docs/art-requests-1.0.md](docs/art-requests-1.0.md): cada pintura que falta, com arquivo de destino, tamanho, enquadramento, prompt no estilo de `art-src/gta/` e o que não pode aparecer (texto, marcas reais).
  **Aceite:** a lista cobre R6.1, R6.2, R6.8 e R7.4; cada linha tem prioridade (bloqueia loja, festival ou 1.0) e status (pedido, gerado, aprovado, integrado).

- [ ] **R7.1 Estacas de volta (D-82).** Seleção de Estaca na nova run, com a curva recalibrada ([docs/pending-decisions.md](docs/pending-decisions.md) §2 e §3).
  **Aceite:** `bun scripts/stakes.ts --runs 600` com a taxa caindo de forma monótona da Estaca 1 à 8; números em [docs/balancing.md](docs/balancing.md).
- [ ] **R7.2 Baralhos iniciais de volta (D-82).** Escolha de baralho na nova run, destraves visíveis.
  **Aceite:** cada baralho muda a taxa do bot bom em no máximo ±5 p.p. em relação ao padrão; verso próprio em jogo.
- [ ] **R7.3 Destraves com rumo.** Toda run, ganha ou perdida, mostra o que destravou e o que falta para o próximo destrave.
  **Aceite:** teste garante que todo destrave é alcançável na configuração da 1.0.
- [ ] 🧑 **R7.4 Arte final sem marcas.** Camisa do Nino, letreiro e torre do `bg6`, Brahma e "51" do fundo da loja, "JOKER" na face do coringa, chefe `juiz` pintado, vendedor pintado (pedidos em R7.0).
  **Aceite:** revisão visual de cada pintura em `art-src/gta/` registrada em [docs/asset-status.md](docs/asset-status.md) com "sem marca real, sem texto"; `bun scripts/portraits.ts` regenerado; nenhum retrato em pixel no jogo.
- [ ] **R7.5 Desafio do dia** (proposta, Q-14; fora do PLAN §1.5 hoje). Run com seed da data, igual para todos, sem servidor; resultado em um cartão para compartilhar.
  **Aceite:** só entra se o dev aprovar; a seed depende apenas da data UTC (teste).

## R8 — Primeira hora do jogador

- [ ] **R8.1 Tutorial pelo mano a mano.** O 1×1 ensina força das cartas, vira, manilha e truco sem parceiro nem sinais; o 2×2 entra depois, com os sinais.
  **Aceite:** tutorial termina em ≤ 6 minutos, é pulável e pode ser refeito pelo menu; EN e PT-BR.
- [ ] **R8.2 Primeira abertura.** Idioma detectado, volume e tela cheia perguntados uma vez, direto para o tutorial.
  **Aceite:** do ícone à primeira carta jogada em ≤ 90 s no build de produção.
- [ ] **R8.3 Dicas que somem.** Cada dica contextual aparece no máximo 3 vezes e pode ser desligada.
  **Aceite:** contador no save (teste).
- [ ] 🧑 **R8.4 Playtest com quem nunca jogou Truco.** Três pessoas, uma delas lendo só em inglês.
  **Aceite:** as três terminam o tutorial e vencem uma Partida Rápida sem ajuda; relatório com a skill `ccgs-playtest-report` em `docs/`.

## R9 — Áudio

- [ ] 🧑 **R9.1 Escuta dos 845 takes.** Pendência do PLAN §1.4.4.
  **Aceite:** planilha com take, aprovado ou refazer; os reprovados regerados e `bun scripts/audio-check.ts` aprovado.
- [ ] **R9.2 Legenda das piadas.** Balão com o texto de toda fala.
  **Aceite:** nenhuma fala toca sem balão; opção de legendas nas Configurações.
- [ ] **R9.3 Sons dos momentos novos.** Degraus do truco, contagem com tom subindo, apresentação do chefe, vitória e derrota, relógio da LAN e falas dos rivais no 1×1, dentro do teto de 5.000 créditos (D-84).
  **Aceite:** cada chave em `src/data/sfx.ts` e em [docs/audio.md](docs/audio.md); normalização e `audio-check` aprovados.
- [ ] **R9.4 Música que acompanha a aposta.** A mesa ganha uma camada a mais em 6, 9 e 12.
  **Aceite:** transição sem clique nem corte; volume de música respeitado.

## R10 — Steam

- [ ] 🧑 **R10.1 Conta e App ID.** Nenhuma conta aberta em 2026-11-11: abrir nesta semana. Steamworks, taxa, dados fiscais e bancários, App ID do jogo e da demo.
  **Aceite:** `steamAppId` em `desktop/package.json`; `desktop/steam.js` inicializa numa máquina com a Steam aberta e não quebra com ela fechada.
- [ ] **R10.2 Conquistas e nuvem.** Os feitos da configuração da 1.0 espelhados; Auto-Cloud do save.
  **Aceite:** 🧑 uma conquista destrava em sessão real; o save aparece numa segunda máquina.
- [ ] **R10.3 Demo como app próprio.** Build `VITE_DEMO=1` empacotado no depot da demo, com o escopo da D-85 (Campeonato 1 nas runs 2×2 e 1×1, Partida Rápida nos dois modos, sem rede local) e a tela final de lista de desejos.
  **Aceite:** `bun run electron:smoke` na demo; o progresso da demo passa para o jogo completo ou a tela diz que não passa.
- [ ] **R10.4 LAN no Electron empacotado.** Criar e entrar pelo executável instalado, não pelo dev.
  **Aceite:** R4.11 com o build do depot.
- [ ] 🧑 **R10.5 Página da loja.** Cápsulas, capturas e trailer com a arte atual, textos de [docs/store-page.md](docs/store-page.md) em EN e PT-BR, requisitos medidos ([docs/pending-decisions.md](docs/pending-decisions.md) §7).
  **Aceite:** página aprovada pela Valve e pública até 2027-01-18.
- [ ] 🧑 **R10.6 Next Fest.** Inscrição até 2027-01-10, itens até 2027-02-01, duas transmissões agendadas.
  **Aceite:** o painel do Steamworks mostra a demo como participante.

## R11 — Google Play

- [ ] 🧑 **R11.1 Conta, chave e segredos.** Nenhuma conta aberta em 2026-11-11: abrir nesta semana. Conta de desenvolvedor, keystore fora do repositório, secrets `ANDROID_KEYSTORE_*`.
  **Aceite:** `release.yml` gera o AAB assinado.
- [ ] **R11.2 Requisitos técnicos.** API alvo exigida pelo Play na data do envio, tela cheia, voltar = Esc, pausa em segundo plano, vibração.
  **Aceite:** `bun scripts/qa-android.ts` 12/12 no emulador.
- [ ] 🧑 **R11.3 Aparelhos reais.** Um 6,7" e um 6,8", partida 2×2, 1×1 e entrada numa mesa LAN.
  **Aceite:** planilha em [docs/mobile.md](docs/mobile.md); 60 FPS na mesa; sem aquecimento perceptível em 30 minutos.
- [ ] 🧑 **R11.4 Teste fechado.** 12 testadores por 14 dias seguidos, começando até 2027-01-18.
  **Aceite:** acesso à produção liberado no Play Console.
- [ ] 🧑 **R11.5 Ficha da loja.** Ícone, gráfico, capturas de celular, questionários de classificação e de dados (não coleta dados, D-31), preço (Q-12).
  **Aceite:** ficha sem pendência no Play Console.

## R12 — Loja, marketing e Next Fest

- [ ] **R12.1 Capturas e artes regeneradas.** `bun scripts/store-art.ts` e `bun scripts/store-shots.ts` com a arte final (depois de R0.2 e R7.4), incluindo 1×1 e multiplayer.
  **Aceite:** 6 capturas 1920×1080 em EN e PT-BR em `docs/media/`, cada uma mostrando um momento diferente.
- [ ] **R12.2 Trailer novo.** Roteiro de 60 s com truco, contagem, loja, chefe, mano a mano e mesa com amigos; corte de 15 s.
  **Aceite:** `trailer/out/` em EN e PT-BR, 1080p a 60 fps; os primeiros 5 s mostram o jogo, não logos.
- [ ] **R12.3 Site e presskit.** [truco.lekzera.xyz](https://truco.lekzera.xyz) com a arte atual, botões de lista de desejos, presskit baixável.
  **Aceite:** `bun scripts/site-check.ts` aprovado; Lighthouse ≥ 90 em desempenho e acessibilidade.
- [ ] **R12.4 Demo web.** itch.io e Poki com o build demo (< 8 MB no Poki).
  **Aceite:** `bun scripts/qa-web.ts` no build de produção.
- [ ] 🧑 **R12.5 Divulgação.** Lista de criadores e imprensa de jogos de cartas no Brasil e fora, chaves, Discord.
  **Aceite:** lista com contato e data de envio; primeira leva enviada no Press Preview (2027-02-11).
- [ ] 🧑 **R12.6 Semana do festival.** Duas transmissões, resposta diária aos comentários, correções da demo no mesmo dia quando possível.
  **Aceite:** diário do festival em `docs/` com lista de desejos por dia e os problemas relatados.

## R13 — QA, performance e release

- [ ] **R13.1 QA global.** Roteiro de [docs/quality-assurance-functional-systems-global-test.md](docs/quality-assurance-functional-systems-global-test.md) ampliado para 1×1, LAN e sistemas religados.
  **Aceite:** `bun scripts/qa.ts` 100% e zero bug bloqueador ou crítico aberto.
- [ ] **R13.2 Estabilidade.** `bun scripts/soak.ts` com 30 runs do bot em cada modo.
  **Aceite:** zero erro de console e heap estável (variação < 10% entre a run 5 e a 30).
- [ ] **R13.3 Desempenho.** Orçamento do PLAN §9 no desktop, no Steam Deck e no celular de entrada.
  **Aceite:** 60 FPS em 1920×1080 e 2560×1440; ≥ 30 FPS a 800p no Deck; carregamento até o menu ≤ 5 s no desktop.
- [ ] 🧑 **R13.4 Revisão de idioma.** EN lido por falante nativo; PT-BR revisado.
  **Aceite:** lista de trocas aplicada; teste de texto fixo na UI verde.
- [ ] **R13.5 Saves.** Migração de todo save publicado desde a `0.11.0`.
  **Aceite:** um arquivo de save por versão em `tests/fixtures/` carregando sem perda.
- [ ] **R13.6 Lançamento.** Runbook de [docs/release-1.0-runbook.md](docs/release-1.0-runbook.md) e [docs/release-checklist.md](docs/release-checklist.md) executados; PLAN §"1.0.0 — Lançamento" (L1 a L5).
  **Aceite:** tag `v1.0.0`, GitHub Release com todos os artefatos e notas no padrão, builds publicados na Steam e no Play.

## 6. Fora do escopo da 1.0

iOS · outros idiomas além de EN e PT-BR · multiplayer pela internet, contas e servidor · run cooperativa e pontuação roguelite na rede local (D-79) · mapa ramificado · telemetria (D-31). O restante da lista do PLAN §1.5 segue valendo.

## 7. Riscos

| Risco | Efeito | Resposta |
|---|---|---|
| Contas da Steam e do Play abertas tarde | Perde a inscrição de 10/01 ou o teste de 14 dias | Abrir em M0; são os únicos itens com espera que não depende de nós |
| O 1×1 muda o motor e quebra o 2×2 | Regressão no modo principal | R1.8: testes do 2×2 intocados e balance idêntico por seed |
| Metas do 1×1 fora da faixa | Run 1×1 fácil ou impossível | Tabela própria (R3.3) e gate de balance por modo |
| Arte depende de geração e aprovação humana | R6.2, R6.8 e R7.4 atrasam o congelamento de M4 | Lista e prompts prontos em M1; a marca real é bloqueio de loja, os ícones não |
| Escopo maior que o prazo | Demo fraca no festival | Ordem de corte: R7.5, R4.8, R9.4, R3.5, R5.6; a demo do festival não depende de R4 |
| Servidor nativo no Android (D-80) | Dependência nova, difícil de testar sem aparelho | Q-13 decidida até M1; R4.12 só fecha com dois celulares reais |
| LAN só provada em uma máquina | Falha na casa do jogador | R4.11 em M2, não em M6 |
