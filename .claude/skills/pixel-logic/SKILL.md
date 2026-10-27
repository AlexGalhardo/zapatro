---
name: pixel-logic
description: "Knowledge base from \"Pixel Logic\" by Michael Azzi (2022 edition). Use when drawing, generating (PixelLab), prompting, reviewing or cleaning up Zapatro pixel art — 48×64 card faces, backs and modifier overlays, 48×48 portraits with 10 expressions, 96×96 bosses, 48×48 Manha/Simpatia/Lance icons, 16×16 UI icons, nine-slice wood panels and buttons, 640×360 rooms and concept→SVG cut-outs — and when deciding sprite size, outline type, palette and colour ramps, anti-aliasing (none in Zapatro), dithering (none on cards), perspective, sub-pixeling or frame budgets. Triggers on: pixel art, sprite, card face, portrait, icon, palette, outline, jaggies, banding, anti-aliasing, dithering, sub-pixel, animation frames, readability at 1x."
---

# Pixel Logic

> **Zapatro, Art Bible v3 (2026-10-27):** o jogo na `main` não usa mais pixel art para personagens, cartas nem fundos (pinturas em `art-src/gta/`, skill `game-art-assets`). Este livro só vale para os ícones de UI da folha (`ui-icons.png`), os 8 retratos de chefe ainda em pixel e a branch `pixel-art`.
**Author**: Michael Azzi (Michafrar) | **Pages**: ~242 | **Chapters**: Introduction + 9 | **Generated**: 2026-10-10

## How to use

- **Before creating an asset** → read *Core rules*, then the *Decision rules* table for the choice at hand (size, outline, palette, AA, dithering, perspective, frames).
- **While drawing or writing a generation prompt** → follow *Workflow*; state canvas size, perspective, outline type and palette budget explicitly.
- **When reviewing an asset** (hand-made or AI-generated) → run the **Checklist** of each relevant chapter and name defects with the author's terms (jaggies, banding, pillow shading, mixels, tangents, lazy lines, line boiling).
- **For depth on one topic** → jump to its chapter block under *Chapters*.

Project context: **Zapatro**, a Truco Paulista roguelite on a boteco table seen from above: 640×360 logical canvas with integer zoom, cards 48×64, portraits 48×48, bosses 96×96, icons 48×48 and 16×16, screens rebuilt from pixel-art mockups vectorized with pixels2svg. The art bible `docs/visual.md` wins over this book where they differ (no AA, alpha 0/255, light from top-left, 1 px hard shadow). Rules marked "(inferred)" are not stated by the author.

## Core rules

1. **Total control.** Every pixel is intentional. Hand-correct anything a tool or generator produces; scale only by whole numbers; never mix pixel sizes or rotated pixels (**mixels**).
2. **Consistent lines.** One line width (usually 1 px). Every straight diagonal uses one step length; curve steps progress without reversing. A short row squeezed between longer rows is a **jaggy**.
3. **No banding.** Two same-length pixel rows hugging each other make blocky curves and lead to **pillow shading**. Add or remove a pixel or two, or darken the AA.
4. **AA sparingly.** 1–2 shades, about half the step length, inside the sprite. No light AA on the outer contour unless the background is known to be dark.
5. **Small hue-shifted palettes.** Lights toward yellow, darks toward purple; ramps share colours; 2–3 shades per ramp on small sprites; about 16 colours per sprite including transparency; tinted darks instead of pure black.
6. **Readability first.** Size the sprite for the smallest feature that must read. Clear silhouette, 1 main + 1 contrasting sub colour, spacing between features, no tangents. Test at 1x, blurred, on the real background, and with an uninformed viewer.
7. **Isometric = stairs of 2 pixels** (26.5°, not 30°). Build grid-aligned tiles as lineless filled diamonds; keep terrain flat-stepped.
8. **Animation lives in key frames.** Strong silhouettes per key; loops need at least 3 frames; in-betweens favour the keys; sub-pixel only in-betweens tighter than 1 px, never the face.

## Applying it to Zapatro

