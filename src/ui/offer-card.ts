import type Phaser from 'phaser';
import { canvasTex } from '../art/flat';
import { PALETTE, shade, toCss } from '../config/palette';
import { MOTION } from '../config/ui';
import { Button } from './Button';
import { TEXT_SHADOW, UI_FONT } from './font';
import { uiPx } from './touch';

/** One padding for everything inside a card, one gap between the pieces (stage px). */
export const CARD_PAD = 5;
const GAP = 3;
const RIBBON_H = 13;
const MEDAL = 30;
const PRICE_H = 20;
/** Thickness of the card's lower edge (its depth), and the drop shadow's reach. */
const DEPTH = 3;
const SHADOW_REACH = 5;

export interface OfferCardOpts {
	/** Texture key of the art (already passed through `tex`). */
	art: string;
	name: string;
	/** Kind of offer (Manha, Simpatia, Lance…), small, in the rarity's colour. */
	kind: string;
	desc: string;
	/** The rarity's name and colour: ribbon, frame and glow. */
	rarity: { label: string; color: number; id: string };
	price: { label: string; enabled: boolean; onClick: () => void; onBlocked?: () => void };
	/** The slot stays (so the row keeps its places) but is bought: faded, with a stamp. */
	sold?: { label: string };
	w: number;
	h: number;
}

const text = (
	px: number,
	color: number,
	wrap?: number,
): Phaser.Types.GameObjects.Text.TextStyle => ({
	fontFamily: UI_FONT,
	fontSize: `${uiPx(px)}px`,
	fontStyle: '700',
	color: toCss(color),
	align: 'center',
	wordWrap: wrap ? { width: wrap } : undefined,
	shadow: TEXT_SHADOW,
});

/**
 * The card's body as one canvas texture (cached by size and rarity): drop shadow, thick lower
 * edge, a frame with a lit gradient in the rarity's colour, a softly shaded inside, a ribbon
 * strip on top, and the medallion behind the icon.
 */
