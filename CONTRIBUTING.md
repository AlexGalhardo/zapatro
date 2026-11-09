# Contribuindo com o Zapatro

Obrigado por considerar contribuir. Zapatro é um roguelite de cartas sobre o Truco Paulista 2×2, feito com TypeScript, Vite e Phaser 4.2.x.

## Antes de começar

- Leia o [PLAN.md](PLAN.md) (decisões, regras do Truco, arquitetura), o [GDD](docs/gdd-game-design-document.md) e o [mapa do código](docs/architecture.md). As decisões valem até serem editadas: mude a decisão primeiro, depois a documentação, depois o código.
- Para algo maior que uma correção pequena, abra uma issue antes para combinar a abordagem.
- Arte e áudio seguem as regras de [docs/visual.md](docs/visual.md); ativos novos não podem copiar arte, logo, fonte ou layout de terceiros.

## Configuração local

Requisito: [Bun](https://bun.sh) 1.4.4.

```sh
bun install   # ativa os hooks de git (.githooks): commit-msg e pre-commit
bun run dev
```

| Comando | O que faz |
| --- | --- |
| `bun run dev` | Servidor de desenvolvimento (Vite) |
| `bun run build` | Build de produção |
| `bun test` | Testes (`bun:test`) |
| `bun run typecheck` | Checagem de tipos |
| `bun run check` | Biome (lint e formatação) |
| `bun run lint:md` | Lint dos arquivos Markdown |
| `bun run balance` | Simulação de balanceamento |
| `bun run electron:dev` | Abre o jogo no Electron |
| `bun run android:run` | Roda o app Android (JDK 21 e `ANDROID_HOME`) |

## Fazendo uma mudança

- Lógica pura (`src/logic`, `src/game`) sem Phaser; números em `src/data`; textos em `src/i18n`, sempre em inglês e português do Brasil juntos; cores em `src/config/palette.ts`.
- Mantenha a mudança focada em um assunto e escreva o teste junto.
- Sem dependência nova sem combinar antes; versões fixas.
- Atualize o `PLAN.md`, o `CHANGELOG.md` (em `[Unreleased]`) e a documentação afetada na mesma mudança.

## Verificações

Rode antes de abrir o pull request:

```sh
bun run check
bun run typecheck
bun test
bun run lint:md
```

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) em inglês, com escopo: `tipo(escopo): assunto no imperativo` (por exemplo `feat(ui): ...`). O escopo vira o prefixo da nota de release. O hook `commit-msg` confere o cabeçalho.

## Pull requests

1. Faça um fork e crie um branch a partir da `main`.
2. Faça um commit por mudança lógica, com testes.
3. Abra o pull request contra a `main`, descrevendo o que mudou e como testou. O pull request é mesclado por rebase.
4. O CI precisa estar verde antes da revisão.

Releases são marcos decididos pelo mantenedor; não inclua bump de versão no seu pull request.

## Bugs e segurança

- Bugs e ideias: abra uma [issue](https://github.com/AlexGalhardo/zapatro/issues) com passos para reproduzir.
- Vulnerabilidades: não abra issue pública; siga o [SECURITY.md](SECURITY.md).

## Licença

Ao contribuir, você concorda que sua contribuição de código é licenciada sob a [licença MIT](LICENSE.md). Arte e áudio seguem os termos de ativos reservados descritos lá.
