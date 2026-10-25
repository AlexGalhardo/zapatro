import type { ReactNode } from 'react';
import type { Lang } from '@/i18n';

const NAMES: Record<Lang, string> = { en: 'English', 'pt-BR': 'Português' };

/**
 * Points each language link at the same page in that language (English at the root, Portuguese
 * under /pt). The layout cannot know the page's path at build time, and the site ships no
 * framework JS (scripts/site-build.ts strips it), so a few lines of plain JS do it; without JS the
 * links still open the other language's home.
 */
const SAME_PAGE = `(()=>{const b=location.pathname.replace(/^\\/pt(?=\\/|$)/,'')||'/';for(const a of document.querySelectorAll('a[data-lang-root]'))a.href=a.dataset.langRoot==='en'?b:'/pt'+b;})()`;

/** Language dropdown (a native <details>, works without JS): the same page in each language. */
export function LangMenu({ lang, label }: { lang: Lang; label: string }): ReactNode {
	const href: Record<Lang, string> = { en: '/', 'pt-BR': '/pt/' };
	return (
		<details className="relative">
			{/* The accessible name starts with the visible text (EN/English), so a voice user hears what they see. */}
			<summary className="btn cursor-pointer list-none whitespace-nowrap py-1 text-base">
				<span className="sr-only">{label}: </span>
				<span className="sm:hidden">{lang === 'en' ? 'EN' : 'PT'}</span>
				<span className="hidden sm:inline">{NAMES[lang]}</span>
				<span aria-hidden="true">▾</span>
			</summary>
			<ul className="absolute right-0 mt-1 min-w-36 list-none overflow-hidden rounded-panel border-2 border-panel-dark bg-panel p-0 shadow-solid">
				{(Object.keys(NAMES) as Lang[]).map((l) => (
					<li key={l}>
						<a
							href={href[l]}
							hrefLang={l}
							data-lang-root={l}
							aria-current={l === lang ? 'true' : undefined}
							className={`flex min-h-11 items-center px-3 no-underline hover:bg-panel-dark ${l === lang ? 'text-gold' : 'text-text'}`}
						>
							{NAMES[l]}
						</a>
					</li>
				))}
			</ul>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant, build-time script */}
			<script id="lang-paths" dangerouslySetInnerHTML={{ __html: SAME_PAGE }} />
		</details>
	);
}
