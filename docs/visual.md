# Art Bible v3 — Zapatro (pintura + vetor; base v2 híbrida)

**Vale a §0 (v3, 2026-10-27).** O texto a partir da §1 é a base v2 de 2026-10-24 e fica como referência de layout, medidas e cores da UI. A v2 substituiu a Art Bible anterior (pixel art 640×360, cena de boteco, PixelLab e pipeline concept → SVG), que ficou na branch `pixel-art`. As imagens de referência estão em `references/concept-art/zapatro/` e os prompts em [prompts-new-concept-art-using-pixel-art.md](../prompts-new-concept-art-using-pixel-art.md) (histórico: a fonte atual das pinturas é `art-src/gta/`).

Regra de ouro (v3): **personagens, fundos, versos e cartas especiais são pinturas; cartas comuns, painéis, botões e ícones vetoriais são desenhados por código; os ícones de UI são pinturas no estilo GTA VI (folha em `references/concept-art-gta/icons.png`).** Os princípios de UI do Balatro (legibilidade, hierarquia, "juice") inspiram; nunca copie arte, logo, fonte, layout ou paleta de terceiros. A identidade é de boteco do interior paulista, nas pessoas, nas cores quentes e nos nomes.

## 0. Art Bible v3 (2026-10-27): "verão tropical, pôr do sol"

A v3 troca a identidade de pixel/chapado por **arte pintada** (cores saturadas, pôr do sol laranja → rosa → roxo, turquesa do mar, Havaí/praia brasileira), inspirada só no *estilo* dos materiais de lançamento de jogos atuais: nada de logo, nome, marca ou personagem de terceiros. Onde esta seção contradiz §1, §2, §6 e §7 (que descrevem a v2), **vale a v3**. A UI (painéis escuros de cantos arredondados, sombra sólida, botões, números grandes) e a fonte Rubik continuam; layout e regras da mesa (§5) não mudam.

