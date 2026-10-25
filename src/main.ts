import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { setParams, setSave } from './core/context';
import { attachGame, currentRenderSize, initDisplay } from './core/display';
import { hasWebGL, installErrorHandler, showOverlay, watchContextLoss } from './core/errors';
import { installGamepad } from './core/gamepad';
import { installHotkeys } from './core/hotkeys';
import { installRotateHint } from './core/orientation';
import { initPoki } from './core/poki';
import { steamUnlock } from './core/steam';
import { loadSave } from './core/storage';
import { parseDebugParams } from './debug/params';
import { detectLang, setLang, t } from './i18n';
import { installCrispText } from './ui/text-quality';
import { applyTouch } from './ui/touch';
import { applyComfort } from './view/comfort';

const params = parseDebugParams(window.location.search);
const loaded = loadSave(detectLang(navigator.language));
setLang(loaded.save.settings.lang);
applyComfort(loaded.save.settings);
applyTouch(loaded.save.settings.touchControls);
initDisplay(loaded.save.settings.resolution);

// Text objects rasterize once, so the fonts must be ready before the first scene.
await Promise.all(
	['500 16px "Rubik"', 'bold 16px "Rubik"'].map((f) =>
		document.fonts.load(f).catch(() => undefined),
	),
);

installErrorHandler();
installRotateHint();

/** Boots Phaser (skipped with a clear message when the browser has no WebGL, R2.2). */
function start(): void {
	const initial = currentRenderSize();
	const game = new Phaser.Game({
		...gameConfig,
		scale: {
			...gameConfig.scale,
			width: initial.width,
			height: initial.height,
			zoom: initial.cssScale,
		},
	});
	// Scenes boot on the next frame, so the text patch is in place before any Text exists.
	installCrispText(game);
	watchContextLoss(game);
	game.sound.mute = loaded.save.settings.muted;
	setParams(game, params);
	setSave(game, loaded.save);
	// Feats earned before Steam (or on another PC) become achievements too.
	steamUnlock(loaded.save.meta.feats);
	game.registry.set('saveStatus', {
		recovered: loaded.recovered,
		unavailable: loaded.unavailable,
	});
	attachGame(game);
	installHotkeys(game);
	installGamepad(game);

	// Dev builds always, production only with ?qa=1 (scripts/qa.ts drives the game through it).
	if (import.meta.env.DEV || new URLSearchParams(location.search).has('qa')) {
		(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
	}
}

if (hasWebGL()) void initPoki().then(start);
else showOverlay(t('error.webglTitle'), t('error.webglBody'), true);