function cardBody(scene: Phaser.Scene, o: OfferCardOpts): string {
	const { w, h } = o;
	const c = o.rarity.color;
	const pw = w + 2 * SHADOW_REACH;
	const ph = h + 2 * SHADOW_REACH + DEPTH;
	return canvasTex(scene, `offercard.${o.rarity.id}.${w}x${h}`, pw, ph, (ctx) => {
		const r = 7;
		const x = SHADOW_REACH;
		const y = SHADOW_REACH;
		const path = (px: number, py: number, pwid: number, phei: number, rad: number): void => {
			ctx.beginPath();
			ctx.roundRect(px, py, pwid, phei, rad);
		};
		// Drop shadow on the board.
		ctx.save();
		ctx.shadowColor = 'rgba(0,0,0,0.6)';
		ctx.shadowBlur = 6;
		ctx.shadowOffsetY = 3;
		ctx.fillStyle = toCss(shade(c, -0.8));
		path(x, y + DEPTH, w, h, r);
		ctx.fill();
		ctx.restore();
		// Lower edge: the card has thickness.
		ctx.fillStyle = toCss(shade(c, -0.55));
		path(x, y + DEPTH, w, h, r);
		ctx.fill();
		// Frame: a vertical gradient, lit at the top.
		const frame = ctx.createLinearGradient(0, y, 0, y + h);
		frame.addColorStop(0, toCss(shade(c, 0.35)));
		frame.addColorStop(0.5, toCss(c));
		frame.addColorStop(1, toCss(shade(c, -0.3)));
		ctx.fillStyle = frame;
		path(x, y, w, h, r);
		ctx.fill();
		// Inside: dark, with a soft glow of the rarity at the top.
		const ix = x + 2.5;
		const iy = y + RIBBON_H;
		const iw = w - 5;
		const ih = h - RIBBON_H - 2.5;
		const inside = ctx.createLinearGradient(0, iy, 0, iy + ih);
		inside.addColorStop(0, toCss(shade(c, -0.62)));
		inside.addColorStop(1, toCss(shade(c, -0.88)));
		ctx.fillStyle = inside;
		path(ix, iy, iw, ih, 5);
		ctx.fill();
		const glow = ctx.createRadialGradient(
			x + w / 2,
			iy + MEDAL / 2 + 8,
			2,
			x + w / 2,
			iy + MEDAL / 2 + 8,
			w * 0.7,
		);
		glow.addColorStop(0, `${toCss(c)}55`);
		glow.addColorStop(1, `${toCss(c)}00`);
		ctx.fillStyle = glow;
		path(ix, iy, iw, ih, 5);
		ctx.fill();
		// Medallion behind the icon.
		const mx = x + w / 2;
		const my = iy + CARD_PAD + MEDAL / 2;
		const medal = ctx.createRadialGradient(mx - 4, my - 5, 2, mx, my, MEDAL / 2);
		medal.addColorStop(0, toCss(shade(c, -0.35)));
		medal.addColorStop(1, toCss(shade(c, -0.8)));
		ctx.fillStyle = medal;
		ctx.beginPath();
		ctx.arc(mx, my, MEDAL / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = toCss(c);
		ctx.stroke();
		// Bright rim: a thin highlight on the frame's top edge and a dark line on the bottom.
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(255,255,255,0.45)';
		ctx.beginPath();
		ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
		ctx.stroke();
	});
}

/**
 * A shop offer as a card in its rarity's colours (src/data/rarity.ts): one canvas body (depth,
 * gradients, medallion), the rarity on the ribbon, the icon, the name, the kind, the effect and
 * the price as a gold button at the base. Centred on (0, 0); it lifts and tilts under the mouse.
 */
export function offerCard(scene: Phaser.Scene, o: OfferCardOpts): Phaser.GameObjects.Container {
	const { w, h } = o;
	const color = o.rarity.color;
	const c = scene.add.container(0, 0);
	const bodyKey = cardBody(scene, o);
	const body = scene.add.image(0, DEPTH / 2, bodyKey);
	const hit = scene.add.zone(0, 0, w, h).setInteractive();
	c.add([body, hit]);
	const top = -h / 2;
	c.add(
		scene.add
			.text(0, top + RIBBON_H / 2 + 0.5, o.rarity.label.toLocaleUpperCase(), {
				...text(7, PALETTE.textDark),
				shadow: undefined,
			})
			.setOrigin(0.5),
	);
	const medalY = top + RIBBON_H + CARD_PAD + MEDAL / 2;
	const art = scene.add.image(0, medalY, o.art);
	art.setScale(Math.min(1, (MEDAL - 8) / art.height));
	c.add(art);
	let y = top + RIBBON_H + CARD_PAD + MEDAL + GAP;
	const inner = w - 2 * CARD_PAD - 5;
	const name = scene.add
		.text(0, y, o.name, text(o.name.length > 12 ? 7.5 : 9, PALETTE.textLight, inner))
		.setOrigin(0.5, 0);
	c.add(name);
	y += name.height + 1;
	const kind = scene.add.text(0, y, o.kind, text(6, shade(color, 0.3))).setOrigin(0.5, 0);
	c.add(kind);
	y += kind.height + GAP;
	c.add(scene.add.text(0, y, o.desc, text(6, PALETTE.textLight, inner)).setOrigin(0.5, 0));
	const b = new Button(scene, o.price.label, o.price.onClick, {
		w: w - 2 * CARD_PAD - 5,
		h: PRICE_H,
		size: 10,
		color: PALETTE.manilha,
		...(o.price.onBlocked ? { onBlocked: o.price.onBlocked } : {}),
	}).setPosition(0, h / 2 - PRICE_H / 2 - CARD_PAD - 1);
	b.setEnabled(o.price.enabled && !o.sold);
	c.add(b);
	if (o.sold) {
		c.setAlpha(0.45);
		c.add(
			scene.add
				.text(0, 0, o.sold.label.toLocaleUpperCase(), {
					...text(12, PALETTE.textLight),
					backgroundColor: toCss(PALETTE.truco),
					padding: { x: 4, y: 1 },
				})
				.setOrigin(0.5)
				.setAngle(-14),
		);
	}
	let base: number | null = null;
	hit.on('pointerover', () => {
		if (base !== null || o.sold) return;
		base = c.y;
		scene.tweens.killTweensOf(c);
		scene.tweens.add({ targets: c, y: base - 3, angle: -1.5, duration: MOTION.hover });
	});
	hit.on('pointerout', () => {
		if (base === null) return;
		scene.tweens.killTweensOf(c);
		scene.tweens.add({ targets: c, y: base, angle: 0, duration: MOTION.hover });
		base = null;
	});
	return c;
}
