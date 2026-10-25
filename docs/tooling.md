# Ferramentas, skills e APIs

Skills em `.claude/skills/` (nível de projeto), travadas em `skills-lock.json` (restaurar: `bunx skills experimental_install`).

## Skills

| Skill | Use quando… |
|---|---|
| **Phaser 4 (24)**: `game-setup-and-config`, `scenes`, `cameras`, `sprites-and-images`, `animations`, `render-textures`, `filters-and-postfx`, `particles`, `tweens`, `groups-and-containers`, `input-keyboard-mouse-touch`, `scale-and-responsive`, `loading-assets`, `audio-and-sound`, `text-and-bitmaptext`, `graphics-and-shapes`, `geometry-and-math`, `v4-new-features`, `v3-to-v4-migration`, … | Qualquer dúvida de API do Phaser. Phaser 4 ≠ Phaser 3 |
| **`game-art-assets`** | Gerar/trocar qualquer asset visual com o PixelLab e colocá-lo no jogo |
| **`add-game-content`** | Adicionar Manha, modificador, Simpatia, Lance, chefe, parceiro, perfil de IA, baralho, Estaca |
| **`release-section`** | Fechar um grupo de tarefas: gates, docs, CHANGELOG, versão, commit, push, GitHub Release (inclusive local, sem Actions) e site |
| **`svg-concept-art`** | Concept/mockup de uma tela → SVG (pixels2svg) → tela do jogo |
| **`qa-global`** | QA funcional automatizado (`scripts/qa.ts`) e documento de QA |
| **`game-audio-assets`** | Mapear sons reaproveitados; gerar no ElevenLabs só com pedido |
| **`graphify`** | Grafo de conhecimento do código em `graphify-out/` (gitignored). Consultar antes de explorar arquivos (`uvx --from graphifyy==0.9.71 graphify query "…"`, `path`, `explain`); **atualizar antes de todo push** com `bun run graph` (AST, sem LLM). `bun run graph` tenta `uvx` (versão fixa 0.9.71) e, sem `uv` no PATH, cai para o `graphify` instalado no PATH (ex.: `~/.local/bin/graphify`, 0.9.77 nesta máquina em 2026-10-25; R-02); `graphify query "…"` funciona igual com o binário instalado |
| **`ponytail`** (`-review`, `-audit`, `-debt`, `-help`, `-gain`) | Sempre em tarefas de código (nível `full`): YAGNI, reuso do que já existe, stdlib/plataforma antes de dependência, menor diff na causa raiz. `ponytail-review` revisa excesso num diff, `ponytail-audit` no repo, `ponytail-debt` lista os `ponytail:` deixados |
| **`art-of-game-design`** / **`pixel-logic`** | Lenses de Schell e regras de Pixel Logic aplicadas ao Zapatro (guias em `docs/books/`); vindas do farm-vs-aliens |
| **`caveman`** | Estilo terso do chat (nível `full`, `/caveman` com lite, full ou ultra) para economizar tokens. Só o chat: código, comentários, commits e docs seguem em prosa normal. Instalada em `.claude/skills/caveman` (JuliusBrussee/caveman, MIT) |
| **`karpathy-guidelines`** | Sempre em tarefas de programação, junto com `ponytail`: pensar antes de codar, simplicidade, mudanças cirúrgicas, critério verificável (resumo em `.claude/rules/karpathy.md`) |
| `platform-builds` | Build Electron (Steam) e Capacitor (Android/Google Play): comandos, armadilhas, release |
| `grilling` | Entrevistar o usuário sobre decisões de design |

### Skills de gamedev de terceiros (curadas; ver `.claude/skills/THIRD_PARTY.md`)

Use quando a tarefa pedir; em conflito, vale o `CLAUDE.md` (Phaser **4**, Bun, `src/logic` puro, i18n, PixelLab/ElevenLabs).

| Quando | Skill |
|---|---|
| Juice, hit-stop, shake, feedback | `gd-game-feel`, `gc-game-designer` |
| IA dos rivais e do parceiro (perfis, decisão) | `gd-game-ai` |
| Run, economia, permadeath, save | `gd-roguelike`, `gd-save-systems` |
| Input, UI/HUD, menus | `gd-input-systems`, `gd-game-ui-ux` |
| Performance (animações, contagem de pontos, celular de entrada) | `gd-performance-optimization`, `ccgs-perf-profile` |
| Áudio (mixagem, ducking, música adaptativa) | `gd-audio-design` |
| Balanceamento das fórmulas/dados | `ccgs-balance-check` |
| QA, testes Playwright, bugs | `gc-game-qa`, `ccgs-qa-plan`, `ccgs-bug-report`, `ccgs-playtest-report` |
| Escopo (evitar inchaço do PLAN) | `ccgs-scope-check` |
| i18n EN/PT-BR | `ccgs-localize` |
| Release e publicação | `ccgs-release-checklist`, `ccgs-launch-checklist`, `gd-itch-publish`, `gd-steam-publish` |

