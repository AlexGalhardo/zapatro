import type Phaser from 'phaser';
import { comfort } from './comfort';

const KEYS = [
	'img.bg.menu-1',
	'img.bg.menu-2',
	'img.bg.menu-3',
	'img.bg.menu-4',
	'img.bg.menu-5',
] as const;
/** Time each painting stays and the crossfade between two. */
const HOLD_MS = 7000;
const FADE_MS = 500;
/** The paintings are measured on this width (their source files are 1600 px wide). */
const SRC_W = 1600;
/** Share of the painting's height kept free under the button column. */
const BOTTOM_MARGIN = 0.07;
/** Black vignette over a painting's edges that meet the black bars: its share of the size. */
const VIGNETTE = { min: 0.02, max: 0.03 };

/**
 * Where each painting has its own buttons baked in (source px, measured on
 * references/concept-art-gta/menu-1..3.jpeg): the buttons' left edge and the top of the first and
 * bottom of the last one. The game's own buttons are fixed on screen and each painting gets its
 * own scale and offset so that this rectangle falls exactly under them (same scale on both axes).
 */
export interface BakedUi {
	x: number;
	top: number;
	bottom: number;
}
export const BAKED_UI: readonly BakedUi[] = [
	{ x: 57, top: 290, bottom: 782 },
	{ x: 63, top: 326, bottom: 800 },
	{ x: 58, top: 312, bottom: 779 },
	// menu-4 (1671 px wide, scaled to 1600): it bakes 8 buttons; `bottom` is its 7th, like the others.
	{ x: 50, top: 244, bottom: 668 },
	// menu-5 (1672 px wide, scaled to 1600): 8 baked buttons too; `bottom` is the 7th.
	{ x: 62, top: 273, bottom: 706 },
];

