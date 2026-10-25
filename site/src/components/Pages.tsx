import type { ReactNode } from 'react';
import { type Key, type Lang, TEXTS } from '@/i18n';
import { LINKS, SITE_URL } from '@/links';
import { CONTAINER, home } from './Shell';
import { StoreBadge } from './StoreBadge';
import { Trailer, trailerPoster, trailerVideo } from './Trailer';

/** The six store captures (docs/media, `bun scripts/store-art.ts`), one set per language. */
const SHOTS = ['truco', 'count', 'shop', 'partner', 'boss', 'almanac'] as const;

const Shots = ({ lang }: { lang: Lang }) => (
	<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{SHOTS.map((s) => (
			<a key={s} href={`/img/press/${s}-${lang}.png`}>
				<img
					src={`/img/press/${s}-${lang}.webp`}
					alt={TEXTS[lang][`shot.${s}`]}
					loading="lazy"
					width={1280}
					height={720}
					className="block h-auto w-full rounded-panel border-2 border-panel-dark shadow-solid"
				/>
			</a>
		))}
	</div>
);

/** Paints "Chips × Mult" / "Fichas × Mult" in the game's chip blue and mult red. */
function Pitch({ text }: { text: string }): ReactNode {
	const m = /(Chips|Fichas) × (Mult)/.exec(text);
	if (!m) return text;
	return (
		<>
			{text.slice(0, m.index)}
			<strong className="text-chips-text brightness-150">{m[1]}</strong> ×{' '}
			<strong className="text-mult brightness-125">{m[2]}</strong>
			{text.slice(m.index + m[0].length)}
		</>
	);
}

/** Decorative fan of three flat cards behind the hero (vector, no scene: Art Bible v2 §1). */
const CardFan = (): ReactNode => (
	<svg
		aria-hidden="true"
		viewBox="0 0 300 220"
		className="pointer-events-none absolute top-1/2 left-0 -z-10 hidden w-[36rem] -translate-y-1/2 opacity-[0.06] md:block"
	>
		{[-18, 0, 18].map((a) => (
			<rect
				key={a}
				x="110"
				y="30"
				width="96"
				height="128"
				rx="10"
				fill="#F8F0DE"
				stroke="#1A1A1A"
				strokeWidth="4"
				transform={`rotate(${a} 158 200)`}
			/>
		))}
	</svg>
);

/** JSON-LD for search engines: the game, and the trailer once it is rendered. */
function JsonLd({ lang }: { lang: Lang }): ReactNode {
	const t = TEXTS[lang];
	const url = `${SITE_URL}${home(lang)}`;
	const video = trailerVideo(lang);
	const poster = trailerPoster(lang);
	const data: Record<string, unknown>[] = [
		{
			'@context': 'https://schema.org',
			'@type': 'VideoGame',
			name: 'Zapatro',
			url,
			description: t['meta.desc'],
			image: `${SITE_URL}/img/og.jpg`,
			genre: 'Roguelike card game',
			gamePlatform: ['Windows', 'macOS', 'Linux', 'Android', 'Web browser'],
			inLanguage: ['en', 'pt-BR'],
			author: { '@type': 'Person', name: 'Alex Galhardo' },
		},
	];
	if (video)
		data.push({
			'@context': 'https://schema.org',
			'@type': 'VideoObject',
			name: `Zapatro — ${t['trailer.title']}`,
			description: t['meta.desc'],
			thumbnailUrl: `${SITE_URL}${poster ?? '/img/og.jpg'}`,
			uploadDate: video.uploaded,
			contentUrl: `${SITE_URL}${video.src}`,
			inLanguage: lang,
		});
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built at export time; "<" is escaped
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }}
		/>
	);
}

