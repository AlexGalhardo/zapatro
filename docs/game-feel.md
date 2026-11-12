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

Três peças no feltro, desenhadas por `src/view/fx/felt-center.ts` (recebe a cena e dados prontos: aposta, aposta pendente, marcadores; nunca lê nem muda a partida) e posicionadas em `src/config/feel-felt.ts` (palco 640×360). A `refreshHud` chama o módulo; os marcadores vêm de `trickMarks` (`src/logic/truco/trick-marks.ts`, do ponto de vista do assento 0: "ganhou" é a dupla do jogador). Cores: `BET_CHIP_COLOR` e a paleta em `palette.ts`; nenhum texto novo, só números e símbolos.

| Peça | O que é | Duração (1×, passa por `dur()`) |
|---|---|---|
| Monte e vira | Pilha de 4 versos (`card.back.default`) com a vira virada ao lado e o rótulo "VIRA" embaixo. `this.vira` e `this.viraLabel` seguem sendo da cena (âncora do tutorial, QA, Cartomante). | A virada de nova vira segue no `animate` (220 ms) |
| Fichas da aposta | Pilha vista de cima, uma ficha por degrau (1 = 1 ficha, 3 = 2, 6 = 3, 9 = 4, 12 = 5), cada uma na cor do degrau (creme, vermelho, laranja, roxo, dourado), a de cima com o valor grande (12 px de fonte lógica × escala). Cresce para cima a partir da base. | Ao subir a aposta a pilha "bate": escala 1,4 → 1, `Back.easeOut`, 260 ms |
| Aposta pendente | Um pedido sem resposta soma fichas fantasma (60% de opacidade) no topo e o número vira "N?". O aceito segue sólido por baixo. | Pulso de opacidade 40% a 75% em 600 ms; com "Reduzir piscadas" fica parado a 60% |
| Marcadores | Três quadrados com símbolo (✓ ganhou, ✗ perdeu, = empatou, vazio = a jogar), então se leem sem cor. A próxima vaza a jogar ganha anel dourado. | Ao decidir, o marcador "pipoca": 1,6 → 1, `Back.easeOut`, 220 ms |

- Uma vaza só aparece decidida nos marcadores depois que as cartas dela saem do feltro (a partida já está uma ação à frente da animação).
- Nada é aguardado: os tweens correm por cima do jogo e a vez do jogador não espera por eles.
- **Mesa de quatro:** monte e vira no canto superior esquerdo; fichas e marcadores no vão entre as quatro cartas jogadas (x 352–428, y 157–201). As cartas jogadas se afastaram do centro (`SEAT_POS`: 125, 230, 330, 450) para abrir esse vão; as fichas ficam sob as cartas jogadas.
- **Mesa de dois (R2.2):** o rival é um card de 72×96 (o assento da mesa de quatro tem 54×72) e ele e a mão dele formam um grupo centrado no topo (`DUEL_UI`); as cartas jogadas descem (rival em y 166, você em y 232). Monte e vira ficam à esquerda das cartas jogadas, fichas e marcadores à direita, em escala 1,3. Nenhum elemento da mesa de quatro aparece: sem retratos laterais, sem parceiro, sem sinal.

## 5. Cartas com peso (R5.2)

Módulos: `src/view/fx/card-fx.ts` (voo, aterrissagem, recolher), `src/view/fx/card-weight.ts` (peso), números em `src/config/feel-cards.ts`. O peso sai da própria ordem de força do jogo (`strength` em `src/logic/truco/cards.ts`): encoberta, comum (4 a K), forte (A, 2, 3), manilha (por naipe: o naipe mais forte pesa até 25% mais) e ZAP. Coringa e cartas especiais contam como 3 (fortes), como na regra.

| Peso | Arco | Amassado | Poeira | Som (`sfx.card.play`) | Extra |
|---|---|---|---|---|---|
| Encoberta | 5 px | 5% / 110 ms | nenhuma | volume 0,5, tom normal (`sfx.card.cover`) | aterrissa quieta |
| Comum | 12 px | 12% / 140 ms | 3 | tom normal | |
| Forte (A, 2, 3) | 16 px | 17% / 170 ms | 5 | -200 cents | |
| Manilha | 22 px | 22% a 27% / 190 ms | 7 a 9 | -400 cents | rastro de cópias no voo |
| ZAP | 30 px | 30% a 37% / 260 ms | 10 a 12 | -700 cents | antecipação, anel no feltro, tremor |

- **Voo:** a carta sobe (cresce até 18%), segue uma curva com inclinação e chega reta; o tempo esperado é `TABLE_TIMING.play` (220 ms) para qualquer peso. O ZAP espera 160 ms antes: a carta sobe 14 px e cresce 12% antes de voar (único tempo extra, abaixo do teto de 250 ms).
- **Aterrissagem** (sem `await`): amassado largo e baixo que volta com `Back.easeOut`, poeira para os dois lados, e o som sai nesse instante. O ZAP ainda solta um anel dourado achatado no feltro (460 ms) e um `shake` curto (só com "Tremor de tela").
- **Recolher a vaza:** depois do `trickHold` as cartas se juntam num monte (90 ms, cada uma gira 7° para um lado) e varrem para o lado de quem levou (170 ms, encolhem a 60% e somem no fim): 260 ms no total, o mesmo de `TABLE_TIMING.collect`. **Empate:** durante a espera as cartas "batem" uma na outra (190 ms, giram 5° e voltam, sem `await`) e depois se juntam no centro.
- **Conforto:** com "Reduzir piscadas" o rastro perde o brilho aditivo (cópias normais, mais fracas) e a poeira fica mais fraca; o anel e a varredura seguem como movimento.
- **Som:** o ajuste de tom é o `detune` de `sfx()` (quarto argumento, em cents).
- **Medida:** `bun scripts/feel-table.ts fps` mede o quadro a quadro de vazas inteiras no build local (GPU, 1920×1080); `shots` salva as sequências de quadros.

