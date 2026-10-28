import type Phaser from 'phaser';
import { canvasTex, tex } from '../art/flat';
import { PALETTE, SHOP_RARITY_COLOR, shade, toCss } from '../config/palette';
import { MOTION } from '../config/ui';
import { TRINKET_BY_ID, type TrinketLevel } from '../data/trinkets';
import { trinketName, trinketTexts } from '../i18n/trinket';
import { Button } from './Button';
import { TEXT_SHADOW, UI_FONT } from './font';
import { uiPx } from './touch';

/** The rarity colour of a trinket level 1–4 (Normal cream, Rare blue, Epic purple, Legendary orange). */
export const levelColor = (level: number): number =>
	SHOP_RARITY_COLOR[
		(['common', 'uncommon', 'rare', 'legendary'] as const)[level - 1] ?? 'common'
	];

/** One padding for everything inside a trinket card, one gap between the pieces (stage px). */
export const CARD = { pad: 5, gap: 3 } as const;

const text = (
	px: number,
	color: number,
	wrap?: number,
	align: 'left' | 'center' = 'left',
	exact = false,
): Phaser.Types.GameObjects.Text.TextStyle => ({
	fontFamily: UI_FONT,
	fontSize: `${exact ? px : uiPx(px)}px`,
	fontStyle: '700',
	color: toCss(color),
	align,
	wordWrap: wrap ? { width: wrap } : undefined,
	shadow: TEXT_SHADOW,
});

/** Dark ink on the cream Normal header; light ink on blue, purple and orange. */
const headerInk = (level: number): number => {
	const c = levelColor(level);
	const y = 0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255);
	return y > 180 ? PALETTE.textDark : PALETTE.textLight;
};

/** Header band and price footer sized to the card, leaving a middle for the effects. */
function bands(h: number): { header: number; price: number } {
	let header = Math.round(Math.min(24, Math.max(16, h * 0.26)));
	let price = Math.round(Math.min(22, Math.max(16, h * 0.24)));
	if (header + price > h - 18) {
		header = Math.max(14, Math.floor(h * 0.24));
		price = Math.max(14, Math.floor(h * 0.22));
	}
	return { header, price };
}

