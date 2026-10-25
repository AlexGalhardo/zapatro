---
name: platform-builds
description: Use when building, running, debugging or releasing Zapatro (Truco Roguelite) as a native app — the Electron desktop build for Steam (desktop/) or the Capacitor Android build for Google Play (mobile/) — or when a change to the web game, version, icons or CI must reach those builds.
---

# Platform builds (Electron → Steam, Capacitor → Google Play)

Both are thin shells around the same Vite build (`dist/`). The game code never imports Electron or Capacitor; each shell has its own `package.json` + `bun.lock`. Full guides: `docs/desktop.md`, `docs/mobile.md`. Checklists: PLAN.md → BETA B5 and RC4.

## Commands (repo root)

| Goal | Command |
|---|---|
| Install shells | `bun run electron:install` · `bun run android:install` |
| Desktop window | `bun run electron:dev` |
| Desktop package | `bun run electron:build` → `desktop/release/<os>-unpacked/` |
| Desktop CI check | `bun run electron:smoke` (or `<exe> --smoke` on the package) |
| Web → Android project | `bun run android:sync` (always after changing the game) |
| Phone (USB) | `bun run android:run` · Android Studio: `bun run android:open` |
| Android artefacts | `android:debug` (APK, no key) · `android:apk` · `android:bundle` (AAB for Play) |
| Icons | `bun run app-icons` (from `art-src/app-icon.png`) then `bun run --cwd mobile assets` |
| Screen QA | `bun scripts/qa-devices.ts --set mobile\|desktop` (dev server on :5191; screens come back in PA3) |
| Real APK QA | `bun scripts/qa-android.ts --serial emulator-5556` (AVD `gridbound_s20fe`) |
| Store guides | `docs/launch-game.md` (Steam, Google Play, itch.io, Poki) |

Android builds need **JDK 21** + Android SDK (`ANDROID_HOME`). On this Windows machine: `JAVA_HOME=%LOCALAPPDATA%\Programs\jdk-21` (portable; Gradle 8.14 does not run on the installed JDK 25/27), SDK in `%LOCALAPPDATA%\Android\Sdk`, emulator AVD `gridbound_s20fe` (1080×2400, Android 13). Another project's emulator may be running: always pass `--serial`/`-s`.

## Rules

- **Version:** only the root `package.json`. Electron gets it via `extraMetadata.version`; Android via `-PversionName` and `versionCode` from `scripts/lib/version-code.ts` (must only grow; RCs sort below the final).
- **Web-only features:** anything using browser downloads, `window.open`, pointer lock or URL params behaves differently in the shells. Detect the shell with `src/core/platform.ts` (`isElectron()`, `capacitor()`).
- **Native plugins:** install in `mobile/` only and call through `capacitor()?.Plugins.<Name>` with a local minimal type (the bridge exposes them without `@capacitor/core` in the page). Example: save export = Filesystem.writeFile + Share.share.
- **Keys:** Android back is dispatched as a synthetic `Escape` (`MainActivity.java`); keep Esc = pause/back in every scene. Keyboard listeners stay on `onKey`/window (`src/ui/keys.ts`).
- **Save origin:** Electron serves `app://truco-roguelite/`; changing scheme/host loses every player's save (localStorage is per origin). Capacitor uses its default `https://localhost`; do not set `server.hostname`/`androidScheme` for the same reason.
- **Secrets:** `*.jks`/`*.keystore` and `ANDROID_KEYSTORE_*` never in the repo; Steam builder login/`config.vdf` never in the repo.
- **Generated, not committed:** `desktop/release/`, `mobile/android/app/src/main/assets/public`, `android/app/build/`.
- **Steam depots:** `desktop/steam/app_build.vdf` maps `release/{win-unpacked,linux-unpacked,mac-arm64}`; the `default` branch is set live by hand in Steamworks.

## Pitfalls

- Touch mode (`touchUi.on`, `src/ui/touch.ts`) is decided at boot: module-level constants must not read it at import time (make them functions, see `ItemDetails.line()`).
- Synthetic `TouchEvent`s for QA need `pageX`/`pageY`: Phaser reads `pageX`, and a missing one lands the tap at (0,0) (the pause button).
- The Android WebView keeps `document.hidden` false when the app goes to the background: `MainActivity.onPause` sends `document` `pause`, which the table scene listens to.

- `cmd.exe` skips the current folder when `NoDefaultCurrentDirectoryInExePath` is set (it is, in agent shells): call `.\gradlew.bat`, never bare `gradlew.bat`.
- `sdkmanager.bat`/`avdmanager.bat` from Git Bash split `system-images;android-33;…` at `;`: use the slash form for sdkmanager, or run avdmanager through `cmd /c` with the id in quotes.
- Playwright `connectOverCDP` does not work with an Android WebView (the socket drops); use `_android.devices()` → `device.webView({ pkg })` (debug build only).
- The production build hides `window.__GAME__`; in the app, navigate the WebView to `https://localhost/?qa=1…` (same origin, same save) to script scenes.

- Unsigned APK (release build without keystore) → the phone says "App not installed as package appears to be invalid". Sideload `android:debug` instead; `release.yml` publishes the debug APK when the keystore secrets are missing.
- Linux Electron inside Steam/CI: pass `--no-sandbox` (Chromium's SUID helper is not root-owned there).
- macOS without Developer ID: sign ad hoc (`codesign --force --deep --sign - "Zapaco.app"`) or Apple Silicon kills the app.
- `smoke` in CI needs `enable-unsafe-swiftshader` (already in `main.js`) — no GPU means no WebGL otherwise.
- `bun --cwd dir run x` does not run the script; use `bun run --cwd dir x`.
- `cap sync` copies `dist/` as it is: run the web build first (the root scripts do).

## Before a release

1. Gates + `bun run build`; `bun run electron:smoke`.
2. Tag `vX.Y.Z` → `release.yml` attaches `zapatro_*_{windows,linux,darwin}_*.zip`, `zapatro_<versão>_android.aab/.apk`.
3. Steam: unzip into `desktop/release/`, run SteamPipe, set the build live. Play: upload the AAB to a testing track, then promote.

## Local release (when GitHub Actions cannot run)

The private repo can run out of Actions minutes ("The job was not started because an Actions budget is preventing further use"): the tag is pushed but `release.yml` never builds. `bun run release` (`scripts/release.ts`, skill `release-section` §6) does all of this; the notes below are what it automates and how to debug one step by hand:

- Web: `bun run build`, `VITE_DEMO=1 bun run build`, `VITE_DEMO=1 VITE_POKI=1 bun run build` (Poki < 8 MB); zip each `dist/` with `7z a -tzip` (no `zip` in Git Bash).
- Windows: `CSC_IDENTITY_AUTO_DISCOVERY=false bun scripts/build-electron.ts --skip-web` → zip `desktop/release/win-unpacked`.
- Linux (cross-build works from Windows; `steamworks.js` ships `linux64`): `bun scripts/build-electron.ts --skip-web -- --linux --x64`. Zip with Python `zipfile` setting `external_attr` 0755 on `truco-roguelite`, `chrome-sandbox`, `chrome_crashpad_handler` and `*.so*`: 7z on Windows drops the executable bit.
- macOS: **not possible** off a Mac (electron-builder refuses); say so in the release notes.
- Android: `JAVA_HOME=$LOCALAPPDATA/Programs/jdk-21` + `bun scripts/build-android.ts --skip-web --debug` → `zapatro_<versão>_android-debug.apk` (no keystore here, so no AAB).
- Each Electron build rewrites `desktop/release/`; zip one OS before building the next.
