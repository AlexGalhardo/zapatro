# Decisões pendentes (memorando para o dev)

Uma seção por decisão aberta. Cada uma traz o contexto, as opções com prós e contras, os números já medidos (com a fonte), a recomendação e o que muda no código se a opção for escolhida. Nada aqui foi aplicado.

Fontes principais: [balancing.md](balancing.md), [game-director-implementation.md](game-director-implementation.md) (seção 7), [release-1.0-runbook.md](release-1.0-runbook.md), [store-page.md](store-page.md), [launch-game.md](launch-game.md) e o mapa de BUGS.

## 1. Próximo custo de pular mesa

**Contexto.** A Promessa condicional (P-08) já está aplicada. Pular só a Pequena passa no aceite do GD-020 (até +5 p.p.). Pular Pequena e Grande continua dominante, porque a vantagem vem de jogar menos mesas, não da Promessa.

**Números medidos** (`docs/balancing.md`, seção "Pular mesa com Promessa condicional", 1000 runs, seeds 1 e 2):

Valores copiados da tabela de `docs/balancing.md` (colunas: taxa da linha / taxa de comparação, diferença em p.p. por seed 1 e seed 2; a leitura de cada coluna está na própria tabela):

| Variante | Taxas (seed 1 / seed 2) | Diferença (p.p.) |
|---|---|---|
| pula Pequenas, P-08 | 50,6% / 50,0% | +4,7 / +4,5 (passa) |
| pula Pequenas e Grandes, P-08 | 61,4% / 57,6% | +15,5 / +12,1 (falha) |
| pula Pequenas + meta +15% (teste, não aplicado) | 48,2% / 49,3% | +2,3 / +3,8 |
| pula Pequenas e Grandes + meta +15% (teste) | 55,8% / 54,7% | +9,9 / +9,2 (falha) |

**Opções.**

- A. Um pulo por Campeonato. Prós: limita a alavanca direto. Contras: não medido ainda; muda `canSkip` em `src/logic/run/run.ts`.
- B. Promessa menor. Prós: mudança de número. Contras: a doc diz que o valor da Promessa não é a causa; pouco efeito esperado.
- C. Sem pular a Grande (só a Pequena). Prós: medido e passa no aceite (+4,7 / +4,5). Contras: perde a opção de pular a Grande.
- D. Meta +15% após o pulo. Prós: já testado. Contras: não fecha o buraco (+9,9 / +9,2), e a doc o marca como teste, não aplicado.

**Números com metas ×2** (`docs/balancing.md`, seção "Opções medidas para decisão", 1000 runs, seeds 1 e 2): pular Pequenas +4,3 / +2,7 p.p. (passa no aceite de ≤ +5); pular Pequenas e Grandes +15,2 / +10,8 p.p. Com a base de ~26% depois da dobra, pular as duas vale ~+50% relativo (antes, ~+30%). A dobra não muda o ganho absoluto, mas piora o relativo.

**Recomendação.** C agora (é a única opção medida que passa no aceite). Medir A antes de decidir se ela entra no lugar de C.

**O que muda no código.** C: `canSkip` em `src/logic/run/run.ts` não aceita pular a Grande; a tela de "Pular (Promessa)" some na Grande. A: `canSkip` checa quantos pulos já foram feitos no Campeonato.

## 2. Recalibrar as Estacas

**Contexto.** A curva de Estacas deve dar 5 a 8 p.p. por degrau (D-39). Há duas medições com números diferentes.

**Números medidos** (`docs/balancing.md`):

- 600 runs (`bun scripts/stakes.ts --runs 600`, linha 103): 48,7 · 43,0 · 35,5 · 30,3 · 24,5 · 19,5 · 14,2 · 7,7%. Degraus 5,7 · 7,5 · 5,2 · 5,8 · 5,0 · 5,3 · 6,5 p.p. PASS.
- 1000 runs (`bun scripts/stakes.ts --runs 1000`, linha 148): 45,9 · 42,6 · 29,9 · 23,9 · 20,8 · 13,0 · 11,3 · 6,2%. FAIL: quatro de sete degraus fora de 5 a 8 p.p. Erro padrão de ~2,1 p.p. por degrau.
- Depois da dobra das metas (commit `cb62ef4`, `docs/balancing.md`): 24,3 · 20 · 14,3 · 12,7 · 10,3 · 5,7 · 4 · 1%. Degraus: 4,3 · 5,7 · 1,6 · 2,4 · 4,6 · 1,7 · 3,0 p.p. Só 2→3 fica na faixa de 5 a 8 p.p. A curva nova cai para 1% na Estaca 8, o que muda a conversa: a recalibração agora depende da decisão da seção 3.

As duas medições divergem em mais de 5 p.p. em alguns degraus, por causa do erro padrão. A decisão primeiro é qual medição é a oficial.

**Opções.**