export function Home({ lang }: { lang: Lang }): ReactNode {
	const t = TEXTS[lang];
	// Phones (flex) read: title, CTA, trailer, pitch, badges; desktop (grid) puts the left column
	// back together (`md:block`) and the trailer on the right.
	return (
		<main id="main" className="relative isolate flex flex-1 items-center overflow-hidden">
			<JsonLd lang={lang} />
			<div
				className={`${CONTAINER} flex flex-col gap-6 py-8 md:grid md:grid-cols-2 md:items-center md:gap-8`}
			>
				<div className="contents md:relative md:block md:max-w-[36rem]">
					<CardFan />
					<div className="order-1">
						<h1 className="m-0 text-[clamp(2.6rem,5vw,5rem)] text-gold uppercase tracking-wide [text-shadow:0_4px_0_#1A1A1A]">
							Zapatro
						</h1>
						<p className="mt-2 mb-0 text-cream text-tagline leading-snug">
							{t['hero.tagline']}
						</p>
					</div>
					<p className="order-4 m-0 md:mt-4">
						<Pitch text={t['hero.pitch']} />
					</p>
					<div className="order-2 flex flex-wrap items-center gap-4 md:mt-6">
						<a
							href="/play/"
							target="_blank"
							rel="noopener"
							className="btn btn-cta min-h-16 px-8 py-4 text-2xl uppercase"
						>
							{t['cta.play']}
							<span className="sr-only"> {t['cta.newTab']}</span>
						</a>
						<a
							href="/demo/"
							target="_blank"
							rel="noopener"
							className="btn min-h-14 px-6 py-3 text-xl"
						>
							{t['cta.demo']}
							<span className="sr-only"> {t['cta.newTab']}</span>
						</a>
					</div>
					<div className="order-5 md:mt-4">
						<p className="m-0 text-dim text-base">{t['demo.body']}</p>
						<ul
							aria-label={t['badges.label']}
							className="mt-4 mb-0 flex list-none flex-wrap gap-3 p-0"
						>
							<li>
								<StoreBadge
									url={LINKS.steam}
									label={t['badge.steam']}
									soon={t['cta.soon']}
								/>
							</li>
							<li>
								<StoreBadge
									url={LINKS.play}
									label="Google Play"
									soon={t['cta.soon']}
								/>
							</li>
							<li>
								<StoreBadge url={LINKS.itch} label="itch.io" soon={t['cta.soon']} />
							</li>
						</ul>
					</div>
				</div>
				<div className="order-3">
					<Trailer lang={lang} />
				</div>
			</div>
		</main>
	);
}

export function Presskit({ lang }: { lang: Lang }): ReactNode {
	const t = TEXTS[lang];
	const facts: [Key, string][] = [
		['press.developer', 'Alex Galhardo (Brasil)'],
		['press.release', t['press.release.value']],
		['press.platforms', t['press.platforms.value']],
		['press.price', t['press.price.value']],
		['press.languages', 'English · Português (Brasil)'],
	];
	return (
		<main id="main" className={`${CONTAINER} my-8 flex-1`}>
			<h1 className="text-4xl">{t['press.title']}</h1>
			<p>
				<a href="/presskit/truco-roguelite-presskit.zip" className="btn btn-cta">
					{t['press.download']}
				</a>
			</p>
			<div className="grid items-start gap-6 md:grid-cols-[16rem_1fr]">
				<aside className="card">
					<h2 className="mt-0 text-2xl">{t['press.factsheet']}</h2>
					<dl>
						{facts.map(([k, v]) => (
							<div key={k} className="mb-3">
								<dt className="text-dim text-sm">{t[k]}</dt>
								<dd className="m-0">{v}</dd>
							</div>
						))}
					</dl>
				</aside>
				<div>
					<h2 className="text-2xl">{t['press.description']}</h2>
					<p>{t['hero.pitch']}</p>
					<h2 className="text-2xl">{t['press.history']}</h2>
					<p>{t['press.history.body']}</p>
					<h2 className="text-2xl">{t['press.features']}</h2>
					<ul className="list-disc pl-6">
						{(['1', '2', '3', '4', '5', '6'] as const).map((n) => (
							<li key={n}>{t[`press.feat.${n}` as Key]}</li>
						))}
					</ul>
					<h2 className="text-2xl">{t['trailer.title']}</h2>
					<Trailer lang={lang} />
					<h2 className="text-2xl">{t['press.images']}</h2>
					<p className="text-dim">{t['press.images.note']}</p>
					<Shots lang={lang} />
					<h2 className="text-2xl">{t['press.logos']}</h2>
					<div className="flex flex-wrap items-center gap-4">
						<a href="/img/press/logo.png">
							<img
								src="/img/press/logo-640.webp"
								alt={t['press.logo.alt']}
								width={320}
								height={100}
								loading="lazy"
							/>
						</a>
						<a href="/img/icon-1024.png">
							<img
								src="/img/icon-256.png"
								alt={t['press.icon.alt']}
								width={128}
								height={128}
								loading="lazy"
							/>
						</a>
						<a href="/img/press/header.png">
							<img
								src="/img/press/header.png"
								alt={t['press.header.alt']}
								width={460}
								height={215}
								loading="lazy"
								className="h-auto max-w-full"
							/>
						</a>
					</div>
					<p className="text-dim text-sm">
						<a href="/img/press/logo.svg">{t['press.logo.svg']}</a>
					</p>
					<h2 className="text-2xl">{t['press.credits']}</h2>
					<p>{t['footer.credits']}</p>
				</div>
			</div>
			<p>
				<a href={home(lang)}>{t['back.home']}</a>
			</p>
		</main>
	);
}

export function Privacy({ lang }: { lang: Lang }): ReactNode {
	const t = TEXTS[lang];
	return (
		<main id="main" className={`${CONTAINER} my-8 flex-1`}>
			<h1 className="text-4xl">{t['privacy.title']}</h1>
			<p>{t['privacy.body.1']}</p>
			<p>{t['privacy.body.2']}</p>
			<p>{t['privacy.body.3']}</p>
			<p className="text-dim">{t['privacy.updated']}</p>
			<p>
				<a href={home(lang)}>{t['back.home']}</a>
			</p>
		</main>
	);
}
