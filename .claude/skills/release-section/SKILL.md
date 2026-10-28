---
name: release-section
description: Use whenever you commit Zapatro (Truco Roguelite) — commits are plain Conventional Commits with a scope; releases are milestones. Runs the gates and updates PLAN/docs/CHANGELOG [Unreleased] in every commit; only when the developer asks for a release does it merge [Unreleased] into a version section, bump the SemVer version, tag it, push and publish the GitHub Release (bun run release).
---

# release-section

Fluxo em **todo commit**: gates, docs e a entrada em `[Unreleased]` do CHANGELOG; **sem bump nem tag**. Releases são marcos: 10 até 2026-10-24 (pedido do usuário), cada um com as notas de todos os commits desde o anterior. Remoto único `origin`: `AlexGalhardo/zeta-c` (público, histórico novo desde 2026-10-25; o anterior fica no privado `AlexGalhardo/truco.lekzera.xyz`). Branch única no remoto: `main`.

## 1. Gates (nesta ordem; corrija a causa, nunca `--no-verify`)

```bash
bun run check:fix      # formatter + fixes seguros do Biome
bun run check          # lint
bun run typecheck      # bun check --no-script (type checker nativo do Bun 1.4.4)
bun test               # bun:test
bun run build          # antes de qualquer push
bun run balance        # mudou número de gameplay? tem de continuar PASS (D-39)
bunx --bun vite preview --port 5191 --strictPort   # em background, depois:
bun scripts/smoke.ts --url http://localhost:5191   # sempre; bun scripts/qa.ts (skill qa-global) em mudança de tela/fluxo
```

Armadilhas conhecidas:

- `bun check` exige Bun ≥ 1.4.4 e `--no-script` (o script `check` do projeto é o Biome).
- O `tsconfig` inclui `scripts/`: um script que importa módulo removido de `src/` quebra o typecheck.
- Biome reformata linhas longas de dados (`src/data/*`); rode `check:fix` antes de `check`.
- Biome lê o `.gitignore`: pasta gerada nova (ex.: `site/public/demo/`) que não está nele vira aviso de arquivo > 1 MiB. Ignore no `.gitignore`.
- Arquivo local não versionado (ex.: `.vscode/settings.json` com 4 espaços) falha o `check`; formate com `bunx biome check --write <arquivo>` antes de commitar.
- Editar com Python no Windows grava **CRLF** (`lineEnding: lf` falha): `open(p, 'w', encoding='utf-8', newline='')`.
- Para validar só o staged, não use `git stash --keep-index --include-untracked` (pop falha com arquivo apagado e recriado). Commite e rode os gates no commit.
- Worktrees de agentes ficam em `.claude/worktrees/` (gitignored); nunca `git add -A` sem conferir o `git status`.
- **Release só com a árvore limpa (v0.13.1, 2026-10-27):** os builds do `bun run release` saem da pasta de trabalho, não da tag. Com agentes editando a mesma árvore, o WIP deles entra nos zips, no `.exe` e no APK. Antes do release: congele os agentes (WIP em patch fora do repo), `git status --short` vazio (arquivos não rastreados em `scripts/` também entram no typecheck: tire-os) e `git describe --tags --exact-match HEAD` igual à versão. Se já saiu contaminado: `gh release delete v<versão> --yes` (a tag fica) e rode de novo.
- **Poki < 8 MB conta a pasta `dist` inteira**, não só o primeiro download: imagens novas que carregam depois também somam. O plugin `poki-trim` do `vite.config.ts` remove do build Poki o que ela não precisa (`POKI_SKIP`).
- **`EPERM` ao renomear `win-unpacked.tmp`/`linux-unpacked.tmp`** (Defender): descompacte o zip do Electron do cache (`%LOCALAPPDATA%\electron\Cache\…\electron-v<versão>-win32-x64.zip`) e rode `ELECTRON_DIST_WIN=<pasta> bun run release -- --web-only` (o Linux sai pelo `release.yml`; Windows `.exe` e APK continuam). Apague `desktop/release/` antes.

## 2. Documentação no mesmo lote

