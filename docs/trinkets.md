# Trinkets (game design, 2026-10-27)

Decisão do dev, desenhada pelo Game Director. Os trinkets substituem as Manhas como o item que se
compra na loja. O loop da run passa a girar em torno de escolher **quais bônus levar e quais
contras aceitar**.

## Regras

- **Raridades:** cada trinket existe em 4 raridades: Normal (creme), Raro (azul), Épico (roxo) e
  Lendário (laranja). É o mesmo trinket, com números maiores.
- **Bônus e contra:** todo trinket tem um bônus e um contra diferentes. Os dois sobem com a
  raridade, mas o bônus sobe mais rápido:

  | Raridade | Bônus | Contra | Preço |
  |---|---|---|---|
  | Normal | ×1 | ×1 | $4 |
  | Raro | ×1,6 | ×1,3 | $7 |
  | Épico | ×2,3 | ×1,6 | $10 |
  | Lendário | ×3,2 | ×2 | $14 |

  Os números base (Normal) estão na tabela abaixo; arredonde para inteiro (Fichas, $, %) ou uma
  casa (×Mult) e guarde os 4 valores prontos em `src/data`.
- **Coleção no save:** os trinkets comprados ficam no save do jogador (perfil, entre runs). Ter o
  mesmo trinket em várias raridades guarda só a maior: ao equipar, vale a maior que ele tem.
- **Equipar:** até **4 trinkets diferentes** por run, escolhidos na loja (e antes da primeira
  mesa). O jogador pode desequipar todos e jogar com 0. Só os equipados valem; disparam da
  esquerda para a direita, como as Manhas.
- **Loja:**
  - 4 ofertas por loja.
  - Depois de vencer o **chefe**, pelo menos 1 oferta é **Lendária** (100%).
  - Em toda loja: **50%** de chance de uma oferta ser **Rara** e **25%** de uma ser **Épica**
    (sorteios independentes, por loja); o resto é **Normal**.
  - Nunca oferecer um trinket na raridade que o jogador já tem ou abaixo dela (a oferta vira o
    próximo nível ou outro trinket). Sem repetir oferta na mesma loja. Sorteio com `Rng`.
- **Simpatias, Cartas de Lance e Melhorias** saem da loja (atrás de flag, sem apagar código). As
  Manhas atuais viram a base dos trinkets; o que não couber sai do pool.

## Os 32 trinkets (valores Normal)

| # | Trinket | Bônus | Contra |
|---|---|---|---|
| 1 | Ás na Manga | +20 Fichas por vaza vencida com Ás | K vale −5 Fichas |
| 2 | Pé de Coelho | +3 Mult por vaza vencida com manilha | Meta da mesa +5% |
| 3 | Zap de Ouro | ×1,5 Mult se o zap venceu uma vaza | −1 Mult em mão sem zap na sua mão |
| 4 | Copo Americano | +$1 por mão vencida | Itens da loja +$1 |
| 5 | Baralho Marcado | +15 Fichas por vaza vencida com ♣ | Cartas de ♥ valem −5 Fichas |
| 6 | Coração Mole | +2 Mult por vaza vencida com ♥ | Cartas de ♠ valem −5 Fichas |
| 7 | Espadachim | +2 Mult por vaza vencida com ♠ | Cartas de ♦ valem −5 Fichas |
| 8 | Mão Leve | +$1 por vaza vencida com ♦ | −$1 por mão perdida |
| 9 | Três Secos | +3 Mult por vaza vencida com um 3 | 2 vale −10 Fichas |
| 10 | Figurão | +12 Fichas por vaza vencida com Q, J ou K | 4 a 7 valem −4 Fichas |
| 11 | Seu Zé | +15 Fichas por vaza vencida com 4, 5, 6 ou 7 | Q, J e K valem −4 Fichas |
| 12 | Dupla Dinâmica | +3 Mult por vaza vencida pelo parceiro | −10 Fichas por vaza vencida por você |
| 13 | Confia em Mim | +20 Fichas por vaza vencida pelo parceiro | Mult base −1 (mínimo 1) |
| 14 | Vaza Limpa | ×1,5 Mult se a dupla venceu as duas primeiras vazas | −$1 por mão perdida |
| 15 | Virada | +6 Mult se perdeu a 1ª vaza e venceu a 2ª | −1 Mult se venceu a 1ª vaza |
| 16 | Grito de Truco | +4 Mult em mão com truco aceito | −2 Mult em mão sem truco |
| 17 | Seis Maldito | ×2 Mult em mão que vale 6 ou mais | −20% Fichas em mão que vale 1 |
| 18 | Cofrinho | Juros: +$1 a cada $5 guardados (máx. +$3) | Prêmio de Rapidez −$2 |
| 19 | Relógio de Bolso | Prêmio de Rapidez ×2 | Meta da mesa +10% |
| 20 | Pinga de Abertura | +25 Fichas na primeira mão da mesa | −2 Fichas nas outras mãos |
| 21 | Saideira | +10 Mult quando falta 20% ou menos da meta | −1 Mult quando falta mais da metade |
| 22 | Vira Dourada | ×1,5 Mult por vaza vencida com manilha | Manilhas valem −10 Fichas |
| 23 | Lenda do Boteco | ×1,5 Mult por vaza vencida | −1 tento ao perder uma mão |
| 24 | Caixa de Fósforo | +$1 por vaza vencida com manilha | Itens da loja +$1 |
| 25 | Carteado | +2 Fichas por carta comum jogada pela dupla | Cartas especiais valem −10 Fichas |
| 26 | Mão de Ferro | +8 Mult na mão de 11 e na mão de ferro | −1 Mult nas mãos normais |
| 27 | Bicheiro | 1 em 4: dobra o dinheiro ganho na mesa | Meta da mesa +8% |
| 28 | Cantoria | +5 Fichas por sinal enviado pela dupla | Rivais flagram sinais +10% |
| 29 | Malandragem | +6 Mult por blefe ganho (truco com mão fraca aceito e vencido) | −3 Mult por blefe pego |
| 30 | Dia de Sorte | Começa cada mesa com +1 tento | Começa cada mesa com −$1 |
| 31 | Rei do Pedaço | +1 Mult base por mesa vencida na run (máx. +5) | Meta da mesa +5% por Campeonato |
| 32 | Coringa no Bolso | Coringas jogados abertos: +20 Fichas e +2 Mult | Coringas encobertos valem 0 Fichas |