| Elemento | v3 | Origem e arquivo |
|---|---|---|
| Cards dos personagens | pintados, 3:4, sem a faixa do nome nem a borda (o nome vem do i18n) | `art-src/gta/char-*.jpeg` → `public/assets/gfx/card/<id>.webp` (480×640); textura `img.card.<id>`; usado na escolha de parceiro |
| Retrato quadrado (mesa, regras, Almanaque, LAN) | busto pintado, suave (nunca nearest) | mesmos JPEG → `public/assets/gfx/portrait/<id>.webp` (256×256); `registerPortraits` desenha com filtro suave quando o bitmap é maior que 128 px |
| Cards dos personagens em todo o jogo | todo personagem aparece como **card retangular 3:4** (chave `charcard.<id>`, `src/art/flat.ts`): a arte pintada, ou, sem ela (os 8 chefes em pixel), o retrato pixel inteiro e sem esticar, centrado sobre a cor `bg` do personagem. Usado nos assentos da mesa (54×72 + faixa do nome), escolha de parceiro, rivais e chefe da run, fim de run, Almanaque e Regras. Ficam quadrados só ícones: assentos do lobby LAN (32 px) e as caras das expressões da página de sinais das Regras | `src/art/flat.ts`, `scripts/portraits.ts` |
| Carta coringa | a face é `card-joker.png` (2:3, o texto JOKER vem na imagem), com o mesmo tamanho e tratamento do verso (`back/joker.webp`); sem a imagem, o desenho vetor de antes | `src/art/flat.ts`, `scripts/portraits.ts` |
| Retratos ainda em pixel art | o chefe `juiz` (o Zé, a Sortuda e o Rei do Truco já são pintados); seguem 128×128 PNG, nearest | PNG já gerados em `public/assets/gfx/portrait/`; os pixel antigos do elenco em `art-src/backup-pixel/` (pendência: arte nova, PLAN §1.4.4) |
| Fundos | pintados, 1920×1080 WebP, camada `BackdropScene` embaixo de todas as telas (nunca cinza), escurecidos por um tinte único (`BACKDROP_BRIGHTNESS` = 0,4 em `palette.ts`); as telas de jogo sorteiam entre 6 pinturas (`VARIANTS` em `BackdropScene`: background-1 `partner`, background-2 `street`, background-3 `main`, background-4 a 6 `bg4`/`bg5`/`bg6`; as que a primeira tela não usa carregam depois) a cada mesa nova e a cada run nova, os overlays mantêm a pintura da mesa e a loja fica fixa em `shop`; o menu principal tem o próprio | `art-src/gta/*` → `public/assets/gfx/bg/{main,street,bg4,bg5,bg6,shop,partner,table,menu-1..3}.webp` |
| Verso das cartas | pintado (palmeiras e mar), o `card-1` **inteiro** (2:3, com a moldura dele; só os cantos escuros saem por uma máscara arredondada), desenhado na altura da carta e centrado: o verso de 48×64 fica um pouco mais estreito que uma face (42,7 px), sem recorte nem distorção; o verso das mãos dos NPCs (`card.back.tile`) é 32×48, exatamente 2:3 | `public/assets/gfx/back/{default,interior,blefe}.webp` (`card-1`, `card-2`, `card-3`); os baralhos `dinheiro` e `viciado` seguem o verso vetor tingido |
| Mesa | feltro pintado (`bg/table.webp`, cantos arredondados em alfa) no retângulo `FELT`; Campeonatos 4 a 8 tingem o feltro de azul e vermelho | `board-game-1.jpeg` |
| Menu principal | pintura em tela cheia como no concept: `menu-1..3` (proporção própria, 1920 px de largura) com crossfade de 0,5 s a cada 7 s; ←/→ e os pontinhos trocam. A pintura ajusta a altura da tela e fica no canto superior esquerdo (até 6% de ampliação para preencher a largura; o logo pintado sempre cabe); a sobra à direita em telas mais largas é o fundo `main`, com a borda esfumada. O logo pintado fica à vista (é igual em todo idioma) e os botões reais do jogo cobrem os pintados, na mesma posição, largura, altura e passo (`MENU_GEO`, medido por imagem); o botão a mais (Multiplayer na rede local) estende a coluna para baixo | `src/view/menu-backdrop.ts`, `src/scenes/MenuScene.ts` |
| Títulos de tela | um helper só (`addTitle`/`screenTitle` em `src/ui/title.ts`, textura `titleTex` em `src/art/title.ts`): gradiente vertical da cor do título (ouro `manilha`, topo +30%, base −22%), contorno escuro grosso (11% do tamanho), extrusão sólida de 12% do tamanho para baixo num tom escuro da mesma cor e sombra suave por baixo; rasterizado no zoom da tela. Títulos pequenos de card ficam como texto | `TITLE_LOOK` em `src/art/title.ts` |
| Texto com profundidade | todo texto ganha sombra num tom escuro da própria cor, por tamanho lógico: ≥10 deslocamento 1 px + desfoque 2 + contorno fino; 7–9 deslocamento + desfoque leve; ≤6 só desfoque leve; texto escuro sobre botão claro, borda clara sutil (gravado); números claros ≥12 com gradiente vertical. Aplicado no gancho do `scene.add.text` (`installCrispText`); texto feito sem sombra de propósito (balões, selos com fundo) fica como está | `TEXT_LOOK` em `src/ui/text-depth.ts` |
| Painéis com profundidade | `drawPanel` e `panelTex` com o look dos botões: gradiente da cor do painel (+7% / −8%), highlight de 1 px no topo, borda escura fina, sombra sólida e sombra suave 2 px abaixo; painéis internos (sem sombra) só gradiente, highlight e borda | `PANEL_LOOK` em `src/config/ui.ts` |
| Mesa: layout (2026-10-27) | sidebar: bloco HUD no topo (slots de Manha espalhados na largura e encolhendo numa linha com Mais Manha, Fama, nossos tentos, quedas), Meta, Fichas × Mult, Aposta, Tentos deles e o rodapé de botões, 4 px entre cards; card "Campeonato N / Mesa 1 · Mesa 2 · Chefão" (EN "Table 1 · Table 2 · Boss"; partida rápida: "Partida rápida") no canto superior direito do feltro; caixa "em jogo" na base do feltro (no máximo as 2 linhas mais novas). Escondidos por flag: caixa Manilha/ZAP (`SHOW_MANILHA_BOX`) e card de dinheiro (`SHOW_MONEY_PANEL`), em `src/config/features.ts` | `src/scenes/TableScene.ts` (`SIDE`, `HUD`, `CHAMP`) |
| Site | `background-2` sob um véu escuro, 3 larguras de WebP por breakpoint | `scripts/site-build.ts`, `site/app/globals.css` |

