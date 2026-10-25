/**
 * Screens the QA runs on (scripts/qa-devices.ts). `w`×`h` is the render size in physical pixels
 * (landscape); `dpr` is the device pixel ratio the browser reports (the game picks its zoom from
 * physical pixels, so for phones it is an estimate that barely matters).
 */
export interface Device {
	id: string;
	name: string;
	w: number;
	h: number;
	dpr: number;
	/** Touch device (phone): emulated with touch events and a mobile viewport. */
	mobile?: boolean;
	/** Share in the source ranking, when the source gives one (%). */
	share?: number;
}

/** Best-selling phones in Brazil (docs/smartphone-brasil-market.md). */
export const BR_PHONES: readonly Device[] = [
	{ id: 'galaxy-a07', name: 'Samsung Galaxy A07 4G', w: 1600, h: 720, dpr: 1.75 },
	{ id: 'galaxy-a17', name: 'Samsung Galaxy A17 4G', w: 2340, h: 1080, dpr: 2.625 },
	{ id: 'moto-g06', name: 'Motorola Moto G06', w: 1640, h: 720, dpr: 1.75 },
	{ id: 'moto-g15', name: 'Motorola Moto G15', w: 2400, h: 1080, dpr: 2.625 },
	{ id: 'galaxy-a16', name: 'Samsung Galaxy A16 4G', w: 2340, h: 1080, dpr: 2.625 },
	{ id: 'galaxy-a15', name: 'Samsung Galaxy A15', w: 2340, h: 1080, dpr: 2.625 },
	{ id: 'redmi-note-13', name: 'Xiaomi Redmi Note 13', w: 2400, h: 1080, dpr: 2.75 },
	{ id: 'moto-g84', name: 'Motorola Moto G84', w: 2400, h: 1080, dpr: 2.625 },
	{ id: 'iphone-13', name: 'Apple iPhone 13', w: 2532, h: 1170, dpr: 3 },
	{ id: 'poco-x6', name: 'Xiaomi POCO X6', w: 2712, h: 1220, dpr: 3 },
	{
		id: 'galaxy-s20-fe',
		name: 'Samsung Galaxy S20 FE (aparelho de teste)',
		w: 2400,
		h: 1080,
		dpr: 2.625,
	},
].map((d) => ({ ...d, mobile: true }));

/**
 * Top primary display resolutions of Steam players (Steam Hardware & Software Survey, August
 * 2026; docs/steam-monitor-resolution-market-research.md) + the Steam Deck.
 */
export const STEAM_DISPLAYS: readonly Device[] = [
	{ id: '1080p', name: '1920×1080 (Full HD)', w: 1920, h: 1080, dpr: 1, share: 50.52 },
	{ id: '1440p', name: '2560×1440 (QHD)', w: 2560, h: 1440, dpr: 1, share: 21.86 },
	{ id: '1600p', name: '2560×1600 (16:10)', w: 2560, h: 1600, dpr: 1, share: 5.71 },
	{ id: '4k', name: '3840×2160 (4K)', w: 3840, h: 2160, dpr: 1, share: 4.98 },
	{ id: 'uw1440', name: '3440×1440 (ultrawide 21:9)', w: 3440, h: 1440, dpr: 1, share: 3.14 },
	{ id: '1200p', name: '1920×1200 (16:10)', w: 1920, h: 1200, dpr: 1, share: 2.76 },
	{ id: '768p', name: '1366×768 (notebook)', w: 1366, h: 768, dpr: 1, share: 2.23 },
	{ id: '900p-1610', name: '1440×900 (16:10)', w: 1440, h: 900, dpr: 1, share: 0.73 },
	{ id: '900p', name: '1600×900', w: 1600, h: 900, dpr: 1, share: 0.67 },
	{ id: 'uw1080', name: '2560×1080 (ultrawide 21:9)', w: 2560, h: 1080, dpr: 1, share: 0.67 },
	{ id: 'steam-deck', name: 'Steam Deck (1280×800)', w: 1280, h: 800, dpr: 1, share: 0.31 },
];
