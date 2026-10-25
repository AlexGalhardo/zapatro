# Build desktop com Electron (Steam)

O jogo web (Vite, `dist/`) roda dentro do Electron, empacotado com **electron-builder** em pastas descompactadas (`--dir`), que é o formato que o SteamPipe sobe como depot. O subprojeto fica em [`desktop/`](../desktop/), com `package.json` e `bun.lock` próprios para as dependências pesadas (Electron, electron-builder) não entrarem no jogo.

> O executável de arquivo único (`bun run build:desktop`, `desktop/main.ts`) continua existindo para o GitHub Release/itch.io. Para a **Steam**, use o Electron: janela nativa, Chromium embutido (não depende do Chrome/Edge do usuário) e save em pasta própria.

## Como funciona

| Peça | Arquivo | O que faz |
|---|---|---|
| Processo principal | `desktop/main.js` | Janela 1280×720 (mín. 960×540), sem menu, fundo `#0a0b10`; serve o build pelo esquema `app://truco-roguelite/` |
| Empacotamento | `desktop/electron-builder.yml` | `--dir` para Windows/macOS/Linux; `../dist` vira `resources/web` |
| Build | `scripts/build-electron.ts` | `vite build` → `electron-builder --dir` com a versão do `package.json` raiz |
| Ícone | `desktop/build/icon.png` | 512 px, gerado por `bun run app-icons` (placeholder a partir do favicon) |
| SteamPipe | `desktop/steam/app_build.vdf` | Template do build com os 3 depots |

Decisões:

- **Esquema `app://` em vez de `file://`:** o save fica no `localStorage`, que é por origem; `app://truco-roguelite` é uma origem estável e segura, e os módulos ES + `fetch` dos assets funcionam como na web. O handler bloqueia caminhos fora da pasta do build.
- **Instância única:** duas janelas disputariam o mesmo `localStorage`; a segunda abertura só foca a primeira.
- **Save:** fica no perfil do Electron (`%APPDATA%\Zapaco` no Windows, `~/Library/Application Support/Zapaco` no macOS, `~/.config/Zapaco` no Linux). Exportar/importar save (Configurações) funciona como no navegador.
- **Segurança:** `contextIsolation` e `sandbox` padrão, sem `nodeIntegration`; o preload (`desktop/preload.cjs`) só expõe `trucoSteam.unlock` e `trucoShell.relaunch`; links `https://` abrem no navegador do sistema.
- **Tela cheia:** F11 do próprio jogo (Fullscreen API) também funciona no Electron.
- **WebGL por software:** o Chromium deprecou (Chrome 130+, remoção prevista para o 137) o fallback automático para o SwiftShader quando a GPU está bloqueada ([swiftshader.md](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md)); `desktop/main.js` liga `enable-unsafe-swiftshader` no macOS, no Linux e no `--smoke`. Medido no Electron 44 (2026-10-25): com GPU boa o jogo continua na GPU (ANGLE D3D11, RTX 4060); com `--disable-gpu` vira SwiftShader. No Windows o switch fica desligado porque o ANGLE já cai no WARP (Microsoft Basic Render Driver). O "unsafe" é o JIT do SwiftShader no processo da GPU; o jogo só carrega conteúdo próprio de `app://`.
- **Contexto WebGL perdido (B-14):** se o contexto não volta em 5 s (o Chromium desliga a GPU depois de crashes repetidos do processo dela), o jogo mostra "A placa de vídeo parou de responder" com Recarregar (`watchContextLoss` em `src/core/errors.ts`). Perdas curtas, que o Phaser restaura sozinho, não mostram nada. Depois que o Chromium desliga a GPU nem o SwiftShader nem recarregar a página trazem o WebGL de volta; por isso, no Electron, o Recarregar desse overlay reinicia o app (`restartApp` em `src/core/platform.ts` → `window.trucoShell.relaunch()` → IPC `app:relaunch` → `app.relaunch(); app.exit(0)`), e no navegador e no Android recarrega a página.
- **Sair:** o menu principal ganha "Sair" só no Electron (`isElectron()` em `src/core/platform.ts`, pelo user agent); chama `window.close()`, que fecha a janela e o app.

## Rodar localmente

Pré-requisito: Bun 1.4.2 (Node não é necessário; o Electron traz o próprio runtime).

```bash
bun install                 # jogo
bun run electron:install    # Electron + electron-builder (desktop/)
bun run electron:dev        # build web + abre a janela Electron
bun run electron:smoke      # abre sem janela e sai 0 quando o canvas do jogo existe
bun run electron:build      # build web + pacote em desktop/release/<os>-unpacked/
```

**`EPERM` ao renomear `win-unpacked.tmp`** (Windows): o Defender trava o `electron.exe` recém-extraído. Descompacte o zip do Electron da mesma versão (`%LOCALAPPDATA%\electron\Cache\…\electron-v<versão>-win32-x64.zip`) numa pasta e rode com `ELECTRON_DIST_WIN=<pasta>` (e `ELECTRON_DIST_LINUX` para o Linux): o `build-electron.ts` passa `-c.electronDist` e o electron-builder pula a extração.

O electron-builder só empacota para o SO atual sem configuração extra. Os três SOs são gerados no CI (`release.yml`, job `electron`) e anexados ao GitHub Release como `zapatro_<versão>_<os>_<arch>.zip`.

QA nas 11 resoluções mais usadas na Steam (Hardware Survey): `bun scripts/qa-devices.ts --set desktop` com o dev server rodando — ver [steam-monitor-resolution-market-research.md](steam-monitor-resolution-market-research.md).

