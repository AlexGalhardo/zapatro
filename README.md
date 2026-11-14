<div align="center">

<h1><strong>Zapatro</strong></h1>

[![CI](https://github.com/AlexGalhardo/zapatro/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexGalhardo/zapatro/actions/workflows/ci.yml)
[![Licença: MIT + ativos reservados](https://img.shields.io/badge/licen%C3%A7a-MIT%20%2B%20ativos%20reservados-blue.svg)](LICENSE.md)
[![Bun 1.4.4](https://img.shields.io/badge/bun-1.4.4-000000?logo=bun&logoColor=white)](package.json)
<a href="https://github.com/AlexGalhardo/zapatro/releases"><img src="https://img.shields.io/github/v/release/AlexGalhardo/zapatro?label=vers%C3%A3o" alt="Versão"></a>

<h3><strong>Roguelite de cartas sobre o Truco Paulista 2×2</strong></h3>

</div>

## Introdução

Zapatro é um roguelite de cartas sobre o **Truco Paulista 2×2**, com estrutura inspirada no Balatro: você e um parceiro IA enfrentam uma dupla IA; cada mão vira pontos (**Fichas × Mult**, com a aposta 1/3/6/9/12 como Mult base); a run tem 8 Campeonatos com loja, Manhas, cartas modificadas e chefes. O visual é pintado ("verão, pôr do sol") com a interface desenhada por código, e o jogo está em inglês e português do Brasil.

Feito com TypeScript, Vite e Phaser 4.2.x, rodando em Bun 1.4.4. Há builds para a web (itch.io, Poki e a demo do site), desktop (Electron) e Android (Capacitor).

## Sumário

- [Introdução](#introdução)
- [Jogar](#jogar)
- [Começando](#começando)
- [Documentação](#documentação)
- [Estabilidade](#estabilidade)
- [Contribuindo](#contribuindo)
- [Código de conduta](#código-de-conduta)
- [Vulnerabilidades de segurança](#vulnerabilidades-de-segurança)
- [Licença](#licença)

## Jogar

Site oficial: <https://alexgalhardo.github.io/zapatro/> (`/play/` completo, `/demo/` até o primeiro chefe). As páginas de loja (Steam, Google Play, itch.io e Poki) ainda não foram publicadas.

## Começando

Requisito: [Bun](https://bun.sh) 1.4.4.

```sh
bun install   # também ativa os hooks de git (.githooks)
bun run dev
```

| Comando | O que faz |
| --- | --- |
| `bun run dev` | Servidor de desenvolvimento (Vite) |
| `bun run build` | Build de produção |
| `bun test` | Testes (`bun:test`) |
| `bun run typecheck` | Checagem de tipos |
| `bun run lint` | Lint (Biome) |
| `bun run check` | Biome (lint e formatação) |
| `bun run lint:md` | Lint dos arquivos Markdown |
| `bun run balance` | Simulação de balanceamento |
| `bun run electron:dev` | Abre o jogo no Electron |
| `bun run android:run` | Roda o app Android (JDK 21 e `ANDROID_HOME`) |
| `bun run release` | Cria o GitHub Release das tags novas (só o mantenedor) |

## Docker

Imagem do jogo web: o build do Bun (`oven/bun:1.4.4-slim`) gera o `dist/` e o Caddy (`infra/Caddyfile`) serve na porta 8080, como usuário não-root.

```sh
docker build -f infra/Dockerfile -t zapatro .
docker run --rm -p 8080:8080 zapatro
```

## Documentação

- [PLAN.md](PLAN.md): decisões, regras do Truco, arquitetura e fases.
- [docs/](docs/): documentação (design, arquitetura, áudio, plataformas, lojas), começando por [docs/architecture.md](docs/architecture.md).
- [AGENTS.md](AGENTS.md): instruções para agentes de código e convenções do projeto.
- [CREDITS.md](CREDITS.md): créditos.

## Estabilidade

Zapatro segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/) e publica as versões como tags `vX.Y.Z` na `main`. O jogo ainda está em `0.x`. As mudanças estão no [CHANGELOG.md](CHANGELOG.md), no formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## Contribuindo

Obrigado por considerar contribuir. O guia completo (requisitos, comandos e verificações) está em [CONTRIBUTING.md](CONTRIBUTING.md).

### Pull requests

1. Crie um branch a partir da `main`.
2. Faça uma mudança lógica por commit, com testes.
3. Abra um pull request contra a `main`; o CI precisa passar.

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) com escopo, em inglês: `tipo(escopo): descrição` (por exemplo `feat(ui): ...`). O hook `commit-msg` confere o cabeçalho localmente.

## Código de conduta

Para manter a comunidade acolhedora, leia e siga o [Código de Conduta](CODE_OF_CONDUCT.md).

## Vulnerabilidades de segurança

Se encontrar uma vulnerabilidade, siga a [política de segurança](SECURITY.md) em vez de abrir uma issue pública.

## Licença

O **código-fonte** é licenciado sob a licença MIT. A **arte, o áudio, os textos e a identidade do jogo** têm todos os direitos reservados. Detalhes em [LICENSE.md](LICENSE.md).
