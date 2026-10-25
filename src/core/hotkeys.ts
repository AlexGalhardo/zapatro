import type Phaser from 'phaser';
import { actionFor } from '../logic/keybinds';
import type { SaveData } from '../logic/save';
import { persist } from './context';

/** Set while Settings → Controls waits for a key, so the key is not also a hotkey. */
let capturing = false;
export function setCapturing(on: boolean): void {
	capturing = on;
}
export function isCapturing(): boolean {
	return capturing;
}

/**
 * Hotkeys that work on every screen (PLAN §6.16): mute (M) and fullscreen (F11), both
 * rebindable. A plain window listener, outside Phaser's keyboard queue (see src/ui/keys.ts).
 */
export function installHotkeys(game: Phaser.Game): void {
	window.addEventListener('keydown', (e) => {
		if (capturing || e.repeat) return;
		const save = game.registry.get('save') as SaveData | undefined;
		if (!save) return;
		const action = actionFor(save.settings.keys, e.code);
		const scene = game.scene.getScenes(true)[0];
		if (action === 'mute') {
			save.settings.muted = !save.settings.muted;
			game.sound.mute = save.settings.muted;
			if (scene) persist(scene);
		} else if (action === 'fullscreen') {
			e.preventDefault();
			if (game.scale.isFullscreen) game.scale.stopFullscreen();
			else game.scale.startFullscreen();
		}
	});
}