- A. Medir de novo com 1000 runs e mais seeds, e só recalibrar se o FAIL persistir. Prós: evita mexer por ruído. Contras: mais tempo de relógio (~7,5 min).
- B. Recalibrar `goalMult` em `src/data/stakes.ts` (a alavanca forte, segundo a doc). Prós: resolve o degrau. Contras: mexe em número de gameplay; exige rodar `bun run balance` de novo.
- C. Aceitar o FAIL e registrar. Prós: sem mexer. Contras: o gate D-39 fica FAIL no release.

**Curva proposta com metas ×2** (`docs/balancing.md`, seção "Opções medidas para decisão", 300 runs): `goalMult` 1 · 1,1 · 1,15 · 1,2 · 1,2 · 1,2 · 1,2 · 1,2 → 24,3 · 20,3 · 17,3 · 15,0 · 12,0 · 8,0 · 5,3 · 2,7%. Degraus de 2,3 a 4 p.p., com a Estaca 8 em ~3%. A confirmação com 600 runs está em andamento.

**Recomendação.** Confirmar a curva proposta com 600 runs. Se ela se mantiver, aplicar `goalMult` em `src/data/stakes.ts` (hoje `[1, 1.15, 1.25, 1.3, 1.45, 1.5, 1.7, 1.8]`) e rodar `bun run balance`. A faixa de degraus precisa ser ajustada junto (−3 a −5 p.p.), porque a base nova é ~25%.

**O que muda no código.** Só se B: `src/data/stakes.ts`, lista `goalMult`. Depois, `docs/balancing.md` e `bun run balance` (PASS).

## 3. Faixa-alvo da D-39 depois da dobra das metas

**Contexto.** As metas foram dobradas (commit `cb62ef4`, `docs/balancing.md`, seção "Metas ×2 (2026-10-25)"). A faixa atual do D-39 é bot bom 40 a 60% na Estaca 1, bot aleatório abaixo de 5% e 5 a 8 p.p. por Estaca. Depois da dobra, o bot bom fica abaixo da faixa.

**Números medidos depois da dobra** (`docs/balancing.md`):

- Bot bom na Estaca 1: 45,2 / 45,6 / 45,0% antes → 23,0 / 25,8 / 25,4% depois.
- Bot aleatório: ~0%.
- Mãos por mesa: 4,5 → 6,0. Campeonato médio: 6,36 → 5,31.
- Estacas depois: 24,3 · 20 · 14,3 · 12,7 · 10,3 · 5,7 · 4 · 1%.
- Degraus: 4,3 · 5,7 · 1,6 · 2,4 · 4,6 · 1,7 · 3,0 p.p. Só o degrau 2→3 fica na faixa de 5 a 8 p.p.
- O gate do `balance` foi proposto para 20 a 35% de bot bom na Estaca 1.

**Opções para o dev:**

- A. Confirmar a faixa nova de 20 a 35% para o bot bom na Estaca 1 e manter a dobra (×2). Prós: o gate passa com a curva atual. Contras: o bot bom cai à metade da faixa antiga; precisa registrar a mudança no D-39.
- B. Reduzir a dobra para ×1,5 (já medida). Bot bom na Estaca 1: 31,4 · 34,2 · 31,8%, dentro da faixa proposta de 20 a 35% (seed 2 perto do topo). Mãos por mesa: 5,3. Estacas: 32,3 · 28,7 · 19,7 · 16,0 · 14,0 · 8,0 · 5,0 · 4,0%, com degraus irregulares (3,6 · 9,0 · 3,7 · 2,0 · 6,0 · 3,0 · 1,0 p.p.). Prós: mais perto da faixa antiga e menos mãos por mesa. Contras: a curva de Estacas fica desigual, então ainda precisa de recalibração.
- C. Manter ×2 e recalibrar as Estacas (seção 2) com a curva nova. Prós: mantém a dificuldade maior que a dev quer. Contras: a curva atual tem 6 degraus fora da faixa de 5 a 8 p.p.

**Recomendação.** A, se a dificuldade maior for a intenção: é a combinação com a curva proposta da seção 2, que já foi medida com ×2. B é a alternativa se o dev quiser o bot bom mais perto de 30%, mas aí a curva de Estacas precisa de nova medição. Em qualquer caso, a curva de Estacas (seção 2) precisa ser ajustada, porque 6 de 7 degraus da curva atual saem da faixa.

**O que muda no código.** Só o texto da D-39 em `PLAN.md` e a constante do gate, se a faixa mudar.

## 4. P-06: dados da Sortuda (figa e trevo)

**Contexto.** A boss "A Sortuda" e o feito `sortuda` ("Acabou a sorte") usam a ideia de sorte e superstição (figa e trevo). A decisão é se mantém o tema e como isso entra na classificação etária.

**Opções.**

- A. Manter o tema. Prós: é a identidade da boss; não há jogo com dinheiro real no jogo. Contras: nenhum relevante para a classificação; a resposta "não" a jogos de azar com dinheiro real continua valendo.
- B. Renomear a boss e o feito. Prós: afasta a leitura de jogo de azar. Contras: muda nome em EN e PT, a planilha de conquistas (`docs/steam-achievements.md`) e o almanaque.

