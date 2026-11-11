# QA global: sistemas funcionais

Checklist de QA do Zapatro: o que os scripts cobrem, como rodar, o que continua manual e o registro das rodadas. A skill `qa-global` (`.claude/skills/qa-global/SKILL.md`) é quem executa este roteiro.

## Objetivo

Testar o jogo de ponta a ponta como um QA faria, antes de um release ou push, e depois de qualquer mudança em telas, menus, botões, entrada (teclado, mouse, toque, controle), mesa, pontuação, loja, pacotes, save ou HUD. Os testes unitários e o gate de balanceamento cobrem as regras por baixo; este documento cobre o que o jogador vê e clica.

Regra do projeto: rodadas curtas. Nada de soak ou QA de horas numa rodada normal (o soak tem seu próprio script, abaixo).

## Pré-requisitos

- Dependências instaladas (`bun install`) e Playwright com Chromium.
- Um dos dois servidores:
  - dev server na porta 5191: `bunx --bun vite --port 5191 --strictPort`. A 5173 pode estar ocupada;
  - build de produção: `bun run build` e depois `bunx --bun vite preview --port 5191 --strictPort`.
- A suíte acrescenta `?qa=1` às URLs, o que expõe `window.__GAME__` também no build de produção.
- Sem `?qa=1`, o `__GAME__` não está disponível e os checks que o usam falham.

## Ordem recomendada

```bash
bun run check && bun run typecheck && bun test        # gates estáticos e regras
bun run balance                                        # só se algum número de gameplay mudou (gate D-39)
bun scripts/smoke.ts --url http://localhost:5191       # menu e uma partida do bot
bun scripts/qa.ts --url http://localhost:5191          # todos os grupos
bun scripts/qa.ts --url http://localhost:5191 --only table,eleven   # enquanto corrige
```

`--only` recebe nomes de grupo separados por vírgula, sem espaço.

## Grupos do `scripts/qa.ts`

Cada grupo roda num contexto de navegador novo (localStorage limpo) e termina com dois checks automáticos: "no exception" (se o corpo do grupo lançou erro) e "no console errors" (qualquer erro de console ou de página).

| Grupo | O que cobre | Checks (texto exato do `t.check`) |
|---|---|---|
| `menu` | Abertura do menu e Nova run | `menu opens`; `New run opens the run screen` |
| `pause` | Pausa com Esc | `Esc pauses`; `table is paused`; `Esc resumes` |
| `table` | Mesa: B-01, sinal, truco, jogada | `a missing card texture stays straight instead of crashing (B-01)`; `S opens the signal picker`; `a signal spends one of your signals`; `T calls truco`; `1 plays the first card`; `the match moves on to the next hand` |
| `eleven` | Mão de 11 (placar 11-4) | `score 11 deals a mão de 11`; `the eleven panel shows` (só se a vez for sua); `the team decides and the hand goes on` |
| `iron` | Mão de ferro (placar 11-11) | `11 × 11 deals the iron hand`; `your cards are face down`; `no truco in the iron hand` |
| `score` | Pontuação com `?goal` | `a won hand is counted and the shown total matches scoreHand`; `points add up at the table` |
| `manhas` | Cinco slots de Manha e disparo com popup | `?manhas shows 5 Manha slots`; `a Manha fires with a popup`; `Manha steps are part of the counted total` |
| `run` | Bot joga uma run (mesa, loja, próxima mesa) | `the bot plays a run: table, shop, next table` |
| `continue` | Save por mão e Continuar (D-32) | `the table of the run opens`; `the hand is saved`; `Continue resumes the table`; `reload re-deals the same hand (D-32)` |
| `end` | Fim da partida rápida e jogar de novo | `the match ends and shows the end panel`; `the quick match ends at 12 tentos, with no points goal`; `play again starts a new match` |
| `settings` | Configurações sobre o menu | `Settings opens over the menu`; `the menu waits paused`; `Esc goes back to the menu` |
| `rules` | Regras e páginas | `Rules opens`; `the rules text shows`; `→ turns the pages`; `Esc goes back to the menu` |
| `tutorial` | Tutorial jogado | `Tutorial opens with a step card`; `the table waits while the card shows`; `Next shows the following step`; `Esc skips back to the menu`; `skipping marks the tutorial as done` |
| `newrun` | Escolha de parceiro e início da run | `New run asks for a partner`; `picking a partner starts the run at Championship 1`; `the next table shows its goal`; `and the rivals`; `Play opens the table` |
| `shop` | Loja: compra, venda, reordenação, renovar, falta de dinheiro | `buying a Manha takes the money and fills a slot`; `▶ moves the first Manha right`; `◀ moves a Manha left`; `selling returns half the price`; `reroll costs $5 and redraws the offers`; `without money nothing is bought and the error shows`; `Next table leaves the shop` |
| `pack` | Pacote com 4 opções (GD-001) | `buying a pack opens its options`; `the pick screen shows`; `all 4 pack options fit the stage`; `taking a card adds it to the deck and closes the pack` |
| `skip` | Pular mesa dá Promessa; chefe não pula | `skipping the small table gives a Promise and goes to the big one`; `the Promise is shown`; `the boss table cannot be skipped` |
| `boss` | Chefe e regra antes da mesa | `the boss and its rule show before the table`; `the table knows its boss`; `the Cartomante hides the vira in the 1st trick` |
| `save` | Recarregar no meio da mão (D-32) | `reload in the middle of a hand re-deals the same 3 cards (D-32)` |
| `runend` | Derrota de mesa encerra a run | `a lost table ends the run`; `the run summary shows`; `Main menu goes back and clears the run` |
| `touch` | Toque numa carta (viewport 844×390, mobile) | `tapping a card plays it` |
| `deck` | Controle (gamepad falso, perfil Steam Deck) | `A on the menu starts a new run`; `the controls show the pad buttons`; `D-pad right + A plays a card` |

