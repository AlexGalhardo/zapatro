# Prompts de concept art Zapatro (ChatGPT)

Prompts para gerar no ChatGPT os concepts do visual do **Zapatro** (antes Zapaço). Regra de ouro: **só peças que dá para produzir com PixelLab.ai (sprites em pixel art) e Inkscape (SVG com formas simples)**. Nada de cena ilustrada, textura, luz ou profundidade.

- **PixelLab** faz: retratos dos personagens e ícones pequenos, em quadrados de tamanho fixo, fundo sólido ou transparente.
- **Inkscape/SVG** faz: fundo, mesa, painéis, botões, cartas, texto, sidebar. Só retângulos, retângulos arredondados, círculos, linhas e texto Roboto.

## Layout (vale para todas as telas de jogo)

- **Mesa em cruz, 4 jogadores sempre paralelos:** você embaixo, parceiro em cima, rival à esquerda, rival à direita. Cada jogador é o mesmo bloco repetido (retrato + nome + cartas), girado só em posição, nunca em ângulo. Cartas dos rivais e do parceiro são versos alinhados em linha reta (os da esquerda e da direita ficam em coluna). Cartas jogadas vão para o centro, uma por jogador, também em cruz.
- **Sidebar à esquerda** (estilo Malandro e Balatro): cartões empilhados com os números. **A mesa não tem número nenhum**, só cartas, falas (balões) e ações dos personagens.
- **Fundo neutro padrão:** cinza-grafite chapado `#2B2B2B` em toda a tela, sem cena, sem gradiente. A mesa é um retângulo arredondado de feltro chapado no centro.
- Fonte oficial: **Roboto** (Regular no corpo, Bold em títulos e botões).

## Como usar

1. Uma conversa nova por grupo (telas, personagens, ícones). A primeira mensagem é o **STYLE BLOCK** + o bloco do grupo + o prompt do item.
2. Uma imagem por mensagem. Correção: "Keep everything identical except …".
3. Salve como `references/concept-art/zapatro/<nome>.png`. Depois: retratos e ícones vão para o PixelLab (tamanhos na tabela); o resto é redesenhado em SVG no Inkscape.
4. Recuse: gradiente, sombra suave, textura, brilho, cena de fundo, texto extra ou errado, logo real, personagem parecido com IP conhecida, carta com naipe ou valor errado, pixel art borrada.

```text
STYLE BLOCK
UI concept for ZAPATRO, a roguelite card game of Truco Paulista (Brazilian 2v2). It must be buildable from simple shapes only.
Two layers:
1) FLAT VECTOR for background, table, panels, buttons, cards and text: solid fills only, no gradients, no textures, no glow, no blur, no 3D. Only rectangles, rounded rectangles, circles and straight lines. Same corner radius everywhere. Shadows are one solid darker offset shape, nothing else.
2) PIXEL ART only for character portraits and small icons: crisp square pixels, 1 px dark outline, flat shading with at most 16 colours per sprite, no anti-aliasing, no dithering, no blur, plain solid backdrop. Pixel size is the same across the whole image.
Background of every screen: flat neutral dark grey #2B2B2B.
Palette (only these plus one tint/shade each): grey bg #2B2B2B, panel #3A332E, panel dark #231C17, gold #F4C542, felt green #24644D, card cream #F8F0DE, text cream #F6EEDC, red #D2392F, green #47B468, blue #3F7FC0, teal #2FA7B8, vermilion #E4572E.
Font: Roboto. Text only in Portuguese (Brazil), only the strings listed, spelled exactly.
Avoid: scenery, props, real brands, logos, known characters, photo-realism, any text not listed.
```

```text
SCREEN BLOCK (add for full screens)
16:9 canvas, 1920×1080. Left sidebar 380 px wide: stacked rounded cards separated by 12 px gaps, with a bottom bar of three square icon buttons. Right of it, the table: one felt rounded rectangle filling the whole remaining area (see TABLE BLOCK). The grey background shows only as the 16 px margin and in non-table screens.
```

```text
TABLE BLOCK (add for table screens)
The felt is ONE rounded rectangle that fills the ENTIRE area to the right of the sidebar, edge to edge: 16 px margin to the sidebar, the top, the right and the bottom of the screen, nothing else around it, no grey strip, no slots or buttons outside it. It has a thin darker-green border, no texture, no wood. The buttons sit INSIDE the felt. There are NO empty slots or placeholder squares anywhere.
FOUR players in a perfect cross, all parallel to the screen edges, nothing rotated: you bottom centre, partner top centre (his character card almost touching the top border of the felt, 12 px gap), rival left centre, rival right centre. The THREE other players (partner top, rival left, rival right) each have a CHARACTER CARD: a 128×128 pixel-art portrait (1 px dark outline, rounded corners, solid colour backdrop, clear expression) with the name plate (Roboto Bold) fused under it, fully visible and never covered by cards. Next to each card: 3 card backs in a straight row (top) or a straight column (left and right). No caption or description text under any character card, only the name plate. YOU (bottom) have NO character card, NO portrait and NO name: the bottom of the table shows ONLY your 3 big FACE-UP cards in a slight fan, centred. Played cards sit in the middle of the felt in a plus shape, one per player (the bottom one is yours), each on the side of its player. The VIRA card (the turned-up card that defines the manilha) is drawn face up, normal card size, in the TOP-LEFT corner of the felt, 24 px from the corner, with the small label "Vira" under it. A cream rounded speech bubble with a small triangle tail sits next to one character card. The sidebar is TEXT ONLY: no portraits and no faces in the sidebar, only a pixel-art coin next to money. No numbers on the felt.
```

