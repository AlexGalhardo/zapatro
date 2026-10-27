import Phaser from 'phaser';
import { tex } from '../art/flat';
import { VECTOR_ICONS } from '../art/icons';
import { buttonFill, buttonHover, PALETTE, shade, toCss } from '../config/palette';
import { MOTION, RADIUS, SHADOW } from '../config/ui';
import { sfx } from '../core/audio';
import { comfort } from '../view/comfort';
import { UI_FONT } from './font';
import { type HintMode, hintMode, keyHint } from './key-hint';
import { touchUi, uiPx } from './touch';

/** An icon laid over a button: the cream vector icons take the button's dark ink. */
export function inkIcon(img: Phaser.GameObjects.Image, name: string): Phaser.GameObjects.Image {
	return (VECTOR_ICONS as readonly string[]).includes(name) ? img.setTint(PALETTE.textDark) : img;
}

/** Minimum touch target in logical px (MOB rules: whole button area answers the tap). */
const TOUCH_MIN_H = 22;

/**
 * Flat button: a light rounded block over a solid shadow, with a dark label. `color` is the accent
 * (green to confirm, red to call truco…), lightened by buttonFill() until the dark ink reads;
 * without it the button is light wood. Hover and keyboard focus lift it and light it up; a press
 * eases it down onto its shadow (MOTION.press, instant with "reduce flashes"). Mouse and touch; keyboard shortcuts are handled by the
 * scene (src/ui/keys.ts). `hint` puts the key (or pad button) that does the same on a keycap at
 * the right edge, so the game is playable without the mouse; it follows the pad being plugged in.
 */
export class Button extends Phaser.GameObjects.Container {
	private readonly g: Phaser.GameObjects.Graphics;
	private readonly label: Phaser.GameObjects.Text;
	private readonly hit: Phaser.GameObjects.Zone;
	private enabled = true;
	private lit = false;
	private pressed = false;
	/** Drawn lift over the shadow (px), eased towards target(). */
	private lift = 0;
	private liftTween: Phaser.Tweens.Tween | null = null;
	private firing = false;
	private readonly fill: number;
	private readonly bw: number;
	private readonly bh: number;
	private readonly size: number;
	private readonly border: number | undefined;
	private readonly left: number | null;
	private readonly badge: Phaser.GameObjects.Text;
	private readonly iconImg: Phaser.GameObjects.Image | null = null;
	private hintFn: (() => string) | undefined;
	private focusHint = true;
	private shownMode: HintMode | null = null;
	private shownHints = comfort.keyHints;
	private focused = false;
	private below = false;

