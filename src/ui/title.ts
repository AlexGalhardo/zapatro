import type Phaser from 'phaser';
import { tex } from '../art/flat';
import { PALETTE, toCss } from '../config/palette';
import { GAP, TYPE } from '../config/ui';
import { TEXT_SHADOW, TITLE_FONT } from './font';

/** Centre line of a full-screen title on the 640×360 stage. */
export const SCREEN_TITLE_Y = 28;

/**
 * Full-screen title (Settings, Controls…): the gold title with its icon to the left, the pair
 * centred on `cx` as one group, so the text no longer sits off-centre by the icon's width.
 */
export function screenTitle(
	scene: Phaser.Scene,
	cx: number,
	text: string,
	icon: string,
	y: number = SCREEN_TITLE_Y,
): { title: Phaser.GameObjects.Text; icon: Phaser.GameObjects.Image } {
	const title = scene.add
		.text(0, y, text, {
			fontFamily: TITLE_FONT,
			fontSize: `${TYPE.screenTitle}px`,
			fontStyle: '700',
			color: toCss(PALETTE.manilha),
			shadow: { ...TEXT_SHADOW, offsetX: -2, offsetY: 3 },
		})
		.setOrigin(0, 0.5);
	const img = scene.add.image(0, y - 1, tex(scene, `icon.${icon}`)).setScale(1.3);
	const left = cx - (img.displayWidth + GAP.inline + title.width) / 2;
	img.setX(left + img.displayWidth / 2);
	title.setX(left + img.displayWidth + GAP.inline);
	return { title, icon: img };
}
