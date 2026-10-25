# Pixel Logic — guia de estudo por capítulo

> Resumo didático de *Pixel Logic* (Michael Azzi, edição 2022, ~242 páginas) para agentes/LLMs que criam, geram ou revisam pixel art do **Zapatro** (roguelite de Truco Paulista numa mesa de boteco vista de cima: canvas lógico 640×360 com zoom inteiro, cartas 48×64, retratos 48×48 com 10 expressões, chefes 96×96, ícones 48×48 e 16×16, painéis de madeira nine-slice, telas refeitas a partir de mockups vetorizados com pixels2svg).
>
> - **Referência rápida** (tabelas de decisão, glossário completo, checklists): skill `pixel-logic` em `.claude/skills/pixel-logic/SKILL.md`.
> - **Este arquivo**: leitura sequencial — o que cada capítulo ensina, por quê, e como aplicar aqui.
> - Termos do autor ficam em inglês (jaggies, banding, sel-out…) para bater com a skill e com a literatura.
> - "(inferido)" = não está no livro; é dedução a partir das regras dele.
> - Limite: o resumo veio só do texto. Nenhuma figura do livro foi vista — ver "O que não foi capturado" no fim.
> - Onde o livro e a Art Bible (`docs/visual.md`) divergem, vale a Art Bible: sem anti-aliasing, alpha 0/255, sem dithering, luz de cima-esquerda, sombra dura de 1 px.

## Como um agente deve usar este guia

1. **Antes de criar um asset**: leia a seção do capítulo ligado à decisão (tamanho → Introdução e Cap. 4; contorno → Cap. 1; paleta → Cap. 3; legibilidade de carta, retrato e ícone → Cap. 4; perspectiva da mesa → Cap. 6; animação → Cap. 9).
2. **Ao escrever um prompt de geração**: declare tamanho do canvas, perspectiva, tipo de contorno e orçamento de cores. Sem isso o gerador decide por você — o oposto do princípio central do livro.
3. **Ao revisar**: rode as perguntas de "Verifique" do capítulo e nomeie o defeito com o termo do autor.
4. **Ordem de leitura sugerida para este projeto**: Introdução → 4 (Readability) → 3 (Colour) → 1 (Line art) → 7 (Clean Up) → 9 (Animation) → 5 (Dithering) → 6 → 2 → 8.

---

## Introdução — Getting started

**Ideia central.** Pixel art se define por intenção: cada pixel foi colocado ou aprovado por você. O autor chama de "escultura 2D": coloca-se uma base e depois se lapida.

**O que aprender:**

- **Total control.** Ferramentas mínimas: Pencil de 1 px, Eyedropper, Eraser, Bucket, Selection. Ferramentas automáticas (Line, Rotation, Recolour) podem ser usadas, mas o resultado é sempre corrigido à mão. Blur, pincéis macios e gradientes borrados ficam de fora.
- **Etapas.** Sketch → Line art → Block shapes → Shade → Clean up. Começar por linhas, por formas ou por um sketch grande reduzido são caminhos válidos.
- **Canvas primeiro.** O tamanho se decide no início. Uma boa referência é a resolução máxima de um console antigo; iniciantes ficam abaixo da tela do GBA (240x160). Tiles servem de régua para o tamanho dos sprites.
- **Proporção sprite/tela.** Sprite que ocupa ~4% da tela (Metroid II) é "grande" e atrapalha manobra; ~2,5% (Super Metroid) mostra mais cenário; ~0,33% (Cave Story) é minimalista e ainda legível.
- **Escala inteira.** Só 1x, 2x, 3x. Nunca 125% ou 150%.
- **Mixels.** Não misture tamanhos de pixel na mesma peça. Arte rotacionada conta como mixel.

**Erros comuns.** Aceitar saída de ferramenta sem corrigir; escala fracionária; misturar assets de densidades de pixel diferentes.

**No nosso jogo.** O canvas já está decidido: 640×360, zoom inteiro pela altura (2× em 720p, 3× em 1080p), e cada categoria tem tamanho fixo (Visual §2.1: carta 48×64, retrato 48×48, chefe 96×96, ícone 48×48, ícone de UI 16×16, troféu 32×32, fundo 640×360). Retrato desenhado a 2× ao lado de recorte de concept a 1× é mixel: redesenhe ou recorte do concept. Saída do PixelLab e mockup do ChatGPT são base bruta: confira tamanho exato, escala de pixel e alpha 0/255 e corrija à mão (inferido do princípio de total control).