	constructor(
		scene: Phaser.Scene,
		text: string,
		private readonly onClick: () => void,
		opts: {
			w?: number;
			h?: number;
			size?: number;
			color?: number;
			onHover?: () => void;
			hint?: () => string;
			/** A frame always drawn around the button (the menu's gold-rimmed buttons). */
			border?: number;
			/** Label aligned to the left edge (true: 9 px in; a number: that many px in). */
			left?: boolean | number;
			/** An icon (`icon.<name>`) in the room `left` leaves; it rises and sinks with the button. */
			icon?: string;
			iconScale?: number;
			/** Tapped or clicked while disabled (a price you cannot pay): explain why. */
			onBlocked?: () => void;
			/** false: no "Enter" keycap while focused (tab bars, where it would squeeze the label). */
			focusHint?: boolean;
		} = {},
	) {
		super(scene, 0, 0);
		this.bw = opts.w ?? 72;
		this.bh = Math.max(opts.h ?? 18, touchUi.on ? TOUCH_MIN_H : 0);
		this.fill = buttonFill(opts.color);
		this.size = uiPx(opts.size ?? 9);
		this.border = opts.border;
		this.left =
			opts.left === undefined || opts.left === false
				? null
				: opts.left === true
					? 9
					: opts.left;
		this.g = scene.add.graphics();
		this.label = scene.add
			.text(0, -1, text, {
				fontFamily: UI_FONT,
				fontSize: `${this.size}px`,
				fontStyle: '700',
				color: toCss(PALETTE.textDark),
			})
			.setOrigin(opts.left === undefined || opts.left === false ? 0.5 : 0, 0.5);
		this.badge = scene.add
			.text(0, -1, '', {
				fontFamily: UI_FONT,
				fontSize: `${Math.max(6, Math.round(this.size * 0.75))}px`,
				fontStyle: '700',
				color: toCss(PALETTE.textLight),
				backgroundColor: toCss(PALETTE.panelDark),
				padding: { x: 2, y: 0 },
			})
			.setOrigin(1, 0.5)
			.setVisible(false);
		this.hit = scene.add.zone(0, 0, this.bw, this.bh).setInteractive({ useHandCursor: true });
		this.add([this.g, this.label, this.badge]);
		if (opts.icon) {
			this.iconImg = inkIcon(
				scene.add
					.image(
						-this.bw / 2 + (this.left ?? 9) / 2 + 1,
						-1,
						tex(scene, `icon.${opts.icon}`),
					)
					.setScale(opts.iconScale ?? 0.7),
				opts.icon,
			);
			this.add(this.iconImg);
		}
		this.add(this.hit);
		this.hintFn = opts.hint;
		this.focusHint = opts.focusHint ?? true;
		const check = () => {
			if (this.shownMode !== hintMode() || this.shownHints !== comfort.keyHints)
				this.refreshHint();
		};
		scene.events.on('update', check);
		this.once('destroy', () => {
			scene.events.off('update', check);
			this.liftTween?.stop();
		});
		this.setSize(this.bw, this.bh);
		this.fit();
		this.redraw();
		this.hit.on('pointerover', () => {
			if (!this.enabled) return;
			this.hover(true);
			opts.onHover?.();
		});
		this.hit.on('pointerdown', () => this.press(this.enabled));
		this.hit.on('pointerout', () => {
			this.pressed = false;
			this.hover(false);
		});
		this.hit.on('pointerup', () => {
			this.press(false);
			if (!this.enabled && this.visible) opts.onBlocked?.();
			else this.fire();
		});
		scene.add.existing(this);
	}

	/** Re-reads the hint (after a rebind, or when the device changes). */
	refreshHint(): this {
		this.shownMode = hintMode();
		this.shownHints = comfort.keyHints;
		// Its own shortcut; else, while focused, the key that confirms (Enter / ✕).
		const own = this.hintFn?.() ?? '';
		this.badge
			.setText(own || (this.focused && this.focusHint ? keyHint('Enter') : ''))
			.setVisible(this.badge.text !== '');
		this.fit();
		return this;
	}

	get hintText(): string {
		return this.badge.visible ? this.badge.text : '';
	}

	/**
	 * Keyboard, pad and scripted presses: the button visibly sinks and comes back up for
	 * MOTION.press, then acts (the mouse already showed its own press).
	 */
	click(): void {
		if (!this.enabled || !this.visible || this.firing) return;
		if (comfort.reduceFlashes) {
			this.fire();
			return;
		}
		this.firing = true;
		this.press(true);
		this.scene.time.delayedCall(MOTION.press, () => {
			this.firing = false;
			if (!this.scene) return;
			this.press(false);
			this.fire();
		});
	}

	private fire(): void {
		if (!this.enabled || !this.visible) return;
		sfx(this.scene, 'sfx.ui.confirm');
		this.onClick();
	}

	setLabel(text: string): this {
		this.label.setText(text);
		this.fit();
		return this;
	}

	/** Long labels (PT-BR) shrink to fit the button. */
	private fit(): void {
		const shown = this.badge.visible && this.badge.text !== '';
		// Small buttons (◀ ▶) keep their label: the keycap goes under them instead.
		const below = shown && this.bw < this.badge.width + 24;
		const badge = shown && !below ? this.badge.width + 3 : 0;
		let size = this.size;
		this.label.setFontSize(size);
		// The room right of a left-aligned label starts at its indent (icon side), not at 3 px.
		const room = this.bw - (this.left ?? 0) - 6 - badge;
		while (this.label.width > room && size > 6) this.label.setFontSize(--size);
		// Label centred in the room the keycap leaves; the keycap hugs the right edge.
		this.label.setX(this.left === null ? -badge / 2 : -this.bw / 2 + this.left);
		if (below) this.badge.setOrigin(0.5, 0).setPosition(0, this.bh / 2 + 3);
		else this.badge.setOrigin(1, 0.5).setX(this.bw / 2 - 3);
		this.below = below;
	}

