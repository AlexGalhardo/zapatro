import type Phaser from 'phaser';
import { PALETTE, RARITY_COLOR, shade, toCss } from '../config/palette';
import { RADIUS, SHADOW } from '../config/ui';
import { MANHA_BY_ID } from '../data/manhas';
import { type Card, isSpecial } from '../logic/truco/cards';
import { drawSignalIcon, drawVectorIcon, VECTOR_ICONS } from './icons';

/**
 * The flat art of the game (docs/visual.md): every visual key is drawn by code on a 2D canvas,
 * vector shapes only (cards, backs, avatars, bosses, icons). Views ask for textures through
 * `tex()`, which draws the key on first use. Textures are rasterized at the screen's zoom
 * (`RES`) and keep their logical size, so they stay sharp at any resolution.
 */

type Ctx = CanvasRenderingContext2D;

export const CARD_W = 48;
export const CARD_H = 64;
export const PORTRAIT = 48;
/** The small card-back of an NPC's hand: the whole 2:3 painting, never cropped or stretched. */
export const BACK_TILE_W = 32;
export const BACK_TILE_H = 48;
export const ICON = 48;

/** Raster scale: the logical-to-screen zoom of this display (2–6). */
const RES = Math.min(
	6,
	Math.max(2, Math.ceil(((window.screen?.height ?? 720) * (window.devicePixelRatio || 1)) / 360)),
);

const css = toCss;
const FONT = '"Rubik", "Segoe UI", sans-serif';

/**
 * A canvas texture of logical size w×h drawn at `RES`× (more for keys shown scaled up): the
 * frame keeps the logical size, so images, hit areas and layouts never see the raster scale.
 */
export function canvasTex(
	scene: Phaser.Scene,
	key: string,
	w: number,
	h: number,
	draw: (ctx: Ctx) => void,
	extra = 1,
): string {
	if (scene.textures.exists(key)) return key;
	const res = RES * extra;
	const t = scene.textures.createCanvas(key, Math.ceil(w * res), Math.ceil(h * res));
	if (!t) return key;
	const ctx = t.getContext();
	ctx.scale(res, res);
	draw(ctx);
	t.refresh();
	// Phaser 4 divides the drawn size by the source resolution; the frame's logical size is
	// what Size, origin and input read (Frame.realWidth comes from sourceSize).
	const source = t.source[0];
	if (source) source.resolution = res;
	const f = t.get();
	f.width = w;
	f.height = h;
	f.halfWidth = w / 2;
	f.halfHeight = h / 2;
	f.centerX = Math.floor(w / 2);
	f.centerY = Math.floor(h / 2);
	const { data } = f as unknown as {
		data: { sourceSize: { w: number; h: number }; spriteSourceSize: { w: number; h: number } };
	};
	data.sourceSize.w = w;
	data.sourceSize.h = h;
	data.spriteSourceSize.w = w;
	data.spriteSourceSize.h = h;
	return key;
}

// --- Shapes -------------------------------------------------------------------------------

function box(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, c: number): void {
	ctx.fillStyle = css(c);
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
	ctx.fill();
}

/**
 * A flat panel as a texture: the rounded block of `drawPanel` (src/ui/panel.ts) over its solid
 * drop shadow. For static panels: WebGL re-triangulates a Graphics every frame (the table
 * sidebar cost ~1.5 ms per frame and garbage), an Image is one quad. Logical size w × (h + shadow).
 */
export function panelTex(
	scene: Phaser.Scene,
	w: number,
	h: number,
	fill: number,
	radius: number,
	shadow = 0,
): string {
	const key = `ui.panel.${w}x${h}.${fill.toString(16)}.${radius}.${shadow}`;
	return canvasTex(scene, key, w, h + shadow, (ctx) => {
		const r = Math.min(radius, w / 2, h / 2);
		if (shadow) {
			ctx.globalAlpha = SHADOW.panelAlpha;
			box(ctx, 0, shadow, w, h, r, PALETTE.shadow);
			ctx.globalAlpha = 1;
		}
		box(ctx, 0, 0, w, h, r, fill);
	});
}

function circle(ctx: Ctx, x: number, y: number, r: number, c: number): void {
	ctx.fillStyle = css(c);
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
}

function poly(ctx: Ctx, pts: readonly (readonly [number, number])[], c: number): void {
	ctx.fillStyle = css(c);
	ctx.beginPath();
	for (const [i, [x, y]] of pts.entries()) i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
	ctx.closePath();
	ctx.fill();
}

function label(
	ctx: Ctx,
	text: string,
	x: number,
	y: number,
	px: number,
	c: number,
	align: CanvasTextAlign = 'center',
): void {
	ctx.fillStyle = css(c);
	ctx.font = `700 ${px}px ${FONT}`;
	ctx.textAlign = align;
	ctx.textBaseline = 'middle';
	ctx.fillText(text, x, y);
}

/** Suit of size `s` centred on (x, y). */
export function suit(ctx: Ctx, name: string, x: number, y: number, s: number, c: number): void {
	ctx.fillStyle = css(c);
	ctx.beginPath();
	const h = s / 2;
	if (name === 'diamonds') {
		poly(
			ctx,
			[
				[x, y - h],
				[x + h * 0.78, y],
				[x, y + h],
				[x - h * 0.78, y],
			],
			c,
		);
		return;
	}
	if (name === 'hearts') {
		ctx.moveTo(x, y + h);
		ctx.bezierCurveTo(x - h * 1.25, y + h * 0.05, x - h * 0.95, y - h * 1.05, x, y - h * 0.42);
		ctx.bezierCurveTo(x + h * 0.95, y - h * 1.05, x + h * 1.25, y + h * 0.05, x, y + h);
		ctx.fill();
		return;
	}
	if (name === 'spades') {
		ctx.moveTo(x, y - h);
		ctx.bezierCurveTo(x + h * 1.3, y - h * 0.1, x + h * 0.95, y + h * 0.85, x, y + h * 0.35);
		ctx.bezierCurveTo(x - h * 0.95, y + h * 0.85, x - h * 1.3, y - h * 0.1, x, y - h);
		ctx.fill();
	} else {
		circle(ctx, x, y - h * 0.45, h * 0.45, c);
		circle(ctx, x - h * 0.5, y + h * 0.15, h * 0.45, c);
		circle(ctx, x + h * 0.5, y + h * 0.15, h * 0.45, c);
		circle(ctx, x, y, h * 0.3, c);
	}
	poly(
		ctx,
		[
			[x - h * 0.12, y],
			[x + h * 0.12, y],
			[x + h * 0.38, y + h],
			[x - h * 0.38, y + h],
		],
		c,
	);
}

function star(ctx: Ctx, x: number, y: number, r: number, c: number, points = 5): void {
	const pts: [number, number][] = [];
	for (let i = 0; i < points * 2; i++) {
		const a = -Math.PI / 2 + (i * Math.PI) / points;
		const rr = i % 2 ? r * 0.45 : r;
		pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
	}
	poly(ctx, pts, c);
}

// --- Cards --------------------------------------------------------------------------------

