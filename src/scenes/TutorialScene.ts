import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { BUTTON_H, GAP, PAD, SAFE } from '../config/ui';
import { getSave, persist } from '../core/context';
import { trackZoom } from '../core/viewport';
import { TUTORIAL_STEPS, type TutorialTrigger, tutorialStepFor } from '../data/tutorial';
import { type I18nKey, t } from '../i18n';
import type { ViewSize } from '../logic/viewport';
import { Button } from '../ui/Button';
import { backHint, keyHint } from '../ui/key-hint';
import { onKey } from '../ui/keys';
import { drawPanel, panelTitle } from '../ui/panel';
import { text } from '../ui/screen';
import { byMode } from '../ui/touch';
import type { TableScene } from './TableScene';

const PANEL_W = 380;
/** Width of the Next and Skip buttons. */
const BTN_W = 150;
/** Header band height and the top of the body text under it. */
const HEAD_H = 28;
const BODY_Y = HEAD_H + PAD.panel;
/** Text sizes of the card (read at 1080p): body, title, step counter and buttons. */
const SIZE = { body: 9, title: 14, count: 8, button: 12 } as const;

/**
 * Coach of the played tutorial (PLAN A6.1), launched over the table. Each step waits for a moment
 * of the match (`tutorial` events from TableScene), pauses the table, dims everything but the
 * element it talks about and shows a card; Next resumes the match.
 */
export class TutorialScene extends Phaser.Scene {
	private current = 0;
	private shown = new Set<number>();
	private showing = false;
	private view: ViewSize | null = null;
	private ui!: Phaser.GameObjects.Container;

	constructor() {
		super('Tutorial');
	}

	create(): void {
		this.current = 0;
		this.shown = new Set();
		this.showing = false;
		this.ui = this.add.container(0, 0).setVisible(false);
		const table = this.table();
		const onCue = (trigger: TutorialTrigger) => this.offer(trigger);
		table.events.on('tutorial', onCue);
		this.events.once('shutdown', () => table.events.off('tutorial', onCue));
		const cam = this.cameras.main;
		trackZoom(this, cam, (view) => {
			this.view = view;
			cam.centerOn(view.width / 2, view.height / 2);
			if (this.showing) this.render();
		});
		onKey(this.input.keyboard, 'keydown-ENTER', () => this.showing && this.advance());
		onKey(this.input.keyboard, 'keydown-SPACE', () => this.showing && this.advance());
		onKey(this.input.keyboard, 'keydown-ESC', () => this.showing && this.leave());
		// Let the table fade in and deal first: pausing it freezes its camera fade too.
		this.time.delayedCall(700, () => this.offer('start'));
	}

	private table(): TableScene {
		return this.scene.get('Table') as TableScene;
	}

	private offer(trigger: TutorialTrigger | 'next'): void {
		if (this.showing) return;
		const i = tutorialStepFor(TUTORIAL_STEPS, this.shown, trigger);
		if (i === null) return;
		this.current = i;
		this.shown.add(i);
		this.showing = true;
		this.scene.pause('Table');
		this.scene.bringToTop();
		this.render();
	}

