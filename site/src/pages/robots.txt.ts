import type { APIRoute } from 'astro';
import { abs } from '@/links';

// Crawlers only read robots.txt at the domain root: under a path prefix (GitHub Pages project site) this
// file is informative until a custom domain serves the site at /.
export const GET: APIRoute = () =>
	new Response(`User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
