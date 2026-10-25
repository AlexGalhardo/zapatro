import type Phaser from 'phaser';
import { getSave } from './context';

/** Camera shake that respects Settings → Screen shake. */
export function shake(scene: Phaser.Scene, durationMs: number, intensity: number): void {
	if (getSave(scene).settings.screenShake) scene.cameras.main.shake(durationMs, intensity);
}

/**
 * Short zoom "punch" for big moments (boss arrival, boss hits, boss death). Skipped with screen
 * shake off (same comfort setting). Returns to the integer zoom the viewport chose.
 */
export function zoomPunch(scene: Phaser.Scene, amount: number, durationMs: number): void {
	if (!getSave(scene).settings.screenShake) return;
	const cam = scene.cameras.main;
	const base = cam.zoom;
	scene.tweens.add({
		targets: cam,
		zoom: base * (1 + amount),
		duration: durationMs / 2,
		yoyo: true,
		ease: 'Quad.easeOut',
		onComplete: () => cam.setZoom(base),
	});
}

/** Cheap bloom: bright pixels are thresholded, blurred and added back (Phaser 4 filters). */
export function applyBloom(cam: Phaser.Cameras.Scene2D.Camera): void {
	const pf = cam.filters.internal.addParallelFilters();
	pf.top.addThreshold(0.62, 1);
	pf.top.addBlur(0, 2, 2, 1);
	pf.blend.blendMode = 1; // Phaser.BlendModes.ADD (type-only import here).
	pf.blend.amount = 0.45;
}