Removidas em 2026-10-15 por não servirem a um jogo de cartas por turnos (sem física, mapa, câmera móvel, shader próprio ou Phaser 3): física Arcade/Matter, tilemaps, curvas, `gd-physics-tuning`, `gd-level-design`, `gd-rpg`, `gd-camera-systems`, `gd-procedural-gen`, `gd-ai-behavior-trees-utility-ai`, `gd-shader-programming`, `gd-prototype-fast`, `gd-create-game-assets`, `gd-phaser-core`, `gc-phaser` (Phaser 3), `gc-game-deploy`, `gc-monetize-game`, `gc-design-game`, `gc-qa-game`, `gc-add-feature`, `gc-game-architecture`, `gc-review-game`, `gc-improve-game`, `canvas-design`, `find-skills`, `agent-browser` e `grill-me` (as três últimas existem no escopo do usuário).

## APIs e MCPs

| Serviço | Status | Notas |
|---|---|---|
| **PixelLab** | ✅ API v2 via `scripts/lib/pixellab.ts` (`PIXELLAB_API_TOKEN` no `.env`); MCP `pixellab` (`https://api.pixellab.ai/mcp`) no escopo de usuário | Plano Tier 2 (5.000 gerações/mês). `GET /balance` antes de lotes |
| **ElevenLabs** | ✅ chave `ELEVENLABS_API_KEY` no `.env` | SFX, música, vozes. Scripts `scripts/el-*.ts` |
| Phaser Game Agent MCP | **não usar** | Pago/nuvem |

`.env` e `TODO.md` estão no `.gitignore`. Nunca commitar chaves nem colá-las em docs.

## Bibliotecas

- Runtime: `phaser` (^4.2).
- Dev: `typescript`, `vite`, `@types/bun`, `@biomejs/biome`, `markdownlint-cli2` (Markdown), `sharp` (atlas/contact sheets), `playwright` (QA cross-browser).

## Scripts

| Comando | O quê |
|---|---|
| `bun scripts/smoke.ts --url http://localhost:5191 [--seconds 35] [--shot out.png]` | Smoke headless (Playwright): menu e, quando a mesa existir, partida com bot a 4×; falha em qualquer erro de console. Gate antes de promover `dev` → `main` e job `smoke` do CI |
| `bun scripts/pl-*.ts` | Geração PixelLab (worktree `assets`, ver docs/visual.md) |
| `bun scripts/el-sfx.ts` / `bun scripts/el-music.ts` | ElevenLabs (só com pedido do usuário) |
| `bun scripts/qa-devices.ts --set mobile\|desktop [--only id,id] [telas…]` | Capturas de menu, configurações, jogo, loja e personagem nos 11 celulares mais vendidos no Brasil ou nas 11 resoluções mais usadas na Steam (`scripts/lib/devices.ts`); falha com erro de console. Saída em `qa-devices/` |
| `bun scripts/qa-android.ts [--serial …] [--no-install]` | QA no APK real (emulador `gridbound_s20fe` (nome herdado do AVD local) ou celular): ponte Capacitor, plugins, voltar, velocidade, capturas em `qa-android/` |
| `bun run build:demo` / `bun run build:poki` | Build da demo (Campeonato 1, até o primeiro chefe) e do Poki (demo + SDK, < 8 MB) |
| `bun scripts/sim.ts [--runs 500] [--bot good\|random] [--stake N]` / `bun run balance` | Runs headless (taxa de vitória, Campeonato alcançado, mãos por mesa); o balance falha fora da D-39 |
| `bun scripts/qa.ts --url http://localhost:5191 [--only table,eleven]` | QA global por grupos (menu, pause, table, eleven, iron, score, manhas, run, continue, end); PASS/FAIL por item, falha com erro de console |
| `bun scripts/shot.ts --url http://localhost:5191 --out shots [--size WxH] [--dpr 3 --mobile] [tela…]` | Capturas: menu, settings, controls, table, signals, pause, end (e eleven/iron); falha com erro de console |
| `bun run app-icons` | Ícones do app a partir de `art-src/app-icon.svg`; fundo animado do menu (`art-src/raw/menu` → `bg.menu*`) |
| `bun scripts/qa-browsers.ts [url]` | Smoke do build (`vite preview`) em Chrome, Edge e Firefox: menu → mesa, FPS, erros |

**Porta do dev server:** a 5173 pode estar ocupada por outro projeto nesta máquina. Use `bunx --bun vite --port 5191 --strictPort`.

## CI/CD e executáveis

- `.github/workflows/ci.yml` — push/PR em `dev`/`main`: `format:check`, `lint`, `typecheck`, `bun test`, markdownlint, mensagens de commit do PR (`.githooks/commit-msg`), smoke Playwright no build de produção, Electron empacotado + `--smoke` (Linux; Windows e macOS só na `main`) e APK Android de debug.
- `.github/workflows/release.yml` — tag `v*` (ou manual, sem publicar): gates, zips web (completo e demo `VITE_DEMO=1`), zips Electron por SO, AAB/APK Android, SBOMs, `checksums.txt` assinado (cosign) com proveniência e GitHub Release no formato do vukem (docs/git-and-versioning.md; pre-release quando a versão tem `-`).
- `.github/dependabot.yml` — Bun e GitHub Actions, semanal.
