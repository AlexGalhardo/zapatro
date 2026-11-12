import type { APIRoute } from 'astro';
import { url } from '@/links';

export const GET: APIRoute = () =>
	Response.json({
		name: 'Zapatro',
		short_name: 'Zapatro',
		start_url: url(''),
		scope: url(''),
		display: 'standalone',
		background_color: '#2B2B2B',
		theme_color: '#2B2B2B',
		icons: [
			{ src: url('img/favicon.svg'), sizes: 'any', type: 'image/svg+xml' },
			{ src: url('img/icon-192.png'), sizes: '192x192', type: 'image/png' },
			{ src: url('img/icon-512.png'), sizes: '512x512', type: 'image/png' },
		],
	});
