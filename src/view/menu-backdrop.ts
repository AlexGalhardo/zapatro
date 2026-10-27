import type Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { comfort } from './comfort';

const KEYS = ['img.bg.menu-1', 'img.bg.menu-2', 'img.bg.menu-3'] as const;
/** Time each painting stays and the crossfade between two. */
const HOLD_MS = 7000;
const FADE_MS = 500;
/** The paintings are measured on this width (their source files are 1600 px wide). */
const SRC_W = 1600;
/** The painted logo ends at this source x in every painting: the view keeps at least this much. */
const LOGO_RIGHT = 620;
/** Most the painting may be enlarged (cropping its bottom) to fill the view's width. */
const MAX_FILL = 1.06;

/**
 * Where the logo and the button column are painted into each painting (source px), measured on
 * references/concept-art-gta/menu-1..3.jpeg. The game's own logo and buttons are laid over them,
 * same place and size, so no painted text shows under them (whatever the language).
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

/** What the scene needs to place its UI: the painting's top-left in stage px and its scale. */
export interface MenuFrame {
	geo: MenuGeo;
	/** Stage px per source px. */
	k: number;
	x: number;
	y: number;
	/** The visible stage rectangle. */
	view: { x: number; y: number; width: number; height: number };
}

/**
 * Rotating painted backdrop of the main menu (like the concept art: full-screen painting, logo
 * and buttons over it). The painting fits the view's height and sits at the top left, so the
 * painted UI is always on screen; wider views show the dimmed main backdrop to its right. It
 * changes every HOLD_MS with a crossfade, or by hand with left/right and the dots. `onFrame` fires
 * when the layout or the slide changes, so the scene can rebuild its logo and buttons on the new
 * geometry. Missing images (failed load) leave the scene as is.
 */
export class MenuBackdrop {
	private readonly images: Phaser.GameObjects.Image[];
	private readonly edge: Phaser.GameObjects.Graphics;
	private readonly dots: Phaser.GameObjects.Arc[] = [];
	private current = 0;
	private view = { x: 0, y: 0, width: 640, height: 360 };
	private timer: Phaser.Time.TimerEvent | null = null;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onFrame: (f: MenuFrame) => void,
	) {
		const keys = KEYS.filter((k) => scene.textures.exists(k));
		this.images = keys.map((k) =>
			scene.add.image(0, 0, k).setOrigin(0, 0).setDepth(-20).setAlpha(0),
		);
		this.edge = scene.add.graphics().setDepth(-19);
		this.images[0]?.setAlpha(1);
		this.images.forEach((_, i) => {
			const dot = scene.add
				.circle(0, 0, 3.5, PALETTE.textLight)
				.setStrokeStyle(1, PALETTE.night, 0.8)
				.setDepth(5)
				.setInteractive({ useHandCursor: true });
			dot.on('pointerdown', () => this.go(i));
			this.dots.push(dot);
		});
		this.paintDots();
		if (this.images.length > 1) this.restart();
		scene.events.once('shutdown', () => this.timer?.remove());
	}

	/** Fits the painting to the visible stage rectangle and tells the scene where its UI goes. */
	layout(view: { x: number; y: number; width: number; height: number }): void {
		this.view = view;
		const img = this.images[this.current];
		if (!img) return;
		const aspect = img.width / img.height;
		// Fit the height, but never let the painted logo run off the right side.
		const fitted = Math.min(view.height, view.width / ((LOGO_RIGHT / SRC_W) * aspect));
		// Slightly narrower than the view (menu-2 is 1.70, the screen 1.78): fill the width and
		// let the bottom crop a little instead of leaving a strip; the buttons end well above it.
		const width = Math.min(Math.max(fitted * aspect, view.width), fitted * aspect * MAX_FILL);
		const height = width / aspect;
		const [x, y] = [view.x, view.y];
		for (const i of this.images) i.setPosition(x, y).setDisplaySize(width, height);
		// A view wider than the painting: its right edge fades into the main backdrop behind.
		const g = this.edge.clear();
		if (width < view.width - 1) {
			const fade = Math.min(48, width * 0.08);
			g.fillGradientStyle(
				PALETTE.night,
				PALETTE.night,
				PALETTE.night,
				PALETTE.night,
				0,
				0.7,
				0,
				0.7,
			).fillRect(x + width - fade, y, fade, height);
		}
		const bottom = y + height;
		const mid = x + width / 2;
		for (const [i, d] of this.dots.entries())
			d.setPosition(
				mid + (i - (this.dots.length - 1) / 2) * 12,
				Math.min(bottom, view.y + view.height) - 8,
			);
		this.onFrame({
			geo: MENU_GEO[this.current] ?? (MENU_GEO[0] as MenuGeo),
			k: width / SRC_W,
			x,
			y,
			view,
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
