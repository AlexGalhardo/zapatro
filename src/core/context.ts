import type Phaser from 'phaser';
import type { DebugParams } from '../debug/params';
import type { SaveData } from '../logic/save';
import { writeSave } from './storage';

const PARAMS = 'debugParams';
const SAVE = 'save';
/** Game-level event fired after every autosave attempt: (ok: boolean). The HUD shows it. */
export const SAVED_EVENT = 'truco-roguelite-saved';

export function setParams(game: Phaser.Game, params: DebugParams): void {
	game.registry.set(PARAMS, params);
}

export function getParams(scene: Phaser.Scene): DebugParams {
	return scene.game.registry.get(PARAMS) as DebugParams;
}

export function setSave(game: Phaser.Game, save: SaveData): void {
	game.registry.set(SAVE, save);
}

/** The one in-memory save; mutate it and call persist(). */
export function getSave(scene: Phaser.Scene): SaveData {
	return scene.game.registry.get(SAVE) as SaveData;
}

const pending = new WeakMap<Phaser.Game, ReturnType<typeof setTimeout>>();

export function persist(scene: Phaser.Scene): boolean {
	const game = scene.game;
	const timer = pending.get(game);
	if (timer !== undefined) {
		clearTimeout(timer);
		pending.delete(game);
	}
	const ok = writeSave(getSave(scene));
	game.events.emit(SAVED_EVENT, ok);
	return ok;
}

/** Debounced autosave (level up and other bursts; PLAN §6.15: 2 s). */
export function persistSoon(scene: Phaser.Scene, ms = 2000): void {
	const game = scene.game;
	if (pending.has(game)) return;
	pending.set(
		game,
		setTimeout(() => {
			pending.delete(game);
			writeSave(game.registry.get(SAVE) as SaveData);
			game.events.emit(SAVED_EVENT, true);
		}, ms),
	);
}
