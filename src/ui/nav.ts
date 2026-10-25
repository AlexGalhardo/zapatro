import Phaser from 'phaser';
import { sfx } from '../core/audio';
import { Button } from './Button';
import { hintMode } from './key-hint';
import { onKey } from './keys';

/**
 * Keyboard and gamepad navigation over a scene's buttons (PLAN B4.1): the arrows move the focus
 * to the nearest enabled button in that direction, Enter clicks it. Screens built from `Button`s
 * (run, shop, almanac, end panels) need no code of their own beyond `buttonNav(this)`.
 */
export interface ButtonNav {
	/** Forgets the focus (the screen is about to be redrawn). */
	reset(): void;
	/**
	 * After the next redraw, start the focus on the first button `pick` accepts instead of the
	 * first one (e.g. the next item to buy); the arrows go on from there as usual.
	 */
	prefer(pick: (b: Button) => boolean): void;
}

export function buttonNav(
	scene: Phaser.Scene,
	opts: {
		/** Navigate only while this holds (the table uses it for its panels). */
		when?: () => boolean;
		/** Only buttons inside these objects (default: the whole scene). */
		roots?: () => Phaser.GameObjects.GameObject[];
	} = {},
): ButtonNav {
	const active = (): boolean => opts.when?.() ?? true;
	let focus: Button | null = null;
	let preferred: ((b: Button) => boolean) | null = null;
	/** The starting focus: the preferred button when there is one, else the first. */
	const start = (buttons: Button[]): Button | null => {
		const pick = preferred ? buttons.find(preferred) : undefined;
		if (pick) preferred = null;
		return pick ?? buttons[0] ?? null;
	};
	const all = (): Button[] => {
		const out: Button[] = [];
		const walk = (list: Phaser.GameObjects.GameObject[]) => {
			for (const o of list) {
				if (o instanceof Button) {
					if (o.visible && o.isEnabled && (o.parentContainer?.visible ?? true))
						out.push(o);
				} else if (o instanceof Phaser.GameObjects.Container && o.visible) walk(o.list);
			}
		};
		walk(opts.roots?.() ?? scene.children.list);
		return out;
	};
	const pos = (b: Button) => b.getBounds();
	const move = (dx: number, dy: number) => {
		const buttons = all();
		if (!buttons.length) return;
		if (!focus || !buttons.includes(focus)) {
			focus = start(buttons);
			focus?.setFocus(true);
			return;
		}
		const from = pos(focus);
		let best: Button | null = null;
		let bestScore = Number.POSITIVE_INFINITY;
		for (const b of buttons) {
			if (b === focus) continue;
			const r = pos(b);
			const vx = r.centerX - from.centerX;
			const vy = r.centerY - from.centerY;
			const along = vx * dx + vy * dy;
			if (along <= 1) continue;
			const across = Math.abs(vx * dy) + Math.abs(vy * dx);
			const score = along + across * 2;
			if (score < bestScore) {
				bestScore = score;
				best = b;
			}
		}
		if (!best) return;
		focus.setFocus(false);
		focus = best;
		focus.setFocus(true);
		sfx(scene, 'sfx.ui.move');
	};
	// Keyboard and pad: the first button starts focused (it shows the key that confirms), so a
	// screen never waits for an arrow press. Touch screens keep no focus.
	let frame = 0;
	const autoFocus = () => {
		if (++frame % 10 || !active() || hintMode() === 'touch') return;
		const buttons = all();
		if (focus && buttons.includes(focus)) return;
		focus = start(buttons);
		focus?.setFocus(true);
	};
	scene.events.on('update', autoFocus);
	scene.events.once('shutdown', () => scene.events.off('update', autoFocus));
	onKey(scene.input.keyboard, 'keydown-LEFT', () => active() && move(-1, 0));
	onKey(scene.input.keyboard, 'keydown-RIGHT', () => active() && move(1, 0));
	onKey(scene.input.keyboard, 'keydown-UP', () => active() && move(0, -1));
	onKey(scene.input.keyboard, 'keydown-DOWN', () => active() && move(0, 1));
	onKey(scene.input.keyboard, 'keydown-ENTER', () => {
		if (!active()) return;
		if (focus && all().includes(focus)) focus.click();
		else move(1, 0);
	});
	return {
		reset() {
			focus = null;
			preferred = null;
		},
		prefer(pick) {
			preferred = pick;
		},
	};
}
