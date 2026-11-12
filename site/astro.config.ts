import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// GitHub Pages serves this repository at https://alexgalhardo.github.io/zapatro/; a custom domain
// only needs SITE_URL=https://example.com and SITE_BASE=/.
const site = (process.env.SITE_URL ?? 'https://alexgalhardo.github.io').replace(/\/+$/, '');
const base = `/${(process.env.SITE_BASE ?? '/zapatro/').replace(/^\/+|\/+$/g, '')}/`.replace(
	'//',
	'/',
);

export default defineConfig({
	site,
	base,
	trailingSlash: 'always',
	// Static output only: plain HTML in out/ (pages) plus public/ (art, /play/, /demo/) as-is.
	outDir: 'out',
	build: { format: 'directory', inlineStylesheets: 'always' },
	vite: { plugins: [tailwindcss()] },
	// The game's only typeface (Art Bible v2 §4).
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Rubik',
			cssVariable: '--font-rubik',
			weights: [400, 500, 700],
			subsets: ['latin'],
			display: 'swap',
		},
	],
});