Observações:

- O grupo `deck` usa um gamepad falso (`navigator.getGamepads`, mapping `standard`). Ele prova o caminho do controle, não um controle físico.
- Alguns checks dependem de sorte do seed. Os parâmetros `?seed`, `?score`, `?manhas` e `?goal` fixam o cenário; por isso `t.open` recebe query string.
- A partida rápida é truco puro a 12, sem meta de pontos. O `?goal=N` liga a pontuação roguelite e serve para testes; o jogador não o vê.

Para adicionar um check, veja a seção "Adding a check" da skill `qa-global`. Ao adicionar, acrescente a linha na tabela acima.

## Outros scripts

| Script | O que faz | Como rodar |
|---|---|---|
| `scripts/smoke.ts` | Abre o menu, joga uma partida com o bot a 4× e falha em erro de console ou de página | `bun scripts/smoke.ts --url http://localhost:5191 [--seconds 40] [--shot out.png]`. O padrão da URL é 5173: passe `--url` sempre |
| `scripts/qa-web.ts` | Bateria de fluxos web no build de produção: menu → nova run → parceiro → seleção → mesa → loja → próxima mesa; continuar run (recarregar no meio da mão); Configurações (cada slider e toggle, idioma EN↔PT, Controles); Almanaque (6 abas); Regras (todas as páginas); Tutorial completo; Pausa (continuar, Configurações, sair); partida rápida até 12; 3 runs do bot e a demo até o fim; save ausente, corrompido (volta do `.bak`) e de versão futura; resize ao vivo em 5 tamanhos; perda de foco (pausa e áudio); mudo e slider de Música (música e ambiência). Cada grupo também falha com erro ou aviso novo de console e HTTP ≥ 400 | `bun run build` e `bunx --bun vite preview --port 5207 --strictPort`; depois `bun scripts/qa-web.ts [--url http://localhost:5207] [--only flow,settings] [--fast] [--out shots/qa-web]`. `--fast` pula as runs inteiras e a demo (minutos cada; a bateria completa leva ~16 min). Captura de cada grupo com falha e `report.json` em `--out` |
| `scripts/site-check.ts` | Ensaio do deploy do site: serve `site/out` como a Vercel (index.html por pasta) e confere rotas 200, `noindex` em `/play/` e `/demo/`, `/play/` sem e com `?qa=1`, partida rápida a 4× até 12, `/demo/` é a demo, 0 erros de console e 0 HTTP ≥ 400 (inclusive o áudio adiado) | `bun run site:build` e depois `bun scripts/site-check.ts [--port 5211]`. Ver [site.md](site.md) |
| `scripts/qa-browsers.ts` | Chrome, Edge e Firefox sobre o build de produção: tempo de carregamento, sem rolagem, WebGL, FPS na mesa, erros e respostas 4xx/5xx. Imprime uma linha JSON por navegador | `bun scripts/qa-browsers.ts [baseUrl=http://localhost:4173] [outDir]`. Exige `vite preview` na 4173, Chrome e Edge instalados e `bunx playwright install firefox` uma vez |
| `scripts/qa-devices.ts` | Capturas das telas principais (menu, settings, controls, table, signals, pause) em 11 celulares (`--set mobile`) ou 11 resoluções Steam (`--set desktop`) | `bun scripts/qa-devices.ts --set mobile\|desktop [--url http://localhost:5191] [--out qa-devices] [--only id,id] [tela…]`. Saída: `<out>/<set>/<device>/` e `<out>/<set>/index.md` |
| `scripts/qa-android.ts` | APK de debug num emulador ou celular USB, pelo Playwright sobre adb: ponte do Capacitor, botão voltar = Esc, paisagem imersiva e save. Fluxo: menu, mesa rápida, voltar = Pausa, tocar numa carta, Home e voltar | `bun scripts/qa-android.ts [--serial emulator-5556] [--no-install] [--out qa-android]`. Exige `bun run android:debug`, `ANDROID_HOME` e um dispositivo ligado |
| `scripts/soak.ts` | Teste de estabilidade (PLAN RC1.2): o bot joga runs seguidas em várias páginas. Falha em erro de console ou se o heap pós-GC crescer mais de 2 MB | `bun scripts/soak.ts --url http://localhost:5191 [--runs 30] [--pages 6] [--minutes 40]`. Leva ~25 min; não rode em rodada normal |
| `scripts/store-shots.ts` | Seis capturas 1920×1080 da loja por idioma, do build de produção | `bun run build` e `vite preview` na 4173; depois `bun scripts/store-shots.ts [url] [en\|pt-BR]`. Grava em `docs/media/store-shot-0N-*-<lang>.png` (ver [store-page.md](store-page.md)) |

