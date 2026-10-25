# Melhorar jogos Phaser v4 para Steam e mobile

> **Pesquisa de mercado e guia prático** para desenvolvimento de jogos 2D pixel art com Phaser v4 (engine), Electron (desktop/Steam) e Capacitor (Android/iOS). Estado das fontes: **1º de outubro de 2026**. Escrito para um desenvolvedor solo brasileiro que constrói um RPG de turno em browser (inspirado em Chrono Trigger, Final Fantasy e Tibia Online) usando Claude Code, PixelLab MCP e ElevenLabs.

**Como ler a evidência neste documento.** Cada afirmação é de um destes tipos:

| Marca | Significado |
|---|---|
| (sem marca) | Fato com fonte citada no próprio texto |
| **(inferência)** | Dedução ou boa prática geral, sem fonte direta nas pesquisas |
| **(não verificado)** | Informação plausível, mas que não foi confirmada em fonte |
| **(fonte secundária)** | Blog, agregador ou vendor que repete dado de terceiros |
| **(v3-era)** | Informação de Phaser 3 ou de versões antigas; testar antes de confiar |
| **(autoral, não testado)** | Template ou snippet escrito para este guia, ainda não validado em projeto real |

---

## Sumário

1. [Resumo executivo: 10 prioridades](#resumo-executivo)
2. [Stack técnica](#1-stack-técnica)
   - [1.1 Phaser v4: estado e migração](#11-phaser-v4-estado-e-migração)
   - [1.2 Configuração para pixel art](#12-configuração-para-pixel-art)
   - [1.3 Performance](#13-performance)
   - [1.4 Arquitetura de projeto](#14-arquitetura-de-projeto)
   - [1.5 Electron e Steamworks](#15-electron-e-steamworks)
   - [1.6 Capacitor (mobile)](#16-capacitor-mobile)
   - [1.7 Arquitetura compartilhada multiplataforma](#17-arquitetura-compartilhada-multiplataforma)
3. [Game design](#2-game-design)
4. [Prompts para LLMs](#3-prompts-para-llms)
5. [UI/UX/HUD multiplataforma](#4-uiuxhud-multiplataforma)
6. [Roadmap e checklists](#5-roadmap-e-checklists)
7. [Lacunas, conflitos e riscos](#6-lacunas-conflitos-e-riscos)
8. [Fontes](#7-fontes)

---

## Resumo executivo

O caminho mais barato e seguro é **um único código Phaser 4 em TypeScript, com lógica de jogo pura separada das cenas e uma camada fina de plataforma**, empacotado em Electron para a Steam e em Capacitor para mobile. O gargalo real nos casos públicos (Drawize, Desktop Heroes) não foi o Phaser, e sim a integração com Steamworks e o overlay ([Phaser.io: Desktop Heroes](https://phaser.io/news/2026/04/desktop-heroes-phaser-electron-steam)). No mercado, o desafio é visibilidade: **a mediana de receita bruta vitalícia de um lançamento Steam em 2025 ficou perto de US$1.136** (fonte secundária, [SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/median-steam-game-2026)), então design com hook claro e wishlists cedo importam tanto quanto código.

As 10 prioridades, em ordem de retorno esperado:

1. **Fixe Phaser 4.2.1 (último `latest` visto) e proíba APIs do v3** no CLAUDE.md, com lint. Maior fonte de quebra: tutoriais e plugins de v3 ([GitHub releases](https://github.com/phaserjs/phaser/releases)).
2. **Escolha a resolução base agora** (ex.: 320x180 ou 640x360, que dão escala inteira em 1080p, 1440p e 4K, aritmética direta, **inferência**) e use `render.pixelArt: true` sem zoom fracionário, conforme o [Pixel Art Guide oficial](https://cdn.jsdelivr.net/npm/phaser@4.2.0/docs/Phaser%204%20Pixel%20Art%20Guide/Phaser%204%20Pixel%20Art%20Guide.md).
3. **Defina um hook em uma frase** que vá além de "pixel art + RPG". Sea of Stars é outlier de estúdio; para solo, nicho e hook (ex.: ATB com posicionamento, sessões curtas) é o caminho **(inferência)** ([GameDiscoverCo](https://newsletter.gamediscover.co/p/which-genres-have-ruled-steam-a-new)).
4. **Publique a página Steam cedo e lance uma demo de 30 a 90 min meses antes de um Next Fest.** Demos publicadas meses antes ganharam cerca de 2,5x as wishlists (fonte secundária, [SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/do-steam-demos-increase-sales)). O Next Fest de outubro/2026 já fechou; mire o de fevereiro ou junho de 2027 (datas não confirmadas).
5. **Isole Steamworks no processo main do Electron** (IPC/preload) e trate o `steamworks.js` como dependência de risco: o npm está parado em 0.4.0 desde ago/2024 ([npm](https://registry.npmjs.org/steamworks.js)).
6. **No Capacitor 8, use `SystemBars` + `env(safe-area-inset-*)`** e assets com caminhos relativos ([Capacitor: SystemBars](https://capacitorjs.com/docs/apis/system-bars)); teste em aparelho real, porque o iOS limita `requestAnimationFrame` a 60 fps ([WebKit 294338](https://bugs.webkit.org/show_bug.cgi?id=294338)).
7. **Projete a UI de batalha para foco por teclado/gamepad primeiro**, depois toque. Steam Deck exige glifos corretos, teclado na tela via API Steam e texto de no mínimo 9 px em 1280x800 ([Steamworks](https://partner.steamgames.com/doc/steamdeck/compat)).
8. **Dê ao Claude Code um jeito de verificar o trabalho** (typecheck, vitest, screenshot Playwright). É a maior alavanca documentada ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)).
9. **Registre todo asset gerado por IA** (PixelLab, ElevenLabs, texto) em um arquivo único. A Steam exige divulgar conteúdo pré-gerado que o jogador vê ou ouve, mas não código escrito com assistente (fonte secundária, [TBreak](https://tbreak.com/steam-ai-disclosure-policy-update-developers/); confirmar no Steamworks).
10. **Instrumente telemetria mínima e acessibilidade básica desde o protótipo**: modo Wait/Active, remapeamento, tamanho de texto, não depender só de cor, salvar a qualquer momento ([Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/?p=12)).

---

## 1. Stack técnica

### 1.1 Phaser v4: estado e migração

**Estado atual.** O registry do npm mostra `latest` = **4.2.1 (2026-07-09)**; datas: 4.0.0 em 2026-04-10, 4.1.0 em 2026-04-30, 4.2.0 em 2026-06-19. A tag `beta` ainda aponta para 4.0.0-rc.7. Nenhuma release posterior a 4.2.1 foi encontrada até 2026-10-01 ([npm registry](https://registry.npmjs.org/phaser); [GitHub releases](https://github.com/phaserjs/phaser/releases)). A última v3 é 3.90.0 (2025-05-23).

> **Conflito resolvido: data do lançamento estável.** As notas trazem 10/04 (registry npm, consultado por API), 14/04 ([GameDev.net](https://gamedev.net/news/2759-phaser-4-released/)) e 16/04 (nota sobre artigo de migração, sem data confirmada na própria página). Este guia usa **2026-04-10 como data de publicação no npm** (fonte mais direta). As demais datas provavelmente refletem anúncios e artigos posteriores **(inferência)**. Para decisões técnicas a diferença é irrelevante.

**O que mudou (resumo útil para pixel art):**

| Área | Mudança v3 para v4 | Fonte |
|---|---|---|
| Renderer | Reescrito; pipelines viram **Render Nodes** (`run()`/`batch()`); pipelines custom precisam ser reescritos | [Migration Guide](https://raw.githubusercontent.com/phaserjs/phaser/HEAD/changelog/v4/4.0/MIGRATION-GUIDE.md) |
| FX e máscaras | Unificados em **Filters** (listas `internal` e `external`); `preFX/postFX` e `BitmapMask` removidos | idem |
| Tint | `setTintFill()` removido; usar `setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)` | idem |
| Iluminação | `setPipeline('Light2D')` vira `setLighting(true)`; lighting quebra batches | idem; [skill v4-new-features](https://cdn.jsdelivr.net/npm/phaser@4.2.0/skills/v4-new-features/SKILL.md) |
| DynamicTexture/RenderTexture | Comandos bufferizados: **é obrigatório chamar `.render()`** | Migration Guide |
| Matemática | `Math.TAU` agora é 2π (era π/2 por bug); `Math.PI2` removido; novo `Math.PI_OVER_2` | idem |
| Geometria | `Geom.Point` removido (usar `Math.Vector2`); `Struct.Set/Map` viram `Set/Map` nativos | idem |
| Removidos | `Mesh`, `Plane`, Camera3D/Layer3D, `Create.GenerateTexture`, `TextureManager.generate` | idem |
| Pixel art | **`roundPixels` agora é `false` por padrão** (v3 era `true`) | idem |
| Texturas comprimidas | Orientação GL: recomprimir com flip Y; PNG/JPG são tratados automaticamente | idem |
| Canvas renderer | Existe, mas deprecado | idem |
| Novos | SpriteGPULayer, TilemapGPULayer, 6 modos de tint, Gradient, Noise, CaptureFrame, Stamp; v4.2: cone lights, Mesh2D, stencil, renderer de Spine | [Release notes 4.0.0](https://github.com/phaserjs/phaser/discussions/7274); [4.2 post](https://phaser.io/news/2026/07/phaser-4-2-spine-renderer-mesh2d-stencil) |

**Esforço de migração.** A equipe afirma que "most projects clear it in an afternoon" e recomenda ficar no v3 só se houver pipelines WebGL customizados pesados ([Phaser 3 vs 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4); [Migrating](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know)). Isso é afirmação do próprio projeto (vendor); o caso HEXSTORM migrou em maio/2026 e relatou pouco trabalho, sem problemas de performance, mas a arte é pintada à mão, não pixel art ([Phaser.io](https://phaser.io/news/2026/05/hexstorm-tears-of-arcadia-is-now-on-phaser-v4)).

**Pegadinhas de migração (checklist):**

- [ ] Trocar `setTintFill` (flash branco de dano é comum em pixel art)
- [ ] Revisar `roundPixels` (provavelmente a mudança visual mais notável **(inferência)**)
- [ ] Chamar `render()` em DynamicTexture/RenderTexture
- [ ] Revisar usos de `Math.TAU`
- [ ] Plugins de terceiros que usam pipelines/postFX/`Light2D`: tratar como incompatíveis até confirmar **(inferência)**
- [ ] Spine: os plugins embutidos 3/4 não são mais atualizados; usar o plugin oficial da Esoteric

> **Conflito não resolvido: estilo de import.** O artigo oficial "How to update Phaser 4" diz que `import Phaser from 'phaser'` deve virar `import * as Phaser from 'phaser'` ([Phaser.io](https://phaser.io/news/2026/06/how-to-update-phaser-4-to-the-latest-version-without-breaking-your-project)), mas o README da 4.2.1 ainda mostra `import Phaser from 'phaser';` ([README](https://cdn.jsdelivr.net/npm/phaser@4.2.1/README.md)). **Recomendação:** teste no seu bundler (Vite + TS) e fixe a escolha no CLAUDE.md para o Claude não alternar.

**Tamanho do bundle (README 4.2.1):** build completo 1,29 MB raw / 345 KB gzip; só Arcade 1,18 MB / 313 KB gzip. Não há comparativo oficial numérico com a v3.90.

**TypeScript:** definições em `types/` do pacote (`"typeRoots": ["./node_modules/phaser/types"]`). Não há notas oficiais sobre mudanças de tipos v3 para v4 (lacuna).

### 1.2 Configuração para pixel art

O guia oficial define **duas estratégias mutuamente exclusivas** ([Pixel Art Guide 4.2.0](https://cdn.jsdelivr.net/npm/phaser@4.2.0/docs/Phaser%204%20Pixel%20Art%20Guide/Phaser%204%20Pixel%20Art%20Guide.md)):

| Estratégia | Config | Quando usar | Trade-off |
|---|---|---|---|
| Rounded pixel art | `render: { pixelArt: true }` (equivale a `antialias:false, antialiasGL:false, roundPixels:true`) | Sem escala/rotação/zoom fracionário | Pode haver leve "pixel flicker"; zero cor borrada |
| Smooth pixel art | `render: { smoothPixelArt: true }` (ou `texture.setSmoothPixelArt(true)` por textura) | Escala, rotação ou zoom livres | Elimina flicker; aceita pequenas regiões de cor misturada |

O guia manda **não misturar** as duas; misturar configs por textura quebra batches, então prefira configuração global ([Pixel Art Guide](https://cdn.jsdelivr.net/npm/phaser@4.2.0/docs/Phaser%204%20Pixel%20Art%20Guide/Phaser%204%20Pixel%20Art%20Guide.md)).

**Causas de sub-pixel/blur listadas pelo guia:** física movendo sprites em frações; sprites de tamanho ímpar com origin 0.5 (ex.: 63 px); escala não inteira; rotação fora de múltiplos de 90°. Defesas: posições e scroll inteiros; origin 0 para texto e sprites de tamanho ímpar.

`GameObject#vertexRoundMode` aceita `'off' | 'safe' | 'safeAuto' (padrão) | 'full' | 'fullAuto'`; `full` arredonda sempre (efeito "PS1 wobble" ao rotacionar). O arredondamento é só de render; a posição lógica continua fracionária.

**Filtros úteis para pixel art** (aplicados à câmera, combinam com qualquer técnica): `Blocky` (`cameras.main.filters.external.addBlocky({ size: 8 })`, preserva cores), `Pixelate`, `Quantize` (limita paleta, com dithering) e `GradientMap` (palette swap).

**Tilemaps:** TilemapGPULayer com filtro NEAREST preserva pixel art; limites: 1 tileset por layer, só ortogonal, até 4096x4096 tiles, WebGL-only ([skill tilemaps](https://cdn.jsdelivr.net/npm/phaser@4.2.0/skills/tilemaps/SKILL.md)). Sobre seams/bleeding: um thread de fórum relatou que 4.0.0-beta.5 eliminou bleeding e jitter, que existiam em 3.80/3.87 ([Discourse](https://phaser.discourse.group/t/tile-bleeding/15124)); **não há relatos pós-4.0.0 estável** nas notas (lacuna). Extrusão de 1 a 2 px em tilesets continua sendo a defesa clássica **(v3-era; inferência)**.

**Config base sugerida (autoral, não testado):**

```ts
// Resolução nativa baixa + zoom inteiro. Valide no seu bundler e dispositivos.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 320,
  height: 180,
  render: { pixelArt: true },          // não misture com smoothPixelArt
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: Phaser.Scale.MAX_ZOOM        // maior zoom inteiro que cabe no parent
  },
  input: { gamepad: true }
};
```

Notas: `MAX_ZOOM` (-1) é o "maior zoom inteiro que cabe no parent" e o zoom é CSS, sem mudar a resolução do canvas; o próprio guia oficial de scale mostra exemplo pixel art com `mode: FIT, autoCenter: CENTER_BOTH, zoom: MAX_ZOOM` ([skill scale-and-responsive](https://unpkg.com/phaser@4.2.1/skills/scale-and-responsive/SKILL.md)). Se precisar de zoom fracionário, rotação ou câmera com lerp suave, use `smoothPixelArt` em vez de `pixelArt` **(inferência)**. Integer scaling estrito para além do `MAX_ZOOM` e câmera follow pixel-perfect (arredondar `scrollX/Y` após lerp) vêm de conhecimento v3 e **não foram confirmados em fonte v4**.

### 1.3 Performance

- **SpriteGPULayer:** até 100x mais rápido que sprites individuais, 1M+ sprites em 1 draw call, ~168 bytes/sprite; ideal para chuva, neve, multidões e fundos animados; **não** é para personagens com lógica por frame; textura única; para pixel art, texturas power-of-two evitam seams ([post oficial](https://phaser.io/news/2026/05/phaser4-spritegpulayer-performance)). Números são do próprio projeto (vendor), sem benchmark independente.
- **TilemapGPULayer:** cada layer vira 1 quad; custo por pixel de tela, não por tile; após editar tiles, chamar `gpuLayer.generateLayerDataTexture()` ([skill tilemaps](https://cdn.jsdelivr.net/npm/phaser@4.2.0/skills/tilemaps/SKILL.md)).
- **Lighting quebra batches:** agrupe objetos com e sem luz. **Filtros não suportam mipmaps** ([4.1.0 Salusa](https://editor.phaser.io/news/2026/04/phaser-4-1-0-salusa-release)).
- **Contexto WebGL:** o v4 declara restauração de contexto embutida ([notas 4.0.0](https://github.com/phaserjs/phaser/discussions/7274)), relevante para WebView.
- **Atlas:** o formato Phaser Compact Texture (PCT) promete textos "90-95% menores que JSON", mas o gzip HTTP reduz a diferença e a spec não tem tooling documentado ([spec](https://unpkg.com/phaser@4.2.1/docs/Phaser%20Compact%20Texture%20Atlas%20Format%20Specification/Phaser%20Compact%20Texture%20Atlas%20Format%20Specification.md)). Para um solo, JSON/PNG normal basta **(inferência)**.
- **Boas práticas clássicas (v3-era, não verificadas em fonte v4; inferência):** um atlas por cena, pooling com `Group`, sem alocação em `update()`, Arcade em vez de Matter, clamp do delta (~50 ms) após aba inativa, áudio destravado por gesto do usuário.

**Lacuna:** não há benchmarks independentes de v4 em Android WebView ou iOS WKWebView.

### 1.4 Arquitetura de projeto

- **Scaffolding oficial:** `npm create @phaserjs/game@latest` (templates JS/TS com Vite, Webpack, Parcel etc.) ([README](https://cdn.jsdelivr.net/npm/phaser@4.2.1/README.md)).
- **Skills oficiais no pacote npm:** 28 arquivos Markdown de guia por subsistema (`scenes`, `events-system`, `data-manager`, `loading-assets`, `scale-and-responsive`, `physics-arcade`, `audio-and-sound` etc.). São docs offline e contexto para o Claude Code ([unpkg](https://app.unpkg.com/phaser@4.2.1/files/skills)).
- **Estrutura sugerida (padrão comunitário, inferência):** `Boot` -> `Preloader` -> `MainMenu` -> `Game` + `UI` (cena paralela via `scene.launch`); dados em JSON tipado; comunicação por EventEmitter tipado; save com campo `version` e migrações; i18n por chaves JSON; fontes bitmap; testes de lógica pura em Vitest e smoke test com Playwright.

### 1.5 Electron e Steamworks

**Versões.** Electron `latest` = **44.5.1 (2026-09-30)**; linhas suportadas 42, 43 e 44; a política oficial suporta as 3 últimas majors, com major a cada 8 semanas ([npm](https://registry.npmjs.org/electron); [Timelines](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)). Planeje atualizações periódicas.

**Wrappers Steamworks, comparação:**

| Opção | Estado | Pontos fortes | Riscos |
|---|---|---|---|
| `steamworks.js` (ceifa) | npm `latest` 0.4.0 (2024-08-06); `package.json` ainda testa com Electron 24.2.0; prebuilt para win32-x64, linux-x64, darwin x64/arm64 | Mais usado e documentado; typings; conquistas, cloud, rich presence, input, workshop; sem compilar | **Sem leaderboards na API** (inferido pela ausência em `client.d.ts`); manutenção em 2026 **não verificada** (GitHub inacessível); compatibilidade com Electron 42-44 sem fonte |
| `steamworks-ffi-node` | 0.11.3 em 2026-09-24; SDK 1.64; Koffi FFI; leaderboards incluídos | Publicações recentes; Win/macOS/Linux x64/ARM64 | Mantenedor único; **overlay em Electron é EXPERIMENTAL**; exemplo oficial também usa `nodeIntegration: true` |
| `greenworks` | npm `latest` 0.1.0 (2016) | Usado em casos antigos (Drawize) | Abandonado; exige binários por versão de Electron |

Fontes: [npm steamworks.js](https://registry.npmjs.org/steamworks.js), [package.json](https://raw.githubusercontent.com/ceifa/steamworks.js/main/package.json), [client.d.ts](https://raw.githubusercontent.com/ceifa/steamworks.js/main/client.d.ts), [npm steamworks-ffi-node](https://registry.npmjs.org/steamworks-ffi-node), [overlay doc](https://raw.githubusercontent.com/ArtyProf/steamworks-ffi-node/main/docs/STEAM_OVERLAY_INTEGRATION.md), [npm greenworks](https://registry.npmjs.org/greenworks).

> **Conflito/risco: manutenção do steamworks.js.** O pacote npm está parado há cerca de 14 meses; o SDK embutido provavelmente é antigo **(inferência)**. Antes de enviar, confira a versão do `steam_api` em `sdk/redistributable_bin`. A Desktop Heroes (Phaser + Electron, Steam) relata que não há SDK JavaScript oficial e que as bibliotecas de terceiros são "frequentemente desatualizadas e mal mantidas" ([Phaser.io](https://phaser.io/news/2026/04/desktop-heroes-phaser-electron-steam)). Decisão sugerida **(inferência)**: comece com `steamworks.js` para conquistas e use Auto-Cloud; avalie `steamworks-ffi-node` só se precisar de leaderboards ou SDK recente.

**Setup documentado do `steamworks.js`** (README): renderer com `contextIsolation: false` e `nodeIntegration: true`, `steamworks.init(appId)`, e `require('steamworks.js').electronEnableSteamOverlay()` no fim do `main.js`; em produção copiar os binários de `sdk/redistributable_bin/{DISTRO}` para a raiz do build.

**Alternativa mais segura (inferência, testar):** rodar Steamworks só no processo main e expor métodos via `contextBridge`/IPC, padrão usado pelo Drawize com Greenworks. Não há fonte confirmando que o overlay funciona bem assim com `steamworks.js`. Se mantiver `contextIsolation: false`, carregue **somente conteúdo local próprio**, com CSP restritiva **(inferência)**.

**Steam Cloud:** Auto-Cloud (sem código, com roots como `WinMyDocuments`, `LinuxHome`, `MacAppSupport`) ou Cloud API; é obrigatório configurar quota de bytes e de arquivos no Steamworks e publicar; 100 MB máximo por escrita ([Steamworks Cloud](https://partner.steamgames.com/doc/features/cloud)).

**Steam Input:** jogos sem integração nativa recebem emulação XInput automática, então `navigator.getGamepads()` funciona; ISteamInput direto só é necessário para action sets, háptico e gatilhos adaptativos ([Steamworks Steam Input](https://partner.steamgames.com/doc/features/steam_controller)).

**Overlay: flags e o aviso de versão.** A técnica documentada é `--in-process-gpu` (permite à Steam achar o processo de render) e `--disable-direct-composition` (evita overlay todo branco), configuráveis nas Launch Options ([electron-steam-notes](https://github.com/JamesMoulang/electron-steam-notes)). **Atenção: essas notas são de Greenworks + Electron 11.4 e o Drawize usou Electron 16 (v3-era).** Não há confirmação de que ainda se aplicam ao Electron 42-44; `--ignore-gpu-blacklist` causou crashes no Drawize e foi abandonado. Trate como ponto de partida e **teste o overlay em Windows e Steam Deck** (`app.commandLine.appendSwitch(...)` antes de `app.whenReady()` é dedução, não fonte). Em WebView2 (base do Tauri no Windows) o overlay é incompatível ([Construct blog](https://construct.net/fr/blogs/ashleys-blog-2/trying-show-steam-overlay-1861)).

**Snippet de referência (autoral, não testado):**

```js
// main.js
const { app, BrowserWindow } = require('electron');
app.commandLine.appendSwitch('in-process-gpu');             // overlay Steam (validar na sua versão)
app.commandLine.appendSwitch('disable-direct-composition');  // overlay branco no Windows (validar)

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280, height: 720, fullscreen: true, backgroundColor: '#000',
    show: false, autoHideMenuBar: true,
    webPreferences: { backgroundThrottling: false /* + preload/contextBridge se isolar Steam */ }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile('dist/index.html');
});
```

**Segurança e performance (docs oficiais):** `contextIsolation` é padrão desde Electron 12 e sandbox desde 20; use CSP (`script-src 'self'`) e **Electron Fuses** (desabilitar `runAsNode`, `nodeCliInspect`); carregue módulos sob demanda, empacote assets localmente e chame `Menu.setApplicationMenu(null)` cedo ([Security](https://www.electronjs.org/docs/latest/tutorial/security); [Performance](https://www.electronjs.org/docs/latest/tutorial/performance)).

**Outras armadilhas documentadas:**

- `steam_appid.txt` na raiz em dev e no app empacotado, senão "Steam is running, but steam_appid.txt is missing".
- Antivírus: assinar o executável é a correção principal; evite packers e ofuscação (fonte genérica, [Bugnet](https://bugnet.io/blog/why-does-antivirus-flag-my-game)).
- Linux: relatos de tela preta e necessidade de `--no-sandbox` com Chromium/CEF antigo ([Choice of Games](https://forum.choiceofgames.com/t/linux-issues-on-steam/107741/11)); Electron recente corrigiu escala HiDPI.
- Build: electron-builder + GitHub Actions ([Phaser.io, mar/2025](https://phaser.io/news/2025/03/publishing-web-games-on-steam-with-electron)). Windows x64 cobriria "95%+ dos usuários Steam" segundo o Drawize (afirmação de um caso, não estatística da Valve).
- **(inferência, não verificado):** atualização via SteamPipe em vez de auto-updater; `asarUnpack` para `.node` e `steam_api*.dll`; `crashReporter`/Sentry; macOS exige assinatura e notarização.
- Nenhuma medição citável de RAM, tempo de startup ou latência de input de Phaser em Electron.

**Alternativas:** Electron é "what most folks use"; NW.js é apontado por alguns devs como mais simples e "game-friendly", com muitos jogos Steam publicados, mas exige recompilar addons nativos a cada versão ([Three.js Discourse](https://discourse.threejs.org/t/electron-js-the-best-choice-for-converting-a-web-based-game-into-a-desktop-application/92710); [JS Legend Dev](https://jslegenddev.substack.com/p/exploring-the-various-ways-to-make); [Construct forum](https://www.construct.net/en/forum/construct-3/general-discussion-7/refocus-export-direction-183136)). Tauri/Neutralino usam webview do SO (renderização inconsistente, overlay incompatível no Windows). **Conclusão (inferência):** Electron é a escolha mais segura para pixel art com orçamento enxuto; o custo é tamanho de instalação e RAM.

**Steam Deck/Linux:** relato único (2023/24, **possivelmente desatualizado**) de WebGL no Chrome em Desktop Mode bem pior que no Mac Mini M1 ([Babylon.js forum](https://forum.babylonjs.com/t/steam-deck-linux-and-chrome-performance/47555)). Não há relato confiável de Electron nativo em Game Mode/gamescope, nem exemplo encontrado de jogo Electron "Verified". Rodar a build Windows via Proton é alternativa a manter build Linux **(inferência, sem fonte de que passa na verificação)**.

### 1.6 Capacitor (mobile)

**Versão e requisitos.** Capacitor 8 foi anunciado em 8/dez/2025; exige Node 22+, Xcode 26+, Android Studio Otter 2025.2.1+; iOS deployment target 15.0; Android minSdk 24 e targetSdk 36; SPM é o padrão em novos projetos iOS; `npx cap migrate` automatiza grande parte; adicionar `density` em `configChanges` no AndroidManifest ([Ionic](https://ionic.io/blog/announcing-capacitor-8); [Updating to 8.0](https://capacitorjs.com/docs/updating/8-0)). Não foi confirmada a patch atual de `@capacitor/core` nem a existência de Capacitor 9 (lacuna).

**Edge-to-edge e safe areas.** `android.adjustMarginsForEdgeToEdge` foi removido; o plugin core `SystemBars` (`setStyle`, `show`/`hide`) cuida das barras e, no Android, injeta `--safe-area-inset-*` como fallback por bugs de WebView antiga ([SystemBars API](https://capacitorjs.com/docs/apis/system-bars)). Segundo a Capawesome, `env()` no Android WebView anterior à versão 140 tinha valores errados e o padrão recomendado é `var(--safe-area-inset-top, env(safe-area-inset-top, 0px))` ([Capawesome](https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/)). O iOS exige `UIViewControllerBasedStatusBarAppearance = YES`. Tutoriais com `adjustMarginsForEdgeToEdge` ou só `@capacitor/status-bar` estão desatualizados.

> **Conflito de números (Capawesome):** uma nota diz que o Capacitor injeta `--safe-area-inset-*` "no Android" via SystemBars (doc oficial, sem versão), outra cita "Capacitor 8.3.0+" (Capawesome). Use a versão mais recente do Capacitor 8 e teste com WebView antiga.

**Esqueleto sugerido (autoral, não testado):**

```ts
import { SystemBars } from '@capacitor/core';
await SystemBars.hide(); // imersivo; reaplicar ao voltar do background
// CSS: <meta name="viewport" content="..., viewport-fit=cover">
// padding com env(safe-area-inset-*) num wrapper EXTERNO ao canvas (o ScaleManager ignora o padding do próprio parent)
```

**WebView e performance.**

- **iOS:** WKWebView é limitado a **60 fps** em `requestAnimationFrame` (bug WebKit 294338, status NEW, sem API pública) ([WebKit Bugzilla](https://bugs.webkit.org/show_bug.cgi?id=294338)). Não prometa 120 fps; Android 120 Hz **não foi confirmado**.
- **Android:** o desempenho depende do System WebView do aparelho, atualizado independentemente do SO; há plugin para detectar versão antiga ([Capawesome System WebView](https://capawesome.io/docs/sdks/capacitor/system-webview/)). Requisitos mínimos citados: Android 7+ (WebView 60+) e iOS 15+, mas a FAQ pode estar defasada para a v8.
- **Relato real (v3):** Phaser 3 + Capacitor com tela branca e texturas falhando por **caminhos absolutos** (`/img/x.png`); usar relativos (`img/x.png`) e depurar com Chrome DevTools ([Phaser forum 15571](https://phaser.discourse.group/t/phaser-3-capacitor-android-apk-white-screens-texture-rendering-failures-and-orientation-issues/15571)).
- **Context loss:** o changelog 3.80 descreve eventos `LOSE_WEBGL`/`RESTORE_WEBGL` (texturas estáticas podem ficar em branco e precisam ser redesenhadas); um thread mais antigo diz o contrário, provavelmente anterior à 3.80; **não há confirmação do comportamento na API do v4** ([changelog 3.80](https://app.unpkg.com/phaser@4.2.1/files/changelog/v3/3.80/WebGLContextRestore.md); [thread](https://phaser.discourse.group/t/phaser-and-webgl-context-restoration-handling/11028)). Teste com `game.renderer.getExtension('WEBGL_lose_context').loseContext()`.
- **Áudio no iOS:** thread relata música que não retoma ao voltar ao foreground, sem solução confirmada; o autor tinha handlers duplicados (`appStateChange` e `pause/resume`) ([thread 14852](https://phaser.discourse.group/t/issue-of-audio-does-not-get-resumed-on-capacitor-ios-app-after-coming-to-foreground/14852)). Sugestão **(inferência)**: um único listener `App.addListener('appStateChange', ...)` chamando `game.pause()/resume()` e `game.sound.context.resume()`.

**Plugins úteis:** `@capacitor/app` (`appStateChange`, `pause`, `resume`, `backButton`; v8.1.1 vista), `@capacitor/haptics` (`impact`, `notification`, `vibrate`, `selection*`; v8.0.2 vista; sem efeito em aparelho sem motor háptico) ([Haptics API](https://capacitorjs.com/docs/apis/haptics)). Back button no Android 13+/16 (predictive back) não foi pesquisado.

**Persistência.** `localStorage` é "transitório" segundo a doc do Capacitor (o SO pode reclamar espaço); use **Preferences** para dados pequenos e SQLite para volumes maiores ([Data Storage](https://capacitorjs.com/docs/guides/storage)). Cloud save no Android: Play Games Saved Games (3 MB por arquivo) ([Android Developers](https://developer.android.com/games/pgs/savedgames)); o plugin `capacitor-game-connect` não faz cloud save e está defasado (última release v5.0.2, dez/2023). **Não há plugin Capacitor 8 verificado para Saved Games nem iCloud.** Save versionado com escrita atômica é recomendação **(inferência)**.

**Monetização e políticas de loja (datas citadas, conferir antes de agir):**

| Item | O que as fontes dizem | Fonte |
|---|---|---|
| Google Play target API | A partir de **31/ago/2026**, novos apps e updates devem mirar Android 16 (API 36); extensão possível até 1/nov/2026 via Play Console | [Android Developers](https://developer.android.com/google/play/requirements/target-sdk) |
| Apple build | Desde **28/abr/2026**, builds com Xcode 26+ / SDK iOS 26 | [Apple](https://www.developer.apple.com/news/upcoming-requirements/) |
| Apple "iOS 13+ target a partir de 9/09/2026" | Veio de resumo automático da página; **reconfirmar** (não conflita com o mínimo 15.0 do Capacitor 8) | idem |
| Guideline 4.2 (Apple) | Rejeita "reempacotamento de site"; mitigação: integração nativa, offline, assets locais (fonte: blog de vendor MobiLoud, não a Apple) | [MobiLoud](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper) |
| Play: 12 testadores por 14 dias | Em teste fechado antes da produção (conta pessoal nova); regras podem mudar | [itch.io devlog](https://itch.io/devlog/981690/our-google-play-testing-gauntlet.amp); [Phaser: Fuel Field](https://phaser.io/news/2026/07/fuel-field-phaser-roguelite-interview) |

> **Conflito de datas de loja.** Como o Capacitor 8 já usa targetSdk 36 e Xcode 26, projetos novos ou migrados satisfazem os dois requisitos **(inferência)**. Isso não dispensa checar o Play Console e a página da Apple no momento do envio.

Plugins de monetização citados: `@capacitor-community/admob` v8.0.0 (27/dez/2025, recomendado na doc do Capacitor), alternativa paga `@capawesome-team/capacitor-admob` (Insiders), `@revenuecat/purchases-capacitor` para IAP (`launchMode` da Activity deve ser `standard` ou `singleTop`). Fluxo recomendado **(inferência)**: UMP -> ATT (iOS) -> init AdMob -> rewarded opt-in. Analytics: `@capacitor-firebase/analytics` (série 8.x). Não foram verificados `@capgo/native-purchases`, taxas, nem Data Safety.

**Caso real:** *Fuel Field* (Phaser 3 + Capacitor, Google Play, iOS e itch.io): o teste de 14 dias revelou problemas de UI, posicionamento de controles e compatibilidade de aparelhos; sem números de downloads ([Phaser.io](https://phaser.io/news/2026/07/fuel-field-phaser-roguelite-interview)). Não há post-mortem com números de jogo Phaser/Capacitor em loja.

### 1.7 Arquitetura compartilhada multiplataforma

**Não foi encontrado um monorepo público e atual de Phaser + Electron + Capacitor**; só peças separadas. A proposta abaixo é **inferência de design**, apoiada em Vite modes: `import.meta.env.MODE`/`VITE_*` são substituídos estaticamente no build, o que permite tree-shaking ([Vite](https://vite.dev/guide/env-and-mode)).

```text
packages/
  game-core/      # lógica pura (combate, XP, itens, save schema) - sem importar phaser
  game-phaser/    # cenas, UI, sistemas (Phaser 4)
  platform/       # interface Platform + adapters
apps/
  web/            # build web (demo/itch.io)
  electron/       # main + preload (Steamworks via IPC)
  mobile/         # Capacitor (webDir aponta para dist mobile)
```

```ts
// platform/types.ts (autoral, não testado)
export interface Platform {
  storage: { get(k: string): Promise<string|null>; set(k: string, v: string): Promise<void> };
  input: { profile: 'touch' | 'kbm' | 'gamepad' };
  haptics: { hit(): void; success(): void; error(): void };   // no-op fora do mobile
  achievements: { unlock(id: string): void };                 // Steam; no-op fora
  lifecycle: { onPause(cb: () => void): void; onResume(cb: () => void): void };
}
// seleção: vite build --mode steam|android|ios|web  ->  import.meta.env.VITE_PLATFORM
```

Regras: SDKs de ads/IAP/Steam **não** entram no bundle das outras plataformas; perfis de performance (`dpr`, `fpsCap`, partículas, filtros) por plataforma; `Capacitor.getPlatform()`/`isNativePlatform()` são amplamente usados para branching, mas não foram verificados aqui.

---

## 2. Game design

### 2.1 Mercado e gêneros: pixel art não é diferencial, o hook é

Entre os jogos Steam com mais de US$1M de receita vitalícia, Action responde por 58,37% da receita, Role-Playing por 17,11%, Strategy por 13,97% e Simulation por 9,76% (GameDiscoverCo, ano não explícito no trecho); há **121 JRPGs** e 104 action roguelikes acima de US$1M ([GameDiscoverCo](https://newsletter.gamediscover.co/p/which-genres-have-ruled-steam-a-new)). Isso indica profundidade de mercado para o seu RPG de turno, mas a receita se concentra em franquias antigas e há milhares de jogos abaixo de US$1M em qualquer gênero.

**Escala do mercado (2025):** cerca de 20 mil lançamentos na Steam (20.008 a 20.558 conforme a fonte; +11% sobre 2024) ([HowToMarketAGame](https://howtomarketagame.com/2026/01/08/how-many-games-were-released-in-2025/)). Distribuição (agregador, **fonte secundária**; números de origem Gamalytic/Zukowski não verificados no original): mediana de receita bruta vitalícia ~US$1.136; p80 ~US$34 mil; p90 ~US$198 mil; ~300 jogos (1,5%) passam de US$1M; quase metade não chegou a 10 reviews ([SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/median-steam-game-2026)).

**Lições de casos:**

| Caso | O que ensina | Fonte |
|---|---|---|
| Bramble Royale (deckbuilder) | 4.117 wishlists, 703 vendas na semana 1 (conversão 17%); diagnóstico: faltou hook comercializável, parecia complexo, "mais um clone" | [GameDiscoverCo](https://newsletter.gamediscover.co/p/why-did-this-excellent-roguelike) |
| Vital Shell (bullet heaven) | ~15 meses de dev; 217 dias de "Coming Soon"; 17.826 wishlists no lançamento; hook = estética PSX/N64, tema mecha, mecânica enxuta; o autor sugere que iniciantes considerem gêneros menos saturados | [HowToMarketAGame](https://howtomarketagame.com/2026/05/19/2026-state-of-bullet-heavens-how-vital-shell-succeeded/) |
| Sea of Stars (RPG inspirado em Chrono Trigger) | 250 mil cópias na 1ª semana, 5M de jogadores em mar/2024 (inclui assinantes Game Pass/PS Plus) | [Game Developer](https://gamedeveloper.com/business/sea-of-stars-reaches-5-million-players); [Hitmarker](https://hitmarker.net/news/retro-inspired-rpg-sea-of-stars-sells-250-000-units-in-its-first-week-518069) |
| Roguelite | Receita Steam ~US$400M em 2025 (+80%); lançamentos de 432 (2021) para 1.926 (2025); **fonte secundária (Substack), estimativas do autor** | [Recognizing Patterns](https://recognizingpatterns.substack.com/p/the-roguelite-cull-hasnt-happened) |

**Implicações para o seu RPG (inferência):** Sea of Stars é outlier de estúdio com marca e orçamento; para solo, o caminho realista é **nicho + hook** (ex.: combate ATB com posicionamento ou combos entre personagens, mistura com roguelite/idle/MMO-lite estilo Tibia, sessões curtas) em vez de "mini Chrono Trigger". Não foram encontrados dados de mercado para cena Tibia-like/MMORPG pixel art de equipe pequena.

Conselhos de Zukowski (via resumos): defina o gênero cedo (pivôs alienam wishlisters), trave o estilo visual antes da página, mostre três locais ou tipos de gameplay únicos, capsule profissional ("hire an artist") e trailer de gameplay com ação real nos primeiros 5 segundos ([HowToMarketAGame](https://howtomarketagame.com/2025/03/10/when-should-i-post-my-steam-coming-soon-page/); [WN Hub](https://wnhub.io/news/stores-and-publishing/item-47311), **fonte secundária**).

### 2.2 Core loop, estrutura e FTUE

- **Demo ideal:** 30 a 90 min, com o hook central nos primeiros ~10 min; builds ásperas geram reviews negativas persistentes ([SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/do-steam-demos-increase-sales), fonte secundária).
- **Sessões:** mobile top 25% tem ~5,2 min por sessão (top 10% ~8 min); PC mediano ~18 min por sessão ([GameAnalytics via GameDev Reports](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game)). Alinhe batalhas e áreas a essas janelas.
- **Meta loop para rejogabilidade (inferência):** NG+, modos de desafio ou meta-progressão sustentam jogos curtos.

**Proposta de estrutura para o seu RPG (inferência, conhecimento geral de design, não de fonte buscada):**

| Elemento | Sugestão | Motivo |
|---|---|---|
| Batalha | 30-90 s no mobile; 2-4 ações relevantes por turno | Respeita sessão curta |
| Encontros | Inimigos visíveis no mapa (sem aleatórios) | Controle de ritmo |
| Assinatura | Skills combinadas entre personagens (estilo Dual/Triple Tech) | Hook mecânico memorável |
| Party | 3 personagens com troca | Profundidade sem explodir escopo |
| Itens | 1 stat dominante + 1 efeito | Evita planilha de números |
| FTUE | Salto de poder (skill/item novo) a cada poucos minutos nos primeiros 15 min; tutoriais contextuais | Retenção inicial |
| Dificuldade | Modo Wait/Active e ajuste de dificuldade | Acessibilidade e ritmo |

### 2.3 RPG por turnos e ATB

O ATB do Final Fantasy enche uma barra em tempo real, ligada ao stat Speed; **Active vs Wait** deixa o jogador escolher o ritmo; composição por arquétipos (dano, mago, tanque, healer) e status (Poison, Sleep, Silence) criam decisões táticas ([Game Design Skills](https://gamedesignskills.com/game-design/final-fantasy-combat-systems/)).

**Balanceamento.** Davide Aversa propõe três métodos (análise analítica, planilha, protótipo), procurar singularidades (dano infinito com defesa 0, dano negativo), medir Efeito Absoluto e Marginal de cada atributo e usar retornos decrescentes; formas: linear, hiperbólica (defesa), exponencial (perigosa, comum em idle games) e logarítmica ([davideaversa.it](https://davideaversa.it/blog/turn-based-battle-systems-chapter-2-analytical-analysis/)). **Sugestão (inferência):** defesa proporcional (`dano = atk * atk / (atk + def)`) evita dano infinito ou negativo; valide em planilha e depois em script de simulação (ver template T12).

**Lacunas:** sem post-mortems de balanceamento de Sea of Stars ou Chained Echoes, sem GDC talks de ATB e sem material sobre economia/XP de MMO-lite tipo Tibia.

### 2.4 Game feel (juice)

Fontes: "Juice it or Lose it", "Art of Screenshake" (Vlambeer) e GameAnalytics, **acessadas só por resumos** ([RPG Playground](https://rpgplayground.com/research-making-a-juicy-game/); [GameAnalytics](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design)). Princípios citados: tweening e easing, squash and stretch, screenshake, "sleep" (micropausas), partículas, flash, graves no áudio, vestígios permanentes, e "quanto mais comum a ação, mais simples o juice".

**Receita para turnos (heurísticas minhas, não vindas das fontes; calibrar em playtest):**

| Evento | Efeito sugerido |
|---|---|
| Antes do golpe | Anticipation (recuo/piscada, 100-200 ms) |
| Golpe forte/crítico | Hit stop de ~2-6 frames |
| Dano recebido | Flash branco de 1-2 frames (`setTint` + `TintModes.FILL` no v4) |
| Número de dano | Pop + subida + fade, 0,6-1,0 s |
| Skill final | Zoom/punch de câmera |
| Impacto | Shake curto (4-8 px, decaimento) |
| Áudio | Variação aleatória de pitch |
| Barra de HP | "Ghost bar" atrasada |

Sempre ofereça opção para reduzir ou desligar shake e flashes.

### 2.5 Retenção e conversão

**Steam (funil):**

| Métrica | Valor | Fonte e ressalva |
|---|---|---|
| Wishlists para lançar | Piso de ~7.000 (5.500+ pode bastar em semana fraca); 10-20 mil para manter "Popular Upcoming" | [HowToMarketAGame](https://howtomarketagame.com/2026/06/25/archive-how-many-wishlists-should-i-have-when-i-launch-my-game/); [SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/steam-launch-strategy) |
| Conversão wishlist para compra, dia 1 | ~12% (jogo ~20% em um exemplo) | idem |
| Mediana de 0,15x (15 mil vendas por 100 mil wishlists) | Para jogos com 25 mil+ wishlists; >US$10 ~0,10x | [GameDiscoverCo via GameDev Reports](https://gamedevreports.substack.com/p/gamediscoverco-the-state-of-steam) |
| Qualidade da wishlist | Orgânica ~12%; streamer grande 10%; showcase 5%; Next Fest/Festival 5%; Popular Upcoming 5%; demo standalone 4% | [GameDiscoverCo](https://newsletter.gamediscover.co/p/we-need-to-take-wishlist-quality) |
| Pré-lançamento | ~411 dias nos que ficaram abaixo da expectativa vs ~214 nos que superaram (correlação, não causalidade) | GameDiscoverCo via GameDev Reports |

> **Conflito entre fontes: limiar de "Popular Upcoming".** Uma fonte diz ~7 mil wishlists como piso de lançamento e 10-20 mil para manter Popular Upcoming (HowToMarketAGame/SteamPageAnalyzer). Uma única fonte secundária (Substack) afirma que o limiar subiu para 100-120 mil em jun/2026 e que um "Personal Calendar" exigiria 8-30 mil ([Recognizing Patterns](https://recognizingpatterns.substack.com/p/the-roguelite-cull-hasnt-happened)). **Não resolvido**: trate os números de wishlist como ordem de grandeza e acompanhe os dados de HowToMarketAGame antes de decidir.

**Next Fest e demo:** mediana de wishlists ganhas ~800-1.100 por jogo (fev/2026: 806; p95 13.461); "bom" ~2-3 mil; conversão demo para wishlist mediana ~16-20% (varia por fonte: 16,33% em HowToMarketAGame, 19,3% e ~20% em SteamPageAnalyzer); demo publicada meses antes rende ~2,5x ([HowToMarketAGame](https://howtomarketagame.com/2026/04/13/making-sense-of-the-february-2026-steam-next-fest/); [SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/do-steam-demos-increase-sales)). Observação: o post de HowToMarketAGame de benchmarks por faixa de wishlists tem URL de 2025 mas dados de fev/2026, uma inconsistência da fonte ([link](https://howtomarketagame.com/2025/03/26/benchmarks-how-many-wishlists-can-i-get-from-steam-next-fest/)). **O Next Fest de 19-26 out/2026 já fechou a inscrição (31/ago)**; cada jogo participa de um só Next Fest; datas de fev/2027 não foram confirmadas ([SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/steam-next-fest-october-2026)).

**Cálculo ilustrativo (meu, não projeção de fonte):** 7 mil wishlists x 12-20% de conversão no dia 1 = ~840 a 1.400 cópias na primeira semana.

**Preço (fonte secundária):** US$9,99 é o ponto mais comum para 5-10 h; US$4,99 para 1-3 h; US$14,99 para 15-30 h; desconto de lançamento de 10-20% e preço de tabela mais alto superam preço baixo inicial; 30-40% da receita vem de fora de EUA/Europa Ocidental ([SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/steam-pricing-strategy)). A Valve ofereceu em 2026 três métodos de conversão regional (câmbio, poder de compra, híbrido); os preços só mudam se você publicar ([PCGamesN](https://www.pcgamesn.com/steam/regional-pricing-tools-2026)). Zukowski no GDC 2026 (via notícia, **fonte secundária**): jogadores quase nunca compram a preço cheio; 1-2 promoções por mês; wishlists são pipeline, não conversão ([GameGeeker](https://gamegeeker.com/zh/news/steam-indie-wishlist-monetization-strategy-gdc-2026)).

**Conflito de timing de lançamento:** SteamPageAnalyzer recomenda terça a quinta; um post antigo de Zukowski (sem data clara, **possivelmente desatualizado**) diz segunda ou quarta e evitar terças ([HowToMarketAGame](https://howtomarketagame.com/?p=2809)). A Valve não permite lançamento no fim de semana.

**Assets da página Steam (guia de terceiro, não Valve):** header 920x430, small capsule 462x174 (legível a 120x45), main 1232x706, vertical 748x896, library 600x900, hero 3840x1240; 5 screenshots no mínimo (8-12 recomendado, 1920x1080); trailer de 60-90 s com gameplay nos primeiros 5 s (outra fonte: 30 s bastam); descrição curta ~300 caracteres com o gênero nas 10 primeiras palavras; use os 20 slots de tags; >60% dos usuários não usam inglês ([PressKit.gg](https://presskit.gg/field-guides/steam-page-optimization-guide)). Confirme as dimensões no Steamworks.

**Mobile (retenção):**

| Faixa (GameAnalytics, 16.262 jogos, 2026) | D1 | D7 | D30 |
|---|---|---|---|
| Mediana | ~20% | <4% | ~0,7-0,8% |
| Top 25% | >30% | 6-7% | ~1,6-1,8% |
| Top 10% | ~40% | 11-12% | n/d |
| Top 1% | 64-68% | ~25-28% | 13-15% |

Fonte: [GameAnalytics via GameDev Reports](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game). Outra fonte (Segwise, vendor de UA, metodologia não verificada) dá RPG D1/D7/D30 de 30,54/9,85/3,48% e Strategy 25,39/8,06/3,12% ([Segwise](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies.md)).

> **Conflito entre fontes de retenção.** A mediana geral de GameAnalytics (D1 ~20%, D7 <4%) e as medianas por gênero de Segwise (RPG D1 ~30%) diferem bastante: bases e metodologias distintas. Use GameAnalytics como régua geral e Segwise apenas como indício por gênero.

**CPI 2026 (Foxdata, fonte comercial, metodologia não verificada):** média blended US$0,56; RPG iOS ~US$6,00 e Android ~US$4,50; LATAM ~US$0,14 em 2025 ([Foxdata](https://foxdata.com/en/blogs/2026-mobile-game-user-acquisition-cost-benchmarks-how-much-should-you-spend/)). **Inferência:** soft launch no Brasil é barato para validar funil D1/D7, mas monetiza pouco; UA paga só após LTV comprovado.

**Rewarded ads (vendor de ad-tech, interesse comercial):** >90% de conclusão; opt-in <30% indica recompensa fraca; melhores posições: após falha ("continue"), bônus diário, loja de moeda, fim de sessão bem-sucedida ([AppSamurai](https://appsamurai.com/blog/rewarded-ads-in-mobile-games-strategy-data-and-best-practices/)). Para RPG de turno, evite interstitial forçado **(inferência)**.

**Telemetria mínima (inferência):** conclusão do tutorial, tempo até a primeira vitória e primeira morte, abandono por tela/batalha, D1/D7, duração de sessão, mortes por encontro, uso de itens/skills.

### 2.6 Playtest, escopo e validação

Pipeline sugerido **(inferência, conhecimento geral)**: protótipo do core loop em 2-4 semanas -> teste com 5-10 pessoas -> vertical slice de 15 min polido -> página Steam + trailer curto -> demo 6+ meses antes do lançamento -> Next Fest -> lançamento. Corte escopo por sistemas, não por polimento. Valide a frase de hook e a capsule antes de produzir conteúdo em massa. Fatos de apoio: Vital Shell levou ~15 meses incluindo aprendizado de engine; o período de teste fechado do Fuel Field no Google Play revelou problemas de UI e controles. O template T14 (análise de feedback) ajuda a processar playtests.

**Reembolsos e reviews (inferência, sem fonte sólida):** os drivers típicos são bugs, controles ruins, página desalinhada com o jogo e pouco conteúdo percebido; mitigue com demo fiel e página honesta. Jogos com <40% de reviews positivas perdem visibilidade (PressKit.gg, guia de terceiro).

### 2.7 Acessibilidade e QoL

As quatro queixas mais frequentes segundo as Game Accessibility Guidelines: remapeamento, tamanho de texto, daltonismo e legendas ([GAG](https://gameaccessibilityguidelines.com/?p=12)). Nível básico: remapear controles, ajustar sensibilidade, elementos interativos grandes, toggle de haptics, fonte legível, alto contraste, nada só por cor, legendas, volumes separados, vários níveis de dificuldade, lembrar configurações ([GAG Basic](https://gameaccessibilityguidelines.com/basic/)). Há também as Xbox Accessibility Guidelines ([Microsoft XAG](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines)).

**QoL específico de RPG por turnos (inferência):** modo Wait, velocidade de batalha 1x/2x/3x, auto-battle para grind, salvar a qualquer momento (essencial para sessões curtas no mobile), reduzir shake/flash, rebind de teclado e gamepad. Não há dados quantitativos ligando acessibilidade a score de review ou refund.

---

## 3. Prompts para LLMs

### 3.1 Princípios oficiais (Anthropic e Claude Code)

Fio condutor das docs: **contexto é o recurso escasso, e o maior ganho vem de dar ao Claude uma forma de verificar o próprio trabalho** (testes, build, screenshot) ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)). A página de prompting foi lida via resumo automático; nomes de modelos, comandos (`/goal`, `/batch`) e `effort` mudam rápido e devem ser reconferidos na fonte ([Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)).

| Princípio | Como aplicar no seu projeto | Fonte |
|---|---|---|
| Regra do colega sem contexto; explique o porquê | Todo prompt traz objetivo, restrições e motivo | Prompting best practices |
| 3 a 5 exemplos em `<example>`; tags XML consistentes | Use `<tarefa>`, `<contexto>`, `<criterios_de_aceite>` | idem |
| Documentos longos no topo, pergunta no fim; peça citações antes de analisar | Feedback de playtest em `<documents>` (T14) | idem |
| Seja explícito sobre agir ("mude X" e não "pode sugerir?") | Diga se quer plano ou implementação | idem |
| `investigate_before_answering` (não especular sobre código não aberto) | Ancora no código real | idem |
| Anti-overengineering e anti-hardcode para passar teste | "Não adicione abstrações além do pedido" | idem |
| Verificação: testes, build, screenshot; mostrar evidência | `tsc`, `vitest`, Playwright | Claude Code best practices |
| Explorar (plan mode) -> Planejar -> Implementar -> Commit; pule o plano se o diff cabe em uma frase | T1, T2 | idem |
| CLAUDE.md curto; para cada linha pergunte "remover causaria erros?" | Modelo na seção 3.6 | idem |
| Hooks são determinísticos, CLAUDE.md é consultivo | Regra crítica vira lint/hook | idem |
| `/clear` entre tarefas; após 2 correções falhas, reinicie com prompt melhor | T23 | idem |
| Entrevista via AskUserQuestion, escrever SPEC.md, nova sessão para implementar | T13 | idem |
| Writer/Reviewer em sessões separadas; reviewer só reporta correção e requisitos | T6 | idem |
| Pedir confirmação para ações destrutivas (`rm -rf`, `push --force`) | Seção "Fluxo" do CLAUDE.md | Prompting best practices |

**Inferências aplicadas a jogos:** "verificação" para Phaser é `tsc --noEmit`, `vitest` para lógica pura (economia, dano, XP, diálogo), build Vite e screenshot via Playwright para HUD. Como CLAUDE.md é consultivo, regras críticas (ex.: "nunca usar API removida do v3") devem virar `eslint no-restricted-syntax`/`no-restricted-properties`. Termos de API em inglês evitam ambiguidade nos prompts em português.

### 3.2 Prompts para código Phaser v4 sem APIs v3 alucinadas

Os modelos têm muito mais dados de v3; o risco é gerar APIs removidas. Defesas, da mais barata à mais cara:

1. **Fixe a versão exata** (do `package.json`) e liste as **APIs proibidas** no CLAUDE.md (seção 3.6): `Geom.Point`, `setTintFill`, `Phaser.Struct.Set/Map`, `setPipeline`/`Light2D`, `Mesh`/`Plane`, `Math.PI2`, `BitmapMask`, FX antigos ([Migration Guide](https://raw.githubusercontent.com/phaserjs/phaser/HEAD/changelog/v4/4.0/MIGRATION-GUIDE.md)).
2. **Use o `.d.ts` instalado como fonte de verdade local** e as **skills oficiais do pacote** (`node_modules/phaser/skills`: `v3-to-v4-migration`, `v4-new-features`, `game-setup-and-config`, `tilemaps`, `input-keyboard-mouse-touch` etc.) ([SKILL v3-to-v4](https://unpkg.com/phaser@4.2.1/skills/v3-to-v4-migration/SKILL.md)). Instalação reportada: `npx -y skills add phaserjs/phaser --skill v4-new-features --agent claude-code` ([claudemarketplaces](https://claudemarketplaces.com/skills/phaserjs/phaser/v4-new-features)). Confirme se o caminho `types/phaser.d.ts` permanece no pacote (não verificado).
3. **Context7** (MCP que injeta docs atualizadas) é citado como defesa contra APIs alucinadas, mas só foi visto em diretórios, sem leitura do README oficial ([LobeHub](https://lobehub.com/it/mcp/upstash-context7)). Há skill de terceiros `phaser4-gamedev` (qualidade não auditada) ([skills.sh](https://www.skills.sh/yakoub-ai/phaser4-gamedev/phaser-migrate)).
4. **Exija evidência:** "liste as APIs de Phaser usadas e onde confirmou cada uma" (T3).
5. **Gate automático:** lint + `tsc` após cada série de mudanças.

Outras diretrizes: lógica pura em `src/core/` (testável sem Phaser), cenas finas, orçamento explícito de performance mobile com profiling real (remote debugging do WebView) em vez de otimização por palpite, e camada `platform/` para Electron/Capacitor (consultar docs atuais antes de instalar plugins; os detalhes de plugins não foram verificados nas pesquisas). Não foi encontrado `llms.txt` oficial do Phaser, nem threads de fórum sobre prompts de IA para Phaser.

### 3.3 Prompts para game design, balanceamento e narrativa

As fontes oficiais não tratam de game design; o que segue **deriva de princípios gerais e é inferência**: dar restrições concretas (escopo, plataforma, equipe), dados reais (CSV de playtest/telemetria) e pedir **saída executável** (script de simulação, planilha) em vez de opinião. Números "de cabeça" do LLM são pouco confiáveis; a simulação é o equivalente de teste para o design. Para narrativa e localização, forneça uma "bible" (tom, glossário, limite de caracteres da caixa) e peça JSON com chaves i18n. Para texto de loja, forneça fatos reais e cheque afirmações contra o jogo. Templates: T10 a T15 e T22.

### 3.4 Prompts para assets: PixelLab, ElevenLabs e pós-processamento

**PixelLab MCP oficial** (HTTP): endpoint `https://api.pixellab.ai/mcp` com `Authorization: Bearer <TOKEN>` ([docs](https://api.pixellab.ai/mcp/docs)). Ferramentas: `create_character` (4 ou 8 direções; `size` 16-256; `mode` standard/pro/v3), `animate_character` (templates walk, running, idle, attack, cast-spell etc.), `create_character_state`, `get_character`; tilesets (`create_topdown_tileset` Wang 16 tiles, `create_sidescroller_tileset`, `create_isometric_tile`); objetos (`create_map_object`, `create_1_direction_object`, `create_8_direction_object`, `animate_object`, `place_map_object`).

| Ponto | Detalhe |
|---|---|
| Assíncrono | Jobs com ID; personagem ~2-5 min, animação 2-4 min, tileset ~100 s, objeto 30-90 s; é possível enfileirar animações logo após criar o personagem |
| Tamanho | standard/pro até 128 px; v3 até 256 px; o personagem ocupa ~60% da altura do canvas |
| Referências | Prefira `reference_image_url` a base64 para imagens >32x32; referência v3 deve ser frente (south); máx. 4 referências no Pro; frames 4-16 (pares) |
| Pacote comunitário | `pixellab-mcp` (npm) tem ferramentas diferentes e é provavelmente legado; use o oficial |

O PixelLab publica um `llms-full.txt` (apareceu na busca, **não lido**).

**Style bible (inferência):** fixe canvas, paleta em hex, direção de luz, contorno e descrição-base do personagem; reuse referência em vez de redescrever; gere o personagem primeiro e as animações por template; **valide por script** (dimensões, nº de frames, paleta, alpha). Aseprite CLI para pós-processamento não foi verificado.

**ElevenLabs (inferência, sem fonte coletada):** prompts curtos e concretos para SFX (material, ação, duração, ambiente, "dry, no reverb, no music"), com 2 variações por evento; para música, BPM, instrumentos e loop. **Termos de uso comercial de PixelLab e ElevenLabs não foram consultados: confira o plano.**

### 3.5 Políticas de IA das lojas e anti-padrões

| Loja | O que foi encontrado | Ressalva |
|---|---|---|
| **Steam** | Duas categorias: **conteúdo pré-gerado** (arte, voz, lore entregues no jogo) e **gerado ao vivo** (exige guardrails). Ferramentas de eficiência, incluindo assistentes de código, não exigem divulgação se o jogador não vê/ouve o resultado. Publicada em 16/jan/2026, atualizada 6/jul/2026. Jogadores podem denunciar pelo overlay | **Fonte secundária** ([TBreak](https://tbreak.com/steam-ai-disclosure-policy-update-developers/); [PCGamesN](https://www.pcgamesn.com/steam/ai-content-reporting)); texto oficial do Steamworks não lido |
| **Google Play** | Política de conteúdo gerado por IA mira apps cujo recurso central é geração por IA; não trata de assets estáticos criados por IA | [Google Play](https://support.google.com/googleplay/android-developer/answer/14094294) |
| **Apple** | Diretrizes de nov/2025 restringem compartilhar dados pessoais com IA de terceiros (exige divulgação e consentimento) | Só títulos de busca lidos ([TechCrunch](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai)); diretrizes oficiais não lidas |

**Inferência prática:** sprites do PixelLab e SFX do ElevenLabs entregues no jogo provavelmente contam como **conteúdo pré-gerado** e exigem divulgação na Steam; código feito com Claude Code, não. Mantenha `docs/art/AI_ASSETS.md` (ferramenta, data, prompt, ID do job). Registro de direito autoral de obras 100% IA é incerto e não foi pesquisado.

**Anti-padrões (cinco primeiros são falhas oficiais; o resto é inferência):**

| Anti-padrão | Correção |
|---|---|
| Sessão "pia de cozinha" com tarefas não relacionadas | `/clear` entre tarefas |
| Corrigir repetidamente a mesma falha | Após 2 tentativas, reiniciar com prompt melhor (T23) |
| CLAUDE.md inchado | Podar; regras críticas viram hook/lint |
| Confiar sem verificar | Sempre dar teste/build/screenshot |
| Exploração infinita | Escopo estreito ou subagent |
| "Faça um RPG de turno completo" | Entrevista -> SPEC.md -> tarefas pequenas com critério de aceite |
| Não informar a versão do Phaser | CLAUDE.md com versão exata + lista de proibidas + lint |
| Lógica misturada com Scene | `core/` puro + vitest |
| "Otimize" sem métrica | Orçamento (fps, draw calls, GC) + profiling |
| Balancear de cabeça | Script de simulação + CSV |
| Presumir plugins Capacitor/Electron | Consultar docs atuais e propor antes de instalar |
| Asset sem style bible | Paleta, tamanho e referência fixos + validação por script |
| Pedir revisão a quem escreveu | Subagent ou sessão nova |
| Aceitar "pronto" sem evidência | Exigir saída de `tsc`, testes, build e screenshot |

### 3.6 Templates de prompt prontos (T1 a T23)

> **Aviso:** os templates e o CLAUDE.md abaixo são **autorais (reaproveitados de um pesquisador anterior e melhorados), ainda não testados em projeto real**. Ajuste nomes de scripts, pastas e metas. Substitua os [colchetes]. Comandos e flags do Claude Code mudam rápido: confira na sua versão.

| Grupo | Templates |
|---|---|
| Contexto e fluxo | T1, T13, T23 |
| Código | T2, T3, T4, T5, T7, T8, T9 |
| Revisão | T6, T19, T20 |
| Design | T10, T11, T12, T14, T15 |
| Assets e áudio | T16, T17, T18 |
| Plataforma e loja | T21, T22 |

**T1. Contexto/arquitetura (primeira mensagem, plan mode)**
```
Estamos em um projeto Phaser 4 (versão exata em package.json) + TypeScript strict + Vite, empacotado com Electron (Steam/desktop) e Capacitor (Android/iOS).
Modo plano, sem editar nada. Leia CLAUDE.md, package.json e src/ (estrutura de pastas e as cenas em src/scenes/) e explique em até 15 linhas: (1) fluxo de cenas, (2) onde mora a lógica pura vs. código dependente de Phaser, (3) como saves e input são abstraídos entre desktop e mobile.
Aponte inconsistências, mas não proponha refatoração ainda. Cite os arquivos que abriu.
```

**T2. Nova feature com critérios de aceite**
```
<tarefa>Implementar [feature, ex.: inventário com 20 slots e stacks].</tarefa>
<contexto>Phaser 4 + TS. Siga o padrão de @src/systems/[exemplo].ts. Lógica pura em src/core/ (sem importar phaser); a Scene só renderiza e repassa input.</contexto>
<fora_de_escopo>UI final, persistência, balanceamento.</fora_de_escopo>
<criterios_de_aceite>
1. [critério verificável 1]
2. [critério 2]
3. Testes vitest cobrindo bordas: [lista].
4. `npm run typecheck` e `npm test` passam.
</criterios_de_aceite>
Antes de codar, liste os arquivos que vai criar/alterar e espere meu OK. Depois implemente em passos pequenos, rode os checks e mostre a saída. Não adicione abstrações além do pedido. Implemente a lógica geral; os testes verificam, não definem a solução.
```

**T3. Anti-alucinação de API (Phaser v4)**
```
Regra desta sessão: Phaser 4.x, NÃO v3. Nunca use: Phaser.Geom.Point (use Math.Vector2), setTintFill (use setTint + setTintMode(Phaser.TintModes.FILL)), Phaser.Struct.Set/Map (use Set/Map), setPipeline/Light2D (use setLighting(true)), Mesh/Plane, Math.PI2, BitmapMask (use filtro de máscara), FX antigos (preFX/postFX), RenderTexture sem render().
Atenção: Math.TAU agora é 2π.
Antes de usar qualquer API de Phaser da qual não tenha certeza, confirme em node_modules/phaser/types ou nas skills do projeto (.claude/skills) e diga onde confirmou. Se não achar, diga que não sabe em vez de inventar.
Tarefa: [descrição]. No fim, liste todas as APIs de Phaser usadas e a evidência de cada uma.
```

**T4. Depuração com reprodução primeiro**
```
Bug: [sintoma], em [Electron / Android WebView / iOS], [frequência]. Esperado: [comportamento]. Provável local: [arquivo]. Log: [colar].
1) Não corrija ainda: leia o código e liste 3 hipóteses por probabilidade, com o que confirmaria ou refutaria cada uma.
2) Escreva um teste (ou cena mínima) que reproduza a falha e mostre que falha.
3) Corrija a causa raiz (não suprima o erro), rode teste e typecheck e mostre a saída.
Se após 2 tentativas não resolver, pare e resuma o que foi descartado.
```

**T5. Performance mobile**
```
Meta: 60 fps em Android intermediário ([dispositivo]) na cena [cena] com [N] sprites. (No iOS o teto do WKWebView é 60 fps.)
Passo 1 (só leitura): revise @src/scenes/[cena].ts e src/systems/ procurando alocações por frame em update(), criação/destruição de GameObjects sem pool, texturas fora de atlas, excesso de Graphics/Text dinâmicos, listeners não removidos, lighting ligado sem necessidade (quebra batches), filtros desnecessários.
Passo 2: para cada achado, estime impacto e risco. Não altere nada sem meu OK.
Passo 3: após o OK, no máximo 3 mudanças por vez, dizendo como medir (Chrome remote debugging, contador de draw calls). Não otimize o que não for medido.
```

**T6. Code review de diff (subagent ou sessão nova)**
```
Use um subagent para revisar o diff (git diff main...HEAD) contra @SPEC.md.
Reporte apenas: (a) bugs de correção, (b) requisitos não implementados, (c) uso de API Phaser v3 removida, (d) vazamento de listeners/objetos ao trocar de cena, (e) código que quebra em Capacitor/Electron. Ignore estilo e sugestões opcionais. Para cada achado: arquivo:linha, severidade, correção sugerida.
```

**T7. Refatoração segura**
```
Refatore [módulo] para separar lógica pura de Phaser, sem mudar comportamento.
(1) Escreva testes de caracterização e rode (devem passar); (2) mova a lógica para src/core/ em commits pequenos; (3) rode os testes a cada passo. Não renomeie APIs públicas nem mexa em outros módulos. Mostre a saída dos testes no final.
```

**T8. Testes de lógica de jogo**
```
Escreva testes vitest para src/core/[arquivo].ts (sem mocks de Phaser). Cubra: caminho feliz, bordas ([dano 0, overflow de XP, inventário cheio]), determinismo com seed fixa e uma propriedade (ex.: ouro nunca negativo). Rode e mostre a saída. Não altere código de produção; se achar bug, reporte com o teste que falha.
```

**T9. Migração v3 para v4**
```
Migre [pasta/arquivo] de Phaser 3 para 4 usando a skill v3-to-v4-migration (em .claude/skills ou node_modules/phaser/skills) e o MIGRATION-GUIDE.md do pacote instalado.
Primeiro gere um relatório (sem editar) de todos os usos de APIs removidas/alteradas (Point, tintFill, Struct.Set/Map, pipelines/FX, BitmapMask, DynamicTexture sem render(), roundPixels, TileSprite crop, Math.TAU, shaders). Depois migre por categoria, rodando typecheck e smoke test a cada uma.
```

**T10. Brainstorm de mecânicas com restrições**
```
Atue como game designer sênior. Jogo: [gênero], plataforma [PC/mobile touch], 1 dev, escopo [6 meses], arte gerada com PixelLab (poucos frames por personagem).
Gere 12 mecânicas de combate/progressão. Para cada: fantasia do jogador, loop de 30 s, quantos sprites/animações exige, risco de escopo (1-5), como pode falhar. Escolha as 3 melhores e aponte a mais barata para prototipar em um fim de semana.
```

**T11. Crítica cética de design**
```
Aja como designer cético e veterano de [Chrono Trigger / Tibia / outro]. Leia @docs/GDD.md. Liste: 5 razões pelas quais o loop central enjoa em 20 min; 3 pontos onde o jogador quebra a economia; 3 suposições não testadas. Para cada, um experimento barato (<=1 dia) com métrica de sucesso. Não elogie; cite trechos do GDD.
```

**T12. Balanceamento com simulação**
```
Objetivo: curva de progressão de [jogo], níveis 1-30 (XP, HP/ATK/DEF por classe, dano por skill, ouro, preços). Dados em @data/balance.csv.
1) Escreva scripts/simulate.ts: [10.000] runs com seed, imprimindo percentis P10/P50/P90 de nível por área, taxa de vitória por encontro, tempo por nível, ouro acumulado vs gasto.
2) Aponte picos e vales e proponha ajustes no CSV, não no código. Sugestão de fórmula de defesa proporcional (atk*atk/(atk+def)) para evitar dano infinito ou negativo.
3) Rode antes e depois e compare. Meta: [ex.: 70-85% de vitória em encontros normais, chefe 40-60%] (metas minhas, calibre em playtest).
```

**T13. GDD por entrevista**
```
Quero documentar [ideia em 2 frases]. Entreviste-me com AskUserQuestion, 4-5 perguntas por rodada, sobre: fantasia do jogador, loop central, progressão, economia, controles em teclado/gamepad/toque, escopo, riscos, arte e áudio. Vá nas partes difíceis. No fim, escreva docs/GDD.md (máx. 3 páginas): pilares, loop, sistemas, MVP, fora de escopo, riscos, métricas de playtest, hook em uma frase.
```

**T14. Análise de feedback de playtest**
```
<feedback>
[1 <document index="n"> por testador]
</feedback>
Antes de analisar, cite literalmente os trechos que sustentam cada conclusão. Depois: (1) agrupe por tema com contagem de testadores; (2) separe bug, confusão de UX, balanceamento e gosto pessoal; (3) priorize os 5 principais por impacto x esforço; (4) liste o que NÃO deve mudar. Não invente números.
```

**T15. Diálogo/narrativa + localização**
```
Escreva os diálogos da cena [nome]. Tom: [ex.: melancólico com humor seco]. Personagens: [fichas]. Glossário: [termos]. Caixa comporta 3 linhas de 38 caracteres.
Saída: JSON em src/data/dialogue/[cena].pt-BR.json { id, speaker, text, emotion, next }. Depois gere en e es com as mesmas chaves e liste em tabela os trechos ambíguos que exigem revisão humana. Avise quando estourar o limite.
```

**T16. Assets via PixelLab MCP**
```
Use o MCP do PixelLab. Style bible (não desviar): canvas 64x64, personagem ~60% da altura, 4 direções, view [low top-down], contorno escuro de 1 px, luz do canto superior esquerdo, paleta de no máximo 16 cores (docs/art/palette.json).
1) create_character: "[descrição]", mode [pro]. Mostre o preview e espere meu OK.
2) Após o OK, enfileire animate_character com "idle", "walk" e "attack" sem redescrever o personagem.
3) Baixe para assets/raw/[nome]/ e rode scripts/validate-sprites.ts (dimensões, frames, <=16 cores, alpha). Reporte falhas; não corrija "no olho".
Registre em docs/art/AI_ASSETS.md (ferramenta, data, prompt, ID do job).
```

**T17. Atlas e carregamento em Phaser v4**
```
Escreva scripts/build-atlas.ts que empacote assets/raw/** em atlas (JSON + PNG, padding [2] px, extrusão de 1 px para tiles) e gere src/assets/manifest.ts tipado. Crie DebugAnimScene que carregue o atlas e toque cada animação com rótulos. Siga as skills loading-assets e animations (confirme APIs antes de usar). Config: render.pixelArt true (não misturar com smoothPixelArt); roundPixels padrão do v4 é false. Mostre screenshot via Playwright.
```

**T18. SFX/música (ElevenLabs) + integração**
```
Liste 20 SFX para [jogo] em tabela: id, evento, prompt em inglês (material, ação, 0.2-1.5 s, "dry, no reverb, no music"), 2 variações, volume relativo. Depois escreva src/audio/sfx.ts (Phaser Sound Manager; pool de variações sem repetir a anterior; respeitar mute e o desbloqueio de áudio por gesto no navegador/WebView). Sem voz de pessoa real. Registre a origem em docs/art/AI_ASSETS.md.
```

**T19. Revisão de UI/HUD por screenshot**
```
[anexar 3 screenshots: 360x800, 1280x720, 1920x1080]
Revise o HUD como designer de UI mobile+desktop. Liste por severidade: legibilidade (px físicos), áreas de toque abaixo do mínimo (referência: 44 pt Apple / 48 dp Material, fonte secundária), sobreposição com notch/safe-area, hierarquia, dependência só de cor, contraste. Para cada problema: onde, por quê, correção e como testar. Não edite ainda. Após o OK, implemente, tire novos screenshots e compare com os originais.
```

**T20. Acessibilidade e controles**
```
Audite @src/scenes/ e @src/input/: remapeamento, equivalência gamepad/teclado/toque, reduzir shake/flash, texto ajustável, legendas, modo daltônico, modo Wait/Active. Gere tabela [item | situação | esforço P/M/G | prioridade] e implemente apenas os 3 de menor esforço, com testes onde fizer sentido.
```

**T21. Empacotamento Electron e Capacitor**
```
Quero builds reprodutíveis: Electron (Windows/Linux; futuramente Steam) e Capacitor (Android primeiro). Não instale plugins nem altere config nativa sem confirmar na documentação atual (Context7 ou URLs que eu fornecer) e me mostrar o plano. Separe src/platform/ com interface única (saves, fullscreen, haptics, back button, safe-area, conquistas Steam via adaptador). Entregue scripts npm (build:web, build:electron, build:android), checklist de teste em aparelho real e lista de riscos (permissões, WebView, áudio, assets com caminho relativo). Só builds locais; peça confirmação antes de publicar ou assinar.
```

**T22. Texto da página de loja**
```
Escreva o texto da página para [jogo]. Fatos reais (não invente features): [lista]. Público: [x]. Referências: [y]. Entregue: 3 aberturas (<=150 caracteres), descrição curta (<=300, gênero nas 10 primeiras palavras), 5 bullets e lista de tags. Sinalize afirmações que dependam de feature não implementada. Separadamente, rascunhe a divulgação de IA com base em docs/art/AI_ASSETS.md (conteúdo pré-gerado: arte/áudio/texto).
```

**T23. Reset de sessão ("2 correções e reinicia")**
```
Contexto novo. Resumo do que aprendi: [o que falhou e por quê]. Tarefa refeita: [descrição + restrições + critério de aceite]. Evite: [abordagem que falhou]. Comece pelo plano em até 10 linhas.
```

### 3.7 CLAUDE.md modelo (Phaser v4 + Electron + Capacitor)

Mantenha curto, rode `/init` e depois pode. Conhecimento ocasional vai em `.claude/skills/`; regras críticas viram hooks. **Autoral, não testado.**

```markdown
# Projeto: [Nome do jogo]
Jogo 2D pixel art. Stack: Phaser 4.x (versão exata em package.json, NÃO é v3), TypeScript strict, Vite, vitest. Empacotamento: Electron (desktop/Steam) e Capacitor (Android/iOS).

# Comandos
- `npm run dev` - servidor Vite
- `npm run typecheck` - tsc --noEmit (rodar após cada série de mudanças)
- `npm test -- <arquivo>` - vitest (prefira só o teste relevante)
- `npm run lint`
- `npm run build:web` / `build:electron` / `build:android`
- `npm run sim` - simulação de balanceamento (scripts/simulate.ts)

# Phaser v4 (IMPORTANT)
- Antes de usar API de Phaser da qual não tenha certeza, confirme em node_modules/phaser/types ou nas skills em .claude/skills. Nunca invente API.
- Proibido (removidas/alteradas do v3): Geom.Point (usar Math.Vector2), setTintFill (usar setTint + setTintMode), Phaser.Struct.Set/Map (usar Set/Map), setPipeline/Light2D (usar setLighting), Mesh/Plane, Math.PI2, BitmapMask, preFX/postFX, DynamicTexture sem render().
- Math.TAU agora é 2π (no v3 era π/2). roundPixels padrão é false no v4.
- Config de pixel art: render.pixelArt true OU render.smoothPixelArt true (nunca os dois). Zoom/escala inteiros. Posições e scroll inteiros; origin 0 em sprites de tamanho ímpar.
- Estilo de import do Phaser: [definir após testar: `import * as Phaser from 'phaser'` ou default] e não alternar.

# Arquitetura
- src/core/: lógica pura (sem importar phaser). src/scenes/: cenas finas. src/systems/: sistemas. src/platform/: adaptadores (electron, capacitor, web) atrás de uma interface única.
- Dados de balanceamento em data/*.csv|json (sem números mágicos no código).
- Eventos tipados entre cenas; remover listeners no shutdown da cena.

# Convenções
- ESM, imports nomeados, sem `any`. Comentários só onde a lógica não é óbvia.
- Sem alocação em update(); object pooling para projéteis, partículas e inimigos.
- Textos via i18n (src/i18n/), nunca hardcoded. Idioma-fonte: pt-BR. Fonte bitmap com acentos.
- Não adicionar abstrações, features ou refatorações além do pedido.

# Fluxo
- Mudança multiarquivo: plano primeiro, depois passos pequenos. Se o diff cabe em uma frase, faça direto.
- Todo bug: teste/repro que falha antes de corrigir.
- Sempre mostrar evidência: saída de typecheck/testes/build; para UI, screenshot.
- Pedir confirmação antes de: instalar plugins Capacitor/Electron, alterar projeto nativo, apagar arquivos, git push/force/reset, publicar ou assinar builds.
- Ao compactar, preservar: arquivos modificados, comandos de teste, decisões de arquitetura.

# Plataformas
- Mobile: 60 fps em Android intermediário; safe-area via CSS env()/SystemBars; alvos de toque >=48 dp; áudio só após o primeiro gesto; assets com caminho relativo.
- Electron: Steamworks no processo main + contextBridge quando possível; conteúdo remoto nunca com nodeIntegration.
- Saves: via src/platform (nunca localStorage direto na lógica).

# Assets
- Style bible: docs/art/STYLE.md e docs/art/palette.json. Brutos em assets/raw/; atlas por scripts/build-atlas.ts.
- Todo asset de IA (PixelLab/ElevenLabs/texto) registrado em docs/art/AI_ASSETS.md (necessário para a divulgação de IA da Steam).
- Validar sprites com scripts/validate-sprites.ts antes de integrar.

@docs/GDD.md
```

---

## 4. UI/UX/HUD multiplataforma

### 4.1 Resolução base e escala

O Scale Manager do v4 tem os modos NONE, WIDTH_CONTROLS_HEIGHT, HEIGHT_CONTROLS_WIDTH, **FIT** (cabe no parent mantendo aspecto), **ENVELOP** (cobre, cortando), **RESIZE** (canvas 1:1 com o parent, sem escala CSS, pesado em telas hi-res) e **EXPAND** (área visível cresce para preencher o parent) ([skill scale-and-responsive](https://unpkg.com/phaser@4.2.1/skills/scale-and-responsive/SKILL.md); [Docs](https://docs.phaser.io/phaser/concepts/scale-manager)). Pontos documentados:

- `zoom: MAX_ZOOM` = maior zoom **inteiro** que cabe; o zoom é CSS e não muda a resolução do canvas. Arquitetura: `gameSize` (config), `baseSize` (canvas) e `displaySize` (CSS).
- Opções `min`/`max`, `snap`, `autoRound`, `expandParent`, `resizeInterval` (500 ms). Eventos `resize`, `orientationchange`, entrada/saída de fullscreen.
- Armadilhas: o parent precisa de dimensões calculáveis; **não estilize o canvas por CSS**; `setGameSize()` fora do modo NONE; **fullscreen só em `pointerup`**; iframe exige `allowfullscreen`.
- **A doc oficial não cobre DPR/high-DPI** nem confirma se `resolution` voltou no v4 (lacuna). O padrão de multiplicar por `devicePixelRatio` vem de fórum de Phaser 3 ([Discourse](https://phaser.discourse.group/t/settings-for-crisp-rendering/10000)) e não foi confirmado para v4.

**Escolha da resolução base (aritmética direta, decisão de design é sua; inferência):**

| Base | 1080p | 1440p | 4K (2160p) | Steam Deck 1280x800 |
|---|---|---|---|---|
| 320x180 | 6x | 8x | 12x | 4x = 1280x720 (barras de 40 px) |
| 480x270 | 4x | 5,33x (não inteiro) | 8x | 2x = 960x540 (muita borda) |
| 640x360 | 3x | 4x | 6x | 2x = 1280x720 |
| 320x200 (16:10) | n/a | n/a | n/a | 4x exato em 1280x800 |

Só **320x180 e 640x360** dão escala inteira em 1080p, 1440p e 4K. Decida cedo: afeta tamanho de sprite e tile (um tile de 16 px em 320x180 dá 20 x 11,25 tiles). Para o Steam Deck 16:10 sem barras, use EXPAND ou campo de visão extra vertical.

**Estratégia em 3 camadas (inferência):**

1. **Desktop:** fit inteiro por padrão (`MAX_ZOOM`), barras pretas ou moldura artística.
2. **Ultrawide:** EXPAND com teto (ex.: até 21:9), HUD ancorado às bordas; **nunca revele áreas fora do mapa**; além de ~21:9, pillarbox. Não há fonte para 32:9 em Phaser.
3. **Mobile:** FIT/ENVELOP; telas 19,5:9 e 20:9 em landscape sobram faixas laterais, bom lugar para controles virtuais fora da área de jogo.

**DPR (hipótese a testar, não verificada):** o upscaling CSS por fator inteiro continua nítido; o problema surge quando `cssZoom * dpr` não é inteiro (ex.: zoom 3 em dpr 1,5 = 4,5 px de dispositivo). Calcule o zoom em pixels de dispositivo: `zoom = floor(innerWidth*dpr/baseW)/dpr`.

**UI nítida (três opções, inferência):** (A) UI in-canvas na mesma resolução base (coerente, escala junto); (B) câmera de UI com zoom inteiro maior (mais legível, mas quebra a densidade de pixel do mundo); (C) overlay DOM para menus complexos (acessibilidade, IME, fonte do SO, teclado virtual; custo: foco por gamepad e consistência visual). Recomendação: **HUD e batalha in-canvas; settings e texto longo em DOM só se aceitar o trabalho de foco**. Referência conceitual (Defold): desenhar a UI na resolução nativa e aplicar um fator inteiro uniforme ([Defold forum](https://forum.defold.com/t/gui-for-pixel-art-games-heres-how/77704)).

**Fontes:** BitmapText em múltiplos inteiros do tamanho-base é determinístico; web fonts ficam borradas em escala fracionária (inferência). Glifos abaixo de ~8 px de altura na base ficam ilegíveis (inferência).

**Config e recálculo (autoral, não testado):**

```ts
const config = {
  type: Phaser.AUTO,
  render: { pixelArt: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH,
           width: 320, height: 180, zoom: Phaser.Scale.MAX_ZOOM },
  input: { gamepad: true }
};
// O guia de pixel art do v4 manda posições e scroll inteiros; round após lerp de câmera.
game.scale.on('resize', () => game.scale.setMaxZoom()); // recalcular zoom inteiro (testar)
```

### 4.2 Layout de HUD

- **Ancore à área segura, não à tela**, derivando o layout de `scale.on('resize')` e de insets lidos de `--safe-area-inset-*` (convertendo px CSS para px de jogo dividindo por `displaySize/gameSize`) (inferência). No Capacitor, use `var(--safe-area-inset-top, env(safe-area-inset-top, 0px))` ([Capawesome](https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/)).
- **rexUI:** feito para Phaser 3; **compatibilidade com v4 não confirmada** (o guia de migração não cobre plugins de terceiros). O rexVirtualJoystick só foi visto em Phaser 3 ([Discourse](https://phaser.discourse.group/t/rex-virtual-joystick-cannot-read-properties-of-undefined-reading-get/11348)). Plano B de baixo risco: layout manual com Container/Layer, `NineSlice` para painéis e um `FocusManager` próprio. (A lib itch.io "Phaser PixUI" não foi avaliada.)
- **Margem de TV safe (~5%)**, Dynamic Island e cantos arredondados: sem fonte específica; trate como insets (inferência). Ofereça opção "margem do HUD".
- **HUD modular (inferência):** cada widget com anchor + offset + visibilidade em JSON; presets Mínimo/Padrão/Completo; salvo em Steam Cloud ou Preferences.
- **Escala de UI para o jogador:** em base baixa só há passos inteiros, então ofereça "Normal/Grande" (2x), não slider contínuo.
- **Localização:** reserve +30-40% de largura, fonte bitmap com acentos de PT-BR, CJK exige fonte separada, nunca texto em sprite (inferência).

### 4.3 HUD de RPG por turnos

Convenções de design (**inferência, não citadas**):

| Elemento | Convenção |
|---|---|
| Menu de comando | Lista vertical com cursor (FF/Chrono Trigger); alvo destacado com nome e fraquezas |
| ATB | Barra fina; muda de cor, som ou flash ao encher |
| Painel do grupo | Nome, HP/MP numérico + barra |
| Dano flutuante | Tween subida + fade, 8-10 px base, cor/escala por tipo (dano, crítico, cura), 0,6-1,0 s, agrupar |
| Log de ações | Curto, com skip e velocidade |
| Diálogo | 2-3 linhas, ícone "▼", typewriter com velocidade/instantâneo, retrato opcional |
| Estados | hover/focus/pressed/disabled distintos |

Daltonismo: nunca só cor; adicione ícone ou forma a buffs, debuffs e elementos; paletas alternativas por swap (o filtro `GradientMap` do v4 serve para palette swap); teste com simuladores (Coblis, Color Oracle) (inferência).

### 4.4 Mobile touch

- **Alvos mínimos:** Apple 44 pt, Material 48 dp, WCAG 2.2 AA 24x24 CSS px e AAA 44x44 CSS px.

> **Conflito/ressalva: tamanhos de toque.** Esses números vêm de **uma fonte secundária** ([specification.website](https://specification.website/spec/accessibility/touch-target-size/)); HIG e Material primários não foram consultados. As notas de prompts falam em "48 px lógicos" e as de UI em 48 dp: **são unidades diferentes** (este guia usa dp). Em pixel art de base baixa, converta: `minPx_jogo = 48 / (cssPxPorPxDeJogo)` (inferência). Exemplo (matemática direta): base 480x270 em tela de 800 CSS px de largura = fator ~1,67, então 48 dp ~ 29 px de jogo. Use hit area `max(sprite, mínimo)` com `setInteractive` ampliado; espaçamento >= 8 dp.

- **Multi-touch:** Phaser 4 cria 2 ponteiros por padrão; `this.input.addPointer(n)` até 10 no total ([skill input](https://unpkg.com/phaser@4.2.1/skills/input-keyboard-mouse-touch/SKILL.md)).
- **Gestos do browser:** `overscroll-behavior-y: contain` desativa pull-to-refresh ([Chrome Developers](https://developer.chrome.com/blog/overscroll-behavior)); CSS comum (inferência): `html,body{margin:0;overflow:hidden;overscroll-behavior:none;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}` e `canvas{touch-action:none}`. O tutorial oficial do Phaser para Capacitor usa pointer events, `viewport-fit=cover` e `env(safe-area-inset-*)` ([Phaser tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor), resumo de fetch). Guia MDN: [Mobile touch controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch) (não lido em detalhe).
- **Para RPG de turnos (inferência):** landscape como padrão em 16:9; tap seleciona e botão OK explícito (nunca drag obrigatório); scroll com inércia e limiar (~10 dp) para distinguir de tap; ações destrutivas em tap completo (down+up no mesmo alvo); alvos críticos a >=16-24 dp da borda por causa de gestos do sistema; controles reposicionáveis (mão esquerda); menu de pausa em alvo grande no topo; joystick flutuante reduz erro.
- **Haptics:** `impact` Light para dano leve, Heavy para boss, `notification` Success/Error para vitória/derrota, `selectionChanged` para menus (inferência); wrapper no-op fora do mobile, throttling de ~50-100 ms, fire-and-forget; toggle nas opções.
- **Ciclo de vida:** um único handler `appStateChange` para pausar jogo e áudio; salvar ao ir para background (inferência).
- **Sem fonte:** latência de toque em WebView; gestos swipe/pinch/long-press.

### 4.5 Desktop, Steam Deck e gamepad

**Critérios Steam Deck Verified** ([Steamworks](https://partner.steamgames.com/doc/steamdeck/compat)): controles do Deck cobrem todo o conteúdo com a config padrão; glifos correspondem ao input em uso; texto via teclado na tela da API Steamworks (ou própria); resolução 1280x800 preferida (ou 1280x720); **menor caractere >= 9 px de altura em 1280x800**; sem avisos de hardware não suportado; launchers navegáveis por controle; Proton para jogos Windows. Uma das notas cita ainda **30 fps a 800p** como padrão jogável, na página de compatibilidade do Steamworks ([URL alternativa](https://partner.steamgames.com/doc/steamhardware/compat)); a outra nota não menciona esse critério.

> **Conflito: tamanho mínimo de texto.** A Valve exige >= 9 px; um dev (Blendo Games) recomenda ~12 px na prática ([Blendo Games](https://blendogames.com/news/post/2026-02-19-steamdeckverification/)). **Use 12 px reais de tela como alvo e 9 px como piso.** Com base 480x270 em 2x, fonte de 8-10 px base = 16-20 px na tela, confortável (inferência). A verificação é feita pela Valve após o envio.

- **Glifos:** Kenney Input Prompts Pixel 16x (16x16, ~800 assets, CC0; teclado/mouse, Xbox, PlayStation, Switch, Steam Controller, Steam Deck, touch) ([Kenney](https://kenney.nl/assets/input-prompts-pixel-16)); pack Xelu's Free Controllers citado por Blendo. Construa cedo a troca de prompts por dispositivo; no Deck, só glifos do Deck/Xbox ([Brainhub](https://brainhub.eu/library/making-electron-apps-steam-deck-compatible)).
- **Detecção do dispositivo ativo (inferência):** último input (`keydown` = teclado; `pad.down`/`connected` = gamepad) e `pad.id` (ex.: "Xbox", "054c" Sony, "057e" Nintendo, "28de" Valve) para escolher o set; troca em tempo real.
- **Gamepad no Phaser 4:** `input: { gamepad: true }`, `this.input.gamepad.pad1`, eventos `connected`/`down`, `pad.vibration.playEffect()` (só em gamepad) ([skill input](https://unpkg.com/phaser@4.2.1/skills/input-keyboard-mouse-touch/SKILL.md)). Sem ISteamInput, a Steam emula XInput.
- **Foco (inferência):** um `FocusManager` com grafo de vizinhos; mouse hover move o foco; confirm/cancel padronizados; esconder o mouse ao usar gamepad; "layer stack" para modais (Brainhub).
- **Fullscreen:** `scale.toggleFullscreen()` em `pointerup`; em Electron, janela fullscreen.
- **Menu de opções essencial (inferência):** resolução/escala (inteiro/preencher), tela cheia/janela/borderless, vsync e limite de fps, volumes (master, música, SFX, voz), idioma, tamanho de UI/texto, legendas, daltonismo, remapeamento, reduzir flash/shake/movimento, texto rápido, vibração, modo segurar vs alternar, restaurar padrões.
- **Latência:** o limitador de fps do Steam Deck foi reportado como adicionando latência de entrada (não específico de Electron) ([HotHardware](https://hothardware.com/news/steam-deck-fps-limit-adds-input-latency)). Não há medição de input em Electron.

### 4.6 Fundamentos de UX e acessibilidade

Tratar acessibilidade como checklist de projeto (GAG + XAG) ([GAG Basic](https://gameaccessibilityguidelines.com/basic/); [XAG](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines): 101 Texto, 102 Contraste, 103 canais adicionais, 107 Entrada, 109 Clareza de objetos, 112 Navegação de UI). Boas práticas gerais (inferência, sem fonte): onboarding fazendo (primeiro combate guiado, prompts com o glifo atual, dicas relíveis em "Ajuda"); feedback visual + sonoro + háptico em <100 ms; tweens de UI de 80-200 ms com easing e opção "reduzir movimento"; loading com `this.load.on('progress')`; contraste >= 4,5:1 (critério geral WCAG AA, não verificado nesta rodada); pseudo-localização (`[!!! Ñéw Têxt !!!]`).

### 4.7 Testes e matriz de resoluções

Nenhuma fonte forte foi encontrada para testes automatizados de Phaser; o que segue é **prática geral a validar**. `game.scale.refresh()` força recálculo e emite `resize` (documentado, [skill](https://unpkg.com/phaser@4.2.1/skills/scale-and-responsive/SKILL.md)); inclua WebView Android antigo (<140) na matriz por causa do bug de `env()`.

| Categoria | Viewports sugeridos (CSS px, landscape) |
|---|---|
| Desktop 16:9 | 1280x720, 1920x1080, 2560x1440, 3840x2160 (dpr 1 e 2) |
| Deck / 16:10 | 1280x800, 1440x900 |
| Ultrawide | 2560x1080 (21:9), 3440x1440, 5120x1440 (32:9) |
| 4:3 | 1024x768 |
| Celulares | iPhone SE 667x375; iPhone 15/16 852x393 (dpr 3, notch); Android 20:9 ~915x412 |
| Tablets | iPad 1024x768; iPad Pro 11 1194x834 |
| Foldable | interno quase quadrado ~884x1104 (sem fonte; tratar `resize`/`visualViewport`) |

Ferramentas **(não verificadas)**: Chrome DevTools Device Mode (CPU throttling, DPR custom, emulação de visão, mas não simula notch de forma confiável); Playwright com `setViewportSize`, `deviceScaleFactor` e `toHaveScreenshot()` (diff por pixel funciona bem em pixel art; WebGL em modo headless pode divergir); iOS Simulator, Android Studio AVDs e **aparelhos reais de baixa gama**; Steam Deck real em Game Mode.

---

## 5. Roadmap e checklists

> Cronograma e metas abaixo são **sugestões minhas (inferência)** montadas a partir dos benchmarks citados; calibre com seus próprios dados. Referência de data: hoje é 01/out/2026; o Next Fest de outubro/2026 já passou.

### 5.1 Roadmap sugerido (inferência)

| Fase | Duração sugerida | Entregas | Gate |
|---|---|---|---|
| 0. Fundação | 1-2 semanas | Scaffold `npm create @phaserjs/game@latest`, CLAUDE.md, lint de APIs v3, resolução base, camada `platform/`, CI | `tsc`, testes e build web verdes |
| 1. Protótipo do core loop | 2-4 semanas | 1 batalha jogável, 3 personagens, modo Wait/Active, telemetria mínima | 5-10 testadores entendem o hook |
| 2. Vertical slice | 4-8 semanas | 15 min polidos: juice, FTUE, HUD multi-resolução, glifos, áudio | Playtest sem bloqueios de UX |
| 3. Página Steam + trailer | paralelo | Capsule, 5+ screenshots, trailer de gameplay, tags, newsletter; "Coming Soon" no ar | Página publicada com gênero e estilo travados |
| 4. Demo | meses antes de um Next Fest | Demo de 30-90 min, mesma base do build web | Demo estável (rough builds geram reviews negativas) |
| 5. Porte Electron/Steam | 3-6 semanas | Steamworks (conquistas), Auto-Cloud, overlay, teste Deck | Checklist 5.2 |
| 6. Soft launch mobile | 4-6 semanas | Capacitor Android, teste fechado Play (12 testers/14 dias), analytics | D1/D7 medidos vs benchmark |
| 7. Next Fest e lançamento | fev ou jun/2027 (datas não confirmadas) | Lançar terça a quinta (fonte secundária) | Wishlists e preço revisados |

### 5.2 Checklist pré-lançamento Steam

**Página e marketing**
- [ ] Gênero e estilo travados; hook em uma frase
- [ ] Capsule legível a 120x45; assets nos tamanhos atuais do Steamworks (conferir; ver 2.5)
- [ ] 5+ screenshots (idealmente 8-12 em 1920x1080); trailer com gameplay nos primeiros 5 s
- [ ] Descrição curta com gênero nas 10 primeiras palavras; 20 tags, priorizando subgêneros
- [ ] Página traduzida (>60% dos usuários não usam inglês, fonte secundária); pt-BR, en, e demais idiomas conforme orçamento
- [ ] Divulgação de IA preenchida a partir de `AI_ASSETS.md` (arte, voz, texto)
- [ ] Meta de wishlists definida (~7 mil como piso, ordem de grandeza; ver conflito 2.5)
- [ ] Demo publicada com antecedência; data de lançamento trancada 14 dias antes (fonte secundária)
- [ ] Preço e desconto de lançamento (10-20%) definidos; preços regionais revisados e publicados manualmente

**Técnico**
- [ ] `steam_appid.txt` na raiz de dev e do app empacotado; binários `steam_api` no build
- [ ] Conquistas testadas; Steam Cloud: quota configurada e publicada (Auto-Cloud ou API)
- [ ] Overlay testado em Windows e Deck (flags `--in-process-gpu` e `--disable-direct-composition` como ponto de partida, v3-era)
- [ ] Electron em major suportada (42, 43 ou 44), CSP, Fuses, `contextIsolation` conforme decisão
- [ ] Executável assinado (reduz falsos positivos de antivírus)
- [ ] SDK embutido do `steamworks.js` verificado; plano B (`steamworks-ffi-node`) avaliado

**Steam Deck**
- [ ] Controles cobrem todo o conteúdo; glifos corretos por dispositivo
- [ ] Teclado na tela via API Steamworks (`showGamepadTextInput`) para entrada de texto
- [ ] Texto >= 9 px (alvo 12 px) em 1280x800; resolução 1280x800 ou 1280x720
- [ ] Sem launcher nem aviso de "não suportado"
- [ ] Testado em Game Mode em aparelho real

### 5.3 Checklist mobile (Capacitor)

- [ ] Capacitor 8 com Node 22+, Xcode 26+, Android Studio Otter; targetSdk 36 (requisito Play de 31/ago/2026, conferir)
- [ ] Assets locais com caminhos **relativos**; sem `server.url` em produção (reduz risco da Guideline 4.2, inferência)
- [ ] `SystemBars` + `viewport-fit=cover` + safe areas; teste com WebView Android antigo
- [ ] Um único handler de lifecycle; áudio retoma no iOS; áudio destravado por gesto
- [ ] Teste de `loseContext()`/`restoreContext()` (comportamento no v4 não confirmado)
- [ ] Save em Preferences/Filesystem (não `localStorage` puro), versionado, com backup
- [ ] Haptics com toggle; controles touch com alvos >= 48 dp e hit area ampliada
- [ ] UMP -> ATT (iOS) -> ads rewarded opt-in; privacy manifests e Data Safety (não pesquisados)
- [ ] Play: teste fechado com 12 testadores por 14 dias (conferir regra vigente)
- [ ] 60 fps como teto no iOS; perfil em Android de baixa gama
- [ ] Analytics (ex.: `@capacitor-firebase/analytics`) e consentimento

### 5.4 Checklist de QA de resoluções e acessibilidade

- [ ] Matriz da seção 4.7 executada (desktop, Deck, ultrawide, 4:3, celulares com notch, tablets, foldable)
- [ ] Escala inteira verificada em 1080p, 1440p e 4K; nenhum sprite borrado ou com shimmer
- [ ] Sem tile bleeding com câmera em movimento (testar no v4.2.x)
- [ ] HUD ancorado às safe areas; nada atrás do notch; ultrawide sem revelar fora do mapa
- [ ] Todas as telas navegáveis por teclado, gamepad e toque; glifos trocam em tempo real
- [ ] Remapeamento, tamanho de texto, daltonismo (não só cor), legendas, volumes separados
- [ ] Opção de reduzir shake/flash; modo Wait/Active; salvar a qualquer momento
- [ ] Textos com +30-40% de largura em outros idiomas; acentos de PT-BR renderizam
- [ ] Capturas automáticas por cena (Playwright) em pelo menos 3 viewports

---

## 6. Lacunas, conflitos e riscos

### 6.1 Conflitos entre fontes e como foram tratados

| Tema | Fontes em conflito | Tratamento neste guia |
|---|---|---|
| Data de lançamento estável do Phaser 4 | 10/04 (npm), 14/04 (GameDev.net), 16/04 (nota sobre artigo) | Usa 10/04 (registry); diferença irrelevante tecnicamente |
| Estilo de import | `import * as Phaser` (artigo oficial) vs default (README 4.2.1) | **Não resolvido**; testar no bundler e fixar no CLAUDE.md |
| Manutenção do `steamworks.js` | npm parado desde 08/2024 vs "opção mais usada"; GitHub não verificável | Risco sinalizado; alternativa `steamworks-ffi-node` (overlay experimental, mantenedor único) |
| Flags de overlay | Notas de Greenworks/Electron 11-16 | Ponto de partida, **v3-era**; testar no Electron 42-44 |
| Limiar de Popular Upcoming | ~7 mil/10-20 mil vs 100-120 mil (fonte única) | **Não resolvido**; só ordem de grandeza |
| Melhor dia de lançamento | Terça-quinta vs segunda/quarta e evitar terça (post antigo) | Terça-quinta (mais recente); Valve não permite fim de semana |
| Retenção mobile | GameAnalytics (D1 ~20%) vs Segwise (RPG D1 ~30%) | GameAnalytics como régua; Segwise indício por gênero |
| Texto mínimo no Deck | Valve 9 px vs dev 12 px | Alvo 12 px, piso 9 px |
| Datas de loja | Play 31/ago/2026 e Apple 28/abr/2026; "iOS 13 em 9/set/2026" vem de resumo automático | Confirmar nas páginas oficiais; projetos Capacitor 8 em geral atendem |
| Alvos de toque | 44 pt / 48 dp / WCAG 24-44 px de fonte secundária; "48 px" em outra nota | Unidade dp; confirmar HIG/Material primários |
| Context loss WebGL | Thread antigo ("v3 não suporta") vs changelog 3.80 | Thread provavelmente anterior à 3.80; v4 não confirmado |
| Conversão demo para wishlist | 16,33% / 19,3% / ~20% | Faixa 16-20% |

### 6.2 O que não foi verificado

- Atividade do repositório `ceifa/steamworks.js` em 2025-2026 e compatibilidade com Electron 42-44
- Comportamento de Electron nativo em Steam Deck Game Mode; qualquer jogo Electron/Phaser com status "Verified"
- Tamanho/RAM/startup de Phaser em Electron; latência de input; benchmarks de WebView e de 120 Hz no Android
- Compatibilidade de rexUI e rexVirtualJoystick com Phaser 4
- API de context restore no v4; integer scaling nativo e câmera pixel-perfect no v4; `resolution`/DPR no v4
- Seams de tilemap após o 4.0.0 estável; issues abertas no GitHub; relatos de r/phaser e Discord
- Plugins Capacitor 8 para Saved Games e iCloud; `@capgo/native-purchases`; versões exatas dos plugins oficiais
- Texto oficial da Steam sobre IA; diretrizes oficiais da Apple; termos comerciais de PixelLab e ElevenLabs
- Datas do Next Fest de 2027; custos de ASO e soft launch; taxas de loja e contas de desenvolvedor
- Post-mortems com números de jogos Phaser (Steam ou lojas); dados de cena Tibia-like

### 6.3 O que pode ficar desatualizado rapidamente

Versões (Phaser 4.2.1, Electron 44.5.1, Capacitor 8), política de IA da Steam e das lojas, requisitos de target API/Xcode, comandos e modelos do Claude Code, ferramentas do MCP do PixelLab, regras de teste fechado do Google Play, benchmarks de Next Fest e CPI. Artigos **v3-era ou antigos** nas notas: Josh Morony (PhoneGap/WKWebView e Capacitor 2018), guia Medium de AdMob citado pela doc do Capacitor, Drawize (Electron 16), electron-steam-notes (Electron 11), Babylon.js no Deck (2023/24), threads de Phaser 3.

### 6.4 Riscos principais

| Risco | Nível (inferência) | Mitigação |
|---|---|---|
| Visibilidade na Steam (mediana de ~US$1,1 mil) | Alto | Hook, página e demo cedo; metas realistas |
| Integração Steamworks/overlay em Electron | Médio-alto | Reservar tempo; testar cedo; plano B de wrapper |
| Plugins e tutoriais de v3 quebrando no v4 | Médio | Lint, skills oficiais, teste em dispositivo |
| WebView Android antigo e teto de 60 fps no iOS | Médio | Matriz com aparelho de baixa gama, tiers de qualidade |
| Rejeição 4.2 (Apple) | Baixo-médio | Jogo completo, assets locais, features nativas |
| Divulgação de IA incorreta | Médio | Registro de assets; conferir texto oficial |
| Escopo de RPG solo | Alto | Vertical slice e corte por sistemas |

Também é importante lembrar que muitos números vêm de agregadores e blogs (SteamPageAnalyzer, PressKit.gg, Segwise, Foxdata) que repetem terceiros; para citação final, prefira o original (HowToMarketAGame, Gamalytic, GameAnalytics).

---

## 7. Fontes

Fontes primárias e oficiais estão marcadas com (P); secundárias, blogs e vendors com (S). Todos os links vêm das notas de pesquisa.

### Phaser v4
- (P) [npm registry: phaser](https://registry.npmjs.org/phaser) · [GitHub releases](https://github.com/phaserjs/phaser/releases) · [Release notes 4.0.0](https://github.com/phaserjs/phaser/discussions/7274)
- (P) [Migration Guide](https://raw.githubusercontent.com/phaserjs/phaser/HEAD/changelog/v4/4.0/MIGRATION-GUIDE.md) · [CHANGELOG 4.2.1](https://raw.githubusercontent.com/phaserjs/phaser/master/changelog/v4/4.2.1/CHANGELOG-v4.2.1.md) · [README 4.2.1](https://cdn.jsdelivr.net/npm/phaser@4.2.1/README.md)
- (P) [Pixel Art Guide 4.2.0](https://cdn.jsdelivr.net/npm/phaser@4.2.0/docs/Phaser%204%20Pixel%20Art%20Guide/Phaser%204%20Pixel%20Art%20Guide.md)
- (P) Skills: [v3-to-v4-migration](https://unpkg.com/phaser@4.2.1/skills/v3-to-v4-migration/SKILL.md) · [v4-new-features](https://cdn.jsdelivr.net/npm/phaser@4.2.0/skills/v4-new-features/SKILL.md) · [tilemaps](https://cdn.jsdelivr.net/npm/phaser@4.2.0/skills/tilemaps/SKILL.md) · [scale-and-responsive](https://unpkg.com/phaser@4.2.1/skills/scale-and-responsive/SKILL.md) · [game-setup-and-config](https://unpkg.com/phaser@4.2.1/skills/game-setup-and-config/SKILL.md) · [input](https://unpkg.com/phaser@4.2.1/skills/input-keyboard-mouse-touch/SKILL.md) · [lista de skills](https://app.unpkg.com/phaser@4.2.1/files/skills)
- (P) Posts: [Phaser 3 vs 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4) · [Migrating 3 to 4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know) · [How to update Phaser 4](https://phaser.io/news/2026/06/how-to-update-phaser-4-to-the-latest-version-without-breaking-your-project) · [Filter System](https://phaser.io/news/2026/05/phaser-4-filter-system) · [SpriteGPULayer](https://phaser.io/news/2026/05/phaser4-spritegpulayer-performance) · [4.1.0 Salusa](https://editor.phaser.io/news/2026/04/phaser-4-1-0-salusa-release) · [4.2 Spine/Mesh2D](https://phaser.io/news/2026/07/phaser-4-2-spine-renderer-mesh2d-stencil) · [RC7](https://phaser.io/news/2026/03/phaser-v4-release-candidate-7) · [Renderer](https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games) · [phaser.io/phaser4](https://phaser.io/phaser4)
- (P) [PCT spec](https://unpkg.com/phaser@4.2.1/docs/Phaser%20Compact%20Texture%20Atlas%20Format%20Specification/Phaser%20Compact%20Texture%20Atlas%20Format%20Specification.md) · [Docs Scale Manager](https://docs.phaser.io/phaser/concepts/scale-manager) · [changelog 3.80 context restore](https://app.unpkg.com/phaser@4.2.1/files/changelog/v3/3.80/WebGLContextRestore.md) · [Tutorial Capacitor](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor)
- (S) [GameDev.net: Phaser 4 Released](https://gamedev.net/news/2759-phaser-4-released/) · [GameDev.net: Vite+TS](https://gamedev.net/news/2821-getting-started-with-phaser-4-vite-typescript-setup-using-the-official-create/) · [skills de terceiros phaser4-gamedev](https://www.skills.sh/yakoub-ai/phaser4-gamedev/phaser-mobile)
- Fórum/comunidade: [Tile bleeding](https://phaser.discourse.group/t/tile-bleeding/15124) · [Crisp rendering](https://phaser.discourse.group/t/settings-for-crisp-rendering/10000) · [Context restoration](https://phaser.discourse.group/t/phaser-and-webgl-context-restoration-handling/11028) · [Capacitor Android 15571](https://phaser.discourse.group/t/phaser-3-capacitor-android-apk-white-screens-texture-rendering-failures-and-orientation-issues/15571) · [Áudio iOS 14852](https://phaser.discourse.group/t/issue-of-audio-does-not-get-resumed-on-capacitor-ios-app-after-coming-to-foreground/14852) · [Rex joystick](https://phaser.discourse.group/t/rex-virtual-joystick-cannot-read-properties-of-undefined-reading-get/11348)
- Casos: [Desktop Heroes](https://phaser.io/news/2026/04/desktop-heroes-phaser-electron-steam) · [HEXSTORM em v4](https://phaser.io/news/2026/05/hexstorm-tears-of-arcadia-is-now-on-phaser-v4) · [Fuel Field](https://phaser.io/news/2026/07/fuel-field-phaser-roguelite-interview) · [Publishing on Steam with Electron (2025)](https://phaser.io/news/2025/03/publishing-web-games-on-steam-with-electron) · [Drawize](https://www.drawize.com/blog/tech-how-to-release-html5-game-on-steam)

### Electron, Steam e desktop
- (P) [Electron Timelines](https://www.electronjs.org/docs/latest/tutorial/electron-timelines) · [Security](https://www.electronjs.org/docs/latest/tutorial/security) · [Performance](https://www.electronjs.org/docs/latest/tutorial/performance) · [npm electron](https://registry.npmjs.org/electron)
- (P) [Steamworks Cloud](https://partner.steamgames.com/doc/features/cloud) · [Steam Input](https://partner.steamgames.com/doc/features/steam_controller) · [Steam Deck compat](https://partner.steamgames.com/doc/steamdeck/compat) · [URL alternativa Deck](https://partner.steamgames.com/doc/steamhardware/compat)
- Wrappers: [steamworks.js npm](https://registry.npmjs.org/steamworks.js) · [package.json](https://raw.githubusercontent.com/ceifa/steamworks.js/main/package.json) · [README](https://raw.githubusercontent.com/ceifa/steamworks.js/main/README.md) · [client.d.ts](https://raw.githubusercontent.com/ceifa/steamworks.js/main/client.d.ts) · [steamworks-ffi-node](https://registry.npmjs.org/steamworks-ffi-node) · [overlay doc](https://raw.githubusercontent.com/ArtyProf/steamworks-ffi-node/main/docs/STEAM_OVERLAY_INTEGRATION.md) · [greenworks](https://registry.npmjs.org/greenworks)
- (S) [electron-steam-notes](https://github.com/JamesMoulang/electron-steam-notes) · [Construct: overlay](https://construct.net/fr/blogs/ashleys-blog-2/trying-show-steam-overlay-1861) · [Construct forum](https://www.construct.net/en/forum/construct-3/general-discussion-7/refocus-export-direction-183136) · [Three.js Discourse](https://discourse.threejs.org/t/electron-js-the-best-choice-for-converting-a-web-based-game-into-a-desktop-application/92710) · [JS Legend Dev](https://jslegenddev.substack.com/p/exploring-the-various-ways-to-make) · [Choice of Games](https://forum.choiceofgames.com/t/linux-issues-on-steam/107741/11) · [Babylon.js forum](https://forum.babylonjs.com/t/steam-deck-linux-and-chrome-performance/47555) · [Brainhub](https://brainhub.eu/library/making-electron-apps-steam-deck-compatible) · [Bugnet AV](https://bugnet.io/blog/why-does-antivirus-flag-my-game) · [HotHardware](https://hothardware.com/news/steam-deck-fps-limit-adds-input-latency) · [Blendo Games](https://blendogames.com/news/post/2026-02-19-steamdeckverification/)

### Capacitor e mobile
- (P) [Capacitor 8 (Ionic)](https://ionic.io/blog/announcing-capacitor-8) · [Updating to 8.0](https://capacitorjs.com/docs/updating/8-0) · [SystemBars](https://capacitorjs.com/docs/apis/system-bars) · [Haptics](https://capacitorjs.com/docs/apis/haptics) · [Data Storage](https://capacitorjs.com/docs/guides/storage) · [Ads guide](https://capacitorjs.com/docs/guides/ads) · [FAQ](https://capacitorjs.com/docs/getting-started/faqs) · [@capacitor/app](https://cdn.jsdelivr.net/npm/@capacitor/app@8.1.1/README.md)
- (P) [Android target SDK](https://developer.android.com/google/play/requirements/target-sdk) · [Apple upcoming requirements](https://www.developer.apple.com/news/upcoming-requirements/) · [Play Saved Games](https://developer.android.com/games/pgs/savedgames) · [Google Play IA](https://support.google.com/googleplay/android-developer/answer/14094294) · [WebKit 294338](https://bugs.webkit.org/show_bug.cgi?id=294338) · [Vite env](https://vite.dev/guide/env-and-mode) · [Chrome overscroll-behavior](https://developer.chrome.com/blog/overscroll-behavior) · [MDN touch controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch)
- (S) [Capawesome edge-to-edge](https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/) · [Capawesome System WebView](https://capawesome.io/docs/sdks/capacitor/system-webview/) · [Capawesome AdMob](https://capawesome.io/docs/sdks/capacitor/admob/) · [Firebase Analytics](https://capawesome.io/plugins/firebase/analytics) · [RevenueCat](https://www.revenuecat.com/docs/getting-started/installation/capacitor.md) · [MobiLoud 4.2](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper) · [Capgo Xcode 26](https://capgo.app/blog/xcode-26-requirement-for-capacitor-apps/) · [DepScope AdMob](https://depscope.dev/pkg/npm/@capacitor-community/admob) · [Foxdata CPI](https://foxdata.com/en/blogs/2026-mobile-game-user-acquisition-cost-benchmarks-how-much-should-you-spend/) · [Segwise](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies.md) · [itch.io devlog Play testing](https://itch.io/devlog/981690/our-google-play-testing-gauntlet.amp) · [Apple dev forums 4.2](https://developer.apple.com/forums/thread/812889) · [specification.website touch](https://specification.website/spec/accessibility/touch-target-size/) · [Josh Morony (histórico)](https://www.joshmorony.com/increase-phaser-performance-on-phonegap-with-webgl-and-wkwebview/)

### Game design, mercado e acessibilidade
- [GameDiscoverCo: gêneros](https://newsletter.gamediscover.co/p/which-genres-have-ruled-steam-a-new) · [Bramble Royale](https://newsletter.gamediscover.co/p/why-did-this-excellent-roguelike) · [Qualidade da wishlist](https://newsletter.gamediscover.co/p/we-need-to-take-wishlist-quality) · [GameDev Reports: State of Steam](https://gamedevreports.substack.com/p/gamediscoverco-the-state-of-steam) · [GameDev Reports: GameAnalytics](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game)
- [HowToMarketAGame: lançamentos 2025](https://howtomarketagame.com/2026/01/08/how-many-games-were-released-in-2025/) · [wishlists para lançar](https://howtomarketagame.com/2026/06/25/archive-how-many-wishlists-should-i-have-when-i-launch-my-game/) · [Next Fest fev/2026](https://howtomarketagame.com/2026/04/13/making-sense-of-the-february-2026-steam-next-fest/) · [benchmarks Next Fest](https://howtomarketagame.com/2025/03/26/benchmarks-how-many-wishlists-can-i-get-from-steam-next-fest/) · [Vital Shell](https://howtomarketagame.com/2026/05/19/2026-state-of-bullet-heavens-how-vital-shell-succeeded/) · [Coming Soon page](https://howtomarketagame.com/2025/03/10/when-should-i-post-my-steam-coming-soon-page/) · [post antigo de lançamento](https://howtomarketagame.com/?p=2809)
- (S) [SteamPageAnalyzer: mediana](https://www.steampageanalyzer.com/blog/median-steam-game-2026) · [launch strategy](https://www.steampageanalyzer.com/blog/steam-launch-strategy) · [demos](https://www.steampageanalyzer.com/blog/do-steam-demos-increase-sales) · [Next Fest out/2026](https://www.steampageanalyzer.com/blog/steam-next-fest-october-2026) · [preço](https://www.steampageanalyzer.com/blog/steam-pricing-strategy) · [PressKit.gg](https://presskit.gg/field-guides/steam-page-optimization-guide) · [PCGamesN regional pricing](https://www.pcgamesn.com/steam/regional-pricing-tools-2026) · [WN Hub (Zukowski)](https://wnhub.io/news/stores-and-publishing/item-47311) · [GameGeeker (GDC 2026)](https://gamegeeker.com/zh/news/steam-indie-wishlist-monetization-strategy-gdc-2026) · [Recognizing Patterns](https://recognizingpatterns.substack.com/p/the-roguelite-cull-hasnt-happened) · [Alinea Analytics](https://alineaanalytics.substack.com/p/wishlist-to-buyer-conversions-for) · [AppSamurai](https://appsamurai.com/blog/rewarded-ads-in-mobile-games-strategy-data-and-best-practices/) · [App Developer Magazine](https://appdevelopermagazine.com/mobile-casual-benchmarks-report-2025/amp/)
- [Sea of Stars: Game Developer](https://gamedeveloper.com/business/sea-of-stars-reaches-5-million-players) · [Hitmarker](https://hitmarker.net/news/retro-inspired-rpg-sea-of-stars-sells-250-000-units-in-its-first-week-518069) · [Game Design Skills: FF](https://gamedesignskills.com/game-design/final-fantasy-combat-systems/) · [Davide Aversa](https://davideaversa.it/blog/turn-based-battle-systems-chapter-2-analytical-analysis/) · [RPG Playground: juice](https://rpgplayground.com/research-making-a-juicy-game/) · [GameAnalytics: juice](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/?p=12) · [GAG Basic](https://gameaccessibilityguidelines.com/basic/) · [Microsoft XAG](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines) · [Kenney Input Prompts Pixel 16x](https://kenney.nl/assets/input-prompts-pixel-16) · [Defold: GUI pixel art](https://forum.defold.com/t/gui-for-pixel-art-games-heres-how/77704)

### LLMs, assets e políticas
- (P) [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) · [Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PixelLab MCP docs](https://api.pixellab.ai/mcp/docs) · [PixelLab llms-full.txt](https://www.pixellab.ai/llms-full.txt) (não lido) · [Phaser skills via claudemarketplaces](https://claudemarketplaces.com/skills/phaserjs/phaser/v4-new-features) · [Context7 (diretório)](https://lobehub.com/it/mcp/upstash-context7)
- (S) [TBreak: política de IA da Steam](https://tbreak.com/steam-ai-disclosure-policy-update-developers/) · [PCGamesN: IA na Steam](https://www.pcgamesn.com/steam/ai-content-reporting) · [TechCrunch: Apple e IA](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai)

---

## Conclusão

A pesquisa muda a pergunta do projeto: o risco central deixou de ser "Phaser 4 é maduro o bastante?" (a resposta documentada é sim, com 4.2.1 estável há cerca de seis meses) e passou a ser **visibilidade comercial e integração de plataforma**. O código compartilhado entre web, Electron e Capacitor é viável, mas as evidências mais frágeis estão exatamente nas bordas: manutenção do `steamworks.js`, flags de overlay herdadas de Electron antigo, comportamento de WebGL context loss no v4 e compatibilidade de plugins de UI com Phaser 4. Esses pontos merecem os primeiros testes em aparelho e no Steam Deck, antes de investir em conteúdo.

Para um solo com Claude Code, a vantagem competitiva mais barata é processo: skills oficiais do Phaser no repositório, lint contra APIs do v3, testes de lógica pura, simulação de balanceamento e registro de assets de IA. Isso reduz retrabalho e protege a divulgação exigida pela Steam. Os templates T1 a T23 e o CLAUDE.md são ponto de partida autoral e ainda precisam ser validados no seu projeto real.
