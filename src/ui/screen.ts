import type Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { trackZoom } from '../core/viewport';
import type { ViewSize } from '../logic/viewport';
import { menuPx, TEXT_SHADOW, TITLE_FONT, UI_FONT, UI_WEIGHT } from './font';
import { uiPx } from './touch';
import { addVersionFooter } from './version-footer';

export const text = (size: number, color: number = PALETTE.textLight, wrap?: number) => ({
	fontFamily: UI_FONT,
	fontSize: `${uiPx(menuPx(size))}px`,
	fontStyle: UI_WEIGHT,
	color: toCss(color),
	align: 'center',
	wordWrap: wrap ? { width: wrap } : undefined,
	shadow: TEXT_SHADOW,
});

export const noLigatures = (s: string): string => s.replace(/f([il])/g, 'f‌$1');

/**
 * Standard full-screen menu: night background, centered title, version footer and a layout
 * callback on every resize (logical size varies with the window).
 */
export function setupScreen(
	scene: Phaser.Scene,
	title: string,
	layout: (view: ViewSize, cx: number, heading: Phaser.GameObjects.Text) => void,
): Phaser.GameObjects.Text {
	// Overlays (Character, Attributes, Settings…) render in scene-registration order: launched
	// from a screen registered after them (GameOver) they were drawn *under* its opaque
	// background and the game looked frozen. The screen being opened always goes on top.
	scene.scene.bringToTop();
	const cam = scene.cameras.main;
	cam.setBackgroundColor(PALETTE.bgNeutral);
	cam.fadeIn(160, 5, 5, 8);
	const heading = scene.add
		.text(0, 0, noLigatures(title), {
			...text(20, PALETTE.manilha),
			fontFamily: TITLE_FONT,
			fontSize: '24px',
			fontStyle: '700',
		})
		.setOrigin(0.5, 0);
	const footer = addVersionFooter(scene);
	trackZoom(scene, cam, (view) => {
		cam.centerOn(view.width / 2, view.height / 2);
		const cx = Math.round(view.width / 2);
		heading.setPosition(cx, 16);
		footer.layout(view);
		layout(view, cx, heading);
	});
	return heading;
}

/** Scene change with a short fade to black (B6.2); input is ignored while it fades. */
export function fadeTo(scene: Phaser.Scene, key: string, data?: object): void {
	const cam = scene.cameras.main;
	// One change per scene; a fade-in still running (just opened) must not block it.
	if (scene.data.get('leaving')) return;
	scene.data.set('leaving', true);
	scene.events.once('shutdown', () => scene.data.remove('leaving'));
	scene.input.enabled = false;
	cam.resetFX();
	cam.fadeOut(140, 5, 5, 8);
	cam.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}
