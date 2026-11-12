import { existsSync, statSync } from 'node:fs';
import type { Lang } from '@/i18n';
import { url } from '@/links';

const fileFor = (lang: Lang): string => `trailer-${lang === 'en' ? 'en' : 'pt'}`;

/** Poster widths made by scripts/site-build.ts (960 is the plain file) and its layout width. */
export const posterSrcset = (p: string): string =>
	`${url(p.replace('.webp', '-480.webp'))} 480w, ${url(p.replace('.webp', '-720.webp'))} 720w, ${url(p)} 960w`;
export const POSTER_SIZES = '(min-width: 768px) 40vw, 92vw';

/** Poster path (site-relative): the Chips × Mult count capture in the page's language, else none. */
export function trailerPoster(lang: Lang): string | null {
	const p = `/img/trailer-poster-${lang}.webp`;
	return existsSync(`public${p}`) ? p : null;
}

/** The trailer file of a language and its date, when scripts/site-build.ts copied it (RC3). */
export function trailerVideo(lang: Lang): { src: string; uploaded: string } | null {
	const src = `/trailer/${fileFor(lang)}.mp4`;
	if (!existsSync(`public${src}`)) return null;
	return { src, uploaded: statSync(`public${src}`).mtime.toISOString() };
}

/** Subtitle files that exist (`public/trailer/trailer-<en|pt>.vtt`). */
export const trailerTracks = (): readonly (readonly ['en' | 'pt', 'en' | 'pt-BR', string])[] =>
	(
		[
			['en', 'en', 'English'],
			['pt', 'pt-BR', 'Português'],
		] as const
	).filter(([f]) => existsSync(`public/trailer/trailer-${f}.vtt`));
