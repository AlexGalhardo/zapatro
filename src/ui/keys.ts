import type Phaser from 'phaser';

/**
 * Registers a keyboard listener that runs at most once per DOM event.
 *
 * Phaser 4.2.1 bug: every DOM keydown/keyup re-emits the whole frame queue to the scenes, and its
 * duplicate guard only compares with the last event handled. With 3+ key events in one frame
 * (fast taps, releasing one key while pressing another) earlier events are dispatched again: one
 * ArrowDown moved menus two items and one Enter could select twice. Found in B3 with Playwright.
 */
export function onKey(
	kb: Phaser.Input.Keyboard.KeyboardPlugin | null | undefined,
	event: string,
	fn: (e: KeyboardEvent) => void,
): void {
	if (!kb) return;
	const handled = new WeakSet<KeyboardEvent>();
	kb.on(event, (e: KeyboardEvent) => {
		if (handled.has(e)) return;
		handled.add(e);
		fn(e);
	});
}

/**
 * Listens to a scene event for this run of the scene only. `scene.events` survives a scene
 * restart in Phaser, so a listener added in `create()` piles up and the old one keeps running
 * on destroyed objects (1.0 bug: the second shop visit crashed when returning from the
 * character sheet). Removed on SHUTDOWN.
 */
export function onSceneEvent(scene: Phaser.Scene, event: string, fn: () => void): void {
	scene.events.on(event, fn);
	scene.events.once('shutdown', () => scene.events.off(event, fn));
}
