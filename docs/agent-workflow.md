# Workflow para agentes

## Protocolo de sessão

1. Ler `AGENTS.md` (o `CLAUDE.md` só o importa) → **`PLAN.md`** (fase atual e próxima tarefa `[ ]`) → `docs/README.md` → o doc do assunto.
2. Pegar **uma** tarefa (ou um grupo pequeno e coeso) da fase atual, na ordem das dependências (PLAN §12).
3. Implementar respeitando as camadas de [architecture.md](architecture.md): regra em `src/logic`/`src/game`, números em `src/data`, render em `src/view`/`src/scenes`.
4. Verificar: `bun run check`, `bun run typecheck`, `bun test`; mudança visível → `bun run dev` e testar no Chrome (`?skipMenu=1&seed=1&debug=1`).
5. **Atualizar a documentação no mesmo lote** (pedido do usuário): PLAN.md (`[x]`/`[~]` com motivo), CHANGELOG.md (`[Unreleased]`), o doc de `docs/` afetado (arquitetura, GDD, balancing, art, audio, decisions). O objetivo é que o próximo agente entenda o estado real só lendo os docs.
6. **Skills:** se o fluxo for repetitivo ou você esbarrou numa armadilha (API, Phaser 4, pipeline), crie ou atualize uma skill em `.claude/skills/<nome>/SKILL.md` e liste-a no AGENTS.md.
7. Commit (Conventional Commits, com escopo) e, só quando o dev pedir, push. A entrada vai em `[Unreleased]` do CHANGELOG; releases são marcos (skill `release-section`).

## Convenções de código

- **Bun** é runtime e gerenciador (`bun add`, `bun run`, `bunx`).
- TypeScript strict; nada de `any` sem comentário.
- **Biome v2**, TAB largura 4, aspas simples (`bun run check:fix`).
- Nomes em inglês; `PascalCase.ts` para classes/cenas, `kebab-case.ts` para módulos.
- Sem número mágico de gameplay fora de `src/data` / `src/config/constants.ts`.
- Sem texto de UI fora de `src/i18n/` (EN + PT-BR juntos; o tipo `I18nKey` obriga as duas tabelas a terem as mesmas chaves).
- Sem cor fora de `src/config/palette.ts`.
- Todo visual tem chave (`public/assets/gfx/index.json` ou placeholder em `src/art/placeholders.ts`).
- Phaser **4**: confira a API nas skills antes de copiar exemplos da web.

## Definição de pronto

- Funciona no Chrome em tela cheia, sem scroll, sem erros no console.
- Gates verdes; lógica pura nova com teste (regras do Truco, pontuação, IA, run, save).
- PLAN.md, CHANGELOG.md e docs atualizados; commit + push feitos; GitHub Release da versão publicado com o changelog e os builds.

## Prompts prontos

- **Continuar**: "Leia AGENTS.md e PLAN.md. Execute a próxima tarefa pendente, verifique, atualize PLAN/CHANGELOG/docs, commite, faça push e o release."
- **Conteúdo novo**: "Siga a skill `add-game-content` para adicionar <Manha/chefe/parceiro>."
- **Asset**: "Siga a skill `game-art-assets` para gerar <asset> no PixelLab e colocá-lo no jogo."
