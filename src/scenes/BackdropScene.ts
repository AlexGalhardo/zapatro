import Phaser from 'phaser';
import {
	BACKDROP_BRIGHTNESS,
	PALETTE,
	SHOP_BACKDROP_BRIGHTNESS,
	TABLE_BACKDROP_BRIGHTNESS,
	TABLE_VEIL,
} from '../config/palette';
import { trackZoom } from '../core/viewport';
import { shopImageRect } from '../view/shop-slate';

/** Painted backdrops of public/assets/gfx/bg (scripts/portraits.ts); `main` is every other screen. */
export type BackdropKey = 'main' | 'shop' | 'partner' | 'table';
const REGISTRY_KEY = 'backdrop';
/** Grey multiplied over the painting (same factor on every channel keeps the colours). */
const grey = (b: number): number => {
	const v = Math.round(255 * b);
	return Phaser.Display.Color.GetColor(v, v, v);
};
const DIM_TINT = grey(BACKDROP_BRIGHTNESS);
const SHOP_TINT = grey(SHOP_BACKDROP_BRIGHTNESS);
const TABLE_TINT = grey(TABLE_BACKDROP_BRIGHTNESS);

/** Gameplay paintings (background-1 to 6): `main` and `partner` show one of them, drawn at random. */
const VARIANTS = ['partner', 'street', 'main', 'bg4', 'bg5', 'bg6'] as const;
const VARIANT_KEY = 'backdropVariant';

/**
 * Picks the painting behind the current screen (the Backdrop scene sits under every other).
 * A new table or the partner screen draws a new gameplay painting; menus opened over the table
 * keep it, so the background never flips under an overlay.
 */
export function setBackdrop(scene: Phaser.Scene, key: BackdropKey): void {
	const { registry } = scene.game;
	if (key === 'partner' || scene.scene.key === 'Table' || !registry.has(VARIANT_KEY))
		registry.set(VARIANT_KEY, Phaser.Math.RND.pick([...VARIANTS]));
	registry.set(REGISTRY_KEY, key);
}

/** Full-screen scenes: the backdrop sits right under the topmost one of them that is running. */
const OPAQUE = new Set(['Menu', 'Run', 'Settings', 'Keybinds', 'Almanac', 'Rules', 'Lan']);

/**
 * Always-on bottom layer: the painted background covers the whole view, so no screen paints its
 * own grey. Without the image (failed load) it keeps the neutral colour.
 */
export class BackdropScene extends Phaser.Scene {
	private below: string | null = null;

	constructor() {
		super('Backdrop');
	}

	/**
	 * The table is not full-screen (the painting shows around it), so the backdrop is under it;
	 * a menu opened over the table (Settings, Rules…) hides it, so the backdrop climbs above it.
	 */
	override update(): void {
		const top = this.scene.manager.getScenes(true, true).find((s) => OPAQUE.has(s.scene.key))
			?.scene.key;
		if (top === this.below) return;
		this.below = top ?? null;
		if (!top) {
			this.scene.sendToBack();
			return;
		}
		// moveBelow only moves a scene that is above the other: from the bottom, climb first.
		this.scene.bringToTop();
		this.scene.moveBelow(top, 'Backdrop');
	}

	create(): void {
		const cam = this.cameras.main;
		cam.setBackgroundColor(PALETTE.bgNeutral);
		const image = this.add.image(0, 0, 'img.bg.main').setVisible(false).setTint(DIM_TINT);
		const veil = this.add
			.rectangle(0, 0, 1, 1, TABLE_VEIL.color, TABLE_VEIL.alpha)
			.setOrigin(0, 0)
			.setVisible(false);
		let size = { width: 0, height: 0 };
		const show = (): void => {
			const key = (this.game.registry.get(REGISTRY_KEY) as BackdropKey | undefined) ?? 'main';
			const variant = this.game.registry.get(VARIANT_KEY) as string | undefined;
			const picked = `img.bg.${key === 'shop' ? 'shop' : (variant ?? key)}`;
			// A painting still loading (BootScene LATER) shows the always-loaded main one meanwhile.
			const tex = this.textures.exists(picked) ? picked : 'img.bg.main';
			const ok = this.textures.exists(tex);
			image.setVisible(ok);
			if (!ok) return;
			image
				.setTexture(tex)
				.setTint(key === 'shop' ? SHOP_TINT : key === 'table' ? TABLE_TINT : DIM_TINT);
			veil.setVisible(key === 'table').setSize(size.width, size.height);
			if (key === 'shop') {
				// The chalkboard stays in view on any window shape (src/view/shop-slate.ts).
				const r = shopImageRect(size);
				image.setOrigin(0, 0).setScale(r.scale).setPosition(r.x, r.y);
			} else {
				image.setOrigin(0.5, 0.5);
				image.setScale(Math.max(size.width / image.width, size.height / image.height));
				image.setPosition(size.width / 2, size.height / 2);
			}
		};
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			size = view;
			show();
		});
		const events = this.game.registry.events;
		events.on(`changedata-${REGISTRY_KEY}`, show);
		events.on(`changedata-${VARIANT_KEY}`, show);
		// The shop and partner paintings load after the first screen (BootScene LATER).
		this.textures.on(Phaser.Textures.Events.ADD, show);
		this.events.once('shutdown', () => {
			events.off(`changedata-${REGISTRY_KEY}`, show);
			events.off(`changedata-${VARIANT_KEY}`, show);
			this.textures.off(Phaser.Textures.Events.ADD, show);
		});
	}
}
