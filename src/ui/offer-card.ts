import type Phaser from 'phaser';
import { PALETTE, shade, toCss } from '../config/palette';
import { MOTION, RADIUS, SHADOW } from '../config/ui';
import { Button } from './Button';
import { TEXT_SHADOW, UI_FONT } from './font';
import { uiPx } from './touch';

export interface OfferCardOpts {
	/** Texture key of the art (already passed through `tex`). */
	art: string;
	name: string;
	/** Kind of offer (Manha, Simpatia, Lance…), small. */
	kind: string;
	desc: string;
	/** The rarity's name and colour: ribbon, frame and glow. */
	rarity: { label: string; color: number };
	price: { label: string; enabled: boolean; onClick: () => void; onBlocked?: () => void };
	w: number;
	h: number;
	dim?: boolean;
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
 * A shop offer in its rarity's colours (src/data/rarity.ts): a ribbon with the rarity on top, a
 * frame and a soft glow in that colour, the big icon, the name, the kind, the effect and the
 * price as a button at the base. Centred on (0, 0); lifts a little under the mouse.
 */
export function offerCard(scene: Phaser.Scene, o: OfferCardOpts): Phaser.GameObjects.Container {
	const { w, h } = o;
	const color = o.rarity.color;
	const c = scene.add.container(0, 0);
	const g = scene.add.graphics();
	// Glow: two wider, fainter frames around the card.
	for (const [grow, a] of [
		[5, 0.12],
		[2.5, 0.22],
	] as const)
		g.lineStyle(2, color, a).strokeRoundedRect(
			-w / 2 - grow,
			-h / 2 - grow,
			w + 2 * grow,
			h + 2 * grow,
			RADIUS.panel + grow,
		);
	g.fillStyle(PALETTE.shadow, 0.6).fillRoundedRect(
		-w / 2,
		-h / 2 + SHADOW.panel,
		w,
		h,
		RADIUS.panel,
	);
	g.fillStyle(shade(color, -0.82), 1).fillRoundedRect(-w / 2, -h / 2, w, h, RADIUS.panel);
	const ribbonH = 14;
	g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, ribbonH, {
		tl: RADIUS.panel,
		tr: RADIUS.panel,
		bl: 0,
		br: 0,
	});
	g.lineStyle(2, color, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS.panel);
	const hit = scene.add.zone(0, 0, w, h).setInteractive();
	c.add([g, hit]);
	c.add(
		scene.add
			.text(0, -h / 2 + ribbonH / 2, o.rarity.label.toLocaleUpperCase(), {
				...text(7, PALETTE.textDark),
				shadow: undefined,
			})
			.setOrigin(0.5),
	);
	let y = -h / 2 + ribbonH + 4;
	const art = scene.add.image(0, y, o.art).setOrigin(0.5, 0);
	art.setScale(Math.min(1.2, 30 / art.height));
	c.add(art);
	y += art.displayHeight + 3;
	const name = scene.add
		.text(0, y, o.name, text(o.name.length > 14 ? 8 : 10, PALETTE.textLight, w - 10))
		.setOrigin(0.5, 0);
	c.add(name);
	y += name.height;
	const kind = scene.add.text(0, y, o.kind, text(6.5, shade(color, 0.15))).setOrigin(0.5, 0);
	c.add(kind);
	y += kind.height + 2;
	c.add(scene.add.text(0, y, o.desc, text(6.5, PALETTE.textLight, w - 12)).setOrigin(0.5, 0));
	const btnH = 22;
	const b = new Button(scene, o.price.label, o.price.onClick, {
		w: w - 12,
		h: btnH,
		size: 12,
		color: PALETTE.buttonLight,
		...(o.price.onBlocked ? { onBlocked: o.price.onBlocked } : {}),
	}).setPosition(0, h / 2 - btnH / 2 - 6);
	b.setEnabled(o.price.enabled);
	c.add(b);
	if (o.dim) c.setAlpha(0.45);
	let base: number | null = null;
	hit.on('pointerover', () => {
		if (base !== null) return;
		base = c.y;
		scene.tweens.killTweensOf(c);
		scene.tweens.add({ targets: c, y: base - 3, duration: MOTION.hover });
	});
	hit.on('pointerout', () => {
		if (base === null) return;
		scene.tweens.killTweensOf(c);
		scene.tweens.add({ targets: c, y: base, duration: MOTION.hover });
		base = null;
	});
	return c;
}
