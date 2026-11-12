import type Phaser from 'phaser';

export interface MomentHandle {
	/** Resolves when the moment ends or is skipped. */
	done: Promise<void>;
	/** Ends it at once (ignored in the first instants, so the click that started it does not). */
	skip: () => void;
}

export interface MomentArgs {
	/** Length at 1× (ms) and the game speed that divides it. */
	ms: number;
	speed: number;
	/** Drawn each tick with the time at 1× (so the phases read the same at any speed). */
	frame: (t: number) => void;
	/** Destroyed at the end. */
	objs: Phaser.GameObjects.GameObject[];
	/** Things that land at a time at 1× (shake, flash, sound). */
	at?: readonly { ms: number; fn: () => void }[];
	/** Runs when it ends or is skipped, before `done` resolves (leave the final state here). */
	onEnd?: () => void;
}

const SKIP_GUARD_MS = 150;

/**
 * The shared shell of an authored moment (docs/game-feel.md §9): one tween walks a clock at 1×
 * time, the content draws from it, and a skip jumps to the end. Draws only; the scene owns the
 * sound and the state.
 */
export function runMoment(scene: Phaser.Scene, a: MomentArgs): MomentHandle {
	const proxy = { t: 0 };
	const startedAt = performance.now();
	const timers: Phaser.Time.TimerEvent[] = [];
	let finished = false;
	let resolve: () => void = () => {};
	const done = new Promise<void>((res) => {
		resolve = res;
	});
	const end = (): void => {
		if (finished) return;
		finished = true;
		for (const tm of timers) tm.remove(false);
		scene.tweens.killTweensOf(proxy);
		a.onEnd?.();
		for (const o of a.objs) o.destroy();
		resolve();
	};
	for (const e of a.at ?? [])
		timers.push(scene.time.delayedCall(e.ms / a.speed, () => !finished && e.fn()));
	scene.tweens.add({
		targets: proxy,
		t: a.ms,
		duration: a.ms / a.speed,
		ease: 'Linear',
		onUpdate: () => a.frame(proxy.t),
		onComplete: end,
	});
	return {
		done,
		skip: () => {
			if (performance.now() - startedAt >= SKIP_GUARD_MS) end();
		},
	};
}

export const clamp01 = (u: number): number => Math.min(1, Math.max(0, u));
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
export const ease = {
	out: (u: number): number => 1 - (1 - u) ** 3,
	back: (u: number): number => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2,
};
