import Phaser from 'phaser';
import {
	BACK_PREFIX,
	createArt,
	ICON_PREFIX,
	PORTRAIT_PREFIX,
	registerPortraits,
} from '../art/flat';
import { PALETTE } from '../config/palette';
import { RADIUS } from '../config/ui';
import { getParams } from '../core/context';
import { pokiLoaded } from '../core/poki';
import { getView } from '../core/viewport';
import { loadPhase, voiceLang } from '../data/load-order';
import { getLang, type I18nKey, t } from '../i18n';
import { type VoLang, voLang } from '../logic/voice-lines';
import { drawPanel } from '../ui/panel';
import { text } from '../ui/screen';
import { addTitle } from '../ui/title';
import { fitCamera } from '../view/stage';

/** How many `boot.tip.N` strings exist in src/i18n. */
const TIPS = 10;

/**
 * Streams the voice lines of `lang` (the language changed in Settings) through the Boot loader,
 * which outlives the scene that asks; files already loaded are skipped by the loader.
 */
export function loadVoices(scene: Phaser.Scene, lang: VoLang): void {
	const boot = scene.scene.get('Boot') as BootScene;
	for (const file of __ASSET_FILES__) if (voiceLang(file) === lang) boot.queue(file);
	boot.load.start();
}

/**
 * Loads the sounds; the art is drawn by code (src/art/flat.ts). Stays running after the first
 * screen opens (with nothing on screen) to stream the later files (src/data/load-order.ts). Until
 * a file arrives, a sound is a silent no-op (src/core/audio.ts, music.ts) and a picture keeps its
 * drawn fallback, redrawn in place when it lands.
 */
export class BootScene extends Phaser.Scene {
	private loadingUi: Phaser.GameObjects.GameObject[] = [];

	constructor() {
		super('Boot');
	}

	preload(): void {
		this.showLoading();
		const lang = voLang(getLang());
		for (const file of __ASSET_FILES__) if (loadPhase(file, lang) === 'first') this.queue(file);
		// A missing or broken sound must never block the game.
		this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) =>
			console.warn(`[assets] failed to load ${file.key}`),
		);
	}

	/**
	 * The loading screen on the 640×360 stage: the game's title, a progress bar in the UI's look,
	 * and a random gameplay tip, over the dusk sky (code-drawn: a painting would cost a first stage).
	 */
	private showLoading(): void {
		const BAR = { w: 240, h: 14, y: 214 };
		const left = 320 - BAR.w / 2;
		const fit = (): void => {
			const cam = this.cameras.main;
			cam.setSize(this.scale.width, this.scale.height);
			fitCamera(cam, getView(this));
		};
		fit();
		this.scale.on('resize', fit);
		const sky = this.add.graphics();
		sky.fillStyle(PALETTE.duskTop).fillRect(-1000, -600, 2640, 600);
		sky.fillGradientStyle(
			PALETTE.duskTop,
			PALETTE.duskTop,
			PALETTE.duskBottom,
			PALETTE.duskBottom,
		).fillRect(-1000, 0, 2640, 360);
		sky.fillStyle(PALETTE.duskBottom).fillRect(-1000, 360, 2640, 600);
		const title = addTitle(this, 320, 124, t('game.title').toUpperCase(), 52);
		const track = this.add.graphics();
		drawPanel(track, left, BAR.y, BAR.w, BAR.h, { fill: PALETTE.panelDark, radius: BAR.h / 2 });
		const fill = this.add.graphics();
		const pct = this.add
			.text(320, BAR.y + BAR.h + 14, '0%', text(9, PALETTE.textLight))
			.setOrigin(0.5);
		const tipKey = `boot.tip.${Phaser.Math.Between(1, TIPS)}` as I18nKey;
		const label = this.add
			.text(320, 266, t('boot.tipLabel').toUpperCase(), text(8, PALETTE.manilha))
			.setOrigin(0.5);
		const tip = this.add
			.text(320, 279, t(tipKey), text(9, PALETTE.textLight, 420))
			.setOrigin(0.5, 0);
		this.loadingUi = [sky, title, track, fill, pct, label, tip];
		this.load.on('progress', (p: number) => {
			pct.setText(`${Math.round(p * 100)}%`);
			fill.clear();
			const w = Math.max(BAR.h, BAR.w * p);
			drawPanel(fill, left, BAR.y, w, BAR.h, {
				fill: PALETTE.manilha,
				radius: Math.min(RADIUS.button, BAR.h / 2),
				shadow: 0,
			});
		});
		this.events.once('loadingdone', () => this.scale.off('resize', fit));
	}

	/** Queues one public/ file under the key the game reads it by. */
	queue(file: string): void {
		const m = /^assets\/audio\/(sfx|music)\/(.+)\.mp3$/.exec(file);
		if (m?.[2]) this.load.audio(m[2], file);
		const p = /^assets\/gfx\/portrait\/(.+)\.(?:png|webp)$/.exec(file);
		if (p?.[1]) this.load.image(`${PORTRAIT_PREFIX}${p[1]}`, file);
		const g = /^assets\/gfx\/(card|bg|back)\/(.+)\.webp$/.exec(file);
		if (g?.[1] && g[2])
			this.load.image(
				g[1] === 'back' ? `${BACK_PREFIX}${g[2]}` : `img.${g[1]}.${g[2]}`,
				file,
			);
		const i = /^assets\/gfx\/icon\/(.+)\.png$/.exec(file);
		if (i?.[1]) this.load.image(`${ICON_PREFIX}${i[1]}`, file);
	}

	create(): void {
		registerPortraits(this);
		createArt(this);
		pokiLoaded();
		this.scene.launch('Backdrop');
		const params = getParams(this);
		if (params.run) this.scene.launch('Run', { fresh: true });
		else this.scene.launch(params.skipMenu ? 'Table' : 'Menu');
		for (const o of this.loadingUi) o.destroy();
		this.events.emit('loadingdone');
		this.load.off('progress');
		const lang = voLang(getLang());
		for (const file of __ASSET_FILES__) if (loadPhase(file, lang) === 'later') this.queue(file);
		// The late pictures replace the fallbacks already drawn (cards, backs, special faces).
		this.load.once(Phaser.Loader.Events.COMPLETE, () => registerPortraits(this));
		this.load.start();
	}
}