**Verifique.** O canvas foi escolhido antes? Tudo está na mesma escala de pixel? Todo upscale é inteiro?

---

## Capítulo 1 — Line art

**Ideia central.** Linha existe em qualquer método — toda borda onde duas formas se encontram é uma linha. Linha lisa em pixel art depende de largura constante e "escadas" regulares.

**O que aprender:**

- **Largura consistente.** Quase sempre 1 px no sprite inteiro.
- **Jaggies.** Trechos serrilhados. Regra-chave: não cerque uma fileira de pixels com fileiras maiores.
- **Stairs (escadas).** Cada degrau de uma diagonal reta tem o mesmo número de pixels. Linha mais íngreme = degrau maior. Um degrau de 1 px no meio de degraus de 2 px é jaggy.
- **Curvas.** O comprimento dos degraus muda de forma progressiva (ex.: 4-3-2-1-1-2-3-4), sem vai-e-volta (inferido; a progressão exata está em figura).
- **Lapide, não redesenhe.** Trace de uma vez e depois tire/acrescente pixels.
- **Tipos de contorno** — a principal decisão de estilo:
  - *No outline*: formas sólidas; bom para fundos.
  - *Black inline*: contorno e linhas internas pretas; solução de 8 bits, hoje parece suja.
  - *Black contour*: preto só na borda externa; destaca sprite em movimento.
  - *Coloured outline*: cada parte contornada pelo tom mais escuro da própria cor.
  - *Shaded outline*: o contorno carrega luz e sombra; o mais comum, funciona em fundo claro ou escuro.
  - *Selective outline (sel-out)*: shaded outline com falhas/AA deliberados (detalhes no Cap. 8).

**Erros comuns.** Misturar escadas; cantos grossos acidentais; linhas internas pretas em sprite pequeno (separe formas por cor).

**No nosso jogo.** O PLAN §6 pede "outline seletivo" sem anti-aliasing: nos termos do livro, um coloured/shaded outline (o tom mais escuro de cada cor local), mais cheio nas faces claras das cartas, porque sel-out fica serrilhado em fundo claro. Um tipo de contorno para todas as cartas, um para retratos e ícones; sem black inline. A moldura da carta e o índice de canto (número + naipe) precisam de escadas regulares: são as linhas que o jogador mais vê.

**Verifique.** Largura consistente? Cada diagonal usa um só comprimento de degrau? Curvas sem reversão? Mesmo tipo de contorno em todos os assets?

---

## Capítulo 2 — Anti-Aliasing

**Ideia central.** AA são pixels de cor intermediária nos cantos de uma linha para fazer a ponte entre duas cores. É opcional e controlado. O pior AA é o que só espelha a borda que tenta suavizar.

**O que aprender:**

- **Quando usar.** Clareza (rosto, olhos), curvas pequenas, alto contraste entre duas cores, peso de linha, tipografia.
- **Quando não usar.** Baixo contraste, estilo simples ou deliberadamente nítido, sprite que já lê bem em 1x.
- **Quanto.** O trecho de AA tem cerca de metade do comprimento do degrau suavizado. Pouco é melhor que muito.
- **Quantos tons.** 1 para praticar, 2 para suavizar mais, 3 só com cores sobrando.
- **Dentro, não fora.** AA funciona dentro do sprite. AA claro no contorno externo aparece em fundo claro — mantenha o contorno sólido, salvo fundo garantidamente escuro.
- **Peso de linha.** Escuro = mais grosso, claro = mais fino, mesmo com 1 px.

**Erros comuns:**

- **Banding**: duas fileiras de mesmo comprimento coladas. Gera curva blocada, linha mais grossa que o planejado e, quando acompanha o contorno, **pillow shading**. Correção: tirar ou pôr um ou dois pixels, ou escurecer o AA.
- **Parallel banding**: várias faixas empilhadas; mova pixels até as fileiras pararem de alinhar.
- **Excesso de AA**: borra e vira "arte vetorial".
- Julgar com zoom: banding aparece em 1x e 2x.

