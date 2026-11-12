# Git, commits e versionamento

- Remoto único: **`origin`** → `https://github.com/AlexGalhardo/zeta-c.git` (público, histórico novo desde 2026-10-25; o histórico anterior fica no repo privado `AlexGalhardo/truco.lekzera.xyz`; o Gridbound, template de origem, fica em `tibia-roguelite-game`). Branch única **`main`**.

## Conventional Commits 1.0.0 (obrigatório)

```text
<type>(<scope opcional>)<! opcional>: <descrição em inglês, imperativo, minúscula, sem ponto>

[corpo opcional]

Co-Authored-By: ... (quando um agente commita)
```

- Tipos: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`. Breaking: `!` e/ou rodapé `BREAKING CHANGE:`.
- Escopos: `truco`, `score`, `ai`, `run`, `shop`, `meta`, `save`, `table`, `ui`, `hud`, `i18n`, `audio`, `art`, `debug`, `balance`, `tutorial`, `desktop`, `mobile`, `web`, `site`, `trailer`, `ci`, `plan`, `docs`, `skills`, `deps`, `release`.
- Micro-commits: um commit por mudança lógica. Validar a mensagem: `printf "<msg>" > m.txt && sh .githooks/commit-msg m.txt`.

## SemVer 2.0.0

Versão em `package.json` (+ `buildName` de playtest); cada release ganha tag anotada `vX.Y.Z[-pre]`. **Desde 2026-10-24 há 10 releases, numerados em ordem: `v0.1.0`, `v0.2.0`, `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.6.0`, `v0.7.0`, `v0.8.0`, `v0.9.0` e `v0.10.0`** (pedido do usuário; antes cada commit era um release). Os commits no meio não têm versão nem tag; as notas de cada release juntam o CHANGELOG de todos os commits desde o anterior (cada entrada linka o seu commit). Correção pequena = patch (`0.10.1`); passo seguinte = minor (`0.11.0`). **Todo release tem o `.exe` do Windows** (seção abaixo). API pública: formato do save e conteúdo jogável.

| Momento | Versão |
|---|---|
| Releases de 2026-10-24 | `0.1.0` … `0.10.0` (um minor por release, em ordem) |
| Correção pequena | patch: `0.10.1`, `0.10.2`… |
| Próximo passo | `0.11.0`… (sem sufixo, porque o `versionCode` trata sufixo sem número como 99) |
| RCs e lançamento | `1.0.0-rc.N` quando o dev decidir; `1.0.0` é o lançamento |

## Gates

Hooks em **`.githooks/`** (formato do farm-vs-aliens, sem Husky). O `bun install` liga com `git config core.hooksPath .githooks` (script `prepare`); num clone novo sem `bun install`, rode esse comando uma vez.

| Hook | O que faz |
|---|---|
| `commit-msg` | Recusa mensagem fora do Conventional Commits 1.0.0 (merge e revert gerados pelo git passam). O CI aplica o mesmo script aos commits de cada PR |
| `pre-commit` | Biome nos `.ts`/`.json` staged, `bun check --no-script` quando há `.ts`, markdownlint nos `.md` staged (mesmo escopo do `.markdownlint-cli2.jsonc`) |

Gates completos à mão:

| Momento | Comandos |
|---|---|
| Antes de commitar | `bun run check` → `bun run lint:md` → `bun run typecheck` → `bun test` |
| Antes de pushar | + `bun run build` e o smoke |

Nunca use `--no-verify`. Se um gate falhar, corrija a causa.

## CHANGELOG.md

Keep a Changelog 1.1.0: `[Unreleased]` no topo, uma seção por versão, grupos `Added/Changed/Deprecated/Removed/Fixed/Security`, frases em inglês para humanos. Uma seção por commit, que vira a nota do GitHub Release daquele commit: escreva para o jogador. O histórico do Gridbound fica no repositório dele.

## Fluxo de cada commit e de cada release

Regra do usuário (2026-10-24): **releases são poucos e em ordem** (10 até agora). O commit traz gates, docs e a entrada em `[Unreleased]`; só o marco sobe versão e tag. Siga a skill **`release-section`**:

1. Faça a mudança com PLAN, docs e testes juntos.
2. Gates: `check:fix` → `check` → `lint:md` → `typecheck` → `test` → `build` → smoke (`bun scripts/smoke.ts` com `vite preview` rodando).
3. **No mesmo commit:** a entrada no `[Unreleased]` do CHANGELOG (Keep a Changelog: Added/Changed/Deprecated/Removed/Fixed/Security, em inglês, para o jogador). **Só num marco** (quando o dev pedir): junte `[Unreleased]` numa seção `## [versão] - AAAA-MM-DD`, atualize os links do rodapé e suba o `package.json` (próxima versão SemVer da fase).
4. Commit em Conventional Commits, com escopo. Num marco, `git tag -a v<versão> -m "<versão>"` no commit do marco.
5. **Só quando o usuário pedir explicitamente** (regra de 2026-10-15): `bun run graph` e `git push origin dev:dev dev:main --follow-tags`. Até lá, commits e tags ficam locais.
6. Também só sob pedido: `bun run release` (`scripts/release.ts`): publica, do mais antigo ao mais novo, um GitHub Release para cada tag de marco ainda sem release, no formato de [AlexGalhardo/vukem](https://github.com/AlexGalhardo/vukem/releases) (abaixo); o release do `HEAD` é o "Latest" e leva os builds (`zapatro_<versão>_web.zip`, `_web-demo.zip`, `_web-poki.zip`, `_windows_amd64.zip`, `_linux_amd64.zip`, `_android-debug.apk` e `checksums.txt`). `--no-build` publica só as notas; `--web-only` leva os zips web, o `.exe` do Windows, o APK debug do Android e `checksums.txt` (só o Electron do Linux fica para o `release.yml`).
7. A tag também dispara o `release.yml`: com minutos de Actions, ele anexa ao release o que só sai no CI (macOS, AAB assinado, um `.sbom.json` por arquivo, `checksums.txt.sigstore.json` e `zapatro.intoto.jsonl`, a proveniência); sem minutos, o job nem começa e o release local basta. Empurre as tags **uma de cada vez** (o GitHub não cria evento de push quando mais de três tags sobem juntas).
8. Mudança que chega ao jogador web → `bun run site:build` e `bun scripts/site-check.ts`; o push na `main` publica (`--skip-demo` refaz só as páginas, sem regerar `/play` e `/demo`).

### O `.exe` de cada release

- **Todo release gera o executável portátil do Windows** `Zapatro-<versão>-win-x64.exe` **na raiz do projeto** (ignorado pelo git, `/Zapatro-*-win-x64.exe`), para o dev dar dois cliques e testar: `bun run exe` (`scripts/build-electron.ts --exe`; guarda só a versão atual na raiz). `bun run release` roda isso e anexa o arquivo ao GitHub Release como `zapatro_<versão>_windows_amd64.exe`; o `release.yml` faz o mesmo no job `electron` do Windows.
- Se o electron-builder falhar com `EPERM` (Defender), use `ELECTRON_DIST_WIN=<pasta do Electron descompactado> bun run exe` (docs/desktop.md).
- O save do `.exe` fica em `%APPDATA%\Zapaco` (a pasta antiga é mantida de propósito: `desktop/main.js`).

### Formato do release (igual ao do vukem)

- Título = a tag (`v0.1.85`); só o release do `HEAD` é "Latest"; só versão com sufixo `-` é pré-release.
- Notas = os grupos Keep a Changelog da seção do CHANGELOG (`### Added`, `### Fixed`…), uma linha por entrada: `- **escopo:** Texto ([abc1234](url do commit))`. O escopo vem do commit (`feat(ui): …` → `**ui:**`), então **use escopo** nas mensagens (`scripts/lib/release-notes.ts`; o CI usa o mesmo script).
- Arquivos: `zapatro_<versão>_<plataforma>.<ext>`, `<arquivo>.sbom.json`, `checksums.txt`, `checksums.txt.sigstore.json` e `zapatro.intoto.jsonl`.

### Histórico renumerado (2026-10-15)

Os 104 commits até `6be48af` ganharam uma tag cada (`0.0.1`…`0.0.17`, `0.1.0-alpha.1`…`alpha.35`, `0.1.0-beta.1`…`beta.23`, `1.0.0-rc.1`…`rc.29`), um release com as notas daquele commit e uma seção no CHANGELOG. As fases seguem as tags antigas (v0.0.4, v0.1.0-alpha.1, v0.1.0-beta.1), que foram apagadas e refeitas. O `package.json` desses commits antigos guarda a versão da época, não a da tag.

## Branch única `main` (pedido do usuário, 2026-10-25)

- Não há `dev`: todo commit vai direto para a **`main`** (`git push origin main`), depois dos gates: `bun run check:fix` (formatter) → `bun run check` (lint) → `bun run typecheck` (`bun check`) → `bun test` → smoke **Playwright headless** (`bun scripts/smoke.ts`) → `bun run build` → `bun run graph`.
- Todo push na `main` roda o `ci.yml` e o `deploy.yml` (site no GitHub Pages, <https://alexgalhardo.github.io/zapatro/>).

## Worktrees

Trabalho paralelo (ex.: geração de assets) roda em worktree própria (`git worktree add`), com arquivos exclusivos (`public/assets/gfx/`, `art-src/pixellab-alpha/`, `scripts/pl-alpha*.ts`). A integração na `main` é por merge depois dos gates. As worktrees `assets` e `qa` do desenvolvimento foram encerradas em 2026-10-25 (PLAN §12.1); hoje não há nenhuma.

## Release (1.0)

Mesmo fluxo de todo commit, com versão `1.0.0` (sem `--prerelease`), `bun run balance` verde e o checklist de RC4 do PLAN fechado.
