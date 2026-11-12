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

/** Absolute origin for canonical, Open Graph, sitemap and robots (`SITE_URL` in astro.config.ts). */
export const SITE_URL = (import.meta.env.SITE ?? 'https://alexgalhardo.github.io').replace(
	/\/+$/,
	'',
);

/** Path prefix the site is served under (`SITE_BASE`), always with both slashes: `/zapatro/` or `/`. */
export const BASE = import.meta.env.BASE_URL.replace(/\/*$/, '/');

/** A site-relative URL (`/img/og.jpg`, `presskit/`) under the base. */
export const url = (path: string): string => `${BASE}${path.replace(/^\/+/, '')}`;

/** The same URL with the origin, for canonical, Open Graph, JSON-LD and the sitemap. */
export const abs = (path: string): string => `${SITE_URL}${url(path)}`;

/** Site paths of every page (English at the root, Portuguese under /pt). */
export const PAGES = ['', 'presskit/', 'privacy/'] as const;
export type PagePath = (typeof PAGES)[number];
