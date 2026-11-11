import type Phaser from 'phaser';
import { PALETTE, RARITY_COLOR, shade, toCss } from '../config/palette';
import { BUTTON_H, MOTION, PAD, RADIUS, SAFE, SHADOW } from '../config/ui';
import { Button } from './Button';
import { TEXT_SHADOW, UI_FONT } from './font';
import { uiPx } from './touch';

export { RARITY_COLOR };

export interface ItemCardOpts {
	/** Texture key of the art (already passed through `tex`). */
	art?: string;
	artScale?: number;
	title: string;
	/** Frame colour: rarity or kind (a dark frame by default). */
	color?: number;
	desc?: string;
	/** Small tag in the corner of the art box (rarity, kind: never colour alone). */
	tag?: string;
	button?: {
		label: string;
		onClick: () => void;
		color?: number;
		enabled?: boolean;
		/** Clicked while disabled (not enough money): the scene says why. */
		onBlocked?: () => void;
	};
	w?: number;
	h?: number;
	/** Greyed out (sold, locked). */
	dim?: boolean;
}

const font = (
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
 * Shop item drawn as in screen-shop.png: a dark card with its name on top, a darker box
 * with the art and the effect text, and the button (price or "Escolher") at the bottom.
 * Lifts a little on hover so the row reads as something to pick. Centred on (0, 0).
 */
export function itemCard(scene: Phaser.Scene, opts: ItemCardOpts): Phaser.GameObjects.Container {
	const w = opts.w ?? 118;
	const h = opts.h ?? 154;
	const frame = opts.color ?? PALETTE.panelLight;
	const c = scene.add.container(0, 0);
	const g = scene.add.graphics();
	g.fillStyle(PALETTE.shadow, 0.6).fillRoundedRect(
		-w / 2,
		-h / 2 + SHADOW.panel,
		w,
		h,
		RADIUS.panel,
	);
	g.fillStyle(PALETTE.panel, 1).fillRoundedRect(-w / 2, -h / 2, w, h, RADIUS.panel);
	g.lineStyle(2, frame, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS.panel);
	const btnH = opts.button ? BUTTON_H.row : 0;
	const boxTop = -h / 2 + 22;
	const boxH = h - 22 - btnH - (opts.button ? 12 : 6);
	g.fillStyle(PALETTE.panelDark, 1).fillRoundedRect(
		-w / 2 + 5,
		boxTop,
		w - 10,
		boxH,
		RADIUS.button,
	);
	// The hover area stops above the button: Phaser sorts a nested zone over the button's own hit area.
	const hit = scene.add.zone(0, -btnH / 2, w, h - btnH).setInteractive();
	c.add([g, hit]);
	c.add(
		scene.add
			.text(
				0,
				-h / 2 + 11,
				opts.title,
				font(opts.title.length > 16 ? 8 : 10, PALETTE.textLight, w - 8),
			)
			.setOrigin(0.5),
	);
	let y = boxTop + 4;
	if (opts.tag)
		c.add(
			scene.add
				.text(
					-w / 2 + 5 + PAD.card,
					boxTop + SAFE.panel,
					opts.tag,
					font(6, frame === PALETTE.panelLight ? PALETTE.textDim : shade(frame, 0.25)),
				)
				.setOrigin(0, 0),
		);
	if (opts.art) {
		const img = scene.add.image(0, y + 8, opts.art).setOrigin(0.5, 0);
		img.setScale(opts.artScale ?? Math.min(1, 36 / img.height));
		c.add(img);
		y += img.displayHeight + 12;
	}
	if (opts.desc)
		c.add(
			scene.add
				.text(0, y, opts.desc, font(w < 112 ? 6 : 7, PALETTE.textLight, w - 16))
				.setOrigin(0.5, 0),
		);
	if (opts.button) {
		const b = new Button(scene, opts.button.label, opts.button.onClick, {
			w: w - 10,
			h: btnH,
			size: 11,
			color: opts.button.color ?? PALETTE.good,
			...(opts.button.onBlocked ? { onBlocked: opts.button.onBlocked } : {}),
		}).setPosition(0, h / 2 - btnH / 2 - 6);
		b.setEnabled(opts.button.enabled ?? true);
		c.add(b);
	}
	if (opts.dim) c.setAlpha(0.45);
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
