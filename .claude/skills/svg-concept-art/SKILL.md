---
name: svg-concept-art
description: Load at the start of every Zapatro session and use whenever a screen, character, icon or UI piece is created or fixed from a pixel-art concept/mockup — writing the ChatGPT prompt for a missing mockup, measuring it on the 640×360 grid, cutting sprites, vectorizing with pixels2svg into art-src/concept/*.svg, rasterizing and laying the scene out on the concept's pixels. Covers references/concept-art/, src/data/concept-art.ts, scripts/concept-art.*, scripts/concept-raster.ts, art-src/concept/, src/view/concept-stage.ts, and the visual bugs in BUGS.md. Keep its "Lessons" log current.
---

# svg-concept-art

**Só vale na branch `pixel-art`:** nesta linha (Art Bible v2, [docs/visual.md](../../../docs/visual.md)) o pipeline concept → pixels2svg saiu; os retratos vêm de `scripts/portraits.ts` e o resto é vetor por código. O fluxo antigo (fluxo, máscaras, como o jogo usava) ficou no `docs/visual.md` da branch `pixel-art`. Bugs e mockups pendentes: **[BUGS.md](../../../BUGS.md)**. Carregue também `karpathy-guidelines` e `ponytail`.

**Regra desta skill:** toda sessão que aprender algo do pipeline (armadilha, parâmetro que funcionou, bug visual e a causa) acrescenta uma linha datada em **Lições** abaixo, no mesmo commit. É assim que o próximo agente erra menos.

## Pipeline em uma tela

```text
ChatGPT Plus (prompt de BUGS.md)  →  references/concept-art/<tela>.png   (16:9, versionado)
bun run concept:art                →  art-src/concept/<chave>.svg         (pixels2svg 0.2.3, fonte da verdade)
bun scripts/concept-raster.ts      →  public/assets/concept/<chave>.png   (sharp, gerado no dev/build, gitignored)
cena: addConceptArt + fitCamera    →  posições = pixels do concept na grade 640×360
```

## 1. Mockup que falta: prompt para o ChatGPT

Uma conversa nova por mockup. Primeira mensagem: **STYLE BLOCK + GEOMETRY BLOCK** (abaixo), mais o **SEATING BLOCK** em toda imagem com personagens à mesa, + o prompt do item em BUGS.md (seção "Mockups"), em inglês, começando por `NOW GENERATE THIS IMAGE`. Anexe o concept já aprovado mais parecido (`references/concept-art/menu-16-9.png`, `table-boteco.png`, `settings.png`) para manter o estilo. Correções: "Keep everything identical except …". Recuse: texto extra ou errado, logo real, gradiente/brilho suave, pixel de tamanho variável, personagem que lembre IP conhecida, cartas com naipe/valor errado.

```text
STYLE BLOCK
Purpose: a mockup of one screen of ZAPATRO, a pixel-art roguelite of Truco Paulista (Brazilian 2v2 card game) set in a warm neighbourhood bar (boteco) of the São Paulo countryside at dusk.
Rendering: true pixel art on a strict square grid, every art pixel the same size across the whole image, no anti-aliasing, no blur, no soft gradients, no glow, no mixed pixel sizes. 1-pixel dark outlines on characters and panels. Light from above-left, warm lamp light.
Palette: warm wood browns, felt green table, cream cards, tile floor in terracotta and cream, gold accents for focus and titles, red/green/blue buttons only for raise/accept/run. No pure black, no neon.
UI: chunky wooden panels with brass corners and riveted frames, readable bold text, gold border on the focused element. Buttons same family as the attached main menu.
Text: only the strings listed in the prompt, spelled exactly, in Portuguese (Brazil).
Avoid: real brands and logos, known characters, photo-realism, 3D render look, any text not listed.

SEATING BLOCK (every image with people at the card table)
All three AI players sit AT the same green card table as the player, on its top, left and right sides. Never at a separate side table, bar counter or stool away from it. Each one is pulled close to the table, torso leaning forward, both forearms or elbows resting ON the table's wooden rim, cards held above the felt. The table rim covers everything below the waist: no legs, hips or seat of a chair are visible, so no body floats on a chair and no legs are missing. Chair backs may show behind them. Left and right players face the centre of the table in three-quarter view; the top player faces the camera. The player (first person) is only two hands at the bottom edge.

GEOMETRY BLOCK
A 640 by 360 pixel-art canvas shown enlarged exactly 3 times to 1920 by 1080 (each art pixel is a 3 by 3 block). Panels and buttons sit on multiples of 4 art pixels. Keep the same layout grid as the attached screen: title band y 8–40, content y 48–320, bottom hint bar y 336–352. Version label "v1.0.0" small, bottom centre.
```

## 2. Medir na grade 640×360

Recorte ampliado com grade, num scratchpad:

```bash
uvx --with pillow python -I - <<'PY'
from PIL import Image, ImageDraw
x,y,w,h,s=250,100,140,90,6   # região do concept em pixels 640×360 e o zoom
im=Image.open('references/concept-art/<tela>.png').convert('RGB').resize((640,360),Image.BOX)
c=im.crop((x,y,x+w,y+h)).resize((w*s,h*s),Image.NEAREST); d=ImageDraw.Draw(c)
for gx in range(x-x%10+10,x+w,10): d.line([((gx-x)*s,0),((gx-x)*s,h*s)],fill=(0,255,255)); d.text(((gx-x)*s+1,1),str(gx),fill=(255,255,0))
for gy in range(y-y%10+10,y+h,10): d.line([(0,(gy-y)*s),(w*s,(gy-y)*s)],fill=(0,255,255)); d.text((1,(gy-y)*s+1),str(gy),fill=(255,255,0))
c.save('<scratchpad>/zoom.png')
PY
```

## 3. Declarar e gerar

1. Salve o PNG em `references/concept-art/<tela>.png` (16:9; versionado).
2. Declare a tela em `CONCEPT_ART` (`src/data/concept-art.ts`): `bg`, `erase` (tudo que o jogo desenha por cima) e `sprites` (`rect`, `wipe`, `fill`, `mask`, `erase`, `nine`, `cast`, `room`).
3. `bun run concept:art -- --only <tela> --preview <scratchpad>/prev` → confira cada PNG (folha de contato) antes de usar. Sempre com `--only`: a geração completa reescreve os SVGs de todas as telas.
4. Na cena: `addConceptArt(scene, key)` + `trackZoom(scene, cam, (v) => fitCamera(cam, v))`; posições = pixels do concept; texto em `src/i18n` (EN + PT-BR) em Rubik negrito; cores sampleadas em `PALETTE.concept*`; `Button` com `skin` para botões do concept.
5. Verifique: screenshot 1280×720 (zoom 2) lado a lado com o concept reduzido, **ultra-wide 21:9 (2560×1080)**, 20:9 e 4:3, PT-BR, modo toque; `bun test`, `bun run check`, `bun run typecheck`, smoke e o grupo do QA da tela.
6. Docs no mesmo commit: `docs/visual.md`, BUGS.md (item `[x]` com data e commit), CHANGELOG, **Lições** desta skill.

## Regras

- O SVG em `art-src/concept/` é a fonte da verdade; os PNGs são gerados. Não edite PNG nem SVG à mão: mude o spec e rode `concept:art`.
- O build não roda Python; só `sharp`. O `concept:art` precisa de `uv` (pixels2svg, OpenCV, Pillow, SciPy, NumPy fixados no script). pixels2svg é GPL-3.0: só ferramenta de build.
- Uma paleta por tela (`colors` 128; 256 quando há cores pequenas saturadas).
- Nada rotacionado na GPU perto de NineSlice/Text (Phaser 4.2.1): pré-rotacione no canvas como `tilted()` em `TableScene`.
- Não mude a origem do save nem nada de plataforma por causa de uma tela.

## Lições (acrescente no topo, com data)

- **2026-10-15** — Overlay sobre uma cena viva (pausa): declare a tela **sem `bg`** e recorte só as peças; botões que trocam de cor no foco dividem o mesmo tamanho de slot (nine-slice) para o dourado caber em qualquer linha. Painel mais largo que a placa: `mask: 'poly'` (a `corners` deixou o feltro nos cantos). (BUGS.md M-01)
- **2026-10-15** — O menu insere um ZWNJ entre "f" e "i" (`noLigatures`): regex de QA que procura "Configurações" precisa de `Conf‌?igurações`.
- **2026-10-15** — Nunca sobrescreva um concept já implementado: os recortes de `src/data/concept-art.ts` foram medidos nele. Salve a versão nova como `<tela>-v2.png`; a troca acontece no commit que refaz o spec. (Na 2ª leva o Bar de Estrada novo foi salvo por cima do `table-boteco.png` e teve de ser restaurado do git.)
- **2026-10-15** — Nas folhas de personagem, o ChatGPT acrescenta uma frase descritiva, repete a mesma faixa de amostras em todas, redesenha a pose nas versões 2×/1× e põe marcas reais (escudo de seleção, logo de banda, cédula de Real). O prompt de M-07 agora proíbe cada uma; recuse a folha que vier assim.
- **2026-10-15** — "Estender para 21:9 mantendo o centro idêntico" não basta: o ChatGPT recompõe a cena em outra escala. Anexe o 16:9 e peça para colá-lo sem mudar a escala, pintando só as faixas laterais; confira o miolo pixel a pixel antes de aprovar.
- **2026-10-15** — `Texture.add()` do Phaser troca o frame padrão (`firstFrame`) da textura quando ele ainda é `__BASE`: depois de criar frames numa textura de concept, devolva `firstFrame = '__BASE'`, senão `add.image(x, y, key)` desenha o frame recortado (a arte some).
- **2026-10-15** — Sem instrução explícita o ChatGPT põe os rivais laterais em mesinhas separadas, "sentados" numa cadeira sem pernas (corpo flutuando). Todo prompt com personagens leva o **SEATING BLOCK**: todos na mesma mesa, antebraços apoiados na borda, a borda da mesa esconde a cintura para baixo. (BUGS.md B-13)
- **2026-10-15** — Pedir duas imagens num prompt só ("Image A … Image B") faz o ChatGPT juntar as duas lado a lado numa imagem espremida, cada metade em retrato. Uma imagem por mensagem, sempre 16:9.
- **2026-10-15** — Um mockup novo salvo por cima de um concept já implementado (`settings.png`) invalida os retângulos de `src/data/concept-art.ts` dessa tela: refaça o spec antes de rodar `bun run concept:art`, ou o SVG sai com recortes errados.
- **2026-10-15** — Mockups costumam trazer linhas, abas e opções que o jogo não tem (Configurações: dicas de carta, emotes, UI compacta, resetar progresso, créditos). Elas saem do fundo com `erase`; não implemente opção nova só porque apareceu no mockup.
- **2026-10-15** — Telas mais largas que 16:9 (monitor 2560×1080) mostram o "espelho escurecido" da arte nas laterais: personagens, ⚙/☰ e texto aparecem duplicados e invertidos, e o espelho quase não escurece. Espelho só serve para faixas finas; para ultra-wide, prefira estender o fundo (bordas sem conteúdo dinâmico) ou barras escuras com textura. (BUGS.md B-02)
- **2026-10-15** — Personagens sem recorte de concept usam o retrato antigo em 2× e ficam borrados ao lado da arte nova: cada personagem precisa da própria folha de concept (prompt em BUGS.md) antes de ir para a mesa.
- **2026-10-15** — O leque com polegares foi desenhado para 3 cartas; com 2 ou 1 carta os polegares seguram o vazio. Cada contagem de cartas na mão precisa da sua pose (mockups pedidos em BUGS.md).
- **2026-10-15** — Telas ainda sem concept (Controles, Pausa, Regras, seleção de mesas) destoam muito das que já têm: priorize-as antes de polir as prontas.
- `corners` só funciona com contorno escuro fechado; moldura clara encostada no recorte some → recorte justo sem máscara ou `poly`.
- `wipe` precisa de uma coluna **de dentro** do painel sem texto (a coluna da moldura listra o painel).
- `grabcut` sem `poly` pega cadeira e parede da mesma cor; com `poly` o resultado fica limitado à silhueta.
- Texto sobre degradê ou miolo grande (carta da loja, selo, toggle): `fill` (cor mediana do anel) em vez de `wipe`; inpainting em área grande deixa um "X" borrado.
- No fundo, **não apague** o que o jogo sempre desenha no mesmo retângulo (abas, botões fixos): o sprite cobre. Apague retângulos justos (cartas uma a uma), nunca uma faixa que inclua as frestas entre elas.
- Cores pequenas saturadas (botões verdes, molduras roxas) somem com 128 cores: use `colors: 256` na tela.
- Meça com zoom de 1 px (grade a cada 2 px) antes de cortar botões: 2–3 px de erro aparecem como faixa de outra cor na borda.
- Sala nova de mesa: tela com `room` (`thumbs`, `offsets`) e personagens com `cast`; ligue em `tableRoom()` (`TableScene`).
- O traçado do pixels2svg (`find_contours`) é O(n²) e não termina em 640×360: o script usa as peças do pacote e encadeia segmentos por dicionário (docs/visual.md §4).