export function suitColor(name: string, fourColor: boolean): number {
	if (fourColor && name === 'diamonds') return PALETTE.suitOrange;
	if (fourColor && name === 'clubs') return PALETTE.suitGreen;
	return name === 'hearts' || name === 'diamonds' ? PALETTE.suitRed : PALETTE.suitBlack;
}

function cardBody(ctx: Ctx, fill: number = PALETTE.cardFace): void {
	box(ctx, 0, 0, CARD_W, CARD_H, 5, PALETTE.cardEdge);
	box(ctx, 1, 1, CARD_W - 2, CARD_H - 2, RADIUS.card, fill);
}

/**
 * The manilha plate (Art Bible §6): a 24×8 gold plate at the foot of the face, "ZAP" on the
 * ZAP and a star on the other manilhas, so a manilha reads without colour. It sits left of
 * centre because the upside-down index takes the bottom-right corner.
 */
function manilhaPlate(ctx: Ctx, zap: boolean): void {
	const x = 9;
	const y = CARD_H - 13;
	box(ctx, x, y, 24, 8, 2, PALETTE.manilha);
	if (zap) label(ctx, 'ZAP', x + 12, y + 4.5, 7, PALETTE.panelDark);
	else star(ctx, x + 12, y + 4, 3.6, PALETTE.panelDark);
}

/**
 * Flat face: rank and suit in two corners and one big suit in the middle (courts included).
 * `mark`: the manilhas of this hand get a 2 px gold frame and the gold plate at the foot.
 */
function drawCard(ctx: Ctx, rank: string, name: string, fourColor: boolean, mark = ''): void {
	cardBody(ctx);
	if (mark) {
		ctx.strokeStyle = css(PALETTE.manilha);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(2, 2, CARD_W - 4, CARD_H - 4, 3);
		ctx.stroke();
		manilhaPlate(ctx, mark === 'z');
	}
	const c = suitColor(name, fourColor);
	label(ctx, rank, 9, 9, 12, c);
	suit(ctx, name, 9, 20, 7, c);
	ctx.save();
	ctx.translate(CARD_W, CARD_H);
	ctx.rotate(Math.PI);
	label(ctx, rank, 9, 9, 12, c);
	suit(ctx, name, 9, 20, 7, c);
	ctx.restore();
	suit(ctx, name, CARD_W / 2, CARD_H / 2, rank === 'A' ? 26 : 20, c);
}

/** Texture key of a card face (the joker and each special card have one face for the whole deck). */
export const cardArt = (card: Card): string =>
	isSpecial(card) ? `card.${card.rank}` : `card.${card.rank}.${card.suit}`;

/** The same face framed in gold: `m` a manilha of this hand, `z` the ZAP. */
export const markedArt = (key: string, mark: 'm' | 'z'): string => `${key}.${mark}`;

/**
 * The painted faces of the joker and the special cards (back/<key>.webp) are 2:3 like the painted
 * back: the whole picture at the card's height, centred, so face and back have the same size.
 */
function paintedFace(ctx: Ctx, key: string): boolean {
	const painted = backBitmaps.get(key);
	if (!painted) return false;
	const pw = (CARD_H * 2) / 3;
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(painted, (CARD_W - pw) / 2, 0, pw, CARD_H);
	return true;
}

/** The joker: a purple card with a gold star and the three-tip hat over it. */
function drawJoker(ctx: Ctx): void {
	if (paintedFace(ctx, 'joker')) return;
	cardBody(ctx, PALETTE.jokerPurple);
	const tips = [PALETTE.suitRed, PALETTE.manilha, PALETTE.suitGreen];
	tips.forEach((c, i) => {
		const x = 12 + i * 12;
		poly(
			ctx,
			[
				[x - 6, 28],
				[x + 6, 28],
				[x + (i - 1) * 3, 12],
			],
			c,
		);
		circle(ctx, x + (i - 1) * 3, 11, 2.5, PALETTE.cardFace);
	});
	box(ctx, 5, 27, 38, 5, 2, PALETTE.cardFace);
	star(ctx, 24, 45, 11, PALETTE.manilha);
	label(ctx, '★', 7, 7, 7, PALETTE.cardFace);
}

/** The special cards: a coloured card with a big symbol, the Clover, the Eye or the Lightning. */
const SPECIAL_LOOK = {
	trevo: PALETTE.suitGreen,
	olho: PALETTE.chips,
	raio: PALETTE.mult,
} as const;

function drawSpecial(ctx: Ctx, rank: keyof typeof SPECIAL_LOOK): void {
	if (paintedFace(ctx, rank)) return;
	const body = SPECIAL_LOOK[rank];
	cardBody(ctx, body);
	const ink = PALETTE.cardFace;
	const cx = CARD_W / 2;
	const cy = CARD_H / 2 + 1;
	if (rank === 'trevo') {
		for (const [dx, dy] of [
			[-6, -6],
			[6, -6],
			[-6, 6],
			[6, 6],
		] as const)
			circle(ctx, cx + dx, cy + dy, 7, ink);
		poly(
			ctx,
			[
				[cx - 1.5, cy],
				[cx + 1.5, cy],
				[cx + 5, cy + 20],
				[cx + 1, cy + 20],
			],
			ink,
		);
	} else if (rank === 'olho') {
		ctx.fillStyle = css(ink);
		ctx.beginPath();
		ctx.ellipse(cx, cy, 18, 10, 0, 0, Math.PI * 2);
		ctx.fill();
		circle(ctx, cx, cy, 7, body);
		circle(ctx, cx, cy, 3, ink);
	} else
		poly(
			ctx,
			[
				[cx + 4, cy - 22],
				[cx - 12, cy + 3],
				[cx - 1, cy + 3],
				[cx - 5, cy + 22],
				[cx + 12, cy - 5],
				[cx + 1, cy - 5],
			],
			ink,
		);
	star(ctx, 9, 9, 4, ink);
	ctx.save();
	ctx.translate(CARD_W, CARD_H);
	ctx.rotate(Math.PI);
	star(ctx, 9, 9, 4, ink);
	ctx.restore();
}

/** Card back: a cream frame, a diamond lattice and a round seal. Each deck has its colour. */
const BACK_COLOR: Record<string, number> = {
	default: PALETTE.cardBack,
	interior: 0x2f7f5b,
	blefe: 0x5a3f8f,
	dinheiro: 0xb88a1f,
	viciado: 0x2e5f8f,
};

/**
 * The painted back is a 2:3 picture: drawn whole (frame included) at the height of the box and
 * centred, so the 48×64 back is a little narrower than a face and the NPC tiles are exactly 2:3;
 * nothing is cropped or stretched.
 */
