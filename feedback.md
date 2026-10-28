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
