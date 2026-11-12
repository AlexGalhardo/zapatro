# Balanceamento

Espelho dos números de `src/data/*` e resultados do bot (`bun scripts/sim.ts`, `bun run balance`). Metas (PLAN D-39): na Estaca 1, bot **bom** vence 5–20% das runs (20–35% até 2026-10-28, e 40–60% antes) e bot **aleatório** menos de 5%; cada Estaca tira 5–8 p.p. do bot bom.

Os valores iniciais estão no design ([GDD §4–7](gdd-game-design-document.md)) e entram aqui conforme são implementados (PRÉ-ALPHA e ALPHA).

## Perfis de IA (`src/data/ai-profiles.ts`, PA2)

| Perfil | Coragem | Agressividade | Blefe | Peso da Fama | Erro | Flagra | Sinaliza |
|---|---|---|---|---|---|---|---|
| coward | 0,10 | 0,10 | 0,03 | 0,4 | 0,05 | 0,15 | 0,6 |
| bully | 0,80 | 0,80 | 0,20 | 0,3 | 0,06 | 0,15 | 0,6 |
| calculator | 0,45 | 0,45 | 0,02 | 0,8 | 0,02 | 0,25 | 0,8 |
| bluffer | 0,55 | 0,60 | 0,35 | 0,4 | 0,06 | 0,20 | 0,5 |
| rookie | 0,50 | 0,50 | 0,10 | 0,1 | 0,25 | 0,10 | 0,4 |
| pro | 0,50 | 0,55 | 0,12 | 0,9 | 0,01 | 0,30 | 0,9 |

Amostras de Monte Carlo por decisão: 40. Chance de flagra do jogador humano: 0,2 (base).

**Torneio (2026-09-30, `tests/ai.test.ts`):** dupla `pro` × dupla aleatória, 1.000 partidas a 12 → **951 vitórias (95,1%)**, meta ≥ 85%. Decisão p99 < 5 ms.

## Pontuação (`src/data/cards.ts`, `src/data/lances.ts`, `src/data/championships.ts`, A2)

Fichas por carta: 4=1 · 5=2 · 6=3 · 7=4 · Q=5 · J=6 · K=7 · A=8 · 2=9 · 3=10; manilhas pica-fumo 12 · espadilha 13 · copas 14 · zap 15. Carta encoberta: 0.

| Lance | Fichas | Mult | +Fichas/nível | +Mult/nível |
|---|---|---|---|---|
| limpa (Vaza Limpa) | 10 | 1 | 10 | 1 |
| virada | 20 | 2 | 15 | 1 |
| suada | 15 | 2 | 15 | 1 |
| corrida | 5 | 1 | 5 | 1 |
| onze (Mão de 11) | 30 | 3 | 20 | 2 |
| ferro (Mão de Ferro) | 40 | 4 | 25 | 2 |
| queda | 50 | 5 | 25 | 2 |

Metas base por Campeonato: 100 · 250 · 600 · 1.500 · 3.500 · 8.000 · 16.000 · 30.000; Pequena ×1, Grande ×1,5, Chefe ×2. Valores iniciais sem calibragem (o bot de run chega no A5).

## Manhas e modificadores (`src/data/manhas.ts`, `src/data/card-mods.ts`, A3)

| Manha | Raridade | Preço | Condição | Efeito |
|---|---|---|---|---|
| malandro | comum | 4 | você pediu truco sem manilha | +4 Mult |
| maoDeLixo | comum | 4 | perdeu a 1ª vaza | +$2 |
| seuZe | comum | 5 | por vaza vencida com 4–7 | +15 Fichas |
| maoLeve | comum | 4 | por vaza vencida com ♦ | +$1 |
| ultimaCartada | incomum | 6 | perdeu a 1ª, venceu a 3ª | ×2 Mult |
| sangueFrio | incomum | 6 | aposta ≥ 6 | +8 Mult |
| duplaDinamica | incomum | 6 | por vaza vencida pelo parceiro | +3 Mult |
| teatro | rara | 8 | rival correu e você sem manilha | ×3 Mult |
| zapZap | rara | 8 | com o zap, por vaza vencida | ×1,5 Mult |
| ferroQuente | lendária | 10 | Lance Mão de Ferro | ×4 Mult |
| cangaceiro | comum | 5 | alguma vaza cangou | +8 Mult |
| peQuente | comum | 4 | Lance Vaza Limpa | +30 Fichas |
| reviravolta | incomum | 6 | Lance Virada | +6 Mult |
| onzeLetras | incomum | 6 | Lance Mão de 11 | ×2 Mult |

Modificadores: gold (Dourada) +$1 · heavy (Pesada) +20 Fichas · hot (Quente) +4 Mult se aposta ≥ 3. Sem calibragem (A5).

## Run (A4–A5, `src/data/economy.ts`, `championships.ts`, `partners.ts`, `bosses.ts`)

- Metas (Pequena; Grande ×1,5; Chefe ×2): 220 · 280 · 360 · 450 · 580 · 730 · 920 · 1.170 (dobradas em 2026-10-25; antes 110 → 585); infinito ×1,4 por Campeonato.
- Mesa em melhor de três quedas (D-59). Corrida 15 Fichas × 2 Mult. Delegado: Corrida ×0,5.
- Dinheiro: início $4; prêmio $3/$4/$5; rapidez +$1 por tento que faltava ao rival (teto $5); juros +$1 a cada $5 (teto $5); reroll $5 +$1; venda pela metade; Simpatia/Lance $3; pacotes $4 ($6 Manha; removidos em 2026-11-11, D-82).
- Rivais por Campeonato: C1 covarde/novato … C8 profissional/valentão/blefador (`RIVAL_POOLS`). Parceiros: Bruto (valentão, coragem 0,2, agressividade 0,6), Cida (calculista, coragem 0,2); erro ×1/×0,7/×0,4 por nível.
- Bot bom (`GOOD_BOT`): perfil profissional com coragem 0,2, agressividade 0,2, blefe 0,02; compra por raridade + tags em comum; guarda $10 para juros a partir de 3 Manhas. Hábitos do B0.2 em `HABITS` (`src/game/run-sim.ts`): Manhas de ×Mult à direita; com os espaços cheios vende a mais fraca quando a nova vale ao menos 2 a mais (raridade + tags); Espelho copia carta modificada, Benzedeira nunca tira carta modificada, Figa só com Mão Leve; **não pula mesa** (ver abaixo).

**`bun scripts/balance.ts --seeds 3 --runs 300` (2026-09-30):** bot bom 49,0% · 45,0% · 49,0%; aleatório 0,3% · 0,3% · 0,7%; 4,28 · 4,27 · 4,16 mãos por mesa; sem NaN. **PASS.**

Histórico da calibragem: com derrota na 1ª queda rival a mesa C1 vencia ~75–80% e nenhuma curva de metas passava de ~5% de runs vencidas; melhor de três levou a ~24%; bot cauteloso, Delegado pela metade e parceiros cuidadosos fecharam em 45–49%. O relógio dos tentos rivais domina: metas mais baixas quase não mudam a taxa de vitória.

## Rodada BETA B0 (2026-09-30, worktree `qa`)

`--stake N` em `sim.ts` e `balance.ts` já chega ao `simulateRun` (sai no resumo), mas ainda não muda nada: as Estacas entram no B2 (`newRun` recebe a Estaca quando existir). `--stake 2` deu o mesmo 51,7% da Estaca 1.