	private render(): void {
		const step = TUTORIAL_STEPS[this.current];
		const view = this.view;
		if (!step || !view) return;
		this.ui.removeAll(true);
		const area = step.anchor ? this.table().anchor(step.anchor) : null;
		const shade = (x: number, y: number, w: number, h: number) =>
			this.add.rectangle(x, y, w, h, PALETTE.night, 0.6).setOrigin(0);
		if (area) {
			const r = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(area), 4, 4);
			this.ui.add([
				shade(0, 0, view.width, r.top),
				shade(0, r.bottom, view.width, view.height - r.bottom),
				shade(0, r.top, r.left, r.height),
				shade(r.right, r.top, view.width - r.right, r.height),
			]);
			const ring = this.add
				.rectangle(r.x, r.y, r.width, r.height)
				.setOrigin(0)
				.setStrokeStyle(2, PALETTE.manilha);
			this.tweens.add({ targets: ring, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
			this.ui.add(ring);
		} else this.ui.add(shade(0, 0, view.width, view.height));

		const last = this.current === TUTORIAL_STEPS.length - 1;
		const bodyKey = `tutorial.${step.id}.body` as I18nKey;
		const body = this.add.text(0, 0, t(step.keys ? byMode(bodyKey) : bodyKey), {
			...text(SIZE.body, PALETTE.textLight, PANEL_W - 2 * PAD.panel),
			align: 'left',
		});
		// Header band, body, a card gap, the buttons and the panel padding below them.
		const h = BODY_Y + body.height + GAP.card + BUTTON_H.primary + PAD.panel;
		const { x, y } = this.place(area, h);
		const g = this.add.graphics();
		drawPanel(g, x, y, PANEL_W, h, { header: HEAD_H });
		const title = this.add
			.text(
				x + PAD.panel,
				y + HEAD_H / 2,
				t(`tutorial.${step.id}.title` as I18nKey),
				panelTitle(SIZE.title),
			)
			.setOrigin(0, 0.5);
		const count = this.add
			.text(
				x + PANEL_W - PAD.panel,
				y + HEAD_H / 2,
				`${this.shown.size}/${TUTORIAL_STEPS.filter((st, i) => !st.optional || this.shown.has(i)).length}`,
				text(SIZE.count, PALETTE.textDim),
			)
			.setOrigin(1, 0.5);
		body.setPosition(x + PAD.panel, y + BODY_Y);
		const btnY = y + h - PAD.panel - BUTTON_H.primary / 2;
		const ok = new Button(
			this,
			t(last ? 'tutorial.keepPlaying' : 'tutorial.next'),
			() => this.advance(),
			{
				w: BTN_W,
				h: BUTTON_H.primary,
				size: SIZE.button,
				color: PALETTE.good,
				hint: () => keyHint('Enter'),
			},
		).setPosition(x + PANEL_W - PAD.panel - BTN_W / 2, btnY);
		const out = new Button(
			this,
			t(last ? 'tutorial.toMenu' : 'tutorial.skip'),
			() => this.leave(),
			{
				w: BTN_W,
				h: BUTTON_H.primary,
				size: SIZE.button,
				hint: backHint,
			},
		).setPosition(x + PAD.panel + BTN_W / 2, btnY);
		this.ui.add([g, title, count, body, ok, out]).setVisible(true);
	}

	/**
	 * Where the card goes: under or over the highlight (the side with room), else beside it, always
	 * inside the view and never over the highlighted element; with no highlight, at the bottom.
	 */
	private place(area: Phaser.Geom.Rectangle | null, h: number): { x: number; y: number } {
		const view = this.view as ViewSize;
		const clampX = (v: number): number =>
			Math.round(Phaser.Math.Clamp(v, SAFE.stage, view.width - PANEL_W - SAFE.stage));
		const clampY = (v: number): number =>
			Math.round(Phaser.Math.Clamp(v, SAFE.stage, view.height - h - SAFE.stage));
		const centre = clampX((view.width - PANEL_W) / 2);
		if (!area) return { x: centre, y: clampY(view.height - h - 28) };
		const gap = PAD.panel;
		if (view.height - area.bottom - gap - SAFE.stage >= h)
			return { x: centre, y: area.bottom + gap };
		if (area.top - gap - SAFE.stage >= h) return { x: centre, y: area.top - gap - h };
		// No room above or below: beside it, on the wider side, level with it.
		const right = view.width - area.right >= area.left;
		return {
			x: clampX(right ? area.right + gap : area.left - gap - PANEL_W),
			y: clampY(area.centerY - h / 2),
		};
	}

	private advance(): void {
		const last = this.current === TUTORIAL_STEPS.length - 1;
		this.showing = false;
		this.ui.setVisible(false).removeAll(true);
		this.scene.resume('Table');
		if (last) {
			this.markDone();
			this.scene.stop();
			return;
		}
		this.offer('next');
	}

	/** Skip (or finish) the tutorial: it counts as done, so the menu stops suggesting it. */
	private leave(): void {
		this.markDone();
		this.scene.stop('Table');
		this.scene.start('Menu');
	}

	private markDone(): void {
		getSave(this).meta.tutorialDone = true;
		persist(this);
	}
}
