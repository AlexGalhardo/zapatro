import type Phaser from 'phaser';
import { comfort } from './comfort';

const KEYS = ['img.bg.menu-1', 'img.bg.menu-2', 'img.bg.menu-3'] as const;
/** Time each painting stays and the crossfade between two. */
const HOLD_MS = 7000;
const FADE_MS = 500;
/** The paintings are measured on this width (their source files are 1600 px wide). */
const SRC_W = 1600;
/** Share of the painting's height kept free under the button column. */
const BOTTOM_MARGIN = 0.07;
/** Black vignette over a painting's edges that meet the black bars: its share of the size. */
const VIGNETTE = { min: 0.02, max: 0.08 };

/**
 * Where the logo and the button column are painted into each painting (source px), measured on
 * references/concept-art-gta/menu-1..3.jpeg. The game's own buttons are laid over the painted
 * ones, same place and size, so no painted text shows under them (whatever the language); the
 * logo has no words to translate and stays as painted.
 */
export interface MenuGeo {
	logo: { x: number; y: number; w: number; h: number };
	col: { x: number; w: number; h: number; y0: number; step: number };
}
export const MENU_GEO: readonly MenuGeo[] = [
	{ logo: { x: 48, y: 52, w: 564, h: 206 }, col: { x: 57, w: 415, h: 62, y0: 290, step: 71.7 } },
	{ logo: { x: 50, y: 92, w: 560, h: 206 }, col: { x: 63, w: 407, h: 61, y0: 326, step: 69 } },
	{ logo: { x: 48, y: 82, w: 546, h: 198 }, col: { x: 58, w: 403, h: 60, y0: 312, step: 68 } },
];

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** What the scene needs to place its UI: the painting's top-left in stage px and its scale. */
export interface MenuFrame {
	geo: MenuGeo;
	/** Stage px per source px. */
	k: number;
	x: number;
	y: number;
	/** Where the painting is on the stage (the dots and the version stay inside it). */
	art: Rect;
	/** Stage y the button column must end above: a clear margin over the painting's bottom edge. */
	bottom: number;
}

/**
 * Rotating painted backdrop of the main menu (like the concept art: full-screen painting, buttons
 * over it). The painting is fitted whole (never stretched, mirrored or repeated) and centred; what
 * is left of the view is black, with a black vignette over the painting's edges that meet it, so
 * there is no hard line. It changes every HOLD_MS with a crossfade, or by hand with left/right and
 * the dots. `onFrame` fires when the layout or the slide changes, so the scene can rebuild its
 * buttons on the new geometry. Missing images (failed load) leave the scene as is.
 */
export class MenuBackdrop {
	private readonly images: Phaser.GameObjects.Image[];
	private readonly bars: Phaser.GameObjects.Graphics;
	private readonly vignette: Phaser.GameObjects.Graphics;
	private readonly dots: Phaser.GameObjects.Arc[] = [];
	private current = 0;
	private view: Rect = { x: 0, y: 0, width: 640, height: 360 };
	private timer: Phaser.Time.TimerEvent | null = null;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onFrame: (f: MenuFrame) => void,
	) {
		const keys = KEYS.filter((k) => scene.textures.exists(k));
		this.images = keys.map((k) =>
			scene.add.image(0, 0, k).setOrigin(0, 0).setDepth(-20).setAlpha(0),
		);
		this.bars = scene.add.graphics().setDepth(-21);
		this.vignette = scene.add.graphics().setDepth(-19);
		this.images[0]?.setAlpha(1);
		this.images.forEach((_, i) => {
			const dot = scene.add
				.circle(0, 0, 3.5, 0xffffff)
				.setStrokeStyle(1, 0x000000, 0.8)
				.setDepth(5)
				.setInteractive({ useHandCursor: true });
			dot.on('pointerdown', () => this.go(i));
			this.dots.push(dot);
		});
		this.paintDots();
		if (this.images.length > 1) this.restart();
		scene.events.once('shutdown', () => this.timer?.remove());
	}

	/** Fits the painting into the visible stage rectangle and tells the scene where its UI goes. */
	layout(view: Rect): void {
		this.view = view;
		const cur = this.images[this.current];
		if (!cur) return;
		// Fit the height; a view narrower than the painting fits the width instead. Each painting
		// has its own proportion (menu-2 is a little narrower), so each is fitted on its own.
		const fit = (img: Phaser.GameObjects.Image): Rect => {
			const aspect = img.width / img.height;
			const height = Math.min(view.height, view.width / aspect);
			const width = height * aspect;
			return {
				x: view.x + (view.width - width) / 2,
				y: view.y + (view.height - height) / 2,
				width,
				height,
			};
		};
		for (const img of this.images) {
			const r = fit(img);
			img.setPosition(r.x, r.y).setDisplaySize(r.width, r.height);
		}
		const { x, y, width, height } = fit(cur);

		this.bars
			.clear()
			.fillStyle(0x000000, 1)
			.fillRect(view.x - 2, view.y - 2, view.width + 4, view.height + 4);
		const g = this.vignette.clear();
		const black = 0x000000;
		const side = (view.width - width) / 2;
		if (side > 0.5) {
			const ramp = Math.min(Math.max(side * 2, width * VIGNETTE.min), width * VIGNETTE.max);
			g.fillGradientStyle(black, black, black, black, 1, 0, 1, 0).fillRect(
				x,
				y,
				ramp,
				height,
			);
			g.fillGradientStyle(black, black, black, black, 0, 1, 0, 1).fillRect(
				x + width - ramp,
				y,
				ramp,
				height,
			);
		}
		const band = (view.height - height) / 2;
		if (band > 0.5) {
			const ramp = Math.min(Math.max(band * 2, height * VIGNETTE.min), height * VIGNETTE.max);
			g.fillGradientStyle(black, black, black, black, 1, 1, 0, 0).fillRect(x, y, width, ramp);
			g.fillGradientStyle(black, black, black, black, 0, 0, 1, 1).fillRect(
				x,
				y + height - ramp,
				width,
				ramp,
			);
		}
		for (const [i, d] of this.dots.entries())
			d.setPosition(x + width / 2 + (i - (this.dots.length - 1) / 2) * 12, y + height - 8);
		this.onFrame({
			geo: MENU_GEO[this.current] ?? (MENU_GEO[0] as MenuGeo),
			k: width / SRC_W,
			x,
			y,
			art: { x, y, width, height },
			bottom: y + height * (1 - BOTTOM_MARGIN),
		});
	}

	step(by: number): void {
		this.go((this.current + by + this.images.length) % this.images.length);
	}

	private go(next: number): void {
		if (next === this.current || this.images.length < 2) return;
		this.current = next;
		this.paintDots();
		const fade = comfort.reduceFlashes ? 0 : FADE_MS;
		// Every painting goes to its own target alpha: a half-faded one from a quick double press
		// would otherwise stay over the others (double exposure).
		for (const [i, img] of this.images.entries()) {
			this.scene.tweens.killTweensOf(img);
			const alpha = i === next ? 1 : 0;
			if (fade) this.scene.tweens.add({ targets: img, alpha, duration: fade });
			else img.setAlpha(alpha);
		}
		this.layout(this.view);
		this.restart();
	}

	private restart(): void {
		this.timer?.remove();
		this.timer = this.scene.time.addEvent({
			delay: HOLD_MS,
			loop: true,
			callback: () => this.step(1),
		});
	}

	private paintDots(): void {
		for (const [i, d] of this.dots.entries()) d.setAlpha(i === this.current ? 1 : 0.4);
	}
}
