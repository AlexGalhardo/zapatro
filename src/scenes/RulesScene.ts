import Phaser from 'phaser';
import { tex } from '../art/flat';
import { LOGICAL_H } from '../config/constants';
import { TRINKETS } from '../config/features';
import { PALETTE, shade } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS } from '../config/ui';
import { SIGNAL_EMOJI } from '../data/characters';
import { type I18nKey, t } from '../i18n';
import { sentenceLines } from '../logic/sentences';
import { SIGNS } from '../logic/truco/table';
import { Button } from '../ui/Button';
import { EMOJI_FONT, TEXT_SHADOW } from '../ui/font';
import { keyHint } from '../ui/key-hint';
import { onKey } from '../ui/keys';
import { drawPanel } from '../ui/panel';
import { fadeTo, setupScreen, text } from '../ui/screen';
import { screenTitle } from '../ui/title';
import { uiPx } from '../ui/touch';
import { fitCamera } from '../view/stage';

/** The page column: left edge and wrap width of the body text (stage px). */
const BODY_X = 190;
const BODY_W = 420;
/** Right edge of the page list (the dark column on the left). */
const PAGE_X = 172;
/** Font sizes of the book (25% over the old 7/8/9/24): body, page list, page buttons, page title. */
const FONT = { body: 9, list: 10, nav: 11, page: 30 } as const;

/** The pages, in order: text only (one sentence per line); Signals also lists the gestures. */
const PAGES = [
	'teams',
	'strength',
	'manilha',
	'joker',
	'tricks',
	'truco',
	'signals',
	'score',
	'lances',
	TRINKETS ? 'trinkets' : 'manhas',
	'eleven',
	'run',
] as const;

/**
 * Rules book (PLAN A6.2): one page per topic with real cards, portraits and the scoring numbers
 * taken from `src/data`, so the examples never drift from the game. ←/→ turn pages, Esc leaves.
 */
export class RulesScene extends Phaser.Scene {
	private page = 0;
	/** Scene to resume when the manual was opened over it (the table); else back to the menu. */
	private returnTo: string | null = null;
	private art!: Phaser.GameObjects.Container;
	private ui!: Phaser.GameObjects.Container;
	/** Rebuilds the page list (the current page is highlighted). */
	private relist: (() => void) | null = null;
	private subtitle!: Phaser.GameObjects.Text;
	private body!: Phaser.GameObjects.Text;
	private counter!: Phaser.GameObjects.Text;
	/** The page text's room (top, bottom) and how far it is scrolled. */
	private pageTop = 0;
	private pageBottom = 0;
	private scroll = 0;
	private scrollBar!: Phaser.GameObjects.Graphics;

	constructor() {
		super('Rules');
	}

	init(data: { returnTo?: string }): void {
		this.returnTo = data?.returnTo ?? null;
	}

	create(): void {
		this.page = 0;
		this.ui = this.add.container(0, 0);
		this.art = this.add.container(0, 0);
		this.subtitle = this.add
			.text(0, 0, '', {
				...text(11, PALETTE.manilha),
				fontSize: `${uiPx(FONT.page)}px`,
				shadow: { ...TEXT_SHADOW, offsetX: -2, offsetY: 3 },
			})
			.setOrigin(0, 0.5);
		this.body = this.add.text(0, 0, '', {
			...text(FONT.body, PALETTE.textLight, BODY_W),
			align: 'left',
			shadow: undefined,
		});
		this.counter = this.add.text(0, 0, '', text(FONT.body, PALETTE.textDim)).setOrigin(0.5);
		this.scrollBar = this.add.graphics();
		// A page longer than its room scrolls: wheel, ↑/↓, or a drag on touch screens.
		const wheel = (_p: unknown, _o: unknown, _dx: number, dy: number): void =>
			this.scrollBy(dy * 0.3);
		this.input.on('wheel', wheel);
		const drag = (p: Phaser.Input.Pointer): void => {
			if (p.isDown) this.scrollBy(p.prevPosition.y - p.y);
		};
		this.input.on('pointermove', drag);
		this.events.once('shutdown', () => {
			this.input.off('wheel', wheel);
			this.input.off('pointermove', drag);
		});
		onKey(this.input.keyboard, 'keydown-UP', () => this.scrollBy(-24));
		onKey(this.input.keyboard, 'keydown-DOWN', () => this.scrollBy(24));
		const back = (): void => {
			if (!this.returnTo) {
				fadeTo(this, 'Menu');
				return;
			}
			this.scene.stop();
			this.scene.resume(this.returnTo);
		};
		onKey(this.input.keyboard, 'keydown-LEFT', () => this.turn(-1));
		onKey(this.input.keyboard, 'keydown-RIGHT', () => this.turn(1));
		onKey(this.input.keyboard, 'keydown-ENTER', () => this.turn(1));
		onKey(this.input.keyboard, 'keydown-ESC', back);
		// F1 opens the manual from the table; again closes it (and keeps the browser's help away).
		onKey(this.input.keyboard, 'keydown-F1', (e) => {
			e.preventDefault();
			back();
		});
		const heading = setupScreen(this, t('rules.title'), (view) => {
			// The book is the 640×360 stage scaled to fit and centred, like the other screens.
			fitCamera(this.cameras.main, view);
			this.layout(320, LOGICAL_H, back);
		});
		heading.setVisible(false);
		this.show();
	}

