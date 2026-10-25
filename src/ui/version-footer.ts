import type Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import type { ViewSize } from '../logic/viewport';
import { UI_FONT } from './font';

export function buildLabel(version: string, dev: boolean, name = ''): string {
	const label = name ? `v${version} · ${name}` : `v${version}`;
	return dev ? `${label} (dev)` : label;
}

/** Name of the footer text (scenes with a fitted concept camera hide it). */
export const VERSION_FOOTER = 'version-footer';
export const VERSION_ALPHA = 0.8;

/**
 * Build version in the bottom-left corner (main menu and HUD), so whoever is testing knows which
 * build is running. Call `layout` from the scene's resize handler.
 */
export function addVersionFooter(scene: Phaser.Scene): { layout: (view: ViewSize) => void } {
	const text = scene.add
		.text(0, 0, buildLabel(__APP_VERSION__, import.meta.env.DEV, __BUILD_NAME__), {
			fontFamily: UI_FONT,
			fontSize: '10px',
			color: toCss(PALETTE.textDim),
		})
		.setOrigin(0, 1)
		.setName(VERSION_FOOTER)
		.setAlpha(VERSION_ALPHA)
		// Touch screens need the bottom line for the bigger hints: the version stays on the menu.
		.setVisible(scene.scene.key === 'Menu');
	return { layout: (view) => text.setPosition(4, view.height - 2) };
}
