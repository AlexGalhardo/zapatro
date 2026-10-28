# Arquitetura

Stack: TypeScript strict · Vite 8 · **Phaser 4.2.x** (WebGL, antialias, sem `roundPixels`, sem Arcade) · Bun 1.4.2 (`bun:test`) · Biome 2. Plano de referência: [PLAN §4](../PLAN.md#4-arquitetura). Este doc descreve **o código de hoje**.

## Camadas (dependência só de cima para baixo)

```text
src/data/     números e conteúdo: teclas, resoluções, sfx, perfis de IA, personagens, fichas por carta
              (cards), Lances (lances), metas (championships), Manhas (manhas), modificadores (card-mods)
src/logic/    funções puras: save (schema v1), keybinds, rng, viewport/display, touch, fps-guard,
              voice-limiter; truco/ (regras), ai/ (decisão, Fama), score/ (scoreHand com steps, manhas.ts: condições e efeitos das Manhas/modificadores,
              Lances, meta, Queda, formatPoints); run/ (RunState: Campeonatos, loja, pacotes,
              Promessas, consumíveis, save por mão; `skipTable` pula Pequena/Grande e rende uma Promessa, que a loja só resgata se a mesa seguinte for vencida, P-08); meta.ts (feitos, destraves, Almanaque, estatísticas)
src/game/     match.ts: partida/mesa (IA, Fama, pontos, meta, quedas, chefes, parceiro, Manhas de regra, traços dos companheiros);
              traits.ts: traços por assento;
              run-table.ts: Match da mesa atual da run; run-sim.ts: bot de run (sim/balance/?auto)
   ── nada acima importa Phaser ──
src/art/      flat.ts (`tex()` desenha cada chave por código; as pinturas de public/assets/gfx/{card,portrait,back}
              e os PNG legados entram por `registerPortraits`), icons.ts (ícones vetoriais `icon.<nome>`,
              sinais `SIGNAL_EMOJI`), title.ts (título do menu)
src/scenes/BackdropScene.ts  fundo pintado sob toda tela (`setBackdrop`), escurecido por `BACKDROP_BRIGHTNESS`
src/scenes/   Boot → Menu ⇄ Settings → Keybinds; Menu → Almanac (Almanaque + Estatísticas); Menu → Run (parceiro, próxima mesa, loja, fim) ⇄ Table
              (fila de TableEvent; selo do sinal flagrado `signMark` no retrato do rival) ⇄ Pause; Menu → Rules (livro de páginas ilustradas com dados de src/data); Menu → Table (partida rápida: truco puro a 12, sem meta; `?goal=N` só para testes); Menu → Table + Tutorial
              (tutorial jogado: deal fixo em data/tutorial.ts; a mesa emite eventos `tutorial` e expõe `anchor()`)
src/view/     comfort.ts (acessibilidade: piscadas, tremor, 4 cores), stage.ts (palco 640×360 e fit da câmera)
src/core/     plataforma: storage (localStorage + .bak + quarentena), context (registry, persist),
              display/viewport (zoom inteiro), audio (buses + limitador), music, gamepad, virtual-keys, hotkeys,
              errors (overlay de erro, overlay de GPU travada `error.gpu*`, log), platform (Electron/Capacitor),
              steam (conquistas), poki (SDK), feel
src/ui/       MenuList (teclado + mouse + toque), Button (9-slice), item-card (item da loja/pacote como carta), nav (foco por setas/gamepad), toast (feitos), screen, panel, key-hint (selo de atalho), version-footer, fontes, texto nítido, touch, keys
src/i18n/     en.ts (fonte do tipo I18nKey) + pt-BR.ts (mesmas chaves, obrigatório pelo tipo)
src/config/   constants (LOGICAL_H, velocidades), ui (tokens de interface: RADIUS, SHADOW, DEPTH, MOTION),
              palette (boteco), features (VITE_DEMO, VITE_POKI), game-config (lista de cenas, Phaser 4 com
              `pixelArt: false`, antialias e sem `roundPixels`)
src/debug/    params.ts (URL de debug)
```

## Multiplayer LAN

`src/net/` (protocolo, visão girada e mascarada, cliente Colyseus), `lan/` (servidor e sala) e `RemoteMatch`; a `TableScene` em modo rede só mostra o que o servidor manda. Mapa e decisões em [multiplayer.md](multiplayer.md).

## Boot

`main.ts` lê os parâmetros de debug, carrega o save (`core/storage.ts`: principal → `.bak` → novo), aplica idioma, conforto, modo toque e resolução, espera as fontes e cria o `Phaser.Game`. `BootScene` carrega os sons que existem em `public/assets/audio/{sfx,music}/*.mp3` (lista `__ASSET_FILES__` gerada pelo Vite) e o `index.json` da arte; depois pré-desenha os placeholders de UI e abre o `Menu` (ou a mesa com `?skipMenu=1`). O `Boot` abre a primeira tela com `launch` e continua ativo, sem nada na tela, baixando em segundo plano os sons que a primeira mesa não usa (`LATER`: ambiências dos Campeonatos 2–8, `music.king`, vozes dos chefes), para o download inicial web ficar abaixo de 8 MB; tocar um som ainda não carregado é um no-op silencioso.

## Save

Envelope `{schemaVersion, savedAt, appVersion, checksum, payload}` (FNV-1a) em `localStorage['truco-roguelite.save']`; escrita segura (`.tmp` → valida → `.bak` → promove), quarentena de save ilegível, versão futura nunca sobrescrita, export/import `.json` (no Android pelos plugins Filesystem + Share). Payload v1: `settings`, `meta` (tutorial, destraves, feitos, Estacas, almanaque, estatísticas), `run` (snapshot gravado a cada mão, D-32).

## Arte

Toda chave visual passa por `tex(scene, key)`, que desenha a chave por código (`card.<rank>.<suit>`, `card.back.*`, `portrait.<id>.<expr>`, `boss.<id>`, `ui.*`, `bg.*`, ícones). Retratos: o `BootScene` carrega os PNG de `public/assets/gfx/portrait/` (gerados por `scripts/portraits.ts`) e `registerPortraits` os entrega ao desenho; sem PNG, vale o rosto desenhado. Híbrido pixel + vetor em `docs/visual.md`.

Arte de loja: `scripts/store-art.ts` desenha com o próprio jogo (cartas, retratos e wordmark de `src/art/flat.ts`) as capsules e as imagens de presskit em `docs/media/`; `scripts/store-shots.ts` grava as seis capturas 1920×1080 por idioma a partir do build de produção.

## Modo toque

`touchUi.on` (`src/ui/touch.ts`) decide no boot e ao mudar Configurações → Controles: texto pequeno maior, linhas de menu ≥ 28 px e dicas `.touch`.

## Desempenho medido (2026-10-25)

Meta (PLAN §9): 60 FPS estáveis em Chrome desktop 1080p; na 1.0, p95 do frame < 16,7 ms. Monitor de 60 Hz, então 60 é o teto.

**Como:** build de produção (`vite preview` na 5208, `?qa=1`), Chrome instalado (Playwright `channel: 'chrome'`, `headless: false`, `--enable-gpu --ignore-gpu-blocklist`), renderer confirmado por `WEBGL_debug_renderer_info`: `ANGLE (NVIDIA GeForce RTX 4060, D3D11)`. Cada tela amostrada 30 s por `requestAnimationFrame` (mesa com bot: 60 s); FPS médio = quadros ÷ tempo, 1% low = 1000 ÷ p99 do intervalo, mais `game.loop.actualFps`. Os quadros da contagem Fichas × Mult são os que caem dentro de `showEffect`/`countScore` da `TableScene`. Na loja, o bot é desligado quando a mesa termina para a tela ficar parada. Script local: `.gd/J/fps.ts`.

**Ressalva:** a CPU estava em 100% durante toda a medição (16 threads; cerca de 85% vindo de outros Chromium headless rodando QA em paralelo). Uma rodada a 2560×1440 com mais carga deu mesa parada a 41 FPS e mesa com bot a 23 FPS; a mesma configuração minutos depois deu 60 e 46. Os números abaixo são um piso, não a máquina limpa. Repetir sem outra carga antes do RC4.

| Tela | 1920×1080: FPS · 1% low · p95 | 2560×1440: FPS · 1% low · p95 |
|---|---|---|
| Menu | 59,0 · 52 · 17,0 ms | 60,0 · 56 · 16,9 ms |
| Mesa parada (vez do jogador) | 57,1 · 30 · 18,4 ms | 60,0 · 56 · 16,9 ms |
| Mesa com bot a 1× (`?skipMenu=1&seed=4&auto=1&speed=1&goal=110`) | 47,3 · 9 · 33,8 ms | 46,0 · 10 · 50,3 ms |
| Contagem Fichas × Mult (dentro da mesa com bot) | 54,7 · 20 · 33,3 ms | 46,8 · 10 · 50,1 ms |
| Loja (Balcão, parada) | 57,8 · 30 · 18,0 ms | 41,7 · 12 · 50,5 ms |

- Telas paradas batem os 60 quando sobra CPU, nas duas resoluções (menu e mesa parada a 60,0 em 2560×1440). A loja a 41,7 em 1440p saiu na parte da rodada com mais carga; não dá para atribuir à resolução sem repetir.
- A mesa com o bot é a única tela abaixo da meta: médio de 46–47 FPS e quadros de até cerca de 300 ms. Numa amostra de 15 s sem instrumentação, a 1080p, a mediana fica em 16,7 ms, o p95 em 17,6 ms e o pior quadro em 317 ms.

### Picos na mesa com o bot: perfil (2026-10-25)

Perfil de CPU (CDP `Profiler`, amostra a cada 0,5 ms, 60 s, build sem minificar) e Long Animation Frames (LoAF) na mesa com o bot, 1920×1080, GPU real. Os scripts locais são `.gd/J/prof.ts`, `.gd/J/gfx-count.ts` e `.gd/J/ab.ts`.

- **A maioria dos quadros longos não é JavaScript.** O LoAF de 147–178 ms tem 0–6 ms de script e o resto antes do render. São quadros atrasados por falta de CPU: outros processos, os Chromium headless de QA em paralelo, ocupavam de 100% a 190% dos 16 threads. Em 4 rodadas de 60 s com o build de produção e a CPU menos disputada, a mesa com o bot ficou em 59,7–60,0 FPS, com pior quadro de 22–34 ms e nenhum acima de 50 ms (uma rodada teve 3).
- **Nos trechos de JS acima de 50 ms**, por tempo inclusivo:
  - **36–65%: `GraphicsWebGLRenderer`.** O WebGL do Phaser 4 retriangula todo `Graphics` a cada quadro (`earcut`, `Path.addPoint`), mesmo os estáticos. A mesa tem 28 `Graphics` com 5.419 comandos no total; os maiores são o fundo estático da sidebar e do bloco HUD (1.148 comandos, `buildSidebar`) e os pontos do HUD (1.567, `hudGfx`).
  - **10–36%: coletor de lixo.** É lixo dessa mesma retriangulação.
  - **6–15%: `startTable`/`buildLayout`.** É a mesa sendo recriada a cada partida nova: um único quadro de cerca de 0,5 s com a CPU disputada, entre duas partidas.
  - **Cerca de 5%: `Text`/`updateText`.**
  - `canvasTex`, `tilted()`, `drawKey` e a IA não aparecem entre as 45 funções mais caras: não são a causa.
- **Correção proposta** (`TableScene.buildSidebar`, patch em `.gd/J/tablescene-panel.patch`): os 6 painéis da sidebar, o painel do HUD e as caixas Fichas/Mult viram `Image` de `panelTex` (`src/art/flat.ts`). O mesmo bloco arredondado com a sombra sólida é desenhado uma vez num canvas 2D no zoom da tela. Sobra um `Graphics` pequeno só para as bordas dos espaços de Manha. Resultado:
  - Comandos de `Graphics` por quadro: de 5.419 para 4.587.
  - CPU de `renderer.render()` na mesa parada, em 4 rodadas alternadas A/B na mesma sessão: de 2,14–2,24 ms para 1,62–1,67 ms (−25%); p95 de 4,7–5,7 ms para 3,8–4,1 ms.
  - Diferença visual: 93 de 2.073.600 pixels com diferença acima de 8/255 (antialiasing dos cantos) e nenhum acima de 40.
- **Próximo passo, se ainda faltar:** trocar os círculos e elipses do `hudGfx` (1.567 comandos) por imagens de bolinha cheia/vazia. Medido escondendo o objeto, o ganho é de cerca de 0,2 ms por quadro, menor que o dos painéis.
- O A/B de FPS da mesa com o bot não deu número confiável nesta sessão (com a CPU tomada por outros processos, o mesmo build variou de 8 a 52 FPS). Repetir `bun .gd/J/ab.ts <A> <B> 3` com a máquina livre.

### Site (Lighthouse 13.5.0, `site/out` local)

`bunx lighthouse@13.5.0` sobre `site/out` (build de 13:56, antes dos commits de texto e presskit das 14:04–14:44) servido por um `Bun.serve` local **sem compressão** (a Vercel serve gzip/brotli), com a CPU disputada (`benchmarkIndex` entre 342 e 1200).

| Página | Performance | LCP | CLS | TBT | FCP | A11y · BP · SEO |
|---|---|---|---|---|---|---|
| `/` mobile | 64 | 4,8 s | 0 | 750 ms | 1,2 s | 96 · 100 · 100 |
| `/` desktop | 99 | 0,9 s | 0 | 10 ms | 0,3 s | 100 · 100 · 100 |
| `/pt/` mobile | 84 | 4,5 s | 0 | 80 ms | 0,9 s | 96 · 100 · 100 |
| `/pt/` desktop | 98 | 1,0 s | 0 | 50 ms | 0,4 s | 100 · 100 · 100 |

- O TBT do mobile varia com a carga da máquina (750 ms com índice 342; 80 ms com 1200). O LCP de 4,5–4,8 s se repete: o elemento é o poster do trailer (`/img/trailer-poster-<lang>.webp`, 29 kB) e o Lighthouse aponta a falta de `fetchpriority="high"` nele. Sem compressão, os dois chunks do Next pesam 224 kB e 163 kB (564 kB no total), o que pesa no 4G simulado.
- Acessibilidade 96 no mobile: contraste de `strong.text-chips` no parágrafo do herói e `summary` do seletor de idioma com nome acessível diferente do texto visível (`label-content-name-mismatch`).
- Para valer como número de produção: medir em <https://truco.lekzera.xyz> pelo PageSpeed Insights.

#### Depois da limpeza de JS (2026-10-25, tarde)

Causa: o site é só HTML estático (nenhum componente precisa de React no navegador; o único `"use client"` era o `LangMenu`, para ler o caminho da página), mas cada página baixava 564 kB de JS do Next só para hidratar, e o CSS de 24 kB bloqueava a renderização. No 4G simulado, esse JS disputava a banda com o poster e empurrava o LCP para 4,5 s. Correções (sem dependência nova):

- `LangMenu` virou Server Component. Os links de idioma levam à home de cada idioma, e um script inline de uma linha (`#lang-paths`) os aponta para a mesma página.
- `scripts/site-build.ts` tira do HTML de `site/out` os scripts do Next, o payload RSC e os `preload` de script (fora `play/` e `demo/`). O build falha se aparecer um `"use client"`.
- CSS inline (`experimental.inlineCss`).
- Poster do trailer em 480/720/960 px com `srcset`/`sizes`, também no `preload`.

Mesma máquina e mesmo servidor sem compressão (`.gd/J/serve-site.ts`), `bunx lighthouse@13.5.0`, só performance, **mediana de 3 rodadas** por linha (script `.gd/L/lh.ts`). O "antes" é o build das 17:32, que já tinha o `preload` do poster com `fetchPriority` alta.

| Página | Performance | LCP | TBT | FCP | Bytes |
|---|---|---|---|---|---|
| `/` mobile | 82 → **100** | 4,53 → **1,50 s** | 154 → **33 ms** | 0,91 → 0,77 s | 577 → **95 kB** |
| `/` desktop | 99 → **100** | 0,85 → **0,36 s** | 0 → 0 | 0,25 → 0,21 s | 577 → 95 kB |
| `/pt/` mobile | 74 → **100** | 4,56 → **1,50 s** | 717 → **29 ms** | 1,11 → 0,77 s | 578 → 95 kB |
| `/pt/` desktop | 99 → **100** | 0,86 → **0,36 s** | 0 → 0 | 0,24 → 0,21 s | 578 → 95 kB |

O `benchmarkIndex` variou entre 1.148 e 3.040 (CPU disputada). CLS 0 em todos. As fontes (Rubik variável, subset latin, um `woff2` de 35 kB com preload) não mudaram. `bun scripts/site-check.ts`: 33/33.
