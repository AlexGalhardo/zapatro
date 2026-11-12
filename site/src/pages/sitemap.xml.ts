import type { APIRoute } from 'astro';
import { abs, PAGES } from '@/links';

/** Every page in both languages, with its hreflang pair (/play/ and /demo/ are apps: left out). */
export const GET: APIRoute = () => {
	const entries = PAGES.flatMap((path) => {
		const en = abs(path);
		const pt = abs(`pt/${path}`);
		const alternates = `<xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="pt-BR" href="${pt}"/>`;
		return [en, pt].map((loc) => `<url><loc>${loc}</loc>${alternates}</url>`);
	});
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>\n`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