function drawBack(ctx: Ctx, deck: string, w = CARD_W, h = CARD_H): void {
	const painted = backBitmaps.get(deck);
	if (painted) {
		const pw = Math.min(w, (h * 2) / 3);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(painted, (w - pw) / 2, 0, pw, h);
		return;
	}
	if (w !== CARD_W || h !== CARD_H) ctx.scale(w / CARD_W, h / CARD_H);
	const c = BACK_COLOR[deck] ?? PALETTE.cardBack;
	box(ctx, 0, 0, CARD_W, CARD_H, 5, shade(c, -0.35));
	box(ctx, 1, 1, CARD_W - 2, CARD_H - 2, RADIUS.card, c);
	ctx.strokeStyle = css(PALETTE.cardBackTrim);
	ctx.lineWidth = 1.2;
	ctx.beginPath();
	ctx.roundRect(4, 4, CARD_W - 8, CARD_H - 8, 3);
	ctx.stroke();
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(5, 5, CARD_W - 10, CARD_H - 10, 2);
	ctx.clip();
	ctx.strokeStyle = css(shade(c, 0.18));
	ctx.lineWidth = 1;
	for (let k = -CARD_H; k < CARD_W + CARD_H; k += 8) {
		ctx.beginPath();
		ctx.moveTo(k, 0);
		ctx.lineTo(k + CARD_H, CARD_H);
		ctx.moveTo(k + CARD_H, 0);
		ctx.lineTo(k, CARD_H);
		ctx.stroke();
	}
	ctx.restore();
	circle(ctx, CARD_W / 2, CARD_H / 2, 10, PALETTE.cardBackTrim);
	label(ctx, 'Z', CARD_W / 2, CARD_H / 2 + 0.5, 13, c);
}

/** Card modifier overlay: a coloured frame and a badge with the modifier's mark. */
const MOD_LOOK: Record<string, [number, string]> = {
	gold: [PALETTE.money, '$'],
	heavy: [PALETTE.chips, '+'],
	hot: [PALETTE.mult, '♨'],
	nervosa: [PALETTE.cta, '!'],
	mentirosa: [PALETTE.fame, '?'],
	marcada: [PALETTE.good, '●'],
	vidro: [0x9fd8e6, '◇'],
};

function drawMod(ctx: Ctx, id: string): void {
	const [c, mark] = MOD_LOOK[id] ?? [PALETTE.panelBorder, '•'];
	ctx.strokeStyle = css(c);
	ctx.lineWidth = 2.5;
	ctx.beginPath();
	ctx.roundRect(1.25, 1.25, CARD_W - 2.5, CARD_H - 2.5, 4);
	ctx.stroke();
	circle(ctx, CARD_W - 9, 9, 7, c);
	label(ctx, mark, CARD_W - 9, 9.5, 9, PALETTE.textDark);
}

// --- Characters ---------------------------------------------------------------------------

type Hair = 'bald' | 'short' | 'bun' | 'afro' | 'curlers' | 'long' | 'slick';
type Hat = 'cap' | 'cowboy' | 'straw' | 'fedora' | 'police' | 'mortar' | 'crown' | 'turban';
interface Look {
	bg: number;
	skin: number;
	shirt: number;
	hair?: Hair;
	hairColor?: number;
	hat?: Hat;
	hatColor?: number;
	beard?: number;
	mustache?: number;
	glasses?: boolean;
	shades?: boolean;
	extra?: 'bandana' | 'collar' | 'chain' | 'clover' | 'earrings' | 'zip';
}

const BROWN = 0x2b1d14;

/** Flat avatars of the table characters (src/data/characters.ts and partners.ts ids). */
const LOOKS: Record<string, Look> = {
	tonhao: { bg: 0xc4553f, skin: 0x8d5a3b, shirt: 0xb83a2e, hair: 'bald', beard: BROWN },
	donaCida: {
		bg: 0x8e74c4,
		skin: 0xe6b98f,
		shirt: 0x7fa7c9,
		hair: 'bun',
		hairColor: 0xd9d9d9,
		glasses: true,
	},
	zeMalandro: {
		bg: 0xd98a3a,
		skin: 0xc68a5e,
		shirt: 0xf2efe6,
		hat: 'fedora',
		hatColor: 0xf0e2b6,
		mustache: BROWN,
	},
	juninho: {
		bg: 0x3c9fc9,
		skin: 0xd9a77a,
		shirt: 0x2f6fb0,
		hair: 'short',
		hairColor: BROWN,
		hat: 'cap',
		hatColor: 0xf4c542,
	},
	ze: {
		bg: 0x7aa34a,
		skin: 0xb97a52,
		shirt: 0x5f8f3e,
		hat: 'straw',
		hatColor: 0xe8cf7a,
		mustache: BROWN,
	},
	bia: { bg: 0xe8b13a, skin: 0x7a4a2e, shirt: 0xf4d03f, hair: 'afro', hairColor: 0x1d1410 },
	joca: {
		bg: 0x3f9a62,
		skin: 0xb9825a,
		shirt: 0xf2efe6,
		hair: 'short',
		hairColor: BROWN,
		hat: 'cap',
		hatColor: 0x2f8f4e,
		beard: BROWN,
	},
	lurdes: {
		bg: 0xd9708f,
		skin: 0xc98f63,
		shirt: 0xe46a8a,
		hair: 'curlers',
		hairColor: 0x5a2e1d,
		extra: 'earrings',
	},
	tiao: {
		bg: 0xa8743f,
		skin: 0x8a5a3c,
		shirt: 0xb06b3a,
		hat: 'cowboy',
		hatColor: 0x6b4428,
		beard: 0xeeeeee,
	},
	neide: {
		bg: 0x3fa8a0,
		skin: 0xe0b08a,
		shirt: 0x2f8a83,
		hair: 'long',
		hairColor: 0xb5462f,
		glasses: true,
	},
	// Bosses (drawn at 96 px over a dark red ring).
	valentao: {
		bg: 0x7a2a22,
		skin: 0x9a6440,
		shirt: 0x333338,
		hair: 'bald',
		beard: BROWN,
		extra: 'bandana',
	},
	cartomante: {
		bg: 0x5a3f8f,
		skin: 0xcf9a72,
		shirt: 0x6b3fa0,
		hat: 'turban',
		hatColor: 0x8e5bd0,
		extra: 'earrings',
	},
	juiz: {
		bg: 0x4a4a55,
		skin: 0xe6b98f,
		shirt: 0x1f1f24,
		hair: 'short',
		hairColor: 0xeeeeee,
		glasses: true,
		extra: 'collar',
	},
	agiota: {
		bg: 0x2f5f4f,
		skin: 0xc68a5e,
		shirt: 0x2f2f3a,
		hair: 'slick',
		hairColor: 0x111111,
		shades: true,
		extra: 'chain',
	},
	delegado: {
		bg: 0x2f4f7f,
		skin: 0xa86f4a,
		shirt: 0x2f4f7f,
		hat: 'police',
		hatColor: 0x1f2f4f,
		mustache: BROWN,
	},
	professor: {
		bg: 0x8a6a3a,
		skin: 0xe6b98f,
		shirt: 0x7a5a3a,
		hair: 'short',
		hairColor: 0x9a9a9a,
		glasses: true,
		hat: 'mortar',
		hatColor: 0x222228,
	},
	irmaos: { bg: 0x9a4a2f, skin: 0xb9825a, shirt: 0x4f6f3f, hair: 'short', hairColor: BROWN },
	mudo: {
		bg: 0x55555f,
		skin: 0xd09a6e,
		shirt: 0x55555f,
		hair: 'short',
		hairColor: 0x3a2a1e,
		extra: 'zip',
	},
	sortuda: {
		bg: 0x2f8f4e,
		skin: 0xe8b890,
		shirt: 0x2f8f4e,
		hair: 'long',
		hairColor: 0xe8c35a,
		extra: 'clover',
	},
	reiDoTruco: {
		bg: 0x8f2a22,
		skin: 0x9a6440,
		shirt: 0xb9412f,
		hat: 'crown',
		hatColor: PALETTE.manilha,
		beard: 0xeeeeee,
	},
};

