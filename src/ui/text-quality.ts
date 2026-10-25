import Phaser from 'phaser';
import { LOGICAL_H } from '../config/constants';
import { UI_WEIGHT } from './font';

/** Text raster resolution cap (4 = 4K / Retina); higher only costs memory. */
const MAX_TEXT_RESOLUTION = 4;

/**
 * Makes every `scene.add.text` crisp: the game renders at 540 logical px and zooms 2–4×, so text
 * rasterized at resolution 1 comes out blurry and blocky. Each Text now rasterizes at the render
 * zoom and gets the default UI weight. Call once, before the first scene.
 */
export function installCrispText(game: Phaser.Game): void {
	type TextFactory = (
		this: Phaser.GameObjects.GameObjectFactory,
		x: number,
		y: number,
		text: string | string[],
		style?: Phaser.Types.GameObjects.Text.TextStyle,
	) => Phaser.GameObjects.Text;
	const proto = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
		text: TextFactory;
	};
	const original = proto.text;
	proto.text = function (x, y, text, style = {}) {
		const zoom = Math.round(game.scale.height / LOGICAL_H);
		const resolution = Math.min(MAX_TEXT_RESOLUTION, Math.max(1, zoom));
		return original.call(this, x, y, text, { resolution, fontStyle: UI_WEIGHT, ...style });
	};
}
