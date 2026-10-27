import type { Rarity } from '../data/manhas';

/**
 * Every colour used by the game (flat boteco palette, docs/visual.md): felt green, wood brown,
 * cream, warm reds and golds. UI, feedback and the flat art (src/art/flat.ts) read from here.
 */
export const PALETTE = {
	// Base and text.
	night: 0x16211c,
	// Neutral screen background of the hybrid look (docs/visual.md).
	bgNeutral: 0x2b2b2b,
	shadow: 0x0a0806,
	textLight: 0xf6eedc,
	textDim: 0xb2a78f,
	textDark: 0x2a1d14,
	// Panels (dark wood) and the gold accent of titles and focus.
	panel: 0x30261f,
	panelLight: 0x433730,
	panelDark: 0x231c17,
	panelBorder: 0xf0c75e,
	// Dark wood behind items without an accent (packs, item kinds in flat.ts).
	button: 0x52443a,
	buttonHover: 0x6a5a4e,
	disabled: 0x6f6a64,
	// Button fills (docs/visual.md §3): light, under dark ink. Accents go through buttonFill().
	buttonLight: 0xdcc8a8,
	buttonOff: 0xc8c2b9,
	// The table: felt and its wooden rim.
	felt: 0x24644d,
	feltDark: 0x1b4d3b,
	feltLight: 0x2f7a5e,
	// Felt of the other rooms: blue (Championships 4–6) and red (7–8).
	feltBlue: 0x2f5c86,
	feltRed: 0x8e2f2a,
	/** Multiplied over the green painted felt of the table in Championships 4–6 and 7–8. */
	feltBlueTint: 0x6f9bff,
	feltRedTint: 0xff7a6a,
	wood: 0x7a4b2b,
	woodDark: 0x543320,
	// Cards.
	cardFace: 0xf8f0de,
	cardEdge: 0xdacdb2,
	cardBack: 0xb9412f,
	cardBackTrim: 0xf3d89c,
	/** Frame of the painted card backs and outline of the menu title. */
	inkPlum: 0x2a1220,
	// Menu title's sunset gradient, top to bottom (src/art/title.ts).
	sunsetTop: 0xffe45c,
	sunsetMid: 0xff9a2e,
	sunsetLow: 0xff4f87,
	suitRed: 0xd3392d,
	suitBlack: 0x26222b,
	suitOrange: 0xe27a1f,
	suitGreen: 0x2f8f4e,
	manilha: 0xf4c542,
	jokerPurple: 0x7a4bc2,
	// Score and economy (Fichas blue, Mult vermilion).
	chips: 0x3f7fc0,
	mult: 0xe4572e,
	money: 0xf4c542,
	fame: 0xb072e0,
	// Feedback and actions.
	good: 0x47b468,
	bad: 0xe5533d,
	cta: 0xe8862a,
	ctaHover: 0xf59e45,
	calm: 0x3f7fc0,
	// Signal button: teal, so it never reads as the Fichas blue.
	signal: 0x2fa7b8,
	truco: 0xd2392f,
	trucoHover: 0xe85445,
	// Rarity (Manhas).
	rarityCommon: 0x9aa3ad,
	rarityUncommon: 0x47b468,
	rarityRare: 0x3f86e0,
	rarityLegendary: 0xb072e0,
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const toCss = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

/** `c` mixed towards white (t > 0) or black (t < 0) by |t| (0–1). */
export function shade(c: number, t: number): number {
	const to = t > 0 ? 255 : 0;
	const k = Math.abs(t);
	const ch = (s: number) => Math.round(((c >> s) & 255) + (to - ((c >> s) & 255)) * k);
	return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Readable ink over a fill: dark on light colours, cream on dark ones. */
export function inkOn(c: number): number {
	const l = 0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255);
	return l > 165 ? PALETTE.textDark : PALETTE.textLight;
}

/** WCAG 2 contrast ratio between two colours (1–21). */
export function contrast(a: number, b: number): number {
	const lum = (c: number): number => {
		const ch = (s: number): number => {
			const v = ((c >> s) & 255) / 255;
			return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
		};
		return 0.2126 * ch(16) + 0.7152 * ch(8) + 0.0722 * ch(0);
	};
	const [x, y] = [lum(a), lum(b)];
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

type Hsl = [h: number, s: number, l: number];

function toHsl(c: number): Hsl {
	const [r, g, b] = [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	const h =
		max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [h / 6, s, l];
}

function fromHsl([h, s, l]: Hsl): number {
	const f = (n: number): number => {
		const k = (n + h * 12) % 12;
		const a = s * Math.min(l, 1 - l);
		return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
	};
	return (f(0) << 16) | (f(8) << 8) | f(4);
}

/** Contrast every button fill keeps with its dark ink (WCAG AA is 4.5; the margin covers hover). */
export const BUTTON_INK_CONTRAST = 5;
const fills = new Map<number, number>();

/**
 * The fill of a button with accent `c`: the same hue and saturation, lightened only as far as the
 * dark ink needs (green stays green, the truco red turns a lighter red). No accent: light wood.
 */
export function buttonFill(c: number | undefined): number {
	if (c === undefined || c === PALETTE.textLight || c === PALETTE.button)
		return PALETTE.buttonLight;
	let fill = fills.get(c);
	if (fill === undefined) {
		const [h, s, l] = toHsl(c);
		let x = l;
		fill = c;
		while (contrast(fill, PALETTE.textDark) < BUTTON_INK_CONTRAST && x < 1) {
			x = Math.min(1, x + 0.005);
			fill = fromHsl([h, s, x]);
		}
		fills.set(c, fill);
	}
	return fill;
}

/** Hover and focus: the fill a step lighter (more contrast, never less). */
export function buttonHover(fill: number): number {
	const [h, s, l] = toHsl(fill);
	return fromHsl([h, s, Math.min(0.92, l + 0.07)]);
}

/**
 * Brightness of every painted backdrop behind the game's screens (the main menu keeps its own,
 * at full brightness): a multiply tint, so the sunset keeps its hue while panels, cards and HUD
 * stand out on it.
 */
export const BACKDROP_BRIGHTNESS = 0.4;
/** The shop's chalkboard holds the UI: its painting stays brighter than the other backdrops. */
export const SHOP_BACKDROP_BRIGHTNESS = 0.75;

export const RARITY_COLOR: Record<Rarity, number> = {
	common: PALETTE.rarityCommon,
	uncommon: PALETTE.rarityUncommon,
	rare: PALETTE.rarityRare,
	legendary: PALETTE.rarityLegendary,
};
