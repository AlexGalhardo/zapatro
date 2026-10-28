import Phaser from 'phaser';
import {
	BACK_PREFIX,
	createArt,
	ICON_PREFIX,
	PORTRAIT_PREFIX,
	registerPortraits,
} from '../art/flat';
import { PALETTE, toCss } from '../config/palette';
import { getParams } from '../core/context';
import { pokiLoaded } from '../core/poki';
import { loadPhase, voiceLang } from '../data/load-order';
import { getLang, t } from '../i18n';
import { type VoLang, voLang } from '../logic/voice-lines';
import { UI_FONT } from '../ui/font';

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
	private label?: Phaser.GameObjects.Text;

	constructor() {
		super('Boot');
	}

	preload(): void {
		const label = this.add
			.text(this.scale.width / 2, this.scale.height / 2, t('boot.loading'), {
				fontFamily: UI_FONT,
				fontSize: '24px',
				color: toCss(PALETTE.textDim),
			})
			.setOrigin(0.5);
		this.label = label;
		this.load.on('progress', (p: number) =>
			label.setText(`${t('boot.loading')} ${Math.round(p * 100)}%`),
		);
		const lang = voLang(getLang());
		for (const file of __ASSET_FILES__) if (loadPhase(file, lang) === 'first') this.queue(file);
		// A missing or broken sound must never block the game.
		this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) =>
			console.warn(`[assets] failed to load ${file.key}`),
		);
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
		this.label?.destroy();
		this.load.off('progress');
		const lang = voLang(getLang());
		for (const file of __ASSET_FILES__) if (loadPhase(file, lang) === 'later') this.queue(file);
		// The late pictures replace the fallbacks already drawn (cards, backs, special faces).
		this.load.once(Phaser.Loader.Events.COMPLETE, () => registerPortraits(this));
		this.load.start();
	}
}
