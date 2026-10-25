---
name: add-game-content
description: Use when adding or changing gameplay content in Zapatro (Truco Roguelite) — a Manha (joker), card modifier, Simpatia, Lance, Boteco upgrade, Promise, boss (chefe), partner, rival AI profile, starting deck or stake. Content is data-driven in src/data; this skill lists every file to touch so nothing (i18n, art key, test, docs) is forgotten.
---

# add-game-content

Todo conteúdo é **dado** em `src/data/` (design em `docs/gdd-game-design-document.md`, números em `docs/balancing.md`). Não escreva código especial por Manha/chefe; se precisar de gatilho ou efeito novo, generalize no motor (`src/logic/score/` ou `src/logic/run/`) com um campo novo no tipo.

## Checklist comum (vale para todo tipo)

1. Entrada em `src/data/<tipo>.ts` com `id` estável (camelCase, nunca muda depois de publicado: o save guarda ids).
2. Nome e descrição em `src/i18n/en.ts` **e** `src/i18n/pt-BR.ts` (`<tipo>.<id>.name` / `.desc`). Manhas mantêm o nome em português nas duas línguas; o tooltip EN explica.
3. Arte: chave `<tipo>.<id>` (PLAN §7.2); sem arte, `tex()` desenha o placeholder. Peça a arte na worktree de assets (status chave a chave em `docs/asset-status.md`).
4. **Teste** em `tests/<tipo>.test.ts` que prova o efeito **e** a condição (dispara quando deve, não dispara quando não deve).
5. `docs/balancing.md` (tabela do tipo) + `bun run balance` verde (a partir do ALPHA).
6. CHANGELOG `[Unreleased]` → skill `release-section`.

## Por tipo

- **Manha** (`src/data/manhas.ts`, `ManhaDef`): `when` = lista de condições `ManhaWhen` (`{ k: 'calledNoManilha' }`, `{ k: 'betAtLeast', bet }`, `{ k: 'trick', index, result }`, `holdsZap`, `fameAtLeast`…; todas precisam valer; `[]` = sempre), `per` (repete por vaza ganha que casa o filtro: `by`, `ranks`, `suit`, `manilha`), `effect` (`chips`, `addMult`, `xMult`, `money`), `rule` só para regras especiais já existentes (`ManhaRule`), `tags`, `rarity`, `price`. Condição nova = novo membro de `ManhaWhen` + avaliação em `src/logic/score/`. Ordem de disparo: esquerda → direita.
- **Modificador de carta** (`src/data/card-mods.ts`): efeito só para a sua dupla; overlay `card.mod.<id>`.
- **Simpatia / Lance consumível** (`src/data/consumables.ts`, i18n `simpatia.<id>.name|desc`): alvo (cartas do baralho) e operação (aplicar modificador, remover, duplicar, trocar naipe). Respeitar o mínimo de 20 cartas.
- **Lance** (`src/data/lances.ts`): condição de classificação da mão + Fichas/Mult base e por nível.
- **Chefe** (`src/data/bosses.ts`): regra como dado (`rule`), dupla nomeada, retrato `boss.<id>`; teste da regra.
- **Parceiro / perfil de IA** (`src/data/partners.ts`, `src/data/ai-profiles.ts`): parâmetros coragem, agressividade, peso da Fama, erro, chance de flagra; passiva do parceiro por nível 1–3.
- **Baralho inicial / Estaca** (`src/data/decks.ts`, `src/data/stakes.ts`): regra da run; Estaca mede o impacto no bot (bot bom perde 5–8 p.p. por Estaca).
- **Melhoria do boteco / Promessa** (`src/data/upgrades.ts`, `src/data/promises.ts`): uma Melhoria por Campeonato; Promessa ao pular mesa pequena/grande, paga na loja seguinte.
- **Efeito do coringa** (`src/data/jokers.ts`, `JOKER_EFFECTS`): regra na mesa em `src/logic/truco/table.ts`, pontuação em `src/logic/score/score.ts`; teste em `tests/zap-joker.test.ts` (`?hand=JK,…` dá o coringa). Texto da roleta e página do livro de regras em EN e PT-BR.
- **Feito / desbloqueio** (`src/data/feats.ts`): variedade, nunca poder (D-11); conquista Steam espelha o feito (`desktop/steam.js`).