**No nosso jogo.** **Sem anti-aliasing**, nem interno (Visual V5, "pixel honesto": alpha 0/255, sem gradiente suave). Este capítulo serve para entender por que um degrau irregular lê mal; a correção aqui é escada consistente e clusters limpos (Cap. 1 e 7), não tons intermediários. Banding e pillow shading continuam proibidos mesmo sem AA.

**Verifique.** Máximo de 1–2 tons de AA? Nenhuma fileira de AA com o mesmo comprimento da vizinha? Contorno externo sem AA claro?

---

## Capítulo 3 — Colour

**Ideia central.** Monte paletas pequenas e reutilizáveis, feitas de rampas que mudam matiz e saturação além do valor. Cor define clima, estilo e é a primeira ferramenta de legibilidade.

**O que aprender:**

- **Colour ramps.** Tons ordenados de uma cor. Rampas que compartilham cores reduzem a contagem e criam harmonia.
- **Hue shifting.** Luzes puxam para amarelo (matiz mais claro), sombras para roxo (mais escuro). Sombra só mais escura, sem mudar matiz, fica sem vida.
- **Saturação.** Use para destacar uma zona do sombreamento.
- **Black tones.** Evite preto puro; use marrom, roxo, verde ou cinza bem escuros.
- **Tamanho da rampa.** Sprite pequeno: 2–3 cores por rampa bastam. Dois tons parecidos são indistinguíveis.
- **Contraste.** Legibilidade é a prioridade nº 1. Cada personagem: 1 cor principal + 1 subcor contrastante. Separe detalhes por cor, não por linha preta.
- **Orçamento.** Transparência conta como 1 cor; ~16 cores é o limite usual por sprite. O livro mostra uma redução 24 → 20 → 15 → 10 fundindo tons, trocando cinzas por tons de pele e removendo AA invisível.
- **Paleta de cena.** Reutilize cores entre objetos, mas objetos da mesma cor não podem se tocar.
- **Por que paleta pequena.** Menos tons = animação mais fácil e sem cores "piscando" entre frames.

**Erros comuns.** Sombrear só por valor; preto puro em tudo; tons quase idênticos; mesma cor em objetos que se tocam; confiar no brilho de um único monitor.

**No nosso jogo.** Paleta-mestra quente de 48–64 cores (`art-src/palette/master.hex`: madeira, fórmica verde/vermelha, azulejo azul, amarelo de fluorescente), tokens em `src/config/palette.ts`, e uma paleta reduzida por tela de concept (128 cores nas mesas e no menu, 256 na loja, Configurações e baralho). Hue shift: luzes para o amarelo da lâmpada, sombras para o marrom-arroxeado; escuros tingidos (o naipe preto é `#1c1a1f`, não preto puro). Matizes reservados não mudam de papel: azul = Fichas, vermelho = Mult/TRUCO!, dourado = foco/manilha/dinheiro, roxo = Fama/coringa/lendária. Variantes de um mesmo asset trocam uma rampa e mantêm o resto (modo 4 cores dos naipes, versos de baralho, as 10 expressões de um personagem dividindo a paleta; inferido — o livro não trata de palette swap).

**Verifique.** Há 1 cor principal + 1 subcor? As rampas mudam matiz e saturação? Toda cor se distingue em 1x? Está dentro do orçamento?

---

## Capítulo 4 — Readability

**Ideia central.** Legibilidade é quão fácil alguém entende o que você desenhou. Sprite pequeno não tem detalhe: traço reconhecível, silhueta, cor e espaçamento carregam tudo.

**O que aprender:**

- **Como escolher o tamanho.** Ache a menor parte que precisa ser visível (boca animada, mãos, expressão, a gema de uma espada) e derive o tamanho mínimo dela.
- **Tamanho × custo.** Sprite menor anima mais rápido, fica mais fluido e troca de roupa com menos trabalho; perde detalhe.
- **Formas simples.** Em 16x16, uma linha de 2 px transforma uma "caixa qualquer" em Game Boy. ~6x6 px de olhos e cabelo distinguem um elenco inteiro.
- **Silhueta.** Deve mostrar cabeça, membros, tecido e a ação. Onde partes se sobrepõem, separe por contraste de cor.
- **Olhos.** Foco principal. Se ficariam com menos de 1 px, omita e sugira a área com sombra.
- **Mãos.** Pinte formas, não linhas; comece por "luva"; indicador e polegar definem a mão.
- **Proporções seguem a função.** Sprite de mapa, sprite de batalha, ícone e retrato são desenhos diferentes do mesmo design. Cabeça grande dá espaço para expressão.
- **Spacing.** Partes que se tocam ficam ilegíveis, como letras coladas. Uma faixa de 2 px basta para destacar.
- **Tangents.** Evite que bordas de partes diferentes se encontrem.
- **Sprite sobre fundo.** Contorno no sprite, cores de fundo mais suaves, primeiro plano nítido e fundo mais "pintado".
- **Testes.** Preview permanente em 1x; teste do blur (se borrado fica ruim, corrija os pixels); teste cego (alguém leigo diz o que vê).