const FALLBACK: Look = { bg: 0x6a5a4e, skin: 0xd9a77a, shirt: 0x52443a, hair: 'short' };

/** One face in a box of size s at (ox, oy): head, hair, hat, features and the expression. */
function face(ctx: Ctx, look: Look, expr: string, ox: number, oy: number, s: number): void {
	const u = s / 48;
	const X = (v: number) => ox + v * u;
	const Y = (v: number) => oy + v * u;
	const hx = X(24);
	const hy = Y(22);
	const hr = 11 * u;
	const hairC = look.hairColor ?? BROWN;
	// Shoulders and neck.
	ctx.fillStyle = css(look.shirt);
	ctx.beginPath();
	ctx.ellipse(X(24), Y(50), 19 * u, 15 * u, 0, 0, Math.PI * 2);
	ctx.fill();
	box(ctx, X(20), Y(28), 8 * u, 8 * u, 2 * u, shade(look.skin, -0.12));
	if (look.extra === 'collar') {
		poly(
			ctx,
			[
				[X(17), Y(36)],
				[X(24), Y(41)],
				[X(31), Y(36)],
				[X(24), Y(46)],
			],
			0xf2efe6,
		);
	}
	if (look.extra === 'chain') {
		ctx.strokeStyle = css(PALETTE.manilha);
		ctx.lineWidth = 1.6 * u;
		ctx.beginPath();
		ctx.arc(X(24), Y(34), 7 * u, 0.15 * Math.PI, 0.85 * Math.PI);
		ctx.stroke();
	}
	// Hair behind the head.
	if (look.hair === 'afro') circle(ctx, hx, hy - 3 * u, 16 * u, hairC);
	if (look.hair === 'long') box(ctx, hx - 13 * u, hy - 9 * u, 26 * u, 24 * u, 9 * u, hairC);
	if (look.hair === 'bun') circle(ctx, hx, hy - 13 * u, 5.5 * u, hairC);
	// Head.
	circle(ctx, hx, hy, hr, look.skin);
	// Hair on top.
	if (look.hair && look.hair !== 'bald' && look.hair !== 'afro') {
		ctx.fillStyle = css(hairC);
		ctx.beginPath();
		ctx.arc(hx, hy, hr + 0.6 * u, Math.PI * 1.02, Math.PI * 1.98);
		ctx.closePath();
		ctx.fill();
		if (look.hair === 'slick') box(ctx, hx - hr, hy - 4 * u, 3 * u, 6 * u, u, hairC);
	}
	if (look.hair === 'curlers')
		for (let i = 0; i < 4; i++)
			circle(ctx, hx - 9 * u + i * 6 * u, hy - 10 * u, 2.6 * u, 0xf2a0b8);
	if (look.extra === 'earrings') {
		circle(ctx, hx - hr, hy + 4 * u, 1.8 * u, PALETTE.manilha);
		circle(ctx, hx + hr, hy + 4 * u, 1.8 * u, PALETTE.manilha);
	}
	// Beard and mustache.
	if (look.beard !== undefined) {
		// A band along the jaw: the mouth stays on the skin.
		ctx.strokeStyle = css(look.beard);
		ctx.lineWidth = 4 * u;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.arc(hx, hy + 0.5 * u, hr - 1.6 * u, Math.PI * 0.08, Math.PI * 0.92);
		ctx.stroke();
	}
	if (look.mustache !== undefined)
		box(ctx, hx - 5 * u, hy + 3.5 * u, 10 * u, 2.4 * u, 1.2 * u, look.mustache);
	// Eyes and mouth (the expression).
	const ink = PALETTE.textDark;
	const eyeY = hy - 1 * u;
	const eye = (x: number, y: number) => circle(ctx, x, y, 1.5 * u, ink);
	const lx = hx - 4.5 * u;
	const rx = hx + 4.5 * u;
	if (expr === 'wink') {
		eye(lx, eyeY);
		box(ctx, rx - 2 * u, eyeY - 0.5 * u, 4 * u, 1.2 * u, 0.6 * u, ink);
	} else if (expr === 'up') {
		eye(lx, eyeY - 2 * u);
		eye(rx, eyeY - 2 * u);
	} else {
		eye(lx, eyeY);
		eye(rx, eyeY);
	}
	if (expr === 'eyebrow') box(ctx, rx - 2.5 * u, eyeY - 5 * u, 5 * u, 1.3 * u, 0.6 * u, ink);
	if (expr === 'angry') {
		poly(
			ctx,
			[
				[lx - 3 * u, eyeY - 4.5 * u],
				[lx + 2.5 * u, eyeY - 2.5 * u],
				[lx + 2.5 * u, eyeY - 1.5 * u],
				[lx - 3 * u, eyeY - 3.5 * u],
			],
			ink,
		);
		poly(
			ctx,
			[
				[rx + 3 * u, eyeY - 4.5 * u],
				[rx - 2.5 * u, eyeY - 2.5 * u],
				[rx - 2.5 * u, eyeY - 1.5 * u],
				[rx + 3 * u, eyeY - 3.5 * u],
			],
			ink,
		);
	}
	const my = hy + 6.5 * u;
	ctx.strokeStyle = css(ink);
	ctx.lineWidth = 1.3 * u;
	ctx.lineCap = 'round';
	ctx.beginPath();
	if (look.extra === 'zip') {
		ctx.moveTo(hx - 4 * u, my);
		ctx.lineTo(hx + 4 * u, my);
		for (let i = -3; i <= 3; i += 2) {
			ctx.moveTo(hx + i * u, my - 1.2 * u);
			ctx.lineTo(hx + i * u, my + 1.2 * u);
		}
	} else if (expr === 'happy') ctx.arc(hx, my - 2 * u, 4 * u, 0.15 * Math.PI, 0.85 * Math.PI);
	else if (expr === 'angry' || expr === 'sweat')
		ctx.arc(hx, my + 3 * u, 3.5 * u, 1.2 * Math.PI, 1.8 * Math.PI);
	else if (expr === 'mouth') {
		ctx.moveTo(hx - 3 * u, my);
		ctx.lineTo(hx + 4 * u, my - 1.5 * u);
	} else if (expr === 'lip') {
		ctx.moveTo(hx - 3 * u, my);
		ctx.lineTo(hx + 3 * u, my);
	} else {
		ctx.moveTo(hx - 2.5 * u, my);
		ctx.lineTo(hx + 2.5 * u, my);
	}
	ctx.stroke();
	if (expr === 'tongue') box(ctx, hx - 1.6 * u, my, 3.2 * u, 3.6 * u, 1.6 * u, 0xe05a6a);
	if (expr === 'lip') box(ctx, hx - 1.5 * u, my - 0.4 * u, 3 * u, 1.6 * u, 0.6 * u, 0xf2efe6);
	if (expr === 'sweat') {
		ctx.fillStyle = css(0x8fd3ff);
		ctx.beginPath();
		ctx.ellipse(hx + 10 * u, hy - 5 * u, 1.6 * u, 2.4 * u, 0, 0, Math.PI * 2);
		ctx.fill();
	}
	if (look.glasses || look.shades) {
		const c = look.shades ? 0x111111 : 0x2a2a2a;
		ctx.strokeStyle = css(c);
		ctx.lineWidth = 1.1 * u;
		ctx.beginPath();
		ctx.arc(lx, eyeY, 3.2 * u, 0, Math.PI * 2);
		ctx.moveTo(rx + 3.2 * u, eyeY);
		ctx.arc(rx, eyeY, 3.2 * u, 0, Math.PI * 2);
		ctx.moveTo(lx + 3.2 * u, eyeY);
		ctx.lineTo(rx - 3.2 * u, eyeY);
		ctx.stroke();
		if (look.shades) {
			circle(ctx, lx, eyeY, 3.2 * u, c);
			circle(ctx, rx, eyeY, 3.2 * u, c);
		}
	}
	// Hats.
	const hc = look.hatColor ?? BROWN;
	const top = hy - hr;
	switch (look.hat) {
		case 'cap':
			ctx.fillStyle = css(hc);
			ctx.beginPath();
			ctx.arc(hx, hy - 1 * u, hr + 0.8 * u, Math.PI, 0);
			ctx.closePath();
			ctx.fill();
			box(ctx, hx - 2 * u, hy - 2.5 * u, 16 * u, 3 * u, 1.5 * u, shade(hc, -0.25));
			break;
		case 'cowboy':
		case 'straw':
		case 'fedora': {
			const wide = look.hat === 'cowboy' ? 17 : look.hat === 'straw' ? 16 : 14;
			ctx.fillStyle = css(hc);
			ctx.beginPath();
			ctx.ellipse(hx, top + 3 * u, wide * u, 3 * u, 0, 0, Math.PI * 2);
			ctx.fill();
			box(ctx, hx - 8 * u, top - 7 * u, 16 * u, 10 * u, 4 * u, hc);
			box(ctx, hx - 8 * u, top - 0.5 * u, 16 * u, 2.5 * u, 0, shade(hc, -0.35));
			break;
		}
		case 'police':
			box(ctx, hx - 12 * u, top - 4 * u, 24 * u, 9 * u, 3 * u, hc);
			box(ctx, hx - 13 * u, top + 3 * u, 26 * u, 3 * u, 1.5 * u, 0x111111);
			star(ctx, hx, top, 3 * u, PALETTE.manilha);
			break;
		case 'mortar':
			poly(
				ctx,
				[
					[hx - 15 * u, top - 2 * u],
					[hx, top - 7 * u],
					[hx + 15 * u, top - 2 * u],
					[hx, top + 3 * u],
				],
				hc,
			);
			box(ctx, hx + 9 * u, top - 2 * u, 1.4 * u, 9 * u, 0.7 * u, PALETTE.manilha);
			break;
		case 'crown':
			poly(
				ctx,
				[
					[hx - 11 * u, top + 3 * u],
					[hx - 11 * u, top - 8 * u],
					[hx - 5.5 * u, top - 2 * u],
					[hx, top - 10 * u],
					[hx + 5.5 * u, top - 2 * u],
					[hx + 11 * u, top - 8 * u],
					[hx + 11 * u, top + 3 * u],
				],
				hc,
			);
			circle(ctx, hx, top - 1 * u, 1.8 * u, PALETTE.suitRed);
			break;
		case 'turban':
			ctx.fillStyle = css(hc);
			ctx.beginPath();
			ctx.ellipse(hx, top + 1 * u, 13 * u, 8 * u, 0, Math.PI, 0);
			ctx.closePath();
			ctx.fill();
			circle(ctx, hx, top - 1 * u, 2.6 * u, PALETTE.manilha);
			break;
	}
	if (look.extra === 'bandana')
		box(ctx, hx - hr, top + 1 * u, hr * 2, 4 * u, 2 * u, PALETTE.suitRed);
	if (look.extra === 'clover') {
		for (const [dx, dy] of [
			[-1.6, -1.6],
			[1.6, -1.6],
			[-1.6, 1.6],
			[1.6, 1.6],
		] as const)
			circle(ctx, hx + 9 * u + dx * u, top + 2 * u + dy * u, 1.8 * u, 0x3fbf5f);
	}
}

