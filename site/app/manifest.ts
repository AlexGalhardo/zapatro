import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Zapatro',
		short_name: 'Zapatro',
		start_url: '/',
		display: 'standalone',
		background_color: '#2B2B2B',
		theme_color: '#2B2B2B',
		icons: [
			{ src: '/img/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
			{ src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
		],
	};
}