**`.exe` portátil para testar (todo release):** `bun run exe` gera `Zapatro-<versão>-win-x64.exe` na **raiz do projeto** (ignorado pelo git; só a versão atual fica lá). Um arquivo só, dois cliques. `bun run release` e o `release.yml` (job `electron` do Windows) fazem o mesmo e o anexam ao GitHub Release como `zapatro_<versão>_windows_amd64.exe`. O save fica em `%APPDATA%\Zapaco` (`desktop/main.js` mantém a pasta antiga).

Executáveis gerados: `release/win-unpacked/Zapatro.exe`, `release/linux-unpacked/truco-roguelite`, `release/mac-arm64/Zapatro.app`. Rode o executável com `--smoke` para a mesma checagem do CI.

## CI/CD

- `ci.yml` → job **electron** (Linux, Windows, macOS): build web, `electron-builder --dir`, smoke do app empacotado (Linux sob `xvfb-run` com `--no-sandbox`; macOS com assinatura ad hoc).
- `release.yml` (tag `v*`) → job **electron**: zip de cada pasta, anexado ao GitHub Release.

## Publicar na Steam (Steam Direct)

Passo a passo completo (conta, depots, página da loja, SteamPipe, lançamento): **[launch-game.md](launch-game.md)**.

### Steamworks: conquistas e Steam Cloud (B5.1)

- **Ligar:** preencher `"steamAppId"` em `desktop/package.json` com o App ID (ou `STEAM_APP_ID=480` para testar com o Spacewar e a Steam aberta). Com `null`, a integração fica desligada; sem a Steam aberta, `desktop/steam.js` registra `steam: off` e o jogo segue normal (DRM-free).
- **Como funciona:** `desktop/preload.cjs` expõe `window.trucoSteam.unlock(ids)`; o jogo chama em todo feito novo (`src/ui/toast.ts`) e, no boot, com todos os feitos do save (`src/main.ts`), para quem jogou antes da integração. O processo principal ativa a conquista com `steamworks.js` 0.4.0 (binários nativos fora do asar: `asarUnpack` no `electron-builder.yml`).
- **Conquistas no Steamworks** (*Stats & Achievements*): o **API Name** de cada conquista é o id do feito (`src/data/feats.ts`); ícones a partir de `art-src/` e textos de `feat.<id>.name`/`.desc` no i18n.

| API Name | Nome (EN) | Nome (PT-BR) |
|---|---|---|
| `primeiraMao` | First hand | Primeira mão |
| `cemPontos` | Hundred | Centena |
| `milPontos` | Thousand | Milhar |
| `dezMil` | Ten thousand | Dez mil |
| `doze` | Twelve! | Doze! |
| `ferro` | Iron fist | Mão de ferro |
| `lixo` | Trash to treasure | Lixo de luxo |
| `blefe` | Poker face | Cara de paisagem |
| `queda` | Queda | Queda |
| `virada` | Comeback | Virada |
| `onze` | Hand of 11 | Mão de 11 |
| `mesaPerfeita` | Clean table | Mesa limpa |
| `chefe` | Boss down | Chefe no chão |
| `valentao` | Not scared | Sem medo |
| `professor` | Schooled | Lição aprendida |
| `sortuda` | Luck runs out | Acabou a sorte |
| `campeonato2` | On the road | Pé na estrada |
| `campeonato4` | Club member | Sócio do clube |
| `campeonato6` | Regional fame | Fama regional |
| `reiDoTruco` | Rei do Truco | Rei do Truco |
| `comTonhao` | Big friend | Amigão |
| `comDonaCida` | Granny knows | A vó sabe |
| `comZe` | Smooth operator | Malandragem |
| `comJuninho` | The kid made it | O moleque chegou |
| `doInterior` | Countryside champion | Campeão do interior |
| `doDinheiro` | Money talks | Dinheiro fala |
| `estaca4` | Getting serious | Ficando sério |
| `estaca8` | Untouchable | Intocável |
| `infinito` | No end | Sem fim |
| `rico` | Loaded | Endinheirado |
| `lendario` | Legend | Lenda |
| `baralhoMagro` | Thin deck | Baralho magro |
| `baralhoGordo` | Fat deck | Baralho gordo |
| `cemMaos` | Regular | Freguesia |
| `trucador` | Truco caller | Trucador |
| `mentiroso` | Liar | Mentiroso |
| `fregues` | Back again | De volta |

- **Steam Cloud (Auto-Cloud, D-28, sem código):** em *Steam Cloud → Root Paths*, raiz `WinAppDataRoaming` subpasta `Zapaco/Local Storage`, padrão `*`, recursivo (no Linux, `LinuxXdgConfigHome` + `Zapaco/Local Storage`; no macOS, `MacAppSupport` + `Zapaco/Local Storage`). O save fica no `localStorage` da origem `app://truco-roguelite`, guardado nessa pasta pelo Electron.

### Pendências conhecidas

- **Assinatura de código:** Windows sem certificado mostra aviso do SmartScreen só fora da Steam (via Steam não aparece). macOS sai com assinatura ad hoc; para distribuir fora da Steam (e evitar alertas do Gatekeeper) é preciso conta Apple Developer + notarização (`mac.identity`/`notarize` no electron-builder).
- **Artes da loja (capsules, library):** dependem do nome final (Q-01; a pesquisa de nome saiu do repositório). O ícone do app é o paus com raio, flat (`art-src/app-icon.svg`).
- **OneDrive:** `bun run electron:build` falha com `EPERM ... rename win-unpacked.tmp` quando o repositório está numa pasta sincronizada pelo OneDrive. Gere fora dela: `bun scripts/build-electron.ts -- -c.directories.output=C:/caminho/fora/release`.
