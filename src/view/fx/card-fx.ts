import Phaser from 'phaser';
import {
	CARD_FLIGHT,
	DUST,
	SUIT_BOOST,
	TIER_FEEL,
	TRAIL,
	TRICK_SWEEP,
	ZAP_RING,
	ZAP_SHAKE,
} from '../../config/feel-cards';
import { PALETTE } from '../../config/palette';
import { shake } from '../../core/feel';
import { comfort } from '../comfort';
import type { CardWeight } from './card-weight';
import { dustTex, ringTex } from './fx-tex';

/** What an effect needs from the table: the scene and its speed-scaled clock (`dur`). */
export interface FxEnv {
	scene: Phaser.Scene;
	dur(ms: number): number;
}

type Point = [number, number];
type Img = Phaser.GameObjects.Image;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const quadOut = (t: number): number => 1 - (1 - t) * (1 - t);
const quadIn = (t: number): number => t * t;

/** A 0 to 1 counter over `ms`, eased by hand so every effect reads the same progress. */
function run(
	env: FxEnv,
	ms: number,
	ease: (t: number) => number,
	onUpdate: (e: number, raw: number) => void,
): Promise<void> {
	return new Promise((res) => {
		env.scene.tweens.addCounter({
			from: 0,
			to: 1,
			duration: env.dur(ms),
			onUpdate: (tw) => {
				const raw = Number(tw.getValue());
				onUpdate(ease(raw), raw);
			},
			onComplete: () => res(),
		});
	});
}

/**
 * The flight of a played card: lift, a curve with a lean, and for a manilha a trail of ghosts.
 * Resolves when the card has landed; it takes `CARD_FLIGHT.travel` (plus `zapBeat` for the ZAP),
 * the only time the table waits.
 */
export async function flyCard(env: FxEnv, img: Img, to: Point, weight: CardWeight): Promise<void> {
	const { scene } = env;
	const f = TIER_FEEL[weight.tier];
	const base = img.scale;
	const zap = weight.tier === 'zap';
	if (zap) {
		const rise = new Promise<void>((res) => {
			scene.tweens.add({
				targets: img,
				y: img.y - CARD_FLIGHT.zapRise,
				scale: base * (1 + CARD_FLIGHT.zapGrow),
				duration: env.dur(CARD_FLIGHT.zapBeat),
				ease: 'Sine.easeOut',
				onComplete: () => res(),
			});
		});
		await rise;
	}
	const from: Point = [img.x, img.y];
	const dir = to[0] >= from[0] ? 1 : -1;
	const trail = weight.tier === 'manilha' || zap;
	let nextGhost = TRAIL.step;
	await run(env, CARD_FLIGHT.travel, quadOut, (e, raw) => {
		const arc = Math.sin(Math.PI * e);
		img.setPosition(lerp(from[0], to[0], e), lerp(from[1], to[1], e) - arc * f.arc);
		img.setAngle(dir * f.tilt * arc);
		img.setScale(base * (1 + f.lift * arc + (zap ? CARD_FLIGHT.zapGrow * (1 - e) : 0)));
		if (trail && raw >= nextGhost) {
			nextGhost += TRAIL.step;
			ghost(env, img, zap ? PALETTE.panelBorder : PALETTE.manilhaGlow);
		}
	});
	img.setPosition(to[0], to[1]).setAngle(0).setScale(base);
}

/** A fading copy of the card left in the air. Additive glow unless flashes are reduced. */
function ghost(env: FxEnv, img: Img, color: number): void {
	const g = env.scene.add
		.image(img.x, img.y, img.texture.key, img.frame.name)
		.setScale(img.scaleX, img.scaleY)
		.setAngle(img.angle)
		.setDepth(img.depth - 0.05)
		.setTint(color)
		.setAlpha(comfort.reduceFlashes ? TRAIL.alpha * 0.6 : TRAIL.alpha);
	if (!comfort.reduceFlashes) g.setBlendMode(Phaser.BlendModes.ADD);
	env.scene.tweens.add({
		targets: g,
		alpha: 0,
		duration: env.dur(TRAIL.life),
		onComplete: () => g.destroy(),
	});
}

