# Game feel

Como o jogo responde ao que acontece na mesa (ROADMAP R5). Este doc é a tabela de referência: cada evento de regra, o que a tela e o som fazem, por quanto tempo e com que força. Os números moram no código (`src/config/feel-*.ts`) e são espelhados aqui.

## 1. Princípios

1. **Todo evento de regra tem resposta proporcional ao peso dele.** Jogar um 4 é um toque; um ZAP é uma entrada; um truco para a mesa. A escala vai de 1 (carta comum) a 5 (doze, queda, fim de run).
2. **Nada atrasa a vez do jogador.** Efeito que dura mais que a espera que já existia roda por cima do jogo, sem `await`. O que precisa segurar a mesa (truco, contagem) é curto e pode ser pulado com um toque ou tecla.
3. **A velocidade manda.** Toda duração passa por `dur()` (1×, 2×, 4×). A 4× um efeito inteiro cabe em 400 ms.
4. **Conforto.** Com "Reduzir piscadas" (`comfort.reduceFlashes`) não há flash, piscar nem troca brusca de brilho: o efeito vira deslocamento e cor estável. Tremor e zoom só com "Tremor de tela" ligado (`shake`, `zoomPunch` em `src/core/feel.ts`).
5. **A informação fica no feltro.** Quanto vale a mão e quem levou cada vaza se leem no centro da mesa, sem olhar a barra lateral.
6. **Código:** cada efeito é um módulo de view em `src/view/fx/`, que recebe a cena e os dados prontos; a `TableScene` só chama. Nenhum efeito lê nem muda o estado da partida.
7. **Identidade:** boteco de praia no pôr do sol, pintura e vetor. Nada de copiar efeito, layout ou som de outro jogo.

## 2. Tabela de eventos

| Evento | Peso | Resposta | Seção |
|---|---|---|---|
| Carta comum jogada | 1 | arco, amassado, poeira | §5 |
| Manilha jogada | 2 a 3 | rastro, som mais grave | §5 |
| ZAP jogado | 4 | entrada própria | §5 |
| Vaza decidida | 2 | marcador da vaza, reação de quem levou | §4, §6 |
| Truco, seis, nove, doze | 3, 4, 4, 5 | o pedido é um evento | §3 |
| Aceitou, correu | 2 | aviso, reação | §3, §6 |
| Nova vira, mão de 11, mão de ferro | 2 a 3 | aviso | §7 |
| Fim de mão | 3 | aviso e contagem | §7, §8 |
| Queda, fim de mesa, fim de run | 5 | começos e fins | §9 |

## 3. O pedido de truco (R5.1)

Quem pede (você, o parceiro ou um rival; na mesa LAN o evento chega do servidor com os assentos virados para quem vê, e no 1×1 o rival sai do topo) dispara `playTrucoCall` (`src/view/fx/truco-call.ts`), que só desenha; som, voz, balão e expressão seguem na `TableScene`. Números em `src/config/feel-truco.ts`.

Passo a passo (tempos a 1×; a 4× divide-se tudo por 4):

1. **Congela** (`freezeMs`): a mesa escurece com a cor da noite, sem nada se mexer.
2. **Entra** (`inMs`): o card pintado de quem pediu (`charcard.<id>`) desliza do lado dele até 42% do caminho para o centro, inclinado 6°; os raios saem do centro; o nome do pedido cai no centro do feltro com um "pop" (1,7× para 1×). Você não tem pintura: o pedido é só o nome, 25% maior, subindo de baixo. No meio da entrada: pulso de cor, tremor e zoom (`shake`, `zoomPunch`) e o `duckMusic`.
3. **Segura** (`holdMs`): o card cresce 5% devagar e os raios giram.
4. **Sai** (`outMs`): tudo some em fade.

A resposta tem o próprio tempo: aceitou vira o aviso "Aposta sobe: N" (§7) e correu vira "Correu!".

| Degrau | Cor | Congela | Entra | Segura | Sai | Total 1× | Total 4× | Card | Nome | Tremor (ms, força) | Zoom | Música (ganho, ms) | Pulso (alpha) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Truco (3) | vermelho `truco` | 60 | 160 | 380 | 100 | 700 | 175 | 92 | 26 | 120, 0,003 | 3% | 0,5, 500 | 0,12 |
| Seis (6) | laranja `cta` | 60 | 170 | 480 | 110 | 820 | 205 | 104 | 31 | 150, 0,005 | 4% | 0,4, 650 | 0,18 |
| Nove (9) | vermelhão `mult` | 70 | 180 | 600 | 120 | 970 | 243 | 116 | 36 | 190, 0,007 | 5% | 0,3, 800 | 0,24 |
| Doze (12) | dourado `manilha` | 90 | 200 | 800 | 150 | 1240 | 310 | 128 | 42 | 260, 0,010 | 7% | 0,2, 1000 | 0,30 |