**Efeito de cada hábito do bot** (bot bom, 300 runs por seed, `HABITS` ligado um a um):

| Configuração | Seeds | Vitórias por seed | Média |
|---|---|---|---|
| sem hábitos (= ALPHA) | 1–5 | 49,0 · 45,0 · 49,0 · 39,3 · 47,7 | 46,0% |
| só ordenar Manhas | 1–3 | 49,0 · 45,7 · 48,7 | 47,8% (sem efeito: ×Mult é raro) |
| só vender a mais fraca | 1–5 | 49,7 · 50,0 · 50,3 · 50,0 · 52,3 | 50,5% |
| só Simpatias com critério | 1–5 | 42,3 · 48,7 · 47,0 · 46,7 · 47,3 | 46,4% (ruído) |
| **todos (padrão)** | 1–5 | 51,7 · 53,0 · 48,0 · 51,0 · 51,0 | **50,9%** |
| todos + pular Pequenas | 1–3 | 62,3 · 61,3 · 53,0 | 58,9% |
| todos + pular Pequenas e Grandes | 1–3 | 69,0 · 70,7 · 72,0 | 70,6% |

Com a venda, as Manhas mais vistas no fim da run mudam de `maoDeLixo`, `peQuente`, `gritador`, `contadorDeCartas` para `reviravolta`, `seuZe`, `maoDeLixo`, `ultimaCartada`, `caraDePau`, `teatro`. O dinheiro no fim continua alto (~$54): o bot não usa reroll e sobra caixa.

**Pular mesa é dominante.** Pular tira uma mesa inteira do risco de perder a run, e a Promessa não custa nada além da loja perdida (que o bot nem precisa, com ~$50 sobrando). Com metas ×1,25 e ×1,5 (medido mexendo em `CHAMPIONSHIP_GOALS` só na simulação) a vantagem continua: todos 46,0% / 38,6%; +Pequenas 55,0% / 49,9%; +Pequenas e Grandes 66,6% / 64,2%. Ou seja, subir metas não resolve; o custo de pular precisa ser de design. Por isso o bot padrão não pula (o portão mediria o atalho, não as mesas). Pedido ao fio principal no relatório do B0.

**`bun scripts/balance.ts --seeds 3 --runs 300` (bot do B0):** bot bom 51,7% · 53,0% · 48,0%; aleatório 0,3% · 0,3% · 0,7%; 4,23 · 4,13 · 4,08 mãos por mesa; sem NaN. **PASS.** O ritmo está colado no piso de 4 mãos por mesa.

## BETA (`0.1.0-beta.1`)

**`bun scripts/balance.ts --seeds 3 --runs 300` (Estaca 1, 60 Manhas):** bot bom 47,0 · 52,7 · 54,0%; aleatório 1,3 · 1,0 · 2,3%; 4,11 · 4,10 · 4,01 mãos por mesa. **PASS.**

**Estacas (`bun scripts/sim.ts --runs 400 --stake N`, D-61):** 48,0 · 49,7 · 47,2 · 44,8 · 33,8 · 25,0 · 24,5 · 15,2%. A queda total (≈ 33 p.p.) está dentro do esperado; os degraus 1→2, 2→3 e 6→7 ainda ficam abaixo de 5 p.p. (calibrar no próximo ciclo da worktree `qa`).

Regras por Estaca (cumulativas, antigas): 2 rivais com 1 tento de vantagem · 3 vantagem 2 e juros com teto $3 · 4 rivais um Campeonato mais duros · 5 metas ×1,3 e Pequena sem prêmio · 6 vantagem 4 · 7 rivais dois Campeonatos mais duros · 8 vantagem 6 e preços +25%.

### B2.2 calibrado (2026-10-01)

`bun scripts/stakes.ts --runs 600` (uma Estaca por processo, mesmas seeds do `balance`): **48,7 · 43,0 · 35,5 · 30,3 · 24,5 · 19,5 · 14,2 · 7,7%**, degraus de 5,7 · 7,5 · 5,2 · 5,8 · 5,0 · 5,3 · 6,5 p.p. **PASS** (D-39: 5–8 p.p.). Sete rodadas: a meta (`goalMult`) e a vantagem dos rivais em tentos são as alavancas fortes; juros com teto e rivais um Campeonato mais duros pesam pouco sozinhos. Com 600 runs o erro padrão de um degrau é ~2,9 p.p.

| Estaca | Metas | Vantagem dos rivais | Outras regras (cumulativas) |
|---|---|---|---|
| 1 | ×1 | 0 | jogo base |
| 2 | ×1,15 | 0 | |
| 3 | ×1,25 | 3 tentos | juros com teto de $3 |
| 4 | ×1,3 | 3 | rivais um Campeonato mais duros; Pequena sem prêmio |
| 5 | ×1,45 | 4 | |
| 6 | ×1,5 | 6 | |
| 7 | ×1,7 | 6 | rivais dois Campeonatos mais duros |
| 8 | ×1,8 | 7 | preços da loja +25% |

Os textos `stake.<n>` (EN e PT-BR) foram reescritos para bater com as regras (os antigos descreviam regras de uma versão anterior).

## ZAP e coringa (2026-10-15)

Regra da casa (PLAN §5.2 e §5.12): o ZAP passa a ser a carta de paus duas acima da vira (força 14, `ZAP_CHIPS` 18 Fichas) e todo baralho ganha um coringa (vale um 3, `JOKER_CHIPS` 10; efeitos `joker:double` ×2 e `joker:zeroed` ×0 no fim da contagem). `bun scripts/sim.ts` (500 runs, Estaca 1): bot bom **53,2%**, 4,14 mãos por mesa. `bun run balance`: **PASS** nas 3 seeds (bot bom 53,2 · 52,8 · 50,6%; aleatório 1,8 · 1,6 · 1,2%). Nenhum número existente mudou.

## Companheiros (2026-10-24)

10 companheiros, 3 sorteados por run, traços simétricos (`src/data/companions.ts`, GDD §8). Os rivais passam a usar o estilo do companheiro sobre o perfil do pool do Campeonato. `bun run balance` (`--seeds 3`, 500 runs, parceiro sorteado entre os 8 iniciais): bot bom **45,2 · 45,6 · 45,0%**; aleatório 1,6 · 1,6 · 1,2%; 4,51 · 4,49 · 4,51 mãos por mesa. **PASS.** Os traços ainda são proposta: números em `companions.ts`; ajuste só ali e rode `bun run balance`.

## Pular mesa com Promessa condicional (2026-10-25, P-08, GD-020)

Regra (`skipTable` em `src/logic/run/run.ts`): a Promessa só é resgatada se a mesa seguinte for vencida. Perder a mesa já encerrava a run antes da loja; o que muda é que pular a mesa seguinte também perde a Promessa que esperava (pular Pequena e Grande rende só a Promessa da Grande).

Comando: `bun scripts/sim.ts --runs 1000 --seed <1|2> --skip none|small|both` (bot bom, Estaca 1, parceiro sorteado; as três variantes usam as mesmas seeds `seed × 100 000 + i`). Aceite do GD-020: pular fica em até +5 p.p. sobre o bot que não pula.