/** The landing: squash, dust, and the ZAP's ring and shake. Nothing here is awaited. */
export function landCard(env: FxEnv, img: Img, weight: CardWeight): void {
	const { scene } = env;
	const f = TIER_FEEL[weight.tier];
	const boost = 1 + SUIT_BOOST * weight.suit;
	const base = img.scale;
	const sq = f.squash * boost;
	img.setScale(base * (1 + sq), base * (1 - sq));
	scene.tweens.add({
		targets: img,
		scaleX: base,
		scaleY: base,
		duration: env.dur(f.squashMs),
		ease: 'Back.easeOut',
	});
	const puffs = Math.round(f.dust * boost);
	const key = puffs > 0 || weight.tier === 'zap' ? dustTex(scene) : '';
	const footY = img.y + img.displayHeight / 2 - 3;
	for (let i = 0; i < puffs; i++) {
		// Spread evenly to both sides, nearest puffs smallest.
		const side = i % 2 === 0 ? -1 : 1;
		const n = Math.floor(i / 2) + 1;
		const reach = f.reach * (0.45 + (0.55 * n) / Math.ceil(puffs / 2));
		const puff = scene.add
			.image(img.x + side * img.displayWidth * 0.3, footY, key)
			.setDepth(img.depth - 0.05)
			.setScale(DUST.size)
			.setAlpha(comfort.reduceFlashes ? DUST.alpha * 0.7 : DUST.alpha);
		scene.tweens.add({
			targets: puff,
			x: puff.x + side * reach,
			y: footY - DUST.rise,
			scale: DUST.size * DUST.grow,
			alpha: 0,
			duration: env.dur(DUST.life),
			ease: 'Quad.easeOut',
			onComplete: () => puff.destroy(),
		});
	}
	if (weight.tier !== 'zap') return;
	shake(scene, env.dur(ZAP_SHAKE.ms), ZAP_SHAKE.intensity);
	const ring = scene.add
		.image(img.x, img.y + img.displayHeight * 0.25, ringTex(scene))
		.setDepth(img.depth - 0.5)
		.setScale(0.3, 0.3 * ZAP_RING.flat)
		.setAlpha(ZAP_RING.alpha);
	scene.tweens.add({
		targets: ring,
		scaleX: ZAP_RING.to,
		scaleY: ZAP_RING.to * ZAP_RING.flat,
		alpha: 0,
		duration: env.dur(ZAP_RING.ms),
		ease: 'Quad.easeOut',
		onComplete: () => ring.destroy(),
	});
}

/**
 * The cards of a trick pile up, then sweep to `to` (the winner's side, or the middle on a tie)
 * and fade at the end. Takes `TRICK_SWEEP.gather + sweep`, the time the collection always had.
 */
export async function collectTrick(env: FxEnv, cards: readonly Img[], to: Point): Promise<void> {
	if (cards.length === 0) return;
	const start = cards.map((c): Point => [c.x, c.y]);
	const base = cards.map((c) => c.scale);
	const pile: Point = [
		start.reduce((s, p) => s + p[0], 0) / cards.length,
		start.reduce((s, p) => s + p[1], 0) / cards.length,
	];
	const spot = (i: number): Point => [pile[0] + i * 2, pile[1] - i * 1.5];
	const turn = (i: number): number => (i % 2 === 0 ? -1 : 1) * TRICK_SWEEP.twist;
	await run(env, TRICK_SWEEP.gather, quadOut, (e) => {
		cards.forEach((c, i) => {
			const s = start[i] as Point;
			const p = spot(i);
			c.setPosition(lerp(s[0], p[0], e), lerp(s[1], p[1], e)).setAngle(turn(i) * e);
		});
	});
	await run(env, TRICK_SWEEP.sweep, quadIn, (e) => {
		const fade = Math.max(0, (e - 0.55) / 0.45);
		cards.forEach((c, i) => {
			const p = spot(i);
			const b = base[i] as number;
			c.setPosition(lerp(p[0], to[0], e), lerp(p[1], to[1], e))
				.setAngle(lerp(turn(i), turn(i) * 2, e))
				.setScale(b * lerp(1, TRICK_SWEEP.shrink, e))
				.setAlpha(1 - fade);
		});
	});
}

/** A tie: the two top cards bump into each other and settle. On top of the hold, not awaited. */
export function tieBump(env: FxEnv, cards: readonly Img[]): void {
	const start = cards.map((c): Point => [c.x, c.y]);
	const mid: Point = [
		start.reduce((s, p) => s + p[0], 0) / Math.max(1, cards.length),
		start.reduce((s, p) => s + p[1], 0) / Math.max(1, cards.length),
	];
	void run(
		env,
		TRICK_SWEEP.bump,
		(t) => t,
		(_e, raw) => {
			const k = Math.sin(Math.PI * raw);
			cards.forEach((c, i) => {
				const s = start[i] as Point;
				const dx = Math.sign(mid[0] - s[0]) * TRICK_SWEEP.bumpPush * k;
				const dy = Math.sign(mid[1] - s[1]) * TRICK_SWEEP.bumpPush * k;
				if (c.active)
					c.setPosition(s[0] + dx, s[1] + dy).setAngle(
						(i % 2 ? 1 : -1) * TRICK_SWEEP.bumpTurn * k,
					);
			});
		},
	);
}
