import type Phaser from 'phaser';
import { type EndTier, momentMs, TABLE_END } from '../../config/feel-ends';
import { PALETTE, shade } from '../../config/palette';
import { shake, zoomPunch } from '../../core/feel';
import { duckMusic } from '../../core/music';
import { comfort } from '../comfort';
import { clamp01, ease, lerp, type MomentHandle, runMoment } from './moment';

export interface TableEndArgs {
	tier: EndTier;
	/** The end panel, already filled and at its resting place; it is moved in and left there. */
	panel: Phaser.GameObjects.Container;
	/** Centre of the felt. */
	centre: [number, number];
	speed: number;
}

const SPARK_COLORS = [PALETTE.manilha, PALETTE.textLight, PALETTE.cta, PALETTE.good];

/**
 * The end-of-table panel's entrance (docs/game-feel.md §9). A win: the felt warms, rays turn and
 * sparks fall behind a panel that lands with a bounce (more of everything for a boss, most for the
 * Rei do Truco). A loss: the felt sinks into a cold dark and the panel comes down slow and heavy,
 * no sparks. The panel is usable from the first frame; a skip puts it at rest. Draws only.
 */
export function playTableEnd(scene: Phaser.Scene, a: TableEndArgs): MomentHandle {
	const c = TABLE_END[a.tier];
	const [cx, cy] = a.centre;
	const { panel } = a;
	const restY = panel.y;
	const objs: Phaser.GameObjects.GameObject[] = [];
	const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
		objs.push(o);
		return o;
	};
	const real = (ms: number): number => ms / a.speed;

	const dim = add(
		scene.add
			.rectangle(cx, cy, 1600, 1000, c.won ? shade(PALETTE.night, -0.4) : 0x080c14, 1)
			.setDepth(39)
			.setAlpha(0),
	);
	const rays = c.rays
		? add(scene.add.graphics({ x: cx, y: restY }).setDepth(39.5).setAlpha(0))
		: null;
	if (rays)
		for (let i = 0; i < c.rays; i++) {
			const a0 = (i / c.rays) * Math.PI * 2;
			const a1 = a0 + Math.PI / c.rays;
			rays.fillStyle(c.color, 0.16).fillTriangle(
				0,
				0,
				Math.cos(a0) * 440,
				Math.sin(a0) * 440,
				Math.cos(a1) * 440,
				Math.sin(a1) * 440,
			);
		}
	// Deterministic spread: the pattern is the same every time, so a capture is repeatable.
	const sparks = Array.from({ length: c.sparks }, (_, i) => {
		const u = (i * 0.618034) % 1;
		const size = 2 + (i % 3);
		return {
			x: cx + (u - 0.5) * 460,
			delay: ((i * 37) % 100) / 100,
			sway: 6 + (i % 5) * 3,
			speed: 0.7 + ((i * 13) % 10) / 20,
			obj: add(
				scene.add
					.rectangle(0, 0, size, size * 1.4, SPARK_COLORS[i % SPARK_COLORS.length], 1)
					.setDepth(39.8)
					.setAlpha(0),
			),
		};
	});
	const flash =
		c.flash > 0 && !comfort.reduceFlashes
			? add(scene.add.rectangle(cx, cy, 1600, 1000, 0xffffff, 1).setDepth(41).setAlpha(0))
			: null;

	const inStart = c.freezeMs;
	const inEnd = inStart + c.inMs;
	const holdEnd = inEnd + c.holdMs;
	const total = momentMs(c);
	const place = (u: number, k: number, y: number): void => {
		panel
			.setAlpha(clamp01(k * 3))
			.setScale(lerp(c.from, 1, u))
			.setY(y);
	};
	const frame = (t: number): void => {
		const into = clamp01((t - inStart) / c.inMs);
		const out = clamp01((t - holdEnd) / c.outMs);
		dim.setAlpha(c.dim * clamp01(t / (inStart + c.inMs)) * (1 - ease.out(out)));
		// A win bounces on landing; a loss only settles.
		const u = c.won ? ease.back(into) : ease.out(into);
		place(u, into, lerp(restY - c.drop, restY, u));
		rays?.setAlpha(into * (1 - out))
			.setScale(lerp(0.6, 1, ease.out(into)))
			.setRotation(comfort.reduceFlashes ? 0 : t * 0.0004);
		for (const s of sparks) {
			const p = clamp01((t - inStart - s.delay * c.inMs) / ((holdEnd - inStart) * s.speed));
			s.obj
				.setPosition(
					s.x + Math.sin(p * 9 + s.delay * 6) * s.sway,
					lerp(cy - 190, cy + 190, p),
				)
				.setRotation(p * 8)
				.setAlpha(p > 0 && p < 1 ? Math.min(1, p * 6) * (1 - out) : 0);
		}
	};

	duckMusic(scene, c.duck.gain, real(c.duck.ms));
	place(0, 0, restY - c.drop);
	return runMoment(scene, {
		ms: total,
		speed: a.speed,
		frame,
		objs,
		at: [
			{
				ms: inStart + c.inMs * 0.6,
				fn: () => {
					if (flash)
						scene.tweens.add({
							targets: flash,
							alpha: { from: c.flash, to: 0 },
							duration: real(180),
						});
					if (c.shake) shake(scene, real(c.shake.ms), c.shake.intensity);
					if (c.zoom) zoomPunch(scene, c.zoom, real(c.inMs));
				},
			},
		],
		onEnd: () => {
			if (flash) scene.tweens.killTweensOf(flash);
			panel.setAlpha(1).setScale(1).setY(restY);
		},
	});
}
