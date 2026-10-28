/**
 * Build flags read from .env / the build command (see .env.example).
 *
 * VITE_DEMO=1 — web demo: the run ends after championship 1 (the first boss) with a wishlist screen (D-33).
 * VITE_POKI=1 — Poki build: loads the Poki SDK and reports gameplay start/stop (B5.4).
 */
const flag = (v: string | undefined): boolean => v === '1' || v?.trim().toLowerCase() === 'true';

export const IS_DEMO: boolean = flag(import.meta.env.VITE_DEMO);
export const IS_POKI: boolean = flag(import.meta.env.VITE_POKI);

/**
 * The Championship's table-choice screen (Small, Big and Boss table, with Skip and Promises).
 * false: choosing the partner or leaving the shop goes straight to the next table, in order
 * (Small, Big, Boss), with no skipping. The screen and its rules are kept, only not shown.
 */
export const TABLE_SELECT = false;

/** The table's "Manilha / ZAP" box (bottom left of the felt): hidden to clear the table (dev test). */
export const SHOW_MANILHA_BOX = false;

/** The sidebar's money card on the table ($): hidden; the money still exists (shop, end of table). */
export const SHOW_MONEY_PANEL = false;

/**
 * The shop reduced to what buys: no sidebar, no packs, no reroll, no Melhoria; the offers
 * on the chalkboard (`ECONOMY.offers`) and "Next table". false: the full shop as it was.
 */
export const SHOP_SIMPLE = true;

/**
 * Trinkets (docs/trinkets.md) replace the Manhas as the shop's item: four rarities of the same
 * trinket, a Perk and a Flaw each, a collection kept in the profile and four equipped slots.
 * false: the shop of Manhas as it was.
 */
export const TRINKETS = true;
