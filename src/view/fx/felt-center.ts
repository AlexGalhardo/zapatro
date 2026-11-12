import type Phaser from 'phaser';
import { tex } from '../../art/flat';
import { FELT_CENTER, FELT_FEEL, type FeltCenterLayout } from '../../config/feel-felt';
import { BET_CHIP_COLOR, inkOn, PALETTE, shade, toCss } from '../../config/palette';
import { DEPTH } from '../../config/ui';
import { BETS } from '../../logic/truco/table';
import type { TrickMark } from '../../logic/truco/trick-marks';
import { UI_FONT } from '../../ui/font';
import { uiPx } from '../../ui/touch';
import { comfort } from '../comfort';

/** What the felt's centre shows; the scene derives it from the match and never passes the match. */
export interface FeltCenterData {
	/** The accepted value of the hand. */
	bet: number;
	/** The value of a call waiting for an answer, or null. */
	pending: number | null;
	/** The three trick markers (`trickMarks`). */
	marks: readonly TrickMark[];
	/** The hand is on: the next unplayed trick gets the "now" ring. */
	live: boolean;
	/** The scene's `dur`: milliseconds at 1× into milliseconds at the table's speed. */
	dur: (ms: number) => number;
}

export interface FeltCenter {
	/** Redraws what changed since the last call (cheap enough to call on every HUD refresh). */
	update(data: FeltCenterData): void;
}

/** Index of the bet's step in `BETS` (a value between steps rounds up; past the last, the last). */
const stepOf = (value: number): number => {
	const i = BETS.findIndex((b) => b >= value);
	return i < 0 ? BETS.length - 1 : i;
};

/** One chip seen from above: body, rim and a ring of dots, `r` px wide from its centre. */
function drawChip(g: Phaser.GameObjects.Graphics, y: number, r: number, fill: number): void {
	g.fillStyle(PALETTE.shadow, 0.45).fillCircle(0, y + r * 0.18, r);
	g.fillStyle(fill, 1).fillCircle(0, y, r);
	g.lineStyle(Math.max(1, r * 0.1), shade(fill, -0.45), 1).strokeCircle(0, y, r - 0.5);
	g.fillStyle(shade(fill, 0.7), 1);
	for (let i = 0; i < 8; i++) {
		const a = (i * Math.PI) / 4;
		g.fillCircle(Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, r * 0.11);
	}
	g.lineStyle(Math.max(0.8, r * 0.07), shade(fill, 0.5), 0.9).strokeCircle(0, y, r * 0.62);
}

/** Draws one marker; `now` rings the trick being played. */
function drawPip(g: Phaser.GameObjects.Graphics, mark: TrickMark, now: boolean, s: number): void {
	const h = s / 2;
	g.clear();
	const fill =
		mark === 'won'
			? PALETTE.good
			: mark === 'lost'
				? PALETTE.bad
				: mark === 'tied'
					? PALETTE.textDim
					: PALETTE.panelDark;
	g.fillStyle(PALETTE.shadow, 0.45).fillRoundedRect(-h, -h + s * 0.14, s, s, s * 0.3);
	g.fillStyle(fill, mark === 'open' ? 0.8 : 1).fillRoundedRect(-h, -h, s, s, s * 0.3);
	g.lineStyle(1, now ? PALETTE.manilha : shade(fill, mark === 'open' ? 0.35 : -0.4), 1);
	g.strokeRoundedRect(-h, -h, s, s, s * 0.3);
	if (mark === 'open') return;
	g.lineStyle(Math.max(1.4, s * 0.17), PALETTE.textDark, 1);
	const k = s * 0.22;
	// A check, a cross and an equals sign: the three read without colour (colour-blind players).
	if (mark === 'won')
		g.lineBetween(-k * 1.2, 0, -k * 0.3, k).lineBetween(-k * 0.3, k, k * 1.3, -k);
	else if (mark === 'lost') g.lineBetween(-k, -k, k, k).lineBetween(-k, k, k, -k);
	else
		g.lineBetween(-k * 1.2, -k * 0.55, k * 1.2, -k * 0.55).lineBetween(
			-k * 1.2,
			k * 0.55,
			k * 1.2,
			k * 0.55,
		);
}

/**
 * The centre of the felt: the deck, the bet as a stack of chips (a call waiting for an answer adds
 * ghost chips on top) and the three trick markers. Pure view: it draws what it is given.
 */