	/** screen-guide.png: a framed book with the page list on the left and the page on the right. */
	private layout(cx: number, height: number, back: () => void): void {
		const L = cx - 320;
		this.ui.removeAll(true);
		const g = this.add.graphics();
		drawPanel(g, L + 8, 6, 624, height - 12, { radius: RADIUS.frame, shadow: 4 });
		g.lineStyle(2, shade(PALETTE.panel, -0.3), 1).strokeRoundedRect(
			L + 8,
			6,
			624,
			height - 12,
			RADIUS.frame,
		);
		g.fillStyle(PALETTE.panelDark, 1).fillRoundedRect(L + 12, 10, 160, height - 20, {
			tl: RADIUS.panel,
			bl: RADIUS.panel,
			tr: 0,
			br: 0,
		});
		this.ui.add(g);
		t; // Title over the page list, centred on it (icon and text as a pair).
		const head = screenTitle(this, L + 92, t('rules.title'), 'book', 30);
		this.ui.add([head.icon, head.title]);
		// The page list fills its dark column under the title: one inner padding on every side,
		// the list gap between buttons, every button the same height.
		const col = { left: L + 12, w: 160, top: 50, bottom: height - 10 - PAD.card };
		const bh = (col.bottom - col.top - (PAGES.length - 1) * GAP.list) / PAGES.length;
		PAGES.forEach((pg, i) => {
			const on = i === this.page;
			const b = new Button(
				this,
				`${i + 1}. ${t(`rules.${pg}.title` as I18nKey)}`,
				() => {
					this.page = i;
					this.show();
				},
				{
					w: col.w - 2 * PAD.card,
					h: bh,
					size: FONT.list,
					color: on ? PALETTE.manilha : PALETTE.panel,
					left: 8,
				},
			);
			b.setPosition(col.left + col.w / 2, col.top + bh / 2 + i * (bh + GAP.list));
			this.ui.add(b);
		});
		const close = new Button(this, '', back, { w: 26, h: 24 });
		close.setPosition(L + 612, 26);
		this.ui.add(close);
		this.ui.add(this.add.image(L + 612, 25, tex(this, 'icon.close')).setScale(0.7));
		// Page buttons sit a panel padding above the frame's bottom edge (height - 6).
		const y = height - 6 - PAD.panel - BUTTON_H.action / 2;
		const prev = new Button(this, `◀ ${t('rules.prev')}`, () => this.turn(-1), {
			w: 96,
			h: BUTTON_H.action,
			size: FONT.nav,
			hint: () => keyHint('ArrowLeft'),
		});
		const next = new Button(this, `${t('rules.next')} ▶`, () => this.turn(1), {
			w: 96,
			h: BUTTON_H.action,
			size: FONT.nav,
			color: PALETTE.good,
			hint: () => keyHint('ArrowRight'),
		});
		prev.setPosition(L + 262, y);
		next.setPosition(L + 540, y);
		this.counter.setPosition(L + 401, y);
		this.ui.add([prev, next]);
		this.subtitle.setPosition(L + BODY_X, 36);
		// The illustration is centred over the text column; show() stacks it under the title.
		this.art.setPosition(L + BODY_X + BODY_W / 2, 28).setScale(0.86);
		this.body.setPosition(L + BODY_X, 168);
		// The text scrolls between the page title (or the signal list) and the page buttons.
		this.pageBottom = y - BUTTON_H.action / 2 - GAP.panel;
		this.relist = () => this.layout(cx, height, back);
	}