/** Round avatar of a character (48 px) or a boss (96 px, dark ring): `portrait.<id>.<expr>`. */
/** Portrait bitmaps loaded at boot (public/assets/gfx/portrait, scripts/portraits.ts). */
const bitmaps = new Map<string, CanvasImageSource>();

/** Hands the loaded portrait PNGs to the drawing code; ids without a PNG keep the drawn face. */
export function registerPortraits(scene: Phaser.Scene): void {
	for (const key of scene.textures.getTextureKeys()) {
		const source = (): CanvasImageSource =>
			scene.textures.get(key).getSourceImage() as CanvasImageSource;
		if (key.startsWith(PORTRAIT_PREFIX))
			bitmaps.set(key.slice(PORTRAIT_PREFIX.length), source());
		else if (key.startsWith(ICON_PREFIX))
			iconBitmaps.set(key.slice(ICON_PREFIX.length), source());
		else if (key.startsWith(BACK_PREFIX))
			backBitmaps.set(key.slice(BACK_PREFIX.length), source());
		else if (key.startsWith(CHAR_CARD_PREFIX))
			charCardBitmaps.set(key.slice(CHAR_CARD_PREFIX.length), source());
	}
	// A portrait, icon or card asked for before this ran (a scene started while Boot was still
	// loading, or before the late pictures landed) was cached with the drawn fallback; redraw it
	// in place now that the bitmaps exist.
	for (const key of scene.textures.getTextureKeys()) {
		if (!/^(portrait|boss|icon|charcard|charcover|card)\./.test(key)) continue;
		const source = scene.textures.get(key).source[0];
		const canvas = source?.image;
		if (!source || !(canvas instanceof HTMLCanvasElement)) continue;
		const ctx = canvas.getContext('2d');
		if (!ctx) continue;
		// A rotated copy (`card.raio@-8`, the hand's fan) is redrawn from its base key: drawn as a
		// key of its own, `raio@-8` reads as a rank and `diamonds@8` as an unknown suit.
		const tilt = parseTiltedKey(key);
		const [w, h] = tilt ? tiltedSize(tilt.key, tilt.deg) : sizeOf(key);
		const res = canvas.width / w;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.setTransform(res, 0, 0, res, 0, 0);
		if (tilt) drawTilted(ctx, tilt.key, tilt.deg);
		else draw(ctx, key, w, h);
		source.update();
	}
}

