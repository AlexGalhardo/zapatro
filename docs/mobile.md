# Build mobile com Capacitor (Android / Google Play)

O jogo web (Vite, `dist/`) roda num WebView nativo do Android via **Capacitor 8**. O subprojeto fica em [`mobile/`](../mobile/), com `package.json` e `bun.lock` próprios; o projeto nativo (Gradle) está em `mobile/android/` e é versionado. Aparelho de referência para testes: **Galaxy S20 FE** (Android 13, 1080×2400, 120 Hz).

## Como funciona

| Peça | Arquivo | O que faz |
|---|---|---|
| Config Capacitor | `mobile/capacitor.config.json` | `appId com.alexgalhardo.trucoroguelite`, `webDir ../dist` (o `cap sync` copia o build para `android/app/src/main/assets/public`, gitignored) |
| Atividade | `android/app/src/main/java/com/alexgalhardo/trucoroguelite/MainActivity.java` | Tela cheia imersiva (barras voltam com um gesto) e botão **voltar = Esc** (pausa na run, volta nos menus) |
| Manifesto | `android/app/src/main/AndroidManifest.xml` | Só paisagem (`sensorLandscape`), por isso o aviso "Gire o celular" do jogo web não aparece no app. Recorte da câmera no modo padrão: em paisagem o Android deixa uma faixa do lado do furo e o HUD nunca fica embaixo dele (o jogo não trata `env(safe-area-inset-*)`) |
| Gradle | `android/app/build.gradle` | `versionCode`/`versionName` recebidos do script; assinatura de release pelas variáveis `ANDROID_KEYSTORE_*` |
| Build | `scripts/build-android.ts` | `vite build` → `cap sync android` → Gradle (AAB, APK ou debug) |
| Versão | `scripts/lib/version-code.ts` | SemVer → `versionCode` crescente (`1.2.3-rc.4` → 1020304, `1.2.3` → 1020399) |
| Ícones e splash | `mobile/assets/` → `bun run --cwd mobile assets` | Fontes geradas por `bun run app-icons` a partir do paus com raio flat (`art-src/app-icon.svg`), splash sobre o fundo `#2B2B2B` do jogo; o `@capacitor/assets` gera todos os tamanhos em `android/app/src/main/res`; `assets/play-store-icon-512.png` é o ícone da página da Play. A splash do sistema (Android 12+) usa o mesmo fundo (`windowSplashScreenBackground` em `res/values/styles.xml`) e o WebView também (`backgroundColor` no `capacitor.config.json`) |

O jogo já tinha controles de toque (analógico flutuante, botão de pausa, menus por toque; R2.5 do PLAN) e o save em `localStorage`, que persiste no WebView. Nada mudou no código do jogo.

## Preparar o ambiente (uma vez)

1. **Android Studio** (versão estável atual), que já traz o Android SDK e o **JDK 21** (Settings → Build Tools → Gradle → Gradle JDK). Para a linha de comando, defina:
   - `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk` (Windows) ou `~/Android/Sdk` (Linux) / `~/Library/Android/sdk` (macOS)
   - `JAVA_HOME` = o JDK 21 (o do Android Studio fica em `<Android Studio>/jbr`)
2. No SDK Manager: *Android SDK Platform 36* e *Android SDK Build-Tools* mais recentes.
3. `bun install` e `bun run android:install`.

## Testar no celular (Galaxy S20 FE)

1. No celular: *Configurações → Sobre o telefone → Informações do software* → tocar 7× em **Número de compilação**. Depois *Opções do desenvolvedor* → ligar **Depuração USB** (ou *Depuração sem fio*).
2. Conectar por USB e aceitar a chave RSA no celular. Conferir com `adb devices`.
3. Rodar:

   ```bash
   bun run android:run      # build web + cap sync + instala e abre no aparelho escolhido
   bun run android:open     # abre o projeto no Android Studio (Run ▶, Logcat, profiler)
   ```

4. Depurar o WebView: builds de debug aceitam o Chrome DevTools em `chrome://inspect` no PC.
5. Sem cabo: `bun run android:debug` e instalar `mobile/android/app/build/outputs/apk/debug/app-debug.apk` (copiar para o celular e abrir, permitindo "instalar apps desconhecidos"). O CI também publica esse APK como artefato `truco-roguelite-android-debug-apk` em cada push.

Checklist no aparelho: abre em paisagem sem barras; analógico e botões respondem; voltar pausa/despausa e volta nos menus; áudio toca após o primeiro toque; o save sobrevive a fechar o app pelo multitarefa; FPS estável numa run cheia (medir no `chrome://inspect` → Performance com o build de debug); o recorte da câmera frontal não cobre o HUD.

## Scripts