**Erros comuns.** Espremer detalhe de concept art em sprite minúsculo; inlines em áreas apertadas; cores locais enganosas; dithering em sprite pequeno ("praticamente inútil").

**No nosso jogo.** Capítulo mais importante para o Zapatro (pilar V1, "legível antes de bonito"). Na carta, o menor traço que precisa ler é número + naipe no canto, a 1×, num celular 20:9; o miolo (naipe grande ou figura de boteco do J/Q/K) é secundário. Naipe se distingue primeiro pela forma, depois pela cor; espaço de 1–2 px entre índice, naipe e moldura, sem tangentes; overlay de modificador nunca cobre número nem naipe. No retrato 48×48, cada personagem precisa de um traço legível (chapéu, óculos, bigode, lenço, boné) e os rostos de sinal precisam ser reconhecíveis sem legenda; os olhos são o foco. Ícones: 1 cor principal + 1 subcor, silhueta clara, sem texto embutido. Manilha, ZAP e coringa são as únicas coisas que brilham na mesa.

**Verifique.** Um leigo identifica o sprite e a ação em 1x? A silhueta identifica o personagem, o naipe ou o ícone? Nenhuma parte se toca ou forma tangente? Destaca do fundo real?

---

## Capítulo 5 — Dithering

**Ideia central.** Dithering mistura cores limitadas por padrões para fingir gradiente. Precisa de espaço e adiciona granulação. Menos é mais.

**O que aprender:**

- **Quando.** Gradientes que pediriam cores demais, coisas que não animam, texturas, limite extremo de cores, fundos (céu, espaço, áreas planas grandes). Sombreie primeiro com formas limpas.
- **Cel shading.** Melhor para sprites pequenos, tilesets, legibilidade e animação.
- **Checkered dithering.** Cada nível de brilho entre dois tons tem seu padrão. Nunca crie "wide pixel" (dois pixels da mesma cor encostados).
- **Tiles.** Tiles têm dimensões pares; tile de dither espelhado gera pixels duplos na emenda. Use 2 tiles ligeiramente diferentes.
- **Contraste.** Só entre cores de baixo contraste.
- **Outros padrões.** Dents (uma fileira, textura em pouco espaço), intertwined, stylised (padrões próprios, sem granulação), random (não recomendado sem correção manual).
- **Textura ≠ gradiente.** Gradiente vai do claro ao escuro; textura é sensação de material.

**Erros comuns.** Animar dithering (treme); dither em sprite pequeno; dither de alto contraste; pixels soltos lidos como ruído.

**No nosso jogo.** Sem dithering em cartas, retratos, ícones, UI e qualquer coisa animada. A redução de paleta do concept e do PixelLab é feita sem dithering (MEDIANCUT). Textura de madeira, fórmica ou azulejo vem de clusters estilizados ou dents, nunca de gradiente; fundos de sala 640×360 seguem a mesma regra (sem gradiente suave).

**Verifique.** O dither está só em asset estático e grande? As duas cores têm baixo contraste? Sem pixels duplos nas emendas? Um tom chapado resolveria?

---

## Capítulo 6 — Game Perspectives

**Ideia central.** A maioria das vistas 2D são projeções ortográficas pseudo-3D, sem ponto de fuga. Escolha a projeção que serve à jogabilidade — o jogador a vê o jogo inteiro.

**O que aprender:**