Valores revistos na calibração de 2026-10-27 (os contras de Mult zeravam a mão de aposta 1; Mult nunca fica abaixo de 1). Efeitos que dependem de algo que a lógica ainda não mede podem ser trocados por um equivalente de
mesmo peso, sem perder a regra "um bônus e um contra diferentes".

### Na run mano a mano (1×1, D-77)

Três trinkets leem o parceiro ou os sinais e nunca disparam em dois assentos: **Dupla Dinâmica** (12), **Confia em Mim** (13) e **Cantoria** (28). Ficam fora da loja e da coleção da run 1×1 (`trinketNeedsPartner`, `TRINKET_IDS_1V1` em `src/data/trinkets.ts`); os outros 29 funcionam igual. Auditoria completa no GDD §14.1.

## Loja (layout)

Duas colunas dentro da lousa:

- **Esquerda:** as 4 ofertas do vendedor, numa grade 2×2 que cabe na lousa. Cada carta leva a
  cor da raridade na borda e na faixa de cima (Normal creme, Raro azul, Épico roxo, Lendário
  laranja), com o ícone e o nome nessa faixa. O bônus (verde) e o contra (vermelho) ficam no
  centro. O preço é um botão na largura da carta, no rodapé. Sem o nome da raridade escrito.
- **Direita, em cima:** os 4 slots equipados (vazios permitidos), clique para desequipar.
- **Direita, embaixo:** a coleção do jogador (todos os trinkets que ele tem, na maior raridade),
  clique para equipar num slot livre.
- **Base da tela:** "Próxima mesa" no canto inferior direito, fora da lousa. O dinheiro fica na linha do título, à direita. Os slots equipados são menores que a coluna, com folga entre o rótulo, a fileira, o rótulo da coleção e os ícones.

## Mesa (sidebar)

O card do topo da sidebar mostra só os 4 slots de trinkets equipados e, embaixo, a lista de todos
os bônus ativos (faixa verde) e ônus ativos (faixa vermelha), um por linha, com texto escuro com
profundidade. Os tentos e as quedas das duas duplas ficam no painel "Tentos: nós × eles".

## Fama

A Fama sai do jogo (decisão do dev, 2026-10-27): era escondida e confusa. Saem a barra, o efeito
na IA dos rivais e os bônus que dependiam dela. O chefe Stuart (antes O Professor), cuja regra dobrava a Fama,
passa a ter: **os contras dos seus trinkets equipados contam em dobro** (só na mesa dele). Saves
antigos ignoram o campo.

## Parceiros afetados

- Zé (defeito "1 espaço de Manha a menos") passa a "1 slot de trinket a menos".
- Beti ("a primeira Manha comprada em cada loja custa $1 a menos") passa a valer para o primeiro
  trinket.