export function createFeltCenter(scene: Phaser.Scene, kind: 'table' | 'duel'): FeltCenter {
	const layout: FeltCenterLayout = FELT_CENTER[kind];
	const k = layout.scale;
	const F = FELT_FEEL;

	const deck: Phaser.GameObjects.Image[] = [];
	for (let i = 0; i < F.deckLayers; i++) {
		const back = scene.add
			.image(
				layout.deck.x + (i - F.deckLayers + 1) * F.deckStep,
				layout.deck.y + (i - F.deckLayers + 1) * F.deckStep,
				tex(scene, 'card.back.default'),
			)
			.setScale(F.deckScale)
			.setTint(i === F.deckLayers - 1 ? 0xffffff : shade(0xffffff, -0.25));
		deck.push(back);
	}

	const stack = scene.add.container(layout.chips.x, layout.chips.y).setDepth(DEPTH.table + 0.5);
	const solid = scene.add.graphics();
	const ghost = scene.add.graphics();
	const label = scene.add
		.text(0, 0, '', {
			fontFamily: UI_FONT,
			fontSize: `${Math.round(uiPx(11) * k)}px`,
			fontStyle: '700',
		})
		.setOrigin(0.5);
	stack.add([solid, ghost, label]);
	let pulse: Phaser.Tweens.Tween | null = null;

	const pips = [-1, 0, 1].map((i) => {
		const g = scene.add
			.graphics({
				x: layout.markers.x + i * (F.pip + F.pipGap) * k,
				y: layout.markers.y,
			})
			.setDepth(DEPTH.table + 0.5);
		return g;
	});

	let shown: { bet: number; pending: number | null } | null = null;
	let shownMarks: string = '';
	let lastMarks: readonly TrickMark[] = ['open', 'open', 'open'];

	function drawStack(data: FeltCenterData): void {
		const r = F.chipR * k;
		const step = F.chipStep * k;
		const base = stepOf(data.bet);
		const top = data.pending !== null ? Math.max(base, stepOf(data.pending)) : base;
		solid.clear();
		ghost.clear();
		for (let i = 0; i <= top; i++) {
			const color = BET_CHIP_COLOR[i] ?? PALETTE.manilha;
			drawChip(i <= base ? solid : ghost, -i * step, r, color);
		}
		const pendingOn = data.pending !== null && top > base;
		const value = pendingOn ? (data.pending as number) : data.bet;
		const fill = BET_CHIP_COLOR[top] ?? PALETTE.manilha;
		label
			.setText(pendingOn ? `${value}?` : `${value}`)
			.setColor(toCss(inkOn(fill)))
			.setY(-top * step);
		ghost.setAlpha(F.ghostAlpha);
		pulse?.remove();
		pulse = null;
		if (pendingOn && !comfort.reduceFlashes)
			pulse = scene.tweens.add({
				targets: ghost,
				alpha: { from: F.ghostPulse[0], to: F.ghostPulse[1] },
				duration: data.dur(F.ghostMs),
				yoyo: true,
				repeat: -1,
				ease: 'Sine.easeInOut',
			});
	}

	return {
		update(data) {
			for (const back of deck) back.setTexture(tex(scene, 'card.back.default'));
			if (!shown || shown.bet !== data.bet || shown.pending !== data.pending) {
				const grew = shown !== null && data.bet > shown.bet;
				drawStack(data);
				if (grew) {
					scene.tweens.killTweensOf(stack);
					stack.setScale(F.slamFrom);
					scene.tweens.add({
						targets: stack,
						scale: 1,
						duration: data.dur(F.slamMs),
						ease: 'Back.easeOut',
					});
				}
				shown = { bet: data.bet, pending: data.pending };
			}
			const key = `${data.marks.join()}|${data.live}`;
			if (key === shownMarks) return;
			shownMarks = key;
			const now = data.live ? data.marks.indexOf('open') : -1;
			pips.forEach((g, i) => {
				const mark = data.marks[i] ?? 'open';
				drawPip(g, mark, i === now, F.pip * k);
				if (mark !== 'open' && lastMarks[i] === 'open') {
					scene.tweens.killTweensOf(g);
					g.setScale(F.popFrom);
					scene.tweens.add({
						targets: g,
						scale: 1,
						duration: data.dur(F.popMs),
						ease: 'Back.easeOut',
					});
				}
			});
			lastMarks = data.marks;
		},
	};
}
