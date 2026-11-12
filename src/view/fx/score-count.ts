import Phaser from 'phaser';
import { SCORE_COUNT } from '../../config/feel-score';
import { PALETTE, shade, toCss } from '../../config/palette';
import { DEPTH } from '../../config/ui';
import { sfx } from '../../core/audio';
import { shake, zoomPunch } from '../../core/feel';
import type { SfxKey } from '../../data/sfx';
import type { CountEntry } from '../../logic/score/count-queue';
import { TEXT_SHADOW, UI_FONT } from '../../ui/font';
import { uiPx } from '../../ui/touch';
import { comfort } from '../comfort';

type Pt = readonly [number, number];

/** `sfx()` takes its pitch in cents; the queue carries a playback-rate multiplier. */
const cents = (rate: number): number => 1200 * Math.log2(rate);

export interface ScoreCountArgs {
	queue: readonly CountEntry[];
	/** Game speed (1, 2, 4): every duration is divided by it. */
	speed: number;
	/** The count box (the scene builds it); cells are local to `root`. */
	box: {
		root: Phaser.GameObjects.Container;
		chips: Phaser.GameObjects.Text;
		mult: Phaser.GameObjects.Text;
		total: Phaser.GameObjects.Text;
		popup: Phaser.GameObjects.Text;
		chipsAt: Pt;
		multAt: Pt;
		totalAt: Pt;
		/** Where a step with no icon of its own (a card, the Lance, the bet) flies from. */
		originAt: Pt;
	};
	/** The popup line of a step with a name of its own (`[Name] why · +3 Mult`), else null. */
	label: (e: CountEntry) => { text: string; color: number } | null;
	/** Icon of the trinket or Manha behind a step, in the world: centre and size; null if none. */
	sourceAt: (e: CountEntry) => { at: Pt; size: number } | null;
	/** The scene bumps that icon. */
	pulse: (e: CountEntry) => void;
	/** Mirrors the running numbers outside the box (the sidebar's Chips × Mult). */
	mirror: (chips: number, mult: number) => void;
	totalText: string;
	points: number;
	/** The table goal; undefined in a quick match. */
	goal: number | undefined;
	/** Centre of the goal card's meter, where the total lands (null: no meter on screen). */
	meterAt: Pt | null;
	/** The total has landed: the scene fills the meter over `ms` and bumps the goal card by `scale`. */
	land: (ms: number, scale: number) => void;
	beatText: string;
	/** Centre of the felt. */
	centre: Pt;
	/** Texture key of a small white dot. */
	spark: string;
}

export interface ScoreCountHandle {
	/** Resolves when the count, its landing and any finish are over (or skipped). */
	done: Promise<void>;
	/** Jumps to the final totals; the meter still fills. Ignored in the first instants. */
	skip: () => void;
}

const SKIP_GUARD_MS = 150;
/** Room for the total in the panel (logical px): from the `=` to the right edge. */
const TOTAL_MAX_W = 66;

/**
 * The score count (docs/game-feel.md §8): plays the queue of `buildCountQueue` step by step, the
 * number flying from its source into Chips or Mult with a sound that rises along the count, then
 * the total flies to the goal card. One hand that alone reaches the goal gets a bigger finish.
 * Draws only; it never reads or changes the match. Shake and zoom follow Settings; with reduced
 * flashes there are no rings or burst, only movement and steady colour.
 */
