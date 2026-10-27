import type Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { comfort } from './comfort';

const KEYS = ['img.bg.menu-1', 'img.bg.menu-2', 'img.bg.menu-3'] as const;
/** Time each painting stays, the crossfade between two, and the slow zoom (Ken Burns) of one. */
const HOLD_MS = 7000;
const FADE_MS = 900;
const ZOOM = 0.06;
/** The paintings carry the logo and PT buttons in their left third: this share of the width is hidden. */
const BAKED_UI = 0.31;
const IMG_W = 1600;
const IMG_H = 900;

/**
 * Rotating painted backdrop of the main menu: crossfade every HOLD_MS, left/right or the dots to
 * change by hand. A dark panel with a soft edge hides the logo and buttons painted into the art, so
 * the game's own (translated) ones sit on it. Absent images (failed load) leave the scene as is.
 */
export class MenuBackdrop {
	private readonly images: Phaser.GameObjects.Image[];
	private readonly panel: Phaser.GameObjects.Graphics;
	private readonly dots: Phaser.GameObjects.Arc[] = [];
	private current = 0;
	private cover = 1;
	/** Current push-in of each painting (0..ZOOM), so a window resize keeps it. */
	private readonly zoomed: number[] = [];
	private timer: Phaser.Time.TimerEvent | null = null;

	constructor(
		private readonly scene: Phaser.Scene,
		dotsAt: { x: number; y: number },
	) {
		const keys = KEYS.filter((k) => scene.textures.exists(k));
		this.images = keys.map((k) => scene.add.image(0, 0, k).setDepth(-20).setAlpha(0));
		this.panel = scene.add.graphics().setDepth(-19);
		if (!this.images.length) return;
		this.images[0]?.setAlpha(1);
		this.zoom(0);
		this.images.forEach((_, i) => {
			const dot = scene.add
				.circle(
					dotsAt.x + (i - (this.images.length - 1) / 2) * 12,
					dotsAt.y,
					3.5,
					PALETTE.textLight,
				)
				.setDepth(5)
				.setInteractive({ useHandCursor: true });
			dot.on('pointerdown', () => this.go(i));
			this.dots.push(dot);
		});
		this.paintDots();
		this.restart();
		scene.events.once('shutdown', () => this.timer?.remove());
	}

	/** Fits the paintings to the visible stage rectangle (any window aspect ratio). */
	layout(view: { x: number; y: number; width: number; height: number }): void {
		this.cover = Math.max(view.width / IMG_W, view.height / IMG_H);
		const cx = view.x + view.width / 2;
		const cy = view.y + view.height / 2;
		for (const img of this.images) img.setPosition(cx, cy);
		const left = cx - (IMG_W * this.cover) / 2;
		// The buttons live at fixed stage positions, so the panel is at least as wide as their column.
		const edge = Math.max(left + IMG_W * this.cover * BAKED_UI + 24, 262);
		const g = this.panel.clear();
		g.fillStyle(PALETTE.night, 1).fillRect(
			view.x - 40,
			view.y - 40,
			edge - view.x + 40,
			view.height + 80,
		);
		g.fillGradientStyle(
			PALETTE.night,
			PALETTE.night,
			PALETTE.night,
			PALETTE.night,
			1,
			0,
			1,
			0,
		).fillRect(edge, view.y - 40, 56, view.height + 80);
		for (let i = 0; i < this.images.length; i++) this.apply(i);
	}

	step(by: number): void {
		this.go((this.current + by + this.images.length) % this.images.length);
	}

	private go(next: number): void {
		if (next === this.current || this.images.length < 2) return;
		const [from, to] = [this.images[this.current], this.images[next]];
		this.current = next;
		this.paintDots();
		if (!from || !to) return;
		const fade = comfort.reduceFlashes ? 0 : FADE_MS;
		this.scene.tweens.killTweensOf([from, to]);
		this.scene.tweens.add({ targets: from, alpha: 0, duration: fade });
		to.setAlpha(fade ? 0 : 1);
		if (fade) this.scene.tweens.add({ targets: to, alpha: 1, duration: fade });
		this.zoom(next);
		this.restart();
	}

	/** Slow push-in over the time the painting stays; off with "reduce flashes". */
	private zoom(i: number): void {
		this.zoomed[i] = 0;
		this.apply(i);
		if (comfort.reduceFlashes) return;
		const t = { v: 0 };
		this.scene.tweens.add({
			targets: t,
			v: ZOOM,
			duration: HOLD_MS + FADE_MS * 2,
			ease: 'Sine.easeInOut',
			onUpdate: () => {
				this.zoomed[i] = t.v;
				this.apply(i);
			},
		});
	}

	private apply(i: number): void {
		this.images[i]?.setScale(this.cover * (1 + (this.zoomed[i] ?? 0)));
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
