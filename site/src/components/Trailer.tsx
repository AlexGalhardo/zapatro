import { existsSync, statSync } from 'node:fs';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import { type Lang, TEXTS } from '@/i18n';

const FRAME =
	'relative block aspect-video w-full overflow-hidden rounded-panel border-2 border-panel-dark bg-felt shadow-solid';

const fileFor = (lang: Lang): string => `trailer-${lang === 'en' ? 'en' : 'pt'}`;

/** Poster widths made by scripts/site-build.ts (960 is the plain file) and its layout width. */
const POSTER_SRCSET = (p: string): string =>
	`${p.replace('.webp', '-480.webp')} 480w, ${p.replace('.webp', '-720.webp')} 720w, ${p} 960w`;
const POSTER_SIZES = '(min-width: 768px) 40vw, 92vw';

/** Poster: the Chips × Mult count capture in the page's language, else none (plain felt). */
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

/**
 * The trailer (game-director-feedback.md §7.6), checked at build time (static export) so no
 * request for a missing file reaches the browser. Without a render it shows the poster with a
 * clearly labelled placeholder.
 */
export function Trailer({ lang }: { lang: Lang }): ReactNode {
	const t = TEXTS[lang];
	const poster = trailerPoster(lang);
	// The poster is the mobile LCP: `preload` adds a high-priority <link rel="preload"> to the head.
	if (poster)
		preload(poster, {
			as: 'image',
			fetchPriority: 'high',
			imageSrcSet: POSTER_SRCSET(poster),
			imageSizes: POSTER_SIZES,
		});
	const video = trailerVideo(lang);
	if (!video)
		return (
			<figure className={`${FRAME} m-0`}>
				{poster && (
					<img
						src={poster}
						srcSet={POSTER_SRCSET(poster)}
						sizes={POSTER_SIZES}
						alt=""
						width={1280}
						height={720}
						fetchPriority="high"
						className="h-full w-full object-cover opacity-60"
					/>
				)}
				<figcaption className="absolute inset-0 grid place-items-center p-4">
					<span className="card max-w-sm text-center">
						<strong className="block text-gold text-xl">{t['trailer.soon']}</strong>
						<span className="text-dim text-sm">{t['trailer.soon.note']}</span>
					</span>
				</figcaption>
			</figure>
		);
	const tracks = (
		[
			['en', 'en', 'English'],
			['pt', 'pt-BR', 'Português'],
		] as const
	).filter(([f]) => existsSync(`public/trailer/trailer-${f}.vtt`));
	return (
		// biome-ignore lint/a11y/useMediaCaption: the subtitle tracks below come from the .vtt files when they exist
		<video
			controls
			preload="metadata"
			playsInline
			poster={poster ?? undefined}
			width={1280}
			height={720}
			className={FRAME}
		>
			<source src={video.src} type="video/mp4" />
			{tracks.map(([f, srcLang, label]) => (
				<track
					key={f}
					kind="subtitles"
					src={`/trailer/trailer-${f}.vtt`}
					srcLang={srcLang}
					label={label}
					default={srcLang === lang}
				/>
			))}
		</video>
	);
}
