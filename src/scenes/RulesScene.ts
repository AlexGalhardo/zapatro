import Phaser from 'phaser';
import { cardArt, markedArt, tex } from '../art/flat';
import { LOGICAL_H } from '../config/constants';
import { PALETTE, shade } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS } from '../config/ui';
import { CHAMPIONSHIPS } from '../data/championships';
import { JOKER_EFFECTS } from '../data/jokers';
import { LANCE_IDS } from '../data/lances';
import { type I18nKey, t } from '../i18n';
import { cardChips, lanceValue } from '../logic/score/score';
import { sentenceLines } from '../logic/sentences';
import { type Card, manilhaOf, parseCard, RANKS, SUITS, viraManilha } from '../logic/truco/cards';
import { SIGNS } from '../logic/truco/table';
import { Button, inkIcon } from '../ui/Button';
import { TEXT_SHADOW } from '../ui/font';
import { keyHint } from '../ui/key-hint';
import { onKey } from '../ui/keys';
import { drawPanel } from '../ui/panel';
import { fadeTo, setupScreen, text } from '../ui/screen';
import { screenTitle } from '../ui/title';
import { uiPx } from '../ui/touch';
import { fitCamera } from '../view/stage';

type Draw = (s: RulesScene, c: Phaser.GameObjects.Container) => void;

/** The page column: left edge and wrap width of the body text (stage px). */
const BODY_X = 190;
const BODY_W = 420;
/** Right edge of the page list (the dark column on the left). */
const PAGE_X = 172;
/** Font sizes of the book (25% over the old 7/8/9/24): body, page list, page buttons, page title. */
const FONT = { body: 9, list: 10, nav: 11, page: 30 } as const;

/** Each page: an illustration drawn from the game's own art and data, then its text. */
const PAGES: readonly { id: string; draw: Draw }[] = [
	{ id: 'teams', draw: (s, c) => s.teams(c) },
	{ id: 'strength', draw: (s, c) => s.strength(c) },
	{ id: 'manilha', draw: (s, c) => s.manilha(c) },
	{ id: 'joker', draw: (s, c) => s.joker(c) },
	{ id: 'tricks', draw: (s, c) => s.tricks(c) },
	{ id: 'truco', draw: (s, c) => s.truco(c) },
	{ id: 'signals', draw: (s, c) => s.signals(c) },
	{ id: 'score', draw: (s, c) => s.score(c) },
	{ id: 'lances', draw: (s, c) => s.lances(c) },
	{ id: 'manhas', draw: (s, c) => s.manhas(c) },
	{ id: 'eleven', draw: (s, c) => s.eleven(c) },
	{ id: 'run', draw: (s, c) => s.run(c) },
];

/** Worked example of the Chips × Mult page: Vaza Limpa with truco accepted (vira 4, 5 manilha). */
const EXAMPLE = {
	vira: '4h',
	tricks: [
		['3s', 'Kc', '7h', '2d'],
		['5c', 'Ad', 'Qh', '6s'],
	],
	bet: 3,
};