/** Pixel-art UI icons loaded at boot (public/assets/gfx/icon, scripts/icons.ts). */
const iconBitmaps = new Map<string, CanvasImageSource>();
export const ICON_PREFIX = 'img.icon.';
export const PORTRAIT_PREFIX = 'img.portrait.';
/** Painted card backs (public/assets/gfx/back, scripts/portraits.ts); decks without one stay vector. */
export const BACK_PREFIX = 'img.back.';
/** Painted 3:4 character cards (public/assets/gfx/card, scripts/portraits.ts). */
export const CHAR_CARD_PREFIX = 'img.card.';
const charCardBitmaps = new Map<string, CanvasImageSource>();
/** Logical size of a character card (`charcard.<id>`): 3:4, like the painted art. */
export const CHAR_W = 48;
export const CHAR_H = 64;
/** `charcover.<id>`: the same card as a tall column (the partner choice), sides cropped, never stretched. */
export const COVER_W = 86;
export const COVER_H = 198;
const backBitmaps = new Map<string, CanvasImageSource>();

/** A character as a portrait card (3:4): the painted art, or the pixel portrait on its colour. */
function drawCharCard(ctx: Ctx, id: string, w: number, h: number, cover = false): void {
	const look = LOOKS[id] ?? FALLBACK;
	const rad = w * 0.1;
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(0, 0, w, h, rad);
	ctx.clip();
	const painted = charCardBitmaps.get(id);
	const pixel = bitmaps.get(id);
	if (painted) {
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		// Cover: the 3:4 art at the box's height, centred, the sides cropped by the clip.
		const dw = cover ? (h * 3) / 4 : w;
		ctx.drawImage(painted, (w - dw) / 2, 0, dw, h);
	} else if (pixel) {
		// No painted card yet: the pixel portrait, whole and unstretched, on its colour.
		box(ctx, 0, 0, w, h, 0, look.bg);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(pixel, 0, (h - w) / 2, w, w);
	} else face(ctx, look, 'neutral', 0, (h - w) / 2, w);
	ctx.restore();
}

function drawAvatar(ctx: Ctx, id: string, expr: string, s: number, boss: boolean): void {
	const look = LOOKS[id] ?? FALLBACK;
	const rad = s * 0.1;
	const bitmap = bitmaps.get(id);
	// Rounded square card (screen-table.png); bosses get a dark wine frame.
	const inset = boss ? s * 0.04 : 0;
	if (boss) box(ctx, 0, 0, s, s, rad, 0x3a1210);
	box(ctx, inset, inset, s - inset * 2, s - inset * 2, Math.max(1, rad - inset), look.bg);
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(inset, inset, s - inset * 2, s - inset * 2, Math.max(1, rad - inset));
	ctx.clip();
	if (bitmap) {
		// 128 px bitmaps are the pixel-art portraits (nearest); the painted ones are larger (smooth).
		const painted = (bitmap as { width: number }).width > 128;
		ctx.imageSmoothingEnabled = painted;
		if (painted) ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(bitmap, 0, 0, s, s);
	} else if (id === 'irmaos') {
		face(ctx, { ...look, shirt: 0x6f4f2f }, expr, s * 0.04, s * 0.1, s * 0.62);
		face(ctx, look, expr, s * 0.34, s * 0.1, s * 0.62);
	} else face(ctx, look, expr, 0, 0, s);
	ctx.restore();
}

// --- Icons --------------------------------------------------------------------------------

type Symbol =
	| 'bolt'
	| 'coin'
	| 'eye'
	| 'heart'
	| 'flame'
	| 'shield'
	| 'crown'
	| 'card'
	| 'cup'
	| 'drop'
	| 'horseshoe'
	| 'candle'
	| 'star'
	| 'clover'
	| 'mask'
	| 'shout'
	| 'arrow'
	| 'hand';

/** Symbol of an icon id, by the words in it (Manhas, Simpatias, Lances, upgrades, promises). */
const SYMBOL_WORDS: readonly [Symbol, readonly string[]][] = [
	['bolt', ['zap', 'raio']],
	['coin', ['ouro', 'dourad', 'renda', 'dinheiro', 'dez', 'caixa', 'desconto', 'reroll', 'nada']],
	['eye', ['olho', 'olhar', 'bisbilhot', 'espiar', 'contador', 'serio']],
	['cup', ['copo']],
	['drop', ['agua', 'suada', 'limpa']],
	['heart', ['coracao', 'sangue', 'dupla', 'parceiro', 'confia']],
	['candle', ['vela']],
	['flame', ['quente', 'fogo', 'peitudo', 'ferroquente']],
	['shield', ['ferro', 'aco', 'guarda', 'cao', 'pau', 'palavra', 'honra', 'vida']],
	['crown', ['rei', 'lenda', 'figur', 'seuze', 'legend', 'rara']],
	['horseshoe', ['ferradura', 'sorte']],
	['clover', ['figa', 'benzed', 'pequente']],
	['star', ['reza', 'benta', 'espelho', 'grego', 'humildade', 'extra', 'gratis']],
	['mask', ['malandro', 'blefe', 'teatro', 'mentiroso', 'cara', 'cangaceiro']],
	['shout', ['grita', 'desafio', 'truco', 'vaia', 'seis', 'doze', 'onze']],
	[
		'arrow',
		['queda', 'corrida', 'virada', 'revira', 'contragolpe', 'apanhou', 'saida', 'ultima'],
	],
	[
		'card',
		['carta', 'manga', 'baralho', 'mao', 'tres', 'vaza', 'vira', 'manilha', 'espada', 'as'],
	],
	['hand', ['leve', 'faxina', 'mais', 'sinal']],
];

function symbolOf(id: string): Symbol {
	const low = id.toLowerCase();
	for (const [s, words] of SYMBOL_WORDS) if (words.some((w) => low.includes(w))) return s;
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
	return (SYMBOL_WORDS[h % SYMBOL_WORDS.length] as [Symbol, unknown])[0];
}