export function playScoreCount(scene: Phaser.Scene, a: ScoreCountArgs): ScoreCountHandle {
	const c = SCORE_COUNT;
	const real = (ms: number): number => ms / a.speed;
	const startedAt = performance.now();
	const live = new Set<Phaser.GameObjects.GameObject>();
	let skipped = false;
	let wake: (() => void) | null = null;

	const sleep = (ms: number): Promise<void> =>
		skipped
			? Promise.resolve()
			: new Promise((res) => {
					const wakeUp = (): void => {
						wake = null;
						timer.remove(false);
						res();
					};
					const timer = scene.time.delayedCall(real(ms), wakeUp);
					wake = wakeUp;
				});

	const own = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
		live.add(o);
		o.once(Phaser.GameObjects.Events.DESTROY, () => live.delete(o));
		return o;
	};
	const world = (p: Pt): Pt => [a.box.root.x + p[0], a.box.root.y + p[1]];
	const font = (px: number, color: number): Phaser.Types.GameObjects.Text.TextStyle => ({
		fontFamily: UI_FONT,
		fontSize: `${uiPx(px)}px`,
		fontStyle: '800',
		color: toCss(color),
		stroke: toCss(PALETTE.night),
		strokeThickness: 3,
		shadow: TEXT_SHADOW,
	});

	const bump = (t: Phaser.GameObjects.Text, to: number): void => {
		scene.tweens.killTweensOf(t);
		t.setScale(to);
		scene.tweens.add({ targets: t, scale: 1, duration: real(110), ease: 'Back.easeOut' });
	};

	const ring = (at: Pt, size: number, color: number, ms: number): void => {
		if (comfort.reduceFlashes) return;
		const g = own(
			scene.add
				.graphics({ x: at[0], y: at[1] })
				.setDepth(DEPTH.score + 1)
				.lineStyle(2, color, 1)
				.strokeCircle(0, 0, size / 2),
		);
		scene.tweens.add({
			targets: g,
			scale: 1.9,
			alpha: 0,
			duration: real(ms),
			onComplete: () => g.destroy(),
		});
	};

	const fly = (text: string, color: number, px: number, from: Pt, to: Pt, ms: number): void => {
		const t = own(
			scene.add
				.text(from[0], from[1], text, font(px, color))
				.setOrigin(0.5)
				.setDepth(DEPTH.score + 1)
				.setScale(1.3),
		);
		scene.tweens.add({
			targets: t,
			x: to[0],
			y: to[1],
			scale: 0.8,
			duration: real(ms),
			ease: 'Cubic.easeIn',
			onComplete: () => t.destroy(),
		});
	};

	const showNumbers = (chips: number, mult: number): void => {
		a.box.chips.setText(`${chips}`);
		a.box.mult.setText(`${mult}`);
		a.mirror(chips, mult);
	};

	const sound = (e: CountEntry): void => {
		const base: SfxKey =
			e.channel === 'xMult'
				? 'sfx.score.xmult'
				: e.channel === 'addMult'
					? 'sfx.score.mult'
					: 'sfx.score.chip';
		if (e.channel === 'money') sfx(scene, 'sfx.money', 1, cents(e.rate));
		else if (e.named && !e.flaw) {
			sfx(scene, 'sfx.manha.trigger', 1, cents(e.rate));
			if (e.channel === 'xMult') sfx(scene, base, 1, cents(e.rate));
		} else sfx(scene, base, 1, cents(e.rate));
	};

	/** A long total shrinks to stay clear of the `=` on its left and the panel's edge. */
	const fitTotal = (text: string): void => {
		const t = a.box.total;
		const base =
			(t.getData('base') as number | undefined) ?? parseFloat(String(t.style.fontSize));
		t.setData('base', base);
		t.setFontSize(base).setText(text);
		if (t.width > TOTAL_MAX_W) t.setFontSize(Math.max(8, (base * TOTAL_MAX_W) / t.width));
	};

	const signed = (n: number): string => `${n > 0 ? '+' : ''}${n}`;

	const playStep = async (e: CountEntry): Promise<void> => {
		const { step } = e;
		showNumbers(e.chips, e.mult);
		const popup = a.box.popup;
		const line = a.label(e);
		if (line) {
			const tone = e.flaw ? PALETTE.bad : PALETTE.good;
			popup
				.setText(line.text)
				.setColor(toCss(line.color))
				.setBackgroundColor(toCss(shade(tone, -0.65)))
				.setVisible(true)
				.setScale(1.2);
			scene.tweens.add({ targets: popup, scale: 1, duration: real(140) });
		} else popup.setVisible(false);
		const src = a.sourceAt(e);
		if (src) {
			a.pulse(e);
			ring(src.at, src.size, e.flaw ? PALETTE.bad : PALETTE.good, 380);
		}
		const from = src ? src.at : world(a.box.originAt);
		const fly1 = Math.min(240, e.ms);
		const hit = c.bump[e.weight];
		const px = c.flyPx[e.weight];
		const gets = (text: string, cell: Pt, t: Phaser.GameObjects.Text): void => {
			const color = e.flaw ? PALETTE.bad : t === a.box.chips ? PALETTE.chips : PALETTE.mult;
			fly(text, color, px, from, world(cell), fly1);
			scene.time.delayedCall(real(fly1), () => {
				if (!skipped) bump(t, e.flaw ? 0.85 : hit);
			});
		};
		if (step.chips !== undefined && step.chips !== 0)
			gets(signed(step.chips), a.box.chipsAt, a.box.chips);
		if (step.addMult !== undefined && step.addMult !== 0)
			gets(signed(step.addMult), a.box.multAt, a.box.mult);
		if (step.xMult !== undefined) {
			gets(`×${step.xMult}`, a.box.multAt, a.box.mult);
			if (!e.flaw) {
				scene.time.delayedCall(real(fly1), () => {
					if (skipped) return;
					ring(world(a.box.multAt), 40, PALETTE.mult, 320);
					shake(scene, real(c.xMultShake.ms), c.xMultShake.intensity);
					zoomPunch(scene, c.xMultZoom, real(180));
				});
			}
		}
		sound(e);
		await sleep(e.ms);
	};

	/** The bigger finish for a hand that alone reaches the goal. */
	const finish = async (): Promise<void> => {
		const b = c.beat;
		const [cx, cy] = a.centre;
		const dim = own(
			scene.add
				.rectangle(cx, cy, 1600, 1000, shade(PALETTE.night, -0.5), 1)
				.setDepth(DEPTH.score - 1)
				.setAlpha(0),
		);
		const rays = own(
			scene.add
				.graphics({ x: a.box.root.x, y: a.box.root.y })
				.setDepth(DEPTH.score - 0.5)
				.setAlpha(0),
		);
		for (let i = 0; i < b.rays; i++) {
			const a0 = (i / b.rays) * Math.PI * 2;
			const a1 = a0 + Math.PI / b.rays;
			rays.fillStyle(PALETTE.manilha, 0.16).fillTriangle(
				0,
				0,
				Math.cos(a0) * 420,
				Math.sin(a0) * 420,
				Math.cos(a1) * 420,
				Math.sin(a1) * 420,
			);
		}
		const label = own(
			scene.add
				.text(cx, a.box.root.y + 72, a.beatText, {
					...font(b.textPx, PALETTE.textLight),
					stroke: toCss(shade(PALETTE.manilha, -0.6)),
					strokeThickness: 5,
					align: 'center',
					wordWrap: { width: 300 },
				})
				.setOrigin(0.5)
				.setDepth(DEPTH.score + 1)
				.setAlpha(0)
				.setScale(1.7),
		);
		const proxy = { t: 0 };
		const total = b.inMs + b.holdMs + b.outMs;
		scene.tweens.add({
			targets: proxy,
			t: total,
			duration: real(total),
			onUpdate: () => {
				const u = Phaser.Math.Clamp(proxy.t / b.inMs, 0, 1);
				const out = Phaser.Math.Clamp((proxy.t - b.inMs - b.holdMs) / b.outMs, 0, 1);
				const fade = 1 - out;
				dim.setAlpha(b.dim * u * fade);
				rays.setAlpha(u * fade).setRotation(proxy.t * 0.0005);
				label.setAlpha(Math.min(1, u * 2) * fade).setScale(1 + 0.7 * (1 - u) ** 3);
			},
		});
		shake(scene, real(b.shake.ms), b.shake.intensity);
		zoomPunch(scene, b.zoom, real(b.inMs + 100));
		if (!comfort.reduceFlashes) {
			scene.add
				.particles(a.box.root.x, a.box.root.y, a.spark, {
					speed: { min: 60, max: 190 },
					lifespan: 700,
					scale: { start: 1.6, end: 0 },
					alpha: { start: 1, end: 0 },
					tint: [PALETTE.manilha, PALETTE.manilhaGlow, PALETTE.textLight],
					blendMode: Phaser.BlendModes.ADD,
					emitting: false,
				})
				.setDepth(DEPTH.score + 1)
				.explode(b.sparks);
		}
		await sleep(total);
		scene.tweens.killTweensOf(proxy);
		dim.destroy();
		rays.destroy();
		label.destroy();
	};

	const run = async (): Promise<void> => {
		const root = a.box.root;
		root.setVisible(true).setScale(0.9);
		scene.tweens.add({ targets: root, scale: 1, duration: real(c.introMs) });
		for (const e of a.queue) {
			if (skipped) break;
			await playStep(e);
		}
		const last = a.queue[a.queue.length - 1];
		if (last) showNumbers(last.chips, last.mult);
		a.box.popup.setVisible(false);
		fitTotal(a.totalText);
		bump(a.box.total, 1.5);
		zoomPunch(scene, 0.02, real(160));
		const beat = a.goal !== undefined && a.points >= a.goal;
		if (beat && !skipped) await finish();
		else await sleep(c.totalHoldMs);
		const share = a.goal ? a.points / a.goal : 0;
		const tier = [...c.hit].reverse().find(([min]) => share >= min) ?? c.hit[0];
		if (a.meterAt && !skipped) {
			const ghost = scene.add
				.text(...world(a.box.totalAt), a.totalText, font(18, PALETTE.manilha))
				.setOrigin(0.5)
				.setDepth(DEPTH.score + 1);
			own(ghost);
			scene.tweens.add({
				targets: ghost,
				x: a.meterAt[0],
				y: a.meterAt[1],
				scale: 0.6,
				duration: real(c.flightMs),
				ease: 'Cubic.easeIn',
				onComplete: () => ghost.destroy(),
			});
			await sleep(c.flightMs);
		}
		const scale = beat ? c.hit[2][1] * 1.2 : tier[1];
		a.land(skipped ? 0 : real(c.meterMs), scale);
		shake(scene, real(160), beat ? c.beat.shake.intensity : tier[2]);
		await sleep(c.meterMs);
		root.setVisible(false);
	};

	let resolve: () => void = () => {};
	const done = new Promise<void>((res) => {
		resolve = res;
	});
	run().finally(() => {
		for (const o of [...live]) o.destroy();
		resolve();
	});

	return {
		done,
		skip: () => {
			if (skipped || performance.now() - startedAt < SKIP_GUARD_MS) return;
			skipped = true;
			wake?.();
		},
	};
}
