import Phaser from 'phaser';
import { AlmanacScene } from '../scenes/AlmanacScene';
import { BackdropScene } from '../scenes/BackdropScene';
import { BootScene } from '../scenes/BootScene';
import { KeybindsScene } from '../scenes/KeybindsScene';
import { LanScene } from '../scenes/LanScene';
import { MenuScene } from '../scenes/MenuScene';
import { PauseScene } from '../scenes/PauseScene';
import { RulesScene } from '../scenes/RulesScene';
import { RunScene } from '../scenes/RunScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { TableScene } from '../scenes/TableScene';
import { TutorialScene } from '../scenes/TutorialScene';
import { PALETTE, toCss } from './palette';

export const gameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	parent: 'game',
	backgroundColor: toCss(PALETTE.bgNeutral),
	// Flat vector art (src/art/flat.ts): smooth filtering and antialiased shapes.
	pixelArt: false,
	antialias: true,
	antialiasGL: true,
	roundPixels: false,
	// Size and zoom are driven by core/display.ts (render resolution setting).
	scale: { mode: Phaser.Scale.NONE, width: 1280, height: 720 },
	// Gamepad goes through src/core/gamepad.ts (virtual keys), not Phaser's plugin.
	input: { keyboard: true, mouse: true, touch: true, gamepad: false, activePointers: 3 },
	disableContextMenu: true,
	scene: [
		BootScene,
		BackdropScene,
		MenuScene,
		RunScene,
		TableScene,
		TutorialScene,
		PauseScene,
		RulesScene,
		AlmanacScene,
		SettingsScene,
		KeybindsScene,
		LanScene,
	],
};