**Resoluções-alvo** (palco lógico 640×360, zoom pela altura): desktop otimizado para 1920×1080 (47,91% dos jogadores) e 2560×1440 (27,04%), ambos 16:9; Android em paisagem, telas de 6,5\"+ (~20:9, de 2400×1080 a 3200×1440) em modo toque. Ultrawide (2559×999) e 16:10 (1280×800) só não podem quebrar. O menu é conferido em todos eles (`docs/media/gta-after/01-menu-*.png`).

No toque, a escolha de parceiro sobe o título e alonga os três cartões para o texto (estilo, vantagem, defeito e o botão) caber dentro de cada um; com ponteiro o bloco continua centrado. Os tentos da mesa são 12 bolinhas em 4 fileiras de 3, com folga até o risco do meio. A loja desenha as 4 ofertas dentro da lousa, altas o bastante para a grade 2×2 chegar perto do rodapé da lousa (cada carta não fica mais larga que alta): faixa da raridade (creme, azul, roxo, laranja, sem a palavra) com ícone e nome, o bônus e o contra no centro, e o preço numa barra na base do cartão. "Próxima mesa" fica no canto inferior direito da tela, fora da lousa.

Pipeline: `bun scripts/portraits.ts` gera tudo acima a partir de `art-src/gta/` (originais versionados; `references/` é ignorado pelo git). Não há expressões pintadas: o retrato é um só por personagem (a chave `portrait.<id>.<expr>` ignora `<expr>`, como na v2). Fundos e cards entram pelo `BootScene` (`img.bg.*`, `img.card.*`, `img.back.*`); sem a imagem, a tela cai no fallback (fundo cinza `bgNeutral`, retrato desenhado, verso vetor).

Telas e peso (WebP): cards 10 × ~60 kB, retratos 10 × ~27 kB, fundos 8 × ~190 kB, versos 3 × ~50 kB.

## 1. Identidade em três frases

1. Uma mesa de feltro chapada no centro, quatro jogadores em cruz paralela, uma coluna de cartões escuros à esquerda com os números grandes.
2. As pessoas são pixel art (retratos 128 px com contorno de 1 px); todo o resto é forma vetorial chapada com uma sombra sólida.
3. Fundo neutro cinza-grafite: nada de cena, textura, gradiente ou luz.

Proibido na v2 (a v3 libera pintura nos fundos e personagens e o gradiente dos botões): gradiente, sombra suave, textura, brilho, cena de fundo, pixel art escalada em fator não inteiro, vetor "pixelado", texto embutido em imagem, iconografia de cassino, cigarro aceso, marcas reais e personagem parecido com IP conhecida.

## 2. Pixel art × vetor

| Elemento | Técnica | Tamanho lógico | Fonte |
|---|---|---|---|
| Retrato de chefe e do Zé | pixel art, 1 px de contorno, até 32 cores, sem AA (os companheiros pintados: `portrait/<id>.webp` 256×256, desenhados suaves) | 128×128 (bitmap em `public/assets/gfx/portrait/<id>.png`; a mesa o desenha em círculo de 64 px, `AVATAR`, e a escolha de companheiro, maior) | `char-*.png` → `bun scripts/portraits.ts`; O Mudo: `art-src/portrait/mudo.png` (PixelLab) |
| Sinais secretos | emoji do sistema (piscada, sobrancelha, boca torta, língua, morder o lábio, olhar para cima) | texto Phaser com a fonte de emoji do aparelho | `SIGNAL_EMOJI` em `src/data/characters.ts`; o mesmo emoji no manual, na escolha, na mesa e no aviso do parceiro antes do truco |
| Ícones de UI | pintura (estilo GTA VI) | 24×24 lógicos (bitmaps de 32 px em `public/assets/gfx/icon`) | `references/concept-art-gta/icons.png` (folha 8×4) → `bun scripts/icons.ts`; os 8 que a folha não tem (lista, doc, refresh, monitor, upload, download, nota, pausa), vetor em `src/art/icons.ts` |
| Ícone do app | pixel art + fundo vetor | 1024 | `app-icon.png`, `art-src/app-icon.svg` → `bun run app-icons` |
| Fundo, mesa, painéis, botões, balões, barras | vetor por código (`src/art/flat.ts`): retângulos arredondados, círculos, linhas; raio igual em toda a tela; sombra = uma forma escura deslocada 3 px | palco 640×360 | `screen-*.png` |
| Cartas | vetor por código: creme, índice nos cantos, naipe grande central; sem figuras | 48×64 | `card-faces.png`, `card-back.png` |
| Texto | fonte única (hoje Rubik; ver §4) | — | todos os concepts |

