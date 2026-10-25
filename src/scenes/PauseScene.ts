import Phaser from 'phaser';
import { PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS } from '../config/ui';
import { sfx } from '../core/audio';
import { trackZoom } from '../core/viewport';
import { getLang, type I18nKey, t } from '../i18n';
import { Button } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { backHint } from '../ui/key-hint';
import { onKey, onSceneEvent } from '../ui/keys';
import { drawPanel } from '../ui/panel';
import { text } from '../ui/screen';
import { byMode } from '../ui/touch';
import { fitCamera } from '../view/stage';

/** The three buttons: centre x, first row, row step and size. */
const BUTTON = {
	x: 320,
	y: 146,
	step: BUTTON_H.primary + GAP.card,
	w: 180,
	h: BUTTON_H.primary,
};

interface Row {
	/** Key that does the same from anywhere on the screen (resume: Esc). */
	hint?: () => string;
	label: I18nKey;
	color?: number;
	onSelect: () => void;
}

/** Pause overlay over the table: resume, settings, leave. */
export class PauseScene extends Phaser.Scene {
	private returnTo = 'Table';
	private focus = 0;

	constructor() {
		super('Pause');
	}

	init(data: { returnTo?: string }): void {
		this.returnTo = data?.returnTo ?? 'Table';
		this.focus = 0;
	}

	create(): void {
		this.scene.bringToTop();
		// Back from Settings in another language: the pause card is rebuilt (it holds no state).
		const lang = getLang();
		onSceneEvent(this, 'resume', () => {
			if (getLang() !== lang) this.scene.restart({ returnTo: this.returnTo });
		});
		const cam = this.cameras.main;
		// The table stays visible behind, dimmed.
		cam.setBackgroundColor('rgba(5,8,6,0.65)');
		const resume = () => {
			this.scene.stop();
			this.scene.resume(this.returnTo);
		};
		const rows: Row[] = [
			{ label: 'pause.resume', color: PALETTE.good, onSelect: resume, hint: backHint },
			{
				label: 'menu.settings',
				onSelect: () => {
					this.scene.pause();
					this.scene.launch('Settings', { returnTo: 'Pause' });
				},
			},
			{
				label: 'pause.quit',
				color: PALETTE.truco,
				onSelect: () => {
					this.scene.stop(this.returnTo);
					this.scene.start('Menu');
				},
			},
		];

		const card = this.add.graphics();
		drawPanel(card, 210, 82, 220, 184, { radius: RADIUS.frame, shadow: 5 });
		card.lineStyle(2, shade(PALETTE.panel, -0.3), 1).strokeRoundedRect(
			210,
			82,
			220,
			184,
			RADIUS.frame,
		);
		this.add
			.text(320, 102, t('pause.title'), {
				fontFamily: UI_FONT,
				fontSize: '22px',
				fontStyle: '700',
				color: toCss(PALETTE.manilha),
				shadow: TEXT_SHADOW,
			})
			.setOrigin(0.5);
		const buttons = rows.map((row, i) =>
			new Button(
				this,
				t(row.label),
				() => {
					this.focus = i;
					row.onSelect();
				},
				{
					w: BUTTON.w,
					h: BUTTON.h,
					size: 12,
					left: PAD.row,
					...(row.color !== undefined ? { color: row.color } : {}),
					...(row.hint ? { hint: row.hint } : {}),
					onHover: () => {
						this.focus = i;
						draw();
					},
				},
			).setPosition(BUTTON.x, BUTTON.y + i * BUTTON.step),
		);
		const draw = () => {
			for (const [i, b] of buttons.entries()) b.setFocus(i === this.focus);
		};
		this.add.text(320, 250, t(byMode('pause.hint')), text(6, PALETTE.textDim)).setOrigin(0.5);

		const kb = this.input.keyboard;
		const on = (keys: string[], fn: () => void) => {
			for (const k of keys) onKey(kb, `keydown-${k}`, fn);
		};
		const move = (step: number) => {
			this.focus = (this.focus + step + rows.length) % rows.length;
			sfx(this, 'sfx.ui.move');
			draw();
		};
		on(['UP', 'W'], () => move(-1));
		on(['DOWN', 'S'], () => move(1));
		on(['ENTER', 'SPACE'], () => rows[this.focus]?.onSelect());
		on(['ESC', 'P'], resume);
		draw();
		trackZoom(this, cam, (view) => fitCamera(cam, view));
	}
}