- **Pulável:** um toque, clique ou tecla encerra na hora (ignora os 150 ms iniciais, para o clique que fez o pedido não pular o próprio efeito; tecla repetida também não conta).
- **Reduzir piscadas:** `trucoCall(step, true)` tira o pulso; ficam o movimento e a cor estável. Tremor e zoom seguem "Tremor de tela".
- O volume de `sfx.truco` sobe com o degrau (0,8 a 1); o 12 soma o `sfx.bet.doze` como antes.
- Testes: `tests/feel-notice-truco.test.ts` (soma a 4× ≤ 400 ms, sem pulso na variante reduzida, intensidade crescente).

## 4. Centro do feltro (R5.3)

A preencher: monte e vira, fichas da aposta, marcadores das três vazas, mesa de dois.

## 5. Cartas com peso (R5.2)

A preencher: arco, amassado, poeira, rastro de manilha, entrada do ZAP, som por força.

## 6. Personagens reagem (R5.6)

As pinturas têm uma imagem por personagem: a reação é movimento, cor e um selo de emoção, não troca de rosto. A preencher com a tabela evento → reação.

## 7. Avisos (R5.5)

Um objeto só desenha todos os avisos: `NoticeBoard.show(kind, texto, ms?)` (`src/view/fx/notice.ts`), uma faixa escura arredondada com um selo redondo na cor do tipo, o ícone pintado (`icon.<nome>`) e o texto. Tipos, ícone, cor e peso em `src/config/feel-notice.ts`. O peso dá o tamanho do texto e o tempo (1: 9 px e 600 ms; 2: 10 e 900; 3: 12 e 1200; 4: 13 e 1800; 5: 15 e 1800 a 1×; `ms` sobrescreve). Largura de quebra de 190 px lógicos, no centro do feltro (390, 140): não cobre a mão nem os botões nem as cartas de verso dos rivais.

Fila: um aviso de peso maior ou igual ao atual (ou do mesmo tipo) o substitui na hora; um mais leve espera atrás dele (máximo 2 na fila, os mais velhos caem).

| Tipo | Quando | Ícone | Cor | Peso |
|---|---|---|---|---|
| `vira` | nova vira | `cards` | `chips` | 2 |
| `raise` | aposta aceita ("Aposta sobe: N") | `coin` | `cta` | 3 |
| `fold` | correu | `door` | `disabled` | 2 |
| `trickUs` | vaza nossa (a chamada fica com o caso `trick`, de outro agente) | `check` | `good` | 2 |
| `trickThem` | vaza deles | `close` | `bad` | 2 |
| `trickTie` | vaza empatada | `handshake` | `rarityCommon` | 1 |
| `eleven` | mão de 11 e a decisão | `alert` | `cta` | 3 |
| `iron` | mão de ferro | `anvil` | `mult` | 3 |
| `handUs` | mão ganha | `trophy` | `good` | 3 |
| `handThem` | mão perdida | `skull` | `bad` | 3 |
| `handNone` | mão sem pontos | `question` | `rarityCommon` | 2 |
| `queda` | queda | `refresh` | `truco` | 5 |
| `caught` | sinal pego | `monocle` | `signal` | 2 |
| `boss` | nome e regra do chefe | `crown` | `fame` | 4 |
| `speed` | troca de velocidade | `next` | `calm` | 1 |
| `zap` | você recebeu o ZAP | `star` | `manilha` | 2 |
| `joker` | sorteio do coringa e das cartas especiais | `dice` | `jokerPurple` | 3 |
| `info` | mesa fechada (LAN) | `alert` | `textDim` | 2 |

## 8. Contagem de pontos (R5.4)

A preencher.

## 9. Começos e fins (R5.7)

A preencher.

## 10. Sons que faltam

Lista de sons que um efeito pediria e que ainda não existem em `public/assets/audio`. Enquanto não chegam, o efeito usa um som existente com outra altura (`detune`, `rate`). Geração: skill `game-audio-assets`, dentro do teto de créditos da D-84.

| Som | Para | Hoje usa |
|---|---|---|