Também fazem parte do gate: `bun run check`, `bun run typecheck`, `bun test`, `bun run balance` (D-39) e `bun run electron:smoke` (casca desktop).

## Checklist manual

Estes itens não têm script. Rodar antes de cada release que mexa em áudio, tela, entrada ou plataforma.

### Áudio (15 min)

Ouvir de ponta a ponta, com fones e com alto-falante:

1. Menu: música do menu toca.
2. Mesa: música da mesa (rádio com viola) e ambiência do Campeonato 1.
3. Truco: o grito de "TRUCO!" e o som do pedido.
4. Contagem: tique das fichas e das garrafas (`mult`, `xmult`) na ordem das Manhas.
5. Loja: sons de compra e de venda.
6. Chefe: música de chefe e voz do chefe.

Depois:

- Em "Configurações → Mudo (tudo)", a ambiência e a música param, e os efeitos também.
- Trocar de aba ou minimizar a janela pausa a música; voltar retoma.
- No build web, o primeiro clique libera o áudio (política do navegador). Antes do clique, a tela abre sem som, sem erro.

### Entrada

- Gamepad físico: navegar no menu, jogar uma carta, pausar, abrir Manhas. Conferir os selos de botão (`△`, `✕`).
- Steam Deck, a cerca de 30 cm: legibilidade do texto, da mão de cartas e do HUD na tela de 1280×800.
- Teclado: todos os atalhos mostrados nos selos funcionam; o botão em foco mostra a tecla que confirma.
- Toque em celular real: alvos de pelo menos 44 px, sem toque acidental em botões vizinhos.

### Plataforma

- Android real (não só emulador): o `qa-android.ts` roda no emulador; rodar também no aparelho, com o APK assinado do release.
- Tela cheia: botão da tela e tecla F11 no desktop; no Android, imersivo sem barra.
- Electron: `bun run electron:smoke` mais uma passada manual da janela (minimizar, redimensionar, sair).

### Telas

- Abrir o build em 1280×720, 1920×1080 e em um celular 20:9. Procurar sobreposição de texto, legibilidade da mão e do HUD, balões de sinal e ritmo da contagem.
- Registrar achados no registro abaixo, não em outro lugar.

## Registro

### 2026-10-25

Checks que já existem em `scripts/qa.ts` e vieram da revisão do game director:

- `scripts/qa.ts` ganhou o check `all 4 pack options fit the stage` (GD-001, pacote de 4 opções cabe no palco 640 px).
- `scripts/qa.ts` ganhou `the quick match ends at 12 tentos, with no points goal` (grupo `end`): a partida rápida termina em 12 sem meta; `?goal` só liga a pontuação de teste.
- `scripts/qa.ts` ganhou `a missing card texture stays straight instead of crashing (B-01)` (grupo `table`): a carta sem textura fica reta, sem exceção.

Estado desta entrada: o roteiro foi escrito a partir do código. Nenhuma rodada de `qa.ts` foi registrada aqui; ao rodar, anote a data, o comando, o total de checks e as falhas.

Implementação e pendências do review do game director: [game-director-implementation.md](game-director-implementation.md).

### 2026-11-11 · linha de base do ROADMAP (R0.1)

Commit `3783613` (branch `improve/2026-11-next`, versão `0.19.0`), Windows 11, Bun 1.4.4.

| Comando | Resultado |
|---|---|
| `bun run check` | sem erros, 22 avisos (266 arquivos) |
| `bun run lint:md` | 0 problemas em 60 arquivos |
| `bun run typecheck` | sem erros de tipo em 212 arquivos |
| `bun test` | 340 passam, 4 pulados, 0 falhas (344 testes em 47 arquivos, 56 s) |
| `bun run build` | concluído (`dist/` gerado) |
| `bun scripts/smoke.ts --url http://localhost:5191` | partida rápida até o fim com o bot, `no console errors` |
| `bun run balance` | PASS nas 3 seeds: bot bom 7,4 · 8,6 · 7,0% (faixa 5 a 20%), bot aleatório 0,0%, 7,74 · 7,74 · 7,68 mãos por mesa |

Armadilha encontrada: com worktrees de agentes em `.claude/worktrees/`, o servidor de dev do diretório principal recarregava a página a cada edição delas e o smoke estourava o tempo. `vite.config.ts` passou a ignorar essa pasta (`server.watch.ignored`); o `markdownlint` também a ignora.

### Modelo para as próximas entradas

```text
AAAA-MM-DD · comando: bun scripts/qa.ts --url … · total: N checks · falhas: 0
Achados: (item, grupo, passo) — link para o commit de correção
Checklist manual: áudio ✓/✗ · entrada ✓/✗ · plataforma ✓/✗ · telas ✓/✗
```
