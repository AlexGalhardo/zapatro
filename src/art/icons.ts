import { PALETTE, toCss } from '../config/palette';
import type { Sign } from '../logic/truco/table';
import { UI_FONT } from '../ui/font';

type Ctx = CanvasRenderingContext2D;

/** Icons that have no pixel-art bitmap (scripts/icons.ts): simple flat shapes. */
export const VECTOR_ICONS = [
	'list',
	'cart',
	'swords',
	'doc',
	'refresh',
	'next',
	'close',
	'gamepad',
	'monitor',
	'upload',
	'download',
	'check',
	'hand',
	'note',
	'sparkle',
	'pause',
	'alert',
	'back2',
	'mute',
	'cards',
	'megaphone',
	'calc',
	'people',
] as const;
export type VectorIcon = (typeof VECTOR_ICONS)[number];

const TAU = Math.PI * 2;

/** Draws `name` in the box (0,0)–(s,s) in `color` (cream by default). */
export function drawVectorIcon(
	ctx: Ctx,
	name: string,
	s: number,
	color: number = PALETTE.textLight,
): void {
	ctx.save();
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.fillStyle = toCss(color);
	ctx.strokeStyle = toCss(color);
	ctx.scale(s / 24, s / 24);
	ctx.lineWidth = 2.4;
	const ink = (c: number): void => {
		ctx.fillStyle = toCss(c);
		ctx.strokeStyle = toCss(c);
	};
	const line = (...p: number[]): void => {
		ctx.beginPath();
		ctx.moveTo(p[0] ?? 0, p[1] ?? 0);
		for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] ?? 0, p[i + 1] ?? 0);
		ctx.stroke();
	};
	const dot = (x: number, y: number, r: number): void => {
		ctx.beginPath();
		ctx.arc(x, y, r, 0, TAU);
		ctx.fill();
	};
	const rr = (x: number, y: number, w: number, h: number, r: number, fill = true): void => {
		ctx.beginPath();
		ctx.roundRect(x, y, w, h, r);
		if (fill) ctx.fill();
		else ctx.stroke();
	};
	const poly = (...p: number[]): void => {
		ctx.beginPath();
		ctx.moveTo(p[0] ?? 0, p[1] ?? 0);
		for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] ?? 0, p[i + 1] ?? 0);
		ctx.closePath();
		ctx.fill();
	};
	switch (name) {
		case 'list':
			for (const y of [6, 12, 18]) {
				dot(4, y, 1.6);
				line(8, y, 21, y);
			}
			break;
		case 'cart':
			line(2, 4, 5, 4, 8, 15, 19, 15, 21, 7, 6, 7);
			dot(10, 19.5, 2);
			dot(18, 19.5, 2);
			break;
		case 'swords':
			line(5, 5, 19, 19);
			line(19, 5, 5, 19);
			line(3, 9, 9, 3);
			line(15, 3, 21, 9);
			break;
		case 'doc':
			rr(5, 2, 14, 20, 2, false);
			for (const y of [8, 12, 16]) line(8, y, 16, y);
			break;
		case 'refresh':
			ctx.beginPath();
			ctx.arc(12, 12, 8, 0.3, Math.PI * 1.2);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(12, 12, 8, Math.PI * 1.3, Math.PI * 2.2);
			ctx.stroke();
			poly(19, 3, 21, 10, 14, 9);
			poly(5, 21, 3, 14, 10, 15);
			break;
		case 'next':
			line(3, 12, 20, 12);
			line(13, 5, 20, 12, 13, 19);
			break;
		case 'back2':
			line(5, 8, 17, 8, 21, 11, 21, 15, 17, 18, 6, 18);
			line(9, 3, 4, 8, 9, 13);
			break;
		case 'close':
			ctx.lineWidth = 3.4;
			line(5, 5, 19, 19);
			line(19, 5, 5, 19);
			break;
		case 'gamepad':
			rr(2, 7, 20, 12, 5);
			ink(PALETTE.panelDark);
			ctx.fillRect(6, 11, 6, 2);
			ctx.fillRect(8, 9, 2, 6);
			dot(16, 11, 1.4);
			dot(19, 14, 1.4);
			break;
		case 'monitor':
			rr(2, 3, 20, 14, 2, false);
			line(8, 21, 16, 21);
			line(12, 17, 12, 21);
			break;
		case 'upload':
			line(12, 16, 12, 4);
			line(6, 10, 12, 4, 18, 10);
			line(4, 16, 4, 20, 20, 20, 20, 16);
			break;
		case 'download':
			line(12, 4, 12, 16);
			line(6, 10, 12, 16, 18, 10);
			line(4, 16, 4, 20, 20, 20, 20, 16);
			break;
		case 'check':
			ink(PALETTE.good);
			ctx.lineWidth = 4;
			line(4, 13, 10, 19, 21, 5);
			break;
		case 'hand':
			ink(PALETTE.manilha);
			rr(6, 9, 13, 12, 4);
			for (const x of [7.5, 11, 14.5, 18]) rr(x - 1.5, 2 + Math.abs(x - 12) / 3, 3, 10, 1.5);
			break;
		case 'note':
			line(9, 18, 9, 4, 19, 2, 19, 16);
			dot(6.5, 18, 3);
			dot(16.5, 16, 3);
			break;
		case 'sparkle':
			for (const [x, y, r] of [
				[10, 12, 7],
				[19, 5, 3.5],
				[18, 19, 3],
			] as const) {
				const k = r * 0.28;
				poly(
					x,
					y - r,
					x + k,
					y - k,
					x + r,
					y,
					x + k,
					y + k,
					x,
					y + r,
					x - k,
					y + k,
					x - r,
					y,
					x - k,
					y - k,
				);
			}
			break;
		case 'pause':
			rr(5, 3, 5, 18, 1.5);
			rr(14, 3, 5, 18, 1.5);
			break;
		case 'alert':
			ink(PALETTE.truco);
			rr(2, 2, 20, 15, 4);
			poly(6, 15, 5, 22, 12, 15);
			ink(PALETTE.textLight);
			rr(10.8, 5, 2.4, 6, 1);
			dot(12, 13.5, 1.3);
			break;
		case 'mute':
			poly(3, 9, 8, 9, 13, 4, 13, 20, 8, 15, 3, 15);
			break;
		case 'cards':
			rr(3, 4, 10, 15, 2);
			ink(PALETTE.cardFace);
			ctx.translate(15, 12);
			ctx.rotate(0.25);
			rr(-5, -8, 10, 15, 2);
			break;
		case 'megaphone':
			poly(3, 9, 10, 9, 19, 4, 19, 20, 10, 15, 3, 15);
			break;
		case 'calc':
			rr(5, 2, 14, 20, 2);
			ink(PALETTE.panelDark);
			rr(7.5, 4.5, 9, 4, 1);
			for (const y of [12, 15.5, 19])
				for (const x of [8, 12, 16]) ctx.fillRect(x - 1, y - 1, 2, 2);
			break;
		case 'people':
			dot(9, 8, 3.4);
			dot(17, 8.5, 2.8);
			rr(3, 13, 12, 8, 4);
			rr(15, 13, 7, 7, 3.5);
			break;
	}
	ctx.restore();
}

