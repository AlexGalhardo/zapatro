import Phaser from 'phaser';
import { createArt, ICON_PREFIX, PORTRAIT_PREFIX, registerPortraits } from '../art/flat';
import { PALETTE, toCss } from '../config/palette';
import { getParams } from '../core/context';
import { pokiLoaded } from '../core/poki';
import { t } from '../i18n';
import { UI_FONT } from '../ui/font';

/**
 * Sounds the first table never needs (later Championships' ambiences, the final music, the
 * bosses' voices): loaded after the menu opens, so the first web download stays under 8 MB
 * (GD-017). Until a file arrives, playing it is a silent no-op (src/core/audio.ts, music.ts).
 */
const LATER =
	/^assets\/audio\/(sfx|music)\/(amb\.(?!botecoBairro)|music\.king|vo\.(valentao|cartomante|juiz|agiota|delegado|reiDoTruco)\.)/;

/**
 * Loads the sounds; the art is drawn by code (src/art/flat.ts). Stays running after the first
 * screen opens (with nothing on screen) to stream the LATER sounds.
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
		for (const file of __ASSET_FILES__) {
			if (LATER.test(file)) continue;
			const m = /^assets\/audio\/(sfx|music)\/(.+)\.mp3$/.exec(file);
			if (m?.[2]) this.load.audio(m[2], file);
			const p = /^assets\/gfx\/portrait\/(.+)\.png$/.exec(file);
			if (p?.[1]) this.load.image(`${PORTRAIT_PREFIX}${p[1]}`, file);
			const i = /^assets\/gfx\/icon\/(.+)\.png$/.exec(file);
			if (i?.[1]) this.load.image(`${ICON_PREFIX}${i[1]}`, file);
		}
		// A missing or broken sound must never block the game.
		this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) =>
			console.warn(`[assets] failed to load ${file.key}`),
		);
	}

	create(): void {
		registerPortraits(this);
		createArt(this);
		pokiLoaded();
		const params = getParams(this);
		if (params.run) this.scene.launch('Run', { fresh: true });
		else this.scene.launch(params.skipMenu ? 'Table' : 'Menu');
		this.label?.destroy();
		this.load.off('progress');
		for (const file of __ASSET_FILES__) {
			const m = LATER.test(file)
				? /^assets\/audio\/(sfx|music)\/(.+)\.mp3$/.exec(file)
				: null;
			if (m?.[2]) this.load.audio(m[2], file);
		}
		this.load.start();
	}
}
