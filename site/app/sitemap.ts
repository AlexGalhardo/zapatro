import type { MetadataRoute } from 'next';
import { PAGES, SITE_URL } from '@/links';

export const dynamic = 'force-static';

/** Every page in both languages, with its hreflang pair (/play/ and /demo/ are apps: left out). */
export default function sitemap(): MetadataRoute.Sitemap {
	return PAGES.flatMap((path) => {
		const languages = { en: `${SITE_URL}/${path}`, 'pt-BR': `${SITE_URL}/pt/${path}` };
		return Object.values(languages).map((url) => ({ url, alternates: { languages } }));
	});
}