/** A flat symbol of size ~s centred on (x, y). */
function symbol(ctx: Ctx, s: Symbol, x: number, y: number, size: number, c: number): void {
	const u = size / 24;
	const P = (pts: [number, number][]) =>
		poly(
			ctx,
			pts.map(([a, b]) => [x + a * u, y + b * u] as [number, number]),
			c,
		);
	ctx.strokeStyle = css(c);
	ctx.lineCap = 'round';
	switch (s) {
		case 'bolt':
			P([
				[3, -12],
				[-7, 2],
				[-1, 2],
				[-4, 12],
				[7, -3],
				[1, -3],
			]);
			break;
		case 'coin':
			circle(ctx, x, y, 10 * u, c);
			label(ctx, '$', x, y + 0.5 * u, 13 * u, shade(c, -0.6));
			break;
		case 'eye':
			ctx.fillStyle = css(c);
			ctx.beginPath();
			ctx.ellipse(x, y, 12 * u, 7 * u, 0, 0, Math.PI * 2);
			ctx.fill();
			circle(ctx, x, y, 4.5 * u, shade(c, -0.7));
			break;
		case 'heart':
			suit(ctx, 'hearts', x, y, 22 * u, c);
			break;
		case 'flame':
			ctx.fillStyle = css(c);
			ctx.beginPath();
			ctx.moveTo(x, y - 12 * u);
			ctx.bezierCurveTo(x + 12 * u, y - 2 * u, x + 9 * u, y + 11 * u, x, y + 11 * u);
			ctx.bezierCurveTo(x - 9 * u, y + 11 * u, x - 11 * u, y, x - 3 * u, y - 5 * u);
			ctx.bezierCurveTo(x - 3 * u, y, x, y + 1 * u, x, y - 12 * u);
			ctx.fill();
			break;
		case 'shield':
			P([
				[-10, -10],
				[10, -10],
				[10, 0],
				[0, 12],
				[-10, 0],
			]);
			break;
		case 'crown':
			P([
				[-11, 8],
				[-11, -7],
				[-5, -1],
				[0, -10],
				[5, -1],
				[11, -7],
				[11, 8],
			]);
			break;
		case 'card':
			box(ctx, x - 7 * u, y - 10 * u, 14 * u, 20 * u, 2.5 * u, c);
			suit(ctx, 'spades', x, y, 9 * u, shade(c, -0.7));
			break;
		case 'cup':
			P([
				[-8, -10],
				[8, -10],
				[5, 10],
				[-5, 10],
			]);
			box(ctx, x - 6 * u, y - 6 * u, 12 * u, 3 * u, 0, shade(c, -0.4));
			break;
		case 'drop':
			ctx.fillStyle = css(c);
			ctx.beginPath();
			ctx.moveTo(x, y - 12 * u);
			ctx.bezierCurveTo(x + 10 * u, y, x + 9 * u, y + 11 * u, x, y + 11 * u);
			ctx.bezierCurveTo(x - 9 * u, y + 11 * u, x - 10 * u, y, x, y - 12 * u);
			ctx.fill();
			break;
		case 'horseshoe':
			ctx.lineWidth = 5 * u;
			ctx.beginPath();
			ctx.arc(x, y - 1 * u, 8 * u, Math.PI * 0.85, Math.PI * 2.15, false);
			ctx.stroke();
			break;
		case 'candle':
			box(ctx, x - 4 * u, y - 3 * u, 8 * u, 15 * u, 1.5 * u, c);
			ctx.fillStyle = css(PALETTE.cta);
			ctx.beginPath();
			ctx.ellipse(x, y - 8 * u, 3 * u, 5 * u, 0, 0, Math.PI * 2);
			ctx.fill();
			break;
		case 'star':
			star(ctx, x, y, 12 * u, c);
			break;
		case 'clover':
			for (const [dx, dy] of [
				[0, -5],
				[5, 0],
				[0, 5],
				[-5, 0],
			] as const)
				circle(ctx, x + dx * u, y + dy * u - 1 * u, 5 * u, c);
			box(ctx, x - 1 * u, y + 4 * u, 2 * u, 9 * u, u, c);
			break;
		case 'mask':
			ctx.fillStyle = css(c);
			ctx.beginPath();
			ctx.ellipse(x, y, 11 * u, 12 * u, 0, 0, Math.PI * 2);
			ctx.fill();
			circle(ctx, x - 4.5 * u, y - 3 * u, 2.6 * u, shade(c, -0.7));
			circle(ctx, x + 4.5 * u, y - 3 * u, 2.6 * u, shade(c, -0.7));
			ctx.strokeStyle = css(shade(c, -0.7));
			ctx.lineWidth = 2 * u;
			ctx.beginPath();
			ctx.arc(x, y + 2 * u, 5 * u, 0.15 * Math.PI, 0.85 * Math.PI);
			ctx.stroke();
			break;
		case 'shout':
			box(ctx, x - 12 * u, y - 10 * u, 24 * u, 16 * u, 5 * u, c);
			P([
				[-6, 5],
				[-1, 5],
				[-8, 12],
			]);
			label(ctx, '!', x, y - 2 * u, 14 * u, shade(c, -0.7));
			break;
		case 'arrow':
			P([
				[-10, -2],
				[2, -2],
				[2, -9],
				[12, 0],
				[2, 9],
				[2, 2],
				[-10, 2],
			]);
			break;
		case 'hand':
			box(ctx, x - 8 * u, y - 2 * u, 16 * u, 13 * u, 4 * u, c);
			for (let i = 0; i < 4; i++)
				box(ctx, x - 8 * u + i * 4.2 * u, y - 11 * u, 3.4 * u, 12 * u, 1.7 * u, c);
			break;
	}
}

/** Badge colour of an icon key (Manhas by rarity, then each kind of item). */
function iconColor(kind: string, id: string): number {
	if (kind === 'manha') return RARITY_COLOR[MANHA_BY_ID.get(id)?.rarity ?? 'common'];
	return (
		{
			simpatia: PALETTE.fame,
			lance: PALETTE.chips,
			upgrade: 0x3f86e0,
			promise: PALETTE.money,
			trophy: 0xb08d57,
		}[kind] ?? PALETTE.button
	);
}

const TROPHY: Record<string, number> = {
	bronze: 0xc07a3f,
	silver: 0xc9ccd2,
	gold: PALETTE.manilha,
	platinum: 0x9fe0e6,
};

function drawIcon(ctx: Ctx, kind: string, id: string, w: number, h: number): void {
	if (kind === 'trophy') {
		symbol(ctx, 'cup', w / 2, h / 2, w * 0.8, TROPHY[id] ?? PALETTE.manilha);
		return;
	}
	const c = iconColor(kind, id);
	box(ctx, 0, 1.5, w, h - 1.5, w * 0.2, shade(c, -0.45));
	box(ctx, 0, 0, w, h - 2, w * 0.2, c);
	symbol(ctx, symbolOf(id), w / 2, h / 2 - 1, w * 0.6, PALETTE.textLight);
}

/** Booster pack: a card-sized pouch with a crimped top and the pack's symbol. */
const PACK: Record<string, [number, Symbol]> = {
	baralho: [PALETTE.chips, 'card'],
	simpatia: [PALETTE.fame, 'star'],
	lance: [0x3f86e0, 'arrow'],
	manha: [PALETTE.cta, 'mask'],
};

function drawPack(ctx: Ctx, id: string): void {
	const [c, s] = PACK[id] ?? [PALETTE.button, 'star'];
	box(ctx, 2, 4, CARD_W - 4, CARD_H - 6, 4, c);
	for (let x = 2; x < CARD_W - 2; x += 4)
		poly(
			ctx,
			[
				[x, 6],
				[x + 2, 1],
				[x + 4, 6],
			],
			shade(c, -0.3),
		);
	box(ctx, 2, 10, CARD_W - 4, 3, 0, shade(c, -0.3));
	symbol(ctx, s, CARD_W / 2, CARD_H / 2 + 4, 26, PALETTE.textLight);
}

/** Thumbnail of a Championship's room (Rules screen): its colour, a lamp and the felt table. */
const ROOM: Record<string, number> = {
	botecoBairro: 0x8a4b2f,
	barDeEstrada: 0x9a6a2a,
	quermesse: 0x3f6fb0,
	clube: 0x2f6f5f,
	festaDoPeao: 0xb0703a,
	regional: 0x6a4f8f,
	estadual: 0x2f4f7f,
	reiDoTruco: 0x8f2a22,
};

