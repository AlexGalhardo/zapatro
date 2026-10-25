# Skills de terceiros

Instaladas em 2026-09-27 (cópia curada; só `SKILL.md` + referências, **sem** hooks, settings, agentes ou projetos de exemplo). Cada skill ganhou um prefixo da origem, uma nota no topo explicando como se encaixa neste projeto, e entrada no `skills-lock.json`.

| Prefixo | Repositório | Commit | Licença | Skills |
|---|---|---|---|---|
| `gd-` | [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | `d4b0e35` | Apache-2.0 | 10 (game feel, IA, UI/UX, input, performance, áudio, roguelike, save, itch.io, Steam) |
| `gc-` | [PlayableIntelligence/game-creator](https://github.com/PlayableIntelligence/game-creator) | `4e64b83` | MIT | 2 (`gc-game-designer`, `gc-game-qa`) |
| `ponytail` | [dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail) | `e3ba2aa` | MIT | 6 (`ponytail`, `-audit`, `-debt`, `-gain`, `-help`, `-review`) — modo "senior dev preguiçoso": YAGNI, reuso, menor diff |
| `karpathy-guidelines` | [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) (cópia do plugin `forrestchang/andrej-karpathy-skills`) | `2c60614` | MIT | 1 — diretrizes obrigatórias em programação (pensar antes, simplicidade, mudanças cirúrgicas, objetivo verificável) |
| `caveman` | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | `2d9a159` | MIT | 1 — estilo terso do chat (níveis `lite`/`full`/`ultra`) para economizar tokens; só o `SKILL.md`, sem hooks |
| `ccgs-` | [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | `7ed2c3e` | MIT | 9 (balanceamento, playtest, perf, QA, release, localização) |

Ajustes locais: nome com prefixo; nota de projeto no topo; nas `ccgs-*`, removidas a injeção de config via `yaml-helper.sh` e a permissão de Bash para ele (script do CCGS que não existe aqui).
Não instaladas (fora do stack): Unity, Unreal, Godot, Roblox, Three.js, Bevy, Pygame, LÖVE, gêneros não relacionados, e o restante do CCGS (sprints/épicos/agentes de estúdio). Para trazer outra: copie a pasta, aplique o mesmo prefixo/nota e registre aqui.

Poda de 2026-10-15: removidas as skills sem uso num jogo de cartas por turnos (física, tilemaps, níveis, RPG, câmera, geração procedural, behavior trees, shaders, protótipo, Phaser 3, deploy/monetização genéricos e duplicatas). Lista em `docs/tooling.md`; `skills-lock.json` acompanha.