- **Sete projeções.** Multiview: side view, top-down, top. Paraline: isometric, 45° dimetric, oblique. Mais a perspectiva real (ilustração, cutscene).
- **Isométrica.** Linha real de 30° é impossível em pixels: use **escada de 2 pixels** (2 na horizontal, 1 na vertical — tecnicamente 26,5°). O grid é em losango. Referência do autor: Final Fantasy Tactics Advance.
- **Duas construções de losango.** (a) Linhas se conectam limpas, mas os losangos não alinham em grid quadrado — arte livre. (b) Losangos alinham perfeitamente — certo para tileset, mas os cruzamentos de linha viram pixels duplos grosseiros.
- **Lineless diamonds.** Para (b), desenhe cada losango como forma preenchida sem linha, como tabuleiro de xadrez. Um losango ocupa 2 tiles quadrados; os vizinhos, 4.
- **Sempre use grid.** Fundo isométrico livre é difícil de virar mapa jogável; tudo desenhado precisa suportar colisão.
- **Primitivas.** Cubo; cilindro → toco/barril; pirâmide → telhado/tenda; cone → árvore/torre; esfera → cogumelo/tigela.
- **Converter sprite lateral.** Reduza o comprimento para ~87% (cos 30°), incline 0,5 na direção para onde o sprite olha, mova partes para dar profundidade, limpe e preencha.
- **Terreno.** Campos planos com alturas em degraus (plataformas cúbicas, torres, platôs): mais fácil de desenhar e programar. Rampas são raras; em FFTA2 aparecem só em 4 direções, porque a jogabilidade tem 4.
- **45° dimetric.** Escada 1x1; útil quando estruturas altas esconderiam a jogabilidade.
- **Finja pela clareza.** Vista "verdadeira" de cima mostra só o topo das cabeças; incline os sprites para o rosto aparecer.

**Erros comuns.** Misturar projeções; losangos alinhados desenhados com linha; arte isométrica sem grid; inclinar contra a direção do olhar.

**No nosso jogo.** Não há grid isométrico: a mesa é vista de cima, com os quatro assentos em cruz e as cartas deitadas na fórmica; os personagens são "fingidos" para a câmera para o rosto aparecer (fake it for clarity). O leque da mão inclina as cartas ±6° (`tilted()` desenha a partir da arte reta): confira a 1× se a rotação não criou mixels nem quebrou as escadas da moldura. Objetos de cenário (copo americano, engradado, TV de tubo) seguem a projeção do concept da sala; compare lado a lado.

**Verifique.** As cartas inclinadas do leque mantêm escadas limpas, sem mixels? Props e personagens seguem a projeção do concept da sala? Os rostos aparecem na câmera de cima?

---

## Capítulo 7 — Clean Up

**Ideia central.** Clean-up é todo acabamento e melhoria — em qualquer etapa, mas principalmente no fim, depois de feedback. Todas as técnicas anteriores se encontram aqui.

**O que aprender:**

- **Dois caminhos.** Shape → Refine → Finish (blobs de cor; melhor para in-betweens) ou Lines → Colours → Finish.
- **Aspectos a ajustar.** Silhouette, Design, Colours, Pixel Shapes, Lighting, Readability. O autor avisa que não é checklist ordenado.
- **Clusters.** Pixels da mesma cor se agrupam em formas. Trate cada cluster como peça de mosaico: forma limpa lê melhor.
- **Lazy lines.** Linhas ou formas que não descrevem nada — remova ou dê função.
- **Selection tool.** Mova e reproporcione em vez de redesenhar. Proporção e perspectiva podem ser corrigidas no fim.
- **Escalar/rotacionar.** O resultado é uma base em "mosaico": redesenhe os traços importantes.
- **Nitidez.** Mais luz e sombra e menos linha; realces; linhas mais escuras para destacar. Sem filtros.
- **Ordem dentro do sprite.** Flat colours → Shading → Details, área por área. Termine uma área cedo para travar estilo e luz.
- **Várias versões.** Na dúvida, faça variantes e compare depois de uma pausa.

**Erros comuns.** Textura ruidosa de pixels espalhados; pixels soltos; sombreamento que ignora a fonte de luz; rotação/escala sem redesenho.

