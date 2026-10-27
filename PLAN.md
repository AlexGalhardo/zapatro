# PLAN — Zapatro
>
> **Roadmap principal e fonte da verdade.** Roguelite de cartas em pixel art sobre o **Truco Paulista 2×2**, com estrutura inspirada no Balatro: você e um parceiro IA contra uma dupla IA, cada mão vira pontos (Fichas × Mult), e a run é montada com Manhas, cartas modificadas, consumíveis e um parceiro que evolui.
> Design completo: **[docs/gdd-game-design-document.md](docs/gdd-game-design-document.md)** (GDD; citações antigas "design §N" resolvem pela tabela "Mapa de seções antigas" no topo) (este plano não repete o design; ele o transforma em trabalho verificável).
> Stack: **Phaser 4.2.x + TypeScript + Vite + Bun 1.4.2**, arte **PixelLab**, áudio **ElevenLabs**, desktop **Electron** (Steam), mobile **Capacitor** (Google Play), site estático (**Next.js 16 SSG + Tailwind v4**) na **Vercel**, trailer em **Remotion**.
> Legenda: `[ ]` pendente · `[x]` feito · `[~]` incompleto/bloqueado (motivo em uma linha) · `(D-xx)` decisão · `(Q-xx)` pergunta aberta · **Pronto quando:** critério objetivo de conclusão.
> **Estado atual:** PA2 concluído (`0.0.3`): regras + IA (Monte Carlo com perfis, sinais, Fame) em lógica pura. Worktree `assets` gerando arte e áudio. Próximo: PA3 (mesa jogável em placeholder).

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Decisões](#2-decisões)
3. [Template herdado do Gridbound](#3-template-herdado-do-gridbound)
4. [Arquitetura](#4-arquitetura)
5. [Especificação de regras](#5-especificação-de-regras)
6. [Style Bible](#6-style-bible)
7. [Assets: pipeline e nomenclatura](#7-assets-pipeline-e-nomenclatura)
8. [Áudio](#8-áudio)
9. [Performance e tamanho](#9-performance-e-tamanho)
10. [Estratégia de testes e QA](#10-estratégia-de-testes-e-qa)
11. [Git, versões e release](#11-git-versões-e-release)
12. [Dependências entre sistemas](#12-dependências-entre-sistemas)
13. [FASE 0 — Refundação (`0.0.1`)](#fase-0--refundação-001)
14. [PRÉ-ALPHA — O Truco é divertido? (`0.0.N`)](#pré-alpha--o-truco-é-divertido-00n)
15. [ALPHA — Build, run e arte (`0.1.0-alpha.N`)](#alpha--build-run-e-arte-010-alphan)
16. [BETA — Conteúdo, plataformas e polish (`0.1.0-beta.N`)](#beta--conteúdo-plataformas-e-polish-010-betan)
17. [RC — Release candidate, lojas e marketing (`1.0.0-rc.N`)](#rc--release-candidate-lojas-e-marketing-100-rcn)
18. [1.0.0 — Lançamento](#100--lançamento)
19. [Pós-1.0](#pós-10)
20. [Perguntas abertas](#perguntas-abertas)

---

## 1. Visão geral

### 1.1 Pitch

Você senta numa mesa de boteco com um parceiro controlado pelo computador contra uma dupla rival. As regras são as do Truco Paulista (vira, manilhas, três vazas, truco → seis → nove → doze), mas cada mão vencida vira **pontos**: Fichas das cartas levadas × Mult, e o Mult começa no valor da aposta. **Pedir truco é a alavanca de pontuação.** Cada mesa exige bater uma meta antes que os rivais fechem 12 tentos. Entre as mesas, a loja vende **Manhas** (os "Jokers"), **Simpatias** (modificam o baralho), **Lances** (sobem o nível de uma forma de vencer) e **Melhorias do Boteco**. Oito Campeonatos, um Chefe com regra especial em cada um, o **Rei do Truco** no fim.

### 1.2 Loop principal

```text
Menu → Nova run (baralho inicial + parceiro + Estaca)
→ Campeonato N: Mesa Pequena → Loja → Mesa Grande → Loja → Mesa do Chefe → Loja
   (Pequena e Grande podem ser puladas em troca de uma Promessa)
→ Mesa: mãos de Truco até Pontos ≥ meta (vitória) ou rivais = 12 tentos (derrota = fim da run)
→ Campeonato 8 vencido → vitória da run → modo infinito opcional
→ Fim da run → resumo → destraves de meta-progressão → Menu
```

### 1.3 Pilares (resumo; detalhes no design)

1. **Truco primeiro:** as regras reais continuam reconhecíveis.
2. **Pedir truco é a alavanca** de pontos.
3. **Blefe com regra legível:** crença da IA + Fama.
4. **Builds quebradas, mas explicáveis:** toda ativação mostra o motivo.
5. **Informação incompleta** como recurso.
6. **Dificuldade por regra, não por número.**

### 1.4 Checklist da v1.0.0 stable (pedido do usuário)

- [ ] Deploy web totalmente funcional, sem bugs aparentes (itch.io, Poki e demo no site).
- [ ] Build desktop (Electron → Steam) totalmente funcional, sem bugs aparentes.
- [ ] Build mobile (Capacitor → Google Play, Android) totalmente funcional, sem bugs aparentes.
- [ ] Site oficial vendendo o jogo, no estilo de [playbalatro.com](https://www.playbalatro.com/), com **presskit** oficial.
- [x] Trailer de 1 minuto feito com [Remotion](https://www.remotion.dev/) para divulgação e anúncios — `trailer/out/` (60 s e teaser de 15 s, EN e PT-BR), no site; Steam quando a página da loja existir.
- [~] Revisão final do diretor (`game-director-feedback.md`, 2026-10-25) executada na branch `release/1.0-game-director`; status por achado, pendências humanas e checklist de lançamento em [docs/game-director-implementation.md](docs/game-director-implementation.md).

### 1.4.1 Multiplayer na rede local (pedido do usuário, 2026-10-27)

Até 4 pessoas na Partida Rápida, em dupla ou não, com Colyseus; detalhes em [docs/multiplayer.md](docs/multiplayer.md).

- [x] Servidor Colyseus autoritativo (`lan/`), `bun run lan-server`, lobby de 4 assentos com bots nos vazios, 30 s de reconexão.
- [x] Visão girada e mascarada por jogador (`src/net/view.ts`) e `TableScene` em modo rede (`RemoteMatch`).
- [x] Menu "Multiplayer na rede local": formulário, lobby com assento, apelido e retrato.
- [x] Testes: partidas completas por um servidor real (`tests/lan.test.ts`) e a visão (`tests/net-view.test.ts`).
- [x] Electron cria a mesa (`trucoShell.hostLan`); verificado o anfitrião entrando no próprio lobby.
- [ ] Verificar entre dois computadores reais (Electron empacotado e Android): `ws://` de LAN sem bloqueio de conteúdo misto, firewall.

### 1.4.2 Cartas especiais e coringa em dobro (pedido do usuário, 2026-10-27)

Detalhes em §5.12.1.

- [x] Trevo, Olho e Raio (3 efeitos cada, 9 no total) no baralho da run e da Partida Rápida; dois coringas por baralho.
- [x] Botão ☰ da mesa só aparece quando há Manhas (antes não fazia nada na Partida Rápida e na LAN).
- [x] Testes (`tests/specials.test.ts`) e `bun run balance` (docs/balancing.md).
- [ ] Playtest: os efeitos são divertidos ou frustram? Revisar números (bônus, escudo) e se a IA deve passar a usar as cartas.

### 1.4.3 Art Bible v3 e rodada de revisão (pedido do usuário, 2026-10-27)

Visual em [docs/visual.md](docs/visual.md) §0; decisões D-63 a D-71 em [docs/decisions.md](docs/decisions.md).

- [x] Art Bible v3 "verão, pôr do sol": cards 3:4 (`card/<id>.webp`, 480×640) e bustos (`portrait/<id>.webp`, 256×256) pintados do elenco, do Zé, da Sortuda e do Rei do Truco; fontes em `art-src/gta/`, pixel antigos em `art-src/backup-pixel/` (D-63).
- [x] Fundos pintados sob toda tela (`BackdropScene`/`setBackdrop`), escurecidos por `BACKDROP_BRIGHTNESS` exceto o menu; menu com 3 pinturas em crossfade e `BAKED_UI` por imagem (D-64).
- [x] Versos, coringa e especiais pintados inteiros em 2:3; feltro pintado tingido por Campeonato.
- [x] Carregamento tardio das pinturas que a primeira tela não usa: primeiro download web 9,39 → 7,55 MB (GD-017, D-65).
- [x] Ícones vetoriais dos sinais (`icon.signal.*`) no manual e na escolha; selos de atalho opcionais e desligados por padrão; botões com gradiente e profundidade (D-66, D-67).
- [x] LAN estável: `resync` para quem volta ao lobby com a partida já começada, validação das mensagens no servidor, `scripts/lan-smoke.ts` cobrindo a sessão inteira (D-68).
- [x] Seleção de mesas desligada (`TABLE_SELECT = false` em `src/config/features.ts`); baralho e estaca fora da UI da escolha de parceiro (D-69).
- [~] Sinal do parceiro mostra o gesto exato (o servidor LAN já manda o sinal exato ao parceiro; a mesa está em implementação) (D-70).
- [~] Só o jogador responde ao truco da dupla e traços roguelite novos dos companheiros (em implementação) (D-71).
- [x] Resoluções-alvo registradas: 1920×1080 e 2560×1440 no desktop, Android em paisagem 6,5"+ (AGENTS.md).
- [ ] Pendências de arte e sistemas inalcançáveis listadas em [BUGS.md](BUGS.md) (marcas reais, chefes em pixel, vendedor da loja, peso de `art-src/gta`, material de loja ainda em pixel).

### 1.5 Fora do escopo até a 1.0

iOS · espanhol e outros idiomas · multiplayer pela internet e co-op na run (a **LAN com até 4 pessoas na Partida Rápida** entrou em 2026-10-27, [docs/multiplayer.md](docs/multiplayer.md)) · backend, contas, telemetria · newsletter · mapa estilo Slay the Spire · relíquias, dívida, superstições, confiança do parceiro, tilt, pressão global, desafios diários, contratos (lista completa em GDD §18.3) · executável Bun de arquivo único.

---

## 2. Decisões

### 2.1 Design (brainstorm de 2026-09-30, não reabrir sem pedido)

| ID | Decisão |
|---|---|
| D-01 | Encontro = **meta de pontos** (estilo blind do Balatro) |
| D-02 | Pontos = (Fichas das vazas + Fichas do Lance) × Mult; Mult = (Aposta + Mult do Lance + Σ+Mult) × Π×Mult; só pontua a mão vencida pela sua dupla |
| D-03 | Fichas das vazas = soma das **4 cartas** de cada vaza que sua dupla levou |
| D-04 | **Derrota:** rivais chegam a 12 tentos antes da meta → fim da run (sem vidas). **Queda:** sua dupla fecha 12 → Lance Queda, só os seus tentos zeram |
| D-05 | Run **linear tipo Balatro**: 8 Campeonatos × (Pequena, Grande, Chefe) + loja após cada mesa + pular mesa por Promessa + modo infinito |
| D-06 | **Baralho compartilhado** pelos 4 jogadores, editável; efeitos de carta só ativam para a sua dupla; mínimo de 20 cartas |
| D-07 | Parceiro IA com personalidade + **sinais**; escolhido no início da run, troca rara; nível 1–3 |
| D-08 | Blefe = **crença da IA + Fama** (um medidor só, Honesto ↔ Blefador, muda só quando a mão é mostrada) |
| D-09 | Itens: **Manhas** (5 espaços, esquerda → direita), **Simpatias**, **Lances**, **Melhorias do Boteco**; modificadores de carta (1 por carta) |
| D-10 | **Paisagem 16:9** em todas as plataformas |
| D-11 | Meta-progressão **só de variedade** (baralhos, parceiros, Manhas no pool, Estacas); nunca poder permanente |

### 2.2 Entrevista de 2026-09-30

| ID | Decisão | Consequência |
|---|---|---|
| D-20 | **Repositório novo** `AlexGalhardo/jogo-truco` (privado), histórico novo; o Gridbound fica em `tibia-roguelite-game` (dev `f4fb29a`) | Commit inicial importa o template; FASE 0 poda |
| D-21 | Codinome técnico **permanente** `truco-roguelite` (desde 2026-10-25 o `name` do `package.json` é `zapatro.com`; o codinome segue nos identificadores do save); `appId` **`com.alexgalhardo.trucoroguelite`**; origem Electron `app://truco-roguelite/`; save `truco-roguelite.save` | O `appId` e a origem nunca mudam depois de publicados (o save do `localStorage` é por origem). Nome comercial: Q-01 |
| D-22 | SemVer: 10 releases em ordem (`0.1.0` … `0.10.0`, 2026-10-24), depois patch `0.10.1` e minor `0.11.0`; RCs `1.0.0-rc.N` e lançamento `1.0.0`; sem bump nem tag por commit; todo release gera o `.exe` do Windows na raiz | §11 |
| D-23 | Mobile na 1.0 = **só Android**; iOS pós-1.0 | Sem runner macOS para mobile |
| D-24 | Negócio: **Steam e Play pagos** (premium, sem anúncios nem microtransação); **demo web grátis** no itch.io e no **Poki** (Poki SDK; exclusividade web não inclui Steam/lojas mobile; link para a Steam permitido) | Flag de build de demo (D-33) e integração do Poki SDK só no build Poki |
| D-25 | Site: `site/` **estático** (Next.js 16 com `output: 'export'` + Tailwind v4, pedido do usuário em 2026-10-01; antes Vite sem framework), deploy na **Vercel**; presskit, demo embutida, política de privacidade; **sem newsletter** (wishlist + Discord + redes) | Sem backend, sem dados pessoais |
| D-26 | Trailer: subprojeto `trailer/` (Remotion, licença gratuita para 1–3 pessoas, uso comercial permitido), clipes reais gravados por Playwright com seed fixa e bot; EN e PT-BR; na fase RC | `trailer/` com `package.json` próprio |
| D-27 | Controles: **mouse + toque + teclado** no ALPHA; **gamepad** completo no BETA (meta: Steam Deck Verified) | Reaproveitar `core/gamepad.ts` → teclas virtuais |
| D-28 | Steamworks na 1.0: **conquistas** (espelham os feitos) + **Steam Cloud** (Auto-Cloud) | `steamworks.js` só no processo principal do Electron |
| D-29 | Idiomas: **EN + PT-BR**; "Truco" e nomes de Manhas em português nas duas línguas, com tooltip | Teste de paridade de chaves continua |
| D-30 | **Vozes** curtas em PT-BR ("TRUCO!", "SEIS!", "Corre!", "Bora!"), 2–3 variações por personagem, no BETA | ElevenLabs; mesmas vozes em EN |
| D-31 | **Sem telemetria** | Declaração da Play: não coleta dados |
| D-32 | Save da run **a cada mão** | Fechar o app no meio da mão retoma do início dela |
| D-33 | Demo web = **Campeonato 1** (3 mesas, até o primeiro chefe; revisto em 2026-10-15), mesmo build com `VITE_DEMO=1`; no fim, tela "Wishlist/compre na Steam" | `src/config/features.ts` |
| D-34 | **Carta encoberta** (regra paulista) a partir da 2ª vaza | §5.6 |
| D-35 | **Sinais** com tabela própria fixa (§5.8), ensinada no tutorial | Sem mapeamento "oficial" confiável nas fontes |
| D-36 | Três vazas empatadas → **ninguém pontua** | §5.5 |
| D-37 | **Tutorial jogado** na 1ª run (pulável) + dicas contextuais + regras no Almanaque + força da carta no hover | Público EN não conhece Truco |
| D-38 | Cartas **48×64 px** em resolução lógica **640×360** (zoom inteiro) | Troca o 32×48 do design |
| D-39 | Meta de balanceamento: bot **bom** vence **20–35%** das runs na Estaca 1 (era 40–60% até as metas dobrarem a pedido do dev, 2026-10-25; faixa proposta, aguarda confirmação); bot **aleatório** < 5% | `bun run balance` falha fora das faixas |
| D-40 | Arte: **placeholders por código** na pré-alpha; **PixelLab** a partir do ALPHA | Contrato de chaves + placeholder do template |
| D-41 | Desktop **só Electron** (`desktop/`); remove o executável Bun de arquivo único | Menos um launcher no CI |
| D-42 | Repositório **privado** | CI de 3 sistemas só em `main` e tags (minutos do Actions) |

### 2.3 Técnicas propostas neste plano (valem até alguém contestar)

| ID | Decisão | Motivo |
|---|---|---|
| D-50 | Regras do Truco, pontuação, IA, run e loja em **lógica pura** (`src/logic/`), sem Phaser, **determinística por seed** | Testável com `bun:test`, bot headless, replays |
| D-51 | A simulação é **por turnos**, não por tick: `Table.apply(action) → events[]`; a cena anima a fila de eventos em sequência | Jogo de cartas não precisa de tick de 60 Hz |
| D-52 | Toda decisão (humano, parceiro, rivais, bot) é uma `Action` validada por `legalActions(state, seat)` | Um único caminho para UI, IA, bot e testes |
| D-53 | Ordem de jogo **anti-horária**; "mão" = à direita de quem deu; quem dá roda a cada mão | Costume brasileiro; não confirmado nas fontes (anotado) |
| D-54 | Truco pedido na **mão de 11** → a dupla que pediu **perde a mão** | Regra encontrada na pesquisa |
| D-55 | Números de gameplay só em `src/data/`, espelhados em `docs/balancing.md`; textos só em `src/i18n/`; cores em `src/config/palette.ts` | Mantém a regra do template |
| D-56 | Pontuação em `number` com formatação abreviada acima de 1e6 (`1,2M`) e `e` acima de 1e15; sem BigInt | O modo infinito cresce rápido; `number` chega a ~1e308 |
| D-57 | **Opção de baralho de 4 cores** (acessibilidade) e **velocidade de animação 1×/2×/4×** nas Configurações | Acessibilidade e ritmo |
| D-59 | Mesa em **melhor de três quedas**: os rivais precisam fechar 12 tentos duas vezes; cada queda zera só os tentos de quem a fechou (como a Queda, D-04) | Com derrota na 1ª queda rival, nenhuma mesa passava de ~80% e a run nunca chegava aos 40–60% da D-39 (A5, 2026-09-30; revisar no playtest) |
| D-60 | Calibragem do A5: metas ×1,27 por Campeonato (110 → 585), Corrida 15 Fichas × 2 Mult, Delegado = Corrida pela metade, parceiros com coragem 0,2, rivais por Campeonato (`RIVAL_POOLS`) | `bun run balance`: bot bom 45–49%, aleatório < 1%, 4,2 mãos por mesa |
| D-62 | Repositório **público** `AlexGalhardo/zeta-c` com histórico novo (2026-10-25); branch única `main` (sem `dev`); CI de 3 sistemas em todo push; `deploy.yml` publica o site em `beta.lekzera.xyz` a cada push na `main`; workflows do Claude removidos | Minutos livres do Actions; repo público não deve aceitar disparo de terceiros com o token do Claude |
| D-61 | Estacas mexem no relógio: rivais de pools mais duros e tentos de vantagem (1/2/4/6), além de metas ×1,3, juros com teto $3, sem prêmio na Pequena e preços +25% | Só metas quase não mudavam a taxa (o relógio domina, D-59) |
| D-58 | Pastas das cascas: `desktop/` (Electron) e `mobile/` (Capacitor); `site/` e `trailer/` também com `package.json` e `bun.lock` próprios | Dependências pesadas fora do jogo |

---

## 3. Template herdado do Gridbound

O commit inicial (`b96ba42`) importou o Gridbound inteiro. Veredito por parte (fonte: mapeamento do código em 2026-09-30):

| Área | Arquivos | Veredito |
|---|---|---|
| Build/tooling | `package.json`, `vite.config.ts`, `tsconfig.json` (strict, `noUncheckedIndexedAccess`), `biome.json`, `bunfig.toml`, commitlint, Husky (hooks vazios por escolha do usuário) | **Reaproveitar**; renomear, versão `0.0.1`, remover `envPrefix` `DIABLO_` |
| RNG | `logic/rng.ts` (mulberry32: `next/range/int/chance/pick/weightedIndex`) | **Reaproveitar** |
| Save | `logic/save.ts` (envelope com `schemaVersion`, checksum, migrações encadeadas, recusa versão futura), `core/storage.ts` (KV injetável, `.tmp` → `.bak`, quarentena, export/import), `core/context.ts` (`persist`, `persistSoon`) | **Reaproveitar o mecanismo**; schema novo v1, chave `truco-roguelite.save` |
| i18n | `i18n/index.ts` (`t(key, vars)`), `en.ts` (tipa `I18nKey`), `pt-BR.ts`, `grammar.ts`, testes de paridade e de texto fixo na UI | **Reaproveitar**; tabelas novas |
| Input | `ui/keys.ts` (`onKey`, contorna tecla dobrada do Phaser 4.2.1), `onSceneEvent`, `core/gamepad.ts`, `core/virtual-keys.ts`, `core/hotkeys.ts` | **Reaproveitar** |
| Display | `logic/viewport.ts`, `core/viewport.ts`, `core/display.ts` (zoom inteiro, folga de 8 px) | **Reaproveitar** (`LOGICAL_H = 360`) |
| Plataforma | `core/platform.ts` (detecta Electron/Capacitor), `core/errors.ts` (overlay + log exportável), `core/lazy.ts`, `core/audio.ts`, `core/music.ts`, `logic/voice-limiter.ts`, `core/feel.ts` | **Reaproveitar** |
| Toque | `ui/touch.ts` (`touchUi`, `uiPx`, `byMode`), `logic/touch.ts`, `logic/fps-guard.ts` | **Reaproveitar** |
| UI base | `ui/MenuList.ts`, `ui/font.ts`, `ui/version-footer.ts`, `ui/text-quality` | **Reaproveitar** |
| Debug | `debug/params.ts`, `?qa=1` → `window.__GAME__` | **Adaptar** (novos parâmetros, §10.4) |
| Simulação | `game/World.ts` (tick 60 Hz), `game/events.ts`, `game/sim.ts` | **Substituir** pelo modelo por turnos (D-51); manter a ideia de fila de eventos e sim headless |
| Gameplay Gridbound | `logic/` (grid, flow-field, occupancy, area, spells, status, bot, inventory, items, shop, progression, points…), `data/*`, `view/ActorView`, HUD Diablo, `ui/InventoryPanels`, `ItemGrid`, `LootFeed`, `arpg.ts`, cenas de jogo | **Remover** |
| Arte | `art/gfx.ts` (contrato `public/assets/gfx/index.json`), `art/placeholders.ts`, `art/ui.ts`; `public/assets/*`, `art-src/*` | **Manter o contrato**, remover a arte |
| Scripts | `sim.ts`, `balance.ts`, `qa.ts`, `qa-devices.ts`, `qa-android.ts`, `smoke.ts`, `shot.ts`, `perf.ts`, `build-electron.ts`, `build-android.ts`, `app-icons.ts`, `audio-normalize.ts`, `el-sfx.ts`, `el-music.ts`, `pl-*.ts`, `assets-*.ts`, `pack-*.ts`, `lib/*` | **Adaptar** (sim/balance/qa/smoke para o Truco); **remover** `build-desktop.ts`, `e2e-shop.ts`, `menu-bg-process.ts`, `qa-browsers` fica |
| Cascas | `desktop/` (Electron 44.5.0, electron-builder 26.15.3, `app://gridbound/`), `mobile/` (Capacitor 8.5.2 + filesystem/haptics/share, pacote Java `com/alexgalhardo/gridbound`) | **Adaptar**: identidade nova; **corrigir** caminhos antigos `desktop-electronjs/` e `mobile-capacitorjs/` que ainda aparecem em scripts, CI, `.gitignore`, `biome.json`, rules, skills e docs |
| CI/CD | `ci.yml` (quality, balance, qa, build, electron, android), `release.yml` (desktop, web, electron, android, publish), `claude.yml`, `claude-code-review.yml` | **Adaptar**: remover jobs do exe Bun, nomes de artefato, 3 SOs só em `main`/tags |
| `.claude/` | `rules/*`, skills genéricas (Phaser 4, `gd-*`, `gc-*`, `ccgs-*`, ponytail, karpathy, graphify, grilling) | **Reaproveitar**; **adaptar** `game-art-assets`, `game-audio-assets`, `add-game-content`, `release-section`, `qa-global`, `platform-builds` |
| Docs | `docs/*` | **Reescrever**; manter `agent-workflow.md`, `tooling.md`, `git-and-versioning.md`, `desktop-electronjs.md`, `mobile-capacitorjs.md`, `smartphone-brasil-market.md`, `steam-monitor-resolution-market-research.md` (ajustados) |

---

## 4. Arquitetura

### 4.1 Camadas

```text
src/data/      Definições tipadas: cartas/fichas, lances, manhas, modificadores, simpatias,
               melhorias, promessas, parceiros, perfis de IA, chefes, campeonatos/metas,
               baralhos iniciais, estacas, feitos, sinais, loja, sfx
                  ↓ lidas por
src/logic/     Lógica pura (sem Phaser), por turnos e com seed:
  truco/       deck, vira/manilha, força, vaza, mão, aposta, mão de 11/ferro, encoberta, placar
  score/       fichas, lances, pipeline de Mult, gatilhos de Manha (esquerda → direita)
  ai/          crença, Fama, perfis, sinais (flagra), decisão de aposta e de carta
  run/         campeonatos, mesas, metas, dinheiro, promessas, loja, pacotes, inventário
  meta/        feitos, destraves, estacas, almanaque
  save.ts      schema v1, migrações, validação
  rng.ts       mulberry32 (herdado)
                  ↓ estado + eventos
src/game/      Orquestração: Table (uma mesa), Run (uma run), fila de eventos de domínio,
               sim headless + bots (bom, aleatório) para balanceamento; RemoteMatch (LAN)
src/net/       Multiplayer LAN: protocolo, visão girada e mascarada, cliente Colyseus
lan/           Servidor Colyseus da mesa LAN (sala, CLI); empacotado no Electron
                  ↓ eventos (Dealt, ViraRevealed, CardPlayed, TrickWon, TrucoCalled, …)
src/scenes/    Boot, Preload, Menu, NewRun, Table, Shop, Pack, RunEnd, Almanac, Rules,
               Tutorial, Settings, Controls, Pause, Lan (formulário e lobby)
src/view/      CardView, HandView, SeatView (retrato + balão + sinal), ScoreCounter,
               ManhaStrip, BetMeter, FameMeter, TableFx
src/ui/        Botões, painéis 9-slice, tooltip, MenuList, keys, touch (herdados)
src/core/      Plataforma, áudio, storage, display, errors, gamepad (herdados)
src/art/       Contrato de chaves + placeholders por código
src/i18n/      EN + PT-BR
src/debug/     params, overlay (mão dos rivais, crença da IA, seed)
```

Regras: `src/logic` e `src/game` **não importam Phaser**; a view **nunca muda regra**; lógica → visual só por **eventos de domínio**.

### 4.2 Modelo por turnos (D-51, D-52)

```ts
type Seat = 0 | 1 | 2 | 3;                 // 0 = você, 2 = parceiro, 1 e 3 = rivais (anti-horário)
type Team = 'us' | 'them';
type Action =
  | { kind: 'play'; seat: Seat; cardId: string; faceDown?: boolean }
  | { kind: 'truco'; seat: Seat }            // pede ou aumenta (3 → 6 → 9 → 12)
  | { kind: 'accept'; seat: Seat }
  | { kind: 'run'; seat: Seat }              // correr
  | { kind: 'signal'; seat: Seat; sign: SignId; honest: boolean }
  | { kind: 'elevenDecision'; team: Team; play: boolean };
function legalActions(state: TableState, seat: Seat): Action[];
function apply(state: TableState, action: Action, rng: Rng): { state: TableState; events: TableEvent[] };
```

- **Estado imutável por mão** (cópia estrutural barata): facilita replay, save por mão (D-32) e testes.
- IA e bot recebem uma **visão filtrada** (`observe(state, seat)`): só o que aquele assento sabe (a própria mão, cartas jogadas, sinais flagrados, Fama). Nenhuma IA lê a mão alheia (exceto por efeito explícito).
- A cena consome `TableEvent[]` numa fila de animação; velocidade 1×/2×/4× só muda a duração das animações.

### 4.3 Pontuação (D-02)

```ts
interface ScoreContext { tricks: TrickResult[]; bet: 1 | 3 | 6 | 9 | 12; lance: LanceId; lanceLevel: number;
  handCards: Card[]; manhas: ManhaInstance[]; fame: number; /* … */ }
interface ScoreStep { source: string; chips?: number; addMult?: number; xMult?: number; money?: number; }
function scoreHand(ctx: ScoreContext): { steps: ScoreStep[]; chips: number; mult: number; points: number };
```

`steps` é a lista ordenada que a UI anima (carta por carta, Manha por Manha). O total é **sempre** recalculado dos `steps` (uma fonte de verdade).

### 4.4 Eventos de domínio

`HandStarted`, `Dealt`, `ViraRevealed`, `SignalSent{seat, caught}`, `CardPlayed{seat, card, faceDown}`, `TrickWon{team, cards}`, `TrickTied`, `TrucoCalled{seat, to}`, `TrucoAnswered{seat, answer}`, `HandWon{team, tentos, lance}`, `ScoreStep`, `HandScored{points}`, `FameChanged`, `ManhaTriggered`, `MoneyChanged`, `ElevenHand`, `IronHand`, `Queda`, `TableWon`, `TableLost`, `ShopOpened`, `RunWon`, `RunLost`, `AchievementUnlocked`.

### 4.5 Save (D-32)

```ts
interface SavePayload {
  settings: Settings;                 // volumes, idioma, velocidade, 4 cores, toque, vibração…
  meta: { unlocked: Unlocks; feats: Record<FeatId, boolean>; stakesBeaten: Record<DeckId, number>;
          almanac: Record<string, true>; stats: LifetimeStats; tutorialDone: boolean };
  run: null | RunSnapshot;            // gravado ao fim de cada mão e em cada tela da loja
}
```

Chaves `truco-roguelite.save` / `.bak` / `.corrupt.<ts>`; `SAVE_VERSION = 1`; todo o resto (checksum, escrita segura, quarentena, export/import, versão futura nunca sobrescrita) vem do template.

### 4.6 Cenas

`Boot` → `Preload` → `Menu` (Continuar · Nova run · Almanaque · Regras · Configurações · Sair [só Electron]) → `NewRun` (baralho · parceiro · Estaca) → `Table` (+ overlay `Pause`) ⇄ `Shop` → `Pack` → `RunEnd`. `Tutorial` é uma `Table` com roteiro fixo e seed fixa.

---

## 5. Especificação de regras

> Fonte das regras: [jogosdorei.com.br/regras-truco.php](https://www.jogosdorei.com.br/regras-truco.php), Buscapé e regulamento do Truco Paulista da UFFS (pesquisa de 2026-09-30). Onde as fontes são omissas, a decisão está marcada com `D-xx`. O design da camada roguelite está no [GDD](docs/gdd-game-design-document.md).

### 5.1 Baralho

- 40 cartas (sem 8, 9, 10) **+ 1 coringa** (§5.12, pedido do usuário em 2026-10-15). Naipes ♦ ♠ ♥ ♣.
- Força base: **4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3**.
- O baralho da run pode ter **cópias** e **remoções** (D-06); mínimo 20 cartas.

### 5.2 Vira e manilha

- Após a distribuição (3 cartas por jogador), vira-se a carta do topo: a **vira**.
- **Manilha** = o valor imediatamente acima da vira na ordem base, com volta: vira 3 → manilha 4; vira K → manilha A; vira 7 → manilha Q.
- Ordem das manilhas: **pica-fumo ♦ < espadilha ♠ < copas ♥ < paus ♣**. Toda manilha vence qualquer carta comum.
- **ZAP** (regra da casa, pedido do usuário em 2026-10-15): a carta de **paus duas acima da vira** (uma acima das manilhas), com volta: vira 4 → manilhas 5, ZAP 6♣; vira 3 → manilha 4, ZAP 5♣. Vence todas as manilhas (força 14 em `strength`). Na mesa brilha em todas as cores com faíscas e um aviso "Você tem o ZAP!" quando cai na sua mão.
- Cópias da mesma carta empatam entre si.

### 5.3 Distribuição e turno

- Quem dá roda no sentido **anti-horário** a cada mão; a "mão" (primeiro a jogar) é o assento à direita de quem deu (D-53).
- Em cada vaza, joga-se no sentido anti-horário a partir de quem venceu a vaza anterior (na 1ª, a "mão"); em vaza empatada, começa quem abriu a vaza empatada.

### 5.4 Vazas

- Melhor de 3. A dupla que vencer 2 vazas vence a mão (a 3ª não é jogada se a mão já está decidida).

### 5.5 Empates (cangar)

| Situação | Resultado |
|---|---|
| 1ª vaza empata | Vence a mão quem vencer a 2ª (se a 2ª também empatar, quem vencer a 3ª) |
| 2ª ou 3ª vaza empata | Vence a mão quem venceu a 1ª |
| As 3 empatam | **Ninguém pontua** (D-36) |

### 5.6 Carta encoberta (D-34)

- A partir da **2ª vaza**, o jogador pode jogar a carta virada para baixo.
- Ela **não vence** nenhuma carta (vale menos que o 4) e não revela a carta para ninguém (nem para a Fama).
- Na 1ª vaza é proibido.

### 5.7 Aposta

- Toda mão vale **1** tento. No seu turno, antes de jogar, qualquer jogador pode **pedir truco** (a mão passa a valer **3**).
- A dupla adversária responde: **aceitar**, **correr** (a dupla que pediu ganha o valor anterior ao pedido) ou **aumentar** (6 → 9 → 12). Quem aumentou fica esperando a resposta da outra dupla.
- Quem responde pela dupla: o primeiro assento da dupla na ordem de jogo; o parceiro IA pode sugerir (balão) mas a decisão da sua dupla é **sua** quando você é o primeiro, e do parceiro quando ele é o primeiro, a não ser que você use o botão "eu decido" (1 vez por mão).
- A mesma dupla não pode pedir duas vezes seguidas: depois de um pedido aceito, só a outra dupla pode aumentar.

### 5.8 Sinais (D-35)

| Sinal | Significa |
|---|---|
| Piscada | Tenho o ZAP (§5.2) |
| Levantar a sobrancelha | Tenho a de copas (ou a de paus) |
| Boca torta | Tenho a espadilha |
| Mostrar a língua | Tenho o pica-fumo |
| Morder o lábio | Tenho um 3 |
| Olhar para o alto | Não tenho nada |

- 1 sinal por mão (Manhas/Melhorias dão mais), enviado antes de jogar a 1ª carta.
- Chance base de **flagra** pelos rivais: **20%**, modificada pelo perfil. Sinal flagrado vira informação para a crença da IA rival.
- **Sinal falso:** permitido; o parceiro também acredita (exceto a Cida).
- O parceiro também manda sinais para você: um balão ao lado dele mostra só a **categoria** (★ carta forte = ZAP ou manilha · 3 · ✗ nada) e a barra de status diz em palavras, sem revelar qual carta (pedido do usuário em 2026-10-15). Os rivais (laterais) nunca mostram balão; um sinal rival flagrado aparece só na barra de status.

### 5.9 Mão de 11 e mão de ferro

- **Mão de 11:** quando uma dupla tem 11 tentos, os dois jogadores dela veem as cartas um do outro e decidem **jogar** (a mão vale **3**) ou **correr** (o rival ganha **1**). Ninguém pede truco; quem pedir perde a mão (D-54).
- **Mão de ferro (11×11):** todos jogam com as cartas viradas para baixo (ninguém vê nem a própria mão); sem truco; quem vencer a mão fecha 12.

### 5.10 Placar, meta e Queda

- O placar de tentos segue o Truco. A dupla rival chegar a **12** = **derrota** da mesa (e da run).
- Pontos acumulados ≥ **meta** da mesa = **vitória** (verificado ao fim de cada mão, depois da pontuação).
- Sua dupla chegar a 12 antes da meta = **Queda**: pontua o Lance Queda e **só os seus tentos zeram** (D-04).

### 5.11 Números iniciais (calibrar)

Fichas por carta, Lances, metas, dinheiro, preços, raridades, Manhas e modificadores: tabelas em [GDD §4–7](docs/gdd-game-design-document.md), implementadas em `src/data/*` e espelhadas em `docs/balancing.md`. Qualquer mudança passa por `bun scripts/sim.ts` e `bun run balance`.

### 5.12 Coringa (pedido do usuário em 2026-10-15)

- **Dois** por baralho (`JK` e `JK2`, run e partida rápida e LAN; o tutorial fica sem; eram um até 2026-10-27, o que dobrou a chance de sair). Nunca é a vira: volta para o fundo e vira-se a próxima.
- Sem efeito vale como um **3** (força 9, 10 Fichas). Encoberto é só carta coberta (sem efeito).
- Jogado aberto, sorteia (Rng com seed, chances iguais) **um de 10 efeitos** naquela jogada (`src/data/jokers.ts`): vaza anulada (empate) · virou ZAP · furou (menos que um 4) · vale 3 (a mão passa a valer 3 se valia menos) · zerou (Fichas × Mult da mão = 0) · de ponta-cabeça (a mais fraca vence a vaza; encobertas nunca vencem) · nova vira (do monte; mudam manilhas e ZAP) · imitador (copia a carta mais forte já jogada na vaza) · dobrou (×2 Mult da mão) · mesa aberta (todas as mãos à mostra, inclusive para a IA). Efeito impossível não é sorteado (sem carta no monte → sem nova vira; primeira carta aberta da vaza → sem imitador).
- Na mesa: roleta de nomes no banner, descrição no popup; "dobrou"/"zerou" aparecem como passos da contagem (`joker:<efeito>`), depois das Manhas.

#### 5.12.1 Cartas especiais: Trevo, Olho e Raio (pedido do usuário, 2026-10-27)

- Uma de cada em todo baralho da **run e da Partida Rápida** (ids `TV`, `OL`, `RA`; a LAN e o tutorial ficam sem): 45 cartas no total. Valem como um **3**, nunca são a vira, e coberta é só carta coberta, como o coringa.
- Jogada aberta, cada uma sorteia **um dos 3 efeitos dela** (`src/data/specials.ts`, mesma roleta do coringa): **Trevo** (sorte): aposta sobe um degrau de graça · escudo (se a dupla correr nesta mão, perde só 1 tento) · bônus (+2 tentos para a dupla se vencer a mão, nunca além de 12). **Olho** (informação): espiar (uma carta de cada rival aparece para a dupla até o fim da mão) · troca (as cartas que sobram com as do parceiro, na quantidade que os dois têm) · nova mão (as cartas que sobram voltam ao monte e vêm novas). **Raio** (caos): gelo (ninguém pede truco até o fim da mão) · vaza garantida (a vaza é da dupla de quem jogou) · de ponta-cabeça (no resto da mão a mais fraca vence cada vaza).
- Efeito impossível não é sorteado (aposta já em 12 → sem "aposta sobe"; rivais sem cartas → sem "espiar"). Estado novo em `TableState`: `shield`, `bonus`, `frozen`, `reversed`, `known`. Os efeitos não mexem em Fichas × Mult; a IA não os conhece (joga as cartas como um 3).
- Arte por código (`drawSpecial`, `card.trevo|olho|raio`); textos `special.<carta>.name` e `joker.<efeito>.name|desc`.

---

## 6. Style Bible

A Art Bible v2 (híbrido: retratos e ícones em pixel art, o resto vetor por código) está em [docs/visual.md](docs/visual.md). Resumo do que continua valendo: palco lógico 640×360 com zoom inteiro pela altura, cartas 48×64, selos de atalho, modo 4 cores, paisagem fixa, `pixelArt: false` com antialias. Nunca copiar arte, fonte, logo, layout ou paleta de terceiros (Balatro, Malandro); extrair só princípios.

## 7. Assets: pipeline e nomenclatura

### 7.1 Contrato (herdado)

O jogo lê `public/assets/gfx/index.json`; **toda chave usada pela render tem placeholder por código** (`src/art/placeholders.ts`). A pré-alpha roda 100% em placeholder (D-40); o ALPHA troca chave a chave.

### 7.2 Chaves

| Tipo | Padrão | Exemplo |
|---|---|---|
| Carta (face) | `card.<rank>.<suit>` | `card.3.clubs` |
| Verso | `card.back.<id>` | `card.back.default` |
| Borda/efeito de carta | `card.frame.<mod>` | `card.frame.gold` |
| Retrato | `portrait.<char>.<expr>` | `portrait.tonhao.wink` |
| Manha | `manha.<id>` | `manha.malandro` |
| Simpatia / Lance / Melhoria / Promessa | `simpatia.<id>` / `lance.<id>` / `upgrade.<id>` / `promise.<id>` | `simpatia.rezaDeVo` |
| Pacote | `pack.<kind>` | `pack.manha` |
| Mesa e ambiente | `table.<id>`, `bg.<location>` | `bg.botecoBairro` |
| Tela de concept art | `concept.<tela>.<id>`, `concept.seat.<char>` | `concept.table.hud` |
| UI | `ui.<id>` | `ui.button.truco` |
| Chefe (retrato grande) | `boss.<id>` | `boss.reiDoTruco` |
| Áudio | `music.<id>`, `sfx.<group>.<id>`, `vo.<char>.<line>.<n>` | `vo.tonhao.truco.2` |

### 7.3 PixelLab (ponto de partida; o piloto A1 confirma custo)

| Categoria | Ferramenta | Quantidade 1.0 |
|---|---|---|
| Faces de carta (40) | `create_image_pro`/pixflux com carta âncora aprovada como referência de estilo; figuras J/Q/K primeiro | 40 + 3 versos |
| Retratos (parceiros, perfis, chefes) | `create_portrait_character` / `create_character` 1 direção + estados de expressão | ~20 personagens × 10 expressões |
| Ícones de Manha/consumíveis (48×48) | geração em lote com template de prompt por tipo | 60 Manhas + ~30 consumíveis |
| Mesa, fundo por Campeonato | `create_image_pro` 640×360 + recorte | 8 fundos |
| UI (botões, painéis 9-slice, fichas) | `create_ui_asset` ou manual | ~40 |
| Ícone do app, key art, capsules Steam | `create_image_pro` + edição manual | RC |

Scripts herdados (`scripts/lib/pixellab.ts`, `pl-*.ts`, `assets-validate.ts`, `assets-status.ts`, `pack-*`) são adaptados; `docs/asset-status.md` acompanha tudo.

---

## 8. Áudio

- **Música** (ElevenLabs, loops de 60–90 s, −18 LUFS): menu (viola caipira calma), mesa (rádio AM de boteco com viola), chefe (percussão tensa), Rei do Truco (tema), vitória, derrota. Mão de 11/ferro: low-pass + volume −8 dB.
- **SFX** (−16 LUFS; UI −20): embaralhar, distribuir, carta na mesa, vaza ganha, virar a vira, TRUCO (batida seca na mesa), aceitar, correr, contagem de fichas (tique crescente em pitch), Mult (tom mais grave), ×Mult (vidro), dinheiro, Manha ativando, compra, reroll, abrir pacote, vitória/derrota da mesa, sinal (whoosh curto), flagra (apito).
- **Ambiente:** loop de boteco (conversa ao fundo, ventilador, copo, TV) em −30 LUFS, trocado por Campeonato.
- **Vozes (BETA, D-30):** por personagem, 2–3 variações de: "Truco!", "Seis!", "Nove!", "Doze!", "Bora!/Desce!", "Corre!/Tô fora", "Caiu!", "Ô loco!". Em PT-BR nas duas línguas, legendadas no balão.
- Pipeline herdada: `scripts/el-sfx.ts`, `el-music.ts`, `audio-normalize.ts`, `logic/voice-limiter.ts`; mapeamento em `src/data/sfx.ts` e `docs/audio.md`.

---

## 9. Performance e tamanho

| Métrica | Meta ALPHA | Meta 1.0 |
|---|---|---|
| FPS (Chrome desktop médio, 1080p) | 60 estáveis | 60 (p95 do frame < 16,7 ms) |
| FPS celular de entrada (Galaxy A07/S20 FE) | ≥ 45 | ≥ 55 |
| Decisão da IA por jogada | < 5 ms | < 5 ms (p99) |
| `scoreHand` com 8 Manhas | < 1 ms | < 1 ms |
| Download inicial web | < 5 MB | **< 8 MB** (limite do Poki) |
| Memória de textura | < 64 MB | < 96 MB |
| Sim headless (bot, 1 run completa) | < 2 s | < 1 s |

---

## 10. Estratégia de testes e QA

### 10.1 Unitários (`bun:test`, `tests/<área>.test.ts`, `describe('<feature> (<ID do PLAN>)')`)

- **Regras:** força e manilha para todas as 10 viras (incluindo a volta 3 → 4); ordem dos naipes; distribuição sem cartas repetidas por id; vaza com cópias iguais (empate); todos os casos da tabela §5.5; carta encoberta (proibida na 1ª vaza, nunca vence); aposta (sequência 1→3→6→9→12, correr dá o valor anterior, mesma dupla não pede duas vezes, 12 é o teto); mão de 11 (ver cartas do parceiro, correr dá 1, truco = perde a mão); mão de ferro; fim da mão sem jogar a 3ª vaza; rotação de quem dá e de quem é "mão".
- **Pontuação:** fórmula D-02 com números conhecidos; ordem esquerda → direita (+Mult antes/depois de ×Mult muda o resultado); cada Lance classificado corretamente; Queda; 0 pontos ao perder/correr.
- **IA:** `observe()` nunca expõe carta alheia; aceita/corre de forma monotônica com a força (mão melhor nunca corre mais que mão pior no mesmo contexto); Fama muda só com mão mostrada; flagra respeita a chance com seed.
- **Run/loja/economia:** metas por Campeonato, dinheiro (prêmio, rapidez, juros com teto), reroll crescente, venda por metade, espaços, pacotes, pular mesa → Promessa, baralho mínimo de 20.
- **Save:** schema v1, roundtrip, checksum, corrupção → backup, versão futura recusada, save no meio da run retoma no início da mão.
- **i18n:** paridade EN/PT-BR, placeholders iguais, nenhum texto fixo em `scenes/`, `ui/`, `view/` (testes herdados).
- **Propriedade (leve):** 10.000 mãos aleatórias com seed: nenhuma carta duplicada por id, placar nunca passa de 12 sem fim de mesa, pontos nunca `NaN`/negativos, todo `apply` de `legalActions` é válido.

### 10.2 Simulação e balanceamento

- `bun scripts/sim.ts --runs 500 --bot good|random --stake 1` → taxa de vitória, Campeonato médio alcançado, dinheiro por mesa, Manhas mais compradas, mãos por mesa.
- `bun run balance` falha se: bot bom fora de 20–35% na Estaca 1 (D-39, desde a dobra das metas em 2026-10-25); aleatório ≥ 5%; alguma mesa média > 12 mãos ou < 4 (ritmo); algum `NaN`.
- Resultados registrados em `docs/balancing.md` a cada mudança de número.

### 10.3 E2E e QA global (Playwright, herdado)

- `scripts/smoke.ts`: boot → menu → nova run com `?auto=1&speed=4` → 1 mesa → sem erros de console.
- `scripts/qa.ts` (skill `qa-global`): grupos `menu`, `settings`, `newrun`, `table` (jogar, truco, aceitar, correr, sinal, encoberta), `eleven`, `iron`, `score`, `shop`, `pack`, `skip`, `boss`, `runend`, `save` (reload no meio da mão), `almanac`, `rules`, `tutorial`, `touch`, `demo`. Checklist vivo em `docs/quality-assurance-functional-systems-global-test.md`.
- `scripts/qa-devices.ts --set mobile|desktop` (11 celulares BR, 11 resoluções Steam); `scripts/qa-android.ts` (APK real no emulador `gridbound_s20fe`, a renomear).

### 10.4 Parâmetros de debug (`src/debug/params.ts`)

`?seed=N` · `?skipMenu=1` · `?auto=1` (bot joga por você) · `?speed=1|2|4` · `?champ=N&table=small|big|boss` · `?money=N` · `?manhas=id1,id2` · `?partner=id` · `?boss=id` (partida rápida contra o chefe) · `?goal=N` (liga a pontuação do roguelite numa partida rápida, que sem isso é Truco puro até 12) · `?stake=N` · `?vira=3c` (força a vira) · `?hand=3c,2h,4d` · `?score=11-0` (placar inicial: mão de 11 / `11-11` ferro) · `?reveal=1` (mostra as mãos rivais) · `?demo=1` · `?debug=1` (overlay de crença/Fama) · `?qa=1` (`window.__GAME__`).

### 10.5 Gates

| Momento | Comandos |
|---|---|
| Antes de commitar | `bun run check` → `bun run typecheck` → `bun test` |
| Antes de push | + `bun run build` + `bun run graph` |
| Fechar seção | + `bun scripts/qa.ts` + `bun run balance` (a partir do ALPHA) |
| Promover `dev → main` | + `bun scripts/smoke.ts` + `qa-devices --set mobile` e `--set desktop` |

---

## 11. Git, versões e release

- **Remoto:** `origin` → `https://github.com/AlexGalhardo/zeta-c.git` (público, histórico novo desde 2026-10-25, D-62; o anterior fica no privado `AlexGalhardo/truco.lekzera.xyz`). Branch única `main` (sem `dev` desde 2026-10-25, D-62), depois dos gates.
- **Commits:** Conventional Commits 1.0.0, em inglês, micro-commits. Escopos: `truco`, `score`, `ai`, `run`, `shop`, `meta`, `save`, `table`, `ui`, `hud`, `i18n`, `audio`, `art`, `debug`, `balance`, `tutorial`, `desktop`, `mobile`, `web`, `site`, `trailer`, `ci`, `plan`, `docs`, `skills`, `deps`, `release`.
- **SemVer 2.0.0** (D-22):

| Fase | Versões | Tag |
|---|---|---|
| FASE 0 | `0.0.1` | `v0.0.1` |
| 10 releases (2026-10-24) | `0.1.0` … `0.10.0`, um minor cada, em ordem | `v0.N.0` |
| Correção pequena / próximo passo | `0.10.1` (patch) / `0.11.0` (minor) | `v0.10.1` / `v0.11.0` |
| RC da 1.0 | `1.0.0-rc.N` | `v1.0.0-rc.N` |
| Lançamento | `1.0.0` | `v1.0.0` |

- **Versão só no `package.json` raiz**; cascas, site e trailer leem dali; o `versionCode` do Android é derivado (`scripts/lib/version-code.ts`, RCs abaixo da final).
- **CHANGELOG.md** (Keep a Changelog 1.1.0): toda mudança entra em `[Unreleased]` **no mesmo commit**; ao fechar seção, vira `## [x.y.z] - data`.
- **Docs no mesmo lote:** PLAN (`[x]`), CHANGELOG e o doc afetado em `docs/`. Fluxo repetitivo ou armadilha nova → skill em `.claude/skills/`.
- **CI** (`ci.yml`, push/PR na `main`): quality (format, lint, tsc, test, commitlint), balance, smoke, android debug APK, electron Linux, Windows e macOS (D-62). `deploy.yml`: site em `beta.lekzera.xyz`.
- **Release** (`release.yml`, tag `v*`): zip web (completo e demo), zips Electron por SO, AAB/APK assinados (secrets `ANDROID_KEYSTORE_*`), SHA256SUMS, GitHub Release com as notas do CHANGELOG (prerelease quando a tag tem `-`).

---

## 12. Dependências entre sistemas

```text
Deck/Força/Vira ─→ Vaza ─→ Mão (empates, encoberta) ─→ Aposta (truco/correr/aumentar) ─→ Placar (11, ferro, Queda)
        │                                    │
        └─→ observe() ─→ IA (perfis, crença) ─┴─→ Sinais (flagra) ─→ Fama
Mão ─→ Lances ─→ scoreHand (Fichas × Mult, Manhas esquerda→direita) ─→ Meta da mesa
Meta ─→ Mesa ─→ Campeonato ─→ Run ─→ Dinheiro ─→ Loja/Pacotes/Inventário ─→ Manhas/Simpatias/Lances/Melhorias
Run ─→ Save por mão ←─ Settings
Run ─→ Feitos ─→ Destraves/Estacas/Almanaque ─→ Conquistas Steam
Contrato de chaves ─→ Placeholders ─→ PixelLab ─→ Render
Bot (sobre legalActions) ─→ sim ─→ balance (CI)
```

- **Bloqueadores críticos:** regras do Truco (bloqueiam tudo), `legalActions/apply` (bloqueiam UI, IA e bot), `scoreHand` (bloqueia Manhas e loja), schema do save (bloqueia a run persistente).
- **Paralelizáveis:** arte ‖ lógica; áudio ‖ UI; site ‖ BETA; i18n ‖ tudo.

### 12.1 Worktrees paralelas (pedido do usuário, 2026-09-30)

> **Encerradas em 2026-10-25:** as duas worktrees abaixo não existem mais; todo o trabalho delas está em `dev`/`main` e as branches `assets` e `qa` foram apagadas. A tabela fica como registro histórico.

| Worktree | Branch | Desde | Dono exclusivo de | Integração |
|---|---|---|---|---|
| `../jogo-truco-assets` | `assets` | FASE 0 | `public/assets/gfx/`, `public/assets/audio/`, `art-src/`, `scripts/pl-*.ts`, `scripts/el-*.ts`, `scripts/lib/pixellab.ts`, `scripts/lib/elevenlabs.ts`, `scripts/assets-*.ts`, `scripts/audio-normalize.ts`, `docs/visual.md`, `docs/audio.md`, `docs/asset-status.md`, `docs/trailer-analysis.md` | O agente de assets faz merge de `dev` antes de cada lote (pega chaves novas de `src/data/`) e o fio principal faz merge de `assets` em `dev` ao fim de cada grupo, depois dos gates |
| `../jogo-truco-qa` | `qa` | início do BETA | `tests/e2e/`, `scripts/sim.ts`, `scripts/balance.ts`, `scripts/qa*.ts`, `scripts/smoke.ts`, `docs/balancing.md`, `docs/quality-assurance-functional-systems-global-test.md` | Mesmo fluxo: merge de `dev` antes de cada rodada; bugs achados viram tarefas `fix` no `dev` (ou correções mínimas no próprio branch, com teste de regressão) |

- **Sincronização (pedido do usuário, 2026-09-30):** depois de cada grupo integrado em `dev`, o fio principal faz `git -C <worktree> merge dev` (ou avisa o agente da worktree) para que `assets` e `qa` sempre tenham o código e a documentação atuais. No **fim do ALPHA** (A6) e de cada fase seguinte, `assets` é integrado em `dev` antes da build de playtest, para o usuário testar com a arte e o áudio gerados.
- **Assets** (PixelLab + ElevenLabs): cartas, versos, retratos, Manhas, consumíveis, chefes, mesas e fundos, UI/HUD, ícones, troféus/conquistas, ícone do app; música, ambientes, SFX e vozes. Referências de estilo e ritmo em `references/` (presskit do Balatro, só princípios). Confere o saldo das duas plataformas antes de cada lote e registra o custo em `docs/visual.md`. Analisa os trailers de `references/Trailers/` com a skill `watch` (plugin `claude-video`) e registra o resultado em `docs/trailer-analysis.md` para o trailer da RC3.
- **QA/Balanceamento/Simulações** (a partir do BETA): bot de run, `sim`/`balance` com as metas D-39, E2E de todos os fluxos do §10.3, `qa-devices`, `qa-android`, soak curto, relatórios em `docs/balancing.md` e no checklist de QA.

---

## FASE 0 — Refundação (`0.0.1`)

**Objetivo:** repositório do Truco limpo, com identidade própria, documentado, compilando e com CI verde; nada do Gridbound em `src/`.
**Depende de:** — · **Bloqueia:** tudo

- [x] 0.1 Preservar o Gridbound e criar o repositório novo
  - [x] 0.1.1 Commit das pendências do Gridbound e push para `tibia-roguelite-game` `dev` (`f4fb29a`)
  - [x] 0.1.2 `git init` com `origin` = `AlexGalhardo/jogo-truco`; `references/` e saídas das cascas no `.gitignore`; commit inicial importando o template (`b96ba42`)
  - [x] 0.1.3 `docs/game-design-principles.md`, `PLAN.md`, `CHANGELOG.md` novos
  - [x] 0.1.4 Branch `dev` criada a partir da `main`; primeiro push das duas (`4edf690`)
- [x] 0.2 Identidade
  - [x] 0.2.1 `package.json`: `name: truco-roguelite`, `version: 0.0.1`, `buildName: pre-alpha`; remover `build:desktop` e o `envPrefix` `DIABLO_` do `vite.config.ts`
  - [x] 0.2.2 `index.html`: título provisório "Truco Roguelite"; favicon placeholder
  - [x] 0.2.3 Save: `SAVE_KEY = 'truco-roguelite.save'`, `SAVE_VERSION = 1`, `MIGRATIONS` vazio; `SAVED_EVENT = 'truco-roguelite-saved'`
  - [x] 0.2.4 Electron (`desktop/`): `name`, `productName`, esquema `app://truco-roguelite/`, `appId` do electron-builder, `steam/app_build.vdf` com IDs placeholder
  - [x] 0.2.5 Capacitor (`mobile/`): `appId com.alexgalhardo.trucoroguelite`, `appName`, pacote Java `com/alexgalhardo/trucoroguelite/MainActivity.java`, `applicationId` no Gradle; `cap sync` sem erro
- [x] 0.3 Caminhos das cascas (bug herdado: a pasta mudou, as referências não)
  - [x] 0.3.1 Trocar `desktop-electronjs/` → `desktop/` e `mobile-capacitorjs/` → `mobile/` em: scripts do `package.json`, `scripts/build-electron.ts`, `build-android.ts`, `qa-android.ts`, `app-icons.ts`, `ci.yml`, `release.yml`, `.gitignore`, `biome.json`, `core/storage.ts` (comentário), `.claude/rules/*`, skill `platform-builds`, docs das cascas
  - [x] 0.3.2 Remover o executável Bun (D-41): `desktop/main.ts`, `desktop/assets.gen.d.ts`, `scripts/build-desktop.ts`, jobs `build`/`desktop` do CI e do release, entradas `gridbound-*` do `.gitignore`, arquivo solto `gridbound-1.0.0-windows-x64.exe`
  - [x] 0.3.3 **Pronto quando:** `rg -n "desktop-electronjs|mobile-capacitorjs|gridbound" --glob '!CHANGELOG.md' --glob '!docs/game-design-principles.md'` não encontra nada fora de histórico e `bun run electron:smoke` e `bun run android:debug` passam — só restam o nome do AVD local `gridbound_s20fe` e o `el-sfx.ts` (dono: worktree assets); Electron `--smoke` ok (Windows) e APK de debug `com.alexgalhardo.trucoroguelite` gerado
- [x] 0.4 Poda do código (§3)
  - [x] 0.4.1 Remover `logic/` e `data/` do Gridbound (manter `rng.ts`, `save.ts`, `viewport.ts`, `touch.ts`, `fps-guard.ts`, `voice-limiter.ts`, `keybinds.ts` se usado)
  - [x] 0.4.2 Remover `game/World.ts`, `game/sim.ts`, `game/events.ts` (substituídos no PA1), cenas, views e UI específicas (HUD Diablo, inventário, loja, árvore, bênçãos, loot feed, arpg)
  - [~] 0.4.3 Remover `public/assets/*` e `art-src/*` do Gridbound (manter fontes e o `index.json` vazio do contrato); remover `scripts/e2e-shop.ts`, `menu-bg-process.ts`, `pl-alpha*.ts` específicos — scripts removidos; a arte e o áudio do Gridbound saem na worktree `assets` (dona de `public/assets` e `art-src`)
  - [x] 0.4.4 Remover testes dos módulos removidos; manter rng, save, storage, i18n, viewport, touch, fps-guard, version-code, version footer
  - [x] 0.4.5 i18n: tabelas EN/PT-BR só com as chaves usadas pelas cenas mínimas
  - [x] 0.4.6 Cena mínima `Boot → Menu` (título, versão no rodapé, "Nova run" desabilitado) em placeholder
- [x] 0.5 Documentação e agentes
  - [x] 0.5.1 Reescrever `CLAUDE.md`, `AGENTS.md` e `.claude/rules/*` para o Truco (mesma estrutura; sem grid/SQM; lógica por turnos; referência de estilo = princípios do Balatro, não TibiaWiki)
  - [x] 0.5.2 `docs/README.md` (índice), `docs/architecture.md` (§4), `docs/decisions.md` (D-01…D-58), `docs/game-design.md` (estado implementado, começa vazio), `docs/balancing.md` (esqueleto), `docs/visual.md` (§6–7), `docs/audio.md` (§8); remover docs só do Gridbound (`game-market.md`, `game-name-research.md`, `store-page.md`, `asset-status.md`, `mobile-ux-plan.md`, `brainstorm.md` fica como fonte histórica) — `visual.md`, `audio.md` e `asset-status.md` são reescritos pela worktree `assets`
  - [~] 0.5.3 Adaptar skills: `game-art-assets` (cartas, retratos, Manhas), `game-audio-assets` (+ vozes), `add-game-content` (Manha, Simpatia, Lance, chefe, parceiro, perfil), `release-section` (remoto e versões novos), `qa-global` (grupos §10.3), `platform-builds` (caminhos e ids novos) — feitas `add-game-content`, `release-section`, `platform-builds`; `qa-global` volta no PA3; `game-art-assets`/`game-audio-assets` ficam com a worktree `assets`
  - [x] 0.5.4 `CREDITS.md` reiniciado (Phaser MIT, Pixelify Sans OFL; PixelLab/ElevenLabs a confirmar)
- [x] 0.6 CI/CD
  - [x] 0.6.1 `ci.yml`: jobs quality, smoke (Playwright), android, electron (Linux em `dev`; Windows/macOS em `main`/tags); job `balance` desligado até o ALPHA (sem jogo ainda)
  - [x] 0.6.2 `release.yml`: web zip, electron zips, android; artefatos `truco-roguelite-*`
  - [x] 0.6.3 Primeiro run verde no GitHub Actions (conferido com `gh run list` após o push)
- [x] 0.7 Release `0.0.1` (`chore(release): 0.0.1`, tag `v0.0.1`, push `dev` e `main`)

**Critérios de conclusão (FASE 0):**

1. `bun run check`, `bun run typecheck`, `bun test`, `bun run build` verdes.
2. `rg -n -i "gridbound|tibia|monster|spell|SQM" src tests` sem resultados.
3. O navegador abre o menu mínimo com `v0.0.1` no rodapé, sem erros de console (`bun scripts/smoke.ts`).
4. `bun run electron:smoke` exit 0 e `bun run android:debug` gera o APK com o `appId` novo.
5. CI verde em `dev`; CLAUDE.md, AGENTS.md e docs descrevem só o Truco.

---

## PRÉ-ALPHA — O Truco é divertido? (`0.0.N`)

**Objetivo:** Truco Paulista completo, 4 jogadores, com IA, sinais e encoberta, jogável no navegador **em placeholder**, sem camada roguelite. Responde à pergunta do design: *uma mão é divertida sem roguelite?*
**Depende de:** FASE 0

### PA1 — Motor de regras (`src/logic/truco/`) · `0.0.2`

- [x] PA1.1 `Card` (`id` único por cópia, `rank`, `suit`, `mod?`), `Deck` (40 cartas, embaralhar com `Rng`, distribuir 3×4 + vira), força e manilha (§5.1–5.2)
- [x] PA1.2 `TableState`, `Seat`, `Team`, turno e rotação anti-horária (§5.3)
- [x] PA1.3 Vazas, fim antecipado da mão, empates (§5.4–5.5)
- [x] PA1.4 Carta encoberta (§5.6)
- [x] PA1.5 Aposta: truco/aceitar/correr/aumentar, quem responde, teto 12 (§5.7)
- [x] PA1.6 Placar, mão de 11, mão de ferro, fim da partida a 12 (§5.9)
- [x] PA1.7 `legalActions`, `apply`, `observe`, `TableEvent` (§4.2, §4.4) — `observe` em `src/logic/truco/observe.ts`
- [x] PA1.8 Testes §10.1 "Regras" + teste de propriedade de 10.000 mãos — 29 testes, 30.000 mãos aleatórias em 3 seeds; cobertura `table.ts` 96,8% linhas / 100% funções

**Pronto quando:** todos os casos das tabelas §5.2 e §5.5 têm teste; o teste de propriedade passa com 3 seeds; cobertura de ramos do `apply` ≥ 90% (`bun test --coverage`).

### PA2 — IA e sinais (`src/logic/ai/`) · `0.0.3`

- [x] PA2.1 Estimativa de força da própria dupla (cartas na mão, manilhas já vistas, vaza atual)
- [x] PA2.2 Crença sobre a dupla adversária (cartas vistas, sinais flagrados, histórico da mão)
- [x] PA2.3 Perfis: Covarde, Valentão, Calculista, Blefador, Novato, Profissional (parâmetros em `src/data/ai-profiles.ts`)
- [x] PA2.4 Decisões: carta a jogar (ganhar barato, guardar manilha, "amarrar" com o parceiro), pedir/aceitar/correr/aumentar, mão de 11
- [x] PA2.5 Sinais: enviar (IA manda sinais honestos com probabilidade por perfil), flagra com seed, sinal falso
- [x] PA2.6 Fama (Honesto ↔ Blefador), só com mão mostrada
- [x] PA2.7 Bots de teste: `random` (ação legal aleatória) e `good` (perfil Profissional para os dois assentos da sua dupla)
- [x] PA2.8 Testes §10.1 "IA" + torneio headless: `good` × `random` em 1.000 partidas a 12 → `good` vence ≥ 85% — 951/1000 (95,1%); decisão p99 < 5 ms

**Pronto quando:** o torneio passa; decisão da IA < 5 ms (p99) no `bun test`; `observe()` coberto por teste de não vazamento.

### PA3 — Mesa jogável em placeholder · `0.0.4`

- [x] PA3.1 `TableScene`: mesa, 4 assentos, sua mão, vira, vaza, placar de tentos, valor da aposta, botões (TRUCO!, Aceitar, Correr, Sinal, Encobrir)
- [x] PA3.2 `CardView` 48×64 placeholder (rank + naipe desenhados por código; manilha com borda), interação por clique, toque e atalhos (1/2/3, T, A, C, S, E)
- [x] PA3.3 Fila de animação dos `TableEvent` (distribuir, jogar, recolher vaza, TRUCO! com zoom punch, resposta em balão), velocidade 1×/2×/4× (D-57)
- [x] PA3.4 Retratos placeholder com expressões (sinal, neutro, feliz, bravo, suando) e balões de fala por perfil (i18n)
- [x] PA3.5 Mão de 11 (painel com a mão do parceiro + Jogar/Correr) e mão de ferro (tela escurece, cartas viradas)
- [x] PA3.6 Partida a 12 com tela de fim e "jogar de novo"; `?seed`, `?vira`, `?hand`, `?reveal`, `?auto`, `?speed`
- [x] PA3.7 Modo toque (alvos ≥ 44 px, dicas `.touch`) e 640×360 sem cortes de 1280×720 a 4K — `qa-devices --set mobile` ok nos 11 celulares; `qa-browsers` Chrome/Edge/Firefox sem erros, 60 FPS
- [x] PA3.8 QA: `smoke.ts` joga uma partida com `?auto=1&speed=4` sem erros; grupos `menu`, `table`, `eleven`, `iron` no `qa.ts` — smoke ok (partida a 12 em ~20 s a 4×); `qa.ts` 30/30 (+ `pause`, `end`); `?score=us-them` força mão de 11/ferro; APK no emulador fica para o PA4

**Pronto quando:** uma partida inteira a 12 é jogável com mouse, toque e teclado, sem erros de console, em Chrome, Edge e Firefox, e no APK de debug no emulador.

### PA4 — Playtest do Truco puro · `0.0.5`

- [x] PA4.1 Build web de playtest (GitHub Release `v0.0.5` com zip web; itch.io privado opcional) — feito como `v0.0.4` (tag + release.yml) e agora `v0.1.0-alpha.1`
- [~] PA4.2 Playtest do usuário (≥ 10 partidas) + relatório (`ccgs-playtest-report`): ritmo, IA crível, blefe funciona, sinais divertidos, clareza da manilha — aguarda o usuário (junto com o playtest do ALPHA, A6.4)
- [~] PA4.3 Ajustes priorizados do relatório aplicados ou movidos para o ALPHA — depende do PA4.2

**Critérios de conclusão (PRÉ-ALPHA):**

1. Todas as regras da §5 implementadas e testadas; `bun test` verde.
2. Bot `good` vence o `random` em ≥ 85% das partidas; nenhuma partida trava em 10.000 simulações.
3. Uma partida completa jogável no navegador e no APK, sem erros.
4. **O usuário aprova que jogar uma mão é divertido** (ou lista ajustes bloqueantes, que viram tarefas do PA4.3).

---

## ALPHA — Build, run e arte (`0.1.0-alpha.N`)

**Objetivo:** camada roguelite completa em versão mínima (pontuação, Manhas, loja, run de 8 Campeonatos, 5 chefes, parceiros, save por mão) + primeira arte PixelLab e bot de balanceamento verde. Responde: *dá vontade de jogar outra run?* e *a run tem ritmo?*
**Depende de:** PRÉ-ALPHA

### A1 — Style Bible e piloto PixelLab *(paralelo a A2–A4)* · `0.1.0-alpha.1`

- [x] A1.1 Paleta mestre (`art-src/palette/master.hex` + tokens) e prancha de regras em `docs/visual.md` — worktree `assets`
- [~] A1.2 Carta âncora (3♣ e zap) + verso; aprovação do usuário antes do lote — aguarda aprovação; faces por código + J/Q/K PixelLab no jogo
- [~] A1.3 Lote das 40 faces + J/Q/K com personagens; modo 4 cores — 40 faces por código com figuras PixelLab e variantes `.4c`; lote pago das faces espera o A1.2
- [x] A1.4 Retratos: você (costas/mãos), Bruto, Cida, 6 perfis rivais, com 10 expressões — 10 personagens × 10 expressões (+ Jhony e Nino)
- [x] A1.5 Mesa + fundo do Boteco do Bairro (640×360) + UI básica (botões, painéis 9-slice, ícone de ficha e Mult) — + fundos dos 8 Campeonatos
- [x] A1.6 Validação (`assets-validate.ts`), status (`docs/asset-status.md`), custo por categoria registrado — 432/432 chaves do catálogo

**Pronto quando:** 100% das chaves da mesa em arte final passam no validador; o usuário aprova carta, retrato e mesa.

### A2 — Pontuação e Lances (`src/logic/score/`) · `0.1.0-alpha.2`

- [x] A2.1 Fichas por carta (`src/data/cards.ts`), Lances e níveis (`src/data/lances.ts`), classificação da mão (§ design 2.4)
- [x] A2.2 `scoreHand` com `steps` (§4.3), formatação de números grandes (D-56)
- [x] A2.3 Meta da mesa, vitória/derrota, Queda (§5.10) — `Match({ goal })`; a mesa usa a meta da Pequena do Campeonato `?champ` (1 por padrão) até a run do A4
- [x] A2.4 UI: Fichas × Mult animados passo a passo, aposta como Mult base, painel "Lances" com nível
- [x] A2.5 Testes §10.1 "Pontuação" — `tests/score.test.ts` (12) + grupo `score` do `qa.ts` (total animado = `scoreHand`)

**Pronto quando:** uma mesa inteira com meta funciona de ponta a ponta e a animação da contagem bate com o total do `scoreHand` em teste.

### A3 — Manhas, modificadores e consumíveis · `0.1.0-alpha.3`

- [x] A3.1 `ManhaDefinition` data-driven (gatilho, condição, efeito, tags, raridade, preço) + motor de gatilhos esquerda → direita
- [x] A3.2 As 16 Manhas do pacote inicial do design (§4.2) + 4 novas (total 20) — 20 Manhas; as 6 de regra de mesa (Gritador, Contador de Cartas, Cara de Pau, Bisbilhoteiro, Vira Viciada, Rei da Mesa) mexem no motor, na IA e na cena
- [~] A3.3 Reordenar Manhas por arrastar (mouse e toque); vender — vender e reordenar com botões ◀ ▶ na loja; arrastar fica para o BETA (B4)
- [x] A3.4 Modificadores de carta: Dourada, Pesada, Quente (3 no ALPHA) — `src/data/card-mods.ts`; overlay `card.mod.<id>` na mão entra com o baralho da run (A4)
- [x] A3.5 Simpatias: Reza de Vó, Benzedeira, Espelho, Figa (4); Lances como consumível; 2 espaços — escolha da carta do baralho na loja; mínimo de 20 cartas
- [x] A3.6 Popup de ativação `[MANHA] motivo · efeito` em toda ativação
- [x] A3.7 Testes: cada Manha tem ≥ 1 teste que prova o efeito e a condição — `tests/manhas.test.ts` (16) + grupo `manhas` do `qa.ts`

**Pronto quando:** as 20 Manhas funcionam com teste; a ordem das Manhas muda o resultado em pelo menos um caso testado.

### A4 — Run, loja e parceiros (`src/logic/run/`) · `0.1.0-alpha.4`

- [x] A4.1 Campeonatos 1–8, mesas Pequena/Grande/Chefe, metas (`src/data/championships.ts`), modo infinito
- [x] A4.2 Dinheiro: prêmio, rapidez, juros com teto
- [x] A4.3 Loja: 2 vagas, 2 pacotes, 1 Melhoria por Campeonato, reroll crescente, vender; `ShopScene` + `PackScene` — numa cena só (`RunScene`): seleção, loja, pacotes, consumíveis e fim
- [x] A4.4 Pular mesa → Promessa (3 Promessas no ALPHA)
- [x] A4.5 5 chefes do pool (Valentão, Cartomante, Juiz, Agiota, Delegado) + Rei do Truco fixo no C8
- [x] A4.6 Parceiros Bruto e Cida com passiva e nível 1–3; escolha na `NewRunScene` — escolha na `RunScene`
- [x] A4.7 Rivais: dupla aleatória de perfis por mesa, com nome e retrato — pool de perfis por Campeonato (`RIVAL_POOLS`)
- [x] A4.8 Save por mão (D-32) + "Continuar" no menu; E2E: reload no meio da mão retoma o início da mão — grupo `continue` do `qa.ts`
- [x] A4.9 Fim da run (vitória/derrota) com resumo

**Pronto quando:** o loop Menu → run → C8 → vitória funciona com `?auto=1`; reload em qualquer ponto retoma sem perder dinheiro nem Manhas.

### A5 — Bot de balanceamento e calibragem · `0.1.0-alpha.5`

- [x] A5.1 Bot de run: compra (prioriza sinergia de tags simples), vende, reordena, pula mesa por regra — `src/game/run-sim.ts` (não pula: pular nunca ajudou na simulação)
- [x] A5.2 `scripts/sim.ts` e `scripts/balance.ts` adaptados (§10.2); job `balance` religado no CI
- [x] A5.3 Calibrar metas, fichas, preços e Manhas até D-39 passar; tabelas e resultados em `docs/balancing.md` — bot bom 45–49%, aleatório < 1%, 4,2 mãos por mesa (D-59, D-60)

**Pronto quando:** `bun run balance` verde em 3 seeds com 500 runs cada.

### A6 — Tutorial e fechamento do ALPHA · `0.1.0-alpha.6`

- [x] A6.1 Tutorial jogado (seed e mãos fixas): força das cartas, vira/manilha, vaza, truco, correr, sinais, Fichas × Mult, Manha; pulável; `meta.tutorialDone` — item Tutorial no menu; `TutorialScene` sobre a mesa com 16 passos (destaque + card), deal fixo em `src/data/tutorial.ts`
- [x] A6.2 Tela de Regras (Almanaque mínimo) e força da carta no hover/segurar — Regras em livro de 11 páginas ilustradas com cartas, retratos e números de `src/data` (exemplo de Fichas × Mult calculado); força da carta no hover e ao segurar no toque
- [x] A6.3 QA global com os grupos do ALPHA; `qa-devices` mobile e desktop sem erros — `qa.ts` 39/39 (menu, pause, table, eleven, iron, score, manhas, run, continue, end); smoke ok
- [x] A6.3b Integrar a branch `assets` em `dev` (arte e áudio gerados até aqui) antes da build de playtest (pedido do usuário)
- [ ] A6.4 Playtest do usuário (≥ 3 runs) + relatório; ajustes priorizados — aguardando o usuário

**Critérios de conclusão do ALPHA:**

1. Run completa (8 Campeonatos) jogável do menu à vitória/derrota, com save por mão, em web, Electron (Windows) e APK.
2. 20 Manhas, 3 modificadores, 4 Simpatias, 7 Lances, 3 Promessas, 5 chefes + Rei, 2 parceiros, 6 perfis, todos com teste.
3. `bun run balance` verde (D-39); nenhum `NaN` em 1.500 runs simuladas.
4. Arte final da mesa, das 40 cartas e dos retratos do ALPHA no jogo; o resto em placeholder.
5. Tutorial concluível por alguém que não conhece Truco (teste com 1 pessoa, relatado pelo usuário).
6. O usuário aprova o ritmo da run e a vontade de "mais uma run".

---

## BETA — Conteúdo, plataformas e polish (`0.1.0-beta.N`)

**Objetivo:** conteúdo da 1.0, meta-progressão, áudio completo com vozes, gamepad, Steamworks, demo, Poki e todas as plataformas funcionando.
**Depende de:** ALPHA

### B0 — Worktree de QA, balanceamento e simulações (§12.1) · início do BETA

- [x] B0.1 Criar `../jogo-truco-qa` (branch `qa` a partir de `dev`) com um agente dedicado, em paralelo a B1–B6
- [x] B0.2 Bot de run evoluído (sinergia de tags, reordenar Manhas, pular mesa) e `balance` com as metas D-39 por Estaca — hábitos em `HABITS` (`run-sim.ts`); pular mesa medido e desligado no portão (`bun scripts/sim.ts --skip none|small|both`); Promessa condicional (P-08, 2026-10-25): pular só Pequenas +4,5 p.p., Pequenas e Grandes ainda +12 a +15,5 p.p. (próximo custo: decisão do dev); `--stake N`
- [x] B0.3 E2E Playwright de todos os grupos do §10.3 (`scripts/qa.ts`), incluindo demo e toque — 81 checagens (settings, rules, newrun, shop, pack, skip, boss, save, runend, touch + os do ALPHA); `demo` e `almanac` ainda `[ ]`; `tutorial` pronto
- [x] B0.4 `qa-devices` (mobile e desktop) e `qa-android` a cada merge de grupo do BETA — qa-android portado para o Truco: 12/12 no emulador
- [x] B0.5 Relatório por rodada em `docs/balancing.md` e no checklist de QA; bugs viram commits `fix` com teste de regressão — BUG-1 (resumo da run) corrigido com teste
- [~] B0.6 Merge de `qa` em `dev` ao fim de cada grupo B* — B0 integrado; segue a cada grupo

### B1 — Conteúdo · `0.1.0-beta.1`

- [x] B1.1 60 Manhas (Comum 24, Incomum 18, Rara 12, Lendária 6), cada uma com teste e ícone — 40 novas com condições novas no motor; `tests/manhas-beta.test.ts`
- [x] B1.2 7 modificadores de carta, 8 Simpatias, 7 Lances, 6 Melhorias do Boteco, 8 Promessas — Nervosa, Mentirosa (IA), Marcada (parceiro), Vidro (quebra); Espiar o monte; Vida extra etc.
- [x] B1.3 10 chefes + Rei do Truco; 4 parceiros (Bruto, Cida, Jhony, Nino) — 9 no pool + Rei (Professor, Irmãos, Mudo, Sortuda novos)
- [x] B1.4 8 fundos de Campeonato — e ambiências por Campeonato
- [x] B1.5 Rebalancear (`bun run balance` verde) — 47,0 · 52,7 · 54,0%; 4,0–4,1 mãos por mesa

### B2 — Meta-progressão · `0.1.0-beta.2`

- [x] B2.1 5 baralhos iniciais (Normal, do Interior, do Blefe, do Dinheiro, Viciado) — Viciado = cópia extra de cada ♣
- [x] B2.2 8 Estacas com regra cada (bot bom perde 5–8 p.p. por Estaca, medido) — recalibrado: 48,7 · 43 · 35,5 · 30,3 · 24,5 · 19,5 · 14,2 · 7,7% (degraus 5,0–7,5 p.p.) com `bun scripts/stakes.ts --runs 600`; tabela em `docs/balancing.md`
- [x] B2.3 Feitos (≥ 30) e destraves; Almanaque completo (Manhas, parceiros, chefes, baralhos vistos) — 37 feitos; destravam baralhos, Jhony, Nino e as lendárias
- [x] B2.4 Estatísticas vitalícias e histórico das últimas runs — aba Estatísticas do Almanaque

### B3 — Áudio · `0.1.0-beta.3`

- [x] B3.1 Músicas e ambientes (§8) via ElevenLabs, normalizados — `playAmbience` por Campeonato, `music.boss` e `music.king`
- [x] B3.2 SFX de todas as categorias (§8)
- [x] B3.3 Vozes PT-BR (D-30) por personagem, com limitador de vozes — truco/seis/nove/doze, bora, corre, caiu, oloco; chefes Professor, Irmãos, Mudo e Sortuda ainda sem voz
- [ ] B3.4 Mixagem: escuta do usuário em cada cena — aguardando o usuário

### B4 — Controles e acessibilidade · `0.1.0-beta.4`

- [~] B4.1 Gamepad em todas as telas (DualSense, Xbox, Steam Deck), vibração, dicas de botão por dispositivo — mapa da mesa, foco por setas em todos os botões, foco de carta, dica de pad na mesa; teste com controle real pendente
- [x] B4.2 Rebinding de teclado; modo 4 cores; reduzir piscadas; desligar tremor; tamanho de texto — tamanho via zoom da interface
- [x] B4.3 Teste no Steam Deck (ou resolução 1280×800 + gamepad no `qa-devices`) — grupo `deck` do `scripts/qa.ts`: 1280×800 com gamepad simulado (`navigator.getGamepads` falso): A no menu abre a run, dica de controle na mesa, direcional + A joga carta; teste num Deck real fica para o playtest

### B5 — Plataformas · `0.1.0-beta.5`

- [~] B5.1 Electron: Steamworks (`steamworks.js`), conquistas espelhando os feitos, Steam Cloud por Auto-Cloud (D-28), sem quebrar quando o Steam não está aberto — `steamworks.js` 0.4.0, ponte `desktop/steam.js` + `preload.cjs`; desligado até o App ID (`steamAppId`); sem Steam aberta registra `steam: off` e o jogo segue (testado no dev e no build empacotado); falta testar com o App ID e a Steam aberta
- [~] B5.2 Android: paisagem, imersivo, voltar = Esc, vibração, tela acesa, pausa em segundo plano (herdados), testado no S20 FE e no emulador — emulador 12/12; aparelho real pendente; Home não abre a Pausa
- [x] B5.3 Demo (D-33): `VITE_DEMO=1` encerra no C2 com tela de wishlist; build `web-demo` — `bun run build:demo`
- [x] B5.4 Poki: `PokiSDK` só no build Poki (`VITE_POKI=1`), `gameplayStart/Stop`, sem pedir fullscreen fora do SDK, download < 8 MB — `bun run build:poki`: 6,3 MB (sem vozes, ambiências tardias e `music.king`); o release falha acima de 8 MB
- [ ] B5.5 itch.io: página privada com o build demo e o completo — precisa da conta do usuário

### B6 — Polish · `0.1.0-beta.6`

- [x] B6.1 Game feel (`gd-game-feel`): squash das cartas, TRUCO!, contagem, ativação de Manha, vinheta da mão de 11/ferro
- [x] B6.2 Transições entre cenas; frases dinâmicas por situação (GDD §13.5) — fade entre cenas; falas de manilha na vaza
- [~] B6.3 Perf: metas da §9 no celular de entrada e no desktop — desktop 60 FPS (qa-browsers); celular de entrada pendente

**Critérios de conclusão do BETA:**

1. Conteúdo da 1.0 (§B1) completo, com arte final validada e teste por Manha.
2. Meta-progressão funcionando; 8 Estacas medidas pelo bot.
3. Áudio completo aprovado pelo usuário.
4. Gamepad em todas as telas; Steamworks (conquistas + Cloud) funcionando no Electron.
5. Web (completo, demo e Poki), Electron (3 SOs) e APK sem erros no QA global e no `qa-devices`.
6. Zero texto fora do i18n, zero cor fora da paleta, zero chave de asset sem arte final.

---

## RC — Release candidate, lojas e marketing (`1.0.0-rc.N`)

**Objetivo:** estabilidade, páginas de loja, site, presskit e trailer; builds candidatas nas três frentes.
**Depende de:** BETA

### UX — Interface (pedido do usuário, 2026-10-01)

- [x] UX.1 Menu animado (lampiões, poeira, cartas caindo) e ícones do app a partir da arte do paus com raio
- [x] UX.2 Telas da run: barra de status, Manhas com raridade e dica, loja e pacotes como cartas, seleção de mesa em 3 painéis, visualizador do baralho
- [x] UX.3 Seletor de sinais com rostos em pixel, gesto e significado
- [x] UX.4 HUD da mesa em painel (placar, aposta, pontos/meta, $) e contagem Fichas × Mult em caixas azul/vermelha; Configurações já em 3 painéis, mantidas

### CA — Telas a partir de concept art (pedido do usuário, 2026-10-15)

Pipeline em [docs/visual.md](docs/visual.md): concept → 640×360 → pixels2svg (`art-src/concept/*.svg`) → PNG no `dev`/`build`.

- [x] CA.1 Pipeline: `references/concept-art/` versionado, `src/data/concept-art.ts` (recortes, máscaras, apagar texto, inpainting), `bun run concept:art` (pixels2svg com traçado O(n)), `scripts/concept-raster.ts` no `dev`, `build` e builds Electron/Android; PNG idêntico ao pixel antes da vetorização (29/29)
- [x] CA.2 Menu inicial igual ao concept (substitui o menu animado da UX.1): botão dourado = foco, sete linhas fixas, EN/PT-BR
- [x] CA.3 Primeira sala (Boteco do Bairro) igual ao concept: HUD, plaquinhas, vira, status com seta, painel Jogadas, coluna de resposta, chat (sinais), ⚙/☰, leque da mão com polegares; Cida, Beti e Chico recortados (espelhados na outra cadeira; demais personagens em retrato 2×, expressões no balão); câmera em *fit* com espelho nas outras proporções
- [x] CA.4 Segunda leva (2026-10-15): Bar de Estrada (Campeonato 2), oficina do Professor (mesa do chefe), loja, baralho e Configurações; painel da mesa com a escada de pedidos e Fama no HUD; `fill`/`cast`/`room` no spec; `?boss=<id>` na partida rápida
- [ ] CA.5 Próximas telas (seleção de mesa, pacotes, fim de run, outras salas e chefes) quando chegarem os concepts

### RC1 — Estabilidade · `1.0.0-rc.1` (tag publicada em 2026-10-02 para o playtest do usuário)

- [~] RC1.1 Bug bash (`ccgs-qa-plan` + `ccgs-bug-report`); zero bugs bloqueadores/críticos — QA global 88/88; corrigidos: nome dos chefes novos na run, log de erro sem exportar no Android, dica da run presa após redesenho, clique da loja engolido pela área de hover; sessão com playtest do usuário pendente
- [x] RC1.2 Soak curto: 30 runs com `?auto=1&speed=4` sem erro e sem crescimento de heap > 10% — `bun scripts/soak.ts`: 30/30 runs em 6 páginas, 0 erros, heap +1,4% no pior caso (2026-10-01)
- [x] RC1.3 Save: compatível com todas as versões `0.1.0-beta.*` (migrações testadas) — `tests/save-compat.test.ts` com save gerado pelo código da tag `v0.1.0-beta.1` (`tests/fixtures/`)
- [~] RC1.4 Tratamento global de erros (herdado) revisado; log exportável no Android — o log usa o mesmo `shareFile` do export de save (Filesystem + Share no Android); testar no aparelho

### RC2 — Site oficial (`site/`) · `1.0.0-rc.2`

- [x] RC2.1 Subprojeto `site/` (Next.js 16 SSG + Tailwind v4, `package.json` próprio), EN e PT-BR — `/` e `/pt/`; `docs/site.md`
- [~] RC2.2 Página inicial: logo, key art, trailer embutido, badges (Steam wishlist, Google Play, itch.io), destaques do jogo, capturas/GIFs, Discord e redes, rodapé (privacidade, contato, créditos) — pronta, com o trailer; links de loja, Discord e contato em `site/src/links.ts` esperam as páginas existirem
- [x] RC2.3 Demo web embutida (build demo) — `/play/`, aberta em nova guia pelo botão da home (pedido do usuário: janela inteira e tela cheia)
- [x] RC2.4 `/presskit` (formato presskit()): ficha técnica, descrição, história, features, vídeos, imagens em alta, logos, créditos, contato, zip para download — vídeo entra com o RC3
- [x] RC2.5 `/privacy` (exigida pela Play): "não coleta dados"
- [~] RC2.6 Deploy na Vercel (subdomínio; domínio próprio quando o usuário tiver, Q-03); Lighthouse ≥ 90 em performance e acessibilidade — no ar em <https://zapaco.vercel.app> (`bun run site:deploy`); mobile 95/100/100/100; performance desktop a medir fora da rede com antivírus

### RC3 — Trailer (`trailer/`) · `1.0.0-rc.3`

- [x] RC3.1 Subprojeto `trailer/` (Remotion, versões fixas, `package.json` próprio) — Remotion 4.0.532; `docs/trailer.md`
- [x] RC3.2 `scripts/record-clips.ts`: Playwright grava clipes 1920×1080 com seed fixa e bot (TRUCO!, contagem gigante, chefe, Manha lendária, mão de ferro) — clipes `table`, `iron`, `menu`, `shop` com `clips.json` (segundo em que a cena ficou pronta)
- [x] RC3.3 Roteiro de 60 s (gancho em 3 s, regra em 10 s, escalada, chefe, logo + CTA "Wishlist"), música do jogo — `trailer/src/Trailer.tsx` segue `docs/trailer-analysis.md` §4
- [~] RC3.4 Render EN e PT-BR (1080p, 60 fps) + corte de 15 s para anúncios; publicados no site e na Steam — renderizados (`trailer/out`: trailer 60 s e teaser 15 s, EN e PT) e publicados no site; Steam depende da página da loja (RC4)

### RC4 — Lojas · `1.0.0-rc.4`

- [~] RC4.1 Nome comercial final (Q-01), marca e domínio checados; título trocado no i18n, `productName`, `appName` (o `appId` **não** muda) — **Zapatro**: i18n, `index.html`, Electron (`productName: Zapaco`, janela "Zapatro"), Android `appName`, site e trailer trocados; codinome, `appId` e origem mantidos (D-21); marca e domínio pendentes
- [~] RC4.2 Steam (material pronto em 2026-10-25: `docs/media/` com cápsulas, hero, logo, gráficos Play/itch, OG e 6 capturas 1920×1080 EN/PT por `bun scripts/store-art.ts` e `bun scripts/store-shots.ts`; textos em `docs/store-page.md`; falta tudo que depende da conta Steamworks): App ID, depots, `app_build.vdf`, página "Em breve" ≥ 2 semanas antes, capsules, library hero/logo, 5+ capturas 1920×1080, trailer; primeiro upload SteamPipe; teste Windows/Linux/Steam Deck — guia: `docs/launch-game.md`
- [ ] RC4.3 Google Play: conta, chave de upload + secrets `ANDROID_KEYSTORE_*`, questionários (classificação, segurança dos dados, público), ícone 512, gráfico 1024×500, capturas; teste interno → fechado (12 testadores/14 dias) — guia: `docs/launch-game.md`
- [ ] RC4.4 itch.io e Poki: páginas com o build demo; envio ao Poki para revisão — guia: `docs/launch-game.md` (§5 itch.io, §6 Poki)
- [ ] RC4.5 (revisão do diretor GD-014: decisão humana) Preços (Q-02) e créditos/licenças (PixelLab e ElevenLabs em plano comercial confirmado)

**Critérios de conclusão do RC:**

1. Zero bugs bloqueadores/críticos; gates, QA global, `balance`, `qa-devices` e `qa-android` verdes.
2. Site no ar com presskit e trailer; trailer EN e PT-BR renderizados.
3. Build aprovado para revisão na Steam; AAB no teste fechado da Play; demo no itch.io e enviada ao Poki.
4. Checklist `docs/release-checklist.md` 100% marcado, exceto o próprio lançamento.

---

## 1.0.0 — Lançamento

- [ ] L1 Steam: build na branch `default`, lançamento
- [ ] L2 Google Play: produção
- [ ] L3 itch.io e Poki: demo pública; site atualizado com links de compra
- [ ] L4 `chore(release): 1.0.0`, tag `v1.0.0`, GitHub Release com todos os artefatos
- [ ] L5 Os 5 itens do checklist §1.4 marcados

**Critérios de conclusão da 1.0.0:** o checklist §1.4 está 100% `[x]`, com evidência (link da loja/site e run verde do CI) ao lado de cada item.

---

## Companheiros e retratos (revisão de direção 2026-10-24)

- [x] F0 Versionamento `0.0.x`/`0.1.x`/`1.0.x`, tags locais renumeradas (`scripts/renumber-tags.ts`).
- [x] F1 `src/data/companions.ts` (10 ids, vantagem e defeito) e traços no `Match` (`src/game/traits.ts`).
- [x] F2 Sorteio de 3 candidatos (`src/logic/run/draw.ts`), rivais sem o parceiro, estilo do companheiro nos rivais, tela de escolha com 3 cartões, `?partner=`; `bun run balance` PASS (docs/balancing.md).
- [x] F3 Retratos 128×128 locais (`scripts/portraits.ts`, sem PixelLab nos `char-*.png`); O Mudo gerado no PixelLab (`art-src/portrait/mudo.png`).
- [x] F4 Art bible v2 (`docs/visual.md`), tokens da paleta, Fichas azul e Sinal teal.
- [x] F5 Telas no estilo híbrido, com as medidas dos concepts: mesa (sidebar, retratos em cartão, versos em tiles, cruz de cartas, coluna de ações, balões, contagem), menu, escolha de 3 companheiros, seleção de mesas, balcão, pacote, almanaque, regras, configurações, controles, pausa e fim de run; ícones pixel de `ui-icons.png` (`scripts/icons.ts`).
- [x] Releases no formato do vukem (`scripts/lib/release-notes.ts`, assets `zapatro_<versão>_<plataforma>`).

## Pós-1.0

iOS (Capacitor + Xcode) · espanhol · desafios diários com seed · novos Campeonatos/chefes · modo "Purista" (Truco sem roguelite, ranqueado local) · Steam Workshop de baralhos (avaliar).

---

## Visual flat (era a branch `balatro-style`, `1.0.0-flat.1`–`4`; desde `1.0.0-rc.52` em `dev`/`main`)

Visual flat e minimalista (AGENTS.md, docs/visual.md §0). Decisão do dev (2026-10-15): vira a linha principal; a linha em pixel art fica na branch `pixel-art` (até `1.0.0-rc.51`).

- [x] Arte flat por código para todas as chaves (`src/art/flat.ts`), render suave, fonte única Rubik.
- [x] Todas as telas no estilo flat: menu, pausa, Configurações, Controles, Regras, Almanaque, parceiro, seleção de mesas, loja, pacotes, baralho, fim de run, tutorial, mesa.
- [x] Arte pixel e pipelines de concept/PixelLab removidos; áudio mantido.
- [x] Estilo de jogo por parceiro (agressivo, conservadora, blefador, destemido) com teste e simulação (docs/balancing.md).
- [x] Ícone do app flat (`art-src/app-icon.svg`).
- [x] Mesa sem botão/painel de Lances; mesa 20% maior; sem linha de dica na mesa.
- [x] Selos de atalho (teclado/controle) em todos os botões com atalho; foco inicial com Enter/✕; nada no modo toque.
- [x] Opção de run "parceiro pode correr do truco" (`partnerFolds` → `TableRules.humanAnswers`), com teste.
- [x] Setas ◀ ▶ nos volumes; troca de idioma sem crash.
- [x] Prompts de concept art flat (`prompts-flat-art-concept-art.md`).
- [~] Redesenhar por código as peças aprovadas dos prompts (`references/concept-art/flat/`): menu feito (`src/art/menu-art.ts`); faltam as outras telas.
- [x] Ícones Android em `mobile/android` (`bun run --cwd mobile assets`).

---

## Perguntas abertas

| ID | Pergunta | Proposta atual | Decidir até |
|---|---|---|---|
| Q-01 | Nome comercial | **Decidido em 2026-10-01: Zapatro** ("A Truco Paulista Roguelite"); busca web sem jogo homônimo (Steam, itch.io, App Store, Play). Falta checar marca (INPI/USPTO) e domínio | RC4.1 |
| Q-02 | Preço Steam e Play | Steam US$ 9,99 com preço regional BR sugerido pela Valve; Play menor | RC4.5 |
| Q-03 | Domínio do site | Subdomínio da Vercel até o usuário registrar | RC2.6 |
| Q-04 | Personagem jogável tem rosto? (você aparece de costas/mãos) | Só mãos e costas; o foco é o parceiro e os rivais | A1.4 |
| Q-05 | Nomes e visual dos personagens de J/Q/K | Personagens de boteco originais (dono do bar, cozinheira, violeiro) | A1.3 |
| Q-06 | Parceiro sugere resposta ao truco quando você decide? | Sim, balão curto ("Bora!", "Sei não…") | PA3 |
| Q-07 | Tabela exata de Fichas, Lances e metas | Valores do design como ponto de partida; o bot calibra | A5 |