| Variante | Regra | Seed 1 | Seed 2 | Δ vs. não pular |
|---|---|---|---|---|
| não pula | — | 45,9% | 45,5% | — |
| pula Pequenas | antes do P-08 | 50,6% | — | +4,7 |
| pula Pequenas e Grandes | antes do P-08 | 64,6% | — | +18,7 |
| pula Pequenas | P-08 | 50,6% | 50,0% | +4,7 · +4,5 ✅ |
| pula Pequenas e Grandes | P-08 | 61,4% | 57,6% | +15,5 · +12,1 ❌ |
| pula Pequenas | P-08 + meta +15% na mesa após o pulo (teste, não aplicado) | 48,2% | 49,3% | +2,3 · +3,8 |
| pula Pequenas e Grandes | P-08 + meta +15% (teste, não aplicado) | 55,8% | 54,7% | +9,9 · +9,2 |

Leitura: pular só Pequenas passa no aceite; pular as duas continua dominante, porque a vantagem vem de jogar 8 mesas em vez de 24 (menos chances de perder a run), não do valor da Promessa. Nem a meta +15% fecha o buraco. Próxima alavanca é decisão do dev (ex.: limitar a um pulo por Campeonato). Com 1000 runs o erro padrão de uma diferença é ~2,2 p.p. O bot padrão segue sem pular (`HABITS.skip` desligado) para o portão medir as mesas.

`bun run balance` depois da regra (`--seeds 3`, 500 runs): bot bom **45,2 · 45,6 · 45,0%**; aleatório 1,6 · 1,6 · 1,2%; 4,51 · 4,49 · 4,51 mãos por mesa. **PASS.**

## Estacas com o elenco novo (2026-10-25, GD-021)

`bun scripts/stakes.ts --runs 1000` (uma Estaca por processo, seeds `100 000 + i`, as mesmas do `balance` seed 1; ~7,5 min de relógio em 8 processos): **45,9 · 42,6 · 29,9 · 23,9 · 20,8 · 13,0 · 11,3 · 6,2%**. **FAIL** no D-39: com erro padrão de ~2,1 p.p. por degrau, quatro de sete saem da faixa de 5–8 p.p.

| Degrau | 1→2 | 2→3 | 3→4 | 4→5 | 5→6 | 6→7 | 7→8 |
|---|---|---|---|---|---|---|---|
| Queda (p.p.) | 3,3 ❌ | 12,7 ❌ | 6,0 | 3,1 ❌ | 7,8 | 1,7 ❌ | 5,1 |

Estaca 8 em 6,2% (≤ 15% ✅). A queda total (39,7 p.p.) é próxima da calibrada em 2026-10-01 (41 p.p.), mas os degraus ficaram desiguais com os companheiros: 2→3 (vantagem de 3 tentos) pesa demais e 1→2, 4→5 e 6→7 quase não pesam. Nenhuma regra foi mexida; rebalancear `src/data/stakes.ts` é decisão do dev.

## Metas ×2 (2026-10-25, pedido do dev)

Pedido: "dobre a dificuldade atual do jogo, dobrando a quantidade de pontos que o jogador precisa fazer por partida". A fonte única `CHAMPIONSHIP_GOALS` (`src/data/championships.ts`) foi dobrada: **220 · 280 · 360 · 450 · 580 · 730 · 920 · 1.170**. Grande (×1,5), Chefe (×2), Estacas (`goalMult`) e infinito (×1,4 por Campeonato) derivam dela. A partida rápida não tem meta; o tutorial usa `tableGoal(1, 'small')`, que passa de 110 para 220. Nenhum outro número foi compensado.

Mesmas seeds antes e depois (código idêntico, só a meta muda):

| Medida | Comando | Antes (metas ×1) | Depois (metas ×2) |
|---|---|---|---|
| Bot bom, Estaca 1 | `bun run balance` (`--seeds 3`, 500 runs, seeds `s × 100 000 + i`) | 45,2 · 45,6 · 45,0% | **23,0 · 25,8 · 25,4%** |
| Bot aleatório | idem | 1,6 · 1,6 · 1,2% | 0,6 · 0,0 · 0,0% |
| Mãos por mesa (duração) | idem | 4,51 · 4,49 · 4,51 | **6,03 · 5,95 · 5,94** (+33%) |
| Bot bom | `bun scripts/sim.ts --runs 1000 --seed 1` | 45,9% | 25,6% |
| Campeonato médio alcançado | idem | 6,36 | 5,31 |
| Runs que terminam em C1…C8 (de 1000) | idem | 56 · 66 · 44 · 59 · 59 · 80 · 64 · 572 | 110 · 111 · 78 · 88 · 96 · 70 · 82 · 365 |
| Dinheiro médio no fim | idem | $46,0 | $36,7 |

Estacas (`bun scripts/stakes.ts --runs 300`, seeds `100 000 + i`):

| Estaca | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Antes (%) | 48,7 | 43,7 | 30,0 | 19,0 | 22,0 | 13,3 | 12,7 | 5,0 |
| Depois (%) | 24,3 | 20,0 | 14,3 | 12,7 | 10,3 | 5,7 | 4,0 | 1,0 |
| Degrau depois (p.p.) | — | 4,3 | 5,7 | 1,6 | 2,4 | 4,6 | 1,7 | 3,0 |

Leitura: a dobra corta a taxa de vitória quase pela metade (−20 p.p.) e alonga a mesa em ~1,5 mão; as derrotas passam a vir mais cedo (C1–C2 dobram). Com a Estaca 1 em ~25%, a curva de Estacas comprime: só 2→3 fica em 5–8 p.p. e a Estaca 8 cai para ~1%. Com 300 runs o erro padrão de um degrau é ~3 p.p.

**Gate:** a faixa do bot bom em `scripts/balance.ts` passou de 40–60% para **20–35%** (o que a dobra produz, com folga), para o portão refletir a decisão em vez de falhar sempre. É proposta: o dev confirma a faixa (PLAN D-39). Aleatório < 5% e ritmo 4–12 mãos seguem iguais e passam.

## Opções medidas para decisão (2026-10-25)

Só simulação: nada aqui foi aplicado ao código (`src/data` segue com metas ×2 e as Estacas de 2026-10-01). As variantes rodaram numa cópia de `src/` fora do repo, com `CHAMPIONSHIP_GOALS`, `goalMult` e `rivalHeadStart` trocados por variáveis de ambiente; mesmas seeds dos comandos do repo. Cada Estaca do `stakes.ts` roda num processo próprio e só depende das próprias regras, então o resultado de uma Estaca com os mesmos parâmetros é idêntico entre variantes.

### 1. Curva de Estacas para a base ×2

**Faixa proposta: −3 a −5 p.p. por degrau.** A faixa antiga (−5 a −8 p.p. sobre uma base de ~45–49%) tirava 11–17% da taxa por degrau; sobre a base nova de ~25% isso dá −2,8 a −4,2 p.p., arredondado para −3 a −5. Sete degraus de ~3 p.p. levam a Estaca 8 a ~3%, o piso pedido (≥ 2–3%). Com 300 runs, o erro padrão de uma taxa de 15% é ~2 p.p.; um degrau isolado não separa 2 de 4 p.p. com segurança (a Estaca 8 com `goalMult` 1,45 deu mais vitórias que com 1,25: ruído).

`bun scripts/stakes.ts --runs 300` (metas ×2; `rivalHeadStart` atual `[0, 0, 3, 3, 4, 6, 6, 7]` salvo indicação):

