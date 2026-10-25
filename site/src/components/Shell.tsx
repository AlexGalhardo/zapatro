import type { Metadata, Viewport } from 'next';
import { Rubik } from 'next/font/google';
import type { ReactNode } from 'react';
import { type Key, type Lang, TEXTS } from '@/i18n';
import { LINKS, type PagePath, SITE_URL } from '@/links';
import { LangMenu } from './LangMenu';
import { StoreBadge } from './StoreBadge';
import '../../app/globals.css';

// The game's only typeface (Art Bible v2 §4).
const rubik = Rubik({
	subsets: ['latin'],
	weight: ['400', '500', '700'],
	display: 'swap',
	variable: '--font-rubik',
});

/** Links inside the site for a language (English at the root, Portuguese under /pt). */
export const home = (lang: Lang): string => (lang === 'en' ? '/' : '/pt/');

/** Content width of every row (nav, page, footer): 10 of 12 columns, wider on phones. */
export const CONTAINER = 'mx-auto w-11/12 md:w-10/12';

export const viewport: Viewport = { themeColor: '#2B2B2B' };

/** Page metadata in a language; `title` is a page heading key (home uses the site title). */
export function meta(lang: Lang, title?: Key, path: PagePath = ''): Metadata {
	const t = TEXTS[lang];
	const pageTitle = title ? `${t[title]} · Zapatro` : t['meta.title'];
	const canonical = `${home(lang)}${path}`;
	const image = { url: '/img/og.jpg', width: 1200, height: 630, alt: t['meta.og.alt'] };
	return {
		metadataBase: new URL(SITE_URL),
		title: pageTitle,
		description: t['meta.desc'],
		icons: {
			icon: [
				{ url: '/favicon.ico', sizes: '32x32 48x48' },
				{ url: '/img/favicon.svg', type: 'image/svg+xml' },
				{ url: '/img/icon-64.png', type: 'image/png', sizes: '64x64' },
			],
			apple: { url: '/img/apple-touch-icon.png', sizes: '180x180' },
		},
		manifest: '/manifest.webmanifest',
		alternates: {
			canonical,
			languages: { en: `/${path}`, 'pt-BR': `/pt/${path}`, 'x-default': `/${path}` },
		},
		openGraph: {
			type: 'website',
			siteName: 'Zapatro',
			title: pageTitle,
			description: t['meta.desc'],
			url: canonical,
			locale: lang === 'en' ? 'en_US' : 'pt_BR',
			images: [image],
		},
		twitter: {
			card: 'summary_large_image',
			title: pageTitle,
			description: t['meta.desc'],
			images: [image],
		},
	};
}

/** Root layout body shared by the English and Portuguese trees: nav, page, footer. */
export function Shell({ lang, children }: { lang: Lang; children: ReactNode }): ReactNode {
	const t = TEXTS[lang];
	const base = home(lang);
	return (
		<html lang={lang} className={rubik.variable}>
			<body className="flex min-h-dvh flex-col">
				<a
					href="#main"
					className="btn absolute top-2 left-2 z-50 -translate-y-24 focus:translate-y-0"
				>
					{t.skip}
				</a>
				<header className="relative z-20 h-14 border-b-2 border-panel-dark bg-panel">
					<div className={`${CONTAINER} flex h-full items-center justify-between gap-4`}>
						<a
							href={base}
							className="flex min-h-11 items-center gap-2 font-bold text-2xl text-gold no-underline"
						>
							<img
								src="/img/favicon.svg"
								alt=""
								width={32}
								height={32}
								className="rounded-seal"
							/>
							Zapatro
						</a>
						<nav className="flex items-center gap-3">
							<a
								href={`${base}presskit/`}
								className="btn whitespace-nowrap py-1 text-base"
							>
								{t['nav.presskit']}
							</a>
							<LangMenu lang={lang} label={t['nav.lang.label']} />
						</nav>
					</div>
				</header>
				{children}
				<footer className="border-t-2 border-panel-dark bg-panel text-dim text-sm">
					<div
						className={`${CONTAINER} flex flex-col gap-1 py-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-4 md:py-3`}
					>
						<nav className="flex flex-wrap items-center gap-x-4">
							<StoreBadge
								url={LINKS.steam}
								label="Steam"
								soon={t['cta.soon']}
								plain
							/>
							<StoreBadge
								url={LINKS.play}
								label="Google Play"
								soon={t['cta.soon']}
								plain
							/>
							<StoreBadge
								url={LINKS.itch}
								label="itch.io"
								soon={t['cta.soon']}
								plain
							/>
							<StoreBadge
								url={LINKS.discord}
								label="Discord"
								soon={t['cta.soon']}
								plain
							/>
							<StoreBadge
								url={LINKS.contact}
								label={t['footer.contact']}
								soon={t['cta.soon']}
								plain
							/>
							<a
								href={`${base}privacy/`}
								className="inline-flex min-h-11 items-center text-text md:min-h-0"
							>
								{t['footer.privacy']}
							</a>
						</nav>
						<p className="m-0 pb-1 md:pb-0 md:text-right">
							{t['footer.credits']} · © 2026
						</p>
					</div>
				</footer>
			</body>
		</html>
	);
}