Os retratos não têm expressões: só `neutral`. O sinal do rival e o humor viram selo circular de 22 px (raio 11, sobre o retrato) e balão.

## 3. Paleta (vive em `src/config/palette.ts`)

| Papel | Hex | Token |
|---|---|---|
| Fundo da tela (só fallback na v3, sem a pintura) | `#2B2B2B` | `bgNeutral` |
| Painel / painel escuro | `#30261F` / `#231C17` | `panel`, `panelDark` |
| Dourado (títulos, foco, manilha) | `#F4C542` | `manilha`, `money` |
| Feltro verde / azul / vermelho | `#24644D` / `#2F5C86` / `#8E2F2A` | `felt`, `feltBlue`, `feltRed` |
| Creme (carta e texto) | `#F8F0DE` / `#F6EEDC` | `cardFace`, `textLight` |
| Fichas | `#3F7FC0` | `chips` |
| Mult | `#E4572E` | `mult` |
| Truco / perigo | `#D2392F` | `truco` |
| Aceitar | `#47B468` | `good` |
| Botão Sinal | `#2FA7B8` | `signal` |
| Botão neutro (madeira clara) / desabilitado | `#DCC8A8` / `#C8C2B9` | `buttonLight`, `buttonOff` |
| Verso de carta | vermelho com moldura creme e "Z" dourado (um verso só) | `cardBack` |

**Botões claros, texto sempre escuro** (pedido do dev, 2026-10-25): todo botão escreve em `textDark` (`#2A1D14`). O `Button` recebe a cor de destaque e a passa por `buttonFill()` (`palette.ts`), que mantém matiz e saturação e só clareia até o texto escuro ter contraste ≥ 5:1 (`BUTTON_INK_CONTRAST`, acima do mínimo AA de 4,5:1); o hover/foco (`buttonHover`) clareia mais um passo. Resultado (preenchimento · hover, contraste com o texto):

| Destaque | Antes (texto) | Preenchimento | Hover/foco |
|---|---|---|---|
| neutro | `#52443A` (creme, 8,1) | `#DCC8A8` 10,0 | `#E6D8C1` 11,7 |
| `panel` / `panelDark` (secundário) | `#30261F` / `#231C17` (creme) | `#A68975` 5,0 | `#B49C8B` 6,3 |
| `good` (confirmar) | `#47B468` (creme, 2,3) | `#47B468` 6,2 | `#5FC07C` 7,3 |
| `truco` (perigo) | `#D2392F` (creme, 4,2) | `#DE6D66` 5,1 | `#E48983` 6,4 |
| `bad` | `#E5533D` (creme, 3,2) | `#E86753` 5,1 | `#EC8372` 6,3 |
| `calm` (neutro azul) | `#3F7FC0` (creme, 3,6) | `#5E93CA` 5,1 | `#79A5D3` 6,3 |
| `signal` (sinal) | `#2FA7B8` (creme, 2,5) | `#2FA7B8` 5,7 | `#3DBCCD` 7,2 |
| `cta` | `#E8862A` (creme, 2,3) | `#E8862A` 6,1 | `#EB984A` 7,1 |
| `manilha` (aba ativa) | `#F4C542` (escuro, 10,1) | `#F4C542` 10,1 | `#F6CF64` 10,9 |

