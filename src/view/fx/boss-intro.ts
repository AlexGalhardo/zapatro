import type Phaser from 'phaser';
import { tex } from '../../art/flat';
import { BOSS_INTRO, momentMs } from '../../config/feel-ends';
import { PALETTE, shade, toCss } from '../../config/palette';
import { shake, zoomPunch } from '../../core/feel';
import { duckMusic } from '../../core/music';
import { TEXT_SHADOW, UI_FONT } from '../../ui/font';
import { comfort } from '../comfort';
import { clamp01, ease, lerp, type MomentHandle, runMoment } from './moment';

export interface BossIntroArgs {
	/** Boss id: its painted card is `charcard.<id>`. */
	boss: string;
	/** The last boss of the run (the Rei do Truco): a step above the others. */
	final: boolean;
	/** "Championship 3 · boss", "Final boss": the small line over the name. */
	kicker: string;
	name: string;
	rule: string;
	/** Centre of the felt. */
	centre: [number, number];
	speed: number;
	/** Plays the arrival sound when the card lands (the scene owns the sounds). */
	onLand?: () => void;
}

const TEXT_W = 200;
const GAP = 14;

/**
 * A boss table's introduction (docs/game-feel.md §9): the table dims, a dark band opens across
 * the felt, the boss's painted card falls in with weight and settles, the name and rule slide in
 * beside it, then all leaves. Draws only; skippable. Shake and zoom go through `shake()` and
 * `zoomPunch()`; with reduced flashes there is no pulse and the rays do not turn.
 */
export function playBossIntro(scene: Phaser.Scene, a: BossIntroArgs): MomentHandle {
	const c = BOSS_INTRO[a.final ? 'final' : 'normal'];
	const [cx, cy] = a.centre;
	const objs: Phaser.GameObjects.GameObject[] = [];
	const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
		objs.push(o);
		return o;
	};
	const real = (ms: number): number => ms / a.speed;

	const dim = add(
		scene.add
			.rectangle(cx, cy, 1600, 1000, shade(PALETTE.night, -0.5), 1)
			.setDepth(38)
			.setAlpha(0),
	);
	const rays = add(scene.add.graphics({ x: cx, y: cy }).setDepth(38.5).setAlpha(0));
	for (let i = 0; i < c.rays; i++) {
		const a0 = (i / c.rays) * Math.PI * 2;
		const a1 = a0 + (Math.PI * 2) / c.rays / 2;
		rays.fillStyle(c.color, 0.14).fillTriangle(
			0,
			0,
			Math.cos(a0) * 460,
			Math.sin(a0) * 460,
			Math.cos(a1) * 460,
			Math.sin(a1) * 460,
		);
	}

	const cardH = c.card;
	const cardW = (cardH * 3) / 4;
	const text = (s: string, size: number, color: number, strong: boolean) =>
		add(
			scene.add
				.text(0, 0, s, {
					fontFamily: UI_FONT,
					fontSize: `${size}px`,
					fontStyle: strong ? '800' : '500',
					color: toCss(color),
					...(strong
						? {
								stroke: toCss(shade(c.color, -0.6)),
								strokeThickness: Math.max(3, size / 6),
							}
						: {}),
					shadow: TEXT_SHADOW,
					wordWrap: { width: TEXT_W },
				})
				.setOrigin(0, 0)
				.setDepth(41)
				.setAlpha(0),
		);
	const kicker = text(a.kicker.toUpperCase(), 8, c.color, false);
	const name = text(a.name, c.name, PALETTE.textLight, true);
	const rule = text(a.rule, c.rule, PALETTE.textLight, false);
	const lines = [kicker, name, rule];
	const gapY = 4;
	const blockH = lines.reduce((h, l) => h + l.height, 0) + gapY * (lines.length - 1);
	const left = cx - (cardW + GAP + TEXT_W) / 2;
	const textX = left + cardW + GAP;
	let y = cy - blockH / 2;
	for (const l of lines) {
		l.setPosition(textX, y);
		y += l.height + gapY;
	}
	const textX0 = lines.map((l) => l.x);

	const bandH = cardH * 0.78;
	const band = add(
		scene.add
			.rectangle(cx, cy, 486, bandH, PALETTE.panelDark, 0.94)
			.setDepth(39)
			.setScale(1, 0),
	);
	const edges = add(scene.add.graphics().setDepth(39.2).setAlpha(0));
	edges
		.fillStyle(c.color, 1)
		.fillRect(cx - 243, cy - bandH / 2 - 1.5, 486, 3)
		.fillRect(cx - 243, cy + bandH / 2 - 1.5, 486, 3);

	const cardX = left + cardW / 2;
	const card = add(
		scene.add
			.image(cardX, cy - c.drop, tex(scene, `charcard.${a.boss}`))
			.setDisplaySize(cardW, cardH)
			.setDepth(40)
			.setAlpha(0)
			.setAngle(-8),
	);
	const scale0 = card.scaleX;
	const flash = comfort.reduceFlashes
		? null
		: add(scene.add.rectangle(cx, cy, 1600, 1000, 0xffffff, 1).setDepth(42).setAlpha(0));

	const total = momentMs(c);
	const inStart = c.freezeMs;
	const inEnd = inStart + c.inMs;
	const holdEnd = inEnd + c.holdMs;
	const frame = (t: number): void => {
		const into = clamp01((t - inStart) / c.inMs);
		const out = clamp01((t - holdEnd) / c.outMs);
		const fade = 1 - out;
		dim.setAlpha(c.dim * clamp01(t / (inStart + c.inMs * 0.4)) * fade);
		rays.setAlpha(into * fade)
			.setScale(lerp(0.5, 1, ease.out(into)))
			.setRotation(comfort.reduceFlashes ? 0 : t * 0.0005);
		band.setScale(1, ease.out(clamp01(into * 2)) * (1 - ease.out(out)));
		edges.setAlpha(clamp01(into * 2) * fade);
		const grow = t > inEnd ? lerp(1, 1.04, clamp01((t - inEnd) / c.holdMs)) : 1;
		card.setPosition(cardX, lerp(cy - c.drop, cy, ease.back(into)) - out * 10)
			.setAngle(lerp(-8, 0, ease.out(into)))
			.setScale(scale0 * grow)
			.setAlpha(clamp01(into * 4) * fade);
		const slide = ease.out(clamp01((into - 0.3) / 0.7));
		lines.forEach((l, i) => {
			l.setX((textX0[i] ?? 0) + lerp(40, 0, slide) - out * 14).setAlpha(slide * fade);
		});
	};

	duckMusic(scene, c.duck.gain, real(c.duck.ms));
	return runMoment(scene, {
		ms: total,
		speed: a.speed,
		frame,
		objs,
		at: [
			{
				ms: inStart + c.inMs * 0.55,
				fn: () => {
					a.onLand?.();
					if (flash)
						scene.tweens.add({
							targets: flash,
							alpha: { from: c.flash, to: 0 },
							duration: real(160),
						});
					shake(scene, real(c.shake.ms), c.shake.intensity);
					zoomPunch(scene, c.zoom, real(c.inMs + 80));
				},
			},
		],
		onEnd: () => {
			if (flash) scene.tweens.killTweensOf(flash);
		},
	});
}
