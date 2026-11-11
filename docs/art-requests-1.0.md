# Pedidos de arte para a 1.0 (D-83, R7.0)

Lista de todas as pinturas e ícones que faltam para a 1.0 comercial (Steam e Google Play), com arquivo de origem e destino, tamanho, enquadramento, prompt e o que não pode aparecer. Levantada em 2026-11-11 a partir do código, dos dados e das imagens em `art-src/gta/` (as 42 fontes foram abertas; as pinturas citadas foram ampliadas nos pontos descritos e as de menu sem uso foram vistas só em miniatura).

Cobre os itens R6.1, R6.2, R6.8, R7.4 e R12.1 do [ROADMAP.md](../ROADMAP.md) e as pendências de arte do [PLAN.md §1.4.4](../PLAN.md#144-pendências-para-a-10). A regra de estilo é a [Art Bible v3](visual.md) (§0, mais a lista "Proibido" da §1 e o checklist da §10).

## 1. Como funciona

| Quem | Faz |
|---|---|
| Agente | Mantém esta lista e os prompts; integra os arquivos aprovados (passos na §12) |
| Dev | Gera cada imagem na ferramenta dele, aprova, e salva a fonte em `art-src/gta/` com o nome exato da coluna "Origem" |

- **Fontes:** `art-src/gta/` (versionado). Nada de `references/` (ignorado pelo git).
- **Comando que transforma fonte em asset do jogo:** `bun scripts/portraits.ts` (local, sem rede). Gera `public/assets/gfx/{card,portrait,bg,back}/*.webp` e `public/assets/gfx/index.json`. Ícones: `bun scripts/icons.ts`.
- **Status de cada linha:** `pedido` → `gerado` → `aprovado` → `integrado`. O dev muda para `gerado` e `aprovado`; o agente muda para `integrado`.
- **Prioridade:** `loja` = bloqueia a aprovação nas lojas; `festival` = precisa estar na demo do Next Fest, até 2027-01-10 (M4); `1.0` = até 2027-03-16.

### 1.1 Regras para todo prompt

1. Todo prompt começa com o bloco STYLE da §2 (onde o prompt diz `[STYLE]`, cole o parágrafo inteiro).
2. **Sem texto, letras, números, placas escritas, logos, marcas reais, escudos de times, instituições reais, monumentos reais e pessoas reais.** Rótulo de garrafa, placa e lousa ficam em branco ou só com desenho. Todo texto do jogo vem do i18n (EN e PT-BR).
3. **Sem iconografia de cassino** (caça-níquel, roleta, fichas de cassino) e **sem cigarro ou charuto aceso** nas pinturas novas ([visual.md](visual.md) §1 "Proibido" e §10). As pinturas antigas que têm isso estão no grupo C.
4. Cartas na mão dos personagens aparecem **de costas** (verso vermelho liso com ornamento simples): geradores de imagem erram naipes e índices, e as cartas reais do jogo são desenhadas por código.
5. Luz e paleta sempre as do bloco STYLE: pôr do sol laranja → rosa → roxo, mar turquesa, luz quente de contorno. Personagem pode ter céu azul de fim de tarde (como `char-ze`, `char-chico` e `char-nino` hoje).
6. Se a ferramenta aceitar imagem de referência, anexe a pintura atual citada em "Origem" (regeneração) ou a pintura do mesmo personagem (consistência). Se aceitar inpainting, prefira a instrução de inpainting: ela preserva composição, paleta e enquadramento sem sorteio.
7. Entregue no formato e no tamanho da coluna "Proporção e tamanho". Maior pode; menor não. A extensão do arquivo faz parte do contrato (o script lê `char-<nome>.jpeg` literalmente).

### 1.2 Tamanhos que o pipeline espera

Tirados de `scripts/portraits.ts`, `scripts/icons.ts` e das fontes atuais.

| Tipo | Fonte (como as atuais) | O que o script faz | Saída |
|---|---|---|---|
| Card de personagem | `char-<nome>.jpeg`, 1024×1536 (2:3) | Recorta a janela x 100–924, y 115–1215 (824×1100, 3:4); a borda e a faixa do nome ficam de fora | `card/<id>.webp` 480×640 |
| Busto | o mesmo arquivo | Quadrado do topo da janela: x 100–924, y 115–939 (824×824) | `portrait/<id>.webp` 256×256 |
| Fundo de tela | `background-N.png` ou `shop.jpeg`, 1672×941 (16:9) | Redimensiona cobrindo 1920×1080 | `bg/<nome>.webp` 1920×1080 |
| Verso e face especial | `card-<nome>.png`, 1024×1536 (2:3) | Reduz inteiro para 288×432 e arredonda os cantos (raio 16) | `back/<nome>.webp` 288×432 |
| Ícone de UI | folha em grade sobre cinza neutro | Corta cada célula, apaga o cinza a partir das bordas, encaixa em quadrado | `icon/<nome>.png` 32×32 |

Consequência para os personagens: **rosto, ombros e o gesto principal ficam dentro de x 100–924, y 115–939** da imagem 1024×1536 (é o busto usado na mesa); o corpo pode descer até y 1215. O que ficar abaixo de y 1215 e nas margens é descartado, então a faixa do nome é opcional.

## 2. Bloco STYLE (colar no início de todo prompt)

Descrito a partir das pinturas reais (`char-nino`, `char-agiota`, `char-ze`, `background-2`, `background-6`, `shop.jpeg`, `card-1` e os ícones de `public/assets/gfx/icon/`).

```text
STYLE: stylized digital painting in the look of modern open-world crime-game key art: bold clean dark contour lines, cel-shaded forms finished with painterly gradients and fine hatching, crisp detail, slightly exaggerated expressive anatomy; not photorealistic, not a 3D render, not pixel art. Tropical Brazilian beach-bar summer at golden hour: low warm sun with a strong orange rim light, sky fading from orange to pink to violet with large soft clouds, turquoise sea, coconut palms, red hibiscus, weathered painted wood, warm filament bulbs. Saturated but harmonious palette: sunset orange, hot pink, violet, turquoise, palm green, cream and gold accents, deep warm brown shadows (no pure black, no grey haze). Warm, friendly, mischievous mood. Absolutely no text, letters, numbers, signage, logos, watermarks, signatures, real brands, sports crests, real landmarks, real institutions or real people; every label, sign and board is blank or purely pictorial. No casino machines, no casino chips, no lit cigarettes or cigars.
```

Complementos, colados logo depois do STYLE quando o prompt pedir:

```text
CARD ADD-ON: vintage playing-card print: cream paper with rounded corners, thin double-line frame, flat screen-print colours with a fine grain, the whole card visible and centred with nothing cropped.
```

```text
ICON ADD-ON: game item icon: one single object, three-quarter front view, thick dark outline, two or three colour families plus one warm highlight, chunky simple silhouette that still reads at 20 pixels, no scenery, no cast shadow, no glow or particles outside the object.
```

## 3. Grupo A — marcas e nomes reais (bloqueio de loja)

Os quatro primeiros são os da pendência do PLAN §1.4.4. A-05 e A-06 são achados novos desta revisão.

| ID | O que é | Origem → destino | Proporção e tamanho | Enquadramento | Prompt | Não pode aparecer | Prioridade | Status |
|---|---|---|---|---|---|---|---|---|
| A-01 | Camisa do Nino (companheiro `nino`) | `art-src/gta/char-nino.jpeg` → `card/nino.webp`, `portrait/nino.webp` | 2:3, 1024×1536, `.jpeg` | Igual ao atual: meio corpo, joinha em primeiro plano, leque de cartas na outra mão | Em A-01 abaixo | Camisa amarela com gola verde, escudo, estrelas, número; pingente com "10"; pichação com letras; estátua no morro | `loja` | `pedido` |
| A-02 | Fundo de mesa `bg6` | `art-src/gta/background-6.png` → `bg/bg6.webp` | 16:9, 1672×941 ou maior, `.png` | Igual ao atual: bar à esquerda, janelão à direita, mesa em primeiro plano | Em A-02 abaixo | Letreiro "Las Vegas", torre tipo Eiffel, globo-balão, roda-gigante, fontes dançantes, caça-níqueis, fichas | `loja` | `pedido` |
| A-03 | Fundo de loja alternativo | `art-src/gta/shop2.jpeg` → nenhum (não entra no build) | 16:9, 1600×900, `.jpeg` | Igual ao atual | Em A-03 abaixo | "BRAHMA", "51", rótulos legíveis, lousas e flâmula com frases, foto de pessoa | `1.0` (vira `loja` se a imagem for usada) | `pedido` |
| A-04 | Face do coringa | `art-src/gta/card-joker.png` → `back/joker.webp` | 2:3, 1024×1536, `.png` | Carta inteira, figura espelhada em cima e embaixo | Em A-04 abaixo | A palavra "JOKER" (duas vezes) ou qualquer outra palavra | `loja` | `pedido` |
| A-05 | Bolsa da Sheila (companheira `sheila`) | `art-src/gta/char-shiela.jpeg` (o arquivo tem esse nome) → `card/sheila.webp`, `portrait/sheila.webp` | 2:3, 1024×1536, `.jpeg` | Igual ao atual | Em A-05 abaixo | Estampa de monograma na bolsa (lê-se como a lona de uma grife francesa real: iniciais entrelaçadas e flores de quatro pétalas em dourado sobre marrom) | `loja` | `pedido` |
| A-06 | Placa e distintivo do Delegado (chefe `tony`) | `art-src/gta/char-tony.jpeg` → `card/tony.webp`, `portrait/tony.webp` | 2:3, 1024×1536, `.jpeg` | Igual ao atual | Em A-06 abaixo | "POLÍCIA CIVIL" na fachada e no distintivo, brasão no distintivo | `loja` | `pedido` |

### A-01 — Nino

O que se vê hoje: camisa amarela com gola e punhos verdes, "10" verde no peito, escudo azul, verde e amarelo com cinco estrelas verdes em cima (lê-se como camisa de seleção nacional). Também: pingente dourado com "10", pichação "VIDA LOKA" com coroa no muro à esquerda e uma estátua de braços abertos no topo do morro à direita (monumento real). O desenho de reserva do Nino em `src/art/flat.ts` já usa camisa azul e boné amarelo, por isso a troca é para azul.

Inpainting (preferido):

```text
Inpaint on char-nino.jpeg and keep everything outside the masks pixel-identical.
Mask 1, the whole shirt (torso and both sleeves, including the crest, the stars and the big number): a plain royal-blue football-style shirt with a white collar and white sleeve cuffs, completely blank front, same folds, same lighting.
Mask 2, the gold pendant: a small plain gold football, no digits.
Mask 3, the wall on the left: the same brick wall with abstract colourful paint splashes, no letters, no crown.
Mask 4, the statue on the hilltop at top right: bare hilltop with trees and sky.
```

Regeneração completa:

```text
[STYLE] Character card, vertical 2:3, 1024×1536, half-body portrait, slightly low camera angle.
Subject: Nino, a cocky young Brazilian street footballer in his early twenties: light-brown skin, curly dark hair under a black cap worn backwards, thin moustache and goatee, small gold hoop earrings, a confident smirk with one eyebrow raised. He leans back in a chair; his right hand gives a big thumbs-up toward the viewer, large in the foreground; his left hand holds a fan of four playing cards seen from the back (plain red backs with a simple ornament). Tattoo sleeve on the right forearm, black shorts.
Clothing: a plain royal-blue football-style shirt with a white collar and white sleeve cuffs, completely blank front and sleeves. Two gold chains; the pendant is a small plain gold football.
Foreground bottom left: an amber beer bottle with no label and a small glass of beer on a wooden table.
Background: a sunlit brick wall with abstract colourful paint splashes on the left, palm fronds at the top, a hillside of small colourful houses on the right under a blue late-afternoon sky with warm clouds; the hilltop has only trees and a water tank.
Keep the face, the thumbs-up and the shoulders in the upper 60% of the image and away from the side edges.
```

### A-02 — Fundo `bg6`

O que se vê hoje: salão de cassino à noite. Na vista do janelão: letreiro de neon "Las Vegas" (borda direita), torre treliçada tipo Eiffel com um globo-balão azul ao lado (o conjunto de um hotel real), roda-gigante, fontes dançantes. No salão: fileiras de caça-níqueis, mesa de jogo com fichas em primeiro plano.

Regeneração (recomendada, porque caça-níquel e ficha também saem):

```text
[STYLE] Wide background, 16:9, 1920×1080 or larger, no people, eye-level interior view.
Scene: the card lounge of an old seaside hotel in a Brazilian beach town at dusk. Left third: a long polished wooden bar with warmly back-lit shelves of unlabeled bottles and a row of five red velvet bar stools, potted palms and a brass planter beside it. Ceiling: curved golden coves and one crystal chandelier at top centre-right. Floor: glossy dark marble with warm reflections and a patterned red carpet under the tables. Centre and right: floor-to-ceiling windows onto a tropical bay at blue hour: palm silhouettes, a curved beach with small lights, a few plain modern hotel towers with lit windows, sailboats on a violet-turquoise sea, the last orange-pink glow on the horizon. Mid right: a round wooden card table with green felt, red velvet chairs and two small brass table lamps. Bottom foreground: the curved padded edge of a green felt card table with a neat deck of red-backed cards, two face-down cards, a short glass with ice and a small brass dish; the back of a red velvet armchair at bottom right.
Palette: deep red velvet, gold and amber lamp light against violet-blue dusk, hot-pink and turquoise accents.
Keep the central area calm and mid-dark: game UI is drawn over it and the image is darkened in game.
```

Inpainting mínimo (só o que trava loja), em pixels da fonte 1672×941, aproximados:

```text
Inpaint on background-6.png and keep everything outside the masks pixel-identical.
Mask 1, neon sign at the right edge (about x 1550-1672, y 295-390): dark glass and palm fronds.
Mask 2, lattice tower (about x 1315-1445, y 45-365) and the blue balloon globe beside it (about x 1435-1530, y 240-350): two plain hotel towers with lit windows and night sky.
Mask 3, ferris wheel (about x 960-1015, y 185-300): night sky and a distant building.
Mask 4, lit fountains (about x 980-1200, y 300-405): calm dark water with reflections.
Optional mask 5, every slot machine: potted palms and wooden cabinets.
```

### A-03 — `shop2.jpeg`

**Esta imagem não está no jogo.** `scripts/portraits.ts` gera `bg/shop.webp` a partir de `shop.jpeg` (a lousa verde vazia), não de `shop2.jpeg`, e nenhum código ou script cita `shop2`. Em `shop.jpeg` os rótulos são rabiscos ilegíveis, sem marca reconhecível no recorte ampliado da prateleira. A marca só chega ao jogador se `shop2` for integrada. Opções: apagar `shop2.jpeg` do repositório (público) ou limpar com a instrução abaixo. O que se vê nela: garrafa âmbar em primeiro plano à esquerda com rótulo vermelho "BRAHMA"; garrafa clara na prateleira do meio, logo atrás, com rótulo "51"; lousa "TRUCO CERVEJA AMIZADE SEMPRE", flâmula "AQUI SÓ TEM GENTE BOA", lousa de cavalete "HOJE TEM TRUCO E GELADA"; uma foto emoldurada de um homem; rótulos com letras em quase todas as garrafas.

```text
Inpaint on shop2.jpeg and keep everything outside the masks pixel-identical.
Mask 1, the label of the amber bottle in the left foreground: a plain red and gold oval label with a small palm tree, no letters.
Mask 2, the label of the clear bottle on the middle shelf right behind it: a plain cream label with a sugar-cane drawing, no digits.
Mask 3, every other bottle label: flat colour blocks and simple pictograms, no letters.
Mask 4, the chalkboard at top left, the red pennant and the easel chalkboard at the right: chalk drawings only (a heart, playing-card suits, a palm tree), no words.
Mask 5, the framed photo of a man at the top: a framed beach landscape.
```

### A-04 — Coringa

O que se vê hoje: carta creme com moldura vermelha de linha dupla; a palavra "JOKER" em letras vermelhas serifadas, na vertical, sob uma estrela vermelha no canto superior esquerdo, e repetida de cabeça para baixo no canto inferior direito. A figura (malandro com rosto de palhaço, chapéu panamá com hibisco, camisa vermelha florida, garrafa âmbar com rótulo de palmeira, praia ao pôr do sol) está sem marca e fica como está. No jogo o nome vem do i18n ("CORINGA!" em PT-BR, "JOKER!" em EN).

```text
Inpaint on card-joker.png and keep everything outside the masks pixel-identical.
Mask 1, the vertical word under the star at the top left; mask 2, the same word upside down above the star at the bottom right: fill with the same cream card paper and continue the red double-line frame; in place of the letters draw a column of three small red five-point stars. Keep the two big corner stars.
```

### A-05 — Sheila

O que se vê hoje: bolsa marrom no canto inferior esquerdo com monograma dourado repetido (iniciais entrelaçadas e flores de quatro pétalas), alça de corrente dourada. O resto da pintura não tem marca.

```text
Inpaint on char-shiela.jpeg and keep everything outside the mask pixel-identical.
Mask, the handbag body at the bottom left: a plain woven straw beach bag with a dark-brown leather trim, no pattern, no monogram, no letters; keep the gold chain strap and the lighting.
```

### A-06 — O Delegado (`tony`)

O que se vê hoje: fachada à esquerda com "POLÍCIA CIVIL" em letras grandes; distintivo dourado no peito com "POLÍCIA" e "CIVIL" e um brasão colorido no centro; ao fundo um morro que lembra um cartão-postal real. Nome e brasão de instituição real não podem ir para a loja.

```text
Inpaint on char-tony.jpeg and keep everything outside the masks pixel-identical.
Mask 1, the lettering on the building at the top left: the same dark concrete wall with a blank rectangular plaque.
Mask 2, the badge on his chest: a plain gold shield badge with one embossed five-point star, no lettering, no coat of arms.
Optional mask 3, the tall rock in the background at the right: a low green hill with palm trees.
```

## 4. Grupo B — personagens sem pintura própria

B-03 e B-04 são achados novos: `char-valentao.jpeg` é o mesmo arquivo de `char-bruto.jpeg` e `char-cartomante.jpeg` é o mesmo de `char-beti.jpeg` (MD5 iguais; os `card/` e `portrait/` gerados também são idênticos). Hoje o chefe Valentão aparece com a pintura do Bruto e a chefe Cartomante com a da Beti. Se a repetição for de propósito, marque as duas linhas como dispensadas.

| ID | O que é | Origem → destino | Proporção e tamanho | Enquadramento | Prompt | Não pode aparecer | Prioridade | Status |
|---|---|---|---|---|---|---|---|---|
| B-01 | Chefe `juiz` ("O Juiz"), o último em pixel art | novo `art-src/gta/char-juiz.jpeg` → `card/juiz.webp`, `portrait/juiz.webp` (sai `portrait/juiz.png`) | 2:3, 1024×1536, `.jpeg` | Meio corpo, três quartos, câmera um pouco baixa; rosto e martelo dentro de y 115–939 | Em B-01 abaixo | Texto em livro ou placa, brasão, bandeira, balança com inscrição, peruca, charuto | `festival` | `pedido` |
| B-02 | Vendedor Seu Zé na tela da loja ("Balcão do Seu Zé") | novo `art-src/gta/shop-ze.png` → destino proposto `public/assets/gfx/shop/ze.webp` (pasta e chave ainda não existem) | 2:3, 1024×1536, `.png` com fundo transparente | Recorte da cintura para cima, sem cenário; ver "Enquadramento na loja" em B-02 | Em B-02 abaixo | Cenário, sombra projetada, rótulo na garrafa ou no copo, texto no avental | `festival` | `pedido` |
| B-03 | Chefe `valentao` ("O Valentão") com pintura própria | substitui `art-src/gta/char-valentao.jpeg` → `card/valentao.webp`, `portrait/valentao.webp` | 2:3, 1024×1536, `.jpeg` | Meio corpo, inclinado sobre a mesa, rosto dentro de y 115–939 | Em B-03 abaixo | Placa com frase, tatuagem com palavra, charuto, barba cheia e regata preta (são do Bruto) | `festival` | `pedido` |
| B-04 | Chefe `cartomante` ("A Cartomante") com pintura própria | substitui `art-src/gta/char-cartomante.jpeg` → `card/cartomante.webp`, `portrait/cartomante.webp` | 2:3, 1024×1536, `.jpeg` | Meio corpo, de frente, mãos com cartas na altura do peito, rosto dentro de y 115–939 | Em B-04 abaixo | Letras ou números nas cartas, imagem de santo, bola de cristal e lenço vermelho com moedas (são da Beti) | `festival` | `pedido` |

### B-01 — O Juiz

Identidade vinda do retrato em pixel (`public/assets/gfx/portrait/juiz.png`) e do concept antigo: homem mais velho, calvo no topo, cabelo grisalho rebelde nas laterais, bigode escuro grosso, óculos pretos retangulares, olhar bravo de lado, beca preta com o babado branco de duas tiras, martelo de madeira com anel dourado erguido. O par dele entre os chefes pintados é o estilo de `char-tony` e `char-stuart` (contorno limpo, bastante detalhe).

```text
[STYLE] Character card, vertical 2:3, 1024×1536, half-body portrait, three-quarter view, slightly low camera angle.
Subject: The Judge, a stern Brazilian judge in his sixties who referees card games at the beach bar. Light tan skin, balding crown with wild swept-back grey-white hair at the sides, thick dark moustache, heavy black rectangular glasses, a deep frown and a piercing sideways glare. He wears a black judge's robe open at the neck over a white shirt, with a white pleated jabot of two bands at the collar, sleeves pushed up because of the heat. His right hand raises a wooden gavel with a brass band, about to strike; his left hand holds a fan of three playing cards seen from the back (plain red backs).
Setting: he sits behind a heavy dark-wood table set on the sand under a thatched beach-bar roof; a brass desk lamp and a closed leather book with a blank cover on the table; behind him palm trees, the sea and a sunset sky. Strong orange rim light on the robe and the hair.
Keep the head, the glasses and the gavel in the upper 60% of the image and away from the side edges.
```

### B-02 — Seu Zé no balcão

É o mesmo homem de `char-ze.jpeg` (anexe como referência): atarracado, uns sessenta anos, pele morena queimada de sol, calvo no topo com cabelo grisalho-escuro nas laterais, bigode escuro grosso, sorriso largo de olhos apertados, camisa branca de manga curta aberta no peito, avental verde-escuro, pano de prato branco com listras vermelhas no ombro esquerdo.

**Enquadramento na loja.** A tela atual (`drawTrinketShop` em `src/scenes/RunScene.ts`) desenha tudo dentro da lousa de `shop.jpeg`: no `bg/shop.webp` 1920×1080 a lousa ocupa x 300–1610, y 138–764 (`SLATE` em `src/view/shop-slate.ts`), com as 4 ofertas à esquerda e os slots e a coleção à direita. "Próxima mesa" (140×28 px lógicos) fica no canto inferior direito da tela. Sobram três áreas na pintura: a faixa esquerda (prateleiras; o balcão ali tem balde, coqueteleira e canudos na frente), a faixa de baixo (balcão e banquetas, que some em parte nas telas 20:9, onde a pintura é cortada em cima e embaixo) e a **faixa direita** (abertura com o pôr do sol, sem objetos atrás do balcão, visível em 16:9 e em 20:9). O enquadramento que cabe é: **Zé em pé atrás do balcão na faixa direita, da cintura para cima, corpo virado para a lousa**, desenhado por código como recorte sobre o fundo, com a base do recorte na linha de trás do tampo do balcão (cerca de y 830 no 1920×1080) e largura de cerca de 270 px (x 1650–1920); a cabeça fica perto de y 370. Por ser recorte, ele pode reagir (balão de fala e um pulo ao comprar, R6.2) sem repintar o fundo. A captura `docs/media/store-shot-03-shop-pt-BR.png` é do layout antigo (fundo cinza liso, barra lateral, Manhas e pacotes) e não serve de guia.

```text
[STYLE] Single character cut-out, vertical 2:3, 1024×1536, transparent background (if the tool cannot export transparency: one perfectly flat, uniform bright-blue background with no gradient, no shadow and no floor).
Subject: Seu Zé, owner of the beach bar, the same man as in the reference painting: stocky, around sixty, warm sun-tanned brown skin, bald on top with grey-black hair at the sides, thick dark moustache, a big friendly squinting smile, hairy chest. White short-sleeved shirt open at the collar, dark-green bib apron, a white dish towel with red stripes over his left shoulder.
Pose: seen from the waist up, standing as if behind a counter that is not drawn. Body turned three-quarters toward the viewer's left, head turned to the viewer. His right arm reaches out to the viewer's left with an open palm, presenting something beside him; his left hand holds a clean empty glass and the corner of the dish towel at chest height.
Lighting: warm lamp light from the upper left front; a strong orange-pink sunset rim light from behind on the viewer's right side.
Framing: small margin above the head, figure centred, nothing cut at the sides; the figure ends in a straight horizontal cut at the waist exactly on the bottom edge of the image.
```

### B-03 — O Valentão

Regra do chefe: "os rivais pedem truco em toda mão". Identidade vinda do concept antigo e do desenho de reserva (`LOOKS.valentao`): brigão enorme, cicatriz na sobrancelha, barba por fazer, regata vermelha, corrente dourada, bandana, cara fechada. Precisa ser diferente do Bruto (barba cheia, regata preta, braços fechados de tatuagem).

```text
[STYLE] Character card, vertical 2:3, 1024×1536, half-body portrait, slightly low camera angle.
Subject: The Bully, a huge bad-tempered brawler in his forties who shouts for a raise on every hand. Sun-tanned brown skin, thick neck, a broken nose, a scar cutting through his left eyebrow, dark stubble, short messy dark hair under a red bandana tied around his forehead, mouth wide open mid-shout, furious eyes. Red sleeveless tank top, a thin gold bead chain, one simple anchor tattoo on the shoulder. He leans over a wooden bar table toward the viewer: his right fist slams a single face-down playing card onto the table, his left hand points straight at the viewer.
Setting: the corner of a rustic beach bar at sunset, a red wall behind him on the left, palm silhouettes and an orange sky on the right, an unlabeled amber bottle and a glass of beer shaking on the table.
Keep the face and both hands in the upper 60% of the image and away from the side edges.
```

### B-04 — A Cartomante

Regra da chefe: "a vira fica oculta até o fim da 1ª vaza". Identidade vinda do concept antigo e do desenho de reserva (`LOOKS.cartomante`): lenço, argolas douradas, roxo, três cartas de adivinhação. Precisa ser diferente da Beti (lenço vermelho com moedas, bola de cristal, velas, imagem de santa ao fundo).

```text
[STYLE] Character card, vertical 2:3, 1024×1536, half-body portrait, front view, slightly low camera angle.
Subject: The Fortune Teller, a sly woman in her sixties who reads cards at the beach bar. Warm brown skin, long wavy silver-streaked black hair, a deep-violet headscarf dotted with small gold stars and pinned with a gold crescent-moon brooch, large gold hoop earrings, a beauty mark, a knowing half-smile with one eye narrowed. Violet shawl with a gold pattern over a white blouse, several gold bangles. Her right hand holds up three fortune cards facing the viewer, each showing one simple pictogram and nothing else: a star, a sun, a crescent moon. Her left hand rests flat on a single face-down playing card on the table, hiding it.
Setting: a small round table with a purple fringed cloth on the veranda of a beach bar at dusk, one candle in a glass, paper lanterns, palm trees and a violet-pink sky behind her.
Keep the face and the three cards in the upper 60% of the image and away from the side edges.
```

## 5. Grupo C — texto e conteúdo sensível em pinturas que já estão no jogo

Achados da revisão, fora da lista original. Nenhum é marca registrada; entram aqui porque a Art Bible pede imagem sem texto (o jogo tem EN e PT-BR), sem cassino e sem cigarro aceso, e porque pesam nos questionários de classificação etária (Q-12, ainda aberta). **C-11 só deve ser feito se a Q-12 decidir tirar o fumo.** Todas as instruções são de inpainting sobre a própria fonte, mantendo o resto idêntico.

| ID | O que é | Origem → destino | Proporção e tamanho | Enquadramento | Prompt (inpainting) | Não pode aparecer | Prioridade | Status |
|---|---|---|---|---|---|---|---|---|
| C-01 | Pintura do menu principal (a única em uso, `menu-final-2`) | `art-src/gta/menu-final-2.png` → `bg/menu-final-2.webp` | 16:9, 1672×941, `.png` | Igual; o logo pintado fica | `Mask the chalkboard text and the two bottle labels: chalk drawings only on the board (palm tree, hibiscus, card suits), bottle labels with the palm emblem and no word.` | Lousa "BOTECO DO ZÉ / TRUCO CERVEJA AMIZADE MÚSICA PRAIA" ("Boteco do Zé" está na lista de strings proibidas da visual.md §5); rótulos "CERVEJA" | `festival` | `pedido` |
| C-02 | Fundo `main` (o que carrega primeiro) | `art-src/gta/background-3.png` → `bg/main.webp` | 16:9, 1672×941, `.png` | Igual | `Mask the chalkboard at the top right: the same board with chalk drawings only (a heart, a sun, a palm tree), no words.` | Lousa "TRUCO CERVEJA AMIZADE SOL PRAIA SEMPRE" | `1.0` | `pedido` |
| C-03 | Fundo `street` (também é o fundo do site) | `art-src/gta/background-2.png` → `bg/street.webp` | 16:9, 1672×941, `.png` | Igual | `Mask the two neon signs on the building at the left: a pink neon hibiscus flower and a pink neon palm tree, no letters.` | Neon "Aloha" (duas vezes) | `1.0` | `pedido` |
| C-04 | Fundo `bg4` | `art-src/gta/background-4.png` → `bg/bg4.webp` | 16:9, 1671×941, `.png` | Igual | `Mask every slot machine: potted palms and a wooden jukebox with no lettering. Mask the chip stacks on the foreground table: a neat deck of red-backed cards. Mask the printed betting layout on the felt: plain green felt.` | Caça-níqueis, fichas, mesa com marcação de aposta | `1.0` | `pedido` |
| C-05 | Fundo `bg5` | `art-src/gta/background-5.png` → `bg/bg5.webp` | 16:9, 1672×941, `.png` | Igual | `Mask every slot machine: potted palms and wooden cabinets. Mask the chip stacks on the foreground table: a neat deck of red-backed cards. Mask the printed betting layout on the felt: plain green felt.` | Caça-níqueis, fichas, mesa com marcação de aposta | `1.0` | `pedido` |
| C-06 | Bruto (companheiro `bruto`) | `art-src/gta/char-bruto.jpeg` → `card/bruto.webp`, `portrait/bruto.webp` | 2:3, 1024×1536, `.jpeg` | Igual | `Mask the wall sign at the top left: a blank weathered wooden board. Mask the script word in the arm tattoo: a continuous band of thorns.` | Placa "AQUI NÃO TEM CONVERSA FIADA"; tatuagem "Respeito" | `1.0` | `pedido` |
| C-07 | Ayla (companheira `ayla`) | `art-src/gta/char-ayla.jpeg` → `card/ayla.webp`, `portrait/ayla.webp` | 2:3, 1024×1536, `.jpeg` | Igual | `Mask the lettering on the black sleeveless shirt: a distressed white lightning bolt and one small star, no letters.` | Camiseta "Rock baby" | `1.0` | `pedido` |
| C-08 | Stuart (chefe `stuart`) | `art-src/gta/char-stuart.jpeg` → `card/stuart.webp`, `portrait/stuart.webp` | 2:3, 1024×1536, `.jpeg` | Igual | `Mask the chalkboard: geometric chalk diagrams only (triangle, cube, circle), no formulas, no letters. Mask the three book spines: plain coloured spines with gold bands. Mask the mug: a plain white mug with a small light-bulb drawing.` | "E=mc²" e fórmulas, lombadas "HISTÓRIA", "MATEMÁTICA", "FILOSOFIA", caneca "CAFÉ IDEIAS PLANOS" | `1.0` | `pedido` |
| C-09 | Agiota (chefe `agiota`) | `art-src/gta/char-agiota.jpeg` → `card/agiota.webp`, `portrait/agiota.webp` | 2:3, 1024×1536, `.jpeg` | Igual | `Mask the leaf print on the shirt: large golden hibiscus flowers and broad banana leaves on the same dark fabric. Mask the banknotes: plain green fantasy banknotes with an ornamental border and a palm-tree vignette, no digits, no portrait.` | Estampa de folhas serrilhadas que se lê como folha de cannabis; cédulas azuis com "100" parecidas com dinheiro real | `festival` | `pedido` |
| C-10 | Jhony (companheiro `jhony`) | `art-src/gta/char-jhony.jpeg` → `card/jhony.webp`, `portrait/jhony.webp` | 2:3, 1024×1536, `.jpeg` | Igual | `Mask the banknotes: plain green fantasy banknotes with an ornamental border and a palm-tree vignette, no digits, no portrait.` | Cédulas azuis com "100" parecidas com dinheiro real (a estampa da camisa é de folha de palmeira; conferir se não se lê como a do Agiota) | `1.0` | `pedido` |
| C-11 | Fumo aceso: Bruto, Agiota, Rei do Truco e a carta Zetha | `char-bruto.jpeg`, `char-agiota.jpeg`, `char-truco-king.jpeg`, `card-zetha.png` → os `card/`, `portrait/` e `back/trevo.webp` correspondentes | os de cada fonte | Igual | `Mask the cigar (or cigarette) and its smoke: the mouth closed around a wooden toothpick, clean background where the smoke was.` | Charuto ou cigarro aceso e fumaça | `1.0` (depende da Q-12) | `pedido` |

Conferido e sem pedido: `char-ze`, `char-cida` (o rótulo da garrafa fica quase todo atrás da mão e não mostra marca legível), `char-chico`, `char-mia`, `char-peter`, `char-sortuda` (segura uma ficha vermelha com naipe de espadas; pequena), `char-beti`, `background-1`, `board-game-1`, `shop.jpeg`, `card-1`, `card-2`, `card-3`. As cartas especiais `card-alpha`, `card-betha` e `card-zetha` trazem a palavra do próprio nome ("ALPHA", "BETHA", "ZETHA"), que é igual em EN e PT-BR no i18n: ficam, a não ser que o dev queira aplicar nelas a mesma limpeza do coringa.

## 6. Grupo D — versos dos baralhos que voltam (D-82, R7.2)

Os baralhos iniciais voltam na 1.0 e o aceite do R7.2 pede "verso próprio em jogo". Só `default`, `interior` e `blefe` têm pintura; `dinheiro` e `viciado` usam o verso vetor tingido (ouro `#B88A1F` e azul `#2E5F8F` em `BACK_COLOR`, `src/art/flat.ts`). Os versos pintados de `interior` e `blefe` são os dois vermelhos com medalhão de espadas, difíceis de distinguir a 48×64; os novos usam a cor do baralho na moldura.

| ID | O que é | Origem → destino | Proporção e tamanho | Enquadramento | Prompt | Não pode aparecer | Prioridade | Status |
|---|---|---|---|---|---|---|---|---|
| D-01 | Verso do Baralho do Dinheiro (`dinheiro`: +$10 no início, −1 espaço de trinket) | novo `art-src/gta/card-dinheiro.png` → `back/dinheiro.webp` | 2:3, 1024×1536, `.png` | Carta inteira e centrada, moldura completa, medalhão no centro | Em D-01 abaixo | Texto, cifrão, cédula realista, moldura vermelha | `1.0` | `pedido` |
| D-02 | Verso do Baralho Viciado (`viciado`: uma cópia extra de cada carta de paus) | novo `art-src/gta/card-viciado.png` → `back/viciado.webp` | 2:3, 1024×1536, `.png` | Carta inteira e centrada, moldura completa, medalhão no centro | Em D-02 abaixo | Texto, moldura vermelha, mais de um naipe no medalhão | `1.0` | `pedido` |

### D-01 — Baralho do Dinheiro

```text
[STYLE] [CARD ADD-ON] Playing-card back, vertical 2:3, 1024×1536.
Design: old-gold double-line frame with small corner ornaments on cream paper. Inside the frame a beach bay at golden hour dominated by yellows and ambers: coconut palms on the left, a calm sea full of golden reflections, a low sun. In the exact centre an ornate old-gold medallion with a scalloped cream border holding one cream diamond suit pip. A few gold coins lie on the sand at the bottom among yellow hibiscus flowers.
```

### D-02 — Baralho Viciado

```text
[STYLE] [CARD ADD-ON] Playing-card back, vertical 2:3, 1024×1536.
Design: deep-blue double-line frame with small corner ornaments on cream paper. Inside the frame a beach bay at blue hour, just after sunset: navy palm silhouettes, turquoise and violet sea, the first stars, a thin orange line on the horizon. In the exact centre an ornate deep-blue medallion with a scalloped cream border holding one cream club suit pip. Blue and white hibiscus flowers at the bottom.
```

## 7. Grupo E — ícones dos itens (R6.8)

### 7.1 O que o jogador obtém na configuração da 1.0

Com `TRINKETS = true` (`src/config/features.ts`) a loja é só de trinkets: `openShop` chama `openTrinketShop` (`src/logic/run/run.ts`), que monta 4 ofertas de trinket e devolve `packs: []` e `upgrade: null`.

| Item | Quantidade | O jogador obtém? | Ícone hoje |
|---|---|---|---|
| Trinkets (`src/data/trinkets.ts`) | 32 | **Sim**, na loja | Os 32 usam ícones genéricos de UI (`icon.<nome>`), os mesmos de botões e menus (moeda, check, alerta, carrinho, controle, envelope…); nenhum ícone se repete entre trinkets |
| Manhas (`src/data/manhas.ts`) | 58 | **Não.** Os caminhos eram a loja de Manhas, os pacotes e uma Promessa, todos desligados. Ainda aparecem no tutorial (`TUTORIAL_DEAL.manhas = ['seuZe']`, na mesa), na aba "manhas" do Almanaque (as 58) e por parâmetro de debug | Selo colorido por código com um de poucos símbolos (`symbolOf` em `src/art/flat.ts`) |
| Simpatias (`src/data/consumables.ts`) | 8 | **Não** (saíam da loja e dos pacotes) | Selo por código |
| Cartas de Lance | 7 | **Não** (idem). Os 7 Lances (`src/data/lances.ts`) seguem valendo na pontuação, mas aparecem só como texto na contagem | Selo por código |
| Pacotes, Melhorias, Promessas | — | **Não**, e saem do código (D-82, R0.4) | — |

Por isso **o pedido é de 32 ícones, um por trinket**. Manhas, Simpatias e Cartas de Lance não entram: pintar 73 ícones de itens que o jogador não obtém não fecha nenhum aceite. O ícone E-09 (trinket `seuZe`) serve também para a Manha `seuZe` do tutorial, que tem o mesmo nome e o mesmo efeito. O R3.5 prevê de 5 a 8 itens exclusivos do 1×1 que ainda não têm id: quando existirem, viram a folha E-S5.

### 7.2 Como gerar as folhas

`scripts/icons.ts` corta folhas em grade: divide a largura pelas colunas e a altura pelas linhas, apaga o fundo cinza neutro a partir das bordas de cada célula, recorta o desenho e o encaixa num quadrado. As folhas atuais são de 8×4 (`icons.png`, com linhas brancas na grade), 5×2 (`icons-3.png`, sem linhas) e 4×2 (`icones-2.png`).

- **4 folhas de 8 ícones, grade de 4 colunas × 2 linhas**, cada folha em 3:2, 1536×1024 (células de 384×512). Ordem das células: da esquerda para a direita, linha de cima primeiro.
- **Fundo:** cinza médio neutro, liso e igual na folha inteira (R = G = B), sem degradê. Linhas de grade são dispensáveis.
- **Cada ícone:** centrado na célula, ocupando cerca de 70% dela, sem encostar na borda da célula nem no vizinho. Sem sombra projetada, brilho ou partículas fora do objeto (o script guardaria como sujeira).
- **Cuidado com o recorte:** partes cinza-neutro ou branco puro do desenho que encostem na borda da célula são apagadas junto com o fundo. Branco e cinza dentro do desenho, cercados por contorno, ficam.
- **Leitura:** o aceite do R6.8 é "legível a 48 px lógicos", mas hoje o trinket aparece em medalhões de 12 a 32 px lógicos (cabeçalho da oferta, slots, coleção, barra lateral da mesa), com o ícone a no máximo 24 px. Um objeto só, silhueta simples, contorno grosso.
- **Sem letras nem números.** Valor de carta vira quantidade de naipes; naipes (♣ ♥ ♠ ♦) são símbolos e podem.

| ID | O que é | Origem → destino | Proporção e tamanho | Enquadramento | Prompt | Não pode aparecer | Prioridade | Status |
|---|---|---|---|---|---|---|---|---|
| E-S1 | Folha 1: naipes e cartas (E-01 a E-08) | novo `art-src/gta/icons-trinkets-1.png` → destino proposto `public/assets/gfx/icon/<id>.png` (um por trinket, 192×192) | 3:2, 1536×1024, `.png` | Grade 4×2, um objeto centrado por célula | Em E-S1 abaixo | Letras, números, índices de carta, cenário, sombra no fundo | `festival` | `pedido` |
| E-S2 | Folha 2: parceria e vazas (E-09 a E-16) | novo `art-src/gta/icons-trinkets-2.png` → idem | 3:2, 1536×1024, `.png` | Grade 4×2 | Em E-S2 abaixo | Idem | `festival` | `pedido` |
| E-S3 | Folha 3: dinheiro e boteco (E-17 a E-24) | novo `art-src/gta/icons-trinkets-3.png` → idem | 3:2, 1536×1024, `.png` | Grade 4×2 | Em E-S3 abaixo | Idem, mais rótulo em garrafa, copo ou caixa de fósforo | `festival` | `pedido` |
| E-S4 | Folha 4: sorte e truques (E-25 a E-32) | novo `art-src/gta/icons-trinkets-4.png` → idem | 3:2, 1536×1024, `.png` | Grade 4×2 | Em E-S4 abaixo | Idem | `festival` | `pedido` |

### 7.3 Os 32 trinkets

Efeitos na raridade Normal ([trinkets.md](trinkets.md) e i18n). "Hoje" é o ícone genérico que o trinket usa em `src/data/trinkets.ts`.

| ID | Trinket (`id`) | Nome PT-BR / EN | Bônus / contra | Desenho pedido | Hoje | Folha, célula |
|---|---|---|---|---|---|---|
| E-01 | `acoNaManga` | Ás na Manga / Ace Up the Sleeve | +20 Fichas por vaza vencida com Ás / K vale −5 Fichas | Punho de camisa com uma carta saindo, um naipe de espadas grande | `cards` | 1, 1 |
| E-02 | `zapDeOuro` | Zap de Ouro / Golden Zap | ×1,5 Mult se o zap venceu uma vaza / −1 Mult em mão sem zap | Carta de ouro maciço com um naipe de paus em relevo | `goldCard` | 1, 2 |
| E-03 | `baralhoMarcado` | Baralho Marcado / Marked Deck | +15 Fichas por vaza vencida com ♣ / ♥ valem −5 Fichas | Maço de verso vermelho com o canto de cima dobrado e uma marca de tinta | `deck` | 1, 3 |
| E-04 | `coracaoMole` | Coração Mole / Soft Heart | +2 Mult por vaza vencida com ♥ / ♠ valem −5 Fichas | Coração vermelho de pelúcia, amassado, com um remendo | `heart` | 1, 4 |
| E-05 | `espadachim` | Espadachim / Swordsman | +2 Mult por vaza vencida com ♠ / ♦ valem −5 Fichas | Um florete atravessando um naipe de espadas | `swords` | 1, 5 |
| E-06 | `maoLeve` | Mão Leve / Light Hand | +$1 por vaza vencida com ♦ / −$1 por mão perdida | Mão pinçando com dois dedos uma pedra vermelha em forma de losango | `hand` | 1, 6 |
| E-07 | `tresSecos` | Três Secos / Dry Threes | +3 Mult por vaza vencida com um 3 / 2 vale −10 Fichas | Leque fechado de três cartas, cada uma com três naipes em coluna | `dice` | 1, 7 |
| E-08 | `figurao` | Figurão / Big Shot | +12 Fichas por vaza vencida com Q, J ou K / 4 a 7 valem −4 Fichas | Cartola preta com um monóculo dourado pendurado | `monocle` | 1, 8 |
| E-09 | `seuZe` | Seu Zé / Seu Zé | +15 Fichas por vaza vencida com 4, 5, 6 ou 7 / Q, J e K valem −4 Fichas | Rosto do Zé como emblema: careca, bigodão escuro, sorriso | `people` | 2, 1 |
| E-10 | `duplaDinamica` | Dupla Dinâmica / Dynamic Duo | +3 Mult por vaza vencida pelo parceiro / −10 Fichas por vaza vencida por você | Dois punhos se tocando de frente | `handshake` | 2, 2 |
| E-11 | `confiaEmMim` | Confia em Mim / Trust Me | +20 Fichas por vaza vencida pelo parceiro / Mult base −1 | Mão com os dedos cruzados | `check` | 2, 3 |
| E-12 | `vazaLimpa` | Vaza Limpa / Clean Sweep | ×1,5 Mult se a dupla venceu as duas primeiras vazas / −$1 por mão perdida | Vassoura de palha varrendo duas cartas | `sparkle` | 2, 4 |
| E-13 | `virada` | Virada / Comeback | +6 Mult se perdeu a 1ª vaza e venceu a 2ª / −1 Mult se venceu a 1ª | Uma carta girando no ar, envolvida por uma seta curva laranja | `refresh` | 2, 5 |
| E-14 | `gritoDeTruco` | Grito de Truco / Truco Shout | +4 Mult em mão com truco aceito / −2 Mult em mão sem truco | Boca aberta gritando, dentes à mostra, três traços de som | `megaphone` | 2, 6 |
| E-15 | `seisMaldito` | Seis Maldito / Cursed Six | ×2 Mult em mão que vale 6 ou mais / −20% Fichas em mão que vale 1 | Dado preto com a face de seis pontos vermelhos e dois chifrinhos | `alert` | 2, 7 |
| E-16 | `maoDeFerro` | Mão de Ferro / Iron Hand | +8 Mult na mão de 11 e na mão de ferro / −1 Mult nas mãos normais | Punho fechado de manopla de ferro com rebites | `anvil` | 2, 8 |
| E-17 | `copoAmericano` | Copo Americano / Tumbler | +$1 por mão vencida / itens da loja +$1 | Copo pequeno de boteco, facetado, cheio de cerveja com espuma | `coin` | 3, 1 |
| E-18 | `cofrinho` | Cofrinho / Piggy Bank | +$1 a cada $5 guardados (máx. +$3) / Prêmio de Rapidez −$2 | Porquinho rosa de louça com uma moeda entrando na fenda | `piggy` | 3, 2 |
| E-19 | `relogioDeBolso` | Relógio de Bolso / Pocket Watch | Prêmio de Rapidez ×2 / meta da mesa +10% | Relógio de bolso dourado aberto, com corrente, mostrador só com traços | `next` | 3, 3 |
| E-20 | `pingaDeAbertura` | Pinga de Abertura / Opening Shot | +25 Fichas na primeira mão da mesa / −2 Fichas nas outras mãos | Copinho de dose com bebida clara e uma fatia de limão na borda | `cart` | 3, 4 |
| E-21 | `saideira` | Saideira / Last Round | +10 Mult quando falta 20% ou menos da meta / −1 Mult quando falta mais da metade | Garrafa âmbar sem rótulo, inclinada, pingando as últimas gotas | `trophy` | 3, 5 |
| E-22 | `lendaDoBoteco` | Lenda do Boteco / Boteco Legend | ×1,5 Mult por vaza vencida / −1 tento ao perder uma mão | Caneca de chope dourada como troféu, com coroa de louros | `beerBottle` | 3, 6 |
| E-23 | `caixaDeFosforo` | Caixa de Fósforo / Matchbox | +$1 por vaza vencida com manilha / itens da loja +$1 | Caixa de fósforos entreaberta, lisa, com um palito aceso | `matchbox` | 3, 7 |
| E-24 | `bicheiro` | Bicheiro / Bookie | 25% de chance de dobrar o dinheiro ganho na mesa / meta da mesa +8% | Bloquinho de apostas com risquinhos de contagem, toco de lápis e uma moeda | `envelope` | 3, 8 |
| E-25 | `peDeCoelho` | Pé de Coelho / Rabbit's Foot | +3 Mult por vaza vencida com manilha / meta da mesa +5% | Pé de coelho creme com ponteira dourada e correntinha | `star` | 4, 1 |
| E-26 | `viraDourada` | Vira Dourada / Golden Vira | ×1,5 Mult por vaza vencida com manilha / manilhas valem −10 Fichas | Carta de verso vermelho sendo virada, a face soltando luz dourada | `question` | 4, 2 |
| E-27 | `carteado` | Carteado / Card Game | +2 Fichas por carta comum jogada pela dupla / cartas especiais valem −10 Fichas | Leque aberto de cinco cartas creme com os quatro naipes | `handCard` | 4, 3 |
| E-28 | `cantoria` | Cantoria / Chanting | +5 Fichas por sinal enviado pela dupla / rivais flagram sinais +10% | Viola caipira com duas notas musicais | `note` | 4, 4 |
| E-29 | `malandragem` | Malandragem / Street Smarts | +6 Mult ao vencer um truco com mão fraca / −$2 quando a dupla corre de um truco | Chapéu panamá branco de fita preta, inclinado, com uma carta presa na fita | `mute` | 4, 5 |
| E-30 | `diaDeSorte` | Dia de Sorte / Lucky Day | Começa cada mesa com +1 tento / começa cada mesa com −$1 | Trevo de quatro folhas na frente de um sol nascendo | `clover` | 4, 6 |
| E-31 | `reiDoPedaco` | Rei do Pedaço / King of the Corner | +1 Mult base por mesa vencida na run (máx. +5) / meta da mesa +5% por Campeonato | Coroa dourada em cima de uma banqueta de bar de madeira | `crown` | 4, 7 |
| E-32 | `coringaNoBolso` | Coringa no Bolso / Joker in the Pocket | Coringas abertos: +20 Fichas e +2 Mult / coringas valem −10 Fichas | Bolso de camisa com uma carta saindo, a carta com um gorro de bobo de guizos | `gamepad` | 4, 8 |

### E-S1 — folha 1

```text
[STYLE] [ICON ADD-ON] Icon sheet, 3:2, 1536×1024: a grid of 4 columns and 2 rows, eight separate icons on one perfectly flat neutral mid-grey background, each icon centred in its cell with clear empty space around it, nothing crossing from one cell into another.
Top row, left to right:
1. A white shirt cuff with a playing card sliding out of the sleeve, the card showing one large black spade pip.
2. A solid gold playing card with one embossed club pip, a single highlight across it.
3. A squared deck of red-backed playing cards, the top corner bent up, one dark ink blot on the top card.
4. A soft plush red heart, slightly squashed, with one stitched patch.
Bottom row, left to right:
5. A fencing foil with a gold guard piercing a black spade pip.
6. A hand delicately pinching a red diamond-shaped gem between thumb and forefinger.
7. A tight fan of three cream playing cards, each showing three club pips in a column.
8. A black top hat with a gold monocle hanging from its brim on a thin chain.
```

### E-S2 — folha 2

```text
[STYLE] [ICON ADD-ON] Icon sheet, 3:2, 1536×1024: a grid of 4 columns and 2 rows, eight separate icons on one perfectly flat neutral mid-grey background, each icon centred in its cell with clear empty space around it, nothing crossing from one cell into another.
Top row, left to right:
1. The smiling face of a bald old bartender with a thick dark moustache, as a round emblem.
2. Two fists bumping knuckle to knuckle, one from each side.
3. A hand with index and middle fingers crossed.
4. A straw broom sweeping two cream playing cards.
Bottom row, left to right:
5. One playing card spinning in the air, wrapped by a curved orange arrow.
6. A wide-open shouting mouth with teeth, three short sound strokes beside it.
7. A black die showing the six-pip face in red, with two small horns on top.
8. A clenched fist in a riveted iron gauntlet.
```

### E-S3 — folha 3

```text
[STYLE] [ICON ADD-ON] Icon sheet, 3:2, 1536×1024: a grid of 4 columns and 2 rows, eight separate icons on one perfectly flat neutral mid-grey background, each icon centred in its cell with clear empty space around it, nothing crossing from one cell into another.
Top row, left to right:
1. A small faceted bar tumbler full of beer with a thick foam head.
2. A pink ceramic piggy bank with a gold coin dropping into its slot.
3. An open gold pocket watch with a chain, the dial marked only with plain ticks.
4. A small shot glass of clear spirit with a lime wedge on the rim.
Bottom row, left to right:
5. An amber beer bottle with no label, tilted, the last three drops falling from its mouth.
6. A golden beer mug shaped like a trophy, with a laurel wreath around it.
7. A plain half-open matchbox with red-tipped matches, one match burning.
8. A small notepad with pencil tally strokes, a stubby pencil across it and one gold coin.
```

### E-S4 — folha 4

```text
[STYLE] [ICON ADD-ON] Icon sheet, 3:2, 1536×1024: a grid of 4 columns and 2 rows, eight separate icons on one perfectly flat neutral mid-grey background, each icon centred in its cell with clear empty space around it, nothing crossing from one cell into another.
Top row, left to right:
1. A cream rabbit's-foot charm with a gold cap and a short chain.
2. A red-backed playing card being flipped over, its hidden face pouring golden light.
3. A wide fan of five cream playing cards showing club, heart, spade and diamond pips, no corner indices.
4. A small ten-string country guitar with two music notes beside it.
Bottom row, left to right:
5. A white Panama hat with a black band, tilted, one playing card tucked into the band.
6. A four-leaf clover in front of a small rising sun.
7. A gold crown resting on a round wooden bar stool.
8. A shirt chest pocket with a playing card peeking out, the card showing a jester cap with bells.
```

## 8. Grupo F — key art das lojas e do carregamento (R12.1, R6.1)

Hoje `scripts/store-art.ts` desenha as artes de loja por código sobre fundo liso `#2B2B2B`: o wordmark "ZAPATRO" em Rubik 700 dourado, bustos de `bruto`, `cida` e `jhony` e um leque de três cartas. `art-src/keyart.png` (1920×1080) e `art-src/capsules/steam-header.png` ainda são a cena antiga em pixel art (as outras cinco imagens de `art-src/capsules/` não foram abertas). A tela de carregamento (`BootScene`) é o texto "Carregando… N%". A pintura F-01 entra por baixo dessas composições; o wordmark e o leque continuam sendo desenhados por código, por isso **a pintura não leva logo nem cartas de face para cima**.

Tamanhos que o script deriva (a pintura precisa sobreviver a todos os recortes):

| Arquivo em `docs/media/` | Tamanho | Proporção | Onde o script põe o logo |
|---|---|---|---|
| `store-steam-header.png` | 920×430 | 2,14:1 | No meio, entre os bustos (esquerda) e o leque (direita) |
| `store-play-feature.png` | 1024×500 | 2,05:1 | Idem |
| `store-steam-small.png` | 462×174 | 2,66:1 | À esquerda, cerca de metade da altura; uma carta à direita |
| `store-steam-main.png` | 616×353 | 1,75:1 | Faixa de cima (37% da altura) |
| `store-itch-cover.png` | 630×500 | 1,26:1 | Faixa de cima (34%) |
| `site-og.png` (`.jpg`, `.webp`) | 1200×630 | 1,90:1 | Faixa de cima (29%) |
| `store-steam-vertical.png` | 748×896 | 0,83:1 | Topo (cerca de 25%) |
| `store-steam-library.png` | 600×900 | 2:3 | Terço de cima |
| `store-steam-hero.png` | 3840×1240 | 3,10:1 | Sem logo (o comentário do script diz que a Steam sobrepõe o dela) |

| ID | O que é | Origem → destino | Proporção e tamanho | Enquadramento | Prompt | Não pode aparecer | Prioridade | Status |
|---|---|---|---|---|---|---|---|---|
| F-01 | Key art larga: capsules, Open Graph e tela de carregamento | substitui `art-src/keyart.png` → `docs/media/store-*.png`, `site-og.*` e a tela de carregamento (destino no jogo a definir na integração) | 16:9, o maior que a ferramenta der (ideal 3840×2160; mínimo 1920×1080), `.png` | Grupo de personagens entre 45% e 85% da largura; 40% da esquerda e 30% de cima calmos para o logo; 15% de baixo calmos para barra de progresso e dica; rostos entre 25% e 65% da altura | Em F-01 abaixo | Logo, título, texto, cartas de face para cima, charuto, marcas, rótulos legíveis | `festival` | `pedido` |
| F-02 | Key art vertical (opcional): library e capsule vertical, que recortam mal de um 16:9 | novo `art-src/keyart-vertical.png` → `store-steam-library.png`, `store-steam-vertical.png` | 2:3, 2048×3072 ou o maior possível, `.png` | 35% de cima calmos para o logo; o mesmo trio embaixo | Em F-02 abaixo | Idem | `1.0` | `pedido` |

### F-01 — key art larga

Os três personagens são os que `store-art.ts` já usa. Anexe `char-cida.jpeg`, `char-bruto.jpeg` e `char-jhony.jpeg` como referência, se a ferramenta aceitar.

```text
[STYLE] Wide key art, 16:9, as large as possible (3840×2160 ideal, 1920×1080 minimum). No logo and no title anywhere.
Scene: a card game at a wooden table with green felt on the veranda of a Brazilian beach bar at sunset, seen from the seat of the fourth player, the viewer. Three characters sit around the table, grouped in the right-centre of the frame, between 45% and 85% of the width. In the middle, facing the viewer: a cheerful heavyset woman in her fifties with curly dark hair under a red bandana, gold hoop earrings and a leopard-print top, laughing and raising one hand in a signal. On the left of the group: a huge bearded man in a black tank top with tattooed arms and a gold chain, glaring over his cards. On the right of the group: a slim young man with curly dark hair, a thin moustache, a gold chain and an open dark shirt with a golden palm-leaf print, smirking. Each holds a fan of playing cards seen from the back (plain red backs). On the felt: a small pile of face-down cards, unlabeled amber beer bottles, small glasses of beer, a bowl of peanuts.
Bottom foreground, right of centre: the viewer's own hand entering the frame, holding three red-backed cards.
Left 40% of the frame: a calm open view with no characters: the sunset sky fading from orange to pink to violet with big soft clouds, turquoise sea, a curve of beach, distant palm silhouettes, one dark palm frond in the top-left corner. Low detail and low contrast: the game logo is placed here.
Top 30% across the whole width: sky and the edge of a thatched roof with a string of warm bulbs, no faces.
Bottom 15%: dark table edge and foliage, low detail.
All faces sit between 25% and 65% of the height, so a very wide 3.1:1 crop of the middle still shows them. Nothing important within 8% of any edge.
```

### F-02 — key art vertical (opcional)

```text
[STYLE] Vertical key art, 2:3, as large as possible (2048×3072 ideal). No logo and no title anywhere.
The same scene and the same three characters as the wide key art, recomposed vertically: the top 35% is calm sunset sky with palm fronds and a string of warm bulbs, low detail (the game logo is placed here); below it the three characters around the green felt table, the woman in the middle and highest, the two men at her sides; at the bottom the viewer's hand with three red-backed cards and the table edge. Nothing important within 8% of any edge.
```

## 9. Grupo G — modo 1×1

Nada a pedir. No 1×1 (D-78) os 10 companheiros viram rivais com as pinturas que já têm, e os 10 ids de `COMPANION_IDS` (`bruto`, `cida`, `jhony`, `nino`, `ze`, `mia`, `chico`, `beti`, `ayla`, `sheila`) têm os dois arquivos, `public/assets/gfx/card/<id>.webp` e `public/assets/gfx/portrait/<id>.webp`. Dois efeitos colaterais, já cobertos acima: o Nino aparece mais (A-01) e, enfrentando Bruto ou Beti como rival e depois o Valentão ou a Cartomante como chefe, o jogador vê a mesma pintura duas vezes (B-03, B-04).

## 10. Totais

| Prioridade | Pinturas (linhas) | Ícones |
|---|---|---|
| `loja` | 5: A-01, A-02, A-04, A-05, A-06 | — |
| `festival` | 7: B-01, B-02, B-03, B-04, C-01, C-09, F-01 | 32 em 4 folhas (E-S1 a E-S4) |
| `1.0` | 13: A-03, C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-10, C-11, D-01, D-02, F-02 | — |
| Total | 25 linhas | 32 ícones |

- [ ] `loja`: 5 pinturas (4 são inpainting; A-02 é regeneração).
- [ ] `festival`: 7 pinturas (5 novas, 2 inpainting) e 4 folhas de ícones.
- [ ] `1.0`: 13 linhas (10 inpainting, 2 versos novos, 1 key art opcional); C-11 toca 4 fontes e depende da Q-12; A-03 pode ser resolvida apagando o arquivo.
- [ ] Pinturas realmente novas (do zero): 9 (B-01 a B-04, D-01, D-02, F-01, F-02 e a regeneração de A-02).

## 11. Achados que não são pedido de arte

- `shop2.jpeg` (Brahma, "51") não entra no build: a loja usa `shop.jpeg` (detalhe em A-03).
- `scripts/portraits.ts` ainda converte `menu-1` a `menu-7` para `public/assets/gfx/bg/`, e o `BootScene` baixa todos, mas o menu só usa `menu-final-2` (`src/view/menu-backdrop.ts`). Essas pinturas trazem botões pintados em português, frases em lousas e, numa delas, um neon "MIAMI". Tirar do mapa `BACKGROUNDS` e apagar os WebP resolve sem arte nova.
- `src/art/icons.ts`, citado no AGENTS.md e na visual.md como a casa dos 8 ícones vetoriais, não existe: os 8 (`list`, `doc`, `refresh`, `monitor`, `upload`, `download`, `note`, `pause`) são cortados da folha `icones-2.png` por `scripts/icons.ts`.
- A visual.md §0 diz `BACKDROP_BRIGHTNESS` = 0,4 e que o menu tem 3 pinturas; no código o valor é 0,3 (`src/config/palette.ts`; a loja usa 0,75) e o menu tem uma pintura.
- O tutorial e a aba "manhas" do Almanaque ainda mostram Manhas, que o jogador não obtém na configuração atual (§7.1).

## 12. Integração (o agente roda quando os arquivos chegarem)

1. Conferir cada fonte em `art-src/gta/`: nome, extensão e tamanho da linha; abrir a imagem e revisar a 100% (sem texto, sem marca) antes de qualquer conversão.
2. Ajustar os mapas de `scripts/portraits.ts`: `juiz` entra em `PAINTED` e sai de `PORTRAITS` (e `public/assets/gfx/portrait/juiz.png` é apagado); `dinheiro` e `viciado` entram em `BACKS`; `menu-1` a `menu-7` saem de `BACKGROUNDS`.
3. `bun scripts/portraits.ts` e conferir os WebP gerados (`card/`, `portrait/`, `bg/`, `back/`) e o `index.json`.
4. Ícones: novas entradas em `SHEETS` de `scripts/icons.ts` (folhas em `art-src/gta/`, tamanho de saída maior que os 32 px atuais), `bun scripts/icons.ts`, e o campo `icon` de cada trinket em `src/data/trinkets.ts` passa a apontar para o ícone próprio; teste que garante que nenhum trinket divide ícone com outro nem com a UI (aceite do R6.8).
5. Seu Zé: passo novo no script para o recorte com alfa, chave de textura, entrada no `LATER` de `src/data/load-order.ts` e desenho na loja (`RunScene`), com fallback sem a imagem.
6. Fundo `bg6` regenerado e, se a lousa de `shop.jpeg` mudar, medir de novo `SLATE` em `src/view/shop-slate.ts`.
7. Key art: `scripts/store-art.ts` passa a compor sobre a pintura; tela de carregamento do R6.1 com uma versão leve da mesma arte; `bun scripts/store-art.ts` e `bun scripts/store-shots.ts`.
8. Peso: `bun run build` e medir o primeiro download (< 8 MB, GD-017) e o build Poki (limite de 8 MiB em `scripts/release.ts`); o que a primeira tela não usa vai para o `LATER`.
9. Capturas em 1920×1080, 2560×1440, 2400×1080 e 3120×1440 das telas afetadas (mesa, escolha de parceiro, loja, menu, Almanaque).
10. Gates: `bun run check`, `bun run lint:md`, `bun run typecheck`, `bun test`; `bun run build` e `bun scripts/smoke.ts` antes de push.
11. Documentos no mesmo lote: status desta lista (`integrado`), [visual.md](visual.md) §0, [asset-status.md](asset-status.md) com a revisão "sem marca real, sem texto" de cada pintura (aceite do R7.4), PLAN §1.4.4, ROADMAP (R6.1, R6.2, R6.8, R7.0, R7.4, R12.1) e CHANGELOG `[Unreleased]`.

## 13. Não verificado

- **Folhas de ícones originais.** `references/concept-art-gta/` (com `icons.png`, `icons-3.png` e `icones-2.png`) não existe neste checkout. A grade e o fundo vêm das constantes de `scripts/icons.ts` e dos 51 PNG de 32×32 em `public/assets/gfx/icon/`, não das folhas.
- **Coordenadas.** As máscaras de A-02 e a posição do Seu Zé (y ≈ 830, x ≈ 1650–1920) foram medidas a olho em prévias reduzidas: são aproximadas e precisam ser medidas de novo na integração.
- **`menu-1` a `menu-7`.** Vistas só em miniatura (não são usadas pelo menu); não foram revisadas a 100%.
- **`shop.jpeg`.** A prateleira esquerda foi ampliada cerca de 2× e não mostrou marca legível; não houve revisão garrafa a garrafa a 100%.
- **Critério das lojas.** O que a Steam e o Google Play de fato recusam não foi consultado nas regras oficiais. A classificação `loja` de A-05 e A-06 segue a regra do projeto (nada de marca nem instituição real), não um parecer jurídico. A regra da Steam sobre logo nas capsules e no hero vem só do comentário de `scripts/store-art.ts`.
- **Repetição de `valentao`/`bruto` e `cartomante`/`beti`.** Os arquivos são idênticos; não há registro dizendo se foi de propósito.
- **Destinos e tamanhos propostos.** `public/assets/gfx/shop/ze.webp`, `public/assets/gfx/icon/<id>.png` a 192×192, `card-dinheiro.png`, `card-viciado.png`, `icons-trinkets-N.png` e `keyart-vertical.png` são propostas: nenhum código os lê hoje.
- **Ferramenta de imagem do dev.** Não se sabe se ela faz inpainting, aceita referência, exporta fundo transparente ou chega a 3840 px; por isso A-01 e A-02 trazem as duas vias e B-02 traz a alternativa de fundo liso.
- **Itens exclusivos do 1×1 (R3.5).** Ainda sem id: não há ícone pedido para eles.