```text
CHARACTER BLOCK (add for characters)
Pixel art character card, 128×128 sprite (shown at 1x, or 4x = 512×512 for review), square, solid flat colour backdrop, bust, front view, strong readable silhouette (hat, hair, moustache, glasses), Brazilian countryside caricature from the interior of São Paulo, diverse skin tones, expressive faces. Few big shapes, flat shading, max 16 colours per sprite. No cyberpunk, no neon, no implants, no sci-fi. No text, no frame, no scenery.
```

## Telas

| Arquivo | Origem | Prompt |
|---|---|---|
| `screen-table` | SVG + PixelLab | SCREEN BLOCK + TABLE BLOCK. Sidebar cards top to bottom: "Boteco do Zé" with "mesa 1/4"; "banca de Pedrão" with a big gold number and a bar; "a conta da mão" with a blue block "0" × red block "0"; "a mão vale" "1" "sem truco"; "tentos" with 12 small empty ovals; "bolso" "$4" with a pixel-art coin. Names: "Dona Cida" (top), "Pedrão" (left), "Tião" (right); no name for the bottom player. Four buttons stacked at the bottom right INSIDE the felt: "Truco" (red, key "T"), "Enviar Sinal" (blue, key "S"), "Desistir" (grey, key "C"), "Esconder" (dark, key "E"). Vira card face up at the top-left of the felt. Sidebar bottom bar: book (gold, active), list, gear. |
| `screen-table-speech` | SVG + PixelLab | Same, with 4 cards played in the plus shape and a cream speech bubble (rounded rectangle with a small triangle) next to the partner: "Tá na mão, parceiro." |
| `screen-table-truco` | SVG + PixelLab | Same, sidebar card "a mão vale" filled vermilion "3"; bubble next to the left rival "TRUCO!" in red; buttons "Aceitar" (green, A), "Desistir" (grey, C), "Seis" (red). |
| `screen-score` | SVG | Same table dimmed with a flat dark overlay; centre panel: teal block "45" × vermilion block "6", "= 270" in gold, title "Vaza Limpa". |
| `screen-menu` | SVG + PixelLab | Neutral grey, no sidebar. Left: title "ZAPATRO" big gold Roboto Black, buttons "Nova run" (Enter), "Continuar", "Partida rápida", "Almanaque", "Regras", "Configurações", "Sair". Right: 3 flat cards fanned (4 of clubs, 7 of hearts, Ace of spades). "v1.0.0" bottom centre. |
| `screen-partner` | SVG + PixelLab | "Escolha seu parceiro". 4 square 128×128 pixel-art character cards in a row (Tonhão, Dona Cida, Zé Malandro, Juninho), name, one gold line, green button "Jogar com ele(a)"; pickers "Baralho Normal" and "Estaca 1" with ◀ ▶. |
| `screen-select` | SVG + PixelLab | SCREEN BLOCK, sidebar "Campeonato 1" and "bolso $4". Three tall flat cards "Mesa pequena" (green), "Mesa grande" (gold), "Chefe" (red, boss portrait), each with "Meta 110", "$3", button "Jogar" (Enter). |
| `screen-shop` | SVG + PixelLab | Title "Balcão do Seu Zé". 4 flat item cards with pixel-art icons and red price buttons "$5" "$3" "$3" "$3"; 3 smaller pack cards "Pacote"; buttons "Renovar $5" and "Próxima mesa" (Enter). |
| `screen-pack` | SVG | "Escolha 1", 3 flat cards, "Pular" (Esc). |
| `screen-guide` | SVG | "Guia" panel: left index "A mão", "Truco é no grito", "A conta"; right text block, gold heading, "4 · 5 · 6 · 7 · Q · J · K · A · 2 · 3" in big bold, close "×". |
| `screen-pause` | SVG | Table dimmed, centre panel "Pausa": "Continuar" (green, Esc), "Configurações", "Sair da mesa" (red). |
| `screen-settings` | SVG | "Configurações", three dark columns: "ÁUDIO E VÍDEO" (sliders "Volume geral", "Música", "Efeitos"), "INTERFACE" ("Idioma ‹ Português (BR) ›", "Reduzir piscadas"), "JOGO E SISTEMA" ("Controles…", "Exportar save", "Importar save", "Voltar" red, Esc). |
| `screen-controls` | SVG | "Controles": rows "Jogar carta 1/2/3", "Truco", "Aceitar", "Correr", "Sinal", "Pausa"; keycaps as rounded squares "1" "2" "3" "T" "A" "C" "S" "Esc". |
| `screen-almanac` | SVG + PixelLab | "Almanaque": tabs "Manhas", "Chefes", "Parceiros", "Feitos"; grid of pixel-art icons, detail panel right, "Voltar" (Esc). |
| `screen-run-end` | SVG + PixelLab | "Fim da run", stats "Mesas 7", "Melhor mão 1.240", "Campeonato 3", pixel-art trophy, "Nova run" (Enter), "Menu" (Esc). |