/** Wall colour of a Championship's room (the table scene paints its backdrop with it). */
export const roomColor = (id: string): number => ROOM[id] ?? PALETTE.panel;

function drawRoom(ctx: Ctx, id: string, w: number, h: number): void {
	const c = roomColor(id);
	box(ctx, 0, 0, w, h, 6, c);
	box(ctx, 0, h * 0.62, w, h * 0.38, 0, shade(c, -0.3));
	circle(ctx, w / 2, h * 0.16, h * 0.07, PALETTE.manilha);
	ctx.fillStyle = css(PALETTE.wood);
	ctx.beginPath();
	ctx.ellipse(w / 2, h * 0.68, w * 0.34, h * 0.2, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = css(PALETTE.felt);
	ctx.beginPath();
	ctx.ellipse(w / 2, h * 0.67, w * 0.3, h * 0.15, 0, 0, Math.PI * 2);
	ctx.fill();
}

// --- Keys ---------------------------------------------------------------------------------

/** Logical size of a key (docs/visual.md). */
function sizeOf(key: string): [number, number] {
	if (key.startsWith('icon.')) return [24, 24];
	if (key === 'card.back.tile') return [BACK_TILE_W, BACK_TILE_H];
	if (key.startsWith('card.') || key.startsWith('pack.')) return [CARD_W, CARD_H];
	if (key.startsWith('portrait.')) return [PORTRAIT, PORTRAIT];
	if (key.startsWith('charcard.')) return [CHAR_W, CHAR_H];
	if (key.startsWith('charcover.')) return [COVER_W, COVER_H];
	if (key.startsWith('boss.')) return [96, 96];
	if (key.startsWith('bg.')) return [160, 90];
	if (key === 'ui.slot.manha') return [52, 52];
	if (key.startsWith('ui.sign.')) return [14, 14];
	if (key.startsWith('ui.')) return [16, 16];
	if (key.startsWith('trophy.')) return [32, 32];
	return [ICON, ICON];
}

function draw(ctx: Ctx, key: string, w: number, h: number): void {
	const parts = key.split('.');
	const [kind = '', a = '', b = ''] = parts;
	if (key === 'card.back.tile') {
		// A card back squeezed into a tile: the hands of the other players.
		drawBack(ctx, 'default', w, h);
	} else if (key.startsWith('card.back')) drawBack(ctx, b || 'default');
	else if (key.startsWith('card.mod.')) drawMod(ctx, b);
	else if (key === 'card.joker') drawJoker(ctx);
	else if (kind === 'card' && !b && a in SPECIAL_LOOK)
		drawSpecial(ctx, a as keyof typeof SPECIAL_LOOK);
	else if (kind === 'card') {
		const flags = parts.slice(3);
		const mark = flags.includes('z') ? 'z' : flags.includes('m') ? 'm' : '';
		drawCard(ctx, a, b, flags.includes('4c'), mark);
	} else if (key.startsWith('icon.signal.') || key.startsWith('ui.sign.')) {
		drawSignalIcon(ctx, b, w);
	} else if (kind === 'icon') {
		// A vector drawing wins over a pixel bitmap of the same name (Settings and menus: one style).
		const bmp = (VECTOR_ICONS as readonly string[]).includes(a)
			? undefined
			: iconBitmaps.get(a);
		if (bmp) {
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(bmp, 0, 0, w, h);
		} else drawVectorIcon(ctx, a, w);
	} else if (kind === 'portrait') drawAvatar(ctx, a, b || 'neutral', w, false);
	else if (kind === 'charcard') drawCharCard(ctx, a, w, h);
	else if (kind === 'charcover') drawCharCard(ctx, a, w, h, true);
	else if (kind === 'boss') drawAvatar(ctx, a, 'neutral', w, true);
	else if (kind === 'pack') drawPack(ctx, a);
	else if (kind === 'bg') drawRoom(ctx, a, w, h);
	else if (key.startsWith('ui.suit.')) {
		// A cream disc keeps the black suits readable on dark panels.
		circle(ctx, w / 2, h / 2, w / 2, PALETTE.cardFace);
		suit(ctx, b, w / 2, h / 2, w * 0.58, suitColor(b, false));
	} else if (key === 'ui.slot.manha') {
		ctx.strokeStyle = css(PALETTE.panelLight);
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 4]);
		ctx.beginPath();
		ctx.roundRect(2, 2, w - 4, h - 4, 10);
		ctx.stroke();
	} else drawIcon(ctx, kind, a, w, h);
}

/** A rotated copy of a key (the hand's fan): `<key>@<degrees>`. */
export const tiltedKey = (key: string, deg: number): string => `${key}@${deg}`;

/** The key and angle of a rotated copy, or null for any other key. */
export function parseTiltedKey(key: string): { key: string; deg: number } | null {
	const m = /^(.+)@(-?\d+(?:\.\d+)?)$/.exec(key);
	return m?.[1] && m[2] ? { key: m[1], deg: Number(m[2]) } : null;
}

/** Logical size of `key` turned by `deg` (the box that holds the rotated card). */
export function tiltedSize(key: string, deg: number): [number, number] {
	const [fw, fh] = sizeOf(key);
	const a = (deg * Math.PI) / 180;
	const [cos, sin] = [Math.abs(Math.cos(a)), Math.abs(Math.sin(a))];
	return [Math.ceil(fw * cos + fh * sin), Math.ceil(fw * sin + fh * cos)];
}

/** Draws `key` turned by `deg`, centred in its `tiltedSize` box. */
export function drawTilted(ctx: Ctx, key: string, deg: number): void {
	const [fw, fh] = sizeOf(key);
	const [w, h] = tiltedSize(key, deg);
	ctx.translate(w / 2, h / 2);
	ctx.rotate((deg * Math.PI) / 180);
	ctx.translate(-fw / 2, -fh / 2);
	drawKey(ctx, key);
}

/** Draws `key` at its logical size into a context (rotated or scaled compositions). */
export function drawKey(ctx: Ctx, key: string): void {
	const [w, h] = sizeOf(key);
	draw(ctx, key, w, h);
}

/** Texture key ready to use: drawn now from the key pattern on first use. Always returns `key`. */
export function tex(scene: Phaser.Scene, key: string): string {
	const [w, h] = sizeOf(key);
	// Portraits are shown at 2× on the table: they get twice the raster.
	const extra =
		key.startsWith('portrait.') || key.startsWith('charcard.') || key.startsWith('charcover.')
			? 3
			: 1;
	return canvasTex(scene, key, w, h, (ctx) => draw(ctx, key, w, h), extra);
}

/** Pre-draws what every screen needs right after boot (no hitch on first use). */
export function createArt(scene: Phaser.Scene): void {
	tex(scene, 'card.back.default');
}

/** Background colour of a character's portrait card (the cast has one each). */
export const portraitBg = (id: string): number => (LOOKS[id] ?? FALLBACK).bg;
