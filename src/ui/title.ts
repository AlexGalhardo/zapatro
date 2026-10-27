import type Phaser from 'phaser';
import { tex } from '../art/flat';
import { titleMetrics, titleTex } from '../art/title';
import { PALETTE } from '../config/palette';
import { GAP, TYPE } from '../config/ui';

/** Centre line of a full-screen title on the 640×360 stage. */
export const SCREEN_TITLE_Y = 28;

/**
 * A big screen title (gradient, outline, solid depth and soft shadow: `titleTex`). It is anchored
 * on the lettering itself, not on the room around it: `originX` 0 = left edge of the first
 * letter, 0.5 = centred; `y` is the letters' centre line.
 */
export function addTitle(
	scene: Phaser.Scene,
	x: number,
	y: number,
	text: string,
	size: number,
	color: number = PALETTE.manilha,
	originX = 0.5,
): Phaser.GameObjects.Image {
	const img = scene.add.image(x, y, titleTex(scene, text, size, color));
	const { pad, depth } = titleMetrics(size);
	const { width: w, height: h } = img;
	return img.setOrigin((pad + originX * (w - 2 * pad)) / w, (h - depth) / (2 * h));
}

/** Width of a title's lettering (without the outline and shadow room). */
const letters = (img: Phaser.GameObjects.Image, size: number): number =>
	img.width - 2 * titleMetrics(size).pad;

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
): { title: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Image } {
	const title = addTitle(scene, 0, y, text, TYPE.screenTitle, PALETTE.manilha, 0);
	const img = scene.add.image(0, y - 1, tex(scene, `icon.${icon}`)).setScale(1.3);
	const left = cx - (img.displayWidth + GAP.inline + letters(title, TYPE.screenTitle)) / 2;
	img.setX(left + img.displayWidth / 2);
	title.setX(left + img.displayWidth + GAP.inline);
	return { title, icon: img };
}