**No nosso jogo.** Etapa obrigatória para toda saída do PixelLab e todo recorte de concept (skill `svg-concept-art`: mockup → 640×360 → paleta da tela → pixels2svg → recorte). Ordem sugerida (inferida): tamanho exato e alpha 0/255 → silhueta e proporção → fidelidade ao personagem/carta âncora → cores dentro da paleta e matizes reservados → clusters e pixels soltos na borda da máscara → luz de cima-esquerda e sombra dura de 1 px → jaggies e banding → nitidez → testes a 1× (`bun scripts/shot.ts` em 1280×720), blur e teste cego. Fecha com o checklist do Visual §14 e `bun scripts/assets-validate.ts`.

**Verifique.** Todo cluster é deliberado? Fonte de luz consistente, contorno incluso? Partes escaladas/rotacionadas foram redesenhadas? Bate com os assets vizinhos?

---

## Capítulo 8 — Sub-Pixeling

**Ideia central.** Sub-pixeling finge espessura ou movimento menor que 1 pixel deslocando valor e cor para os pixels vizinhos. Em imagem parada é AA e peso de linha; em animação é AA deslizando entre frames duplicados.

**O que aprender:**

- **Quando.** Ease in/out, idles, dar vida a partes paradas, canvas de 32x32 ou menos, vento, riso, tremor.
- **Modelo mental.** Pixels são copos d'água: despejar parte no copo vizinho move o pixel uma fração de passo.
- **Reutilize cores.** Tom intermediário já existente no sprite; ideal 1–2 tons de AA.
- **Nem todo pixel.** Uns deslocam, outros andam 1 px inteiro, outros ficam parados. Deslocar tudo cria banding.
- **Direção.** O sub-pixel segue o ângulo da borda, não o do movimento.
- **Método.** Duplique um frame, edite pouco, alterne. Defina os extremos primeiro; sub-pixel só nos in-betweens.
- **Proteja o rosto.** Desloque peito e ombros 0,5 px e segure a cabeça.
- **Popping.** Quando uma curva ganha ou perde fileira, que sejam 2–3 pixels, nunca 1.
- **Sel-out.** Só em camada com fundo transparente; melhor em fundo escuro, serrilhado em fundo claro.

**Erros comuns.** Exagerar (efeito gelatina); deslocar todos os pixels; AA claro no contorno; sel-out em fundo claro.

**No nosso jogo.** Uso raro: sub-pixel é AA em movimento, e o Zapatro não usa AA. Movimento em pixels inteiros (Visual §7.3). Se um retrato ou chefe ganhar idle, use 2 extremos a 1 px movendo ombros e roupa, nunca o rosto; a troca de expressão é troca de quadro inteiro, não in-between.

**Verifique.** Sub-pixel só em in-betweens e idles sutis? Cores vêm da paleta existente? Rosto e olhos estáveis?

---

## Capítulo 9 — Animation

**Ideia central.** Animação depende de key frames legíveis com silhueta forte. Mais in-betweens não consertam keys fracos. Em jogo, precisa ser gostosa de jogar, não só bonita.

**O que aprender:**

- **Timing.** On one's / two's / three's = cada desenho dura 1 / 2 / 3 frames.
- **Squash and stretch.** Mostra peso; conserve o volume.
- **Anticipation.** O "preparar" antes da ação. Curta ou ausente em ações disparadas pelo jogador; completa em animações cosméticas.
- **Breakdown.** Key intermediário que curva a trajetória (A → X → B).
- **Ease in/out.** In-betweens favorecem o key. Abaixo de 1 px de espaçamento, duplique o key e use sub-pixel.
- **Smears.** In-between que imita motion blur; um frame (~0,05 s), sentido e não visto.
- **Overshoot.** Passa do destino e volta; até 1 px se sente.
- **Overlapping action / follow-through.** Partes arrastam atrás da líder e assentam depois.
- **Quatro métodos.** Silhouette animation; recycling drawings (copiar, mover, rotacionar, limpar — mantém o modelo consistente); partir do tradicional; line art frame a frame (o mais lento). Combine silhueta + reciclagem.
- **Poucos frames.** 2 frames só piscam; loop convincente pede **3 no mínimo**, ou 4 com um reutilizado.
- **Line boiling.** Tremor de linhas redesenhadas; corrija deslizando partes ou usando menos frames.

**Tabela de tempo (60 FPS):**

