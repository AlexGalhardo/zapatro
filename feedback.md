# Feedback dos trinkets

## Revisão do Especialista

### 5c3a697 feat(trinkets) (revisado em 2026-10-27)

Testes: `tests/trinkets.test.ts` e `tests/i18n.test.ts` passam (21/0). Chaves `trinket.*`: 107 em EN e 107 em PT-BR.

Conferido sem achado:

- Odds da loja: `shopLevels`, `src/logic/run/trinkets.ts:69`. O Lendário depois do chefe sai sempre; Raro a 50% e Épico a 25% são sorteios independentes; o resto é Normal; tudo pelo `Rng` da run (`roll`).
- Sem repetir trinket na mesma loja, e nunca na raridade que o jogador já tem ou abaixo dela.
- "Maior raridade vence": `buy` guarda o máximo e `equippedList` usa a maior raridade da coleção.
- "Só equipados pontuam": `scoreHand` recebe `equippedOf(run)`.
- `tableReward` continua sendo a fonte do prêmio projetado e do pagamento.
- Malandragem: o contra virou `handMoney −2` em `weFolded` ("−$2 quando a dupla corre de um truco"), e o i18n em EN e PT-BR diz o mesmo. A troca é válida pela spec: um contra de Mult nunca pontuaria numa mão perdida.
- Save antigo: `meta.trinkets` vazio e filtrado por `isTrinketId`, nível entre 1 e 4; `parseRun` preenche `trinkets`, `trinketSlots` e `collection`.

| Sev. | Onde | Achado | Correção sugerida |
|---|---|---|---|
| Média | `src/logic/score/trinkets.ts:70` (`trucoAccepted`) e `:72` (`noTruco`/`bet1`) | Na mão de 11 a aposta vale 3 sem truco (`ELEVEN_BET`, `table.ts:507`). Com isso Grito de Truco dá +4 Mult sem ninguém trucar, o contra "−2 sem truco" não dispara e Seis Maldito "mão que vale 1" também falha. | Ler se houve truco aceito de verdade (ex.: `s.lastRaiser !== null`, ou um evento de truco aceito na mão), não `s.bet >= 3`; `noTruco` = sem truco aceito e `kind === 'normal'`. |
| Baixa | `src/game/match.ts`, `act()` (Lenda do Boteco, `loseTento`) | A perda de tento muda `state.score` depois do `apply`, mas o evento `handOver` leva o placar antes da perda. A mesa local lê o estado e mostra certo. Na LAN o servidor também lê o estado; só quem animar a partir do `e.score` vê o número antigo. | Aplicar o `loseTento` dentro do `handOver` (ou emitir um passo próprio) para estado e evento baterem. |
| Baixa | `src/scenes/RunScene.ts:552` (`?trinkets=`) | O atalho de teste grava os trinkets em `meta.trinkets`, o perfil do jogador, e eles ficam no save para sempre. | Somar só em `this.run.collection` e não em `meta`, ou documentar em `test-hacks.md` que o atalho persiste. |
| Baixa | `src/i18n/*.ts` (`companion.ze.flaw`, `upgrade.maisManha.desc`, `deck.dinheiro.desc`) | O texto ainda fala em "espaço de Manha". A spec diz que o Zé passa a "1 slot de trinket a menos", e o código já faz isso (`slotsFor`). | Trocar os textos de Manha por trinket quando `TRINKETS` estiver ligado, em EN e PT-BR juntos. |
| Pendente | Fama | A remoção ainda não começou: `fame` aparece em `match.ts`, `run-table.ts`, `ai/decide.ts`, `TableScene.ts` (4), `RunScene.ts`, `flat.ts` e `palette.ts`. O Professor ainda depende dela. | Fazer no marco da Fama: tirar barra, IA, feitos e cor; regra nova do Professor; `parseRun` ignorando `fame`; teste de save antigo. |

### Resolvido pelo Sênior (73f04f5, d5737b4)

- Média (mão de 11): `trucoAccepted`, `noTruco` e `bet1` leem `lastRaiser`/`reason`, não `s.bet`. Resolvido em 73f04f5, com teste.
- Baixa (Lenda do Boteco): o `handOver` agora leva o placar depois da perda. Resolvido em 73f04f5.
- Baixa (`?trinkets=`): a coleção de debug fica só na run e não vai ao perfil. Resolvido em 73f04f5.
- Baixa (textos de Manha): Zé, Beti, "Mais Manha" e baralho Dinheiro falam trinket (o baralho Dinheiro tira 1 espaço de trinket). Resolvido em 73f04f5.
- Pendente (Fama): removida (mecânica, barra, IA, Manhas, i18n); Professor agora dobra os contras dos trinkets. Resolvido em d5737b4.

---

## QA de balanceamento: trinkets (branch `feat/trinkets`)

Ciclo de QA do Estagiário, 2026-10-27. Só leitura da lógica: nenhum arquivo do Sênior foi editado. Script: `scripts/qa-trinkets.ts`.

## Estado atual

- Branch `feat/trinkets` em `10b3154` (docs), sobre `5c3a697` (feat), com `a76ece0` (metas ×0,6) incluído. `main` em `bdc2375` (v0.13.1).
- Árvore da branch tem alterações **de outro agente, não commitadas**: `src/data/championships.ts`, `src/logic/ai/decide.ts`, `src/logic/truco/table.ts`, `scripts/_cal.ts`. Não são minhas, não foram commitadas por mim.
- Gates na branch (2026-10-27 21:55):
  - `bun run typecheck`: sem erros em 206 arquivos (com `scripts/qa-trinkets.ts`).
  - `bun test` (ciclo 1): 335 rodados, 0 falhas, 4 puladas.
  - `bun run balance`: **FAIL** (ver Balanceamento).

