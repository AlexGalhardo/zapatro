import type Phaser from 'phaser';
import { canvasTex } from '../../art/flat';
import { PALETTE, toCss } from '../../config/palette';

type Ctx = CanvasRenderingContext2D;

/** Emotion stamps of the seats, drawn by code (docs/game-feel.md §6). */
export const STAMPS = ['star', 'anger', 'drop', 'bang', 'heart', 'question', 'dots'] as const;
export type Stamp = (typeof STAMPS)[number];

const S = 16;

function disc(ctx: Ctx, color: number): void {
	ctx.fillStyle = toCss(PALETTE.panelDark);
	ctx.beginPath();
	ctx.arc(S / 2, S / 2, S / 2 - 0.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.lineWidth = 1;
	ctx.strokeStyle = toCss(color);
	ctx.stroke();
}

function poly(ctx: Ctx, pts: [number, number][]): void {
	ctx.beginPath();
	pts.forEach(([x, y], i) => {
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.closePath();
}

function drawStamp(ctx: Ctx, kind: Stamp): void {
	const c = S / 2;
	if (kind === 'star') {
		disc(ctx, PALETTE.panelBorder);
		ctx.fillStyle = toCss(PALETTE.panelBorder);
		const pts: [number, number][] = [];
		for (let i = 0; i < 10; i++) {
			const r = i % 2 === 0 ? 5.2 : 2.2;
			const a = -Math.PI / 2 + (i * Math.PI) / 5;
			pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r]);
		}
		poly(ctx, pts);
		ctx.fill();
	} else if (kind === 'anger') {
		disc(ctx, PALETTE.truco);
		ctx.strokeStyle = toCss(PALETTE.truco);
		ctx.lineWidth = 1.6;
		for (const [dx, dy] of [
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1],
		] as const) {
			ctx.beginPath();
			ctx.arc(
				c + dx * 2.6,
				c + dy * 2.6,
				2.2,
				dx > 0 ? Math.PI : 0,
				dx > 0 ? Math.PI * 1.5 : Math.PI * 0.5,
			);
			ctx.stroke();
		}
	} else if (kind === 'drop') {
		disc(ctx, PALETTE.textLight);
		ctx.fillStyle = '#8fc4ff';
		ctx.beginPath();
		ctx.moveTo(c, 3.4);
		ctx.quadraticCurveTo(c + 4.6, 8.4, c, 12);
		ctx.quadraticCurveTo(c - 4.6, 8.4, c, 3.4);
		ctx.fill();
	} else if (kind === 'bang') {
		disc(ctx, PALETTE.bad);
		ctx.fillStyle = toCss(PALETTE.textLight);
		poly(ctx, [
			[c - 1.6, 3.4],
			[c + 1.6, 3.4],
			[c + 0.9, 9.6],
			[c - 0.9, 9.6],
		]);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(c, 12, 1.3, 0, Math.PI * 2);
		ctx.fill();
	} else if (kind === 'heart') {
		disc(ctx, 0xe86a8a);
		ctx.fillStyle = '#e86a8a';
		ctx.beginPath();
		ctx.moveTo(c, 11.6);
		ctx.bezierCurveTo(c - 6, 7.4, c - 3.6, 3.2, c, 6);
		ctx.bezierCurveTo(c + 3.6, 3.2, c + 6, 7.4, c, 11.6);
		ctx.fill();
	} else if (kind === 'question') {
		disc(ctx, PALETTE.textLight);
		ctx.strokeStyle = toCss(PALETTE.textLight);
		ctx.lineWidth = 1.6;
		ctx.beginPath();
		ctx.arc(c, 6.6, 2.6, Math.PI * 1.1, Math.PI * 2.4);
		ctx.lineTo(c, 9.4);
		ctx.stroke();
		ctx.fillStyle = toCss(PALETTE.textLight);
		ctx.beginPath();
		ctx.arc(c, 12, 1.1, 0, Math.PI * 2);
		ctx.fill();
	} else {
		disc(ctx, PALETTE.textLight);
		ctx.fillStyle = toCss(PALETTE.textLight);
		for (const x of [4.6, 8, 11.4]) {
			ctx.beginPath();
			ctx.arc(x, 8, 1.2, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

export const stampKey = (kind: Stamp): string => `fx.stamp.${kind}`;

export function stampTex(scene: Phaser.Scene, kind: Stamp): string {
	return canvasTex(scene, stampKey(kind), S, S, (ctx) => drawStamp(ctx, kind), 2);
}

/** A soft round puff of dust. */
export function dustTex(scene: Phaser.Scene): string {
	return canvasTex(scene, 'fx.dust', 16, 16, (ctx) => {
		const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
		g.addColorStop(0, 'rgba(246,238,220,1)');
		g.addColorStop(1, 'rgba(246,238,220,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, 16, 16);
	});
}

/** A thin ring, to be flattened into an ellipse on the felt. */
export function ringTex(scene: Phaser.Scene): string {
	return canvasTex(
		scene,
		'fx.ring',
		48,
		48,
		(ctx) => {
			ctx.strokeStyle = toCss(PALETTE.panelBorder);
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(24, 24, 22, 0, Math.PI * 2);
			ctx.stroke();
		},
		2,
	);
}
