import Phaser from 'phaser';
import { PALETTE, shade } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS } from '../config/ui';
import { sfx } from '../core/audio';
import { getSave, persist } from '../core/context';
import { trackZoom } from '../core/viewport';
import { RUN_MODES, type RunMode } from '../data/championships';
import { t } from '../i18n';
import { Button } from '../ui/Button';
import { showHintLine } from '../ui/key-hint';
import { onKey } from '../ui/keys';
import { drawPanel } from '../ui/panel';
import { text } from '../ui/screen';
import { addTitle } from '../ui/title';
import { byMode } from '../ui/touch';
import { fitCamera } from '../view/stage';

/** The card, like the pause card: one padding on every side and between title, buttons and hint. */
const CARD = { x: 190, w: 260, pad: 20, titleH: 26, hintH: 8 };
const BUTTON = { x: 320, w: CARD.w - 2 * CARD.pad, h: BUTTON_H.primary };

/**
 * Quick match format (Menu → "Quick match"): teams of two or mano a mano. Opened over the paused
 * menu; the pick is remembered in the save and handed to `onPick`, which starts the table.
 */
export class ModeScene extends Phaser.Scene {
	private onPick: (mode: RunMode) => void = () => {};
	private focus = 0;

	constructor() {
		super('Mode');
	}

	init(data: { onPick?: (mode: RunMode) => void }): void {
		this.onPick = data?.onPick ?? (() => {});
		this.focus = Math.max(0, RUN_MODES.indexOf(getSave(this).settings.quickMode ?? '2v2'));
	}

	create(): void {
		this.scene.bringToTop();
		const cam = this.cameras.main;
		cam.setBackgroundColor('rgba(5,8,6,0.65)');
		const close = (): void => {
			this.scene.stop();
			this.scene.resume('Menu');
		};
		const pick = (mode: RunMode): void => {
			getSave(this).settings.quickMode = mode;
			persist(this);
			close();
			this.onPick(mode);
		};

		const hintLine = showHintLine();
		const { pad } = CARD;
		const gap = GAP.card;
		const buttonsH = RUN_MODES.length * BUTTON.h + (RUN_MODES.length - 1) * gap;
		const cardH = pad + CARD.titleH + pad + buttonsH + pad + (hintLine ? CARD.hintH + pad : 0);
		const top = Math.round(180 - cardH / 2);
		const card = this.add.graphics();
		drawPanel(card, CARD.x, top, CARD.w, cardH, { radius: RADIUS.frame, shadow: 5 });
		card.lineStyle(2, shade(PALETTE.panel, -0.3), 1).strokeRoundedRect(
			CARD.x,
			top,
			CARD.w,
			cardH,
			RADIUS.frame,
		);
		addTitle(this, 320, top + pad + CARD.titleH / 2, t('menu.quick'), 22);
		const first = top + pad + CARD.titleH + pad + BUTTON.h / 2;
		const buttons = RUN_MODES.map((mode, i) =>
			new Button(this, t(`run.mode.${mode}`), () => pick(mode), {
				w: BUTTON.w,
				h: BUTTON.h,
				size: 12,
				left: PAD.row,
				color: mode === '1v1' ? PALETTE.truco : PALETTE.calm,
				onHover: () => {
					this.focus = i;
					draw();
				},
			}).setPosition(BUTTON.x, first + i * (BUTTON.h + gap)),
		);
		const draw = (): void => {
			for (const [i, b] of buttons.entries()) b.setFocus(i === this.focus);
		};
		this.add
			.text(
				320,
				top + cardH - pad - CARD.hintH / 2,
				t(byMode('mode.hint')),
				text(6, PALETTE.textDim),
			)
			.setOrigin(0.5)
			.setVisible(hintLine);

		const kb = this.input.keyboard;
		const on = (keys: string[], fn: () => void): void => {
			for (const k of keys) onKey(kb, `keydown-${k}`, fn);
		};
		const move = (step: number): void => {
			const n = RUN_MODES.length;
			this.focus = (this.focus + step + n) % n;
			sfx(this, 'sfx.ui.move');
			draw();
		};
		on(['UP', 'W'], () => move(-1));
		on(['DOWN', 'S'], () => move(1));
		on(['ENTER', 'SPACE'], () => {
			const mode = RUN_MODES[this.focus];
			if (!mode) return;
			sfx(this, 'sfx.ui.confirm');
			pick(mode);
		});
		on(['ESC'], close);
		draw();
		trackZoom(this, cam, (view) => fitCamera(cam, view));
	}
}
