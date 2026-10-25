# Builds nativos (Steam e Google Play)

Detalhes na skill `platform-builds`, em `docs/desktop.md` e em `docs/mobile.md`; checklist em `PLAN.md` (BETA B5 e RC4).

- **Duas cascas finas sobre o mesmo `dist/`**, cada uma com `package.json` e `bun.lock` próprios:
  - `desktop/` → **Electron** (Steam): serve o build por `app://truco-roguelite/`, empacota com electron-builder `--dir` (pastas = depots do SteamPipe, template em `steam/app_build.vdf`). Steamworks (conquistas espelhando os feitos; Cloud por Auto-Cloud) em `desktop/steam.js`, ligado por `steamAppId` em `desktop/package.json`.
  - `mobile/` → **Capacitor** (Android/Google Play, `com.alexgalhardo.trucoroguelite`): projeto Gradle versionado em `android/`; `MainActivity.java` põe tela cheia imersiva e mapeia o botão voltar para `Escape`.
- **Comandos:** `electron:install|dev|smoke|build`; `android:install|sync|run|open|debug|apk|bundle`. Android exige **JDK 21** (`JAVA_HOME=%LOCALAPPDATA%\Programs\jdk-21`; o Java padrão desta máquina é mais novo e o Gradle recusa com "Unsupported class file major version") e o Android SDK (`mobile/android/local.properties` com `sdk.dir`, gitignored, ou `ANDROID_HOME`).
- **QA:** `bun scripts/qa-devices.ts --set mobile|desktop` e `bun scripts/qa-android.ts` (APK real no emulador). Detecção da casca: `src/core/platform.ts`; plugins nativos só via `capacitor()?.Plugins`.
- **Versão** só no `package.json` raiz; o Android deriva o `versionCode` crescente em `scripts/lib/version-code.ts`.
- **Não mudar a origem** (`app://truco-roguelite` no Electron, padrão `https://localhost` no Capacitor) nem o `appId`: o save está no `localStorage`, que é por origem, e todos os jogadores perderiam o progresso.
- **Segredos fora do repo:** keystore Android (`*.jks`, secrets `ANDROID_KEYSTORE_BASE64`/`_PASSWORD`, `ANDROID_KEY_ALIAS`/`_PASSWORD`) e login/`config.vdf` do SteamCMD.
