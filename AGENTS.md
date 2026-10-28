# AGENTS.md — Zapatro

Instruções para qualquer agente de código (Claude Code, Codex, Cursor, Gemini, etc.). O `CLAUDE.md` só importa este arquivo.

**Projeto** (codinome `truco-roguelite` no `appId`, na origem e no save; pacote `zapatro.com`): roguelite de cartas em **visual pintado "verão, pôr do sol" (Art Bible v3) com UI vetorial por código** (ver abaixo) sobre o **Truco Paulista 2×2**, com estrutura inspirada no Balatro: você + parceiro IA contra uma dupla IA; cada mão vira pontos (**Fichas × Mult**, com a aposta 1/3/6/9/12 como Mult base); a run tem 8 Campeonatos com loja, Manhas, cartas modificadas e chefes. Publicação: **Steam (Electron)**, **Google Play (Capacitor, Android)**, **itch.io e Poki (demo web)** e site próprio (<https://truco.lekzera.xyz>: `/play/` completo, `/demo/` até o primeiro chefe).
**Stack:** TypeScript · Vite · **Phaser 4.2.x** · **Bun 1.4.4** (`bun:test`). UI e cartas vetoriais por código (`src/art/flat.ts`), personagens e fundos pintados em WebP; áudio ElevenLabs; trailer Remotion; site Next.js 16 SSG + Tailwind v4 na Vercel. UI **EN + PT-BR**; docs em PT-BR.

## Visual (Art Bible v3, 2026-10-27)

Personagens, fundos, versos e cartas especiais são **pinturas** (WebP); cartas comuns, painéis, botões e ícones vetoriais são **desenhados por código**; os ícones de UI da folha seguem em **pixel art**. Detalhe e regras em [docs/visual.md](docs/visual.md). Inspirado nos *princípios* de UI do Balatro (painéis arredondados com sombra sólida, números grandes, contador Fichas × Mult em destaque), **sem copiar** arte, logo, fonte, layout ou paleta dele nem de outros jogos (o jogo Malandro não é referência: vocabulário próprio, lista de strings proibidas em `docs/visual.md` §5).

- **Personagens pintados:** fontes em `art-src/gta/` → `bun scripts/portraits.ts` gera `public/assets/gfx/card/<id>.webp` (card 3:4, 480×640, chave `charcard.<id>`) e `public/assets/gfx/portrait/<id>.webp` (busto 256×256). Quem ainda não tem pintura (8 chefes: `valentao`, `cartomante`, `juiz`, `agiota`, `delegado`, `professor`, `irmaos`, `mudo`) usa o PNG 128×128 em pixel art de `portrait/<id>.png` sobre a cor dele; os pixel antigos do elenco estão guardados em `art-src/backup-pixel/`. Nunca peça ao PixelLab um personagem do elenco.
- **Fundos pintados:** a `BackdropScene` fica embaixo de toda tela (`setBackdrop(scene, 'main' | 'shop' | 'partner')`), escurecida por um tinte único (`BACKDROP_BRIGHTNESS` em `palette.ts`). As telas de jogo sorteiam a pintura entre 6 (`VARIANTS`: `bg/partner`, `bg/street`, `bg/main`, `bg/bg4`, `bg/bg5`, `bg/bg6`) a cada mesa e a cada run nova (overlays mantêm a da mesa; a loja fica em `bg/shop`); o menu principal tem as próprias 3 pinturas (`src/view/menu-backdrop.ts`, crossfade, `BAKED_UI` por imagem) no brilho original. O feltro da mesa é `bg/table.webp`, tingido por Campeonato.
- **Versos, coringa e especiais** pintados e inteiros em 2:3 (`public/assets/gfx/back/*.webp`, moldura e cantos por código); baralhos sem pintura usam o verso vetor tingido.
- **Carregamento tardio:** o que a primeira tela não usa (cards pintados, fundos da loja/parceiro/menu 2 e 3, versos e faces especiais além do padrão) entra no `LATER` do `BootScene`; os desenhos de reserva são redesenhados no lugar quando as imagens chegam. Primeiro download web abaixo de 8 MB (GD-017).
- **Ícones de UI** em pixel art (`public/assets/gfx/icon`, `bun scripts/icons.ts` a partir de `ui-icons.png`; os que a folha não tem são vetor em `src/art/icons.ts`, chave `icon.<nome>`). Os sinais secretos são ícones vetoriais `icon.signal.<sinal>` (gesto + selo da carta), os mesmos no manual, na escolha e na mesa.
- **Vetor por código** em `src/art/flat.ts`: `tex(scene, key)` desenha cartas, modificadores, ícones e o que não tem pintura num canvas 2D, rasterizado no zoom da tela com tamanho lógico fixo; `registerPortraits` entrega os bitmaps carregados. Mesa: a sidebar abre com o card dos 4 trinkets equipados e a lista de bônus e ônus ativos (docs/trinkets.md; a Fama saiu do jogo em 2026-10-27), depois Meta, Fichas × Mult, Aposta e Tentos deles; o card "Campeonato N / Mesa 1 · Mesa 2 · Chefão" fica no canto superior direito do feltro; a caixa "em jogo" (regra do chefe, mão de 11/ferro, efeitos revelados) fica na base do feltro. A caixa Manilha/ZAP, o card de dinheiro e o card Fichas × Mult estão escondidos por flags (`SHOW_MANILHA_BOX`, `SHOW_MONEY_PANEL`, `SHOW_SCORE_PANEL` em `src/config/features.ts`; o código fica; a contagem anima num popup no centro do feltro). Trinkets: `TRINKETS` e `SHOP_SIMPLE` na mesma pasta, regras em docs/trinkets.md. Quedas para perder: `QUEDAS_TO_LOSE` em `src/data/championships.ts` (2).
- **Resoluções-alvo (16:9):** o jogo é otimizado primeiro para **1920×1080** (47,91% dos jogadores) e depois **2560×1440** (27,04%); toda tela nova é conferida nas duas (captura e legibilidade). No **app Android** o alvo são telas grandes em paisagem: **acima de 6,7"** (44,6%) e **6,5" a 6,7"** (40,2%) (AnTuTu Global, 2º tri 2026), em geral ~20:9 (2400×1080 a 3200×1440); confira o modo toque nelas. Outras proporções (ultrawide, 16:10) não podem quebrar, mas não guiam o layout.
- **Render suave:** `pixelArt: false`, `antialias`, sem `roundPixels`. Fonte única Rubik (trocar por Roboto exige `@fontsource/roboto`, aguardando aprovação).
- **Atalhos: selos opcionais, desligados por padrão** (Configurações > "Mostrar teclas de atalho", `settings.keyHints`; save sem o campo vale desligado). Ligados, todo botão com atalho mostra a tecla (ou o botão do controle) num selo à direita (`hint`, `src/ui/key-hint.ts`, que devolve `''` com a opção desligada e no modo toque) e o botão em foco mostra o que confirma (Enter / ✕). O atalho funciona sempre; `buttonNav` já começa com um botão em foco no teclado e no controle. Nada de linha de dica "Sua vez · …" na mesa.
- **Arte nova:** pintura no estilo de `art-src/gta/` (mesmo enquadramento, sem texto nem marcas reais), depois `bun scripts/portraits.ts`. Os prompts antigos em pixel ([prompts-new-concept-art-using-pixel-art.md](prompts-new-concept-art-using-pixel-art.md)) são histórico.
- **UI:** `Button` (bloco arredondado com sombra sólida proporcional à altura e gradiente vertical derivado de `color`; pressionado afunda a profundidade toda), `drawPanel`/`addPanel` (`src/ui/panel.ts`), telas encaixadas no palco 640×360 com `src/view/stage.ts` (`fitCamera`); o fundo pintado de toda tela é a `BackdropScene` (`setBackdrop`).
- **Elenco:** 10 companheiros (`src/data/companions.ts`), 3 sorteados por run como parceiro; os traços (vantagem e defeito) valem para a dupla em que o companheiro senta (GDD §8).

## Comece aqui (toda sessão)

1. **Carregue as skills `karpathy-guidelines` e `ponytail`** e siga-as até o fim da sessão. A skill `svg-concept-art` só vale na branch `pixel-art` (o pipeline de concept saiu daqui). A skill `caveman` (`.claude/skills/caveman`, nível `full`) economiza tokens no chat; código, commits e docs seguem em prosa normal.
2. **[PLAN.md §1.4.4](PLAN.md#144-pendências-para-a-10)** é o foco até a 1.0.0 comercial: as pendências abertas (arte, sistemas escondidos, LAN, build). O antigo BUGS.md foi removido em 2026-10-27.
3. **Grafo primeiro:** `uvx --from graphifyy==0.9.71 graphify query "<pergunta>"` (skill `graphify`); sem `graphify-out/`, gere com `bun run graph`.
4. **[PLAN.md](PLAN.md)** é a fonte da verdade (decisões, regras exatas do Truco §5, arquitetura §4, fases e checklists).
5. **[docs/agent-workflow.md](docs/agent-workflow.md)** (como trabalhar), **[docs/gdd-game-design-document.md](docs/gdd-game-design-document.md)** (design), **[docs/README.md](docs/README.md)** (índice), **[docs/architecture.md](docs/architecture.md)** (mapa do código).

## Programação: sempre Karpathy + Ponytail

Em **toda** tarefa de programação (código, scripts, CI, revisão, refatoração, depuração) siga a skill **`karpathy-guidelines`** junto com **`ponytail`** (nível `full`): pensar antes de codar e expor suposições, o mínimo de código que resolve, mudanças cirúrgicas, critério de sucesso verificável e verificado.

## Regras (detalhes em `.claude/rules/`)

| Arquivo | Conteúdo |
|---|---|
| [karpathy.md](.claude/rules/karpathy.md) | As 4 diretrizes obrigatórias em programação |
| [code-architecture.md](.claude/rules/code-architecture.md) | Phaser 4, `onKey`, lógica pura por turnos sem Phaser, eventos de domínio, onde ficam números/textos/cores, estilo |
| [content-and-assets.md](.claude/rules/content-and-assets.md) | Balanceamento, conteúdo data-driven, assets, concept art, sons, chaves no `.env` |
| [git-release-docs.md](.claude/rules/git-release-docs.md) | Docs no mesmo lote, Conventional Commits/SemVer, gates, **releases são marcos (16 até agora), não commits**, graphify, QA, CI/CD, remoto, worktrees (encerradas), site |
| [caveman.md](.claude/rules/caveman.md) | Estilo terso do chat (só o chat; arquivos em prosa normal) |
| [platform.md](.claude/rules/platform.md) | Electron (Steam) e Capacitor (Android), versão, origem do save, segredos |

Resumo mínimo:

1. Lógica pura (`src/logic`, `src/game`) sem Phaser e por turnos (`legalActions`/`apply`); números em `src/data`; textos em `src/i18n` (EN + PT-BR juntos); cores em `src/config/palette.ts`.
2. Gates antes de commitar: `bun run check`, `bun run typecheck`, `bun test`; `bun run build` e smoke antes de push. Nunca `--no-verify`.
3. Toda mudança atualiza PLAN.md, CHANGELOG.md (`[Unreleased]`) e o doc afetado no mesmo lote.
4. **Releases são poucos e em ordem** (`v0.1.0`, `v0.2.0`, `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.6.0`, `v0.7.0`, `v0.8.0`, `v0.9.0`, `v0.10.0`, `v0.11.0`, `v0.12.0`, `v0.13.0`, `v0.13.1`, `v0.14.0` e `v0.15.0`, depois patches pequenos `0.15.1` e minors `0.16.0`): cada commit atualiza `[Unreleased]` no CHANGELOG (escopo na mensagem: `feat(ui): …`); só o dev pede um release (seção `## [versão]` com as entradas juntas, bump do `package.json`, tag `v<versão>`). **Todo release gera o `.exe` do Windows na raiz do projeto** (`Zapatro-<versão>-win-x64.exe`, gitignored, `bun run exe`) para o dev testar. **Push na `main` e `bun run release` só quando o usuário pedir explicitamente.** Fluxo na skill `release-section` e em [docs/git-and-versioning.md](docs/git-and-versioning.md).
5. Estilo visual: princípios do Balatro (legibilidade, "juice") com identidade de boteco do interior paulista; nunca copiar arte, logo ou layout de terceiros.
6. Cascas nativas (`desktop/`, `mobile/`): o jogo não importa Electron/Capacitor; não mudar a origem do save (`app://truco-roguelite`); keystore e login Steam nunca no repo; `.env` nunca no git.

## Comandos

```text
bun install · bun run dev · bun run build · bun test · bun run typecheck · bun run check(:fix)
bun scripts/smoke.ts --url http://localhost:5191           # smoke headless (menu + partida com bot)
bun scripts/qa.ts --url http://localhost:5191              # QA por grupos (skill qa-global)
bun scripts/qa-web.ts --url http://localhost:5207 [--fast] # fluxos web no build de produção (vite preview)
bun scripts/sim.ts [--skip none|small|both] · bun run balance  # simulação (pular mesa) e gate D-39
bun scripts/store-art.ts · bun scripts/store-shots.ts      # artes e capturas de loja em docs/media/ (shots: build + vite preview 4173)
bun run graph                                              # atualiza o grafo (antes de todo push)
bun run release                                            # GitHub Release das tags novas (notas do CHANGELOG; builds e .exe no HEAD)
bun run exe                                                # Zapatro-<versão>-win-x64.exe na raiz (gitignored) para testar
bun run lan-server                                         # mesa LAN (Colyseus, porta 2567); docs/multiplayer.md
bun run electron:dev | electron:build | electron:smoke     # Steam (desktop/)
bun run android:run | android:debug | android:bundle       # Google Play (mobile/); JDK 21 + ANDROID_HOME
bun run site:build · bun run site:deploy                   # site (site/) → site/out → Vercel (truco.lekzera.xyz)
bun scripts/site-check.ts                                  # ensaio do deploy: site/out servido como na Vercel, antes do site:deploy
bun scripts/soak.ts --url http://localhost:5191            # soak RC1.2: 30 runs do bot, erros e heap
bun scripts/record-clips.ts --url http://localhost:5192    # clipes do trailer; depois cd trailer && bun run render
```

Dev server na porta 5191 (`bunx --bun vite --port 5191 --strictPort`; a 5173 pode estar ocupada). `?run=1&auto=1&speed=4` joga uma run inteira com o bot; `?skipMenu=1` abre a partida rápida (Truco puro até 12; `&goal=110` liga a pontuação); `?qa=1` expõe `window.__GAME__` em produção. Todos os atalhos de teste: **[test-hacks.md](test-hacks.md)**.

## Onde está cada coisa

| Preciso de… | Leia |
|---|---|
| Como trabalhar numa sessão | [docs/agent-workflow.md](docs/agent-workflow.md) |
| Mapa do código, camadas, eventos | [docs/architecture.md](docs/architecture.md) |
| Design e regras (GDD) | [docs/gdd-game-design-document.md](docs/gdd-game-design-document.md) |
| Números e fórmulas | [docs/balancing.md](docs/balancing.md) |
| Arte (Art Bible v3: personagens e fundos pintados, UI e cartas por código em `src/art/flat.ts`) | [docs/visual.md](docs/visual.md) |
| Design de jogo (lenses) e pesquisa de mercado | [docs/books/](docs/books/) + skill `art-of-game-design`; [docs/card-games-research.md](docs/card-games-research.md) |
| Sons | [docs/audio.md](docs/audio.md) + skill `game-audio-assets` |
| Decisões | [docs/decisions.md](docs/decisions.md) e PLAN §2 |
| Commits, versões, push, release | [docs/git-and-versioning.md](docs/git-and-versioning.md) + skill `release-section` |
| Build Steam / Android | [docs/desktop.md](docs/desktop.md), [docs/mobile.md](docs/mobile.md) + skill `platform-builds` |
| Multiplayer na rede local (Colyseus) | [docs/multiplayer.md](docs/multiplayer.md) |
| Lançamento nas lojas (Steam, Play, itch.io, Poki) | [docs/launch-game.md](docs/launch-game.md) |
| Site | [docs/site.md](docs/site.md) |
| Skills e ferramentas | [docs/tooling.md](docs/tooling.md) |

## Worktrees (PLAN §12.1)

- As worktrees `../jogo-truco-assets` (branch `assets`) e `../jogo-truco-qa` (branch `qa`) foram encerradas: todo o trabalho delas está na `main` e as branches foram apagadas (conferido em 2026-10-25). Hoje há só o repositório principal.
- Não crie worktree nova sem pedido explícito do dev. Se uma for criada, ela só mexe nos arquivos de que é dona e o fio principal integra com merge na `main` depois dos gates.

## Skills do projeto

`karpathy-guidelines` e `ponytail` (+ `-review`/`-audit`/`-debt`): sempre em código · `add-game-content`: Manha, Simpatia, Lance, chefe, parceiro, perfil de IA, coringa · `game-art-assets` / `game-audio-assets`: arte (pintada e por código) e ElevenLabs · `svg-concept-art`: só na branch `pixel-art` · `caveman`: estilo terso do chat (`full`) · `platform-builds`: Electron/Steam e Capacitor/Google Play · `release-section`: gates, docs, versão, commit, push e release a cada commit · `qa-global`: QA funcional · `graphify`: contexto do código · `art-of-game-design` e `pixel-logic`: livros de design e pixel art aplicados ao jogo. Também: Phaser 4 (`scenes`, `tweens`, …), `gd-*`/`gc-*`/`ccgs-*` ([docs/tooling.md](docs/tooling.md)).
