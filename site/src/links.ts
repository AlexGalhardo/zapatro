/**
 * Store and community links. `null` = not public yet: the page shows "coming soon" instead of a
 * dead link. Fill them in as the pages go live (PLAN RC4).
 */
export const LINKS: Record<'steam' | 'play' | 'itch' | 'discord' | 'contact', string | null> = {
	steam: null,
	play: null,
	itch: null,
	discord: null,
	contact: null,
};

/** Absolute origin for canonical, Open Graph, sitemap and robots; `SITE_URL=https://zapatro.com` once the domain exists. */
export const SITE_URL = process.env.SITE_URL ?? 'https://truco.lekzera.xyz';

/** Site paths of every page (English at the root, Portuguese under /pt). */
export const PAGES = ['', 'presskit/', 'privacy/'] as const;
export type PagePath = (typeof PAGES)[number];