## Mesas (3 variações; só muda a cor do feltro, o resto é idêntico a `screen-table`)

| Arquivo | Prompt |
|---|---|
| `table-boteco` | `screen-table` with felt green #24644D. Sidebar title "Boteco do Zé". |
| `table-bar-estrada` | `screen-table` with felt blue #2F5C86. Sidebar title "Bar do Posto". |
| `table-garagem` | `screen-table` with felt red #8E2F2A. Sidebar title "Garagem do Tonhão". |

## Personagens (CHARACTER BLOCK, PixelLab 128×128)

Parceiros e rivais; uma imagem por mensagem.

| Arquivo | Personagem |
|---|---|
| `char-tonhao` | Tonhão, big bearded man, 40s, red shirt, loud grin. |
| `char-dona-cida` | Dona Cida, grandmother, grey bun, round glasses, lilac cardigan. |
| `char-ze-malandro` | Zé Malandro, thin trickster, thin moustache, straw hat, sly smile. |
| `char-juninho` | Juninho, teenager, cap backwards, braces, excited. |
| `char-ze` | Zé, bar owner, apron, bald, moustache, towel on shoulder. |
| `char-bia` | Bia, young woman, curly afro hair, yellow top, focused look. |
| `char-joca` | Joca, farmer, checkered shirt, cap, sunburnt. |
| `char-lurdes` | Lurdes, middle-aged woman, flower in the hair, festive dress. |
| `char-tiao` | Tião, old man, cowboy hat, big white moustache. |
| `char-neide` | Neide, woman 50s, short hair, earrings, knowing smile. |
| `char-pedrao` | Pedrão, dock worker, yellow-and-green football jersey, red beanie, anchor tattoo, shouting. |

Expressões: `neutral`, `happy`, `angry`, `sweat`, uma por mensagem ("Same character, now with expression: …"), salvas como `char-<nome>-<expressão>`.

## Chefes (CHARACTER BLOCK + coroa ou insígnia vermelha no canto, PixelLab 128×128)

| Arquivo | Chefe |
|---|---|
| `boss-valentao` | O Valentão, muscular, tank top, scar on eyebrow. |
| `boss-cartomante` | A Cartomante, headscarf, hoop earrings, tarot cards. |
| `boss-juiz` | O Juiz, black robe, gavel. |
| `boss-agiota` | O Agiota, gold chain, sunglasses, wad of money. |
| `boss-delegado` | O Delegado, cap with badge, moustache. |
| `boss-professor` | O Professor, glasses, tweed jacket. |
| `boss-irmaos` | Os Irmãos, two identical twins side by side. |
| `boss-mudo` | O Mudo, finger on lips, dark hoodie. |
| `boss-sortuda` | A Sortuda, four-leaf clover pin, lucky dice. |
| `boss-rei-truco` | O Rei do Truco, gold crown and cape, holding the 4 of clubs. |

## Cartas (só SVG)

| Arquivo | Prompt |
|---|---|
| `card-faces` | Flat card faces 2:3, cream #F8F0DE, rounded corners, one big suit shape in the centre, rank top-left and bottom-right in Roboto Bold: 4 of clubs, 7 of hearts, Ace of spades, 7 of diamonds. Suits as simple geometric shapes. No figures. |
| `card-back` | Card back: red #D2392F, cream rounded frame, a simple repeated diamond pattern, gold circle with "Z" in the centre. |
| `card-manilha` | Same face with a gold border and a small gold tag "ZAP". |

## UI e ícones

| Arquivo | Origem | Prompt |
|---|---|---|
| `ui-buttons` | SVG | Flat rounded buttons: green, red, blue, neutral, disabled grey; each with a keycap (dark rounded square) at the right edge ("Enter", "Esc", "T"). |
| `ui-sidebar` | SVG | Only the sidebar (380×1080) with all cards in the sample state of `screen-table`. |
| `ui-icons` | PixelLab 16×16 | Pixel-art icon set at 8x, plain backdrop: gear, book, door, arrow back, speaker, coin, star, lock, trophy, crown, skull. |
| `ui-signals` | PixelLab 32×32 | Partner signal faces, 6 round faces: wink, kiss, raised eyebrow, tongue out, three fingers, shrug. |
| `icons-manhas` | PixelLab 32×32 | One badge icon per message: "Malandro", "Mão de Lixo", "Seu Zé", "Pé-Quente", "Gritador", "Zap Zap", "Cangaceiro", "Rei da Mesa" (next names in the same conversation). |
| `app-icon` | PixelLab + SVG | 1024×1024: pixel-art 4 of clubs tilted with a gold star on a flat rounded-square felt background. |
