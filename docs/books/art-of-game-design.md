# The Art of Game Design — guia de estudo por capítulo

> Resumo didático de *The Art of Game Design: A Book of Lenses* (Jesse Schell, 1ª edição, 33 capítulos, 100 lenses) para agentes/LLMs que projetam, avaliam e balanceiam os sistemas do **Zapatro** (roguelite em pixel art sobre o Truco Paulista 2×2: você + parceiro IA contra uma dupla IA; cada mão vencida pontua Fichas × Mult, com a aposta 1/3/6/9/12 como Mult base; 8 Campeonatos × 3 mesas com loja, Manhas, modificadores de carta, sinais do parceiro, Fama, chefes e Estacas).
>
> - **Referência rápida** (as 100 lenses com todas as perguntas, tabela de decisão, índice de lenses por tarefa): skill `art-of-game-design` em `.claude/skills/art-of-game-design/SKILL.md`.
> - **Este arquivo**: leitura sequencial — o que cada capítulo ensina e como aplicar aqui.
> - Nomes do autor ficam em inglês (elemental tetrad, interest curve, Lens #33 Triangularity) para bater com a skill.
> - "No nosso jogo" é aplicação deste projeto, não texto do livro. Fontes do projeto: `docs/gdd-game-design-document.md` (design), `docs/visual.md` (arte), `docs/balancing.md` (números).

## Como um agente deve usar este guia

1. **Uma lens é um conjunto de perguntas, não uma regra.** Para avaliar um design: escolha as lenses da tarefa, responda cada pergunta por escrito contra o design real, e transforme toda resposta fraca em mudança ou em pergunta aberta.
2. **Antes de projetar um sistema**, leia o capítulo correspondente:

| Tarefa | Capítulos |
| --- | --- |
| Visão, tema, conceito | 2, 4, 5, 6 |
| Especificar mecânicas (mesa, cartas, aposta, sinais, regras) | 10 |
| Balancear Manhas, modificadores, Lances, parceiros, Estacas, economia | 10 (Chance), 11 |
| Desenhar mesas, chefes e salas | 12, 19 |
| HUD da mesa, contagem, loja, feedback | 13 |
| Ritmo da mão, da mesa, do Campeonato e da run | 9, 14 |
| História, mundo, personagens | 15, 17, 18 |
| Perfis de IA, parceiro e condução do jogador | 16 |
| Protótipo, playtest, escopo, documentos | 7, 24, 25 |

1. **Ao reportar**, cite por número e nome (ex.: "Lens #32 Meaningful Choices: pular a Pequena é estratégia dominante").

## A estrutura do livro

O livro é um mapa que cresce a cada capítulo: o **designer** cria uma **experiência**, que surge de um **jogo**, feito de **elementos** que sustentam um **tema**; o jogo nasce de uma **ideia**, melhora por **iteração**, é feito para um **jogador** com uma mente; tem **mecânicas** que precisam de **balanceamento**, **puzzles**, **interface**; a experiência tem **curva de interesse**, **história**, **mundo**, **personagens**, **espaços**, **estética**; pode ter **outros jogadores** e **comunidade**; é feito por um **time** com **documentos**, **playtests** e **tecnologia**, para um **cliente**, com **lucro**; e **transforma** quem joga.

---

## Parte I — Designer, experiência e jogo (Cap. 1–7)

### Cap. 1 — In the Beginning, There Is the Designer

**Ideia central.** Game design é o ato de decidir o que o jogo deve ser. Designer é um papel: quem toma essas decisões.

**O que aprender.** A habilidade mais importante é **escutar**, em cinco frentes: Team, Audience, Game, Client, Self. Escutar o jogo é diagnosticá-lo vendo-o rodar. Muitas decisões só se resolvem com o jogo funcionando — registre-as mesmo assim.

**No nosso jogo.** Toda decisão de design em aberto vira registro escrito, com o motivo (`docs/decisions.md`, pendências do GDD §22). Escutar o jogo = rodar o bot (`?run=1&auto=1`) e o `scripts/sim.ts` e ver onde as runs morrem.

### Cap. 2 — The Designer Creates an Experience

**Ideia central.** O jogo não é a experiência; é um artefato que a provoca na mente do jogador. Só a experiência importa.

**O que aprender.** **Essential Experience**: liste o que define a experiência-alvo, descarte o incidental e entregue cada essencial por qualquer elemento (arte, som, regra) — não por simulação. Wii Sports baseball manteve o swing e descartou as nove entradas. Cuidado com a introspecção: o que é verdade para mim pode não ser para outros; observe a si e aos outros.

**No nosso jogo.** A experiência essencial já está escrita (GDD 1.2): *"Eu não ganhei porque tinha as melhores cartas: ganhei porque montei uma forma absurda de jogar Truco."* Ela é o filtro de corte: o Truco que importa é vira, manilha, vazas, aposta, mão de 11 e mão de ferro; o que é só simulação de mesa real (embaralhar, cortar, marcar tentos à mão) pode ser abstraído.

**Lens.** #1 Essential Experience.

### Cap. 3 — The Experience Rises Out of a Game

**Ideia central.** Um jogo é uma atividade de resolução de problemas, abordada com atitude lúdica.

**O que aprender.** Diversão é prazer com surpresas. Brincar é manipular para satisfazer curiosidade. **Endogenous value**: itens e pontos só importam se ligados à motivação do jogador — as bolas de lã de Bubsy só dão pontos e são ignoradas; os anéis de Sonic 2 protegem e dão vidas. Um problema visto como insolúvel vira mera atividade. Obrigação transforma jogo em trabalho.

**No nosso jogo.** Dinheiro, Manhas, Lances, Promessas e Fama precisam alimentar a build ou a mão seguinte; o que só dá ponto é ignorado. Cada mão propõe um problema (pedir truco ou não, que carta abrir, quando usar a encoberta); cada chefe propõe um problema novo. Combinações de Manhas devem surpreender o próprio jogador.

**Lenses.** #2 Surprise, #3 Fun, #4 Curiosity, #5 Endogenous Value, #6 Problem Solving.

### Cap. 4 — The Game Consists of Elements

**Ideia central.** Todo jogo é feito de quatro elementos igualmente essenciais que se restringem mutuamente.

**O que aprender.** **The elemental tetrad**: Mechanics (regras e procedimentos), Story (sequência de eventos), Aesthetics (como parece, soa e é sentido — o elo mais direto com a experiência), Technology (o meio). Nenhum é primário. Deficiência em um se resolve em outro: Space Invaders trocou soldados por aliens para justificar a câmera. Mantenha em mente pele (experiência) e esqueleto (elementos) ao mesmo tempo.

**No nosso jogo.** Toda feature é auditada contra os quatro: regra (Truco + contagem), história (boteco, elenco, chefes), estética (pixel art 640×360, vozes, juice) e tecnologia (Phaser 4, lógica pura por turnos, web/Steam/Android). Limite técnico se compensa em outro elemento: retrato 48×48 com 10 expressões no lugar de animação de corpo; placeholder por código para asset ausente.

**Lenses.** #7 Elemental Tetrad, #8 Holographic Design.

### Cap. 5 — The Elements Support a Theme

**Ideia central.** Um tema unificador faz cada elemento reforçar os outros.

**O que aprender.** Dois passos: (1) descubra o tema; (2) reforce-o por todos os meios. Tema não é assunto ("piratas"), é ponto de vista ("a fantasia de ser pirata") ou uma verdade profunda (Titanic: o amor é mais forte que a morte). O que não reforça o tema sai — inclusive convenção de gênero: no jogo Pirates os jogadores ficaram invulneráveis até um naufrágio dramático no fim, porque respawn quebrava a fantasia.

**No nosso jogo.** O tema é o boteco do interior paulista: zoeira de mesa de bar, provocação amigável, nunca cassino. Ele decide convenções do gênero: os "Coringas" do Balatro viram Manhas, as Tags viram Promessas, ficha de pôquer vira marcador de boteco, e o tom não muda entre Campeonatos. Tematize o barato: gritos "TRUCO!"/"SEIS!", textos de Manha, cores de fórmica e azulejo.

**Lenses.** #9 Unification, #10 Resonance.

### Cap. 6 — The Game Begins with an Idea

**Ideia central.** Designers pensam, testam, mudam e testam de novo. Melhore o primeiro passo com inspiração externa, enunciado preciso do problema e o subconsciente.

**O que aprender.** Inspire-se na vida, não em jogos parecidos. **State the Problem**: objetivo + restrições, em forma de pergunta — amplo demais erra o alvo, estreito demais já assume a solução. Brainstorming: escreva tudo, numere listas, liste ideias por elemento do tetrad e combine entre listas.

**No nosso jogo.** Todo sistema começa com um enunciado de problema (ex.: "como dar custo a pular a mesa sem tirar o atrativo das Promessas?" ou "como fazer o parceiro mudar decisões com um só sinal por mão?"). Inspire-se em mesas reais de truco, não só em Balatro.

**Lenses.** #11 Infinite Inspiration, #12 Problem Statement.

### Cap. 7 — The Game Improves Through Iteration

**Ideia central.** Qualidade segue o número de ciclos testar-e-melhorar. Gaste cada ciclo no maior risco e mantenha ciclos baratos.

**O que aprender.**

- **The Rule of the Loop**: quanto mais vezes testar e melhorar, melhor o jogo.
- **The Formal Loop**: 1 enuncie o problema → 2 brainstorm → 3 escolha → 4 liste riscos → 5 protótipo para mitigar → 6 teste → 7 enuncie os novos problemas.
- **The Eight Filters**: Artistic Impulse, Demographics, Experience Design, Innovation, Business and Marketing, Engineering, Social/Community, Playtesting. Após qualquer mudança, passe pelos oito de novo.
- **Protótipos**: respondem a uma pergunta, ignoram qualidade, são descartáveis, maior risco primeiro, não precisam ser digitais (o combate por turnos de Toontown Online foi balanceado como jogo de tabuleiro), construa o brinquedo primeiro.
- **"The Method" (Cerny)**: pré-produção dura até existirem dois níveis publicáveis com todas as features (~30% do orçamento).

**No nosso jogo.** O brinquedo é a mão: jogar uma carta e apertar TRUCO! tem de ser gostoso sem meta nenhuma (checklist do GDD 16). Protótipo de Manha nova cabe em papel ou num teste de `scoreHand` antes de arte. Cronometre uma Manha completa (dado + i18n EN/PT-BR + ícone + teste) e uma sala de concept completa antes de se comprometer com quantidades.

**Lenses.** #13 Eight Filters, #14 Risk Mitigation, #15 Toy.

---

## Parte II — O jogador (Cap. 8–9)

### Cap. 8 — The Game is Made for a Player

**Ideia central.** Saiba o que o público vai gostar melhor do que ele mesmo, projetando-se nele e observando-o jogar.

**O que aprender.** Taxonomias como lista de cobertura, nunca como verdade completa: **LeBlanc** (Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission); **Bartle** (Achievers, Explorers, Socializers, Killers); prazeres extras (Anticipation, Possibility, Pride in an Accomplishment, Purification, Surprise, Triumph over Adversity…).

**No nosso jogo.** Três públicos (GDD 1.5): quem joga truco quer o truco de verdade com zoeira (Fellowship, Fantasy do boteco); o fã de roguelite quer builds e "só mais uma run" (Challenge, Expression, Discovery); o público internacional quer novidade cultural (Discovery). Quando o design parecer raso, audite as listas por público.

**Lenses.** #16 The Player, #17 Pleasure.

### Cap. 9 — The Experience is in the Player's Mind

**Ideia central.** Jogar usa quatro capacidades mentais — modelagem, foco, empatia, imaginação — movidas por necessidades.

**O que aprender.** **Flow** exige objetivos claros, sem distrações, feedback direto e desafio contínuo. O **flow channel** fica entre ansiedade e tédio; suba-o em ondas: desafio crescente → recompensa de poder → trecho mais fácil → nova rampa ("tense and release"). Maslow: a maioria dos jogos opera em auto-estima (nível 4).

**No nosso jogo.** As ondas já existem: Pequena → loja → Grande → loja → Chefe → loja. A loja depois de uma mesa dura é a recompensa de poder; a Pequena do Campeonato seguinte é o trecho mais fácil antes da nova rampa. Feedback direto: cada passo da contagem aparece na ordem dos `steps`.

**Lenses.** #18 Flow, #19 Needs, #20 Judgment.

---

## Parte III — Mecânicas (Cap. 10–13)

### Cap. 10 — Some Elements are Game Mechanics

**Ideia central.** Mecânica é o que sobra sem estética, tecnologia e história. São seis.

**O que aprender.**

1. **Space** — discreto ou contínuo, dimensões, áreas e conexões; espaços aninhados.
2. **Objects, Attributes, and States** — substantivos, adjetivos e seu estado atual. Um diagrama de estados por atributo complexo. **Hierarchy of knowers**: quem conhece cada estado (todos, alguns, um, só o jogo).
3. **Actions** — *operative* (verbos básicos) × *resultant* (usos estratégicos emergentes). Ações resultantes ≈ sujeitos × verbos × objetos. Dicas de emergência: mais verbos; **verbos que agem sobre muitos objetos** (a mais forte); objetivos alcançáveis de mais de um jeito; muitos sujeitos; efeitos colaterais que mudam restrições.
4. **Rules** — a regra mais importante é o objetivo do jogo: concreto, alcançável, recompensador. Modos: poucos e sempre sinalizados.
5. **Skill** — física, mental, social. Skill real (do jogador) × virtual (do personagem).
6. **Chance** — dez regras de probabilidade: OU soma (eventos exclusivos), E multiplica (independentes), "pelo menos um" = 1 − chance de nenhum, soma de dados não é linear (3d6 concentra em 10–11), na dúvida simule (Monte Carlo).

**Expected value** = Σ probabilidade × valor *real*. Um ataque de 20% para 40 de dano vale 8 contra muito HP, mas ~3 contra um alvo de 15 HP — abaixo de um ataque garantido de 4. Jogadores agem por probabilidade *percebida* e evitam arrependimento.

**No nosso jogo.** Capítulo-base da lógica pura (`legalActions` / `apply` / `observe`).

- Space: a mesa em cruz (você embaixo, parceiro em cima, rivais nas laterais), o leque de 3 cartas, a vaza e a fileira de Manhas, cuja ordem da esquerda para a direita muda a conta. Espaços aninhados: run → Campeonato → mesa → mão → vaza.
- Estado: carta (valor, naipe, modificador, manilha/ZAP pela vira, encoberta), tentos, aposta, Fama. **Hierarchy of knowers**: público = vira, plaquinha de manilha/ZAP, cartas jogadas, tentos, Fama; privado = sua mão (a do parceiro só na mão de 11; ninguém vê a própria na mão de ferro); parcial = sinais (balão só com a categoria, flagra base 20%). O jogo nunca mostra probabilidade exata. Mudar quem sabe o quê é a alavanca mais forte (Cartomante, Mudo, Irmãos).
- Ações: jogar carta ou encoberta, pedir/aceitar/correr/aumentar, sinalizar, comprar/vender/trocar. Prefira verbos que agem sobre muitos objetos (Simpatias que editam o baralho, Manhas por tag) a efeitos de uso único. Efeitos que mudam restrições (vira oculta, Manha desativada, mão começando em 3) geram decisões novas.
- Skill: ler a mesa e a aposta é skill real; a meta-progressão só dá variedade, nunca poder (D-11).
- Chance: valor esperado em Pontos, não em tentos; Pontos acima da meta são overkill; mão perdida vale 0 qualquer que seja o Mult. A IA estima `p` por Monte Carlo (40 distribuições); simule Manha nova no `scripts/sim.ts`. O jogador vai sentir o flagra de 20%, os 35% da Sortuda e o sorteio do coringa (1 de 10) piores do que são.

**Lenses.** #21 Functional Space, #22 Dynamic State, #23 Emergence, #24 Action, #25 Goals, #26 Rules, #27 Skill, #28 Expected Value, #29 Chance.

### Cap. 11 — Game Mechanics Must be in Balance

**Ideia central.** Balancear é ajustar até o jogo entregar a experiência pretendida. Só começa com o jogo jogável.

**O que aprender.** **The Twelve Most Common Types of Game Balance**:

1. **Fairness** — simétrico mede skill; assimétrico dá variedade. Método: pontue atributos (Low 1, Medium 2, High 3), some, teste, repese. Rock-Paper-Scissors: o que vence algo perde para outra coisa.
2. **Challenge vs. Success** — dificuldade sobe a cada sucesso; partes fáceis passam rápido; camadas de desafio (notas).
3. **Meaningful Choices** — estratégia dominante acaba com a escolha. Escolhas > desejos sobrecarrega; < frustra. **Triangularity**: baixo risco/baixa recompensa × alto risco/alta recompensa, com valor esperado parecido.
4. **Skill vs. Chance** — alterne: a sorte distribui, a skill joga.
5. **Head vs. Hands**.
6. **Competition vs. Cooperation**.
7. **Short vs. Long**.
8. **Rewards** — Praise, Points, Prolonged Play, A Gateway, Spectacle, Expression, Powers, Resources, Completion. Crescentes; variável vence fixa.
9. **Punishment** — só o que o jogador entende e pode evitar; remoção de poderes só temporária; transforme penalidade em bônus.
10. **Freedom vs. Controlled Experience**.
11. **Simple vs. Complex** — complexidade inata (exceções: "exceto", "a menos que") × emergente (regras simples, situações complexas). **Elegance**: conte os propósitos de cada elemento; funda ou corte os de propósito único.
12. **Detail vs. Imagination** — só detalhe o que consegue fazer bem.

Metodologia: **dobre ou divida por dois** um valor que parece errado (nunca ajuste 10%); documente o modelo; deixe valores editáveis em runtime. Economia = dois ciclos de escolha: como ganhar, como gastar. Balanceamento dinâmico rouba a sensação de domínio.

**No nosso jogo.** Manhas, parceiros e baralhos são balanceamento assimétrico: meça taxa de escolha e de vitória por item no `scripts/sim.ts` e repese o que sempre ou nunca é escolhido. Pular mesa, medido como dominante (GDD 5.3), é Lens #32 de livro. A aposta é a triangularidade central: correr é seguro-pequeno (vale o valor anterior), aceitar/aumentar é arriscado-grande. Valores só em `src/data/`, espelhados em `docs/balancing.md`; mudou número, roda `bun run balance` (bot bom 40–60% na Estaca 1, aleatório < 5%). Punição: duas quedas rivais encerram a run (o gênero aceita porque a run é curta e a meta dá variedade); Juiz e Agiota tiram poder só por uma mesa, como o livro pede. Mostrar "Correu: poupou N" transforma penalidade em escolha. Economia: ~$54 sobrando no fim da run indica dinheiro fácil demais (Lens #46).

**Lenses.** #30 Fairness, #31 Challenge, #32 Meaningful Choices, #33 Triangularity, #34 Skill vs. Chance, #35 Head and Hands, #36 Competition, #37 Cooperation, #38 Competition vs. Cooperation, #39 Time, #40 Reward, #41 Punishment, #42 Simplicity/Complexity, #43 Elegance, #44 Character, #45 Imagination, #46 Economy, #47 Balance.

### Cap. 12 — Game Mechanics Support Puzzles

**Ideia central.** Puzzle é tudo que faz o jogador parar e pensar; formalmente, "um jogo com estratégia dominante" — divertido de descobrir uma vez.

**O que aprender.** **Ten Puzzle Principles**: 1 objetivo fácil de entender; 2 fácil de começar; 3 sensação de progresso; 4 sensação de que tem solução; 5 dificuldade gradual; 6 paralelismo deixa o jogador descansar; 7 estrutura em pirâmide; 8 dicas; 9 dê a resposta; 10 mudanças de percepção são faca de dois gumes.

**No nosso jogo.** Cada chefe é um puzzle de regra (P5: regra, não número): objetivo claro (meta + regra mostrada antes da mesa), primeiros movimentos óbvios, progresso visível (Pontos × meta, quedas rivais). Chefe com uma única resposta vira solução decorada; a build sorteada é o que o mantém "jogo". Pyramid: Pequena e Grande montam a build que enfrenta o Chefe, e os 8 Campeonatos sobem até o Rei do Truco fixo. Paralelismo: pular mesa (Promessa) e a loja dão rotas alternativas quando uma mesa trava.

**Lenses.** #48 Accessibility, #49 Visible Progress, #50 Parallelism, #51 The Pyramid, #52 The Puzzle.

### Cap. 13 — Players Play Games Through an Interface

**Ideia central.** A interface é a membrana entre jogador e mundo; o objetivo é o jogador sentir controle, idealmente sem notá-la.

**O que aprender.**

- **Seis setas de mapeamento** entre input físico, interface virtual, mundo e output físico. Confusão do jogador sempre está em uma delas.
- **Feedback**: toda ação recebe resposta em até **0,1 s**, ou parece quebrado. **Juiciness**: muito retorno para pouca ação.
- **Channels of Information**, 4 passos: liste e priorize a informação (todo momento / de relance / ocasional) → liste canais → mapeie → revise dimensões (número, cor, tamanho, fonte).
- **Modes**: use o mínimo; não sobreponha; faça modos diferentes parecerem o mais diferentes possível.
- Outras dicas: copie o que funciona, tematize a interface, camadas para equilibrar opções e simplicidade, teste sempre.

**No nosso jogo.** Antes de mexer no HUD, rode os 4 passos para: mão, plaquinha da vira (manilha e ZAP), seta da vez, aposta atual, Pontos × meta (todo momento); tentos NÓS × ELES, Fama, fileira de Manhas, dinheiro (de relance); níveis de Lance (tecla L), baralho, regras (ocasional). Fichas sempre azul + ícone, Mult sempre vermelho + ícone; nada só por cor. Jogar carta / responder truco / contagem / loja são modos: a coluna de resposta (vermelho aumenta, verde aceita, azul corre) precisa parecer outro modo. Confirme o input em 0,1 s (a carta sobe ao toque) mesmo quando `TABLE_TIMING` leva 220 ms para jogá-la; a 4× tudo continua legível; juice proporcional ao número (Visual V4).

**Lenses.** #53 Control, #54 Physical Interface, #55 Virtual Interface, #56 Transparency, #57 Feedback, #58 Juiciness, #59 Channels and Dimensions, #60 Modes.

---

## Parte IV — Experiência, história e mundo (Cap. 14–20)

### Cap. 14 — Experiences Can be Judged by Their Interest Curves

**Ideia central.** Uma experiência é tão boa quanto sua sequência de eventos em segurar o interesse. Desenhe a curva, compare com o observado, reordene ou corte.

**O que aprender.** **Interest curve**: gancho logo no início → recuo → picos crescentes com descansos → clímax maior que tudo antes → resolução curta. É **fractal**: mesma forma no jogo inteiro, em cada nível, em cada desafio. Três fatores de interesse: Inherent Interest, Poetry of Presentation, Projection (estranhos → amigos → eu).

**No nosso jogo.** A curva fractal está no GDD 2.1. Mão: pico no TRUCO! aceito, na contagem subindo e no ZAP na mão; vale na mão sem manilha jogada no automático. Mesa: virada contra rivais com 11. Campeonato: revelação do chefe e da regra torta, com a loja como descanso. Run: a build "fecha"; vigie o vale de C3–C5 e meça onde as runs são abandonadas. Gancho: tutorial jogado e primeira mesa com TRUCO! cedo. Corte trecho arrastado (contagem lenta, loja sem nada que combine), custe o que custou.

**Lenses.** #61 The Interest Curve, #62 Inherent Interest, #63 Beauty, #64 Projection.

### Cap. 15 — One Kind of Experience Is the Story

**Ideia central.** História e jogo são máquinas de criar experiência; narrativa interativa é mais difícil, não diferente.

**O que aprender.** Dois métodos que funcionam: **String of Pearls** (história não interativa, depois jogo livre com objetivo fixo, repete) e **Story Machine** (sistemas geram eventos que vale recontar). Problemas da história ramificada: unidade, explosão combinatória, finais múltiplos decepcionam, poucos verbos, "viagem no tempo" anula a tragédia. Dicas: desafios de gameplay = obstáculos dramáticos do personagem; mundo mais simples e jogador mais poderoso; **a história é o elemento mais maleável — reescreva-a para justificar a mecânica**; mantenha o mundo consistente. Hero's Journey (12 passos de Vogler) serve de teste, não de fórmula.

**No nosso jogo.** Não há campanha roteirizada: o Zapatro é story machine. A run tem de gerar histórias que valha recontar ("ZAP numa mão valendo DOZE com o Tonhão blefando"); `[Manha] motivo · ganho` e o resumo de fim de run permitem recontá-las. O "fio" mínimo é a progressão do lugar, do Boteco do Bairro ao Rei do Truco. Obstáculo dramático = mecânico: cada chefe é um personagem do interior com uma regra torta.

**Lenses.** #65 The Story Machine, #66 The Obstacle, #67 Simplicity and Transcendence, #68 The Hero's Journey, #69 The Weirdest Thing, #70 Story.

### Cap. 16 — Story and Game Structures can be Artfully Merged with Indirect Control

**Ideia central.** O jogador precisa da *sensação* de liberdade, não de liberdade real.

**O que aprender.** **Seis métodos de Indirect Control**: Constraints (menu curto), Goals, Interface, Visual Design (o jogador vai aonde o olho vai), Characters, Music. **Collusion**: personagens de IA têm dois objetivos — o deles no mundo e o do designer (ritmo).

**No nosso jogo.** Os perfis de IA (covarde, valentão, calculista, blefador, novato, profissional) servem ao ritmo, não só à força: o Novato erra de propósito, o Valentão-chefe truca toda mão para manter a tensão, a IA "pensa" 420 ms para dar leitura. Constraints: loja com 2 ofertas e pacotes de 3–4 opções, não um catálogo. Characters: o parceiro conduz pelo balão de sinal. Visual design: botão TRUCO! e plaquinha da vira são os elementos mais dominantes da mesa.

**Lenses.** #71 Freedom, #72 Indirect Control, #73 Collusion.

### Cap. 17 — Stories and Games Take Place in Worlds

**Ideia central.** O produto real é um mundo que existe além de qualquer mídia; cada jogo é uma porta de entrada.

**O que aprender.** **Binocular effect**: uma ilustração rica vista uma vez é projetada sobre gráficos simples do jogo. Mundos fortes realizam um desejo e comportam muitas histórias.

**No nosso jogo.** Cartas 48×64 e retratos 48×48 simples, apoiados por concept art de sala, chefes 96×96 e key art fortes (binocular effect). O desejo que o mundo realiza: ser o rei da mesa do boteco, ganhar com uma jogada absurda e tirar sarro dos rivais. O mesmo mundo em todas as portas (jogo, site, trailer, página da loja).

**Lens.** #74 The World.

### Cap. 18 — Worlds Contain Characters

**Ideia central.** Personagens de jogo tendem a ser físicos, fantásticos e simples; profundidade se constrói por função, traços, relações, status e mudança.

**O que aprender.** Avatar como forma ideal ou tela em branco (menos detalhe = mais projeção). Nove dicas: 1 liste funções de personagem; 2 defina traços e mostre-os em toda fala e ação; 3 Interpersonal Circumplex (hostil/amigável × submisso/dominante); 4 Character Web (o que cada um pensa de cada outro); 5 Status (algo que se *faz*, relativo a quem está presente; inversões geram interesse); 6 voz; 7 rosto (mantenha um rosto na tela); 8 tabela de transformação (personagens × seções da história); 9 evite o uncanny valley.

**No nosso jogo.** Funções primeiro: parceiro (4 arquétipos = 4 estilos de jogo: Tonhão valentão, Dona Cida calculista, Zé Malandro blefador, Juninho novato), rivais de mesa comum (6) e chefes (9 sorteados + o Rei do Truco fixo como chefe final). Traços aparecem nas 10 expressões do retrato e nos gritos; o parceiro é o rosto mais importante e fica sempre na tela (Visual V3). Circumplex: espalhe os parceiros por quadrantes diferentes (Tonhão dominante, Juninho submisso, Dona Cida fria, Zé Malandro provocador). Status: o Rei do Truco e o Professor jogam alto; a virada contra eles é a inversão.

**Lenses.** #75 The Avatar, #76 Character Function, #77 Character Traits, #78 The Interpersonal Circumplex, #79 The Character Web, #80 Status, #81 Character Transformation.

### Cap. 19 — Worlds Contain Spaces

**Ideia central.** A função da arquitetura é controlar a experiência de quem está dentro.

**O que aprender.** Cinco organizações de espaço: Linear, **Grid**, Web, Points in Space, Divided Space. Todo bom espaço tem **landmarks**. As quinze propriedades de Alexander como teste de qualidade — algumas diretas para jogos de mesa: Deep Interlock (peças só têm sentido em relação às adversárias), Echoes (chefe lembra os lacaios), The Void (arena de chefe ampla), Alternating Repetition (nível/chefe, tensão/alívio).

**No nosso jogo.** Linear na run (8 Campeonatos × 3 mesas, sem mapa de rotas até a 1.0), mesa em cruz fixa no jogo. Landmark: um objeto-assinatura por sala (proposta do Visual §9: bandeirinhas na Quermesse, troféu no Clube, sela na Festa do Peão, coroa no Rei do Truco). Echoes: o chefe lembra os rivais da sala; Alternating Repetition: mesa/loja.

**Lenses.** #82 Inner Contradiction, #83 The Nameless Quality.

### Cap. 20 — The Look and Feel of a World Is Defined by Its Aesthetics

**Ideia central.** Estética atrai jogadores, solidifica o mundo, torna cada visão nova uma recompensa e compra tolerância a falhas.

**O que aprender.** Concept art é protótipo; alterne protótipos abstratos e ilustrações. "Distant mountains": nomeie lugares e eventos nunca mostrados para o mundo parecer maior. Áudio melhor faz os mesmos gráficos parecerem melhores; escolha uma música de referência no início.

**No nosso jogo.** Concept art de tela é protótipo (mockup → pixels2svg → tela; skill `svg-concept-art`). Distant mountains: nomeie Campeonatos, salas e rivais que o jogador ainda não viu. Áudio: gritos de truco e rádio AM dão o tom. Execução da arte em `docs/visual.md` e `docs/books/pixel-logic.md`. Sem lens nova.

---

## Parte V — Outros jogadores (Cap. 21–22)

### Cap. 21 — Some Games are Played with Other Players

**Ideia central.** Jogar junto é a norma, mas multiplayer precisa pagar seu custo — cerca de **4x** o de um single-player equivalente.

**No nosso jogo.** Sem multiplayer (GDD 1.6): 1 humano + 3 IAs; Collaboration vem do parceiro IA e dos sinais. Antes de orçar qualquer modo multiplayer no futuro, nomeie qual das cinco razões ele atende (Competition, Collaboration, Meeting Up, Exploring our Friends, Exploring Ourselves).

### Cap. 22 — Other Players Sometimes Form Communities

**Ideia central.** Jogadores vêm pelo jogo e ficam pela comunidade.

**O que aprender.** Dez dicas; a mais útil fora de multiplayer é **forçar dependência**: tire algo de cada papel ("só cura os outros, nunca a si mesmo").

**No nosso jogo.** Modelo direto para o parceiro e as Manhas: peça fraca sozinha, forte em conjunto (GDD 16.6); vazas 2×2 que ninguém vence sozinho; o chefe Mudo testa o que sobra sem comunicação.

**Lenses.** #84 Friendship, #85 Expression, #86 Community, #87 Griefing.

---

## Parte VI — Produção (Cap. 23–26)

### Cap. 23 — The Designer Usually Works with a Team

**Ideia central.** O segredo do trabalho em equipe é amor pelo jogo e pelo público.

**O que aprender.** Julgue ideias por quão bem resolvem o problema declarado ("a ideia da nave", não "minha ideia"). Registre decisões onde todos vejam. Não detalhe demais: deixe ambiguidade para quem implementa.

**Lenses.** #88 Love, #89 The Team.

### Cap. 24 — The Team Sometimes Communicates Through Documents

**Ideia central.** O template mágico não existe. Documento serve a dois fins: **memória** e **comunicação**.

**O que aprender.** Comece com uma lista de ideias; anote cada pergunta que surgir; registre cada resposta e o porquê. As seções emergem.

**No nosso jogo.** Já existem: GDD (`docs/gdd-game-design-document.md`), Art Bible com pipeline PixelLab e contrato de arquivos (`docs/visual.md`), números (`docs/balancing.md`), log de decisões (`docs/decisions.md`) e `PLAN.md` como cronograma. Perguntas abertas ficam no GDD §22.

**Lens.** #90 Documentation.

### Cap. 25 — Good Games Are Created Through Playtesting

**Ideia central.** Playtest é um protótipo da experiência, feito para responder perguntas específicas.

**O que aprender.** Cinco perguntas: **Why** (lista de perguntas específicas — "é divertido?" não basta), **Who** (desenvolvedores, amigos, experts, tissue testers), **Where**, **What** (o que você sabe que procura + o que não sabe: investigue toda surpresa), **How** (olhe rostos, não a tela; registre eventos automaticamente; o briefing refinado vira o tutorial). Survey: escala de cinco pontos rotulada. Entrevista: peça "as três partes de que menos gostou".

**No nosso jogo.** Perguntas-tipo: há combo de Manhas quebrado (e explicável)? O blefe parece justo ou sorteado? Quem não conhece truco entendeu vira, manilha e ZAP? Onde entediou ou confundiu? A contagem demora? Instrumente com `scripts/sim.ts` e o bot: vitória por Estaca, mãos por mesa, onde as runs morrem, dinheiro sobrando, escolha e vitória por Manha; sem telemetria de jogador (D-31).

**Lens.** #91 Playtesting.

### Cap. 26 — The Team Builds a Game with Technology

**Ideia central.** Tecnologia é o meio do jogo e o elemento mais volátil do tetrad.

**O que aprender.** **Foundational** (torna possível uma experiência nova) × **decorational** (só deixa mais bonita uma existente). Corte tecnologia cara e meramente decorativa.

**Lenses.** #92 Technology, #93 The Crystal Ball.

---

## Parte VII — Negócio e propósito (Cap. 27–33)

### Cap. 27 — Your Game Will Probably Have a Client

Sugestão ruim resolve um problema não dito: pergunte **"que problema você está tentando resolver?"**. Três camadas de desejo: palavras, mente, coração. **Lens.** #94 The Client.

### Cap. 28 — The Designer Gives the Client a Pitch

Doze dicas de pitch; as centrais: protótipo funcionando, ponto de vista de quem ouve, uma frase-"handle" para o jogo, riscos com planos, ensaio. **Lens.** #95 The Pitch.

### Cap. 29 — The Designer and Client Want the Game to Make a Profit

Conheça o modelo de negócio e calcule o breakeven antes de prometer vendas. **Lens.** #96 Profit.

### Cap. 30 — Games Transform Their Players

Jogos ensinam fatos, resolução de problemas e sistemas de relações; permita falhar e quebrar o sistema com segurança. **Lens.** #97 Transformation.

### Cap. 31 — Designers Have Certain Responsibilities

Só o designer responde pelo que cria. **Lens.** #98 Responsibility.

### Cap. 32 — Each Designer has a Motivation

Escreva por que este jogo importa antes de se comprometer com um projeto longo. **Lenses.** #99 The Raven, #100 Your Secret Purpose.

### Cap. 33 — Goodbye

Despedida; sem conteúdo novo.

---

## Roteiro de aplicação neste projeto

1. **Visão** (Cap. 2, 5): toda feature passa pela experiência essencial (GDD 1.2), pelo tema boteco e pelos pilares P1–P5.
2. **Brinquedo** (Cap. 7): jogar carta e pedir TRUCO! gostosos sem meta; Manha nova testada em `scoreHand` antes da arte.
3. **Mecânicas** (Cap. 10): especifique pelas seis; decida quem sabe o quê (vira, mão, sinais, encoberta).
4. **Balanceamento** (Cap. 11): EV em Pontos; taxa de escolha e vitória por Manha no `sim.ts`; triangularidade na aposta; portão `bun run balance`.
5. **Chefes e salas** (Cap. 12, 19): chefe = puzzle de regra mostrada antes; um objeto-assinatura por sala.
6. **Interface** (Cap. 13): quatro passos de canais para a mesa; Fichas/Mult com cor + ícone; modos distintos; resposta em 0,1 s.
7. **Ritmo** (Cap. 9, 14, 16): curva fractal mão → mesa → Campeonato → run; loja como descanso; perfis de IA com collusion.
8. **Elenco** (Cap. 15, 18): story machine; funções → parceiros, rivais, chefes → traços nas 10 expressões.
9. **Playtest** (Cap. 25): lista de perguntas antes; bot e `sim.ts` como build instrumentada.

## Sinais de alerta

- Jogadores criam banimentos ou regras da casa → buraco de balanceamento (Lens #26).
- Jogadores ignoram uma moeda ou coletável → sem endogenous value (Lens #5).
- "O flagra nunca acontece" / "a Sortuda sempre tira manilha" → probabilidade percebida abaixo da real (Lens #28).
- "O que eu faço agora?" → objetivo não concreto ou não visível (Lens #25).
- Testadores se atrapalham sob pressão → problema de modo ou de canal (Lens #56).
- Ninguém reconta o que aconteceu numa run → story machine roteirizada demais (Lens #65).
- Todo mundo pula a Pequena ou compra sempre a mesma Manha → estratégia dominante (Lens #32).

## O que não foi capturado

- 1ª edição (2008); edições posteriores renumeram e adicionam lenses.
- Todas as figuras se perderam na extração (tetrad, flow channel, setas da interface, curvas de interesse, circumplex, hype cycle); foram reconstruídas pelo texto.
- Operadores matemáticos foram removidos na extração; fórmulas e valores foram restaurados pelo contexto.
- Faltam no PDF: Brainstorming Tips #1–#2 e o início da #3 (uma página do Cap. 6).
