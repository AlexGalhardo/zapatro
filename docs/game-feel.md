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

A preencher com a tabela de durações e intensidades por degrau.

## 4. Centro do feltro (R5.3)

A preencher: monte e vira, fichas da aposta, marcadores das três vazas, mesa de dois.

## 5. Cartas com peso (R5.2)

A preencher: arco, amassado, poeira, rastro de manilha, entrada do ZAP, som por força.

## 6. Personagens reagem (R5.6)

As pinturas têm uma imagem por personagem: a reação é movimento, cor e um selo de emoção, não troca de rosto. A preencher com a tabela evento → reação.

## 7. Avisos (R5.5)

A preencher: tipos, ícone e cor de cada um, função única.

## 8. Contagem de pontos (R5.4)

A preencher.

## 9. Começos e fins (R5.7)

A preencher.

## 10. Sons que faltam

Lista de sons que um efeito pediria e que ainda não existem em `public/assets/audio`. Enquanto não chegam, o efeito usa um som existente com outra altura (`detune`, `rate`). Geração: skill `game-audio-assets`, dentro do teto de créditos da D-84.

| Som | Para | Hoje usa |
|---|---|---|