Pressionado usa o preenchimento normal. Desabilitado: `#C8C2B9` com o texto a 60 % (`#695F56` efetivo, 3,5:1). O selo de tecla continua escuro (`panelDark` com texto creme, 14,6:1) e se destaca sobre qualquer preenchimento (5,2:1 no mais escuro). Ícones vetoriais creme sobre botão recebem a mesma tinta escura (`inkIcon` em `src/ui/Button.ts`); os ícones em pixel art ficam como são. Os tokens `button`/`buttonHover` continuam sendo a madeira escura de pacotes e tipos de item em `flat.ts`.

**Preços no balcão** (2026-10-25): o botão de preço é madeira clara (`buttonLight`) quando o dinheiro paga e fica desabilitado (cinza) quando não paga; clicar nele mesmo assim toca o som de erro e mostra "dinheiro insuficiente" (`onBlocked` do `Button`). Vermelho fica só para perigo (truco, sair, voltar). O "Renovar" segue a mesma regra. O Enter não aparece como selo fixo em nenhum botão: só o botão focado mostra a tecla que confirma.

Feltro por sala: verde nos Campeonatos 1–3, azul 4–6, vermelho 7–8. Raridade por borda e nome (nunca só por cor); modo 4 cores (♦ laranja, ♣ verde) continua.

## 4. Fonte

Fica **Rubik** (`@fontsource/rubik`). Os concepts usam Roboto; trocar exige `@fontsource/roboto`, uma dependência nova que aguarda aprovação do dev (decisão P-04 do review). Até lá, as medidas de texto não mudam.

## 5. Layout da mesa (16:9, palco 640×360)

- **Sidebar esquerda** (token `SIDEBAR`: x 8, 132 px lógicos, a mesma coluna da tela da run), cartões de raio `RADIUS.panel` (8), congelada: Campeonato · Mesa / Meta com barra de Pontos / Fichas × Mult / Aposta / Tentos deles / $; na mesa de chefe, o cartão de topo traz o nome do chefe e a regra. Os cartões vão do topo do feltro (y 6) à base (354), 4 px entre eles, rótulo a 9 px da borda esquerda e 7 px do topo; a barra inferior com 3 botões (Configurações, Pausa e Manhas em lista) termina rente à base do feltro. Subtítulos longos encolhem para caber numa linha. Nada mais entra nela.
- **Feltro**: retângulo arredondado que ocupa toda a área à direita da sidebar, margem 6 px. O centro da mesa (mão, cruz de cartas jogadas, contagem, mão de 11, fim de mesa) é o centro do feltro, x 390; contagem e fim de mesa têm 228 de largura, entre as colunas de versos dos rivais, e os botões dos modais 24 de altura. A linha de status fica à esquerda da sua carta jogada (centro x 256, y 240, até 210 de largura, quebra linha), para nenhuma carta cobri-la.
- **Cruz paralela**: você embaixo (só o leque de 3 cartas, sem retrato), parceiro em cima, rivais à esquerda e à direita; cartas jogadas em cruz no centro; vira no canto superior esquerdo do feltro, só com o rótulo "VIRA" sob ela. Manilha e ZAP (e, quando houver, manilhas saídas e a carta fora do jogo) ficam num bloco no canto inferior esquerdo do feltro, uma informação por linha, a `PAD.panel` das bordas e com `PAD.card` interno; o bloco cresce para cima. Na Cartomante mostra "Manilha: ?" até a 1ª vaza. O parceiro (retrato, versos e balão) termina 16 px (2 × `GAP.panel`) antes do bloco HUD.
- **Bloco HUD no canto superior direito do feltro**: Manhas (5 slots de 20×20 a cada 22 px, nº de slots segue a run), Fama, Tentos NÓS (ovais) e Quedas deles (texto e pontos), tudo a 5 px das bordas do bloco. Painel `#231C17`, raio 8, sombra sólida, 118 px de largura e 80 de altura, borda direita em x 628 (6 px dentro do feltro).
- Botões de ação empilhados no canto inferior direito do feltro, com selo de tecla à direita; a coluna tem a mesma borda direita do HUD (628) e o último botão termina 6 px acima da base do feltro, sombra incluída.
- Balão de fala: creme, cauda triangular apontando o retrato, sempre dentro do feltro (o do parceiro quebra a linha antes do HUD). Falam os NPCs: o "TRUCO!" de quem pediu e as falas curtas de aceitar, correr, manilha, vaza, empate, mão de 11, mão de ferro, queda e sinal flagrado (uma por evento, nunca por cima de outro balão).