## Balanceamento

### B-1 · Alta · Trinkets pioram o bot bom em vez de ajudar

- **Quando:** 2026-10-27 21:50, ciclo 1.
- **Evidência:**
  - Com trinkets (bot compra e equipa): `bun scripts/qa-trinkets.ts --runs 1000 --seeds 3` → win rate **13,0%** (3000 partidas), Campeonato médio 4,83, 7,03 mãos por mesa.
  - Sem trinkets, mesma branch (cópia exportada com `TRINKETS = false` em `src/config/features.ts`, 3000 partidas): win rate **22,6%**, Campeonato médio 5,83, 6,23 mãos por mesa.
  - Diferença: **−9,6 p.p.** em favor da base.
- **Severidade:** alta (é o item que o balance está acusando).
- **Sugestão:** os contras estão pesando mais que os bônus para o bot. Proposta: (a) reduzir o contra dos trinkets de maior peso (candidatos: `Cartas de ♥/♠/♦ valem −5 Fichas`, `Figurão`, `Seu Zé`, que cortam Fichas em muitas vazas), ou (b) subir o bônus Normal dos trinkets que o bot mais equipa. Medir cada mudança com `bun scripts/qa-trinkets.ts`. Número é do Sênior aplicar.

- **Remedido em 2026-11-09** (`main` em `2245345`, `bun scripts/qa-trinkets.ts --runs 1000 --seeds 3`, 3000 partidas, bot bom, mesma seed): **9,0%** com trinkets (Campeonato médio 4,62; 7,71 mãos por mesa) contra **12,0%** sem (flag `TRINKETS = false` em cópia fora do repositório; 5,02; 7,42). Diferença **−3,0 p.p.**: o item **continua aberto**, mas bem menor que os −9,6 p.p. de 2026-10-27, e as duas taxas estão dentro da faixa 5–20%. Ajustar contras ou bônus é decisão do dono; nenhum número foi mexido.

### B-3 · Média · Efeito de cada trinket isolado não está medido

- **Quando:** 2026-10-27 21:55.
- **Evidência:** `simulateRun(seed, bot, maxChamp, stake, partner)` (`src/game/run-sim.ts:296`) não aceita uma coleção pré-carregada. Sem isso, o QA não consegue equipar um trinket sozinho nem por raridade, então não há lista de dominantes (> base + 10 p.p.) nem de inúteis (≤ base).
- **Severidade:** média (bloqueia o item de dominantes/inúteis do pedido).
- **Sugestão:** adicionar um parâmetro opcional `setup?: (run: Run) => void` em `simulateRun`, chamado depois de `newRun`. Assim o QA passa uma função que faz `run.collection[id] = nível` e `equip(...)`. Mudança pequena, em arquivo do Sênior; o QA não a faz.

### B-4 · OK · Odds da loja conferem com a spec

- **Quando:** 2026-10-27 21:45, 10 000 lojas por caso (`shopLevels`).
- **Evidência:**
  - Após chefe: Lendário **100,00%** (esperado 100%), Raro 50,89%, Épico 24,49%.
  - Loja comum: Lendário 0%, Raro 50,34% (esperado 50%), Épico 25,45% (esperado 25%).
- **Severidade:** nenhuma (conforme).

## Bugs

### X-1 · Média · Arquivos untracked somem entre ciclos de QA

- **Quando:** entre 2026-10-27 (release v0.13.1) e o ciclo 1.
- **Evidência:** `docs/trinkets.md` e `scripts/qa-trinkets.ts` existiam e depois sumiram da árvore, sem mudança no `git status`. Foi preciso recriar o script. `docs/trinkets.md` voltou depois, em `10b3154`.
- **Severidade:** média (perda de trabalho não commitado).
- **Sugestão:** ver se o fluxo de release (`scripts/release.ts` ou `git clean`) remove arquivos untracked. Se remover, trocar por checagem que avisa em vez de apagar.

## Sugestões de melhoria

- **S-1:** hook `setup` em `simulateRun` (ver B-3). Permite o relatório por trinket e por raridade que o pedido original exige.
- **S-2:** o bot de trinkets (`trinketValue` em `src/game/run-sim.ts`) equipa pelo valor bônus − preço × 0,15, sem olhar o contra. Sugestão: descontar o contra do trinket na conta, para o bot não equipar o que o prejudica.
- **S-3:** o script `scripts/qa-trinkets.ts` ainda só mede a base com o bot de trinkets. Quando o hook de B-3 existir, adicionar o modo "um trinket por vez" e a tabela por raridade (Normal/Raro/Épico/Lendário).

## Resolvido

- B-2 (2026-11-09): `bun run balance --seeds 3` passa. Bot bom 7,4 · 8,6 · 7,0% (faixa 5–20%), aleatório 0,0% nas 3 seeds, 7,68–7,74 mãos por mesa (4–12), sem NaN. A faixa mudou em 2026-10-28 (metas ×2), e o gate fechou.
- Typecheck e testes da branch: verdes no ciclo 1 (335 testes, 0 falhas). Typecheck verde depois de incluir `scripts/qa-trinkets.ts`.
- O script `scripts/qa-trinkets.ts` foi recriado depois de sumir (ver X-1).
