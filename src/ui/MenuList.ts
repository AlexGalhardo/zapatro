import type Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { sfx } from '../core/audio';
import { TOUCH_ROW_MIN } from '../logic/touch';
import { menuPx, TEXT_SHADOW, UI_FONT } from './font';
import { onKey } from './keys';
import { touchUi, uiPx } from './touch';

export interface MenuItem {
	/** Label is re-read on every refresh so values (volume, language…) stay current. */
	label: () => string;
	onSelect?: () => void;
	/** Left/right change the value (settings). */
	onAdjust?: (dir: -1 | 1) => void;
	disabled?: () => boolean;
}

export interface MenuOptions {
	x: number;
	y: number;
	fontSize?: number;
	spacing?: number;
	align?: 'left' | 'center';
	onBack?: () => void;
	/** Item focused at creation (clamped); defaults to the first enabled one. */
	startFocus?: number;
	/** Rows shown at once; longer lists scroll with the focus (with ▲/▼ markers). */
	visible?: number;
	/**
	 * Moving past the first/last item: return true to hand the focus to another list (grids of
	 * columns); otherwise the list wraps around.
	 */
	onEdge?: (dir: -1 | 1) => boolean;
}

/**
 * Vertical menu navigable by keyboard (↑↓ / W S, ←→ / A D for values, Enter/Space, Esc) and
 * mouse (hover + click). Gamepad works through the synthetic key bridge.
 */