/** The game's button column, in the source px of the first painting (the fixed reference). */
export interface MenuGeo {
	col: { x: number; w: number; h: number; y0: number; step: number };
}
export const MENU_GEO: MenuGeo = { col: { x: 57, w: 428, h: 64, y0: 289, step: 71.7 } };

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** What the scene needs to place its UI: the painting's top-left in stage px and its scale. */
export interface MenuFrame {
	geo: MenuGeo;
	/** Stage px per source px of the first painting. */
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
	/** By slide index; a painting loaded after the first screen (menu-2, menu-3) joins when it arrives. */
	private readonly images: (Phaser.GameObjects.Image | undefined)[] = [];
	private readonly bars: Phaser.GameObjects.Graphics;
	/** One vignette per painting, fading with it in the crossfade. */
	private readonly vignettes: (Phaser.GameObjects.Graphics | undefined)[] = [];
	private readonly dots: Phaser.GameObjects.Arc[] = [];
	private current = 0;
	private view: Rect | null = null;
	private timer: Phaser.Time.TimerEvent | null = null;
	/** The scene left: a painting that arrives now has nowhere to go. */
	private gone = false;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onFrame: (f: MenuFrame) => void,
	) {
		this.bars = scene.add.graphics().setDepth(-21);
		KEYS.forEach((key, i) => {
			const dot = scene.add
				.circle(0, 0, 3.5, 0xffffff)
				.setStrokeStyle(1, 0x000000, 0.8)
				.setDepth(5)
				.setVisible(false)
				.setInteractive({ useHandCursor: true });
			dot.on('pointerdown', () => this.go(i));
			this.dots.push(dot);
			if (scene.textures.exists(key)) this.addSlide(i);
			else scene.textures.once(`addtexture-${key}`, () => this.addSlide(i));
		});
		scene.events.once('shutdown', () => {
			this.gone = true;
			this.timer?.remove();
		});
	}

	private addSlide(i: number): void {
		if (this.gone) return;
		const first = i === 0;
		this.images[i] = this.scene.add
			.image(0, 0, KEYS[i] as string)
			.setOrigin(0, 0)
			.setDepth(-20)
			.setAlpha(first ? 1 : 0);
		this.vignettes[i] = this.scene.add
			.graphics()
			.setDepth(-19)
			.setAlpha(first ? 1 : 0);
		this.dots[i]?.setVisible(true);
		this.paintDots();
		if (this.available().length > 1 && !this.timer) this.restart();
		if (this.view) this.layout(this.view);
	}

	private available(): number[] {
		return KEYS.map((_, i) => i).filter((i) => this.images[i]);
	}

	/** Fits the paintings into the visible stage rectangle and tells the scene where its UI goes. */
	layout(view: Rect): void {
		this.view = view;
		const ref = this.images[0];
		if (!ref) return;
		// Reference: the first painting fitted whole and centred. The UI is fixed on it, and every
		// other painting is scaled and moved to put its baked buttons right under that UI.
		const aspect = ref.width / ref.height;
		const height = Math.min(view.height, view.width / aspect);
		const width = height * aspect;
		const k = width / SRC_W;
		const x = view.x + (view.width - width) / 2;
		const y = view.y + (view.height - height) / 2;
		const refSpan = (BAKED_UI[0]?.bottom ?? 1) - (BAKED_UI[0]?.top ?? 0);
		const black = 0x000000;
		this.bars
			.clear()
			.fillStyle(black, 1)
			.fillRect(view.x - 2, view.y - 2, view.width + 4, view.height + 4);
		for (const i of this.available()) {
			const img = this.images[i] as Phaser.GameObjects.Image;
			const b = BAKED_UI[i] ?? (BAKED_UI[0] as BakedUi);
			const ki = (k * refSpan) / (b.bottom - b.top);
			const r = {
				x: x + (BAKED_UI[0]?.x ?? 0) * k - b.x * ki,
				y: y + (BAKED_UI[0]?.top ?? 0) * k - b.top * ki,
				width: SRC_W * ki,
				height: (img.height / img.width) * SRC_W * ki,
			};
			img.setPosition(r.x, r.y).setDisplaySize(r.width, r.height);
			this.vignettes[i]?.clear();
			this.vignette(this.vignettes[i], r, view);
		}
		const shown = this.available();
		for (const [n, i] of shown.entries())
			this.dots[i]?.setPosition(
				x + width / 2 + (n - (shown.length - 1) / 2) * 12,
				y + height - 8,
			);
		this.onFrame({
			geo: MENU_GEO,
			k,
			x,
			y,
			art: { x, y, width, height },
			bottom: y + height * (1 - BOTTOM_MARGIN),
		});
	}

	/** Black over the edges of a painting that end inside the view: a short ramp, no hard line. */
	private vignette(g: Phaser.GameObjects.Graphics | undefined, r: Rect, view: Rect): void {
		if (!g) return;
		const black = 0x000000;
		const ramp = Math.min(r.width, r.height) * VIGNETTE.max;
		const edge = (x: number, y: number, w: number, h: number, a: number[]): void => {
			g.fillGradientStyle(black, black, black, black, a[0], a[1], a[2], a[3]).fillRect(
				x,
				y,
				w,
				h,
			);
		};
		if (r.x > view.x + 0.5) edge(r.x, r.y, ramp, r.height, [1, 0, 1, 0]);
		if (r.x + r.width < view.x + view.width - 0.5)
			edge(r.x + r.width - ramp, r.y, ramp, r.height, [0, 1, 0, 1]);
		if (r.y > view.y + 0.5) edge(r.x, r.y, r.width, ramp, [1, 1, 0, 0]);
		if (r.y + r.height < view.y + view.height - 0.5)
			edge(r.x, r.y + r.height - ramp, r.width, ramp, [0, 0, 1, 1]);
	}

	step(by: number): void {
		const list = this.available();
		const at = list.indexOf(this.current);
		const next = list[(at + by + list.length) % list.length];
		if (next !== undefined) this.go(next);
	}

	private go(next: number): void {
		if (next === this.current || !this.images[next]) return;
		this.current = next;
		this.paintDots();
		const fade = comfort.reduceFlashes ? 0 : FADE_MS;
		// Every painting goes to its own target alpha: a half-faded one from a quick double press
		// would otherwise stay over the others (double exposure).
		for (const i of this.available()) {
			const targets = [this.images[i], this.vignettes[i]].filter(
				(o): o is Phaser.GameObjects.Image | Phaser.GameObjects.Graphics => o !== undefined,
			);
			this.scene.tweens.killTweensOf(targets);
			const alpha = i === next ? 1 : 0;
			if (fade) this.scene.tweens.add({ targets, alpha, duration: fade });
			else for (const t of targets) t.setAlpha(alpha);
		}
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
