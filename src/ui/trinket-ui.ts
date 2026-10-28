import type Phaser from 'phaser';
import { canvasTex, tex } from '../art/flat';
import { PALETTE, SHOP_RARITY_COLOR, shade, toCss } from '../config/palette';
import { MOTION } from '../config/ui';
import { TRINKET_BY_ID, type TrinketLevel } from '../data/trinkets';
import { trinketName, trinketRarityName, trinketTexts } from '../i18n/trinket';
import { Button } from './Button';
import { TEXT_SHADOW, UI_FONT } from './font';
import { uiPx } from './touch';

/** The rarity colour of a trinket level 1–4 (Normal cream, Rare blue, Epic purple, Legendary orange). */
export const levelColor = (level: number): number =>
	SHOP_RARITY_COLOR[
		(['common', 'uncommon', 'rare', 'legendary'] as const)[level - 1] ?? 'common'
	];

/** One padding for everything inside a trinket card, one gap between the pieces (stage px). */
export const CARD = { pad: 4, gap: 2, ribbon: 9, medal: 22, price: 14 } as const;

const text = (
	px: number,
	color: number,
	wrap?: number,
): Phaser.Types.GameObjects.Text.TextStyle => ({
	fontFamily: UI_FONT,
	fontSize: `${uiPx(px)}px`,
	fontStyle: '700',
	color: toCss(color),
	align: 'left',
	wordWrap: wrap ? { width: wrap } : undefined,
	shadow: TEXT_SHADOW,
});

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

/** The card body: a lit frame in the rarity's colour, a dark inside, a thick lower edge, a shadow. */
function body(scene: Phaser.Scene, w: number, h: number, level: number): string {
	const c = levelColor(level);
	const reach = 4;
	return canvasTex(
		scene,
		`trinketcard.${level}.${w}x${h}`,
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
			const frame = ctx.createLinearGradient(0, reach, 0, reach + h);
			frame.addColorStop(0, toCss(shade(c, 0.35)));
			frame.addColorStop(0.5, toCss(c));
			frame.addColorStop(1, toCss(shade(c, -0.3)));
			ctx.fillStyle = frame;
			path(reach, reach, w, h, r);
			ctx.fill();
			const inside = ctx.createLinearGradient(0, reach + CARD.ribbon, 0, reach + h);
			inside.addColorStop(0, toCss(shade(c, -0.62)));
			inside.addColorStop(1, toCss(shade(c, -0.88)));
			ctx.fillStyle = inside;
			path(reach + 1.5, reach + CARD.ribbon, w - 3, h - CARD.ribbon - 1.5, 3.5);
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(255,255,255,0.4)';
			path(reach + 0.5, reach + 0.5, w - 1, h - 1, r);
			ctx.stroke();
		},
	);
}

/** The height a trinket card needs for the longest of these texts (name, Perk, Flaw). */
export function trinketCardHeight(
	scene: Phaser.Scene,
	w: number,
	list: readonly { id: string; level: number }[],
): number {
	const room = w - CARD.pad * 2 - CARD.medal - CARD.gap - 3;
	const probe = (s: string, px: number): number => {
		const t = scene.add.text(0, 0, s, text(px, PALETTE.textLight, room));
		const h = t.height;
		t.destroy();
		return h;
	};
	const tallest = Math.max(
		...list.map((o) => {
			const tx = trinketTexts(o.id, o.level);
			return (
				probe(trinketName(o.id), 8) +
				CARD.gap +
				probe(tx.perk, 6) +
				CARD.gap +
				probe(tx.flaw, 6)
			);
		}),
		0,
	);
	return Math.ceil(
		CARD.ribbon + CARD.pad + Math.max(tallest, CARD.medal + CARD.gap + CARD.price) + CARD.pad,
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
 * A trinket for sale (landscape): the rarity ribbon, the medallion with its price under it, and
 * the name, the Perk (green) and the Flaw (red) beside them. Centred on (0, 0); lifts on hover.
 */
export function trinketCard(scene: Phaser.Scene, o: TrinketCardOpts): Phaser.GameObjects.Container {
	const { w, h } = o;
	const c = scene.add.container(0, 0);
	const hit = scene.add.zone(0, 0, w, h).setInteractive();
	c.add([scene.add.image(0, 1, body(scene, w, h, o.level)), hit]);
	const left = -w / 2;
	const top = -h / 2;
	c.add(
		scene.add
			.text(0, top + CARD.ribbon / 2 + 0.5, trinketRarityName(o.level).toLocaleUpperCase(), {
				...text(6, PALETTE.textDark),
				align: 'center',
				shadow: undefined,
			})
			.setOrigin(0.5),
	);
	const medal = trinketMedal(scene, o.id, o.level, CARD.medal);
	medal.setPosition(
		left + CARD.pad + CARD.medal / 2,
		top + CARD.ribbon + CARD.pad + CARD.medal / 2,
	);
	c.add(medal);
	const tx = left + CARD.pad + CARD.medal + CARD.gap + 4;
	const room = w - CARD.pad * 2 - CARD.medal - CARD.gap - 3;
	const { perk, flaw } = trinketTexts(o.id, o.level);
	let y = top + CARD.ribbon + CARD.pad;
	const name = scene.add.text(tx, y, trinketName(o.id), text(8, PALETTE.textLight, room));
	c.add(name);
	y += name.height + CARD.gap;
	const p = scene.add.text(tx, y, perk, text(6, PALETTE.good, room));
	c.add(p);
	y += p.height + CARD.gap;
	c.add(scene.add.text(tx, y, flaw, text(6, PALETTE.bad, room)));
	const price = new Button(scene, o.price.label, o.price.onClick, {
		w: CARD.medal + 2,
		h: CARD.price,
		size: 8,
		color: PALETTE.manilha,
		...(o.price.onBlocked ? { onBlocked: o.price.onBlocked } : {}),
	}).setPosition(left + CARD.pad + CARD.medal / 2, top + h - CARD.pad - CARD.price / 2 - 1);
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