	setEnabled(on: boolean): this {
		this.enabled = on;
		if (!on) this.lit = false;
		// 60 % dark ink on the grey fill still reads at 3.5:1.
		this.label.setAlpha(on ? 1 : 0.6);
		this.badge.setAlpha(on ? 1 : 0.5);
		this.iconImg?.setAlpha(on ? 1 : 0.6);
		this.settle();
		return this;
	}

	/** Keyboard/gamepad focus (src/ui/nav.ts): drawn like the mouse hover. */
	setFocus(on: boolean): this {
		this.focused = on;
		this.hover(on && this.enabled);
		this.refreshHint();
		return this;
	}

	get isEnabled(): boolean {
		return this.enabled && this.visible;
	}

	private press(on: boolean): void {
		this.pressed = on;
		this.settle();
	}

	private hover(on: boolean): void {
		this.lit = on;
		this.settle();
	}

	/** Eases the block to its height for the current state (ease-out, no bounce). */
	private settle(): void {
		const to = this.pressed
			? SHADOW.pressed - this.shadowDepth
			: this.lit && this.enabled
				? SHADOW.hoverLift
				: 0;
		this.liftTween?.stop();
		this.liftTween = null;
		if (comfort.reduceFlashes || !this.scene || this.lift === to) {
			this.lift = to;
			this.redraw();
			return;
		}
		this.liftTween = this.scene.tweens.addCounter({
			from: this.lift,
			to,
			duration: MOTION.press,
			ease: 'Quad.easeOut',
			onUpdate: (tw) => {
				this.lift = tw.getValue() ?? to;
				this.redraw();
			},
		});
	}

	/** Height of the solid shadow: deeper on taller buttons. */
	private get shadowDepth(): number {
		return Phaser.Math.Clamp(Math.round(this.bh * SHADOW.buttonDepth), 2, SHADOW.button);
	}

	/** A rounded block filled top to bottom from `from` to `to`, in rows of half a stage pixel. */
	private gradient(y: number, w: number, h: number, r: number, from: number, to: number): void {
		const a = Phaser.Display.Color.IntegerToColor(from);
		const b = Phaser.Display.Color.IntegerToColor(to);
		const step = 0.5;
		for (let i = 0; i < h; i += step) {
			const mid = i + step / 2;
			// Inset of the rounded corners at this row.
			const d = mid < r ? r - mid : mid > h - r ? mid - (h - r) : 0;
			const inset = d ? r - Math.sqrt(Math.max(0, r * r - d * d)) : 0;
			const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, h, mid);
			this.g
				.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1)
				.fillRect(-w / 2 + inset, y + i, w - 2 * inset, step);
		}
	}

	private redraw(): void {
		const { bw: w, bh: h } = this;
		const r = Math.min(RADIUS.button, h / 2);
		// The shadow stays put; the block rises over it (hover) or sinks onto it (press).
		const { lift } = this;
		const body = !this.enabled
			? PALETTE.buttonOff
			: this.lit && !this.pressed
				? buttonHover(this.fill)
				: this.fill;
		const top = -h / 2 - lift;
		this.g.clear();
		this.g
			.fillStyle(PALETTE.shadow, SHADOW.buttonAlpha)
			.fillRoundedRect(-w / 2, -h / 2 + this.shadowDepth, w, h, r);
		// Lit from above: lighter top, darker base; pressed turns it over. Disabled stays flat-ish.
		const k = SHADOW.buttonGradient * (this.enabled ? 1 : 0.35);
		const sunk = this.pressed && this.enabled;
		this.gradient(top, w, h, r, shade(body, sunk ? -k : k), shade(body, sunk ? k * 0.2 : -k));
		if (this.enabled && !sunk)
			this.g.fillStyle(shade(body, 0.45), 0.7).fillRect(-w / 2 + r, top + 1, w - 2 * r, 1);
		this.g
			.lineStyle(
				this.lit ? 2 : this.border !== undefined ? 1.5 : 1,
				this.lit ? PALETTE.panelBorder : (this.border ?? shade(body, -0.45)),
				this.lit || this.border !== undefined ? 1 : 0.8,
			)
			.strokeRoundedRect(-w / 2, top, w, h, r);
		this.label.setY(-1 - lift);
		this.iconImg?.setY(-1 - lift);
		if (!this.below) this.badge.setY(-1 - lift);
	}
}
