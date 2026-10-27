# Código e arquitetura

- **Phaser 4, não 3.** Consulte as skills Phaser em `.claude/skills/` antes de confiar em exemplos da web.
- **Teclado:** sempre `onKey` (`src/ui/keys.ts`), nunca `keyboard.on` direto (bug de tecla dobrada do Phaser 4.2.1). Eventos de cena com `onSceneEvent` (listeners acumulam entre restarts).
- **Lógica pura** (`src/logic/`, `src/game/`) **não importa Phaser**. Phaser só em `src/scenes`, `src/view`, `src/core`, `src/ui`, `src/art`.
- **Simulação por turnos** (PLAN D-51/D-52): toda decisão (humano, parceiro, rivais, bot) é uma `Action` validada por `legalActions(state, seat)` e aplicada por `apply(state, action, rng)`, que devolve estado novo + `TableEvent[]`. A cena anima a fila de eventos; a IA só enxerga `observe(state, seat)`.
- **Aleatório só por `Rng` com seed** (`src/logic/rng.ts`); nada de `Math.random()` na lógica.
- **Pontuação** (`scoreHand`) devolve `steps` ordenados; o total é sempre derivado dos `steps` (a UI anima os mesmos passos).
- **Onde cada coisa mora:** números de gameplay só em `src/data/` (espelhados em `docs/balancing.md`); textos só em `src/i18n/` (**EN e PT-BR sempre juntos**); cores em `src/config/palette.ts`.
- **Render (Art Bible v3, pintado + vetor):** `pixelArt: false`, antialias, sem `roundPixels`; zoom inteiro pela altura (`LOGICAL_H = 360`); cartas 48×64 lógicos. **Resoluções-alvo:** 1920×1080 (47,91% dos jogadores, zoom 3) e 2560×1440 (27,04%, zoom 4), ambas 16:9: layout, capturas e QA visual partem delas; outras proporções só não podem quebrar.
- **Texturas:** toda chave visual passa por `tex(scene, key)` (`src/art/flat.ts`), que desenha a chave por código, rasterizada no zoom da tela; as pinturas (`portrait/<id>.webp`, `card/<id>.webp` como `charcard.<id>`, `back/*.webp`) e os PNG em pixel ainda usados (chefes, ícones) entram como bitmaps por `registerPortraits`, chamado de novo quando o `LATER` do `BootScene` termina. Fundos de tela: `BackdropScene` + `setBackdrop`, escurecidos por `BACKDROP_BRIGHTNESS`; nenhuma tela pinta o próprio fundo cinza.
- **Companheiros:** o elenco é `src/data/companions.ts`; traços (vantagem e defeito) valem para a dupla em que o companheiro senta e são aplicados em `Match` (`src/game/traits.ts`); o sorteio dos 3 candidatos é `src/logic/run/draw.ts` e o escolhido nunca é rival.
- **Estilo:** Bun no lugar de npm/node; Biome v2, TAB largura 4, aspas simples. TypeScript estrito, sem `any`, retorno explícito em funções exportadas.
- **Modo toque:** texto pequeno, alvos, dicas e botões de celular passam por `src/ui/touch.ts` (`touchUi`, `uiPx`, `byMode`); dica nova de teclado precisa da variante `.touch` em EN e PT-BR.
- **Cascas nativas** (`desktop/`, `mobile/`): o jogo nunca importa Electron nem Capacitor; recurso que só existe no navegador (download, `window.open`, parâmetros de URL) precisa funcionar ou degradar nas duas. Ver `platform.md`.
- **Builds:** `VITE_DEMO=1` (demo, Campeonato 1 até o primeiro chefe) e `VITE_POKI=1` (Poki SDK) em `src/config/features.ts`.
- URL de debug (`src/debug/params.ts`, PLAN §10.4): `?seed`, `?skipMenu`, `?auto`, `?speed`, `?vira`, `?hand`, `?score`, `?reveal`, `?debug`; `?qa=1` expõe `window.__GAME__` em produção.
