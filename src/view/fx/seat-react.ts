import type Phaser from 'phaser';
import { REACTION_FEEL, REACTION_OF, type Reaction, STAMP, STRONG } from '../../config/feel-seats';
import type { Expression } from '../../data/characters';
import { stampTex } from './fx-tex';
import { breathOffset, reactionOffset } from './seat-pose';

type Img = Phaser.GameObjects.Image;

interface Seated {
	portrait: Img;
	rest: { x: number; y: number; sx: number; sy: number };
	stampAt: [number, number];
	stamp: Img | null;
	run: { t0: number; ms: number; kind: Reaction; amp: number } | null;
	tint: number | null;
}

const bell = (p: number): number => Math.sin(Math.PI * p);

const lerpColor = (to: number, k: number): number => {
	const ch = (shift: number): number => Math.round(255 + (((to >> shift) & 255) - 255) * k);
	return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/**
 * The seats' characters at rest and in reaction. One writer per portrait: every frame the pose is
 * the rest pose plus the breath plus the running reaction, so the two never fight over the card.
 * It only animates what it is handed; it never reads or changes the match.
 */
export class SeatMotion {
	private readonly seats = new Map<number, Seated>();

	constructor(
		private readonly scene: Phaser.Scene,
		/** Seat whose turn it is (undefined between turns). */
		private readonly actor: () => number | null | undefined,
		private readonly dur: (ms: number) => number,
		private readonly reduced: () => boolean = () => false,
	) {
		const tick = (time: number): void => this.update(time);
		scene.events.on('update', tick);
		scene.events.once('shutdown', () => scene.events.off('update', tick));
	}

	/** Registers a seat's portrait at its rest pose, and where its stamp sits (inside the card, clear of bubbles and plate). */
	add(seat: number, portrait: Img, stampAt: [number, number]): void {
		this.seats.set(seat, {
			portrait,
			rest: { x: portrait.x, y: portrait.y, sx: portrait.scaleX, sy: portrait.scaleY },
			stampAt,
			stamp: null,
			run: null,
			tint: null,
		});
	}

	react(seat: number, expr: Expression, strong = false): void {
		const s = this.seats.get(seat);
		if (!s) return;
		const kind = REACTION_OF[expr];
		const feel = REACTION_FEEL[kind];
		s.run = {
			t0: this.scene.time.now,
			ms: this.dur(feel.ms * (strong ? STRONG.ms : 1)),
			kind,
			amp: feel.amp * (strong ? STRONG.amp : 1),
		};
		if (feel.stamp) {
			s.stamp ??= this.scene.add
				.image(0, 0, stampTex(this.scene, feel.stamp))
				.setVisible(false);
			s.stamp.setTexture(stampTex(this.scene, feel.stamp)).setDepth(19.5);
		}
	}

	private update(time: number): void {
		const turn = this.actor();
		for (const [seat, s] of this.seats) {
			if (!s.portrait.active) continue;
			const breath = breathOffset(time, seat, turn === seat);
			let off = breath;
			let tint: number | null = null;
			let stamp = false;
			if (s.run) {
				const p = (time - s.run.t0) / s.run.ms;
				if (p >= 1) s.run = null;
				else {
					const r = reactionOffset(s.run.kind, p, s.run.amp);
					off = {
						dx: r.dx + breath.dx,
						dy: r.dy + breath.dy,
						rot: r.rot,
						sx: r.sx + breath.sx,
						sy: r.sy + breath.sy,
					};
					const feel = REACTION_FEEL[s.run.kind];
					if (feel.wash !== null) tint = lerpColor(feel.wash, bell(p));
					stamp = feel.stamp !== null;
					if (stamp && s.stamp) this.drawStamp(s, p);
				}
			}
			if (!stamp && s.stamp?.visible) s.stamp.setVisible(false);
			s.portrait
				.setPosition(s.rest.x + off.dx, s.rest.y + off.dy)
				.setAngle(off.rot)
				.setScale(s.rest.sx * (1 + off.sx), s.rest.sy * (1 + off.sy));
			if (tint !== s.tint) {
				if (tint === null) s.portrait.clearTint();
				else s.portrait.setTint(tint);
				s.tint = tint;
			}
		}
	}

	/** Pops in with a little overshoot, floats up, fades out. With reduced flashes it does not pop. */
	private drawStamp(s: Seated, p: number): void {
		const img = s.stamp as Img;
		const pop = Math.min(1, p / STAMP.popIn);
		const over = this.reduced() ? pop : 1 + 0.35 * Math.sin(Math.PI * pop) * (1 - pop);
		const out = p > STAMP.fadeFrom ? 1 - (p - STAMP.fadeFrom) / (1 - STAMP.fadeFrom) : 1;
		img.setVisible(true)
			.setPosition(s.stampAt[0], s.stampAt[1] - 2 * p)
			.setScale(STAMP.scale * pop * over)
			.setAlpha(out);
	}
}