Vocabulário próprio (nada do jogo Malandro): "Campeonato 1 · Mesa Pequena", "Meta", "Fichas × Mult", "Aposta", "Tentos deles", "Regras". Strings proibidas em `src/i18n`: `banca`, `a conta da mão`, `a mão vale`, `sem truco`, `bolso`, `Boteco do Zé`, `mesa 1/4`, `Guia`, `Truco é no grito`, `Pedrão`, `malandragens` (exceção: a Manha `malandro`).

Estado da implementação (2026-10-24): todas as telas de referência foram refeitas com as medidas dos concepts (escala 640/1672 = 0,3828): mesa (sidebar, retratos em cartão com plaquinha, tiles de versos, cruz de cartas, coluna de ações, balões, contagem), menu, escolha de companheiro (3 cartões), seleção de mesas, balcão, pacote, almanaque, regras, configurações e controles; a pausa e o fim de run foram refeitos por código no mesmo estilo. Onde o concept mostra uma ilustração que não existe (a cena dos rivais na seleção de mesas, os itens da loja), o jogo mostra os retratos e os ícones que já tem. Os ícones de `ui-icons.png` viram pixel art (`bun scripts/icons.ts`); os que não estão na folha (carrinho, lista, refresh, controle, monitor…) são formas vetoriais (`src/art/icons.ts`) até haver pixel art deles.

## 6. Cartas

- Face: creme, raio 4, índice nos cantos, um naipe grande central; sem J/Q/K ilustrados.
- Manilha e ZAP: face normal + borda dourada de 2 px + placa dourada 24×8 no rodapé (`manilhaPlate` em `src/art/flat.ts`, chaves `card.<valor>.<naipe>.m` e `.z`): "ZAP" na carta ZAP (a de paus duas acima da vira) e ★ nas quatro manilhas, com texto `panelDark`. A placa fica à esquerda do centro, entre o naipe central e o índice invertido do canto inferior direito, para não cobrir nenhum dos dois. Assim a manilha se lê sem cor (escala de cinza, daltonismo). O pulso dourado e as faíscas do ZAP continuam por cima.
- Coringa: matiz roxo `jokerPurple`, índice "JK".

## 7. Personagens

Histórico v2 (na v3 o elenco, o Zé, a Sortuda e o Rei do Truco são pintados; ver §0): 20 retratos 128×128, todos de `references/concept-art/zapatro/char-*.png` (convertidos por `bun scripts/portraits.ts`), exceto O Mudo (PixelLab). Pedrão (`char-pedrao.png`) não entra: nome do jogo Malandro e camisa com escudo.

| Id | Papel | Observação |
|---|---|---|
| `tonhao`, `donaCida`, `zeMalandro`, `juninho`, `ze`, `bia`, `joca`, `lurdes`, `tiao`, `neide` | companheiro | parceiro ou rival (GDD §8) |
| `valentao`, `cartomante`, `juiz`, `agiota`, `delegado`, `professor`, `sortuda`, `reiDoTruco` | chefe | |
| `mudo` | chefe | gerado no PixelLab com o STYLE BLOCK e `juiz.png` como referência de estilo |

O fundo chapado de cada PNG é recortado nos cantos (alpha); o jogo pinta o fundo do retrato por baixo. **Regra: cada personagem tem a sua cor de fundo** (identidade, como a camisa), definida no campo `bg` de `LOOKS` em `src/art/flat.ts` (`FALLBACK` para ids sem entrada). O retrato da mesa (`drawAvatar`) é um quadrado arredondado nessa cor (chefes com moldura vinho), e as telas do `RunScene` que desenham o fundo à parte (escolha de companheiro, fim de run) leem a mesma cor por `portraitBg(id)`. Personagem novo ganha uma cor própria em `LOOKS`, distinta das vizinhas na mesa.

## 8. Telas de referência

