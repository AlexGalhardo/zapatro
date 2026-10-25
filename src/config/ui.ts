/**
 * Design tokens shared by every screen (docs/visual.md §8, director review §10), in logical px of
 * the 640×360 stage. Colours live in palette.ts and type in src/ui/font.ts.
 */

/** Corner radii. */
export const RADIUS = { frame: 12, panel: 8, button: 5, card: 4, badge: 3 } as const;

/** Minimum margin to the stage edge and minimum breathing room inside a panel. */
export const SAFE = { stage: 6, panel: 4 } as const;

/** Inner padding: full-screen frame, panel or card, list row, modal card. */
export const PAD = { frame: 14, panel: 10, card: 8, row: 9 } as const;

/** Space between siblings: list rows, cards, panels, items on one line. */
export const GAP = { list: 4, card: 8, panel: 8, inline: 6 } as const;

/** Button heights by role: small (◀ ▶), list row, modal action, primary/Back. */
export const BUTTON_H = { small: 18, row: 22, action: 24, primary: 26 } as const;

/** Type scale by role (logical px; touch mode adds via `uiPx`). */
export const TYPE = {
	screenTitle: 27,
	panelTitle: 12,
	label: 9,
	value: 15,
	small: 7,
	min: 7,
} as const;

/** The left sidebar, shared by the table and the run screens so the column never jumps. */
export const SIDEBAR = { x: 8, w: 132, top: 6, gap: 4, pad: 9 } as const;

/** Solid drop shadows (a vertical offset, never a blur). */
export const SHADOW = {
	panel: 3,
	button: 2,
	/** Hover and focus lift the button this much over its shadow (3 px of shadow show). */
	hoverLift: 1,
	/** Shadow left under a pressed button: it sinks until the shadow almost vanishes. */
	pressed: 0.5,
	panelAlpha: 0.55,
	buttonAlpha: 0.6,
} as const;

/** Draw order on the table, bottom to top. */
export const DEPTH = {
	/** Bars, ovals and dots redrawn over the sidebar and HUD panels. */
	hudShapes: 0.5,
	/** The bet number, over its red block in hudShapes. */
	sideValue: 2,
	vignette: 4,
	table: 5,
	/** Played cards (stacked in 0.1 steps above this) and the hand's key labels. */
	played: 6,
	statusBar: 7,
	status: 8,
	manhas: 9,
	cards: 10,
	controls: 10,
	hud: 20,
	speech: 20,
	signal: 21,
	pickers: 25,
	bubbles: 30,
	banner: 30,
	/** The Chips × Mult count panel. */
	score: 32,
	popup: 34,
	eleven: 35,
	tips: 36,
	count: 40,
	endPanel: 40,
	modal: 50,
	toast: 100,
} as const;

/** UI motion (ms); the table's own timings are TABLE_TIMING in src/data/characters.ts. */
export const MOTION = {
	hover: 80,
	/** A button easing between rest, hover and pressed; also the keyboard press shown before the action. */
	press: 70,
	sceneFade: 160,
	modal: 250,
} as const;
