import type Phaser from 'phaser';
import { computeView, type ViewSize } from '../logic/viewport';

export function getView(scene: Phaser.Scene): ViewSize {
	const save = scene.game.registry.get('save') as { settings?: { scale?: number } } | undefined;
	return computeView(scene.scale.width, scene.scale.height, save?.settings?.scale ?? 0);
}

/** Re-runs every trackZoom layout (after the zoom setting changes). */
export function relayout(game: Phaser.Game): void {
	game.scale.emit('resize', game.scale.gameSize, game.scale.baseSize, game.scale.displaySize);
}

/** Keeps a camera on the integer zoom for the current window, now and on every resize. */
export function trackZoom(
	scene: Phaser.Scene,
	camera: Phaser.Cameras.Scene2D.Camera,
	onResize?: (view: ViewSize) => void,
): void {
	const apply = () => {
		const view = getView(scene);
		camera.setSize(scene.scale.width, scene.scale.height);
		camera.setZoom(view.zoom);
		onResize?.(view);
	};
	apply();
	scene.scale.on('resize', apply);
	scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}