| Comando | Resultado |
|---|---|
| `bun run android:sync` | build web + `cap sync android` (depois de mudar o jogo, antes de abrir no Android Studio) |
| `bun run android:run` | sync + instala e abre no aparelho/emulador |
| `bun run android:debug` | APK de debug (`apk/debug/`), sem keystore |
| `bun run android:apk` | APK de release (`apk/release/`); **só instala se assinado** (keystore nas variáveis `ANDROID_KEYSTORE_*`). Sem keystore sai `app-release-unsigned.apk`, que o Android recusa ("package appears to be invalid"): para o celular use `android:debug` |
| `bun run android:bundle` | **AAB de release** (`bundle/release/app-release.aab`) — o arquivo que vai para a Play Console |

## Chave de upload (assinatura)

Criar a chave, os secrets `ANDROID_KEYSTORE_*` e o build assinado: [launch-game.md](launch-game.md#41-chave-de-upload-uma-vez-10-min).

## CI/CD

- `ci.yml` → job **android**: build web, `cap sync`, APK de debug (JDK 21 + SDK do runner Ubuntu), artefato `truco-roguelite-android-debug-apk`.
- `release.yml` (tag `v*`) → job **android**: com os secrets, AAB e APK de release assinados (`zapatro_<versão>_android.aab`, `zapatro_<versão>_android.apk`); sem eles, só `zapatro_<versão>_android-debug.apk`.

## Publicar na Google Play

Passo a passo completo (conta, questionários, página da loja, testes interno e fechado, produção, atualizações): **[launch-game.md](launch-game.md)**.

## Plugins nativos (sem importar Capacitor no jogo)

O jogo não importa `@capacitor/*`: os plugins são instalados só na casca (`mobile/package.json`) e o bridge nativo os expõe em `window.Capacitor.Plugins` (confirmado no emulador). `src/core/platform.ts` → `capacitor()` devolve o bridge só no app nativo.

| Plugin | Versão | Uso |
|---|---|---|
| `@capacitor/filesystem` | 8.1.3 | Exportar save: grava o JSON no cache do app |
| `@capacitor/share` | 8.0.2 | Exportar save: abre a planilha de compartilhamento (Drive, e-mail, Arquivos…) |
| `@capacitor/haptics` | 8.0.2 | Vibração nos mesmos eventos do gamepad (`vibrate()` em `src/core/platform.ts`) |

Na `MainActivity`: tela sempre acesa (`FLAG_KEEP_SCREEN_ON`). O WebView não muda `document.hidden` quando o app vai para segundo plano, então o `onPause` mostra à página o que uma aba de navegador veria (`document.hidden` verdadeiro, `visibilitychange` e `blur`) e o `onResume` desfaz (`visibilitychange` e `focus`): o Phaser pausa o laço e emite `pause` (a mesa abre a pausa, MOB4.1) e o áudio fica suspenso em segundo plano. O antigo evento `document` `pause` não era ouvido pelo jogo; conferido no emulador em 2026-10-25.

Importar save funciona sem plugin (seletor de arquivo do WebView). Plugin novo: `bun add --exact` em `mobile/`, `bun run android:sync`, e chamada via `capacitor()?.Plugins` com um tipo mínimo local (ver `exportSave` em `src/core/storage.ts`).

## QA local no emulador (Windows)

Montado em 2026-09-29 (o plano de UX mobile saiu do repositório junto com os docs do Gridbound):

- **JDK 21 portátil** em `%LOCALAPPDATA%\Programs\jdk-21`: o Gradle 8.14 do Capacitor **não roda** no JDK 25 (JBR do Android Studio) nem no 27. Use `JAVA_HOME` apontando para ele.
- SDK em `%LOCALAPPDATA%\Android\Sdk` com `cmdline-tools`, platform 36 e imagem `system-images;android-33;google_apis;x86_64`. No Git Bash, `sdkmanager.bat` quebra argumentos com `;`: use a forma com barras (`system-images/android-33/google_apis/x86_64`).
- AVD **`gridbound_s20fe`** (1080×2400, 420 dpi, Android 13): `emulator -avd gridbound_s20fe`.
- `bun scripts/qa-android.ts --serial emulator-5556`: instala o APK de debug, abre o jogo e controla o WebView com o Playwright (`_android`, via adb). Checa processo, ponte Capacitor e plugins, gravação no cache, paisagem, voltar (pausa e retoma), toque numa carta, Home e volta à mesma mesa, plugin Haptics e erros de página; salva capturas em `qa-android/`. Os toques são `TouchEvent` sintéticos no canvas com `pageX`/`pageY` preenchidos (o Phaser lê `pageX`; sem ele o toque cai em 0,0).
- `bun scripts/qa-devices.ts --set mobile`: capturas no navegador emulando os 11 celulares de [smartphone-brasil-market.md](smartphone-brasil-market.md).

### Pendências conhecidas

- **Gráfico de recurso 1024×500 da Play:** depende do nome final (Q-01; a pesquisa de nome saiu do repositório).
- **UI/HUD pensados para o toque:** o plano de UX mobile saiu do repositório; ver PLAN (MOB).
- **iOS:** fora do escopo por enquanto (`bunx cap add ios` exige macOS + Xcode e conta Apple Developer).