- **Canvas and scale (Ch 0).** Fixed: 640×360 logical, integer zoom by height (2× at 720p, 3× at 1080p), `pixelArt: true`, `roundPixels`. Sizes per category are fixed in `docs/visual.md` §2.1 (card 48×64, portrait 48×48, boss 96×96, icon 48×48, UI icon 16×16, trophy 32×32, background 640×360). Never scale by fractions; a portrait shown at 2× must be redrawn or cut from the concept, not stretched beside 1× art (mixels).
- **Card faces (Ch 4, readability first).** The smallest feature that must read is rank + suit in the corners at 1× on a 20:9 phone; everything else (centre pip or boteco figure for J/Q/K) is secondary. Suits are distinguished by shape first, colour second (♥ ♦ red, ♠ ♣ black; 4-colour mode ♦ orange, ♣ green). Keep 1–2 px of spacing between rank, suit and the frame; no tangents between corner index and border. Modifier overlays never cover rank or suit.
- **Manilha, ZAP, coringa.** Only these glow: manilha = 1 px gold pulsing border, ZAP = multicolour sparks, coringa = `jokerPurple`. Do not spend highlight colours elsewhere on the table, or the special cards stop reading.
- **Portraits (Ch 4).** Each character needs one trait readable at 48 px (hat, glasses, moustache, scarf, cap) and a silhouette that identifies them. The 10 expressions (neutral, happy, angry, sweat + 6 signal faces) share one palette and differ only where the face changes; signal faces must be recognisable without a caption. Eyes are the focus: one shine pixel changes the expression. The partner is the most important face.
- **Icons (48×48 and 16×16).** Reduce each to 1 main colour + 1 contrasting sub colour and a clear silhouette; no embedded text (the game writes EN and PT-BR). Fichas and Mult icons must read by shape, not only blue/red. Never casino iconography (poker chips, roulette, big $).
- **No anti-aliasing (deviation from the book).** The art bible forbids AA, partial alpha and smooth gradients (V5): alpha is 0/255. Smooth curves with consistent staircases and clean clusters instead (Ch 1), and use the book's AA chapter only to understand why a jaggy reads badly.
- **Outline.** PLAN §6 asks for a selective outline with no AA; in the book's terms that is a shaded/coloured outline (darkest shade of each local colour), kept fuller on light card faces (`cardFace` cream on green formica) because sel-out looks jagged on light backgrounds. One outline type for all cards, one for all portraits and icons; no black inlines.
- **Palette and ramps (Ch 3).** Master palette of 48–64 warm colours (`art-src/palette/master.hex`), tokens in `src/config/palette.ts`, one reduced palette per concept screen (128 colours for tables and menu, 256 for shop, settings and deck). Hue-shift ramps toward fluorescent yellow in the lights and warm purple-brown in the darks; tinted darks (`suitBlack` is a near-black, not #000). Reserved hues keep their role: blue = Fichas, red = Mult/TRUCO!, gold = focus/manilha/money, purple = Fama/coringa/legendary.
- **Light (Ch 7).** From top-left on every sprite; 1 px hard shadow under cards and objects; the fluorescent lamp makes the table centre brighter than the room edges.
- **No dithering on cards, portraits, icons or anything animated (Ch 5).** Concept art and PixelLab output are reduced to the screen palette without dithering (MEDIANCUT). Texture on wood, formica or tiles comes from stylised clusters or dents, not gradients.
- **Perspective (Ch 6).** Top-down table with the four seats in a cross; cards lie flat on the table; characters are faked toward the camera so faces show ("fake it for clarity"). No isometric grid. The hand fan tilts cards ±6°: tilted cards are drawn by `tilted()` from the upright art; check them at 1× for rotated mixels and broken staircases on the frame.
- **Concept → SVG pipeline (Ch 0, Ch 7).** ChatGPT mockups are rough bases: box-filtered to 640×360, palette-reduced, vectorized with pixels2svg into `art-src/concept/*.svg`, then cut into sprites (skill `svg-concept-art`). Clean-up after the cut: stray pixels on the mask edge, merged colours of touching objects, text wiped from buttons and panels.
- **PixelLab output (inferred from "total control").** Treat every generation as a rough base: check exact size, pixel scale, palette count, alpha 0/255, light direction and staircase consistency, then clean up by hand. `bun scripts/assets-validate.ts` and a screenshot with `bun scripts/shot.ts` at 1280×720 are the 1× and real-background tests.
- **UI panels and buttons.** Nine-slice wood panels (24×24) and plaque buttons (32×16, TRUCO! 96×32) must be uniform horizontally so the slice stretches cleanly; borders at 1 px with consistent staircases at the corners.
- **Animation budget (Ch 9).** Most motion is tweened in code (deal 90 ms, play 220 ms, collect 260 ms per card at 1×), so drawn frames are few: card landing = 2-frame squash, TRUCO! = zoom punch + ≤ 2 px shake, count numbers shake proportionally. Movement in whole pixels; short or no anticipation on player actions; at 4× speed everything must still read. Portrait changes are expression swaps, not in-betweens; sub-pixel idles only if a portrait ever animates, and never on the face.

## Decision rules

**Sprite size and canvas**

| When | Do | Because |
|---|---|---|
| Starting any asset | Fix the canvas first, from a retro resolution | Size drives every later decision |
| Choosing character height | Size for the smallest feature that must read | Detail cannot be squeezed in later |
| Sprite must leave room for the scene | Keep a low sprite-to-screen share (2.5% vs 4%) | Shows more environment |
| Many animations planned | Go smaller (190 px → 130 px) | Faster frames, smoother motion |
| Canvas 32x32 or less | Plan sub-pixel idles | Whole-pixel moves are too coarse |
| Map sprite, battle sprite, icon, portrait | Separate proportions for each | Different functions |
| Exporting | Whole-number scale only | Fractions create mixels |

**Outline style**

| When | Do | Because |
|---|---|---|
| Moving sprites over varied backgrounds | Black contour or shaded outline | Separation, clean look |
| Background always dark/neutral, transparent layer | Selective outline | Edges blend in |
| Background light, mixed or unknown | Solid contour, no light AA | Sel-out looks broken and jagged |
| Cramped interior detail | No inlines; colour and value | Lines waste pixels |
| Backgrounds and tiles | No outline / lineless | Suits backgrounds; avoids chunky crossings |

**Palette and ramps**

| When | Do | Because |
|---|---|---|
| Small sprite | 2–3 colours per ramp | Similar shades are invisible |
| Typical sprite | At most 16 colours incl. transparency | Usual limit; fewer shades animate more easily |
| Building a ramp | Lights toward yellow, darks toward purple; vary saturation | Yellow is brightest, purple darkest |
| Reducing colours | Share darks/highlights, replace greys, drop invisible shades | Harmony at no readable cost |
| Designing a character | 1 main + 1 contrasting sub colour | Recognition |
| Variants of one asset (inferred; Zapatro: 4-colour suits, deck backs, 10 expressions) | Swap one ramp, keep skin, shared darks and the rest of the palette fixed | Follows from main/sub colours and shared ramps |

**Anti-aliasing**

| When | Do | Because |
|---|---|---|
| Faces, small curves, high-contrast edges, text | 1–2 shades, about half the step | Clarity where the eye lands |
| Low contrast, crisp style, tiny sprite | Skip AA | Blurs tiny sprites |
| Outer edge on transparent/unknown background | No AA outside | Light AA shows on the wrong background |
| AA row matches its neighbour's length | Shorten, lengthen or darken | Banding |

**Dithering**

| When | Do | Because |
|---|---|---|
| Large static background gradient, few colours | Low-contrast checkered dithering | Gradient at low colour cost |
| Small sprites, cards, portraits, icons, anything animated | Do not dither | Noise and wobble |
| Material feel on a tile | Stylised dithering or dents | Texture, not gradient |
| Dithered tiles repeat | 2 slightly different tiles | Even sizes cause double pixels |

**Perspective and line ratio**

| When | Do | Because |
|---|---|---|
| Grid game with height | Isometric, 2-pixel stairs (26.5°) | Top + sides visible |
| Card table seen from above (Zapatro) | Top-down table, flat cards, faces faked toward the camera | Readable cards and faces |
| Isometric tile set | Grid-aligned lineless diamonds | Tiles align, no chunky crossings |
| Tall structures hide units | 45° dimetric, 1x1 stairs | Top plane stays flat |
| Exploration / corridors | Top-down / side view | Simplest for each |
| Side sprite → isometric | 87% length, skew 0.5 toward facing, redraw | Keeps equal sides |
| Elevation | Flat steps; slopes in 4 directions only | Easy to draw and program |

**Clean-up order** (inferred from the author's listed aspects): silhouette and proportions → model accuracy → colours and contrast → clusters and stray pixels → lighting → jaggies and banding → AA and line weight → sharpness → 1x, blur and blind tests → compare versions.

**Sub-pixel vs whole-pixel move**

| When | Do | Because |
|---|---|---|
| Fast or large movement | Whole pixels | Sub-pixels unseen and costly |
| In-betweens tighter than 1 px | Duplicate the key and sub-pixel | 1 px is the minimum drag |
| Face/eyes | Hold or step whole pixels | Morphing eyes distract |
| Few colours | Swim full pixels | No new shades needed |
| 45° shapes | Delayed/stretchy pixels, no AA | AA gets messy |

**Frame budgets and timing** (author's rounded values)

| Drawings/sec | Sec per drawing | Frames at 60 FPS | Equivalent |
|---|---|---|---|
| 60 | 0.02 (16 ms) | 1 | one's at 60 |
| 30 | 0.03 (33 ms) | 2 | two's at 60, one's at 30 |
| 24 | 0.04 (42 ms) | 2 | one's at 24 |
| 20 | 0.05 (50 ms) | 3 | three's at 60 |
| 15 | 0.06 | 4 | four's at 60, two's at 30 |
| 12 | 0.08 (83 ms) | 5 | two's at 24 |
| 10 | 0.1 (100 ms) | 6 | three's at 30 |
| 8 | 0.12 (125 ms) | 7 to 8 | three's at 24 |
| 6 | 0.17 (167 ms) | 10 | four's at 24 |

- Minimum loop 3 frames; 4 with one reused breakdown.
- Smear: one frame, about 0.05 s.
- Player actions: little or no anticipation; cosmetic actions: full anticipation.
- Limited action: anticipation → breakdown → overshoot → settle.
- Idle: 2 extremes 1 px apart plus sub-pixelled in-betweens favouring each.

## Workflow

**Making a sprite**

1. Decide canvas, sprite-to-screen ratio, perspective and outline type; identify the smallest feature that must read.
2. Rough it in pixels, or draw large and shrink (keep the sketch on a layer).
3. Establish and test the silhouette.
4. Block flat-colour shapes (shapes on cramped canvases, line art for geometric structures); set the light source.
5. Choose the palette: main and sub colour, tinted darks, hue-shifted ramps sharing colours.
6. Detail one area to lock style and lighting, then go area by area: Flat colours → Shading → Details.
7. Build the outline; chisel jaggies, equalise staircases.
8. Shade in clean clusters; remove banding and pillow shading.
9. Add AA only where it earns its place, 1–2 shades, inside the sprite.
10. Fix spacing, tangents, proportions and perspective with the selection tool.
11. Tune contrast; cut redundant shades.
12. Sharpen: highlights, darker pop pixels, outline line weight.
13. Test at 1x, blurred, on the real background, and with an uninformed viewer.
14. Make multiple versions of doubtful areas; iterate after feedback.

**Animating it**

1. Study references; identify extremes.
2. Plan leading part, overlaps, arcs, frame budget and timing.
3. Rough keys as silhouettes or colour blobs; check each reads alone.
4. Add anticipation (short for gameplay), a breakdown, and an overshoot.
5. Build in-betweens by recycling: duplicate the nearest frame and transform parts.
6. Ease by favouring the keys; under 1 px of spacing, duplicate the key and sub-pixel it.
7. Add drag and settle on hair, capes, weapons; delayed or stretchy pixels at small scale.
8. Add a one-frame smear on the fastest move.
9. Clean up every frame; keep clusters and palette consistent; protect the face.
10. Play back at 1x and real speed; fix boil, colour flashing and single-pixel pops.
## Chapters

### Ch 0 — Introduction (Getting started)

**Core idea:** Pixel art is defined by intent: every pixel is placed or approved by you and no tool decides for you. It is "2D sculpting": lay a base, then chisel and add pixels.

**Rules & techniques:**
- **Total control** — Minimum tools: Pencil (1 px, crisp), Eyedropper, Eraser, Bucket, plus the Selection tool. Use but always hand-correct: Recolour, Line and Rotation tools. Avoid: Blur, soft Brushes, Blurred gradients, automatic Colour settings, Circle tool.
- **Process stages** — Sketch → Line art → Block shapes → Shade → Clean up; starting from lines, shapes or a shrunk sketch are all valid.
- **Start big, then shrink** — When a tiny canvas blocks you, draw in high resolution, shrink to target size, trace and continue in pixels.
- **One layer by default** — Use layers for animation (overlapping parts) and scenes; merge when they pile up.
- **Canvas size** — Decide it at the very start. A good canvas is the maximum resolution of an older console; beginners stay below a GBA screen (240x160). Use tiles as a size ruler for sprites.
- **Sprite-to-canvas ratio** — Metroid II (Game Boy): sprite 1:24, about 4% of the screen, "large", poor for manoeuvring. Super Metroid: 1:38, about 2.5%, shows more environment. Cave Story: 1:300, about 0.33%, minimalist but visible.
- **Whole-number scaling** — Resize only by whole multiples (1x, 2x, 3x); never 125%, 150%, 250%.
- **Mixels** — Never mix pixel sizes or aspect ratios in one piece; rotated art counts ("rotated mixels"). Allowed only for gameplay (aiming arms, smooth 360° rotation).

**Avoid:** uncorrected automatic tools (redo by hand); fractional scaling (use an integer factor); mixels (redraw at native pixel size).

**Checklist:**
- Was the canvas chosen up front against the target resolution?
- Is every element at the same pixel scale, with no rotated mixels?
- Is every upscale a whole-number factor?
- Was every tool-generated line, rotation or recolour hand-corrected?

### Ch 1 — Line art

**Core idea:** Line art appears at some stage whatever your method. Consistent width and consistent "stairs" are what make pixel lines read as smooth.

**Rules & techniques:**
- **Consistent line width** — Same width across the whole sprite. Most pixel art uses 1 px line art; thin lines suit small areas.
- **Jaggies** — Jagged parts of a line or curve. Key rule: do not surround a row of pixels with bigger ones. They are unavoidable while drawing; fixing them is routine.
- **Stairs / staircases** — Every step should have the same number of pixels; the steeper the line, the bigger the step. Do not mix staircases: a 1-pixel step inside 2-pixel steps is a jaggy.
- **Curves** — (inferred from the figure's intent) step lengths change progressively, e.g. 4-3-2-1-1-2-3-4, never back and forth.
- **Chisel, don't redraw** — Draw the line in one stroke, then chip away or add pixels; nudge segments with the selection tool.
- **HD overlay test** — Imagine or draw a smooth HD line over the pixels; mismatches are jaggies. "Pixel perfect" brush modes help but need hand finishing.
- **Lines are everywhere** — Any edge where 2 shapes meet, including shadow edges, is a line and needs the same clean-up.
- **Outline types** (the main style decision):
  - **No outline** — solid shapes, nothing separating sprite from background; handy for backgrounds.
  - **Black inline** — black outline plus black internal lines; an 8-bit solution that now tends to look muddy.
  - **Black contour** — black on the outer edge only; makes moving sprites stand out and look clean, popular on small handheld screens.
  - **Coloured outline** — each part outlined in the darkest shade of its own colour; one solid colour per block.
  - **Shaded outline** — outline carries shading and a visible light source; the most common type, works on light or dark backgrounds (GBA–NDS Pokémon sprites).
  - **Selective outline (sel-out)** — shaded outline with deliberate gaps/AA; see Ch 8.
- Softer or thicker outlines need more anti-aliasing.

**Avoid:** mixed staircases (equalise steps); a short row between longer rows (redistribute pixels); accidental thick corners (chisel to 1 px); black inlines on small sprites (separate forms by colour).

**Checklist:**
- Is line width consistent?
- Does each straight diagonal use one step length?
- Do curve steps progress without reversals?
- Is one outline type applied consistently across all assets?
- Are internal shape and shadow edges jaggy-free?

### Ch 2 — Anti-Aliasing

**Core idea:** AA places intermediate-colour pixels in the corners of a line or shape to bridge 2 colours. It is optional and controlled, and worst when it simply mirrors the edge it softens.

**Rules & techniques:**
- **When necessary** — Clarity (faces, eyes); Detail (small curves are more jagged than big ones); High contrast (bridge 2 strongly contrasting colours); Line weight.
- **When not** — Low-contrast colours, simple styles, deliberately crisp styles, shapes that already read at 1x. Typography always benefits.
- **Trade-offs** — Anti-aliased: smooths small-sprite curves, necessary for large sprites, enables sub-pixel animation; costs work and blurs tiny sprites. Aliased: more readable small sprites, fewer colours, faster; jagged and blocky. Without AA, base colours matter more.
- **How many blocks** — About half the length of the line being softened; too little beats too much.
- **How many shades** — One to practise, two for smoother results, three only with colours to spare; a mix of 1 and 2 is recommended.
- **Flat curves** — Longer steps = longer AA and more shades of AA. Common in large art, rare in small sprites.
- **45° lines** — AA is rare and unnecessary with few colours. If used: **convex curves** are light in the centre and dark at the ends; **concave curves** dark in the centre and light at the ends. Lighter pixels round the sides, darker pixels form the tip.
- **Jagged lines** — Imagine the ideal line, fill the biggest gaps first; smaller gaps get a lighter colour.
- **AA inside, not outside** — AA looks good inside the sprite and bad outside; fuller outlines are better. Light AA on an outline stands out on light backgrounds, so keep the contour solid unless the background is known to be dark (p. 50, 197).
- **Line weight** — DARK = THICKER, LIGHT = THINNER, even at 1 px. Lighter pixels at a tip imitate a tapering stroke.
- **Colour bonus** — AA adds perceived colour: within a 4-colour sprite limit (Game Boy Color) maximise it.

**Avoid:**
- **Banding** — Two rows of pixels of the same length hugging each other: blocky curves, lines thicker than intended, blurred outline and, when it follows the outline, **pillow shading**. Fix: remove a pixel or two from the edge, add a pixel or two, or use darker shades of AA.
- **Parallel banding** — Several bands stacked in parallel rows; keep moving pixels until rows stop aligning.
- **Over-AA** — Blurs toward vector art; cut to 1–2 shades.
- Judging while zoomed in — banding shows at 1x and 2x.

**Checklist:**
- Is AA limited to 1–2 shades (3 at most)?
- Is each AA run about half the step it softens?
- Is no AA row the same length as the row beside it?
- Is the outer contour free of light AA unless the background is guaranteed dark?
- Does a blur test show no bands?

### Ch 3 — Colour

**Core idea:** Build small, reusable palettes of ramps that shift hue and saturation as well as value. Colour sets mood, defines style and is the first readability tool.

**Rules & techniques:**
- **Colour picking** — Work in Hue / Saturation / Value. In RGB: equal values give pure grey; bringing sliders together dulls.
- **Why make palettes** — Speed, organisation and easier animation: the more shades, the harder to animate, and colours must not flash between frames.
- **Colour ramps** — Ordered shades of one colour. Keep the count low by sharing colours between ramps; shared colours create harmony.
- **Hue shifting ("coloured shadows")** — Shift hue along the ramp. Yellow is the brightest hue and purple the darkest, so highlights go toward yellow and shadows toward purple. Amount is preference.
- **Multiply layers** — Overlay a blue/green/magenta multiply layer and eyedrop the results.
- **Saturation shift** — Hue sets atmosphere; saturation highlights a zone of the shading (saturated shadows with dull highlights, the reverse, or one saturated shade).
- **Black tones** — Avoid pure black unless truly necessary; use dark brown, deep purple, dark green or dark grey. Purely aesthetic.
- **Using greys** — Under a tinted light a desaturated grey reads as the local colour; use greys to substitute and blend colours in limited palettes.
- **Shadows** — Tint them and complement the highlight; saturated highlights, slightly desaturated hue-shifted shadows (Cocefi).
- **Ramp size by sprite size** — For small sprites one ramp of 2–3 colours is enough; two similar colours are indistinguishable (Syosa, whose shared shadow is purple RGB(84,58,84)).
- **Contrast** — Readability is the #1 priority (Paul Veer). Give each character 1 main colour and a contrasting sub colour for extra features; separate details by colour, not black lines.
- **Mood** — Blues, purples, teals read cold/sad; reds, oranges, yellows warm/happy; greys neutral.
- **Limited sprite palettes** — Transparency counts as 1 colour; 16 colours is usually the limit for most sprites. Worked reduction: 24 → 20 (greys replaced by skin tones, a barely visible dark dropped) → 15 (skin fused with brown hair, one highlight shared by green and teal, invisible AA removed) → 10 (darkest shades fused). Below 10 that sprite degraded; no universal number.
- **Scene palettes** — Reuse colours across unrelated objects, but objects sharing a colour must not touch or they merge.
- **Extreme limitation** — Reorder a fixed ugly palette by perceived luminosity and treat it as one ramp; extend with dithering.

**Avoid:** value-only shading (add hue/saturation shift); pure black everywhere; near-identical shades (merge); same colour on touching objects; details defined by black lines; trusting one monitor's brightness.

**Checklist:**
- Is there 1 main colour and a contrasting sub colour?
- Do ramps shift hue and saturation across values?
- Is every colour distinguishable at 1x?
- Is the sprite within budget, transparency included?
- Are darks tinted?
- Do touching objects differ in colour?

### Ch 4 — Readability

**Core idea:** Readability is clarity: how easily a viewer understands what you drew. Small sprites lack detail, so recognisable features, silhouette, colour and spacing carry everything; every pixel matters.

**Rules & techniques:**
- **Size determines focus** — Big sprites need clean lines and solid drawing; small sprites need recognisable features. Adapt the design to the size.
- **Choosing sprite size** — Find the smallest part that must be visible (animated mouth, hands, facial expression, a gem in a sword) and derive the minimum size from it (Ellian).
- **Size vs animation cost** — Cryamore cut a ~190 px model to 70% (~130 px): smaller sprites animate faster, look more fluid and swap costumes more easily, at the price of detail.
- **Simple shapes** — At 16x16 one 2 px line turned a "random box" into a Game Boy. About 6x6 pixels of eyes and hair distinguished the whole Kunio-kun cast.
- **Blind test** — Ask someone with no pixel art knowledge what it is, without telling them.
- **Hands** — Paint shapes, not lines; mittens first; index finger and thumb define the hand; 3 fingers and a thumb if cramped; separate fingers by value; or draw large, shrink and use as reference.
- **Eyes** — The main focus of a character. If eyes would be under 1 px, omit them and suggest the eye area with shadow. Glasses: draw them without eyes, or only the top of the frame. One shine pixel changes the expression.
- **Proportions** — Big heads give room for expression; realistic proportions rely on body language. Proportions follow function: world sprite, battle sprite, icon and portrait are different drawings of one design (Fire Emblem, Suikoden II).
- **Silhouettes** — Show head, limbs, cloth and the action; sketch the silhouette and fill in. Where features overlap, separate them by colour contrast.
- **Colour design** — Break a character down to 2 or 3 main colours. Wrong colours misread (a bat's orange nose reads as a beak).
- **Light & shadow** — Outlines cost space; let dark tones fill the silhouette and separate features, bright tones mark edges and crucial details.
- **Spacing** — Features that touch become unreadable, like letter-spacing; a mouth needs room above and below. Remove inlines or re-arrange pixels; a 2 px strip is enough to stand out.
- **Tangents** — Avoid edges of different features meeting; move the part that least changes the face.
- **Sprites on backgrounds** — Add outlines; soften background colours; keep foreground sharp and background painterly. Kirby and the Amazing Mirror uses all three.
- **AA and dithering when small** — Moderate AA can help; dithering is "pretty useless" on small sprites.
- **Spotting issues** — Permanent 1x preview; blur test (bad when blurred means fix the pixels; also reveals banding); waifu2x upscale to expose bad curves.

**Avoid:** squeezing concept-art detail into a tiny sprite; inlines in cramped areas; touching or tangent features; misleading local colours; stray dither pixels.

**Checklist:**
- Does a stranger identify the sprite and its action at 1x?
- Does the silhouette alone identify the character/class?
- Is it reducible to 2–3 main colours?
- Do no features touch or form tangents?
- Does it stand out from its background?
- Does it survive the blur test?

### Ch 5 — Dithering

**Core idea:** Dithering mixes limited colours through patterns to fake gradients. It needs space and adds grit; less is more.

**Rules & techniques:**
- **When to dither** — Gradients needing too many colours; things that do not animate; textures; extreme colour limits; backgrounds (skies, space, vast flat areas). Shade with clean shapes first.
- **Smooth (cel) shading** — Better for small sprites, tilesets, readability and animation; weaker on long gradients.
- **Checkered dithering** — Each brightness level between 2 shades has its own pattern (checkers, crosses, squares, diamonds). Never create a "wide pixel" (2x1, two same-colour pixels touching).
- **Curves** — When double pixels appear, select and slide the dither instead of redrawing.
- **Tile sets** — Tiles have even dimensions, so mirrored dither tiles produce double pixels at seams; use 2 slightly different tiles.
- **Contrast** — Dither only between low-contrast colours. Low-contrast cel bands without dithering also hold up (Yoshi's Island sky).
- **Parallel lines / discontinued lines** — Mega Drive-era patterns that blended on CRT output; now stylistic.
- **Dents** — One row of checkerboard, like teeth: texture in little space, not gradients.
- **Intertwined dithering** — Patches woven together; easiest with 2 overlapping layers.
- **Random dithering** — Patternless, usually a filter result; not recommended unless hand-fixed or made into a repeating tile.
- **Stylised dithering** — Custom textured patterns forming a gradient without grit; needs space.
- **Textures vs gradients** — A gradient is light-to-dark; a texture is material feel and needs no gradient.
- **Blending through cel-shading** — A small dithered patch softening one transition; a buffer shade in the ramp does the same.
- **Dither brushes** — Pattern brushes (Aseprite: Ctrl+B) speed it up; fix by hand.

**Avoid:** animating dithering (wobbling frames); dithering small sprites; high-contrast dither; double pixels; stray dither reading as noise; dithered motion blur (obsolete off CRTs).

**Checklist:**
- Is dithering confined to static, large-area assets?
- Are the two colours low in contrast?
- Is the pattern free of double pixels, including tile seams?
- Would a flat or buffer shade do instead?

### Ch 6 — Game Perspectives

**Core idea:** Most 2D game views are pseudo-3D orthographic projections with no vanishing point. Choose the projection that benefits gameplay; the player sees it all game.

**Rules & techniques:**
- **Seven projections** — Multiview: side view, top-down, top. Paraline: isometric, 45° dimetric, oblique. Plus true perspective (illustrations, cutscenes, scaled sprites).
- **Top-down view** — Square tiles, easy world building, suited to exploration; usually seen from above at 45°. Variants: Front > Top (beat 'em ups); Front = Top (easy for tile sets); Top > Front (good for altitude); a "common view" between them. Top view is exactly 90° and lacks depth.
- **Paraline views** — Show 3 sides at all times in true measurement. Isometric: all axes equal (top + sides). Dimetric: 2 axes equal (top plane). Oblique: front flat, rest slanted.
- **Isometric view** — True 30° lines are impossible in pixels, so use stairs of 2 pixels (technically 26.5°). The grid is diamond-shaped and associated with diagonal movement. Reference: Final Fantasy Tactics Advance.
- **Two diamond constructions** — (a) Lines connect cleanly but diamonds do not line up in a square grid: free-form art. (b) Diamonds align perfectly: right for game tile sets, but line crossings are chunky double pixels.
- **Lineless diamonds** — Avoid chunky crossings by drawing each diamond as a filled lineless shape, like a checkerboard. One diamond spans 2 square tiles; adjacent diamonds span 4.
- **Always use a grid** — Free-form isometric backgrounds are hard to turn into a playable map; everything drawn must support collision.
- **Eyeball vs construct** — Construct with guidelines first; eyeball once you know the forms. Primitives: cube; cylinder → stump/barrel; pyramid → roof/tent; cone → tree/tower; sphere → mushroom/bowl.
- **Circle on a plane** — Draw the isometric square and its medians, then fit the oval within; same on vertical planes. Cone/pyramid tip: raise a vertical from the base centre (figure steps not captured).
- **Converting a side sprite to isometric** — (1) Side-scrolling sprite ready. (2) Skew by 30° (0.5). (3) Move parts to add depth. (4) Clean up and fill gaps. Skew toward the facing direction. Shrink the length to about 87% first (cos 30° ≈ 0.866) so the skewed shape keeps equal sides.
- **Terrain** — Keep fields flat with stepped altitudes (cubical platforms, towers, plateaus): easiest to draw and program. Slopes are rare; in Final Fantasy Tactics Advance 2 they appear in only 4 directions because gameplay has 4.
- **45° dimetric (planometric oblique)** — Vertical axis 90°, other two 45°: 1x1 pixel stairs. Good when tall structures must not hide gameplay (SimCity SNES).
- **Oblique** — "Side-scroller + 2 more planes": front on a 90° grid, top and side on 1x1 diagonals (sometimes 2x2, 3x3 or 2x1). Skew a top-down map by 45° to get one.
- **Fake it for clarity** — A truthful top-down view shows only the tops of heads; tilt sprites (about 45°) so faces show.
- **Guidelines for organic forms** — Skeleton of ovals → outline → block shapes → detail and shading → highlights and shadows.

**Avoid:** mixing projections (compare assets side by side); line-drawn aligned diamonds; isometric art with no grid; skewing against the facing; shapes ambiguous from the single visible angle (flip or adjust, ask for feedback).

**Checklist:**
- Do all isometric ground lines use 2-pixel stairs?
- Do tiles align to the grid without double-pixel crossings?
- Do props and characters share the projection?
- Is terrain flat-stepped, slopes only in the 4 gameplay directions?
- Can collision be mapped onto everything?
- Are faces still visible from this camera?

### Ch 7 — Clean Up

**Core idea:** Clean-up is every finishing touch and improvement, at any stage but mostly at the end after feedback. All earlier techniques meet here.

**Rules & techniques:**
- **From rough to clean** — Shape → Refine → Finish (colour blobs; best for in-betweens) or Lines → Colours → Finish. The final sprite may differ completely from the sketch.
- **Lines vs shapes** — On a cramped canvas use shapes; line art mainly serves geometric structures.
- **Adjustment aspects** — Silhouette, Design, Colours, Pixel Shapes, Lighting, Readability.
- **Typical shipped fixes** — Bigger head for detail; more 3D weapon for silhouette; stronger highlights and shadows; less stiff stance; a dark line to make a feature pop; shading corrected to the light source.
- **Cleaner shapes (clusters)** — Same-colour pixels clump into shapes (clusters, clumps, chunks, blocks). Treat each like a mosaic tile; clean shapes read better and make more believable textures. AA softens shapes but will not rescue weak drawing.
- **Lazy lines** — Lines or shapes that describe nothing; remove or give them a job.
- **Multiple versions** — When unsure, make variants and have others vote, or compare after a break.
- **Selection tool** — Move and re-proportion parts instead of redrawing; keep the lasso aliased. Proportions and perspective can be fixed at the very end.
- **Scaling & rotating** — A resized or rotated sprite is a "mosaic" base: eyedrop and redraw the important features. Start big and go smaller.
- **Sharpness** — (1) More light and shadow, less line art, higher contrast. (2) Add highlights. (3) Add darker lines to make things pop. No filters.
- **Order within a sprite** — Flat colours → Shading → Details, area by area; finish one area early to lock style and lighting. Lighter line art at the bottom implies line weight.

**Avoid:** noisy scattered-pixel textures (Lemmings vs Castlevania SotN); stray pixels; shading that ignores the light source; unedited rotation/scale output.

**Checklist:**
- Is every cluster deliberate, with no stray pixels?
- Is the light source consistent, outline included?
- Is the silhouette clearer than the first draft?
- Were rotated/scaled parts redrawn?
- Does it match the model sheet and neighbouring assets' perspective?

### Ch 8 — Sub-Pixeling

**Core idea:** Sub-pixeling fakes thickness or movement smaller than 1 pixel by shifting value and colour into neighbouring pixels. In stills it is AA and line weight; in animation it is sliding AA across duplicated frames (SNK's "0.5 pixel" technique).

**Rules & techniques:**
- **When to use** — Easing in and out; idle animations; giving life to still parts; canvases of 32x32 or less; wind, laughter, shaking, shivering, staggering.
- **Shifting pixels** — Pixels are cups of water: pouring some into the next cup moves the pixel part of a step; value and colour carry over, not necessarily 50%.
- **Reuse colours** — Pick an in-between colour already in the sprite; add new ones only if absolutely necessary. Ideal: 1 or 2 shades of AA.
- **Not every pixel** — Some shift, some move a full pixel, some stay frozen or delayed; shifting everything creates banding.
- **Ghost trails** — A moving line may leave AA behind; never leave light AA on the outline.
- **Split pixels** — A line on a pixel boundary is drawn as 2 pixels each about 50% of its value.
- **Tricking the eye** — AA placement can bend, skew or thin a shape while the outline stays identical.
- **Selective outline (sel-out)** — Only on layers with transparent backgrounds. Best on dark backgrounds, jagged on light ones. On mixed backgrounds: make it fuller and less segmented, avoid it, or use another outline with hints of AA. Dark environments call for darker sel-out pixels.
- **Popping rows** — When a curve gains or loses a row, avoid single pixels: aim for at least 2 to 3 pixels.
- **Direction rule** — Sub-pixeling follows the angle of the shape, not the motion: a horizontal edge sub-pixels horizontally while moving vertically ("waving").
- **Method** — Duplicate a frame, edit slightly, flip back and forth. Set extremes first; sub-pixel only the in-betweens.
- **Believable breathing** — 3 frames of up/down shift look stiff; 4+ timed frames better; best is offset shifts along arcs with easing.
- **Protect the face** — Shift chest and shoulders by 0.5 px while the head holds, or step the face between 2 positions.
- **In-between exposure** — Sub-pixelled in-betweens may look funky but must stay on screen briefly and favour the keys.
- **Arcs** — Diagonal shifts combine vertical and horizontal carries; a 6-frame circular loop fits within 3x2 pixels.
- **Internal motion** — For the subtlest motion the silhouette stays still and pixels "swim" inside; with few colours swim full pixels.
- **Quick but cheap sub-pixels** — Lock colours; resize 200% nearest-neighbour; move 1 px; resize 50% with blur; clean up by hand. Reference only.

**Avoid:** overdoing it (melting/jelly look); treating it as moving shading; shifting every pixel; light AA on outlines; sel-out on light backgrounds; single-pixel pops; onion skin for internal motion.

**Checklist:**
- Is sub-pixeling limited to in-betweens near keys and subtle idles?
- Do its colours come from the existing palette?
- Does shift direction follow each edge's angle?
- Are face and eyes stable?
- Do new rows appear as 2–3 pixels?

### Ch 9 — Animation

**Core idea:** Animation is the study of motion; it relies on readable key frames with strong silhouettes, and more in-betweens never fix weak keys. In games it must feel good as well as look good.

**Rules & techniques:**
- **Study method** — Step through a reference; find the extremes; draw your own breakdowns and in-betweens; stylise.
- **Timing** — On One's / Two's / Three's = each drawing held 1 / 2 / 3 frames; real animation mixes them.
- **Squash and stretch** — Shows weight; conserve the volume; stay on-model.
- **Anticipation** — The "set" in ready-set-go, usually opposite to the action; one frame can be enough. Keep it short or absent for player-triggered actions; use it for cosmetic or wind-up animations.
- **Breakdown (passing position)** — A mid key that bends the path (A → X → B), creating arcs and character.
- **Ease in and out** — In-betweens favour the key. 1 pixel is the minimum drag distance, so tighter in-betweens are a duplicated key edited with sub-pixeling (A*, B*).
- **Moving holds** — A held pose that keeps drifting; extremely rare because it multiplies unique frames. For a regular hold, keep small parts alive.
- **Smears** — In-betweens mimicking motion blur. Elongated smears: on one's at 24 fps (around 0.05 s), felt not seen. Multiples (after-images) suit looping cycles.
- **Overshoots** — Pass the destination and snap or settle back; even 1 pixel is felt.
- **Overlapping action / follow-through** — Overlap = dragging (parts trail the leader); follow-through = settling after the action ends. Animate the leading action first.
- **Delayed pixels / stretchy pixels** — The same idea at pixel scale: neighbours catch up a frame or two later, or stretch to bridge. For 45° shapes use them with no AA.
- **The four methods** — Silhouette animation (flat blobs; large movements); Recycling drawings (copy, resize, slide, rotate, cut, skew, then clean up; keeps the model consistent); Start from traditional (animate large, shrink without blur, reduce colours, up the contrast, sharpen, clean up); Line art (line → colours → shading → clean-up per frame; slowest). Combine silhouette + recycling.
- **Limited frames** — 2 frames only flicker; a convincing loop needs 3 frames minimum, run cycles included. Use a circular path, or 4 frames with one reused (usually the breakdown). Include an anticipation key, a breakdown if possible, an overshoot, and accurate silhouettes.
- **Walk cycles** — Animate the character crossing the screen, tracking foot contacts, then re-centre.
- **Onion skin** — Fine for line art and distant frames; misleading for close, coloured frames. Favour the key.
- **Line boiling** — Jitter from redrawing; caused by in-betweens favouring the wrong frame, motion off its arc, or misaligned sub-pixels. Fix by sliding parts, sub-pixeling tight in-betweens, or using fewer frames.
- **Parallax scrolling** — Nearer layers faster, distant slower, skies barely moving; also usable top-down.

**Avoid:** keys too alike; sliding parts untouched ("tweened", robotic); long anticipation on player actions; smears held too long; redrawing a standing character every frame; too many shades (colours flash).

**Checklist:**
- Does each key read as a silhouette?
- Does every loop have at least 3 distinct frames?
- Is there anticipation and an overshoot/settle where snap is needed?
- Do in-betweens favour the keys?
- Do secondary parts drag, then settle?
- Is there no boil or colour flashing on still parts?

## Glossary

- **AA (Anti-aliasing)** — Intermediate pixels bridging 2 colours to soften jaggies (Ch 2).
- **Anticipation** — Preparatory key, usually opposite to the action (Ch 9).
- **Banding** — Two same-length rows of pixels hugging each other (Ch 2).
- **Binary art / Oekaki** — Aliased drawing without pixel-level intent (Ch 0).
- **Black contour** — Black outline on the outer edge only (Ch 1).
- **Black inline** — Black outline plus black internal lines (Ch 1).
- **Black tones** — Tinted near-blacks replacing pure black (Ch 3).
- **Breakdown (passing position)** — Mid key that redirects the path (Ch 9).
- **Checkered dithering** — Checker patterns, one per brightness level (Ch 5).
- **Clusters (shapes, clumps, chunks, blocks)** — Same-colour pixels read as one shape (Ch 7).
- **Colour ramp** — Ordered shades of a colour, optionally shared (Ch 3).
- **Coloured outline** — Outline in one darker shade of the part's colour (Ch 1).
- **Delayed pixels** — Pixels that catch up a frame or two late (Ch 9).
- **Dents** — Single-row checker dither (Ch 5).
- **Dimetric (45°), planometric oblique** — Two equal axes; 1x1 stairs (Ch 6).
- **Discontinued lines** — Broken parallel-line dither (Ch 5).
- **Dithering** — Pattern-mixing limited colours into gradients (Ch 5).
- **Ease in / out** — In-betweens favouring the key (Ch 9).
- **Extremes** — Keys at the most extreme positions (Ch 8, 9).
- **Favouring** — Drawing an in-between closer to one key (Ch 8, 9).
- **Follow-through** — Parts settling after the action (Ch 9).
- **Hue shifting (coloured shadows)** — Changing hue along a ramp (Ch 3).
- **Intertwined dithering** — Dither patches woven together (Ch 5).
- **Isometric** — Equal-axis view drawn with 2-pixel stairs, 26.5° (Ch 6).
- **Jaggies** — Jagged parts of a line from uneven steps (Ch 1).
- **Lazy lines** — Lines or shapes that describe nothing (Ch 7).
- **Line boiling** — Frame-to-frame wobble of redrawn lines (Ch 9).
- **Line weight** — Apparent thickness set by value (Ch 2, 8).
- **Mixels** — Mixed pixel sizes, including rotated pixels (Ch 0).
- **Moving hold** — Held pose that keeps drifting (Ch 9).
- **Multiples** — Smears made of after-images (Ch 9).
- **Oblique** — Flat front plane, others slanted 45° (Ch 6).
- **On one's / two's / three's** — Frames held per drawing (Ch 9).
- **Onion skin (light table)** — Overlay of neighbouring frames (Ch 9).
- **Orthographic** — Projection without perspective (Ch 6).
- **Overlapping action** — Parts dragging behind the leader (Ch 9).
- **Overshoot** — Frame passing the destination before returning (Ch 9).
- **Parallax scrolling** — Layers moving at different speeds (Ch 9).
- **Parallel banding** — Bands stacked in parallel rows (Ch 2).
- **Parallel lines** — Line-based 50-50 dither (Ch 5).
- **Pillow shading** — Shading that follows the outline; a result of banding (Ch 2).
- **Pixel shifting (swimming pixels, pixel transfer, pixel bleeding)** — Carrying value into the next pixel (Ch 8).
- **Popping** — A row of pixels appearing or vanishing on a moving curve (Ch 8).
- **Random dithering** — Patternless noise dither (Ch 5).
- **Readability** — Clarity of what the sprite represents (Ch 4).
- **Recycling drawings** — Building frames by transforming existing ones (Ch 9).
- **Selective outline (sel-out)** — Shaded outline with gaps/AA blending into the background (Ch 1, 8).
- **Shaded outline** — Outline carrying shading and a light source (Ch 1).
- **Silhouette** — Filled outer shape; readability test and animation rough (Ch 4, 9).
- **Smear** — In-between mimicking motion blur (Ch 9).
- **Spacing** — Room between features so they stay distinct (Ch 4).
- **Split pixels** — One pixel's value divided across 2 pixels (Ch 8).
- **Squash and stretch** — Volume-preserving deformation (Ch 9).
- **Stairs / staircases** — Equal-length steps forming a line (Ch 1).
- **Stretchy pixels** — Pixels extended to bridge two positions (Ch 9).
- **Stylised dithering** — Custom textured gradient patterns (Ch 5).
- **Sub-pixeling** — Illusion of sub-pixel thickness or motion (Ch 8).
- **Tangent** — Edges of different features meeting confusingly (Ch 4, 7).
- **Wide / double pixel** — Two same-colour pixels touching in a pattern or crossing (Ch 5, 6).

## Scope & limits

- Built from the book's text only. **No figure was viewed**: AA placement diagrams, banding before/after fixes, dither pattern charts, isometric construction steps (circle on a plane, cone/pyramid tip, the two diamond grids), the "why 87%" diagram and sub-pixel timing charts are described from captions and body text.
- Marked "(inferred)": curve step progression, clean-up order, palette swaps for asset variants, AI-asset handling.
- The timing table was reconstructed from a scrambled extraction; the 15 drawings/sec row has no reliable millisecond value.
- Not in the book: tileset authoring and file formats, UI art (nine-slice panels, buttons), card layout, Zapatro's fixed sizes. The "Applying it to Zapatro" section is this project's application, not text from the book; where it says no AA or no dithering it follows `docs/visual.md`, not the author.
- Private study aid generated from a purchased copy; do not publish.
