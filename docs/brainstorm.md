# Contexto

Sou um desenvolvedor de jogos SOLO usando como engine principal Phaser.io v4

Meu foco em plataformas são 3:

- Steam (jogos desktop) -> usando ElectronJS
- Google Plau (mobile android principalmente) -> usando CapacitorJS 
- Itch.io e https://poki.com/br -> web nativo do phaser v4

Quero criar um jogo 2D usando PIXEL ART de cardbuilding + mecênicas de roguelite muito inspirado no jogo Balatro (https://www.playbalatro.com/)

A jogo base será do famoso jogo TRUCO PAULISTA: https://www.jogosdorei.com.br/regras-truco.php + as mecânicas novas que terão no jogo de roguelite com sensação de evolução e desafio constantes inspirados no Balatro.

## BRAINSTORM

Eu pedi para o ChatGPT ideias de mecânicas divertidas de roguelite para esse jogo que vou criar.

Eu quero que você use skills de brainstorm de desenvolvimento para criar as mecânicas principais de game design que serão implementadas nesse jogo.

Use também a skill grill-me/interview-me aqui no chat, para definir detalhes de implementação, e aspectos que você tem dúvida, sugestões, e ideias que você acredita que sejam muito divertidas terem no jogo.

Lembrando que o loop de gameplay principal terá: EU, meu aliado controlado pelo computador, e 2 oponentes que também são aliados jogando junto (para ter uma diversidade de aleatoriedade e posibilidades quase ilimitadas de jogadas e cenários de jogo diferentes)

No final desse brainstorm de ideias e definições de mecânicas, crie o documento completo markdown .md chamado docs/game-design-principles.md


<referenciaBrainstormCHATGPT>
# TRUCO ROGUE — GDD / GAME DESIGN

## Roguelite 2D de Truco Paulista em Pixel Art

> **Fantasia central:** “Eu não preciso ter cartas boas. Preciso fazer a mesa acreditar que tenho.”

---

# 1. Visão do jogo

**Truco Rogue** seria um roguelite de cartas em que o jogador disputa partidas de **Truco Paulista 2×2**, mas constrói durante a run uma espécie de **caixa de ferramentas de malandragem**.

A ideia não é transformar o Truco em um pôquer genérico.

O jogo deve preservar:

- 3 cartas na mão;
- até 3 vazas;
- vira;
- manilhas;
- ordem de força das cartas;
- parceiro;
- blefe;
- decisão de aceitar, correr ou aumentar;
- escalada **1 → 3 → 6 → 9 → 12**;
- situações especiais como **mão de 11** e **11×11**.

A camada roguelite entra modificando **como essas regras funcionam**.

### Princípio de design

| Elemento | Função |
|---|---|
| Baralho tradicional | Base do Truco |
| Manhas | Equivalente funcional aos Jokers |
| Cartas modificadas | Upgrades específicos nas cartas |
| Parceiro | Segundo eixo da build |
| Dinheiro | Economia da run |
| Mapa | Escolha de rota |
| Eventos | Risco / recompensa |
| Adversários | Encontros |
| Bosses | Regras especiais |
| Campeonatos | Progressão de dificuldade |
| Reputação | Camada psicológica |
| Relíquias | Modificadores persistentes |
| Meta-progressão | Desbloqueios entre runs |

---

# 2. Pilares de Game Design

O jogo deve girar em torno de 6 pilares.

## 2.1. Truco primeiro

Se a mecânica poderia existir em qualquer card game, ela deve ser questionada.

A pergunta correta é:

> “Isso deixa o Truco mais interessante?”

e não:

> “Isso aumenta o número de sistemas?”

---

## 2.2. Blefe importa

Uma mão ruim precisa continuar tendo possibilidades.

O jogador deve frequentemente pensar:

- “Tenho cartas ruins, mas posso representar força.”
- “Ele sabe que costumo pedir Truco?”
- “Será que ele está me testando?”
- “Meu parceiro está forte?”
- “Vale a pena aceitar 6?”
- “Corro agora ou tento virar na terceira vaza?”

---

## 2.3. Builds quebradas, mas legíveis

O jogador deve poder descobrir sinergias absurdas.

Exemplo:

> carta 4 + efeitos de perder + terceira vaza + parceiro agressivo + blefe.

Não é necessário que cada componente seja forte sozinho.

O importante é que juntos criem uma estratégia.

---

## 2.4. Informação incompleta

A informação deve ser um recurso.

O jogador pode descobrir:

- tendências do adversário;
- cartas já jogadas;
- probabilidade de determinada manilha ainda existir;
- comportamento do parceiro;
- padrões de blefe.

---

## 2.5. Risco com recompensa

O jogo precisa incentivar decisões do tipo:

> “Posso correr agora e garantir 1?”

ou:

> “Posso aceitar e tentar ganhar 3/6?”

ou:

> “Vou pedir Truco mesmo sem manilha.”

---

## 2.6. História emergente

Uma run boa deve gerar histórias como:

> “Eu estava perdendo todas as primeiras vazas de propósito.”

> “Meu parceiro era completamente maluco, mas a build inteira dependia dele.”

> “Passei metade da run blefando com 4 e 5.”

> “A vira sempre caía exatamente no valor que eu precisava.”

---

# 3. Estrutura geral da Run

## Fluxo

```text
INÍCIO
  ↓
ESCOLHA DE BARALHO / PERSONAGEM
  ↓
MAPA
  ↓
PARTIDA
  ↓
RECOMPENSA
  ↓
ESCOLHA DE ROTA
  ↓
LOJA / EVENTO / PARCEIRO / DESAFIO
  ↓
NOVA PARTIDA
  ↓
CAMPEONATO
  ↓
BOSS
  ↓
NOVO CAMPEONATO
  ↓
BOSS FINAL
```

---

# 4. Estrutura de uma partida

Cada encontro é uma partida de Truco.

## Etapas

### 1. Distribuição

O jogador recebe:

```text
[ 3♠ ] [ Q♥ ] [ 4♦ ]
```

---

### 2. Vira

Exemplo:

```text
VIRA

   5♥

MANILHA

   6
```

---

### 3. Leitura da mesa

Antes de jogar o primeiro lance, o jogador observa:

- suas cartas;
- vira;
- manilhas;
- tentos;
- parceiro;
- comportamento recente do adversário;
- modificadores ativos;
- valor atual da mão.

---

### 4. Primeira vaza

Cada jogador joga uma carta.

A carta mais forte vence.

---

### 5. Decisão de aposta

Dependendo do estado da mão:

```text
1 → 3 → 6 → 9 → 12
```

O jogador pode:

- pedir Truco;
- aceitar;
- correr;
- aumentar;
- usar uma Manha;
- passar;
- fazer ações especiais.

---

### 6. Segunda vaza

Agora entra informação adicional:

- cartas já reveladas;
- comportamento dos rivais;
- efeitos desencadeados;
- potencial da terceira vaza.

---

### 7. Terceira vaza

Momento de clímax.

Builds que trabalham com:

- sacrifício;
- cartas fracas;
- retorno;
- surpresa;
- informação;

devem brilhar aqui.

---

# 5. A grande decisão estrutural: NÃO construir um baralho tradicional

Essa é uma das ideias mais importantes.

No Truco, o baralho base já existe.

Em vez de:

> “Construir um deck de 20 cartas.”

o jogador constrói:

# UMA CAIXA DE FERRAMENTAS DE MALANDRAGEM

```text
BARALHO
→ regras do Truco

MANHAS
→ modificadores permanentes

PARCEIRO
→ comportamento + habilidade

CARTAS MODIFICADAS
→ upgrades específicos

RELÍQUIAS
→ efeitos globais

EVENTOS
→ decisões de risco

REPUTAÇÃO
→ altera comportamento da mesa
```

Isso preserva a identidade do jogo.

---

# 6. Manhas — o sistema central

As Manhas são o equivalente funcional dos Jokers.

A diferença é temática.

Em vez de personagens abstratos, o universo pode trazer:

- malandragens;
- costumes de boteco;
- amuletos;
- superstição;
- frases;
- objetos;
- personagens;
- trapaças;
- “jeitinhos”.

---

## 6.1. Slots

Exemplo:

```text
MANHAS

[ Seu Zé ] [ Mão Leve ] [ Trevo ]
[ Malandro ] [ Café ] [ ??? ]
```

Pode existir um limite de:

- 5 slots no início;
- 6 após upgrades;
- 7 em algumas builds;
- 8 em builds extremamente raras.

---

# 7. Raridade das Manhas

| Raridade | Função |
|---|---|
| Comum | base de build |
| Incomum | sinergias |
| Rara | muda decisões |
| Épica | define arquétipo |
| Lendária | altera regra do Truco |
| Única | efeito quase impossível de repetir |

---

# 8. Tipos de Manha

| Tipo | Foco |
|---|---|
| Força | ganhar vazas |
| Blefe | convencer adversário |
| Informação | descobrir cartas / tendências |
| Economia | gerar dinheiro |
| Vira | manipular manilhas |
| Sacrifício | lucrar ao perder |
| Terceira vaza | preparar comeback |
| Aposta | Truco / retruco |
| Parceiro | modificar IA |
| Sorte | RNG |
| Controle | manipular sequência |
| Caos | efeitos imprevisíveis |

---

# 9. 60 ideias de Manhas

## A. Blefe

| Manha | Efeito |
|---|---|
| **Malandro** | Pedir Truco com uma mão sem manilha aumenta a chance de o rival correr. |
| **Cara de Pau** | Depois de correr de uma aposta, o próximo blefe recebe bônus. |
| **Blefe Profissional** | Os adversários recebem menos informação sobre sua força real. |
| **Olhar Sério** | A primeira tentativa de Truco da mão parece mais ameaçadora para a IA. |
| **Mão Escondida** | Uma carta pode ficar visualmente oculta mesmo após certas ações. |
| **Blá-Blá-Blá** | Pedidos consecutivos reduzem temporariamente a confiança do rival na própria leitura. |
| **Teatro** | Jogar uma carta fraca como primeira carta aumenta a pressão psicológica. |
| **Falsa Segurança** | Quanto pior sua mão, maior o bônus de blefe. |
| **Cara de Tacho** | Falhar um blefe gera uma pequena recompensa, permitindo recuperar a run. |
| **Mentiroso Convincente** | O segundo blefe da mesma partida é mais poderoso que o primeiro. |

---

## B. Informação

| Manha | Efeito |
|---|---|
| **Olho de Águia** | Revela uma carta aleatória do baralho. |
| **Baralho Marcado** | Algumas cartas importantes recebem uma marca visível. |
| **Contador de Carta** | Mostra quantas manilhas de cada tipo ainda podem estar em jogo. |
| **Bisbilhoteiro** | Uma vez por mão, veja uma carta aleatória do rival. |
| **Ouvido Fino** | Identifica quando o parceiro possui uma carta muito forte. |
| **Memória de Elefante** | Guarda estatísticas do adversário por mais tempo. |
| **Leitor de Mesa** | Exibe estimativa de força da mão adversária. |
| **Cheiro de Blefe** | Após uma sequência de apostas, indica se o rival costuma estar blefando. |
| **Anotador** | Cria registros permanentes sobre padrões dos rivais. |
| **Carta na Manga** | Revela uma informação escondida quando você está perdendo. |

---

## C. Vira / Manilha

| Manha | Efeito |
|---|---|
| **Vira Viciada** | Aumenta a chance de a vira favorecer valores presentes na sua mão. |
| **Vira Reversa** | Pode alterar temporariamente o valor da manilha. |
| **Vira Dourada** | O valor da vira concede um bônus extra às cartas daquele valor. |
| **Vira Dupla** | Uma segunda carta determina um modificador menor da mão. |
| **Vira Louca** | Existe uma pequena chance de gerar duas categorias de manilha. |
| **Chute na Vira** | Permite modificar a vira uma vez por campeonato. |
| **Vira na Sorte** | A primeira ativação de Manha ligada à vira tem chance garantida. |
| **Seis Maldito** | Quando a manilha é 6, todos os efeitos de manilha ficam mais fortes. |
| **Zap Zap** | O Zap recebe um efeito adicional único. |
| **Manilha de Reserva** | Quando você não possui manilha, ganha um pequeno bônus de informação. |

---

## D. Sacrifício

| Manha | Efeito |
|---|---|
| **Mão de Lixo** | Perder a primeira vaza gera recurso. |
| **Seu Zé** | Perder por pouco gera moedas. |
| **Cão de Guarda** | Perder a primeira vaza fortalece a segunda. |
| **Última Cartada** | A terceira carta recebe bônus após perder duas vazas. |
| **Apanhou, Levantou** | Após perder uma aposta, ganha pressão na próxima mão. |
| **Morde e Assopra** | Uma derrota evita uma penalidade futura. |
| **Contragolpe** | Se estiver 0–2 em vazas, a próxima carta recebe bônus. |
| **Humildade** | Correr voluntariamente gera dinheiro. |
| **Fingi que Perdi** | Uma vaza perdida propositalmente cria um bônus oculto. |
| **Não Dou Nada** | Mãos que começam sem cartas fortes geram recurso adicional. |

---

## E. Aposta / Truco

| Manha | Efeito |
|---|---|
| **Truco de Boteco** | Pedidos de Truco podem ser encadeados em determinadas condições. |
| **Gritador** | A primeira aposta da partida recebe bônus de pressão. |
| **Sangue Frio** | Aceitar 6 ou mais gera pequena recompensa extra. |
| **Vai a 6?** | Aumentar a aposta gera uma chance adicional de prêmio. |
| **Ou Tudo ou Nada** | Quando a mão vale 9+, efeitos de aposta são ampliados. |
| **Valentão** | Ganhar uma mão após aceitar 6 aumenta sua fama. |
| **Covardia Estratégica** | Correr antes de perder uma mão evita parte da perda econômica. |
| **Desafio** | Ao pedir Truco sem força, se o rival correr, ganhe moedas extras. |
| **Aposta Cega** | Você pode começar algumas mãos com valor maior em troca de recompensa. |
| **Última Palavra** | Uma resposta específica a um aumento concede bônus. |

---

## F. Economia

| Manha | Efeito |
|---|---|
| **Mão Leve** | Determinadas cartas geram moedas ao vencer vaza. |
| **Copo Americano** | Aumenta a renda de encontros. |
| **Carteiro** | Dá opções extras de recompensa após uma partida. |
| **Dona Nena** | Cartas fracas usadas para perder geram dinheiro. |
| **Caixa de Fósforo** | Pequenas recompensas acumulam em um multiplicador de dinheiro. |
| **Troco Certo** | Comprar itens abaixo de determinado preço devolve moedas. |
| **Fiado** | Pode comprar um item sem dinheiro, mas assume uma dívida. |
| **Caderneta** | Cada loja visitada aumenta um pequeno desconto futuro. |
| **Renda Extra** | Ganhar uma mão sem pedir Truco gera mais dinheiro. |
| **Bico** | Eventos podem gerar dinheiro adicional. |

---

## G. Parceiro

| Manha | Efeito |
|---|---|
| **Parceiro Fechado** | Melhora a consistência das decisões do parceiro. |
| **Dupla Dinâmica** | Quando você e o parceiro vencem vazas alternadas, ganham bônus. |
| **Confia em Mim** | Seu parceiro aceita determinadas apostas com maior confiança. |
| **Chamada Perfeita** | A primeira vez que você sinaliza uma estratégia, o parceiro se adapta. |
| **Segunda Voz** | Permite influenciar uma decisão do parceiro uma vez por mão. |
| **Parceiro de Aço** | O parceiro não recua facilmente de apostas altas. |
| **Parceiro Malandro** | O parceiro blefa mais. |
| **Parceiro Calculista** | O parceiro utiliza mais informação estatística. |
| **Parceria de Longa Data** | O parceiro recebe bônus conforme a run avança. |
| **Dupla Quase Perfeita** | Sinergias ficam melhores quando você mantém o mesmo parceiro por várias lutas. |

---

# 10. Cartas Modificadas

Em vez de adicionar centenas de cartas ao deck, o jogador pode transformar cartas específicas.

## Exemplos

| Modificador | Efeito |
|---|---|
| **Dourada** | Gera moedas ao participar de vitória. |
| **Sortuda** | Chance de duplicar recompensa. |
| **Marcada** | Revela informação sobre sua força. |
| **Nervosa** | Fica mais forte na terceira vaza. |
| **Pesada** | Forte, mas possui alguma restrição de uso. |
| **Fantasma** | Pode ser descartada para obter informação. |
| **Espelhada** | Copia um pequeno efeito da carta anterior. |
| **Resistente** | Não perde determinados efeitos negativos. |
| **Inflamada** | Ganha força após um pedido de Truco. |
| **Humilde** | Fica melhor quanto mais fraca for a situação. |
| **Fofoqueira** | Ao perder, revela uma informação sobre o rival. |
| **Mentirosa** | Parece mais forte para a IA do que realmente é. |
| **Sortuda II** | Aumenta a chance de ativação de efeitos RNG. |
| **Amaldiçoada** | Muito forte, mas possui uma penalidade. |
| **Coringa** | Pode assumir função especial dependendo da vira. |

---

# 11. Identidade dos naipes

Uma opção é dar identidade de build aos quatro naipes.

| Naipe | Identidade |
|---|---|
| ♣ Paus | Força / agressividade |
| ♥ Copas | Sorte / caos |
| ♠ Espadas | Informação / blefe |
| ♦ Ouros | Economia / recursos |

## Exemplo

### Build de Paus

- bônus para manilhas;
- bônus para ganhar primeira vaza;
- bônus ao aceitar apostas altas.

### Build de Copas

- RNG;
- duplicação;
- efeitos aleatórios;
- conversão de risco em prêmio.

### Build de Espadas

- visão do baralho;
- leitura de adversário;
- blefe;
- manipulação de informação.

### Build de Ouros

- moedas;
- loja;
- descontos;
- investimentos.

---

# 12. Identidade por valor da carta

Isso deve ser usado com cuidado para não transformar a carta em um simples “número com poder”.

| Valor | Possível identidade |
|---|---|
| 3 | Força |
| 2 | Controle |
| A | Flexibilidade |
| K | Aposta / comando |
| J | Blefe |
| Q | Sorte |
| 7 | Sacrifício |
| 6 | Manilha / conversão |
| 5 | Combo |
| 4 | Economia / lixo útil |

O objetivo é fazer um 4 continuar interessante.

---

# 13. Parceiros — segundo grande eixo da build

O parceiro deve ser muito mais importante que um simples NPC decorativo.

Cada parceiro teria:

- personalidade;
- IA;
- tendência de aposta;
- tolerância a risco;
- habilidade passiva;
- fraqueza;
- sinergias;
- frases próprias;
- histórico de relacionamento.

---

## 13.1. Exemplos de parceiros

| Parceiro | Personalidade | Mecânica |
|---|---|---|
| **Medroso** | Conservador | Corre cedo, mas perde menos recursos. |
| **Malandro** | Blefador | Faz mais blefes. |
| **Calculista** | Estatístico | Só aumenta com boa probabilidade. |
| **Valentão** | Agressivo | Pede Truco frequentemente. |
| **Velha Guarda** | Tradicional | Tem menos RNG, mais consistência. |
| **Doidão** | Caótico | Decisões imprevisíveis. |
| **Sortudo** | Lucky | Possui mais efeitos aleatórios. |
| **Fofoqueiro** | Informado | Descobre padrões dos adversários. |
| **Profissional** | Preciso | Forte, mas caro. |
| **Iniciante** | Fraco | Evolui muito durante a run. |
| **Empresário** | Econômico | Gera dinheiro em vez de pressão. |
| **Mestre do Zap** | Especialista | Sinergias com manilhas. |

---

# 14. Relacionamento com o parceiro

Pode existir uma barra de:

# CONFIANÇA

Exemplo:

```text
CONFIANÇA DO PARCEIRO

████████░░ 80%
```

Ela sobe quando:

- você segue a estratégia dele;
- aceita uma aposta difícil;
- protege uma situação de risco;
- aproveita uma leitura dele.

Ela cai quando:

- ignora sinais;
- corre em momentos que ele esperava agressividade;
- força apostas ruins;
- usa determinados efeitos contra a estratégia dele.

## Benefício

Parceiro com confiança alta pode:

- blefar melhor;
- arriscar mais;
- seguir melhor suas decisões;
- desbloquear uma habilidade especial.

---

# 15. Sistema de “Sinal” entre você e o parceiro

Uma mecânica experimental muito interessante seria permitir sinais.

Durante a mão:

```text
🤫 sinalizar
👍 força
👎 fraqueza
🔥 apostar
🧠 controlar
```

O parceiro interpreta o sinal.

Isso cria:

> **comunicação sem comunicação explícita.**

E pode gerar situações engraçadas quando o parceiro interpreta errado.

---

# 16. Adversários com IA psicológica

Os rivais não devem ter apenas números diferentes.

Cada rival deve ter um **perfil comportamental**.

| Rival | Tendência |
|---|---|
| Covarde | Corre frequentemente |
| Valentão | Aceita apostas |
| Calculista | Conta probabilidades |
| Blefador | Pede Truco sem força |
| Trapaceiro | Manipula regras |
| Impulsivo | Faz ações inesperadas |
| Conservador | Não arrisca |
| Predador | Explora seu padrão |
| Novato | Comete erros |
| Profissional | Joga consistentemente |

---

# 17. Sistema de memória do adversário

A IA pode guardar estatísticas da run.

Exemplo:

```text
JOÃO

Truco com manilha ........ 78%
Truco sem manilha ........ 22%

Corre em 6 ............... 61%
Aceita 6 .................. 39%

Prefere primeira vaza .... SIM
Blefa frequentemente ..... NÃO
```

Isso cria gameplay baseado em leitura.

---

# 18. “Reputação” do jogador

Uma camada social pode se chamar:

# FAMA

A fama representa o que os outros jogadores acham de você.

Pode subir por:

- blefes bem-sucedidos;
- vitórias improváveis;
- apostas grandes;
- derrotas humilhantes;
- vitórias contra Bosses.

## Fama baixa

Os adversários subestimam você.

## Fama média

A mesa começa a respeitar seus pedidos.

## Fama alta

A mesa conhece seu estilo.

Isso tem dois lados:

```text
MAIS FAMA
   ↓
MAIS RESPEITO
   ↓
MAIS RECOMPENSAS
   ↓
ADVERSÁRIOS MAIS PREPARADOS
```

A fama deve ser uma variável de gameplay, não apenas um número visual.

---

# 19. Respeito e Pressão

Pode funcionar melhor que copiar “Chips + Mult” literalmente.

## RESPEITO

Quanto a mesa acredita que você joga bem.

## PRESSÃO

Quanto você está impondo psicologicamente à mesa.

Exemplo:

| Ação | Respeito | Pressão |
|---|---:|---:|
| Vencer primeira vaza | + | + |
| Pedir Truco | + | +++ |
| Blefar e vencer | +++ | ++++ |
| Correr cedo | - | - |
| Aceitar 6 e vencer | ++++ | +++ |
| Pedir sem manilha | - / + | +++ |
| Perder aposta alta | -- | -- |

Manhas podem transformar essas relações.

---

# 20. Leitura do adversário como build

Uma build inteira pode ser construída em torno de informação.

# BUILD: DETETIVE

Componentes:

- Olho de Águia;
- Contador de Carta;
- Anotador;
- Parceiro Fofoqueiro;
- cartas Marcadas.

Objetivo:

> vencer não por ter mais força, mas por entender o padrão do adversário.

---

# 21. Build de Blefe

# BUILD: MALANDRAGEM

Componentes:

- Malandro;
- Cara de Pau;
- Teatro;
- Falsa Segurança;
- Parceiro Malandro.

Estratégia:

```text
MÃO FRACA
↓
BLEFE
↓
RIVAL CORRE
↓
DINHEIRO
↓
MAIS MANHAS
↓
BLEFE AINDA MAIS FORTE
```

---

# 22. Build de Sacrifício

# BUILD: MÃO DE LIXO

Componentes:

- cartas 4/5;
- Mão de Lixo;
- Última Cartada;
- Contrap golpe;
- parceiro agressivo.

A ideia:

> perder cedo para ganhar depois.

---

# 23. Build de Manilha

# BUILD: ZAP

Componentes:

- Vira Viciada;
- Zap Zap;
- Seis Maldito;
- Manilha de Reserva;
- parceiro especialista.

Objetivo:

> manipular as condições da vira e maximizar manilhas.

---

# 24. Build de Economia

# BUILD: BOTeco

Componentes:

- Mão Leve;
- Copo Americano;
- Troco Certo;
- Caderneta;
- parceiro Empresário.

Objetivo:

> aceitar menos risco agora e construir uma economia absurda.

---

# 25. Build de Caos

# BUILD: DOIDO

Componentes:

- cartas Sortudas;
- cartas Amaldiçoadas;
- Vira Louca;
- parceiro Doidão;
- eventos de aposta.

Objetivo:

> maximizar variância e tentar transformar RNG em vantagem.

---

# 26. Build de Parceiro

# BUILD: DUPLA

O jogador pega:

- várias Manhas relacionadas ao parceiro;
- parceiro específico;
- aumento de confiança;
- modificadores de sinais;
- bônus por vazas alternadas.

A build pode ficar mais forte sem aumentar diretamente a força das cartas.

---

# 27. Sistema de Combos

Não precisa existir um “combo meter” explícito.

O jogo pode reconhecer sequências.

Exemplo:

```text
Perde primeira vaza
↓
Parceiro vence segunda
↓
Você ganha terceira
↓
Pede Truco
↓
Rival corre
```

Isso pode disparar:

# “VIRADA DE MESA”

Recompensa:

- moedas;
- fama;
- experiência;
- chance de item raro.

---

# 28. Reações especiais

Grandes sequências podem gerar textos:

> “QUE VIROTA!”

> “TÁ MALUCO?”

> “JOGOU NO MEDO!”

> “CAIU NO BLEFE!”

> “ESSA DOEU.”

> “AGORA É 6!”

Isso ajuda a vender a fantasia de mesa de boteco.

---

# 29. Sistema de “momentos lendários”

Algumas ações podem criar feitos memoráveis.

| Feito | Desbloqueio |
|---|---|
| Vencer com três cartas fracas | Manha especial |
| Virar uma mão 0–2 | Relíquia |
| Ganhar após aceitar 9 | Novo parceiro |
| Fazer o adversário correr com 4 | Carta especial |
| Vencer 11×11 | Variante de baralho |
| Ganhar usando somente cartas modificadas | Desafio |
| Fazer sequência de blefes | Título |
| Vencer sem pedir Truco | Relíquia defensiva |

---

# 30. Mão de 11 como evento especial

Quando chegar a:

```text
11 × 8
```

a interface deve mudar.

Exemplo:

```text
━━━━━━━━━━━━━━━━━━━━

        MÃO DE 11

       VOCÊ 11 × 8 RIVAL

━━━━━━━━━━━━━━━━━━━━
```

Possíveis modificadores:

- parceiro revela sua mão;
- risco aumentado;
- recompensas maiores;
- cartas extras de informação;
- Manhas específicas para 11.

---

# 31. Mão de Ferro

Quando chegar a:

```text
11 × 11
```

a partida vira um mini-Boss.

Sugestão:

```text
TELA ESCURECE

som reduz

cartas desaceleram

MÃO DE FERRO
```

Alguns efeitos normais podem ser bloqueados.

A intenção é criar um momento de:

> **tensão pura.**

---

# 32. Bosses

Os Bosses devem mudar as regras, não apenas ter “mais vida”.

## Boss 1 — O Valentão

**Regra:**

> Começa a mão com permissão especial para pressionar a aposta.

---

## Boss 2 — O Contador

**Regra:**

> Conhece exatamente quantas manilhas ainda estão disponíveis.

---

## Boss 3 — A Cigana

**Regra:**

> A vira aparece parcialmente escondida.

---

## Boss 4 — O Trapaceiro

**Regra:**

> Usa cartas modificadas próprias.

---

## Boss 5 — O Professor

**Regra:**

> Aprende seus padrões durante a partida.

---

## Boss 6 — O Agiota

**Regra:**

> Suas derrotas geram dívida.

---

## Boss 7 — O Apostador

**Regra:**

> O valor das mãos escala mais rapidamente.

---

## Boss 8 — O Silencioso

**Regra:**

> Remove feedback visual de algumas ações.

---

## Boss 9 — A Dupla de Irmãos

**Regra:**

> Os adversários possuem forte coordenação.

---

## Boss 10 — Rei do Truco

**Regra:**

> Todas as mãos começam mais valiosas.

---

# 33. Bosses com “regras de mesa”

Alguns Bosses podem alterar globalmente um sistema.

| Boss | Regra global |
|---|---|
| Rei do Truco | Mãos iniciam valendo mais |
| Juiz | Algumas Manhas ficam proibidas |
| Barão | Loja muito mais cara |
| Cartomante | Vira é parcialmente oculta |
| Delegado | Blefes geram consequências |
| Malandro Supremo | Rival também usa recursos de blefe |
| Contador | Informação sobre o baralho é reduzida |
| Dono do Boteco | Eventos têm custo |
| Lenda | Parceiro adversário recebe habilidade |
| Mestre | IA aprende em tempo real |

---

# 34. Mapa estilo Slay the Spire

Uma run deve ter escolhas de caminho.

```text
                👑 BOSS
             /     |     \
           🍺      🎰      🛒
          /  \     |     /  \
        🃏    👤   🃏   💰   🎲
         \    |   /      \   /
          ─── EVENTOS ─────
               |
             INÍCIO
```

---

# 35. Tipos de nós

| Ícone | Nó |
|---|---|
| 🃏 | Partida |
| 🍺 | Boteco |
| 🛒 | Loja |
| 👤 | Parceiro |
| 🎰 | Evento |
| 💰 | Aposta |
| 🔥 | Elite |
| 👑 | Boss |
| 🧰 | Upgrade |
| ❓ | Mistério |

---

# 36. Partidas normais

Servem para:

- ganhar dinheiro;
- testar a build;
- descobrir padrões;
- escolher recompensas.

---

# 37. Elites

Partidas muito mais difíceis.

Porém:

- recompensa maior;
- chance maior de Manha rara;
- chance de parceiro especial;
- relicário;
- cartas únicas.

---

# 38. Loja

A loja pode ser uma:

# MERCEARIA / BOTECÃO

Itens:

```text
🃏 MANHAS
🧿 RELÍQUIAS
🛠 MODIFICADORES
🤝 PARCEIROS
💰 SERVIÇOS
🃏 REROLL
```

A grande decisão:

> gastar agora ou guardar para depois?

---

# 39. Loja com reroll

O jogador pode atualizar a vitrine.

Mas cada reroll fica mais caro:

```text
Reroll 1 = $2
Reroll 2 = $3
Reroll 3 = $5
Reroll 4 = $8
```

Isso cria decisões.

---

# 40. Remoção de carta modificada

Em vez de remover cartas do baralho inteiro, o jogador pode:

- limpar uma carta;
- retirar uma maldição;
- trocar um modificador;
- transformar uma carta.

---

# 41. Eventos brasileiros

## “Chegou a conta”

Escolha:

- pagar;
- negociar;
- sair fora.

---

## “Partida de sinuca”

Aposte dinheiro.

Possíveis resultados:

- ganhar muito;
- perder;
- receber uma relíquia.

---

## “Dona Maria sabe das coisas”

Ela pode:

- revelar informação de um Boss;
- remover um modificador;
- oferecer um parceiro.

---

## “O baralho está estranho”

Escolha:

- aceitar uma carta amaldiçoada;
- ganhar dinheiro;
- sair sem efeito.

---

## “Chegou um desconhecido”

Possibilidade de:

- novo parceiro;
- rival;
- desafio;
- aposta.

---

# 42. Eventos com escolhas irreversíveis

Esse tipo de evento é importante para o roguelite.

Exemplo:

### O Agiota

> “Te empresto $30.”

Escolhas:

**ACEITAR**

- +30 agora;
- juros a cada partida.

**RECUSAR**

- sem dívida;
- ganha reputação.

---

# 43. Relíquias

As Relíquias são modificadores mais raros e globais.

| Relíquia | Efeito |
|---|---|
| **Copo Americano** | +1 moeda ao finalizar uma partida. |
| **Ficha de Sinuca** | Eventos de aposta têm recompensa maior. |
| **Trevo** | Primeira ativação de sorte é garantida. |
| **Carteira Velha** | Começa cada campeonato com moedas extras. |
| **Baralho de Estimação** | Uma carta específica recebe bônus em toda a run. |
| **Rádio de Boteco** | Exibe rumores sobre o próximo Boss. |
| **Chave do Bar** | Desbloqueia áreas especiais do mapa. |
| **Foto da Turma** | Parceiro ganha confiança mais rapidamente. |

---

# 44. Sistema de investimento

Uma camada opcional:

## BOCA DO CAIXA

O jogador pode investir moedas.

Exemplos:

- investir em loja;
- investir no parceiro;
- comprar informação;
- pagar uma dívida;
- desbloquear atalho.

Isso cria escolhas além de “comprar Joker”.

---

# 45. Sistema de dívida

Uma build pode deliberadamente funcionar no vermelho.

Exemplo:

```text
DINHEIRO: -12

DÍVIDA: 12
```

Enquanto endividado:

- lojas ficam mais caras;
- alguns eventos ficam bloqueados;
- recompensas podem ser aumentadas.

Mas existem Manhas que tornam dívida uma fonte de poder.

# BUILD: FIADO

> “Quanto mais devo, mais forte fico.”

---

# 46. Sistema de “aposta da mão”

Antes de algumas partidas, o jogador pode aceitar desafios:

> “Jogue esta mão valendo mais.”

Em troca:

- mais dinheiro;
- chance de item raro;
- reputação.

Mas:

> perder custa caro.

---

# 47. Desafios opcionais

Exemplo:

### DESAFIO

> “Vença sem pedir Truco.”

Recompensa:

- +20 moedas;
- item especial.

Outro:

> “Ganhe fazendo o rival correr.”

Outro:

> “Use pelo menos uma carta 4 para ganhar.”

Outro:

> “Aceite uma mão de 6.”

---

# 48. Campeonato

A estrutura de dificuldade pode ser:

```text
CAMPEONATO 1
Municipal
↓
CAMPEONATO 2
Regional
↓
CAMPEONATO 3
Estadual
↓
CAMPEONATO 4
Nacional
↓
CAMPEONATO 5
Lendário
```

---

# 49. A dificuldade deve vir de regras

Evitar:

> “inimigo +50% de força.”

Preferir:

### Campeonato 2

> adversários lembram seus blefes.

### Campeonato 3

> vira pode ficar escondida.

### Campeonato 4

> rivais podem ter Manhas.

### Campeonato 5

> parceiros adversários possuem habilidades.

### Campeonato 6

> decisões de aposta são mais perigosas.

---

# 50. Mutadores de campeonato

Cada campeonato pode receber uma regra aleatória.

| Mutador | Efeito |
|---|---|
| **Mesa Quente** | apostas escalam mais rápido |
| **Baralho Nervoso** | cartas recebem efeitos aleatórios |
| **Vira Misteriosa** | informação parcial |
| **Todo Mundo Conhece Você** | fama começa alta |
| **Sem Conversa** | comunicação com parceiro reduzida |
| **Dia de Sorte** | RNG aumentado |
| **Carteado** | cartas modificadas aparecem mais |
| **Mesa Pequena** | menos recursos |
| **Mão Pesada** | perder custa mais |
| **Noite Longa** | run começa com menos dinheiro |

---

# 51. Arquétipos de build

| Build | Foco | Sensação |
|---|---|---|
| 🧨 Trucão | força + aposta | agressiva |
| 🃏 Malandragem | blefe | psicológica |
| 🧠 Detetive | informação | controle |
| 🍺 Boteco | economia | crescimento |
| 🔮 Sorte | RNG | caótica |
| ♣ Zap | manilhas | especialista |
| 🩸 Mão de Lixo | derrota | comeback |
| 🤝 Dupla | parceiro | sinergia |
| 🎭 Teatro | pressão | blefe extremo |
| 💳 Fiado | dívida | alto risco |
| ⚔️ Terceira Vaza | comeback | estratégica |
| 🌀 Caos | regras alteradas | imprevisível |

---

# 52. Combinações de build

O verdadeiro objetivo é permitir híbridos.

## Exemplo 1 — Blefe + economia

```text
Malandro
+
Mão Leve
+
Cara de Pau
+
Parceiro Empresário
```

Blefar gera dinheiro.

---

## Exemplo 2 — Sacrifício + terceira vaza

```text
Mão de Lixo
+
Última Cartada
+
Contrap golpe
+
Parceiro Valentão
```

Você quer parecer fraco.

---

## Exemplo 3 — Informação + aposta

```text
Olho de Águia
+
Contador de Carta
+
Sangue Frio
+
Parceiro Calculista
```

Você não pede Truco por impulso.

Você pede quando tem informação.

---

# 53. Sinergias “absurdas”

É importante que o jogo tenha interações que o jogador descubra sozinho.

Exemplo:

### Sinergia

**Falsa Segurança**

> quanto pior sua mão, maior o blefe.

+

**Mão de Lixo**

> perder a primeira vaza dá bônus.

+

**Cara de Pau**

> blefes após uma derrota são mais fortes.

Resultado:

> você quer começar perdendo.

---

# 54. Sistema de tags

Cada carta e Manha pode possuir tags.

Exemplo:

```text
TAG: BLEFE
TAG: 4
TAG: SACRIFÍCIO
TAG: PRIMEIRA VAZA
```

Isso facilita sinergias.

Exemplo:

> “Sempre que um efeito de BLEFE ativar, cartas 4 ganham +1 Pressão.”

---

# 55. Sistema de “Combo Tags”

Possibilidades:

- BLEFE;
- MANILHA;
- APOSTA;
- SORTE;
- PERDA;
- PRIMEIRA VAZA;
- SEGUNDA VAZA;
- TERCEIRA VAZA;
- PARCEIRO;
- OURO;
- FAMA;
- PRESSÃO;
- INFORMAÇÃO.

As Manhas podem procurar essas tags.

Isso permite centenas de combinações sem precisar de milhares de efeitos exclusivos.

---

# 56. Exemplo de sistema de desencadeamento

```text
VOCÊ JOGA 4♦
↓
TAG: 4
↓
TAG: SACRIFÍCIO
↓
PERDE A VAZA
↓
ATIVA "MÃO DE LIXO"
↓
GANHA $2
↓
ATIVA "CARA DE PAU"
↓
PRÓXIMO BLEFE É FORTALECIDO
```

Isso cria a sensação de “engine”.

---

# 57. Limite de complexidade

Evitar uma interface lotada.

O jogador precisa entender:

- por que uma coisa ativou;
- quais efeitos estão ativos;
- o que mudou;
- qual foi a recompensa.

Toda ativação importante deve mostrar:

```text
[MÃO DE LIXO]
Perdeu a primeira vaza
+ $2
```

---

# 58. Velocidade da partida

O jogo não pode parecer um simulador burocrático.

A partida deve ser:

1. pensar;
2. escolher;
3. animação;
4. reação;
5. próxima decisão.

Evitar excesso de telas de confirmação.

---

# 59. Aposta como botão cinematográfico

O botão:

# TRUCO!

deve ser extremamente satisfatório.

Quando acionado:

- som seco de mesa;
- zoom;
- reação dos personagens;
- pausa curta;
- fala;
- botão de resposta.

Possíveis respostas:

```text
ACEITAR
CORRER
AUMENTAR
```

---

# 60. Reações dos personagens

A personalidade pode ser transmitida sem texto longo.

Exemplos:

### Rival confiante

> “Bora.”

### Rival assustado

> “Calma aí…”

### Rival irritado

> “Você tá blefando!”

### Parceiro

> “Confia.”

### Parceiro nervoso

> “Sei não…”

---

# 61. Áudio

O som pode ser uma parte enorme da identidade.

Elementos:

- barulho de cartas;
- batida na mesa;
- copo;
- ventilador;
- TV;
- rádio;
- sinuca;
- vozes;
- torcida;
- cachorro;
- moto passando;
- chuva;
- música ambiente.

Durante uma mão de 11:

> reduzir o ruído do ambiente.

Durante um pedido de Truco:

> aumentar o impacto sonoro.

---

# 62. Pixel Art

Referência:

- 32×32 para cartas / pequenos ícones;
- sprites de personagens em resolução baixa;
- animações curtas;
- zoom discreto;
- muitos detalhes no cenário em vez de UI excessiva.

## Cenário

```text
MESA DE FÓRMICA
AZULEJO
VENTILADOR
TV
RÁDIO
SINuca
COPOS
CADEIRAS
CALENDÁRIO
GELADEIRA
BALCÃO
CHURRASQUEIRA
```

---

# 63. Biomas / locais

Em vez de “mundos” genéricos:

| Local | Identidade |
|---|---|
| Boteco de bairro | início |
| Bar de estrada | risco |
| Clube | partidas competitivas |
| Festa de interior | caos |
| Quermesse | eventos |
| Churrascaria | economia |
| Clube de sinuca | aposta |
| Campeonato municipal | elite |
| Arena final | Rei do Truco |

---

# 64. Personagens como coleção

O jogador pode desbloquear personagens.

Não apenas como cosmético.

Cada personagem pode ser:

- parceiro;
- rival;
- vendedor;
- evento;
- Boss;
- narrador.

Isso cria um elenco recorrente.

---

# 65. Sistema de rival recorrente

Um rival pode aparecer várias vezes.

Exemplo:

```text
PRIMEIRO ENCONTRO
↓
VOCÊ GANHA
↓
ELE FICA COM RAIVA
↓
SEGUNDO ENCONTRO
↓
ELE APRENDE SEU ESTILO
↓
TERCEIRO ENCONTRO
↓
BOSS
```

Isso cria uma narrativa emergente.

---

# 66. Rival que aprende

Uma mecânica excelente:

> A IA aprende seu padrão durante uma run.

Se você:

- blefa muito;
- sempre aceita;
- corre sempre em 6;
- joga cartas fracas primeiro;

o rival começa a responder.

Mas não deve parecer trapaça.

O jogo pode comunicar:

> “João percebeu que você costuma correr em 6.”

---

# 67. Informação como recurso comprável

Na loja:

### BOATO

> Revela uma regra do próximo Boss.

### FOFOCA

> Revela uma tendência do próximo rival.

### MAPA

> Mostra qual rota tem melhor recompensa.

### PALPITE

> Mostra a chance aproximada de uma situação.

Isso cria outro eixo de economia.

---

# 68. Probabilidades sem matar o blefe

O jogo pode mostrar apenas pistas.

Evitar:

```text
CHANCE EXATA DE VITÓRIA: 67.23%
```

Preferir:

```text
MÃO MUITO FORTE
```

ou:

```text
RIVAL PROVAVELMENTE ESTÁ BLEFANDO
```

Ou:

```text
RISCO ALTO
```

Assim a experiência continua psicológica.

---

# 69. Sistema de “pressão da mesa”

Uma variável global opcional:

```text
PRESSÃO

█████████░ 90%
```

Ela sobe quando:

- apostas aumentam;
- blefes funcionam;
- jogadores fazem sequências arriscadas;
- alguém vira uma mão.

Em pressão alta:

- personagens ficam mais nervosos;
- eventos ficam mais extremos;
- certos efeitos ficam mais fortes.

---

# 70. Sistema de tilt

Uma ideia mais experimental.

Cada personagem pode possuir:

# TEMPERAMENTO

Após derrotas consecutivas:

- pode ficar mais agressivo;
- mais conservador;
- mais previsível;
- mais propenso a blefar.

Não deve ser uma simulação de “emoção real”; é uma regra comportamental visível.

---

# 71. Eventos de “mesa”

Além de eventos do mapa, pode haver eventos dentro da partida.

Exemplo:

> “O barulho aumenta.”

Resultado:

- voz de personagens fica menos clara;
- informação auditiva é reduzida;
- cartas recebem pequeno modificador.

Outro:

> “Todo mundo parou para olhar.”

Resultado:

- próxima aposta tem maior Pressão.

---

# 72. Sistema de superstição

Superstições brasileiras podem funcionar como cartas raras.

Exemplos:

- jogar primeiro;
- nunca virar determinada carta;
- preferir determinada mão;
- mudar de lugar;
- bater três vezes na mesa;
- usar carta “da sorte”.

Cada superstição deve trazer uma vantagem acompanhada de alguma condição.

---

# 73. Baralhos iniciais

## Baralho Normal

Balanceado.

---

## Baralho da Sorte

- mais efeitos RNG;
- menos consistência;
- potencial alto.

---

## Baralho do Blefe

- maior quantidade de efeitos de informação;
- menos foco em força.

---

## Baralho do Dinheiro

- gera recursos;
- começa mais fraco.

---

## Baralho do Truco

- bônus em apostas;
- risco maior.

---

## Baralho do Interior

- cartas 4, 5 e 6 recebem mais sinergias.

---

# 74. Baralhos com regras realmente diferentes

Desbloqueios avançados podem alterar a própria run.

## Baralho Espelhado

A ordem de algumas cartas recebe efeitos invertidos.

## Baralho Nervoso

Cada mão possui um modificador aleatório.

## Baralho Marcado

Você recebe mais informação, mas os inimigos também.

## Baralho do Apostador

Mais dinheiro, mais risco.

---

# 75. Meta-progressão

Entre runs, o jogador desbloqueia:

- novos parceiros;
- novas Manhas;
- novos baralhos;
- novos Bosses;
- novos eventos;
- cosméticos;
- novas relíquias;
- novas dificuldades.

Importante:

> não dar simplesmente “+10% de força permanente”.

A meta-progressão deve priorizar **variedade**, não poder bruto.

---

# 76. Desbloqueios por feitos

Exemplos:

| Feito | Desbloqueia |
|---|---|
| Ganhar sem pedir Truco | Manha defensiva |
| Ganhar com três cartas fracas | Manha de Sacrifício |
| Vencer 11×11 | Variante especial |
| Fazer 5 blefes | Parceiro |
| Ganhar uma mão valendo 12 | Relíquia |
| Ter muita dívida e vencer | Baralho Fiado |
| Derrotar o mesmo rival 3 vezes | Rival especial |
| Vencer com parceiro iniciante | Novo parceiro |

---

# 77. Desafios diários

Opcional.

Exemplo:

> **Hoje a vira é sempre 5.**

> **Você começa com fama máxima.**

> **Todos os adversários têm comportamento agressivo.**

> **Lojas custam metade.**

> **Sem parceiros.**

> **Somente cartas modificadas ativam efeitos.**

Isso cria rejogabilidade.

---

# 78. Modo de desafio

Além da run tradicional:

## MODO CAOS

Regras aleatórias.

## MODO FERRO

Sem certas Manhas.

## MODO PURISTA

Pouquíssimas alterações no Truco.

## MODO LOUCURA

Todas as regras quebradas possíveis.

## MODO SEM DINHEIRO

Progressão baseada em vitórias.

---

# 79. Condições de vitória alternativas

Normalmente:

> chegar ao objetivo do campeonato.

Mas desafios especiais podem exigir:

- ganhar X moedas;
- realizar X blefes;
- vencer X mãos de 11;
- ganhar sem manilha;
- perder a primeira vaza várias vezes;
- usar determinado parceiro.

---

# 80. “Contract Runs”

Antes de iniciar uma run, o jogador pode escolher um contrato.

Exemplo:

# CONTRATO DO MALANDRO

> “Não posso pedir Truco com uma manilha.”

Recompensa:

- mais dinheiro;
- maior chance de Manhas de blefe.

Outro:

# CONTRATO DO CORAJOSO

> “Preciso aceitar toda aposta até 6.”

---

# 81. Sistema de risco/recompensa por rota

O mapa deve criar decisões.

### Caminho seguro

```text
Partida
→ Loja
→ Partida
→ Boss
```

### Caminho perigoso

```text
Elite
→ Evento
→ Aposta
→ Elite
→ Boss
```

### Caminho de economia

```text
Boteco
→ Loja
→ Boteco
→ Loja
```

### Caminho de build

```text
Parceiro
→ Upgrade
→ Elite
→ Loja
```

---

# 82. O que NÃO fazer

## 1. Não transformar cartas em números simples

Evitar:

```text
3 = +10
2 = +9
A = +8
```

Isso remove a identidade do Truco.

---

## 2. Não exagerar na informação

Se o jogo mostrar tudo:

> deixa de existir blefe.

---

## 3. Não criar um deckbuilder tradicional só por ser “roguelite”

O Truco já oferece uma base muito forte.

---

## 4. Não fazer parceiros inúteis

O parceiro precisa influenciar decisões.

---

## 5. Não usar dificuldade apenas como “mais forte”

Prefira:

- novas regras;
- IA;
- mutadores;
- informação incompleta;
- pressão.

---

# 83. O loop ideal

```text
JOGAR TRUCO
       ↓
LER A MESA
       ↓
BLEFAR / ACEITAR / CORRER
       ↓
GANHAR TENTOS
       ↓
GANHAR DINHEIRO
       ↓
COMPRAR MANHAS
       ↓
CRIAR SINERGIA
       ↓
MELHORAR PARCEIRO
       ↓
ESCOLHER ROTA
       ↓
ENFRENTAR REGRAS MAIS ABSURDAS
       ↓
BOSS
       ↓
NOVA RUN
```

---

# 84. Exemplo de Run

## Início

```text
BARALHO NORMAL

MANHAS:
• Mão Leve
• Seu Zé

PARCEIRO:
• Medroso
```

---

## Mão

```text
VIRA: 5♥

SUA MÃO:
3♠
Q♥
4♦
```

Você tem:

- nenhuma manilha;
- cartas medianas / fracas.

Você decide:

> jogar 4 primeiro.

---

## Resultado

Você perde a primeira vaza.

Ativa:

> **Mão de Lixo → +$2**

Parceiro ganha a segunda.

Agora você percebe:

> “Tenho chance de virar.”

Você pede:

# TRUCO!

O rival corre.

Ativa:

> **Seu Zé → bônus de dinheiro**

---

## Recompensa

Escolha:

```text
🃏 Cara de Pau
🧿 Trevo
🤝 Malandro
```

Você escolhe:

> Cara de Pau.

Agora sua run começa a caminhar para:

# BLEFE + SACRIFÍCIO

---

# 85. Exemplo de build final absurda

```text
MANHAS

1. Mão de Lixo
2. Última Cartada
3. Cara de Pau
4. Malandro
5. Contrap golpe
6. Mão Leve

PARCEIRO

Malandro

CARTAS

4♦ Dourado
5♠ Marcado
```

Estratégia:

```text
Perder primeira vaza
      ↓
ganhar recurso
      ↓
parecer fraco
      ↓
forçar rival a atacar
      ↓
aceitar aposta
      ↓
virar a mão
      ↓
ganhar dinheiro
```

Essa é a sensação que o jogo deve procurar.

---

# 86. Exemplo de “momento Balatro”

O jogador está:

```text
0 × 2 vazas
```

Aposta:

```text
6
```

O rival aceita.

Você parece perdido.

Mas:

```text
Mão de Lixo
+
Última Cartada
+
Contrap golpe
+
Parceiro Valentão
+
4♦ Dourado
```

começam a ativar em sequência.

Na terceira vaza:

```text
🔥 VIRADA DE MESA 🔥
```

Recompensa:

```text
+12 moedas
+8 Fama
+1 Relíquia
```

A graça está em perceber:

> **“Minha build queria que eu perdesse.”**

---

# 87. Sistema de “build discovery”

O jogo não deve explicar todas as combinações.

Ele deve dar pistas.

Exemplo:

> “Você ganhou várias vezes após perder a primeira vaza.”

Depois:

> desbloqueia uma Manha ligada a isso.

O jogador começa a entender a build naturalmente.

---

# 88. Sistema de desafios de carta

Algumas cartas podem ter pequenas missões.

Exemplo:

### 4♦

```text
OBJETIVO
Perder uma vaza e sobreviver.

RECOMPENSA
+1 moeda permanente na carta.
```

Isso faz cartas “ruins” ganharem personalidade.

---

# 89. Cartas com memória

Uma ideia mais avançada:

A carta pode lembrar o que aconteceu.

Exemplo:

### 4♦ “Venenoso”

Primeira vez que perde:

> ganha +1.

Segunda:

> ganha +2.

Terceira:

> transforma-se em carta especial.

Isso cria apego a cartas específicas.

---

# 90. Carta “favorita”

O jogador pode escolher uma carta como:

# CARTA DE ESTIMAÇÃO

Ela ganha upgrades ao longo da run.

Isso cria narrativa.

Exemplo:

> “Esse 4 aqui ganhou cinco partidas.”

---

# 91. Cartas lendárias

Pouquíssimas.

Exemplo:

## O ZAP DOURADO

Quando a vira torna 6 uma manilha:

> o Zap possui um efeito adicional.

---

## A CARTA DO BOTeco

Ao ser usada para perder:

> cria uma aposta opcional.

---

## A CARTA MENTIROSA

Pode parecer uma carta mais forte do que realmente é para a IA.

---

# 92. Itens consumíveis

Equivalente a consumíveis de um card roguelite.

Exemplos:

| Item | Uso |
|---|---|
| Café | comprar uma carta adicional na próxima mão |
| Cerveja | aumentar sorte por uma mão |
| Ficha | rerollar recompensa |
| Isqueiro | remover maldição |
| Baralho velho | olhar a próxima carta |
| Toalha | limpar modificador |
| Amuleto | proteger uma Manha |

Os itens devem ser raros o bastante para criar decisão.

---

# 93. Sistema de inventário

Pode existir:

```text
CONSUMÍVEIS
[☕] [🎱] [🧿]

MANHAS
[5/5]

RELÍQUIAS
[3]

DINHEIRO
$24
```

---

# 94. Sistema de raridade visual

A raridade precisa ser instantaneamente legível.

- borda diferente;
- animação sutil;
- brilho;
- partículas;
- som próprio.

Mas sem transformar tudo em efeitos exagerados.

---

# 95. Boss final — Rei do Truco

O Boss final deve parecer o ápice do sistema.

Ele conhece:

- seu parceiro;
- suas Manhas;
- seu estilo;
- sua reputação;
- seus padrões.

Regra central:

> **A mesa começa mais agressiva.**

Durante a luta:

- vira pode ser manipulada;
- rivais usam Manhas;
- parceiro sofre pressão;
- apostas sobem rapidamente.

Objetivo:

> usar tudo o que você aprendeu durante a run.

---

# 96. Endgame

Depois de vencer o Boss final:

## Vitória normal

Recebe final do campeonato.

## Vitória com condição

Desbloqueia final especial.

Exemplos:

> vencer sem usar manilhas.

> vencer com build de sacrifício.

> vencer endividado.

> vencer com parceiro iniciante.

> vencer com fama máxima.

---

# 97. A estética ideal

Não seria:

> “Balatro brasileiro.”

Seria:

# “TRUCO PAULISTA COMO JOGO DE AVENTURA DE BOTeco.”

Visual:

- mesa de fórmica;
- plástico;
- azulejo;
- copo americano;
- cinzeiro;
- sinuca;
- ventilador;
- TV;
- rádio;
- cartazes;
- calendário;
- luz fluorescente;
- interior de SP.

---

# 98. Direção de arte

## Paleta

Base:

- azul;
- verde;
- vermelho;
- amarelo;
- bege;
- madeira;
- branco envelhecido.

## Pixel Art

- 32×32;
- outlines fortes;
- poucas cores;
- animações de 2–8 frames;
- zoom para ações importantes.

---

# 99. Interface principal

```text
╔══════════════════════════════════════╗
║ VOCÊ 7                    RIVAL 5    ║
║                                      ║
║              VIRA                    ║
║             ┌─────┐                  ║
║             │ 5 ♥ │                  ║
║             └─────┘                  ║
║                                      ║
║    PARCEIRO            PARCEIRO      ║
║                                      ║
║          CARTAS DA SUA MÃO           ║
║                                      ║
║     [3♠]    [Q♥]    [4♦]             ║
║                                      ║
║   TRUCO        JOGAR        ITENS     ║
╚══════════════════════════════════════╝
```

---

# 100. Feedback visual da aposta

Quando a mão sobe:

```text
1
↓
3
↓
6
↓
9
↓
12
```

o jogo deve mostrar claramente:

- valor atual;
- risco;
- prêmio;
- reação dos personagens.

---

# 101. Sistema de frases dinâmicas

Frases podem depender da situação.

Exemplos:

### Você pede Truco sem manilha

> “Coragem não faltou.”

### Você corre

> “Hoje não.”

### Você vira 0–2

> “Ainda não acabou.”

### Rival cai no blefe

> “Caiu.”

### Você perde 11×11

> “Essa vai doer.”

Isso pode virar parte importante da identidade.

---

# 102. Música

Cada ambiente pode ter uma identidade.

### Boteco

- sertanejo instrumental;
- viola;
- rádio AM;
- música baixa.

### Campeonato

- música mais intensa;
- percussão;
- tensão.

### Mão de Ferro

- quase silêncio.

---

# 103. Pequenas animações que vendem o jogo

- carta batendo na mesa;
- parceiro olhando para você;
- rival coçando a cabeça;
- copo mexendo;
- ficha deslizando;
- câmera aproximando;
- torcida reagindo;
- rádio mudando;
- personagem levantando.

O objetivo é fazer uma partida de cartas parecer uma cena.

---

# 104. Humor

A comédia pode nascer da situação, não de texto excessivo.

Exemplo:

Você pede Truco com 4.

O rival demora.

O parceiro começa a suar.

O rival corre.

Seu parceiro olha para você.

Texto:

> “????????”

Esse tipo de momento pode ser memorável.

---

# 105. Sistemas que mais diferenciam o jogo

Se fosse preciso escolher os sistemas mais importantes para prototipar primeiro:

| Prioridade | Sistema |
|---|---|
| 1 | Truco base |
| 2 | Aposta / correr / aceitar |
| 3 | Manhas |
| 4 | Parceiro |
| 5 | IA psicológica |
| 6 | Recompensas |
| 7 | Mapa |
| 8 | Loja |
| 9 | Eventos |
| 10 | Bosses |
| 11 | Meta-progressão |
| 12 | Cosméticos |

---

# 106. MVP — versão mínima jogável

Para um primeiro protótipo, eu faria apenas:

## Core

- Truco Paulista 2×2;
- 3 cartas;
- vira;
- manilhas;
- até 3 vazas;
- 1 → 3 → 6 → 9 → 12.

## Roguelite

- 10 Manhas;
- 3 parceiros;
- 5 adversários;
- 1 loja;
- 1 evento;
- 1 Boss;
- 1 mapa simples.

## Recursos

- tentos;
- moedas;
- slots de Manha.

---

# 107. Protótipo vertical

Depois do MVP:

- 30 Manhas;
- 10 parceiros;
- 15 adversários;
- 5 Bosses;
- 20 eventos;
- 5 baralhos;
- cartas modificadas;
- sistema de reputação.

---

# 108. Versão completa

Uma versão maior poderia ter:

```text
100+ MANHAS
30+ PARCEIROS
50+ EVENTOS
20+ BOSS
10+ BARALHOS
100+ MODIFICADORES
VÁRIOS BIOMAS
DESAFIOS
META-PROGRESSÃO
RUNS DIÁRIAS
```

Mas isso só deve vir depois de o core ser divertido.

---

# 109. O teste definitivo de Game Design

Uma build precisa gerar perguntas interessantes.

Não:

> “Qual carta tem maior número?”

Mas:

> “Devo representar força?”

> “Devo esconder minha informação?”

> “Meu parceiro está forte?”

> “O rival está me testando?”

> “Vale 6?”

> “Quero perder a primeira vaza?”

> “Minha reputação está me ajudando ou atrapalhando?”

> “Compro outra Manha ou guardo dinheiro?”

> “Aceito esse risco porque minha build foi feita para virar a mão?”

---

# 110. O conceito em uma frase

# **BALATRO NA ESTRUTURA, TRUCO PAULISTA NA ALMA.**

O jogo ideal não deve ser:

> “Balatro com cartas de Truco.”

Deve ser:

> **“Um roguelite em que o próprio Truco é a máquina de estratégia.”**

A camada roguelite existe para deformar:

- o blefe;
- a aposta;
- a vira;
- as manilhas;
- o parceiro;
- a leitura do adversário;
- o risco;
- a economia.

---

# 111. Resumo da arquitetura do jogo

```text
                         TRUCO PAULISTA
                               │
              ┌────────────────┼────────────────┐
              │                │                │
            BLEFE            APOSTA           VAZAS
              │                │                │
              └────────────────┼────────────────┘
                               │
                         ROGUELITE
                               │
       ┌───────────────┬───────┼───────┬───────────────┐
       │               │       │       │               │
    MANHAS         PARCEIRO  CARTAS  RELÍQUIAS       EVENTOS
       │               │       │       │               │
       └───────────────┴───────┼───────┴───────────────┘
                               │
                             BUILD
                               │
                         MAPA / RUN
                               │
                             BOSS
                               │
                       NOVA RUN / META
```

---

# 112. Direção final recomendada

A identidade mais forte aparece quando o jogo trata **o Truco como verbo**, e não somente como tema.

Os verbos principais do jogador seriam:

- **jogar**
- **blefar**
- **pressionar**
- **aceitar**
- **correr**
- **virar**
- **ler**
- **arriscar**
- **confiar**
- **enganar**
- **investir**
- **adaptar**

A melhor versão desse projeto provavelmente será aquela em que o jogador termina uma run pensando:

> **“Eu não ganhei porque tinha as melhores cartas. Ganhei porque montei uma forma completamente absurda de jogar Truco.”**

---

# 113. Checklist de design

## Core

- [ ] Truco continua reconhecível
- [ ] Vira continua importante
- [ ] Manilhas continuam importantes
- [ ] Parceiro importa
- [ ] Blefe importa
- [ ] Aposta importa
- [ ] 11×11 é especial

## Roguelite

- [ ] Build muda entre runs
- [ ] Existe risco/recompensa
- [ ] Há escolhas reais
- [ ] Existe economia
- [ ] Há rotas diferentes
- [ ] Bosses mudam regras
- [ ] Meta-progressão aumenta variedade

## Experiência

- [ ] Partidas rápidas
- [ ] Feedback claro
- [ ] Animações satisfatórias
- [ ] Humor
- [ ] Personalidade dos personagens
- [ ] Pixel art marcante
- [ ] Som de mesa convincente

---

# 114. Prioridade de desenvolvimento

Se a equipe fosse começar amanhã:

## Fase 1 — Fun

Criar somente:

```text
TRUCO
+
APOSTA
+
IA
```

A pergunta:

> “Jogar uma mão é divertido sem roguelite?”

---

## Fase 2 — Build

Adicionar:

```text
10 MANHAS
+
3 PARCEIROS
```

Pergunta:

> “Existe estratégia suficiente para querer jogar outra run?”

---

## Fase 3 — Run

Adicionar:

```text
MAPA
+
LOJA
+
RECOMPENSAS
+
BOSS
```

Pergunta:

> “A run tem ritmo?”

---

## Fase 4 — Conteúdo

Adicionar:

```text
EVENTOS
+
NOVOS PARCEIROS
+
NOVOS BOSS
+
BARALHOS
+
MODIFICADORES
```

---

## Fase 5 — Polimento

Adicionar:

- animações;
- áudio;
- personagens;
- pixel art;
- UX;
- efeitos;
- feedback;
- humor;
- balanceamento.

---

# CONCLUSÃO

O maior potencial desse conceito está em uma combinação muito específica:

```text
TRUCO
+
BLEFE
+
INFORMAÇÃO INCOMPLETA
+
PARCEIRO
+
RISCO
+
ROGUELITE
+
SINERGIAS
```

A grande sacada é não tentar “copiar Balatro” mecanicamente.

O objetivo é capturar o que faz uma boa build de roguelite ser satisfatória e usar essas ferramentas para **potencializar as decisões que já são interessantes no Truco Paulista**.

O jogador deve começar uma run pensando:

> “Vou tentar ganhar no Truco.”

e terminar pensando:

> “Meu Deus, olha a maneira absurda que minha build transformou o Truco.”

</referenciaBrainstormCHATGPT>

---

## Revisão pós-pesquisa (2026-10-15)

Releitura deste brainstorm depois da pesquisa de jogos de cartas digitais ([card-games-research.md](card-games-research.md)) e da consolidação no [GDD](gdd-game-design-document.md) e no [visual.md](visual.md). Não reescreve nada acima: só marca o que a pesquisa confirma, o que ela sugere mudar e o que o dev precisa decidir.

### O que a pesquisa confirma

```text
BALATRO NA ESTRUTURA
+
TRUCO PAULISTA NA ALMA
=
o caminho certo
```

- **Aposta crescente + correr** é o coração do Marvel Snap (cubo de gamão + recuo). O truco já tem isso há um século: pedir truco como alavanca de pontos está certo.
- **Sinais com o parceiro** são o diferencial mais forte e mais barato: nenhum dos 13 jogos estudados tem comunicação secreta com parceiro como mecânica (Card Shark chega perto).
- **Chefes que mudam regra**, não só número, são o que se lembra de uma luta (Boss Blinds, StS). Os 10 chefes atuais já seguem isso.
- **Meta só de variedade** (baralhos, parceiros, Estacas) é o padrão de Balatro, StS e Monster Train.
- **Lugar e gente do outro lado da mesa** vendem o jogo (cabana do Inscryption, taverna do Hearthstone). O boteco está certo; precisa durar do Campeonato 1 ao 8.
- **PvE contra IA** é o que a maioria quer (70–80% dos jogadores de Legends of Runeterra estavam no PvE). Multiplayer fora do escopo está certo.
- **Demo limitada por conteúdo** (até o primeiro chefe) é exatamente a lição do autor do Balatro.
- **Conteúdo como dado** em `src/data/` é como equipes pequenas escalam ("balancear é trocar um número").

### O que muda (propostas, nada decidido)

| # | Proposta | Por quê |
|---|---|---|
| 1 | "Correu: poupou N" na tela, em vez de só derrota da mão | "Escapou!" do Snap fez perder parecer vitória |
| 2 | Pular mesa com custo de design | Hoje é dominante (+8 a +20 p.p. no bot); Promessa sem custo vira atalho |
| 3 | Estacas com regras do truco, não só metas e tentos de vantagem | "Dificuldade por regra" é pilar nosso e lição de Balatro/StS |
| 4 | Feedback em degraus: TRUCO < SEIS < NOVE < DOZE; ZAP e bater a meta como "fogo no placar" | Escalada proporcional é o produto, não enfeite |
| 5 | Intenção leve do chefe ("vou trucar") e lista dos 10 efeitos no tooltip do coringa | Transformar sorte em decisão (crítica ao Peglin) |
| 6 | Tabela de força/manilha a uma tecla na mesa; dicas de "como jogar bem" na 1ª run | Público internacional não sabe truco; crítica ao tutorial do Balatro |
| 7 | Liberar Simpatias, Lances e modificadores aos poucos nas primeiras runs | Sobrecarga de sistemas (Peglin) |
| 8 | Plateia do boteco reagindo a jogadas grandes; ambiência que sobe na mão decisiva | Plateia do Hearthstone |
| 9 | Ícone de Fichas como tampinha/feijão/palito, nunca ficha de cassino; nada de cifrão grande | PEGI 18+ do Balatro, banimento do Luck be a Landlord |
| 10 | Métricas por Manha, parceiro e baralho no `sim.ts` | Dashboards do Monster Train e do StS, sem telemetria de jogador |
| 11 | Separar as cores de raridade das cores da conta (Rara azul ≈ Fichas azul; Lendária roxa ≈ Fama roxa) | Reserva de matiz e daltonismo |

### Perguntas abertas para o dev

1. [ ] Precedência dos docs: `AGENTS.md` > rules > GDD > visual.md > PLAN, ou o PLAN continua "fonte da verdade" como diz o `AGENTS.md`?
2. [ ] Pular mesa: qual custo? (Promessa só no fim do Campeonato, meta maior na mesa seguinte, ou outra ideia.)
3. [ ] `/play/` em `truco.lekzera.xyz` é o jogo completo **grátis e público**? Como fica o modelo premium da Steam e da Play?
4. [ ] Poki exige exclusividade na web: manter a demo no itch.io e no site, negociar acordo não exclusivo ou sair da Poki?
5. [ ] Fichas azul + Mult vermelho: manter (convenção do gênero) ou trocar para uma dupla própria do boteco?
6. [ ] Loja: a moldura laranja = lendária contradiz a raridade lendária roxa. Moldura = tipo e selo = raridade?
7. [ ] Estacas: aceitar trocar alguns degraus numéricos por regras do truco (rivais trucam mais cedo, mão de 11 obrigatória, Manha Perecível), mantendo os degraus de 5–8 p.p.?
8. [ ] "Correu: poupou N" e a escalada TRUCO < SEIS < NOVE < DOZE entram antes da 1.0?
9. [ ] Seed visível/desafio da semana para streamers: continua fora até a 1.0?
10. [ ] Espanhol (Argentina e Uruguai jogam truco) como primeiro idioma pós-1.0?
11. [ ] Duração alvo de uma run (minutos) para a página da loja e para o celular?