| Imagem | Define | Status |
|---|---|---|
| `screen-table`, `-truco`, `-speech` | layout da mesa, sidebar, balões, botões com tecla | seguir, com os rótulos de §5 |
| `screen-score` | painel de contagem (Fichas azul × Mult vermelhão = total dourado) | seguir |
| `table-bar-estrada`, `table-garagem` | feltros azul e vermelho | seguir |
| `screen-menu` | menu neutro, título dourado, leque de 3 cartas | seguir, com as 8 linhas do jogo |
| `screen-partner` | cartões 128 px, nome, linha dourada | seguir com 3 cartões e vantagem/defeito |
| `screen-select`, `screen-shop`, `screen-pack`, `screen-almanac`, `screen-guide`, `screen-settings`, `screen-controls` | estilo das telas | seguir o estilo e usar os dados reais do jogo |
| `screen-pause`, `screen-run-end`, `ui-sidebar`, `ui-buttons`, `card-manilha` | — | **não seguir** (estilo antigo ou inválidos) |
| `ui-icons`, `icons-manhas-malandro`, `card-faces`, `card-back`, `app-icon` | ícones, selos, cartas, ícone do app | seguir (sem cigarro, sem a célula "ZAP" dos ícones) |

Os textos nas imagens são placeholders: o jogo escreve os reais (EN + PT-BR).

## 8.1 Tokens de UI (`src/config/ui.ts`)

Fonte única dos números de interface, em px lógicos do palco 640×360 (cores em `palette.ts`, tipo em `src/ui/font.ts`, tempos da mesa em `TABLE_TIMING`):

| Token | Valor | Usado em |
|---|---|---|
| `RADIUS` | painel 6 · botão 5 · carta 4 · selo 3 | `drawPanel`, `Button`, cartas de `flat.ts` |
| `SHADOW` | painel 3 · botão 2 · hover sobe 1 · pressionado deixa 0,5 de sombra (sólida, sem blur) | `drawPanel`, `Button` |
| `DEPTH` | camadas por papel na mesa (formas do HUD 0,5 · valor da aposta 2 · vinheta 4 · cartas jogadas 6 · status 7–8 · Manhas 9 · controles 10 · fala 20 · sinal 21 · banner 30 · contagem 32 · popup 34 · mão de 11 35 · dicas 36 · fim 40) e toast 100 | `TableScene` e `toast.ts` |
| `MOTION` | hover 80 ms · botão 70 ms · fade de cena 160 ms · modal 250 ms | `item-card.ts`, `Button` |

Estados do `Button`: normal (sombra sólida de 13 % da altura, entre 2 e 4 px; preenchimento em gradiente vertical derivado da `color`, topo 12 % mais claro e base 12 % mais escura, brilho de 1 px no topo e borda escura fina), hover (sobe 1 px, um tom mais claro, contorno dourado), foco (igual ao hover, com o selo da tecla que confirma, se os selos estiverem ligados), pressionado (afunda a profundidade toda, a sombra some e o gradiente se inverte; soltar fora cancela) e desabilitado (`buttonOff`, texto a 60 %). A sombra fica parada e o bloco desliza entre as alturas em `MOTION.press` (70 ms, ease-out, sem escala nem bounce). Teclado, controle e cliques por código (`click()`) mostram o mesmo afundar e executam a ação ao fim dos 70 ms; com "Reduzir piscadas" ligado a troca é instantânea e a ação sai na hora. Os valores são os que o jogo já usava; a proposta da revisão (raio 8/6) não foi aplicada para não mudar o layout.

## 9. Mantidos da versão anterior

Palco lógico 640×360 com zoom inteiro pela altura; cartas 48×64; selos de atalho em todo botão com tecla, opcionais e desligados por padrão (Configurações > "Mostrar teclas de atalho"); modo toque (`src/ui/touch.ts`); modo 4 cores; paisagem fixa; tempos de animação em `TABLE_TIMING`; `pixelArt: false` com antialias.

## 10. Checklist de revisão de asset

- [ ] Pixel art só em múltiplos inteiros; sem gradiente, textura ou brilho.
- [ ] Texto fora da imagem, EN e PT-BR em `src/i18n`.
- [ ] Cores vêm de `PALETTE`; nada só por cor.
- [ ] Nenhuma marca, escudo, cassino ou cigarro aceso.
- [ ] Alvos de toque de pelo menos 44 px no modo toque.