**Impacto na classificação.** Nenhum com a opção A: o jogo não tem aposta com dinheiro real (a "aposta" é de pontos), e as respostas de IARC e da Steam já são "não" a gambling. Confirmar isso no questionário.

**Recomendação.** A. Registrar em `docs/decisions.md`. Se o dev preferir B, a mudança é só i18n (`boss.sortuda.*`, `feat.sortuda.*`) mais a planilha.

**O que muda no código.** Nada com A. Com B: `src/i18n/en.ts` e `pt-BR.ts` (chaves `boss.sortuda.*`, `feat.sortuda.*`) e `docs/steam-achievements.md`.

## 5. P-07: precedência entre o GDD e o PLAN

**Contexto.** `AGENTS.md` diz que o `PLAN.md` é a fonte da verdade. O GDD tem regras próprias em alguns pontos. O relatório GD-016 aponta divergências entre AGENTS e GDD.

**Opções.**

- A. O `PLAN.md` vale quando divergir (é o que o `AGENTS.md` já diz). Prós: uma fonte única, já escrita. Contras: o GDD fica como referência secundária e precisa ser atualizado.
- B. O GDD vale (documento de design). Prós: é onde o design está mais detalhado. Contras: contradiz o `AGENTS.md`; exige mudar o texto de precedência.
- C. Caso a caso, com registro. Prós: flexível. Contras: fácil de esquecer.

**Recomendação.** A, e registrar em `docs/decisions.md` que, em divergência, o `PLAN.md` vence e o GDD é atualizado no mesmo lote.

**O que muda no código.** Nada. Muda só a documentação: a regra de precedência no `docs/decisions.md` e, se houver divergência ativa, o GDD.

## 6. BUGS.md: fechar os 9 itens obsoletos

**Contexto.** O mapa de itens abertos do BUGS.md classificou 9 como obsoletos: B-03, B-05, B-06, B-11, B-13, M-06, M-09, M-12, M-13. O motivo é a mudança de direção visual (Art Bible v2): não há mais concept de mesa, polegares nem fundos por Campeonato, e os retratos vêm de `public/assets/gfx/portrait/`.

**Opções.**

- A. Fechar os 9 como obsoletos, com a justificativa do mapa. Prós: limpa a lista. Contras: se o dev quiser arte ilustrada depois, é preciso reabrir.
- B. Manter abertos e marcar "reavaliar". Prós: nenhuma perda. Contras: a lista continua com itens que não se aplicam.

**Recomendação.** A, depois que a seção de B-01 do BUGS.md estiver liberada para edição (o B-01 não fecha: fica `[ ]`).

**O que muda no código.** Nada. Só o BUGS.md.

## 7. Requisito de disco na Steam: 200 MB × 400 MB

**Contexto.** `docs/store-page.md` diz 200 MB disponíveis. `docs/launch-game.md` §3.3 diz 400 MB de disco. Nenhum dos dois traz a medição do build.

**Opções.**

- A. 200 MB, como está na página de loja. Contras: pode estar abaixo do tamanho instalado real.
- B. 400 MB, como está no roteiro de lançamento. Contras: pode exagerar.
- C. Medir o tamanho instalado do build Electron Windows (a pasta `win-unpacked`) e usar esse número com margem. Prós: é o número verdadeiro. Contras: exige um build pronto.

**Recomendação.** C. Medir `win-unpacked` do build 1.0 e usar o valor com margem (a Steam pede o mínimo, não o tamanho do download).

**O que muda no código.** Nada. Atualizar `docs/store-page.md` e `docs/launch-game.md` §3.3.

## 8. Tag `pixel-art` no itch.io

**Contexto.** A Art Bible v2 é híbrida: retratos e ícones em pixel art, o resto é vetor por código. A tag `pixel-art` da página do itch pode ser imprecisa. **Atualização 2026-10-27:** com a Art Bible v3 os personagens e fundos são pintados e só os ícones de UI e 8 chefes seguem em pixel; a tag `pixel-art` deixou de descrever o jogo (a opção A, tirar a tag, ficou mais forte).

**Opções.**

- A. Remover a tag. Prós: exato. Contras: perde uma busca.
- B. Manter com a descrição explicando o híbrido. Prós: mantém a busca. Contras: a tag continua imprecisa.
- C. Trocar por uma tag mais exata (ex.: retratos em pixel art). Prós: busca e exatidão. Contras: a tag precisa existir no itch (conferir na lista).

**Recomendação.** A, e usar a descrição para explicar o visual. (Os textos em `docs/store-page.md` já marcam "(conferir)".)

**O que muda no código.** Nada. Atualizar `docs/store-page.md` e a página do itch.

## 9. Trailer v1 em PT e v2 em EN (resolvida)

**Resolvida em 2026-10-25.** `trailer/src/Root.tsx` monta EN e PT com o mesmo `Trailer` (roteiro único em `trailer/src/script.ts`) e o mesmo `Teaser`; a `TrailerV2` saiu. O render das duas línguas está em `trailer/out/` (GD-012).
