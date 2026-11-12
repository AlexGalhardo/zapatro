import type Phaser from 'phaser';
import { tex } from '../../art/flat';
import { type TrucoStep, trucoCall } from '../../config/feel-truco';
import { PALETTE, shade, toCss } from '../../config/palette';
import { shake, zoomPunch } from '../../core/feel';
import { duckMusic } from '../../core/music';
import { TEXT_SHADOW, UI_FONT } from '../../ui/font';
import { comfort } from '../comfort';

export interface TrucoCallArgs {
	step: TrucoStep;
	/** The call's name, as shouted ("TRUCO!", "SEIS! (6)"). */
	label: string;
	/** Centre of the felt: where the eye lands. */
	centre: [number, number];
	/** Where the caller sits (their portrait); null for you, who have no painting. */
	from: [number, number] | null;
	/** Painted card of the caller (`charcard.<id>`); null for you. */
	charId: string | null;
	/** Game speed (1, 2, 4): every phase is divided by it. */
	speed: number;
}

export interface TrucoCallHandle {
	/** Resolves when the event ends or is skipped. */
	done: Promise<void>;
	/** Ends it at once (ignored in the first instants, so the click that made the call does not). */
	skip: () => void;
}

const SKIP_GUARD_MS = 150;
const ease = {
	out: (u: number): number => 1 - (1 - u) ** 3,
	back: (u: number): number => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2,
};
const clamp01 = (u: number): number => Math.min(1, Math.max(0, u));
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/**
 * The truco call as an event (docs/game-feel.md §3): the table dims, the caller's painted card
 * slides in from their side, the call name lands on the centre of the felt, then all leaves.
 * Shake and zoom go through `shake()`/`zoomPunch()`, so they follow Settings; with reduced
 * flashes there is no pulse, only movement and steady colour. Draws only; the scene plays the
 * sound and the voice.
 */
export function playTrucoCall(scene: Phaser.Scene, a: TrucoCallArgs): TrucoCallHandle {
	const c = trucoCall(a.step, comfort.reduceFlashes);
	const [cx, cy] = a.centre;
	const total = c.freezeMs + c.inMs + c.holdMs + c.outMs;
	const real = (ms: number): number => ms / a.speed;
	const objs: Phaser.GameObjects.GameObject[] = [];
	const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
		objs.push(o);
		return o;
	};

	const dim = add(
		scene.add
			.rectangle(cx, cy, 1600, 1000, shade(PALETTE.night, -0.5), 1)
			.setDepth(38)
			.setAlpha(0),
	);
	const rays = add(
		scene.add
			.graphics({ x: cx, y: cy + 10 })
			.setDepth(39)
			.setAlpha(0),
	);
	for (let i = 0; i < c.rays; i++) {
		const a0 = (i / c.rays) * Math.PI * 2;
		const a1 = a0 + (Math.PI * 2) / c.rays / 2;
		rays.fillStyle(c.color, 0.12).fillTriangle(
			0,
			0,
			Math.cos(a0) * 420,
			Math.sin(a0) * 420,
			Math.cos(a1) * 420,
			Math.sin(a1) * 420,
		);
	}

	const dir: [number, number] = a.from ? [a.from[0] - cx, a.from[1] - cy] : [0, 0];
	const rest: [number, number] = [cx + dir[0] * 0.42, cy + dir[1] * 0.42];
	const start: [number, number] = [cx + dir[0] * 2.2, cy + dir[1] * 2.2];
	const tilt = dir[0] === 0 ? 0 : Math.sign(dir[0]) * 6;
	const card = a.charId
		? add(
				scene.add
					.image(start[0], start[1], tex(scene, `charcard.${a.charId}`))
					.setDisplaySize((c.card * 3) / 4, c.card)
					.setDepth(40)
					.setAlpha(0)
					.setAngle(tilt),
			)
		: null;

	const cardScale = card?.scaleX ?? 1;

	// You have no painting: your call is the name alone, bigger, rising from your side.
	const size = a.charId ? c.text : c.text * 1.25;
	const textY = cy + 10;
	const label = add(
		scene.add
			.text(cx, textY, a.label, {
				fontFamily: UI_FONT,
				fontSize: `${size}px`,
				fontStyle: '800',
				// Cream over a dark edge of the step's colour: readable on the rays at any step.
				color: toCss(PALETTE.textLight),
				stroke: toCss(shade(c.color, -0.55)),
				strokeThickness: Math.max(4, size / 6),
				shadow: TEXT_SHADOW,
			})
			.setOrigin(0.5)
			.setDepth(41)
			.setAlpha(0),
	);
	const bar = add(scene.add.rectangle(cx, textY + size * 0.72, 10, 3, c.color).setDepth(41));
	bar.setAlpha(0);

	const flash = c.flash
		? add(scene.add.rectangle(cx, cy, 1600, 1000, c.flash.color, 1).setDepth(42).setAlpha(0))
		: null;

	const proxy = { t: 0 };
	const startedAt = performance.now();
	let finished = false;
	let resolve: () => void = () => {};
	const done = new Promise<void>((res) => {
		resolve = res;
	});
	const timers: Phaser.Time.TimerEvent[] = [];

	const end = (): void => {
		if (finished) return;
		finished = true;
		for (const tm of timers) tm.remove(false);
		scene.tweens.killTweensOf(proxy);
		if (flash) scene.tweens.killTweensOf(flash);
		for (const o of objs) o.destroy();
		resolve();
	};

	const frame = (t: number): void => {
		const f = c.freezeMs;
		const inEnd = f + c.inMs;
		const holdEnd = inEnd + c.holdMs;
		const into = clamp01((t - f) / c.inMs);
		const out = clamp01((t - holdEnd) / c.outMs);
		const fade = 1 - out;
		dim.setAlpha(c.dim * clamp01(t / f) * fade);
		if (t < f) return;
		const slide = ease.out(into);
		if (card) {
			const grow = t > inEnd ? lerp(1, 1.05, clamp01((t - inEnd) / c.holdMs)) : 1;
			card.setPosition(lerp(start[0], rest[0], slide), lerp(start[1], rest[1], slide))
				.setScale(cardScale * grow)
				.setAlpha(clamp01(into * 3) * fade);
		}
		rays.setAlpha(into * fade)
			.setScale(lerp(0.5, 1, slide))
			.setRotation(t * 0.0006);
		const pop = lerp(1.7, 1, ease.back(into));
		label.setScale(pop).setAlpha(clamp01(into * 2) * fade);
		if (!a.charId) label.y = textY + lerp(60, 0, slide);
		bar.setAlpha(into * fade).setSize(lerp(10, label.width * 0.9, slide), 3);
	};

	// The pulse and the camera work land together with the call name.
	const land = real(c.freezeMs + c.inMs * 0.5);
	timers.push(
		scene.time.delayedCall(land, () => {
			if (flash && c.flash) {
				scene.tweens.add({
					targets: flash,
					alpha: { from: c.flash.alpha, to: 0 },
					duration: real(c.flash.ms),
				});
			}
			shake(scene, real(c.shake.ms), c.shake.intensity);
			zoomPunch(scene, c.zoom, real(c.inMs + 80));
		}),
	);
	duckMusic(scene, c.duck.gain, real(c.duck.ms));
	scene.tweens.add({
		targets: proxy,
		t: total,
		duration: real(total),
		ease: 'Linear',
		onUpdate: () => frame(proxy.t),
		onComplete: end,
	});

	return {
		done,
		skip: () => {
			if (performance.now() - startedAt >= SKIP_GUARD_MS) end();
		},
	};
}