/** The round medallion of a trinket: the rarity's ring and glow with its icon inside. */
export function trinketMedal(
	scene: Phaser.Scene,
	id: string,
	level: number,
	d: number,
): Phaser.GameObjects.Container {
	const c = levelColor(level);
	const key = canvasTex(scene, `trinketmedal.${level}.${d}`, d + 4, d + 4, (ctx) => {
		const r = d / 2;
		const g = ctx.createRadialGradient(r + 1, r - 1, 1, r + 2, r + 2, r);
		g.addColorStop(0, toCss(shade(c, -0.35)));
		g.addColorStop(1, toCss(shade(c, -0.8)));
		ctx.fillStyle = toCss(shade(c, -0.9));
		ctx.beginPath();
		ctx.arc(r + 2, r + 3, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(r + 2, r + 2, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = toCss(c);
		ctx.stroke();
	});
	const icon = TRINKET_BY_ID.get(id)?.icon ?? 'star';
	const img = scene.add.image(0, 0, tex(scene, `icon.${icon}`));
	img.setScale(Math.min(1, (d - 6) / Math.max(img.width, img.height)));
	return scene.add.container(0, 0, [scene.add.image(0, 0, key), img]);
}

/**
 * Card body: rarity colour is the border and the header band (no rarity word). The middle is
 * dark. A thick lower edge and a shadow sit under it.
 */
function body(scene: Phaser.Scene, w: number, h: number, level: number, header: number): string {
	const c = levelColor(level);
	const reach = 4;
	return canvasTex(
		scene,
		`trinketcard.${level}.${w}x${h}.${header}`,
		w + 2 * reach,
		h + 2 * reach + 2,
		(ctx) => {
			const r = 5;
			const path = (x: number, y: number, pw: number, ph: number, rad: number): void => {
				ctx.beginPath();
				ctx.roundRect(x, y, pw, ph, rad);
			};
			ctx.save();
			ctx.shadowColor = 'rgba(0,0,0,0.6)';
			ctx.shadowBlur = 5;
			ctx.shadowOffsetY = 2;
			ctx.fillStyle = toCss(shade(c, -0.8));
			path(reach, reach + 2, w, h, r);
			ctx.fill();
			ctx.restore();
			ctx.fillStyle = toCss(shade(c, -0.55));
			path(reach, reach + 2, w, h, r);
			ctx.fill();
			// Border and header: one rarity-coloured card. The dark middle is painted over it.
			ctx.fillStyle = toCss(c);
			path(reach, reach, w, h, r);
			ctx.fill();
			const inset = 2.5;
			const iy = reach + header;
			const ih = h - header - inset;
			const inside = ctx.createLinearGradient(0, iy, 0, iy + ih);
			inside.addColorStop(0, toCss(shade(c, -0.72)));
			inside.addColorStop(1, toCss(shade(c, -0.88)));
			ctx.fillStyle = inside;
			path(reach + inset, iy, w - 2 * inset, ih, 4);
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(255,255,255,0.35)';
			path(reach + 0.5, reach + 0.5, w - 1, h - 1, r);
			ctx.stroke();
		},
	);
}

export interface TrinketCardOpts {
	id: string;
	level: TrinketLevel;
	w: number;
	h: number;
	price: { label: string; enabled: boolean; onClick: () => void; onBlocked?: () => void };
	sold?: { label: string };
}

/**
 * A trinket for sale. The header is the rarity's colour with the icon and the name on one line.
 * Perk (green) and flaw (red) sit centred in the middle. The price is a full-width footer.
 * Centred on (0, 0); lifts on hover.
 */
export function trinketCard(scene: Phaser.Scene, o: TrinketCardOpts): Phaser.GameObjects.Container {
	const { w, h } = o;
	const { header, price: priceH } = bands(h);
	const c = scene.add.container(0, 0);
	const hit = scene.add.zone(0, 0, w, h).setInteractive();
	c.add([scene.add.image(0, 1, body(scene, w, h, o.level, header)), hit]);
	const left = -w / 2;
	const top = -h / 2;
	const medalD = Math.max(12, header - 6);
	const medal = trinketMedal(scene, o.id, o.level, medalD);
	medal.setPosition(left + CARD.pad + medalD / 2, top + header / 2);
	c.add(medal);
	const nameX = left + CARD.pad + medalD + CARD.gap;
	const nameRoom = w - 2 * CARD.pad - medalD - CARD.gap;
	let namePx = 8;
	const name = scene.add
		.text(
			nameX,
			top + header / 2,
			trinketName(o.id),
			text(namePx, headerInk(o.level), undefined, 'left', true),
		)
		.setOrigin(0, 0.5);
	while (name.width > nameRoom && namePx > 6) {
		namePx -= 0.5;
		name.setFontSize(namePx);
	}
	c.add(name);
	const { perk, flaw } = trinketTexts(o.id, o.level);
	const midTop = top + header + 3;
	const midH = h - header - priceH - 6;
	const room = w - 2 * CARD.pad - 4;
	let descPx = 7;
	const measure = (
		size: number,
	): { perk: Phaser.GameObjects.Text; flaw: Phaser.GameObjects.Text; h: number } => {
		const perkText = scene.add
			.text(0, 0, perk, text(size, PALETTE.good, room, 'center', true))
			.setOrigin(0.5, 0);
		const flawText = scene.add
			.text(0, 0, flaw, text(size, PALETTE.bad, room, 'center', true))
			.setOrigin(0.5, 0);
		return { perk: perkText, flaw: flawText, h: perkText.height + CARD.gap + flawText.height };
	};
	let block = measure(descPx);
	while (descPx > 6 && block.h > midH) {
		block.perk.destroy();
		block.flaw.destroy();
		descPx -= 0.5;
		block = measure(descPx);
	}
	const y0 = midTop + Math.max(0, (midH - block.h) / 2);
	block.perk.setY(y0);
	block.flaw.setY(y0 + block.perk.height + CARD.gap);
	c.add([block.perk, block.flaw]);
	const price = new Button(scene, o.price.label, o.price.onClick, {
		w: w - 4,
		h: Math.max(14, priceH - 2),
		size: 10,
		color: PALETTE.manilha,
		...(o.price.onBlocked ? { onBlocked: o.price.onBlocked } : {}),
	}).setPosition(0, h / 2 - priceH / 2);
	price.setEnabled(o.price.enabled && !o.sold);
	c.add(price);
	if (o.sold) {
		c.setAlpha(0.45);
		c.add(
			scene.add
				.text(0, 0, o.sold.label.toLocaleUpperCase(), {
					...text(10, PALETTE.textLight),
					align: 'center',
					backgroundColor: toCss(PALETTE.truco),
					padding: { x: 4, y: 1 },
				})
				.setOrigin(0.5)
				.setAngle(-10),
		);
	}
	let base: number | null = null;
	hit.on('pointerover', () => {
		if (base !== null || o.sold) return;
		base = c.y;
		scene.tweens.killTweensOf(c);
		scene.tweens.add({ targets: c, y: base - 2, duration: MOTION.hover });
	});
	hit.on('pointerout', () => {
		if (base === null) return;
		scene.tweens.killTweensOf(c);
		scene.tweens.add({ targets: c, y: base, duration: MOTION.hover });
		base = null;
	});
	return c;
}
