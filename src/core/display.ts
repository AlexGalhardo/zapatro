import type Phaser from 'phaser';
import type { ResolutionId } from '../data/display';
import { type RenderSize, renderSize } from '../logic/display';

let current: ResolutionId = 'auto';
let game: Phaser.Game | null = null;

export function currentRenderSize(): RenderSize {
	return renderSize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1, current);
}

/**
 * The canvas renders at the chosen resolution (Scale.NONE + resize) and Phaser's display zoom
 * stretches it to the window, so presets and Retina "auto" both fill the screen.
 */
function apply(): void {
	if (!game) return;
	const r = currentRenderSize();
	// Size first, zoom second: setZoom() rewrites the canvas CSS size from the current game size,
	// while resize() skips the CSS when the zoom is 1 (its style == size shortcut). In the old
	// order a 1× window kept the previous CSS size until a second resize event.
	game.scale.resize(r.width, r.height);
	game.scale.setZoom(r.cssScale);
}

export function initDisplay(resolution: ResolutionId): void {
	current = resolution;
	window.addEventListener('resize', apply);
}

export function attachGame(g: Phaser.Game): void {
	game = g;
	apply();
}

export function setResolution(resolution: ResolutionId): void {
	current = resolution;
	apply();
}