## 6. Personagens reagem (R5.6)

As pinturas têm uma imagem por personagem: a reação é movimento, cor e um selo de emoção, não troca de rosto. Módulos: `src/view/fx/seat-react.ts` (um escritor por retrato: pose de repouso + respiração + reação) e `src/view/fx/seat-pose.ts` (as funções puras de pose); números em `src/config/feel-seats.ts`. A `TableScene` chama `face(seat, expr)` com a `Expression` de sempre; `REACTION_OF` traduz cada uma:

| Expression | Reação | Movimento | Selo | Cor |
|---|---|---|---|---|
| `neutral` | settle | afunda 2% e volta | nenhum | nenhuma |
| `happy` | bounce | pula 1,5 vez | estrela | dourado |
| `angry` | shake | balança de lado | raiva | vermelho |
| `sweat` | sink | abaixa e encolhe | gota | azul |
| `wink` | lean | inclina 5° | coração | nenhuma |
| `eyebrow` | tilt | inclina para trás, sobe 1 px | interrogação | nenhuma |
| `mouth` | hop | pulinho, cresce 4% | exclamação | nenhuma |
| `tongue` | wobble | balança a cabeça | estrela | nenhuma |
| `lip` | sink | abaixa | gota | azul |
| `up` | rise | sobe 3 px | reticências | nenhuma |

Evento da mesa → reação (`reactTo` em `TableScene`, chamado no começo de `animate`; `truco` e `folded` chamam `face` no próprio caso):

| Evento | Quem | Expressão |
|---|---|---|
| Vaza decidida | dupla que levou / dupla que perdeu | `happy` / `sweat` |
| Vaza empatada | todos | `eyebrow` |
| Truco, seis, nove, doze de um rival ou do parceiro | quem pediu | `angry` |
| Aceitou | quem aceitou | `eyebrow` |
| Correu | quem correu | `sweat` |
| Sinal do parceiro | parceiro | `wink` |
| Rival pego blefando com sinal (você pegou) | o rival | `mouth` |
| Seu sinal pego pelos rivais | quem pegou | `tongue` |
| Fim de mão | dupla que levou / dupla que perdeu | `happy` / `sweat` |
| Queda fechada (nossa ou deles) | idem, 1,5× mais forte e 1,3× mais longa | `happy` / `sweat` |

- **Repouso:** o retrato respira devagar (0,8%, 3,6 s); o assento da vez respira mais (1,6%, 1,7 s) e sobe 0,8 px. Quem tem a vez é `match.actor()`.
- **Selo:** um disco pequeno (16 px) desenhado por código no canto superior esquerdo do próprio card, entra com um leve estouro, flutua 2 px e some no fim. Fica dentro do card: não cobre balão de fala, plaquinha de nome, barra de relógio da LAN nem as costas das cartas, que ficam fora dele. O emoji do sinal secreto fica no canto direito.
- **Falas:** a reação não toca voz nem abre balão; `speak` e `chat` continuam com as regras que já tinham (`voiceBusy()`, balão visível).
- **Dois assentos e LAN:** usa `seatUi()` e `this.seats`; o único rival do 1×1 reage no slot de cima. Na LAN os mesmos eventos chegam por `animate`.
- **Conforto:** com "Reduzir piscadas" a cor sobe e desce devagar (sem troca brusca) e o selo não estoura, só aparece.

## 7. Avisos (R5.5)

Um objeto só desenha todos os avisos: `NoticeBoard.show(kind, texto, ms?)` (`src/view/fx/notice.ts`), uma faixa escura arredondada com um selo redondo na cor do tipo, o ícone pintado (`icon.<nome>`) e o texto. Tipos, ícone, cor e peso em `src/config/feel-notice.ts`. O peso dá o tamanho do texto e o tempo (1: 9 px e 600 ms; 2: 10 e 900; 3: 12 e 1200; 4: 13 e 1800; 5: 15 e 1800 a 1×; `ms` sobrescreve). Largura de quebra de 190 px lógicos, no centro do feltro (390, 140): não cobre a mão nem os botões nem as cartas de verso dos rivais.

Fila: um aviso de peso maior ou igual ao atual (ou do mesmo tipo) o substitui na hora; um mais leve espera atrás dele (máximo 2 na fila, os mais velhos caem).

| Tipo | Quando | Ícone | Cor | Peso |
|---|---|---|---|---|
| `vira` | nova vira | `cards` | `chips` | 2 |
| `raise` | aposta aceita ("Aposta sobe: N") | `coin` | `cta` | 3 |
| `fold` | correu | `door` | `disabled` | 2 |
| `trickUs` | vaza nossa (dita depois que as cartas saem do feltro, porque a faixa fica onde cai a carta de cima) | `check` | `good` | 2 |
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
| Batida por degrau (truco, seis, nove, doze) | o nome do pedido caindo no feltro (§3) | `sfx.truco` com o volume subindo |
| Tique de aviso | entrada de uma faixa de aviso (§7) | nada |
| Pancada do ZAP e sopro da subida | entrada do ZAP (§5) | `sfx.card.play` 700 cents abaixo |
| Tapa de carta forte, brilho de manilha em voo, toque de carta encoberta | cartas por peso (§5) | `sfx.card.play` em outra altura, `sfx.card.cover` |
| Varrida da vaza e estalo do empate | recolher a vaza (§5) | `sfx.trick.win` |
| Vinhetas curtas de comemoração, resmungo e susto | selos de reação (§6) | nada |