	private turn(d: number): void {
		const n = Phaser.Math.Clamp(this.page + d, 0, PAGES.length - 1);
		if (n === this.page) return;
		this.page = n;
		this.show();
	}

	private show(): void {
		const p = PAGES[this.page];
		if (!p) return;
		this.art.removeAll(true);
		this.subtitle.setText(`${this.page + 1}. ${t(`rules.${p}.title` as I18nKey)}`);
		this.body.setText(sentenceLines(t(`rules.${p}.body` as I18nKey)));
		this.counter.setText(`${this.page + 1} / ${PAGES.length}`);
		// Text only, one sentence per line; the signals page keeps its gestures to learn by heart.
		if (p === 'signals') this.signals(this.art);
		this.relist?.();
		// Title, (signal list) and text stack top to bottom, a panel gap apart, on every page.
		this.art.setY(0);
		const hasArt = this.art.length > 0;
		if (hasArt)
			this.art.setY(this.subtitle.getBounds().bottom + GAP.panel - this.art.getBounds().top);
		this.pageTop =
			(hasArt ? this.art.getBounds().bottom : this.subtitle.getBounds().bottom) + GAP.panel;
		this.scroll = 0;
		this.scrollBy(0);
		// Centred on the text column by its drawn bounds, kept off the page list and the frame.
		const L = this.body.x - BODY_X;
		const page = { left: L + PAGE_X + GAP.card, right: L + 632 - GAP.card };
		const art = this.art.getBounds();
		let dx = this.body.x + BODY_W / 2 - art.centerX;
		dx = Math.max(page.left - art.left, Math.min(page.right - art.right, dx));
		this.art.x += Math.round(dx);
	}

	/**
	 * Moves the page text by `dy` within its room (crop + offset), with a thin bar on the right
	 * when it is longer than the room; a short page stays put.
	 */
	private scrollBy(dy: number): void {
		const room = Math.max(0, this.pageBottom - this.pageTop);
		const max = Math.max(0, this.body.height - room);
		this.scroll = Phaser.Math.Clamp(this.scroll + dy, 0, max);
		// The crop is in the text's texture pixels (its resolution follows the zoom), and the cropped
		// part is drawn that many units down: the text moves up by the same amount.
		const k = this.body.frame.width / this.body.width;
		this.body.setY(this.pageTop - this.scroll * k);
		if (max > 0) this.body.setCrop(0, this.scroll * k, this.body.frame.width, room * k);
		else this.body.setCrop();
		const g = this.scrollBar.clear();
		if (max <= 0) return;
		const x = this.body.x + BODY_W + GAP.card;
		const h = Math.max(12, (room * room) / this.body.height);
		g.fillStyle(PALETTE.panelLight, 1).fillRoundedRect(x, this.pageTop, 3, room, 1.5);
		g.fillStyle(PALETTE.manilha, 1).fillRoundedRect(
			x,
			this.pageTop + ((room - h) * this.scroll) / max,
			3,
			h,
			1.5,
		);
	}

	// --- Signals: the gestures to learn by heart ------------------------------------------

	signals(c: Phaser.GameObjects.Container): void {
		// One signal per line: icon, then "Gesture = what it means".
		SIGNS.forEach((sign, i) => {
			const x = -BODY_W / 2;
			const y = 70 + i * 22;
			c.add([
				this.add
					.text(x + 10, y, SIGNAL_EMOJI[sign], {
						fontFamily: EMOJI_FONT,
						fontSize: '18px',
					})
					.setOrigin(0.5),
				this.add
					.text(
						x + 24,
						y,
						`${t(`sign.${sign}.gesture` as I18nKey)} = ${t(`sign.${sign}` as I18nKey)}`,
						text(FONT.body),
					)
					.setOrigin(0, 0.5),
			]);
		});
	}
}
