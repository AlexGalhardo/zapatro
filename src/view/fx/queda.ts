import type Phaser from 'phaser';
import { tex } from '../../art/flat';
import { momentMs, QUEDA } from '../../config/feel-ends';
import { PALETTE, shade, toCss } from '../../config/palette';
import { shake, zoomPunch } from '../../core/feel';
import { TEXT_SHADOW, UI_FONT } from '../../ui/font';
import { comfort } from '../comfort';
import { clamp01, ease, lerp, type MomentHandle, runMoment } from './moment';

export interface QuedaArgs {
	/** Who closed the match to 12: your pair or the rivals. */
	team: 'us' | 'them';
	/** "QUEDA!" and the line under it. */
	word: string;
	sub: string;
	/** Painted cards (`charcard.<id>`) of the pair that closed it, nearest first; empty for you alone. */
	chars: string[];
	/** Centre of the felt. */
	centre: [number, number];
	speed: number;
	onLand?: () => void;
}

/** Half the band: the closers' cards sit at its ends, clear of the word and the line. */
const BAND_HALF = 243;
const SUB_W = 230;

/**
 * A queda as a beat (docs/game-feel.md §9). Yours: a gold band, the word slams in from your side
 * with your partner's card beside it. The rivals': a cold red band, the word drops heavy from
 * above and their cards loom from their side, no pulse. Draws only; skippable.
 */
export function playQueda(scene: Phaser.Scene, a: QuedaArgs): MomentHandle {
	const c = QUEDA[a.team];
	const mine = a.team === 'us';
	const [cx, cy] = a.centre;
	const objs: Phaser.GameObjects.GameObject[] = [];
	const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
		objs.push(o);
		return o;
	};
	const real = (ms: number): number => ms / a.speed;
	// Yours come from the left (your side of the table), theirs from the right.
	const dir = mine ? -1 : 1;

	const dim = add(
		scene.add
			.rectangle(cx, cy, 1600, 1000, shade(PALETTE.night, -0.5), 1)
			.setDepth(38)
			.setAlpha(0),
	);
	const bandH = 88;
	const band = add(
		scene.add
			.rectangle(
				cx,
				cy,
				486,
				bandH,
				mine ? shade(c.color, -0.72) : shade(c.color, -0.78),
				0.95,
			)
			.setDepth(39)
			.setScale(0, 1),
	);
	const edges = add(scene.add.graphics().setDepth(39.2).setAlpha(0));
	edges
		.fillStyle(c.color, 1)
		.fillRect(cx - 243, cy - bandH / 2 - 1.5, 486, 3)
		.fillRect(cx - 243, cy + bandH / 2 - 1.5, 486, 3);

	const word = add(
		scene.add
			.text(cx, cy - 8, a.word, {
				fontFamily: UI_FONT,
				fontSize: `${c.word}px`,
				fontStyle: '800',
				color: toCss(PALETTE.textLight),
				stroke: toCss(shade(c.color, -0.55)),
				strokeThickness: Math.max(4, c.word / 6),
				shadow: TEXT_SHADOW,
			})
			.setOrigin(0.5)
			.setDepth(41)
			.setAlpha(0),
	);
	const sub = add(
		scene.add
			.text(cx, cy + 22, a.sub, {
				fontFamily: UI_FONT,
				fontSize: `${c.sub}px`,
				fontStyle: '600',
				color: toCss(mine ? PALETTE.manilha : PALETTE.textLight),
				shadow: TEXT_SHADOW,
				wordWrap: { width: SUB_W },
				align: 'center',
			})
			.setOrigin(0.5)
			.setDepth(41)
			.setAlpha(0),
	);

	const cardH = c.card;
	const cards = a.chars.slice(0, 2).map((id, i) => {
		const x = cx + dir * (BAND_HALF - (cardH * 3) / 8 - 8 - i * 22);
		const img = add(
			scene.add
				.image(x, cy, tex(scene, `charcard.${id}`))
				.setDisplaySize((cardH * 3) / 4, cardH)
				.setDepth(40 - i * 0.1)
				.setAlpha(0)
				.setAngle(dir * -5 * (i + 1)),
		);
		// The rivals loom darker: the beat is theirs, and not a good one for you.
		if (!mine) img.setTint(0xb8b8c8);
		return { img, x, scale: img.scaleX };
	});

	const rays = mine ? add(scene.add.graphics({ x: cx, y: cy }).setDepth(38.5).setAlpha(0)) : null;
	if (rays)
		for (let i = 0; i < 12; i++) {
			const a0 = (i / 12) * Math.PI * 2;
			const a1 = a0 + Math.PI / 12;
			rays.fillStyle(c.color, 0.14).fillTriangle(
				0,
				0,
				Math.cos(a0) * 420,
				Math.sin(a0) * 420,
				Math.cos(a1) * 420,
				Math.sin(a1) * 420,
			);
		}
	const flash =
		c.flash > 0 && !comfort.reduceFlashes
			? add(scene.add.rectangle(cx, cy, 1600, 1000, 0xffffff, 1).setDepth(42).setAlpha(0))
			: null;

	const inStart = c.freezeMs;
	const inEnd = inStart + c.inMs;
	const holdEnd = inEnd + c.holdMs;
	const frame = (t: number): void => {
		const into = clamp01((t - inStart) / c.inMs);
		const out = clamp01((t - holdEnd) / c.outMs);
		const fade = 1 - out;
		dim.setAlpha(c.dim * clamp01(t / (inStart + c.inMs * 0.4)) * fade);
		band.setScale(ease.out(clamp01(into * 1.6)) * (1 - ease.out(out)), 1);
		edges.setAlpha(clamp01(into * 2) * fade);
		rays?.setAlpha(into * fade)
			.setScale(lerp(0.5, 1, ease.out(into)))
			.setRotation(comfort.reduceFlashes ? 0 : t * 0.0006);
		const pop = lerp(1.7, 1, ease.back(into));
		word.setScale(pop).setAlpha(clamp01(into * 2.5) * fade);
		// Yours slams in sideways; theirs drops from above and settles slower.
		if (mine) word.x = cx + lerp(dir * 120, 0, ease.out(into));
		else word.y = cy - 8 + lerp(-50, 0, ease.back(into));
		sub.setAlpha(clamp01((into - 0.4) / 0.6) * fade);
		sub.y = cy + 22 + lerp(6, 0, ease.out(into));
		const grow = t > inEnd ? lerp(1, 1.05, clamp01((t - inEnd) / c.holdMs)) : 1;
		for (const [i, k] of cards.entries())
			k.img
				.setPosition(k.x + dir * lerp(70 * (1 + i * 0.4), 0, ease.out(into)), cy)
				.setScale(k.scale * grow)
				.setAlpha(clamp01(into * 3) * fade);
	};

	return runMoment(scene, {
		ms: momentMs(c),
		speed: a.speed,
		frame,
		objs,
		at: [
			{
				ms: inStart + c.inMs * 0.5,
				fn: () => {
					a.onLand?.();
					if (flash)
						scene.tweens.add({
							targets: flash,
							alpha: { from: c.flash, to: 0 },
							duration: real(140),
						});
					shake(scene, real(c.shake.ms), c.shake.intensity);
					zoomPunch(scene, c.zoom, real(c.inMs + 60));
				},
			},
		],
		onEnd: () => {
			if (flash) scene.tweens.killTweensOf(flash);
		},
	});
}