| Variante | `goalMult` E1…E8 | Vitória % E1…E8 | Degraus (p.p.) |
|---|---|---|---|
| Atual | 1 · 1,15 · 1,25 · 1,3 · 1,45 · 1,5 · 1,7 · 1,8 | 24,3 · 20,0 · 14,3 · 12,7 · 10,3 · 5,7 · 4,0 · 1,0 | 4,3 · 5,7 · 1,6 · 2,4 · 4,6 · 1,7 · 3,0 |
| c1 | 1 · 1,1 · 1,1 · 1,15 · 1,2 · 1,2 · 1,25 · 1,25 | 24,3 · 20,3 · 18,3 · 16,0 · 12,0 · 8,0 · 5,0 · 1,7 | 4,0 · 2,0 · 2,3 · 4,0 · 4,0 · 3,0 · 3,3 |
| c2 | 1 · 1,1 · 1,15 · 1,2 · 1,3 · 1,3 · 1,4 · 1,45 | 24,3 · 20,3 · 17,3 · 15,0 · 12,0 · 7,0 · 4,3 · 2,3 | 4,0 · 3,0 · 2,3 · 3,0 · 5,0 · 2,7 · 2,0 |
| c3 | 1 · 1,1 · 1,15 · 1,15 · 1,2 · 1,2 · 1,2 · 1,2 | 24,3 · 20,3 · 17,3 · 16,0 · 12,0 · 8,0 · 5,3 · 2,7 | 4,0 · 3,0 · 1,3 · 4,0 · 4,0 · 2,7 · 2,6 |
| c4 (`rivalHeadStart` `[0, 0, 3, 3, 4, 5, 6, 6]`) | 1 · 1,1 · 1,15 · 1,15 · 1,2 · 1,2 · 1,25 · 1,25 | 24,3 · 20,3 · 17,3 · 16,0 · 12,0 · 7,3 · 5,0 · 4,3 | 4,0 · 3,0 · 1,3 · 4,0 · 4,7 · 2,3 · 0,7 |
| **Proposta** (montada de Estacas já medidas) | **1 · 1,1 · 1,15 · 1,2 · 1,2 · 1,2 · 1,2 · 1,2** | **24,3 · 20,3 · 17,3 · 15,0 · 12,0 · 8,0 · 5,3 · 2,7** | **4,0 · 3,0 · 2,3 · 3,0 · 4,0 · 2,7 · 2,6** |

A proposta pega cada Estaca de uma variante já rodada com os mesmos parâmetros (E4 de c2; as demais de c3). Quatro degraus ficam em 3–5 p.p. e três em 2,3–2,7 p.p. (dentro do erro de 300 runs); a Estaca 8 fica em 2,7%. Com metas já dobradas, `goalMult` quase plano (1,1 a 1,2) basta: os degraus passam a vir da vantagem dos rivais em tentos, dos rivais mais duros e da Pequena sem prêmio. Antes de aplicar: confirmar com `--runs 600` ou mais.

#### Confirmação com 600 runs

`bun scripts/stakes.ts --runs 600` com metas ×2, a linha "Proposta" e a "Atual" rodadas inteiras, mesmas seeds (`100 000 + i`). Erro padrão de cada ponto = √(p(1−p)/600); o de um degrau fica em ~1,2–2,4 p.p. (as Estacas usam as mesmas seeds, então o erro real do degrau é um pouco menor).

| Estaca | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Atual (%) | 24,2 ± 1,7 | 20,7 ± 1,7 | 13,0 ± 1,4 | 13,5 ± 1,4 | 9,5 ± 1,2 | 5,5 ± 0,9 | 2,7 ± 0,7 | 1,2 ± 0,4 |
| Degrau atual (p.p.) | — | 3,5 | 7,7 | −0,5 | 4,0 | 4,0 | 2,8 | 1,5 |
| Proposta (%) | 24,2 ± 1,7 | 20,3 ± 1,6 | 15,8 ± 1,5 | 13,8 ± 1,4 | 11,3 ± 1,3 | 6,8 ± 1,0 | 6,3 ± 1,0 | 3,0 ± 0,7 |
| Degrau proposta (p.p.) | — | 3,9 | 4,5 | 2,0 | 2,5 | 4,5 | 0,5 | 3,3 |

A proposta segura só em parte. A Estaca 8 fica em 3,0% (≥ 2 ✅) e a queda total é de 21,2 p.p. (atual: 23,0), mas 6→7 (0,5 p.p.) quase não pesa: as duas Estacas têm `goalMult` 1,2, e o único acréscimo da 7 (rivais dois Campeonatos mais duros) quase não muda a taxa. Os degraus 3→4 e 4→5 (2,0 e 2,5) ficam abaixo de 3 por pouco, dentro do erro. Ainda assim é melhor que a curva atual, que tem um degrau negativo (3→4) e outro de 7,7 p.p. (2→3).

Patch que o dev aplicaria (não aplicado): `src/data/stakes.ts:27`

```ts
        goalMult: [1, 1.1, 1.15, 1.2, 1.2, 1.2, 1.2, 1.2][stake - 1] ?? 1.2,
```

`rivalHeadStart` (linha 32) fica como está. Para corrigir o 6→7, o candidato ainda não medido é a Estaca 7 com `goalMult` 1,3 (e a 8 com 1,3, para não subir a 8): rodar `--runs 600` antes de aplicar. Depois de aplicar: `bun scripts/stakes.ts --runs 600` e atualizar o comentário do cabeçalho de `stakes.ts` ("loses 5–8 p.p. per Stake") e o PASS de `scripts/stakes.ts` (hoje 5–8 p.p.), se a faixa −3 a −5 for confirmada.

### 2. Alternativa: metas ×1,5 em vez de ×2

Metas 165 · 210 · 270 · 338 · 435 · 548 · 690 · 878 (Pequena).

| Medida | Comando | ×1 | ×1,5 | ×2 (atual) |
|---|---|---|---|---|
| Bot bom, Estaca 1 | `bun run balance` (`--seeds 3`, 500 runs) | 45,2 · 45,6 · 45,0% | **31,4 · 34,2 · 31,8%** | 23,0 · 25,8 · 25,4% |
| Bot aleatório | idem | 1,6 · 1,6 · 1,2% | 0,8 · 0,0 · 0,2% | 0,6 · 0,0 · 0,0% |
| Mãos por mesa | idem | 4,51 · 4,49 · 4,51 | **5,33 · 5,31 · 5,35** | 6,03 · 5,95 · 5,94 |

Estacas com ×1,5 e as regras atuais (`bun scripts/stakes.ts --runs 300`): **32,3 · 28,7 · 19,7 · 16,0 · 14,0 · 8,0 · 5,0 · 4,0%**, degraus 3,6 · 9,0 · 3,7 · 2,0 · 6,0 · 3,0 · 1,0 p.p. A ×1,5 fica no limite de cima da faixa de 20–35% (seed 2 em 34,2%); a mesa ganha ~0,8 mão em vez de ~1,5.

### 3. Pular mesa com metas ×2

`bun scripts/sim.ts --runs 1000 --seed 1|2 --skip none|small|both` (com P-08):