const card = (id: string): Card => parseCard(id) as Card;

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
				`${i + 1}. ${t(`rules.${pg.id}.title` as I18nKey)}`,
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
		this.ui.add(
			inkIcon(this.add.image(L + 612, 25, tex(this, 'icon.close')).setScale(0.7), 'close'),
		);
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
		this.subtitle.setText(`${this.page + 1}. ${t(`rules.${p.id}.title` as I18nKey)}`);
		this.body.setText(sentenceLines(t(`rules.${p.id}.body` as I18nKey)));
		this.counter.setText(`${this.page + 1} / ${PAGES.length}`);
		// Text only, one sentence per line; the signals page keeps its gestures to learn by heart.
		if (p.id === 'signals') p.draw(this, this.art);
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

	// --- Illustrations (x relative to the centre, y from the top of the screen) ----------------

	private cardImg(id: string, x: number, y: number, scale = 0.75): Phaser.GameObjects.Image {
		const c = card(id);
		return this.add.image(x, y, tex(this, cardArt(c))).setScale(scale);
	}

	private label(x: number, y: number, s: string, color: number = PALETTE.textLight, size = 6) {
		return this.add.text(x, y, s, text(size, color)).setOrigin(0.5, 0);
	}

	/** A manilha's gold frame (src/art/flat.ts). */
	private glow(img: Phaser.GameObjects.Image): void {
		img.setTexture(tex(this, markedArt(img.texture.key, 'm')));
	}

	teams(c: Phaser.GameObjects.Container): void {
		const seat = (x: number, key: string, name: string, role: I18nKey, color: number) => {
			c.add([
				this.add.image(x, 102, tex(this, key)).setDisplaySize(48, 64),
				this.label(x, 136, name),
				this.label(x, 150, t(role), color),
			]);
		};
		seat(-210, 'charcard.bia', t('char.bia'), 'rules.role.rival', PALETTE.bad);
		seat(70, 'charcard.tonhao', t('char.tonhao'), 'rules.role.partner', PALETTE.good);
		seat(210, 'charcard.ze', t('char.ze'), 'rules.role.rival', PALETTE.bad);
		c.add([
			this.cardImg('3s', -90, 108, 0.6),
			this.cardImg('Kh', -70, 108, 0.6),
			this.cardImg('7d', -50, 108, 0.6),
			this.label(-70, 136, t('rules.role.you'), PALETTE.good),
		]);
	}

	strength(c: Phaser.GameObjects.Container): void {
		RANKS.forEach((r, i) => {
			const x = (i - 4.5) * 40;
			const suit = SUITS[i % 4] ?? 'clubs';
			c.add(this.cardImg(`${r}${suit[0]}`, x, 112, 0.6));
			c.add(this.label(x, 136, `${i + 1}`, PALETTE.textDim));
		});
		c.add([
			this.label(-180, 70, t('rules.weak'), PALETTE.textDim, 7),
			this.label(180, 70, t('rules.strong'), PALETTE.manilha, 7),
			this.label(0, 70, '→ → →', PALETTE.textDim, 7),
		]);
	}

	manilha(c: Phaser.GameObjects.Container): void {
		const vira = 'Kh';
		const m = manilhaOf('K');
		c.add([
			this.cardImg(vira, -230, 110),
			this.label(-230, 140, t('table.vira'), PALETTE.manilha),
			this.label(-185, 104, '→', PALETTE.manilha, 12),
		]);
		SUITS.forEach((suit, i) => {
			const x = -135 + i * 62;
			const img = this.cardImg(`${m}${suit[0]}`, x, 110);
			this.glow(img);
			c.add([img, this.label(x, 140, t(`card.manilha.${suit}` as I18nKey), PALETTE.manilha)]);
			c.add(this.label(x + 31, 104, '<', PALETTE.textDim, 10));
		});
		// The ZAP: the clubs card two ranks above the vira.
		const zap = this.cardImg(`${manilhaOf(m)}c`, 135, 110, 0.85);
		zap.setTexture(tex(this, markedArt(zap.texture.key, 'z')));
		c.add([zap, this.label(135, 146, t('card.zap'), PALETTE.fame, 8)]);
	}

	joker(c: Phaser.GameObjects.Container): void {
		c.add(this.cardImg('JK', -220, 118, 1));
		JOKER_EFFECTS.forEach((e, i) => {
			const x = i < 5 ? -40 : 140;
			const y = 82 + (i % 5) * 16;
			c.add(
				this.label(
					x,
					y,
					`${i + 1}. ${t(`joker.${e}.name` as I18nKey)}`,
					PALETTE.manilha,
					7,
				),
			);
		});
	}

	tricks(c: Phaser.GameObjects.Container): void {
		const plays: [string, I18nKey, boolean][] = [
			['Qd', 'rules.role.you', false],
			['2c', 'rules.role.rival', false],
			['3s', 'rules.role.partner', true],
			['Ah', 'rules.role.rival', false],
		];
		plays.forEach(([id, role, win], i) => {
			const x = (i - 1.5) * 80;
			const img = this.cardImg(id, x, 108);
			if (win) img.setScale(0.85);
			c.add([img, this.label(x, 140, t(role), win ? PALETTE.good : PALETTE.textDim)]);
		});
		c.add(this.label(0, 156, t('rules.tricks.example'), PALETTE.good));
	}

	truco(c: Phaser.GameObjects.Container): void {
		const steps: [string, string][] = [
			['1', ''],
			['3', t('table.call.3')],
			['6', t('table.call.6')],
			['9', t('table.call.9')],
			['12', t('table.call.12')],
		];
		steps.forEach(([v, call], i) => {
			const x = (i - 2) * 100;
			c.add([
				this.add
					.rectangle(x, 106, 44, 36, PALETTE.panelDark)
					.setStrokeStyle(2, i ? PALETTE.truco : PALETTE.panelBorder),
				this.add.text(x, 106, v, text(14, PALETTE.mult)).setOrigin(0.5),
				this.label(x, 130, call, PALETTE.truco, 7),
			]);
			if (i < 4) c.add(this.label(x + 50, 98, '→', PALETTE.textDim, 10));
		});
		c.add(this.label(0, 152, t('rules.truco.answers'), PALETTE.textLight, 7));
	}

	signals(c: Phaser.GameObjects.Container): void {
		// One signal per line: icon, then "Gesture = what it means".
		SIGNS.forEach((sign, i) => {
			const x = -BODY_W / 2;
			const y = 70 + i * 22;
			c.add([
				this.add.image(x + 10, y, tex(this, `icon.signal.${sign}`)).setDisplaySize(20, 20),
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

	score(c: Phaser.GameObjects.Container): void {
		const m = viraManilha(card(EXAMPLE.vira));
		let chips = 0;
		EXAMPLE.tricks.forEach((trick, row) => {
			trick.forEach((id, i) => {
				const x = (i - 1.5) * 40 + (row ? 120 : -120);
				const v = cardChips(card(id), m);
				chips += v;
				const img = this.cardImg(id, x, 98, 0.55);
				if (card(id).rank === m) this.glow(img);
				c.add([img, this.label(x, 117, `+${v}`, PALETTE.chips)]);
			});
			c.add(
				this.label(
					row ? 120 : -120,
					66,
					t('rules.score.trick', { n: row + 1 }),
					PALETTE.good,
				),
			);
		});
		const lance = lanceValue('limpa');
		const total = chips + lance.chips;
		const mult = EXAMPLE.bet + lance.mult;
		const line = this.add
			.text(
				0,
				140,
				t('rules.score.formula', {
					cards: chips,
					lance: lance.chips,
					bet: EXAMPLE.bet,
					lm: lance.mult,
					chips: total,
					mult,
					points: total * mult,
				}),
				{ ...text(8, PALETTE.textLight), fontStyle: 'bold' },
			)
			.setOrigin(0.5, 0);
		c.add([line, this.label(0, 160, t('rules.score.legend'), PALETTE.textDim)]);
	}

	lances(c: Phaser.GameObjects.Container): void {
		LANCE_IDS.forEach((id, i) => {
			const v = lanceValue(id);
			const y = 72 + i * 15;
			c.add([
				this.add
					.text(-150, y, t(`lance.${id}` as I18nKey), { ...text(7), align: 'left' })
					.setOrigin(0, 0),
				this.add
					.text(0, y, t(`rules.lance.${id}` as I18nKey), {
						...text(6, PALETTE.textDim),
						align: 'left',
					})
					.setOrigin(0, 0),
				this.add
					.text(-40, y, `${v.chips}`, { ...text(7, PALETTE.chips), align: 'right' })
					.setOrigin(1, 0),
				this.add.text(-34, y, `× ${v.mult}`, { ...text(7, PALETTE.mult), align: 'left' }),
			]);
		});
	}

	manhas(c: Phaser.GameObjects.Container): void {
		const ids = ['seuZe', 'malandro', 'maoDeLixo'];
		ids.forEach((id, i) => {
			const x = (i - 1) * 190;
			c.add([
				this.add.image(x, 92, tex(this, `manha.${id}`)),
				this.label(x, 120, t(`manha.${id}.name` as I18nKey), PALETTE.rarityCommon, 7),
				this.add
					.text(x, 136, t(`manha.${id}.desc` as I18nKey), {
						...text(6, PALETTE.textDim),
						wordWrap: { width: 170 },
					})
					.setOrigin(0.5, 0),
			]);
		});
	}

	eleven(c: Phaser.GameObjects.Container): void {
		const box = (x: number, score: string, title: I18nKey, color: number) =>
			c.add([
				this.add.rectangle(x, 108, 150, 60, PALETTE.panelDark).setStrokeStyle(2, color),
				this.add.text(x, 84, score, text(12, color)).setOrigin(0.5, 0),
				this.label(x, 112, t(title), PALETTE.textLight, 7),
			]);
		box(-170, '11 × 7', 'lance.onze', PALETTE.manilha);
		box(0, '11 × 11', 'lance.ferro', PALETTE.bad);
		box(170, '12 × 5', 'lance.queda', PALETTE.good);
	}

	run(c: Phaser.GameObjects.Container): void {
		CHAMPIONSHIPS.slice(0, 8).forEach((ch, i) => {
			const x = (i - 3.5) * 64;
			c.add([
				this.add.image(x, 96, tex(this, `bg.${ch}`)).setDisplaySize(60, 34),
				this.label(x, 118, `${i + 1}`, PALETTE.manilha),
			]);
		});
		c.add([
			this.add.image(-130, 150, tex(this, 'boss.agiota')).setScale(0.35),
			this.label(-100, 144, t('rules.run.boss'), PALETTE.bad, 7).setOrigin(0, 0),
		]);
	}
}