- `PLAN.md`: `[x]` (ou `[~]` + motivo) nas tarefas feitas; decisão revista → atualize a linha da D-xx.
- `CHANGELOG.md`: frases em inglês em `[Unreleased]` (Added/Changed/Removed/Fixed). **É a nota do release**: escreva para o jogador.
- `docs/`: o doc afetado (GDD, visual.md, architecture, balancing, audio, site, launch-game, decisions).
- Fluxo novo repetitivo ou armadilha descoberta → skill em `.claude/skills/` + linha no AGENTS.md (o `CLAUDE.md` só importa o AGENTS.md).

## 3. Commit

Conventional Commits, mensagem em inglês, rodapé `Co-Authored-By` quando um agente commita. Nunca adicione `.env`, `graphify-out/`, `art-src/processed/`.

```bash
git add -A && git status --short   # revise antes: nada de .env ou lixo
git commit -m "feat(truco): add the trick resolution" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## 4. Versão, CHANGELOG e tag (só num release)

Num commit comum: só a entrada em `[Unreleased]` do CHANGELOG, sem bump nem tag. Num **release** (só quando o dev pedir):

1. Próxima versão em ordem: patch para correção pequena (`0.10.1`), minor para o próximo passo (`0.11.0`); os 10 primeiros foram `v0.1.0`, `v0.2.0`, `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.6.0`, `v0.7.0`, `v0.8.0`, `v0.9.0` e `v0.10.0`.
2. Junte `[Unreleased]` numa seção `## [versão] - AAAA-MM-DD` (Added/Changed/Deprecated/Removed/Fixed/Security, em inglês, para o jogador), atualize os links do rodapé e suba o `package.json`.
3. Commit `chore(release): v<versão>` e `git tag -a v<versão> -m "<versão>"`.
4. **Gere o `.exe` do Windows na raiz** (`bun run exe`; `Zapatro-<versão>-win-x64.exe`, gitignored): é o arquivo que o dev abre para testar. `bun run release` faz isso e o anexa.

## 5. Grafo e push (só quando o usuário pedir)

Commits e tags ficam locais até o usuário pedir push/release explicitamente (2026-10-15). Ao terminar, informe o que está pendente de push.

```bash
bun run graph                                     # antes de todo push (AST, ~15 s, local/gitignored)
git push origin main --follow-tags
```

## 6. GitHub Release (só quando o usuário pedir)

```bash
bun run release                 # scripts/release.ts, ~5 min com builds
bun run release -- --no-build   # só as notas
```

Publica, do mais antigo ao mais novo, um release para cada tag `v*` que ainda não tem (notas = seção do CHANGELOG). Exige que a tag da versão do `package.json` aponte para o `HEAD`; o release do `HEAD` leva os builds: zips web (completo, demo, Poki < 8 MB), Electron Windows e Linux (zip com bit executável), o APK de debug (JDK 21 de `%LOCALAPPDATA%\Programs\jdk-21`), `checksums.txt`, com a seção do CHANGELOG + uma nota "Builds" (`--prerelease` abaixo de 1.0.0 ou com `-`). Pare o `vite preview` antes (o Windows trava `dist/`). Confira com `gh release view v<versão>`.

A tag também dispara o `release.yml`. Sem minutos de Actions ("The job was not started because an Actions budget is preventing further use") ele nem começa; com minutos, anexa ao release existente só o que falta (macOS, AAB assinado). Não re-dispare o CI à mão. Detalhes de cada build: skill `platform-builds`.

## 7. Release que falhou no meio

- Falhou antes do `gh release create`: corrija e rode `bun run release` de novo (ele recria a pasta temporária).
- O release foi criado com asset errado: `gh release upload v<versão> <arquivo> --clobber` e refaça o `checksums.txt`.
- Tag errada antes de alguém baixar: pergunte ao usuário antes de apagar tag ou release publicados.

## 8. Site (quando a mudança chega ao jogador web)

`bun run site:build` (as imagens vêm de `docs/media/`: rode antes `bun scripts/store-art.ts` e `bun scripts/store-shots.ts` se as telas mudaram; `--skip-demo` não refaz `/play` e `/demo`) e `bun run site:deploy` → <https://truco.lekzera.xyz> (`/play/` completo, `/demo/` até o primeiro chefe). Confira com `curl -s -o /dev/null -w '%{http_code}' https://truco.lekzera.xyz/play/`. Trailer e presskit só com pedido do usuário. Detalhes em `docs/site.md`.