| Variante | ×1 seed 1 · 2 | Δ ×1 | ×2 seed 1 · 2 | Δ ×2 | Mãos por mesa ×2 |
|---|---|---|---|---|---|
| Não pula | 45,9 · 45,5% | — | 25,6 · 27,0% | — | 6,03 · 5,95 |
| Pula Pequenas | 50,6 · 50,0% | +4,7 · +4,5 | 29,9 · 29,7% | +4,3 · +2,7 | 6,68 · 6,60 |
| Pula Pequenas e Grandes | 61,4 · 57,6% | +15,5 · +12,1 | 40,8 · 37,8% | **+15,2 · +10,8** | 7,79 · 7,74 |

A dobra não muda o ganho absoluto de pular (pular as duas segue em +11 a +15 p.p.), mas em termos relativos ele piora: sobre uma base de ~26%, pular tudo vale +50% de vitórias (antes, +30%). Pular só Pequenas segue dentro do aceite (≤ +5 p.p.). O pulo duplo continua sendo a decisão pendente do GD-020.

## Estilos de parceiro (2026-10-15, historico; `PARTNER_STYLES` agora em `src/data/companions.ts`)

Cada parceiro tem um jeito próprio de jogar as apostas (`PARTNER_STYLES` em `src/data/partners.ts`, que substitui coragem, agressividade e blefe do arquétipo; texto `partner.style.<estilo>` na escolha de parceiro):

| Parceiro | Estilo | Coragem | Agressividade | Blefe |
|---|---|---|---|---|
| Bruto | agressivo: pede e aumenta truco com mão razoável, aceita quase tudo | 0,4 | 0,95 | 0,25 |
| Cida | conservadora: só pede com mão muito forte, nunca blefa, corre de pedido duvidoso | 0,05 | 0,05 | 0 |
| Jhony | blefador: pede truco com metade das mãos fracas em que o blefe é possível | 0,25 | 0,55 | 0,5 |
| Nino | destemido: aceita quase todo pedido | 0,6 | 0,5 | 0,1 |

Antes todos tinham coragem 0,2 (Bruto agressividade 0,6). Teste de comportamento: `tests/companion-styles.test.ts` (200 mesas por parceiro: Bruto pede mais truco e Cida menos; Zé pede com mão fraca bem mais que os outros, Cida quase nunca; Nino corre menos que Cida).

**`bun scripts/sim.ts --runs 300 --partner <id>`, seeds 1 e 2 (bot bom, Estaca 1), antes → depois:**

| Parceiro | Antes | Depois |
|---|---|---|
| Bruto | 53,3% · 57,7% | 49,0% · 48,7% |
| Cida | 46,7% · 51,3% | 56,0% · 57,7% |
| Jhony | 50,0% · 49,3% | 44,0% · 49,3% |
| Nino | 36,3% · 35,3% | 34,3% · 29,0% |

Nino com coragem 0,8 caía para ~31%; com 0,6 fica perto de antes (ele compensa subindo de nível a cada mesa). Cida conservadora virou a escolha mais segura e Bruto a mais arriscada, o que combina com os estilos.

**`bun run balance` (`--seeds 3`, 500 runs, parceiro sorteado entre Bruto e Cida):** bot bom 50,2% · 54,0% · 55,0%; aleatório 0,8% · 0,4% · 0,8%; 4,10 · 4,19 · 4,12 mãos por mesa. **PASS.**

A partida rápida continua com os arquétipos de `src/data/characters.ts` (Bruto valentão, Cida calculista): os testes de QA usam seeds fixas nela.

## Cartas especiais e dois coringas (2026-10-27)

O baralho passa de 41 para 45 cartas (2 coringas e Trevo, Olho e Raio, PLAN §5.12.1). Os efeitos não mexem em Fichas × Mult e a IA joga as cartas novas como um 3. `bun run balance`: **PASS** nas seeds 1 e 2 (bot bom 26,0 e 21,6%; aleatório 0,4 e 0,2%; 6,04 e 5,98 mãos por mesa). A seed 3 não terminou: o comando foi encerrado pelo tempo limite de 550 s, então o gate está confirmado em 2 de 3 seeds. O bot bom ficou perto do piso da faixa D-39 (20–35%); rodar as 3 seeds de novo antes do próximo release.

## Revisão para a 1.0 (2026-10-27)

Comandos: `bun scripts/sim.ts` (500 runs, seed 1), `bun scripts/sim.ts --partner <id> --runs 300` (uma dupla por vez, seed 1) e `bun run balance` (3 seeds × 500 runs).

Gate `bun run balance`, sem mudança de número: bot bom **26,0 · 21,6 · 27,0%** (faixa 20–35%); aleatório **0,4 · 0,2 · 0,2%** (< 5%); **6,04 · 5,98 · 6,05** mãos por mesa (4–12). PASS nas 3 seeds.

Sim geral (500 runs, seed 1): bot bom 26,0%, Campeonato médio 5,35, mãos por mesa 6,04, dinheiro médio $39,1. Runs que terminam em C1…C8: 55 · 42 · 39 · 55 · 52 · 40 · 39 · 178.

Por parceiro (300 runs, seed 1, bot bom):

| Parceiro (id) | Vitória | Campeonato médio | Mãos por mesa |
|---|---|---|---|
| Bruto (`bruto`) | 21,3% | 4,89 | 3,76 |
| Cida (`cida`) | 12,7% | 4,83 | 7,11 |
| Jhony (`jhony`) | 35,3% | 5,82 | 4,49 |
| Nino (`nino`) | 17,3% | 4,63 | 5,72 |

Outliers observados:

- **Espalhamento entre parceiros:** Cida (12,7%) e Nino (17,3%) ficam abaixo da faixa 20–35%; Jhony (35,3%) encosta no teto. A média fica dentro da faixa, mas a diferença de ~22 p.p. entre o melhor e o pior parceiro é a maior do elenco.
- **Cida:** o defeito `foldsRaises` (corre de seis, nove e doze) e o `catchBonus` de 0/0,1/0,2 não compensam; a escolha de qual lado mexer é de design (perk ou defeito), então não foi alterada.
- **Nino:** a taxa de vitória é baixa; `levelsPerTable` e `error ×2` pesam mais que o perk `catch +0,15`.
- **Manhas mais frequentes:** `asNaManga` (155 de 500 runs na mix geral) e `seuZe` (136) lideram. Frequência não é poder: não há dado de força por Manha nesta rodada, então não foi mexido.

Decisão: **sem mudança em `src/data/`**. Nenhuma correção pequena ficou claramente justificada: o gate passa e os outliers são de desenho de parceiro (perk × defeito), que pedem decisão do dev, não um ajuste de número. Próximo passo sugerido: testar `catchBonus` da Cida e o `levelsPerTable` do Nino em 300 runs cada, uma por vez, com `bun run balance` depois de cada.

## Calibração dos parceiros para a 1.0 (2026-10-27)

Condições de referência: `--skip none` (sem pular mesa), baralho padrão e Estaca 1. Não há escolha de mesa nem de baralho no sim, e o gate `bun run balance` já roda com `HABITS.skip` padrão (`none`). Meta do Game Director: cada parceiro entre ~18% e ~30% no bot bom.

Linha de base (300 runs, seed 1, bot bom):