export class MenuList {
	private readonly texts: Phaser.GameObjects.Text[] = [];
	private focus = 0;
	/** Only the active list reacts to the keyboard (screens with two columns). */
	active = true;
	private readonly spacing: number;
	/** Vertical padding that stretches each row's hit area to the full row on touch screens. */
	private readonly pad: number;
	private readonly visible: number;
	private top = 0;
	private lx = 0;
	private ly = 0;
	private readonly more: Phaser.GameObjects.Text[];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly items: MenuItem[],
		private readonly opts: MenuOptions,
	) {
		const size = uiPx(menuPx(opts.fontSize ?? 14));
		const spacing = opts.spacing ?? size + 10;
		// Touch screens: rows tall enough for a thumb, and the whole row answers the tap (MOB1.2).
		this.spacing = touchUi.on ? Math.max(spacing, TOUCH_ROW_MIN) : spacing;
		this.pad = touchUi.on ? Math.max(0, Math.floor((this.spacing - size) / 2) - 1) : 0;
		this.visible = Math.max(1, opts.visible ?? items.length);
		this.more = ['▲', '▼'].map((m) =>
			scene.add
				.text(0, 0, m, {
					fontFamily: UI_FONT,
					fontSize: `${menuPx(8)}px`,
					color: toCss(PALETTE.textDim),
				})
				.setOrigin(0.5, 0)
				.setVisible(false),
		);
		items.forEach((item, i) => {
			const text = scene.add
				.text(0, 0, '', {
					fontFamily: UI_FONT,
					fontSize: `${size}px`,
					fontStyle: '700',
					shadow: TEXT_SHADOW,
					color: toCss(PALETTE.textLight),
				})
				.setOrigin(opts.align === 'left' ? 0 : 0.5, 0)
				.setPadding(this.pad && opts.align !== 'left' ? 10 : 0, this.pad)
				.setInteractive({ useHandCursor: true });
			text.on('pointerover', () => this.setFocus(i));
			text.on('pointerdown', (p: Phaser.Input.Pointer) => {
				this.setFocus(i);
				if (item.onAdjust) item.onAdjust(p.x < text.getBounds().centerX ? -1 : 1);
				else this.select();
				this.refresh();
			});
			this.texts.push(text);
		});
		const kb = scene.input.keyboard;
		const on = (keys: string[], fn: () => void) => {
			for (const k of keys)
				onKey(kb, `keydown-${k}`, () => {
					if (this.active) fn();
				});
		};
		on(['UP', 'W'], () => this.move(-1));
		on(['DOWN', 'S'], () => this.move(1));
		on(['LEFT', 'A'], () => this.adjust(-1));
		on(['RIGHT', 'D'], () => this.adjust(1));
		on(['ENTER', 'SPACE'], () => this.select());
		on(['ESC', 'BACKSPACE'], () => {
			if (!opts.onBack) return;
			sfx(this.scene, 'sfx.ui.back');
			opts.onBack();
		});
		this.layout(opts.x, opts.y);
		const start = opts.startFocus;
		this.setFocus(
			start !== undefined && items.length > 0
				? Math.min(Math.max(0, start), items.length - 1)
				: this.firstEnabled(),
		);
	}

	layout(x: number, y: number): void {
		this.lx = x;
		this.ly = y;
		const n = this.texts.length;
		this.top = Math.max(0, Math.min(this.top, n - this.visible));
		if (this.focus < this.top) this.top = this.focus;
		if (this.focus >= this.top + this.visible) this.top = this.focus - this.visible + 1;
		this.texts.forEach((t, i) => {
			const row = i - this.top;
			t.setVisible(row >= 0 && row < this.visible);
			t.setPosition(Math.round(x), Math.round(y + row * this.spacing - this.pad));
		});
		const [up, down] = this.more;
		up?.setPosition(Math.round(x), Math.round(y - this.spacing * 0.6)).setVisible(this.top > 0);
		down?.setPosition(
			Math.round(x),
			Math.round(y + this.visible * this.spacing - 4),
		).setVisible(this.top + this.visible < n);
	}

	get height(): number {
		return Math.min(this.texts.length, this.visible) * this.spacing;
	}

	refresh(): void {
		this.texts.forEach((t, i) => {
			// The scene may have restarted inside the item callback (language change).
			if (!t.scene) return;
			const item = this.items[i] as MenuItem;
			const off = item.disabled?.() ?? false;
			const focused = i === this.focus && this.active;
			const label = item.label();
			t.setText(focused ? `> ${label} <` : label);
			t.setColor(
				toCss(off ? PALETTE.textDim : focused ? PALETTE.manilha : PALETTE.textLight),
			);
			t.setAlpha(off ? 0.5 : 1);
		});
	}

	private firstEnabled(): number {
		const i = this.items.findIndex((it) => !(it.disabled?.() ?? false));
		return Math.max(0, i);
	}

	private setFocus(i: number): void {
		if (i !== this.focus && this.texts.length > 0) sfx(this.scene, 'sfx.ui.move');
		this.focus = i;
		if (this.visible < this.items.length) this.layout(this.lx, this.ly);
		this.onFocus?.(i);
		this.refresh();
	}

	/** Called when the mouse or keyboard focuses an item (lets two-column screens switch). */
	onFocus?: (index: number) => void;

	/** Index of the focused item. */
	get focused(): number {
		return this.focus;
	}

	setActive(active: boolean): void {
		this.active = active;
		this.refresh();
	}

	/** Focuses the first (dir 1) or last (dir -1) enabled item; used when a grid column enters. */
	enterFrom(dir: -1 | 1): void {
		const n = this.items.length;
		for (let k = 0; k < n; k++) {
			const i = dir > 0 ? k : n - 1 - k;
			if (!(this.items[i]?.disabled?.() ?? false)) {
				this.setFocus(i);
				return;
			}
		}
	}

	private move(dir: -1 | 1): void {
		const n = this.items.length;
		for (let step = 1; step <= n; step++) {
			const raw = this.focus + dir * step;
			if ((raw < 0 || raw >= n) && this.opts.onEdge?.(dir)) return;
			const i = (raw + n) % n;
			if (!(this.items[i]?.disabled?.() ?? false)) {
				this.setFocus(i);
				return;
			}
		}
	}

	private adjust(dir: -1 | 1): void {
		this.items[this.focus]?.onAdjust?.(dir);
		this.refresh();
	}

	private select(): void {
		const item = this.items[this.focus];
		if (!item || item.disabled?.()) return;
		sfx(this.scene, 'sfx.ui.confirm');
		if (item.onSelect) item.onSelect();
		else item.onAdjust?.(1);
		this.refresh();
	}
}
