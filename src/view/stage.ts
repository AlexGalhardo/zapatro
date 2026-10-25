import type Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { fitArt, type ViewSize } from '../logic/viewport';

/**
 * Fitted screens (docs/visual.md): the world is a 640×360 stage, scaled to fit the view, so every
 * position in the scene is a pixel of that stage. Call `fitCamera` on every resize.
 */

/**
 * Flat backdrop of a fitted screen: the night colour over the whole view (any aspect ratio) and,
 * for `felt`, a big rounded felt table with its wooden rim under the stage.
 */
export function addBackdrop(
	scene: Phaser.Scene,
	kind: 'night' | 'felt' = 'night',
	into?: Phaser.GameObjects.Container,
): Phaser.GameObjects.Graphics {
	const g = scene.add.graphics();
	g.fillStyle(kind === 'felt' ? PALETTE.feltDark : PALETTE.bgNeutral, 1).fillRect(
		-2000,
		-2000,
		4640,
		4360,
	);
	into?.add(g);
	return g;
}

/** Zooms the camera so the whole stage fits the view (the integer zoom at 16:9). */
export function fitCamera(cam: Phaser.Cameras.Scene2D.Camera, view: ViewSize): void {
	cam.setZoom(view.zoom * fitArt(view));
	cam.centerOn(320, 180);
}

/** Stage rectangle → view coordinates of a screen whose camera is not fitted (overlays). */
export function artToView(r: Phaser.Geom.Rectangle, view: ViewSize): Phaser.Geom.Rectangle {
	const s = fitArt(view);
	r.setTo(
		(r.x - 320) * s + view.width / 2,
		(r.y - 180) * s + view.height / 2,
		r.width * s,
		r.height * s,
	);
	return r;
}