| Parceiro (id) | Antes | Depois | Situação |
|---|---|---|---|
| Bruto (`bruto`) | 21,3% | 21,3% | dentro |
| Cida (`cida`) | 12,7% | 12,7% | fora (decisão do dev, ver abaixo) |
| Jhony (`jhony`) | 35,3% | 30,4% (1000 runs) | ajustado |
| Nino (`nino`) | 17,3% | 17,3% | pendente |
| Ze (`ze`) | 35,7% | 35,7% | pendente |
| Mia (`mia`) | 8,7% | 8,7% | pendente |
| Chico (`chico`) | 35,0% | 35,0% | pendente |
| Beti (`beti`) | 25,3% | 25,3% | dentro |
| Ayla (`ayla`) | 12,7% | 12,7% | pendente |
| Sheila (`sheila`) | 32,7% | 32,7% | pendente |

Mudança feita:

- **Jhony (`jhony`):** `bluffChips` [20, 40, 70] → [10, 20, 35] e defeito `falseSignals` `rate` 0,5 → 0,7 (mais mentiras, mais sinais que a mesa flagra). Medido com 1000 runs (seed 1): 35,0% → 30,4%. Com 300 runs, a combinação deu 28,7% e a taxa sozinha 35,0%: a diferença de 300 runs era ruído (erro padrão ~2,7 p.p.), por isso a medida de decisão é a de 1000 runs. Gate `bun run balance`: PASS nas 3 seeds (23,6 · 21,2 · 26,2%; antes 26,0 · 21,6 · 27,0%; aleatório < 0,5%; 5,96–6,07 mãos por mesa).

Testado e descartado:

- **Cida (`cida`), `catchBonus`:** [0; 0,1; 0,2] → [0; 0,15; 0,3] deu 11,7%; [0; 0,3; 0,6] deu 16,3%. A alavanca não chega a 18% sem um valor grande no nível 3. Voltou ao original. Decisão do dev: o defeito `foldsRaises` (corre de seis, nove e doze) é o que pesa, e mexer nele muda o tipo do traço.

Pendências: Nino, Ze, Mia, Chico, Ayla e Sheila ainda fora da faixa. Próximas medidas: Mia (8,7%, o mais baixo) e Ayla (12,7%), depois Nino, Ze, Chico e Sheila, um por vez, cada um com sim de 1000 runs e `bun run balance`.

Teste ajustado: `tests/content-beta.test.ts` ("10 companions; Juninho levels up every table, Zé Malandro bluffs count as yours") afirmava `chips === 40` para o Zé Malandro no nível 2; com o novo `bluffChips` o valor é 20.

## Calibração dos 10 parceiros: rodada de 2026-10-27 (1000 runs)

Meta do Game Director: cada parceiro entre ~18% e ~30% no bot bom, com `bun run balance` PASS nas 3 seeds. Referência: `--skip none`, baralho padrão e Estaca 1 (o sim não tem escolha de mesa nem de baralho; `balance.ts` usa `HABITS.skip` padrão, `none`). Medidas com 300 runs têm erro padrão de ~2,7 p.p.; onde está "1000", a medida é de 1000 runs.

| Parceiro (id) | Antes | Depois | Situação |
|---|---|---|---|
| Bruto (`bruto`) | 21,3% (300) | 21,3% (300) | dentro, sem mudança |
| Cida (`cida`) | 12,7% (300) | 12,7% (300) | fora; decisão do dev |
| Jhony (`jhony`) | 35,3% (300) → 35,0% (1000) | **30,4% (1000)** | dentro (topo), ajustado |
| Nino (`nino`) | 17,3% (300) | 17,3% (300) | fora; não testado nesta rodada |
| Zé (`ze`) | 35,7% (1000) | 35,7% (1000) | fora; decisão do dev |
| Mia (`mia`) | 8,7% (300) | 8,7% (300) | fora; decisão do dev |
| Chico (`chico`) | 35,0% (300) | 35,0% (300) | fora; decisão do dev |
| Beti (`beti`) | 25,3% (300) | 25,3% (300) | dentro, sem mudança |
| Ayla (`ayla`) | 12,7% (300) | 12,7% (300) | fora; não testado nesta rodada |
| Sheila (`sheila`) | 32,7% (300) | 32,7% (300) | fora; decisão do dev |

Mudança feita:

- **Jhony (`jhony`):** `bluffChips` [20, 40, 70] → [10, 20, 35] e defeito `falseSignals` rate 0,5 → 0,7 (um passo, dois números do mesmo traço de blefe). Com 1000 runs, 35,0% → 30,4%. Gate `bun run balance`: PASS (23,6 · 21,2 · 26,2%; antes 26,0 · 21,6 · 27,0%; aleatório < 0,5%; 5,96–6,07 mãos por mesa).

Testado e revertido (sem efeito ou efeito contrário):

- **Cida, `catchBonus`:** [0; 0,1; 0,2] → [0; 0,15; 0,3] deu 11,7%; [0; 0,3; 0,6] deu 16,3% (300 runs). Não chega a 18% com número razoável.
- **Zé, defeito `catch` delta −0,15 → −0,30:** 35,7% → 35,7% (1000). Sem efeito no bot bom.
- **Zé, perk `headStart` n 1 → 0:** 35,7% → 36,5% (1000). Sobe em vez de descer.
- **Mia, perk `caughtMult` x 0,5 → 0,3:** 8,7% → 8,0% (1000). Desce em vez de subir.

Por que os números não chegam à faixa (achados do código):

- **Chico (`chico`) e Sheila (`sheila`), defeito `signals` delta −1:** o número de sinais do parceiro é `max(0, 1 + delta)`, então com delta −1 já são zero sinais. Baixar mais não faz nada (o limite inferior é 0). Não há alavanca numérica nesse traço.
- **Sheila, perk `honestSignals`:** não tem número.
- **Zé, defeito `catch`:** o efeito não aparece no bot bom (ver acima).

Decisões do dev (mudança de tipo de traço, fora do escopo de números):

1. **Cida:** o defeito `foldsRaises` (corre de seis, nove e doze) é o que pesa. Trocar por um defeito de tipo mais brando, ou dar a ela um perk de tipo com número (ex.: `catch`), levaria para a faixa.
2. **Zé (`ze`), 35,7%:** trocar o perk ou o defeito por outro traço existente (ex.: um defeito de `signals` ou de `error`).
3. **Chico (`chico`), 35,0%:** o defeito `signals −1` está saturado; trocar por outro defeito existente.
4. **Sheila (`sheila`), 32,7%:** o perk `honestSignals` e o defeito `signals −1` não têm número; trocar um dos dois por traço com número.
5. **Mia (`mia`), 8,7%:** o perk `caughtMult` não sobe a taxa por número; o defeito `neverFolds` não tem número. Trocar o defeito ou o perk.

Pendentes (não testados nesta rodada): Nino (`nino`, 17,3%): a alavanca natural é o defeito `error` x2 (testar x1,5, o que o tornaria mais forte e subiria a taxa). Ayla (`ayla`, 12,7%): o perk `error` x0,25 (testar x0,15). Ambos precisam de 1000 runs e `bun run balance`.

## Perks e Defeitos roguelite dos parceiros (2026-10-27)

Substituem todos os traços antigos (`Trait`). Valem só com o companheiro como parceiro do jogador; números em `PARTNER_TRAITS` (`src/data/companions.ts`). O parceiro IA nunca responde ao truco dos rivais, e nada mexe em flagrar sinais.