| Desenhos/s | Frames por desenho | Equivale a |
| --- | --- | --- |
| 30 | 2 | two's em 60 |
| 20 | 3 | three's em 60 |
| 15 | 4 | four's em 60 |
| 12 | 5 | two's em 24 |
| 10 | 6 | three's em 30 |
| 8 | 7–8 | three's em 24 |

**Erros comuns.** Keys parecidos demais; partes deslizando sem redesenho (robótico); anticipation longa em ação do jogador; smear segurado demais; tons demais (cores piscam).

**No nosso jogo.** Quase todo movimento é tween em código (`TABLE_TIMING`: distribuir 90 ms, jogar 220 ms, recolher 260 ms a 1×), então os quadros desenhados são poucos: carta na mesa = squash de 2 frames, TRUCO! = zoom punch + tremor ≤ 2 px, números da contagem tremem proporcionalmente. Ação do jogador sem anticipation longa; overshoot de 1 px na carta que bate na mesa se sente; a 4× tudo continua legível. Loops de VFX (pulso dourado da manilha, faíscas do ZAP) com 3–4 frames, partículas de 1–2 px na paleta da tela.

**Verifique.** Cada key lê como silhueta? Todo loop tem ao menos 3 frames distintos? In-betweens favorecem os keys? Sem boil nem cor piscando em partes paradas?

---

## Fluxo de trabalho consolidado

**Sprite:**

1. Decida canvas, proporção sprite/tela, perspectiva e tipo de contorno; identifique o menor traço que precisa ler.
2. Esboce em pixels, ou desenhe grande e reduza.
3. Estabeleça e teste a silhueta.
4. Bloqueie formas de cor chapada; defina a fonte de luz.
5. Monte a paleta: cor principal e subcor, escuros tingidos, rampas com hue shift e cores compartilhadas.
6. Detalhe uma área para travar estilo; depois área por área: Flat → Shading → Details.
7. Construa o contorno; elimine jaggies, iguale escadas.
8. Sombreie em clusters limpos; remova banding e pillow shading.
9. AA só onde compensa, 1–2 tons, dentro do sprite.
10. Corrija espaçamento, tangentes, proporção e perspectiva.
11. Ajuste contraste; corte tons redundantes.
12. Teste em 1x, com blur, sobre o fundo real e com um leigo.

**Animação:**

1. Estude referência; ache os extremos.
2. Planeje parte líder, arcos, orçamento de frames e timing.
3. Esboce keys como silhuetas; cada um lê sozinho.
4. Adicione anticipation (curta em gameplay), breakdown e overshoot.
5. In-betweens por reciclagem: duplique o frame mais próximo e transforme partes.
6. Ease favorecendo keys; abaixo de 1 px, sub-pixel.
7. Arrasto e assentamento em cabelo, capa, arma.
8. Um smear de 1 frame no movimento mais rápido.
9. Limpe todo frame; mantenha clusters e paleta; proteja o rosto.
10. Reproduza em 1x e velocidade real.

## Regras que mais importam para este projeto

1. Número + naipe leem a 1× num celular; naipe por forma antes da cor; nada cobre o índice da carta.
2. Retrato: um traço legível a 48 px; as 10 expressões dividem a paleta; sinais reconhecíveis sem legenda.
3. Sem anti-aliasing, alpha 0/255, sem gradiente suave; contorno consistente por categoria, mais cheio nas cartas claras.
4. Paleta-mestra quente com hue shift; paleta reduzida por tela; matizes reservados (Fichas azul, Mult vermelho) só no seu papel.
5. Sem dithering; sem mixels (cuidado com retrato 2× e carta inclinada); tamanhos fixos do Visual §2.1; escala sempre inteira.
6. Luz de cima-esquerda, sombra dura de 1 px; só manilha, ZAP e coringa brilham.
7. Saída do PixelLab e recorte de concept são rascunho: clean-up manual e checklist do Visual §14 sempre.

## O que não foi capturado

- **Figuras**: diagramas de AA, antes/depois de banding, padrões de dither, passos de construção isométrica (círculo em plano, ponta de cone/pirâmide, os dois grids de losango), diagrama do 87%, gráficos de timing de sub-pixel. Para essas técnicas, consulte as páginas do PDF.
- **Fora do escopo do livro**: autoria de tileset e formatos de arquivo, arte de UI (painéis nine-slice, botões), layout de carta e os tamanhos fixos do Zapatro; para isso vale `docs/visual.md`.
