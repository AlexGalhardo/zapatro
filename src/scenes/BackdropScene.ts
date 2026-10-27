import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { trackZoom } from '../core/viewport';

/** Painted backdrops of public/assets/gfx/bg (scripts/portraits.ts); `main` is every other screen. */
export type BackdropKey = 'main' | 'shop' | 'partner';
const REGISTRY_KEY = 'backdrop';
const DIM: Record<BackdropKey, number> = { main: 0.4, shop: 0.15, partner: 0.2 };

/** Picks the painting behind the current screen (the Backdrop scene sits under every other). */
export function setBackdrop(scene: Phaser.Scene, key: BackdropKey): void {
	scene.game.registry.set(REGISTRY_KEY, key);
}

/**
 * Always-on bottom layer: the painted background covers the whole view, so no screen paints its
 * own grey. Without the image (failed load) it keeps the neutral colour.
 */
export class BackdropScene extends Phaser.Scene {
	constructor() {
		super('Backdrop');
	}

	create(): void {
		const cam = this.cameras.main;
		cam.setBackgroundColor(PALETTE.bgNeutral);
		const image = this.add.image(0, 0, 'img.bg.main').setVisible(false);
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.night, 0.4).setOrigin(0);
		let size = { width: 0, height: 0 };
		const show = (): void => {
			const key = (this.game.registry.get(REGISTRY_KEY) as BackdropKey | undefined) ?? 'main';
			const tex = `img.bg.${key}`;
			const ok = this.textures.exists(tex);
			image.setVisible(ok);
			if (!ok) return;
			image.setTexture(tex);
			image.setScale(Math.max(size.width / image.width, size.height / image.height));
			image.setPosition(size.width / 2, size.height / 2);
			dim.setSize(size.width, size.height).setFillStyle(PALETTE.night, DIM[key]);
		};
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			size = view;
			show();
		});
		const events = this.game.registry.events;
		events.on(`changedata-${REGISTRY_KEY}`, show);
		this.events.once('shutdown', () => events.off(`changedata-${REGISTRY_KEY}`, show));
	}
}