| Parceiro | Vantagem | Defeito | Números |
|---|---|---|---|
| Bruto (`bruto`) | +3 Mult por vaza que ele vence | as cartas dele valem metade das Fichas (↓) | `trickMult` 3, `chipsDivisor` 2 |
| Cida (`cida`) | +$1 por mão vencida | itens da loja +$1 | `moneyPerWin` 1, `priceUp` 1 |
| Jhony (`jhony`) | juros +$1 por $5 no fim da mesa (máx +$5) | Rapidez pela metade (↓) | `interestStep` 5, `interestPer` 1, `interestCap` 5, `speedDivisor` 2 |
| Nino (`nino`) | +1 Mult base por mesa vencida | começa com −1 Mult base (mín 1) | `multPerLevel` 1, `startMult` −1 |
| Zé (`ze`) | item mais barato da 1ª loja do Campeonato grátis | −1 espaço de Manha | `freeOffers` 1, `manhaSlotsDown` 1 |
| Mia (`mia`) | manilhas +15 Fichas | cartas comuns −2 Fichas (mín 0) | `manilhaChips` 15, `commonChips` −2 |
| Chico (`chico`) | +20 Fichas por vaza vencida com ♣ | ♥ e ♦ −5 Fichas (mín 0) | `clubTrickChips` 20, `redChips` −5 |
| Beti (`beti`) | 1ª Manha comprada em cada loja −$1 | Manhas +$1 | `firstManhaOff` 1, `manhaPriceUp` 1 |
| Ayla (`ayla`) | ×1,5 Mult se a dupla vence as 2 primeiras vazas | mão perdida −$1 | `firstTwoTricksX` 1,5, `lostHandCost` 1 |
| Sheila (`sheila`) | 1 em 4 de dobrar o dinheiro da mesa vencida | metas +10% | `doubleMoneyChance` 0,25, `goalMult` 1,1 |

Medição (`bun scripts/balance-partners.ts --runs 1000`, bot bom, Estaca 1, seeds 700000+, só a escolha do parceiro muda; o bot ainda pula mesas na simulação e usa a loja completa):

| Parceiro | Vitórias | Campeonato médio | Dinheiro final |
|---|---|---|---|
| Bruto | 20,5% | 5,06 | 33,8 |
| Cida | 29,6% | 5,68 | 60,6 |
| Jhony | 17,4% | 4,85 | 60,2 |
| Nino | **55,5%** | 6,29 | 43,9 |
| Zé | 29,5% | 5,65 | 47,3 |
| Mia | 19,3% | 4,99 | 32,6 |
| Chico | 29,7% | 5,68 | 43,4 |
| Beti | 16,7% | 4,81 | 27,3 |
| Ayla | 27,1% | 5,67 | 16,5 |
| Sheila | 26,5% | 5,45 | 85,0 |

`bun run balance` (3 seeds × 500): bot bom 22,6% / 26,0% / 26,2%, aleatório 0%, 7,0 mãos por mesa: passa. Para calibrar: Nino fica muito acima (o +1 Mult por mesa não tem teto; testar teto de +5 ou +1 a cada 2 mesas), Beti e Jhony abaixo de 20% (Renovar, que o bot usa) e Bruto/Mia/Jhony perto do piso.

## Metas para o release 0.13.0 (2026-10-27)

Com a loja simples (`SHOP_SIMPLE`, 4 ofertas, sem Renovar nem pacotes) e a seleção de mesa desligada (`TABLE_SELECT=false`), o bot bom caiu para 13,2 · 10,8 · 8,6% (meta D-39: 20–35%). A causa é a economia mais curta, não os parceiros. Ajuste de metas: `CHAMPIONSHIP_GOALS` de 220 · 280 · 360 · 450 · 580 · 730 · 920 · 1170 para **130 · 170 · 220 · 270 · 350 · 440 · 550 · 700** (×0,6 da fonte, que já era ×2 de 2026-10-25). Teste de sim (1000 runs, seed 1): ×0,7 → 20,3%; ×0,6 → 24,7%.

Gate `bun run balance` após o ajuste: bot bom **24,4 · 25,4 · 24,4%** (antes 13,2 · 10,8 · 8,6%); aleatório 0,2 · 0,0 · 0,0%; 6,36 · 6,36 · 6,27 mãos por mesa. PASS nas 3 seeds.

Nota: esta mudança reverte parte da dobra de metas de 2026-10-25, a pedido da calibração para o release 0.13.0; o dev aprovou calibrar antes do release.

## Trinkets, sem Fama, 2 quedas (2026-10-27)

Com os trinkets no lugar das Manhas o bot bom caiu para ~10–13% (22,6% com `TRINKETS=false`). Causa: os Contras de Mult (−1 a −3) zeravam a mão de aposta 1, porque o Mult base é 1 e `totals` deixava o Mult chegar a 0 ou menos (houve mãos com −113 pontos). Correções, nesta ordem:

1. `totals` (`src/logic/score/score.ts`) nunca deixa o Mult abaixo de 1 nem as Fichas abaixo de 0 (o coringa "zerada" continua zerando).
2. Contras suavizados no Normal (a escala de raridade fica): Zap de Ouro −2 → −1 Mult, Saideira −3 → −1, Mão de Ferro −2 → −1, Virada −3 → −1, Pinga de Abertura −5 → −2 Fichas; Confia em Mim ganhou Bônus +15 → +20 Fichas.
3. Metas: `CHAMPIONSHIP_GOALS` 130 · 170 · 220 · 270 · 350 · 440 · 550 · 700 → **105 · 135 · 175 · 215 · 280 · 350 · 440 · 560** (×0,8).

A regra "rivais chegam a 12 uma vez" (`QUEDAS_TO_LOSE = 1`) foi testada e descartada: o bot bom ganhava 0% (14% mesmo com metas de 5 pontos), pois uma única mão de truco 9/12 perdida encerra a mesa. Ficou `QUEDAS_TO_LOSE = 2` (decisão do dev); a Queda da nossa dupla zera os tentos das duas duplas.

Gate `bun run balance` (500 runs por seed): bot bom **23,4 · 27,0 · 26,6%**; aleatório 0,0 · 0,2 · 0,2%; 6,35 · 6,14 · 6,19 mãos por mesa. PASS nas 3 seeds.

## Metas ×1,1 (2026-10-28)

Pedido: passar a mesa por pontos estava fácil, mas o triplo saía da faixa. A base anterior era **105 · 135 · 175 · 215 · 280 · 350 · 440 · 560**. `bun scripts/balance.ts --seeds 3 --runs 300` (faixa do bot bom 20–35%, ritmo 4–12 mãos, aleatório < 5%; a faixa não mudou):

| Fator | Metas (Pequena) | Bot bom | Ritmo | Portão |
|---|---|---|---|---|
| ×1,1 | 116 · 149 · 193 · 237 · 308 · 385 · 484 · 616 | 20,0 · 23,3 · 20,3% | 6,60 · 6,34 · 6,41 | PASS |
| ×1,15 | 121 · 155 · 201 · 247 · 322 · 402 · 506 · 644 | 18,3 · 23,0 · 19,3% | 6,69 · 6,41 · 6,54 | FAIL |
| ×1,25 | 131 · 169 · 219 · 269 · 350 · 438 · 550 · 700 | 16,0 · 21,3 · 17,3% | 6,87 · 6,58 · 6,67 | FAIL |
| ×1,5 | 158 · 203 · 263 · 323 · 420 · 525 · 660 · 840 | 11,7 · 21,0 · 14,0% | 7,21 · 6,92 · 7,06 | FAIL |
| ×2 | 210 · 270 · 350 · 430 · 560 · 700 · 880 · 1.120 | 10,0 · 13,3 · 9,3% | 7,91 · 7,51 · 7,68 | FAIL |
| ×2,5 | 263 · 338 · 438 · 538 · 700 · 875 · 1.100 · 1.400 | 6,0 · 9,7 · 7,7% | 8,47 · 7,99 · 8,22 | FAIL |
| ×3 | 315 · 405 · 525 · 645 · 840 · 1.050 · 1.320 · 1.680 | 4,7 · 6,7 · 5,0% | 9,00 · 8,47 · 8,72 | FAIL |

