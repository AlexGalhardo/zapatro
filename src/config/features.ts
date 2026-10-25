/**
 * Build flags read from .env / the build command (see .env.example).
 *
 * VITE_DEMO=1 — web demo: the run ends after championship 1 (the first boss) with a wishlist screen (D-33).
 * VITE_POKI=1 — Poki build: loads the Poki SDK and reports gameplay start/stop (B5.4).
 */
const flag = (v: string | undefined): boolean => v === '1' || v?.trim().toLowerCase() === 'true';

export const IS_DEMO: boolean = flag(import.meta.env.VITE_DEMO);
export const IS_POKI: boolean = flag(import.meta.env.VITE_POKI);
