---
name: qa-global
description: Use when testing Zapatro (Truco Roguelite) end to end like a professional QA — before a release or push, after any change to screens, menus, buttons, input, table, scoring, shop, packs, save or HUD, when the user asks to "test everything", "QA", "find bugs", or to update docs/quality-assurance-functional-systems-global-test.md. Runs the automated global QA suite (scripts/qa.ts), the smoke, the unit tests and the balance pipeline, and keeps the QA checklist document current.
---

# qa-global

Automated "human QA" for the whole game. One command plays every flow in headless Chromium and
prints a PASS/FAIL checklist; the unit tests and the balance pipeline cover the rules underneath.
Results and backlog: [docs/quality-assurance-functional-systems-global-test.md](../../../docs/quality-assurance-functional-systems-global-test.md).
Keep runs short (user preference): never soak or QA for hours.

## Run (in this order)

```bash
bun run check && bun run typecheck && bun test        # static gates + rules (truco, score, run, save…)
bun run balance                                        # D-39 gate when a gameplay number changed
bunx --bun vite --port 5191 --strictPort               # dev server (background); 5173 may be taken
bun scripts/smoke.ts --url http://localhost:5191       # menu + one bot match, fails on console errors
bun scripts/qa.ts --url http://localhost:5191          # every group
bun scripts/qa.ts --url http://localhost:5191 --only table,eleven   # while fixing
```

Production build: `bun run build && bunx --bun vite preview --port 5191 --strictPort`, same URLs
(the suite adds `?qa=1`, which exposes `window.__GAME__` in production).
Other passes: `bun scripts/qa-devices.ts --set mobile|desktop` (11 phones / 11 Steam resolutions),
`bun scripts/qa-browsers.ts` (Chrome, Edge, Firefox), `bun scripts/qa-android.ts` (real APK),
`bun run electron:smoke` (desktop shell).

## Groups (`scripts/qa.ts`)

menu · pause · table · eleven · iron · score · manhas · run · continue · end · settings · rules ·
tutorial · newrun · shop · pack · skip · boss · save · runend · touch · deck. Each group runs in a fresh browser
context (clean localStorage) and ends with "no console errors".

## Adding a check

Inside `group(browser, 'name', async (t) => { … })`:

- `t.open('?skipMenu=1&seed=3&hand=…&vira=…')` — waits past Boot until Menu, Run or a built Table.
  Debug params live in `src/debug/params.ts`: `?seed`, `?skipMenu`, `?run=1`, `?auto`, `?speed`,
  `?vira`, `?hand` (`JK` = joker), `?score=11-4` (hand of eleven) / `11-11` (iron hand),
  `?partner=id`, `?boss=id`, `?reveal`, `?debug`.
- `t.press('ArrowDown', 'Enter')` — real key events (Esc = pause/back everywhere).
- `t.click(textIn('Table', /TRUCO/))` — clicks the visible Phaser text; regexes must accept EN and
  PT-BR. The click moves the mouse one frame before pressing (Phaser hit-tests at the last spot).
- `t.eval<T>('(game, table) => …')`, `t.until(what, fn, ms)`, `t.check(what, ok, detail)`.
- Wait for the human turn with `humanTurn` before reading buttons: the table is disabled until the
  first turn is decided.

Then add the item to the QA document (group section) and, if it found a bug, to the
"bugs found" table with the fix commit.

## Traps already found (keep them covered)

- Buttons looked enabled for the first frames of a match (TRUCO! in the iron hand) — check after
  the first turn, not right after `open`.
- Scene events accumulate across restarts unless registered with `onSceneEvent`; keys only through
  `onKey` (`src/ui/keys.ts`, Phaser 4.2.1 double-key bug).
- Headless WebGL needs `--use-angle=swiftshader --enable-unsafe-swiftshader`; GPU stall and
  AudioContext autoplay warnings are expected, not errors.
- Concept-art screens: `dev`/`build` rasterize `art-src/concept/*.svg` first; a missing raster
  shows the placeholder, not an error.

## Human pass (what automation cannot judge)

Open the build at 1280×720, 1920×1080 and a 20:9 phone: text overlaps, readability of the hand
fan and HUD, signal bubbles, scoring pacing, audio mix. Record findings in the "Melhorias"
section of the QA document.
