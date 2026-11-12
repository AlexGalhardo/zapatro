import type Phaser from 'phaser';
import { tex } from '../../art/flat';
import {
	NOTICE,
	NOTICE_BOX,
	NOTICE_QUEUE,
	NOTICE_WEIGHT,
	type NoticeKind,
} from '../../config/feel-notice';
import { PALETTE, shade, toCss } from '../../config/palette';
import { DEPTH } from '../../config/ui';
import { TEXT_SHADOW, UI_FONT } from '../../ui/font';
import { uiPx } from '../../ui/touch';

interface Pending {
	kind: NoticeKind;
	text: string;
	ms: number;
}

/**
 * The single place every table notice is drawn (docs/game-feel.md §7): a dark strip with a
 * coloured icon badge and the text. A heavier (or equal) notice replaces the current one at once;
 * a lighter one waits behind it. Plain data in, nothing read from or written to the match.
 */
export class NoticeBoard {
	private readonly box: Phaser.GameObjects.Container;
	private current: (Pending & { weight: number }) | null = null;
	private queue: Pending[] = [];
	private timer: Phaser.Time.TimerEvent | null = null;
	private baseY: number = NOTICE_BOX.y;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly dur: (ms: number) => number,
	) {
		this.box = scene.add.container(NOTICE_BOX.x, NOTICE_BOX.y).setDepth(DEPTH.banner);
		this.box.setVisible(false);
	}

	setPosition(x: number, y: number): void {
		this.baseY = y;
		this.box.setPosition(x, y);
	}

	/** `ms` overrides the time on screen the kind's weight gives (at 1×). */
	show(kind: NoticeKind, text: string, ms?: number): void {
		const weight = NOTICE[kind].weight;
		const next: Pending = { kind, text, ms: ms ?? NOTICE_WEIGHT[weight].ms };
		const cur = this.current;
		if (!cur || weight >= cur.weight || kind === cur.kind) {
			this.draw(next);
			return;
		}
		this.queue.push(next);
		if (this.queue.length > NOTICE_QUEUE) this.queue.shift();
	}

	hide(): void {
		this.timer?.remove(false);
		this.timer = null;
		this.queue = [];
		this.current = null;
		this.box.setVisible(false);
	}

	private draw(n: Pending): void {
		const def = NOTICE[n.kind];
		this.current = { ...n, weight: def.weight };
		this.box.removeAll(true);
		const label = this.scene.add
			.text(0, 0, n.text, {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(NOTICE_WEIGHT[def.weight].size)}px`,
				fontStyle: '700',
				color: toCss(PALETTE.textLight),
				shadow: TEXT_SHADOW,
				align: 'center',
				wordWrap: { width: NOTICE_BOX.wrap },
			})
			.setOrigin(0, 0.5);
		const { pad } = NOTICE_BOX;
		const badge = Math.max(NOTICE_BOX.badge, label.height + 4);
		const w = pad + badge + pad + label.width + pad * 1.5;
		const h = badge + pad;
		const left = -w / 2;
		const g = this.scene.add.graphics();
		g.fillStyle(shade(PALETTE.panelDark, -0.6), 0.9).fillRoundedRect(
			left,
			-h / 2 + 2,
			w,
			h,
			h / 2,
		);
		g.fillStyle(PALETTE.panelDark, 0.96).fillRoundedRect(left, -h / 2, w, h, h / 2);
		g.lineStyle(1.4, def.color, 1).strokeRoundedRect(left, -h / 2, w, h, h / 2);
		const bx = left + pad / 2 + badge / 2 + 1;
		g.fillStyle(shade(def.color, -0.35), 1).fillCircle(bx, 1, badge / 2);
		g.fillStyle(def.color, 1).fillCircle(bx, 0, badge / 2);
		const icon = this.scene.add
			.image(bx, 0, tex(this.scene, `icon.${def.icon}`))
			.setDisplaySize(badge * 0.72, badge * 0.72);
		label.setPosition(left + pad + badge + pad * 0.8, 0);
		this.box.add([g, icon, label]);
		this.box.setVisible(true).setAlpha(0).y = this.baseY + NOTICE_BOX.rise;
		this.scene.tweens.killTweensOf(this.box);
		this.scene.tweens.add({
			targets: this.box,
			alpha: 1,
			y: this.baseY,
			duration: this.dur(NOTICE_BOX.inMs),
			ease: 'Back.easeOut',
		});
		this.timer?.remove(false);
		this.timer = this.scene.time.delayedCall(this.dur(n.ms), () => this.next());
	}

	private next(): void {
		const n = this.queue.shift();
		if (n) this.draw(n);
		else {
			this.current = null;
			this.box.setVisible(false);
		}
	}
}