O dev escolheu **×2** da base 105 · 135 · … · 560 (210 · 270 · 350 · 430 · 560 · 700 · 880 · 1.120), porque um humano passava fácil demais, e aceitou o bot bom ganhar menos. A faixa do bot bom em `scripts/balance.ts` baixou de propósito de 20–35% para **5–20%**, centrada nesses 9–13% e com folga para o ruído das seeds. Aleatório (< 5%) e ritmo (4–12 mãos) não mudaram: no ×2 o aleatório ficou em 0% e o ritmo em 7,91 · 7,51 · 7,68. Grande (×1,5, `Math.round`), Chefe (×2), Estacas, Sheila e o infinito multiplicam essa base. A partida rápida segue sem meta.

## Registro: remoção de Os Irmãos (2026-10-28)

Pool de bosses cai de 9 para 8 (sem `irmaos`). `bun run balance --seeds 3`: bot bom 7,4 · 8,6 · 7,0% (faixa 5–20%), bot aleatório 0,0% em todos os seeds, 7,68–7,74 mãos por mesa (4–12), sem NaN. Portão PASS.

## Registro: gate e trinkets remedidos (2026-11-09)

`bun run balance --seeds 3` na `main` (`2245345`): bot bom 7,4 · 8,6 · 7,0% (faixa 5–20%), aleatório 0,0% em todos os seeds, 7,68–7,74 mãos por mesa (4–12), sem NaN. **PASS.** `bun scripts/qa-trinkets.ts --runs 1000 --seeds 3` (3000 partidas, bot bom): **9,0%** com trinkets (Campeonato médio 4,62; 7,71 mãos por mesa) e **12,0%** sem (`TRINKETS = false` numa cópia fora do repositório; 5,02; 7,42). Os trinkets ainda custam 3,0 p.p. ao bot bom (eram 9,6 em 2026-10-27); nenhum número foi alterado.

## Registro: remoção de pacotes, Melhorias e pular mesa (2026-11-11, D-82)

Pacotes, Melhorias do Boteco e pular mesa (com as Promessas e `TABLE_SELECT`) saíram do código. O bot do gate já não usava nenhum deles (`TRINKETS` e `SHOP_SIMPLE` ligados, `TABLE_SELECT` desligado, `HABITS.skip` sempre `none`), então o gate não deve mexer: o resultado é idêntico, mesas e runs, antes e depois, na mesma máquina. `bun scripts/sim.ts` e `--skip` perderam a opção `--skip` (as seções acima que a citam, de 2026-10-25 a 2026-10-28, ficam como registro).

| Medida | Antes (`2245345`, `main`) | Depois (`refactor(run)!` sobre `7e8cd0c`) |
|---|---|---|
| `bun run balance --seeds 3`, bot bom | 7,4 · 8,6 · 7,0% (faixa 5–20%) | 7,4 · 8,6 · 7,0% |
| Bot aleatório | 0,0% nas 3 seeds | 0,0% nas 3 seeds |
| Mãos por mesa | 7,74 · 7,74 · 7,68 (4–12) | 7,74 · 7,74 · 7,68 |
| Gate | PASS | **PASS** |
| `bun scripts/sim.ts` (500 runs, seed 1, bot bom) | vitória 7,4%, Campeonato médio 4,53, 7,74 mãos por mesa, `endedAtChamp` `[48,69,65,73,71,54,47,73,0]` | idêntico |

Nenhum número de gameplay foi retocado.

## Run mano a mano 1×1 (2026-11-11, D-77, D-78, R3.3)

A run 1×1 tem tabela de metas própria (`CHAMPIONSHIP_GOALS_1V1`, `src/data/championships.ts`); `TABLE_GOAL_MULT` (1 · 1,5 · 2), o infinito ×1,4 e a economia (prêmios, juros, rapidez, preços) são os do 2×2. Nada do 2×2 mudou.

| Campeonato | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Meta da Pequena, 2×2 | 210 | 270 | 350 | 430 | 560 | 700 | 880 | 1.120 |
| Meta da Pequena, **1×1** | 240 | 310 | 400 | 490 | 640 | 800 | 1.000 | 1.280 |

Como se chegou: a vaza tem 2 cartas, então a suposição era metade das Fichas e, portanto, metade das metas. Medido com o bot bom (150 a 300 runs por linha): as Fichas por mão caem menos do que isso, porque o Mult (aposta + Lance) faz a maior parte da mão e a mão do duelo se decide em menos vazas, mais afiadas. As metas do 2×2 divididas por 2 deixavam o bot bom em 38% de vitórias.

| Meta do 1×1 (fração das metas do 2×2) | Bot bom vence | Campeonato médio | Mãos por mesa |
|---|---|---|---|
| ×0,5 (105 … 560) | 38,0% | 6,07 | 6,00 |
| ×0,7 | 27,3% | 5,84 | 6,87 |
| ×0,9 | 17,3% | 5,40 | 7,36 |
| ×1,0 (as do 2×2) | 11,7% | 4,95 | 7,86 |
| ×1,1 | 14,0% | 5,19 | 7,96 |
| ×1,2 | 9,3% | 4,71 | 8,39 |
| ×1,4 | 6,7% | 4,48 | 8,87 |

(As linhas ×1,1 e ×1,2 foram medidas em outra seed que as demais; a diferença entre 14,0% e 11,7% é ruído de amostra, ±2 a 3 p.p. com 150 runs.) Ficou a tabela acima, cerca de ×1,14 das metas do 2×2 (≈ 10 a 14%, o meio da faixa e perto dos 7 a 9% do 2×2). Lances e prêmios não precisaram de tabela própria.

**`bun scripts/balance.ts --mode 1v1 --seeds 3` (500 runs por bot e seed):** bot bom **13,8 · 11,8 · 11,2%** (faixa 5–20%), aleatório **0,0%** nas 3 seeds (< 5%), **8,16 · 8,04 · 8,06** mãos por mesa (4–12), sem NaN. **PASS.** `bun scripts/sim.ts --run-mode 1v1 --runs 300 --seed 4`: bot bom 11,0% (Campeonato médio 5,06; 8,01 mãos por mesa), aleatório 0,0% (1,15; 7,29).

Rivais do 1×1: cada mesa sorteia um companheiro (o mesmo não repete no Campeonato); o jogo de apostas é o do arquétipo do estilo dele (`RIVAL_PROFILES_1V1`, tabela no GDD §8.2.1) e o erro vem do perfil sorteado em `RIVAL_POOLS`, então a dificuldade sobe como no 2×2.

O gate do 2×2 (`bun run balance`, `bun scripts/sim.ts --runs 40 --seed 3 --bot good`) ficou idêntico: vitória 7,5%, Campeonato médio 4,67, 7,63 mãos por mesa.
