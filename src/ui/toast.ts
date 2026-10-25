import type Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { DEPTH } from '../config/ui';
import { sfx } from '../core/audio';
import { steamUnlock } from '../core/steam';
import { type I18nKey, t } from '../i18n';
import { text } from './screen';

/** "Feat unlocked" toasts at the top of the screen, one under the other (PLAN B2.3); also unlocks the Steam achievement. */
export function featToast(scene: Phaser.Scene, ids: readonly string[]): void {
	steamUnlock(ids);
	ids.forEach((id, i) => {
		const cam = scene.cameras.main;
		const msg = scene.add
			.text(
				cam.worldView.centerX || scene.scale.width / 2,
				70 + i * 18,
				`${t('feat.unlocked')}: ${t(`feat.${id}.name` as I18nKey)}`,
				text(9, PALETTE.money),
			)
			.setOrigin(0.5)
			.setDepth(DEPTH.toast)
			.setScrollFactor(0);
		sfx(scene, 'sfx.money');
		scene.tweens.add({
			targets: msg,
			alpha: 0,
			delay: 2600,
			duration: 400,
			onComplete: () => msg.destroy(),
		});
	});
}
