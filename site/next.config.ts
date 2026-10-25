import type { NextConfig } from 'next';

// Static export (SSG): `next build` writes plain HTML to out/, served as-is by Vercel.
const config: NextConfig = {
	output: 'export',
	trailingSlash: true,
	images: { unoptimized: true },
	// The stylesheet goes inline in each page: one render-blocking request less on mobile.
	experimental: { inlineCss: true },
};

export default config;