/**
 * The secret signals (D-35) as one icon each, the same in the picker, the manual and the table:
 * a plain face with only its gesture (SVG paths on a 20×20 face box) and a badge with the card it
 * means, so the table can be learned by heart. `tongue` is filled red, `tooth` filled cream.
 */
export const SIGNAL_ICON: Record<
	Sign,
	{ gesture: string; tongue?: string; tooth?: string; badge: string; red?: boolean }
> = {
	zap: {
		gesture: 'M7 8.6v.1 M11 9.2q2-1.8 4 0 M6.5 12.5q3.5 3 7 0',
		badge: '♣',
	},
	copas: {
		gesture: 'M7 9.4v.1 M13 9.4v.1 M5.2 6.8h3.4 M11.2 5.6q1.8-2 3.7-.6 M7.5 13.5h5',
		badge: '♥',
		red: true,
	},
	espadilha: {
		gesture: 'M7 9v.1 M13 9v.1 M6.5 13.8l3-.2q2.5-.4 4.5-2.2',
		badge: '♠',
	},
	picafumo: {
		gesture: 'M7 9v.1 M13 9v.1 M6.8 12.6h6.4',
		tongue: 'M8.4 12.6h3.2v2q-1.6 2-3.2 0z',
		badge: '♦',
		red: true,
	},
	three: {
		gesture: 'M7 9v.1 M13 9v.1 M6.8 13.2q3.2-1.6 6.4 0',
		tooth: 'M8.8 11.9h2.4v2.2h-2.4z',
		badge: '3',
	},
	nothing: {
		gesture: 'M7 7.6v.1 M13 7.6v.1 M8 13.5h4',
		badge: '∅',
	},
};

/** Draws a signal's icon in the box (0,0)–(s,s): `icon.signal.<sign>` (and the picker's `ui.sign.<sign>`). */
export function drawSignalIcon(ctx: Ctx, sign: string, s: number): void {
	const look = SIGNAL_ICON[sign as Sign];
	if (!look) return;
	const ink = toCss(PALETTE.textDark);
	ctx.save();
	ctx.scale(s / 24, s / 24);
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.lineWidth = 1.6;
	ctx.strokeStyle = ink;
	ctx.beginPath();
	ctx.arc(10, 10, 8.6, 0, TAU);
	ctx.fillStyle = toCss(PALETTE.manilha);
	ctx.fill();
	ctx.stroke();
	if (look.tongue) {
		const tongue = new Path2D(look.tongue);
		ctx.fillStyle = toCss(PALETTE.suitRed);
		ctx.fill(tongue);
		ctx.stroke(tongue);
	}
	ctx.lineWidth = 2;
	ctx.stroke(new Path2D(look.gesture));
	if (look.tooth) {
		const tooth = new Path2D(look.tooth);
		ctx.lineWidth = 1.2;
		ctx.fillStyle = toCss(PALETTE.cardFace);
		ctx.fill(tooth);
		ctx.stroke(tooth);
	}
	// The badge: the card the gesture means, on a cream disc at the corner.
	ctx.lineWidth = 1.2;
	ctx.beginPath();
	ctx.arc(18.5, 18.5, 5.3, 0, TAU);
	ctx.fillStyle = toCss(PALETTE.cardFace);
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = toCss(look.red ? PALETTE.suitRed : PALETTE.textDark);
	ctx.font = `700 8px ${UI_FONT}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(look.badge, 18.5, 19);
	ctx.restore();
}
