import Phaser from 'phaser';
import { CARD_W, COVER_H, COVER_W, cardArt, tex } from '../art/flat';
import { LOGICAL_H } from '../config/constants';
import { IS_DEMO, TABLE_SELECT } from '../config/features';
import { inkOn, PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS, SAFE, SHADOW, SIDEBAR, TYPE } from '../config/ui';
import { sfx } from '../core/audio';
import { getParams, getSave, persist } from '../core/context';
import { playAmbience, playMusic } from '../core/music';
import { openStore } from '../core/platform';
import { getView } from '../core/viewport';
import { BOSS_POOL, FINAL_BOSS } from '../data/bosses';
import { TABLE_SIZES } from '../data/championships';
import { COMPANION_IDS, COMPANIONS, type CompanionId, isCompanion } from '../data/companions';
import type { Consumable } from '../data/consumables';
import type { DeckId } from '../data/decks';
import { ECONOMY } from '../data/economy';
import { isManhaId, MANHA_BY_ID } from '../data/manhas';
import { MAX_STAKE } from '../data/stakes';
import { botShop } from '../game/run-sim';
import { getLang, type I18nKey, t } from '../i18n';
import { flawText, perkText } from '../i18n/companion';
import { isUnlocked, recordRunState } from '../logic/meta';
import { Rng, randomSeed } from '../logic/rng';
import { drawCandidates } from '../logic/run/draw';
import {
	buy,
	canSkip,
	championshipBoss,
	choosePack,
	continueEndless,
	discardConsumable,
	goalOf,
	leaveShop,
	moveManha,
	needsTarget,
	newRun,
	type Offer,
	type PackOption,
	parseRun,
	type RunState,
	reroll,
	rerollCost,
	type ShopError,
	sellManha,
	sellPrice,
	skipTable,
	startTable,
	useConsumable,
} from '../logic/run/run';
import { formatPoints } from '../logic/score/format';
import { type Card, isSpecial, RANKS, type Rank, SUITS } from '../logic/truco/cards';
import { Button, inkIcon } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { itemCard, RARITY_COLOR } from '../ui/item-card';
import { backHint } from '../ui/key-hint';
import { onKey, onSceneEvent } from '../ui/keys';
import { type ButtonNav, buttonNav } from '../ui/nav';
import { drawPanel } from '../ui/panel';
import { fadeTo, setupScreen } from '../ui/screen';
import { screenTitle } from '../ui/title';
import { featToast } from '../ui/toast';
import { uiPx } from '../ui/touch';
import { shopSlate } from '../view/shop-slate';
import { fitCamera } from '../view/stage';
import { setBackdrop } from './BackdropScene';

/** Width of the Deck and Stake pickers on the partner screen. */

/** Height of the bar of icon shortcuts at the foot of the sidebar. */
const ICON_BAR_H = 32;

/** The sidebar's Championship card (title, trophy, partner line). */
const CHAMP_H = 63;

/** A Manha or consumable slot in the sidebar. */
const SLOT = 22;

/**
 * The run between tables (PLAN A4): partner choice, next table (play or skip), shop, packs,
 * consumables and the end of the run. One screen that redraws from the saved `RunState`.
 * Layouts follow references/concept-art/zapatro (screen-partner, -select, -shop, -pack) on the
 * 640×360 stage: `L` is the stage's left edge when the view is wider than 16:9.
 */
export class RunScene extends Phaser.Scene {
	private run: RunState | null = null;
	/** A table is being entered: draws and key repeats must not start it twice. */
	private entering = false;
	private deckChoice: DeckId = 'normal';
	private stakeChoice = 1;
	/** Closes the panel open over the screen (Esc), if any. */
	private closePanel: (() => void) | null = null;
	/** The three partners on offer and the seed of the run they were drawn for. */
	private candidates: CompanionId[] = [];
	private runSeed = 0;
	private nav: ButtonNav | null = null;
	private body!: Phaser.GameObjects.Container;
	private msg!: Phaser.GameObjects.Text;
	/** Index of a Simpatia waiting for a deck card. */
	private targeting: number | null = null;
	private cx = 320;
	private h = 360;
	private heading: Phaser.GameObjects.Text | null = null;

	constructor() {
		super('Run');
	}

	/** Left edge of the 640-wide stage. */
	private get L(): number {
		return this.cx - 320;
	}

	create(data: { fresh?: boolean }): void {
		const save = getSave(this);
		this.run = data?.fresh ? null : parseRun(save.run);
		this.targeting = null;
		// `?stake=N` (test hacks) preselects the Stake of a new run, locked or not.
		const debugStake = getParams(this).stake;
		if (debugStake !== undefined) this.stakeChoice = Math.min(MAX_STAKE, debugStake);
		this.tipText = null;
		this.entering = false;
		playMusic(this, 'music.menu');
		playAmbience(this, null);
		this.body = this.add.container(0, 0);
		this.msg = this.add
			.text(0, 0, '', {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(9)}px`,
				fontStyle: '700',
				color: toCss(PALETTE.manilha),
				shadow: TEXT_SHADOW,
			})
			.setOrigin(0.5, 1)
			.setDepth(50);
		this.heading = setupScreen(this, t('run.title'), (view) => {
			// The 640×360 stage scaled to fit and centred, like the table and the menus: any
			// aspect ratio shows the backdrop around it instead of shifting the layout.
			fitCamera(this.cameras.main, view);
			this.cx = 320;
			this.h = LOGICAL_H;
			this.draw();
		});
		this.heading.setVisible(false);
		onKey(this.input.keyboard, 'keydown-ESC', () => {
			// An open panel (the deck) closes first; else back to the menu.
			if (this.closePanel) this.closePanel();
			else fadeTo(this, 'Menu');
		});
		this.nav = buttonNav(this);
		// Settings may switch the language while the run waits paused under it: redraw on return
		// (the run state lives in `this.run`, so nothing is lost).
		let lang = getLang();
		onSceneEvent(this, 'resume', () => {
			if (getLang() === lang) return;
			lang = getLang();
			this.draw();
		});
		if (getParams(this).auto) this.time.delayedCall(400, () => this.autoStep());
	}

	/** `?auto=1`: the bot drives the run screens too (smoke and QA). */
	private autoStep(): void {
		if (!this.sys.isActive()) return;
		const run = this.run;
		if (!run) {
			this.choosePartner(this.ensureCandidates()[0] ?? 'tonhao');
			return;
		}
		if (run.phase === 'select') {
			this.play();
			return;
		}
		if (run.phase === 'shop') {
			botShop(run, 'good', new Rng(run.rng));
			this.save();
			this.play();
			return;
		}
	}

	private save(): void {
		const save = getSave(this);
		save.run = this.run;
		if (this.run) featToast(this, recordRunState(save.meta, this.run));
		persist(this);
	}

	private say(msg: string): void {
		this.msg.setText(msg);
		this.time.delayedCall(2200, () => this.msg.text === msg && this.msg.setText(''));
	}

	private err(e: ShopError | null): boolean {
		if (!e) return true;
		sfx(this, 'sfx.ui.error');
		this.say(t(`run.err.${e}` as I18nKey));
		return false;
	}

	private draw(): void {
		this.nav?.reset();
		this.body.removeAll(true);
		this.tipText?.setVisible(false);
		const run = this.run;
		setBackdrop(this, !run ? 'partner' : run.phase === 'shop' ? 'shop' : 'main');
		this.msg.setPosition(this.cx, this.h - 6);
		if (!run) {
			this.drawPartners();
			return;
		}
		if (run.phase === 'won' || run.phase === 'lost') {
			this.drawEnd(run);
			return;
		}
		// Without the table-choice screen the next table starts at once (a saved run mid-Championship too).
		if (run.phase === 'select' && !TABLE_SELECT) {
			this.play();
			return;
		}
		// The main area first: its button is the first one, so it starts focused.
		if (run.phase === 'select') this.drawSelect(run);
		else this.drawShop(run);
		// Opening a pack takes the whole screen (screen-pack.png).
		if (!run.shop?.opened || run.phase !== 'shop') this.drawSidebar(run);
	}

	// --- Drawing helpers -----------------------------------------------------------------

	/** Text on the body: `px` is the logical font size; `o` the origin. */
	private put(
		x: number,
		y: number,
		s: string,
		px: number,
		color: number = PALETTE.textLight,
		o: [number, number] = [0.5, 0.5],
		wrap?: number,
	): Phaser.GameObjects.Text {
		const txt = this.add
			.text(x, y, s, {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(px)}px`,
				fontStyle: '700',
				color: toCss(color),
				align: o[0] === 0 ? 'left' : o[0] === 1 ? 'right' : 'center',
				wordWrap: wrap ? { width: wrap } : undefined,
				shadow: TEXT_SHADOW,
			})
			.setOrigin(o[0], o[1]);
		this.body.add(txt);
		return txt;
	}

	/** Big gold screen title with its solid drop shadow. */
	private title(x: number, y: number, s: string, px: number): Phaser.GameObjects.Text {
		const txt = this.put(x, y, s, px, PALETTE.manilha);
		txt.setShadow(-2, 3, toCss(PALETTE.shadow), 0, true, true);
		return txt;
	}

	/** The shared full-screen title (icon and text centred as a pair) on the body. */
	private screenTitle(cx: number, s: string, icon: string, y?: number): void {
		const { title, icon: img } = screenTitle(this, cx, s, icon, y);
		this.body.add([img, title]);
	}

	/** A dark rounded card with a solid shadow and a thin frame. */
	private box(
		x: number,
		y: number,
		w: number,
		h: number,
		opts: { fill?: number; frame?: number; radius?: number; shadow?: number } = {},
	): Phaser.GameObjects.Graphics {
		const g = this.add.graphics();
		drawPanel(g, x, y, w, h, {
			fill: opts.fill ?? PALETTE.panel,
			radius: opts.radius ?? RADIUS.panel,
			shadow: opts.shadow ?? SHADOW.panel,
		});
		g.lineStyle(2, opts.frame ?? shade(opts.fill ?? PALETTE.panel, -0.3), 1).strokeRoundedRect(
			x,
			y,
			w,
			h,
			opts.radius ?? RADIUS.panel,
		);
		this.body.add(g);
		return g;
	}

	private icon(x: number, y: number, name: string, size = 24): Phaser.GameObjects.Image {
		const img = this.add.image(x, y, tex(this, `icon.${name}`)).setScale(size / 24);
		this.body.add(img);
		return img;
	}

	/** An icon over a button: the cream vector ones take the buttons' dark ink. */
	private buttonIcon(x: number, y: number, name: string, size: number): void {
		inkIcon(this.icon(x, y, name, size), name);
	}

	private button(
		x: number,
		y: number,
		s: string,
		fn: () => void,
		w = 110,
		color?: number,
		opts: {
			h?: number;
			size?: number;
			left?: boolean | number;
			hint?: () => string;
			icon?: string;
			iconScale?: number;
			onBlocked?: () => void;
		} = {},
	): Button {
		const b = new Button(this, s, fn, {
			w,
			h: opts.h ?? BUTTON_H.row,
			size: opts.size ?? 10,
			...(color !== undefined ? { color } : {}),
			...(opts.left !== undefined ? { left: opts.left } : {}),
			...(opts.hint ? { hint: opts.hint } : {}),
			...(opts.icon ? { icon: opts.icon, iconScale: opts.iconScale ?? 1 } : {}),
			...(opts.onBlocked ? { onBlocked: opts.onBlocked } : {}),
		}).setPosition(x, y);
		this.body.add(b);
		return b;
	}

	/** A square button showing a pixel icon. */
	private iconButton(
		x: number,
		y: number,
		w: number,
		h: number,
		name: string,
		fn: () => void,
		opts: { color?: number; border?: boolean } = {},
	): Button {
		const b = new Button(this, '', fn, {
			w,
			h,
			...(opts.color !== undefined ? { color: opts.color } : {}),
			// A neutral frame: gold is the focus ring's colour.
			...(opts.border ? { border: PALETTE.panelLight } : {}),
		}).setPosition(x, y);
		this.body.add(b);
		this.buttonIcon(x, y - 1, name, Math.min(h - 8, 24));
		return b;
	}

	// --- Partner -------------------------------------------------------------------------

	/**
	 * Partner choice: three rows, each a character card (3:4) on the left and the partner's name,
	 * play style, perk, flaw and passive beside it, with the pick button at the row's right end.
	 * Rows (not columns) because three side-by-side panels leave the texts too narrow at 640 px.
	 * The deck is always the normal one and the Stake 1 (`?stake=N` still presets it for tests).
	 */
	private drawPartners(): void {
		const { cx } = this;
		this.title(cx, 24, t('run.choosePartner'), TYPE.screenTitle);
		const offer = this.ensureCandidates();
		// Three panels side by side across the stage, each a grid of two columns: the character
		// card over the panel's whole height on the left (3:4 art, the sides cropped to the column),
		// and on the right the name, style, perk and flaw with the pick button on the base.
		const pad = 5;
		const [panelW, panelH, gap, top] = [196, COVER_H + 2 * pad, GAP.card, 60];
		const x0 = cx - (3 * panelW + 2 * gap) / 2;
		const [cw, ch] = [COVER_W, COVER_H];
		const btnH = 24;
		offer.forEach((id, i) => {
			const px = x0 + i * (panelW + gap);
			this.box(px, top, panelW, panelH);
			this.body.add(
				this.add
					.image(px + pad + cw / 2, top + pad + ch / 2, tex(this, `charcover.${id}`))
					.setDisplaySize(cw, ch),
			);
			const tx = px + pad + cw + pad;
			const tw = panelW - (tx - px) - pad;
			// One text size for all: long texts wrap, they never shrink.
			let ty = top + pad;
			ty =
				this.put(
					tx,
					ty,
					t(`char.${id}` as I18nKey),
					10,
					PALETTE.textLight,
					[0, 0],
					tw,
				).getBounds().bottom + 1;
			const lines: [string, number][] = [
				[t(`partner.style.${COMPANIONS[id].style}` as I18nKey), PALETTE.manilha],
				[perkText(id), PALETTE.good],
				[flawText(id), PALETTE.bad],
			];
			for (const [text, color] of lines)
				ty = this.put(tx, ty, text, 6.5, color, [0, 0], tw).getBounds().bottom + 3;
			this.button(
				tx + tw / 2,
				top + panelH - pad - btnH / 2,
				t('run.pick', { name: t(`char.${id}` as I18nKey) }),
				() => this.choosePartner(id),
				tw,
				PALETTE.good,
				{ h: btnH, size: 7 },
			);
		});
		this.button(
			cx,
			top + panelH + 24,
			t('menu.back'),
			() => fadeTo(this, 'Menu'),
			100,
			undefined,
			{ hint: backHint },
		);
	}

	/** Draws the three partners once per run screen (the seed is the run's own). */
	private ensureCandidates(): CompanionId[] {
		if (this.candidates.length) return this.candidates;
		const meta = getSave(this).meta;
		const params = getParams(this);
		this.runSeed = params.seed ?? randomSeed();
		const open = COMPANION_IDS.filter((id) => isUnlocked(meta, `partner:${id}`));
		const last = meta.stats.history[0]?.partner;
		this.candidates = drawCandidates(this.runSeed, open, isCompanion(last) ? last : undefined);
		const forced = params.partner;
		if (isCompanion(forced) && open.includes(forced) && !this.candidates.includes(forced))
			this.candidates[this.candidates.length - 1] = forced;
		return this.candidates;
	}

	private choosePartner(id: CompanionId): void {
		const meta = getSave(this).meta;
		this.candidates = [];
		this.run = newRun(
			this.runSeed,
			id,
			this.deckChoice,
			this.stakeChoice,
			isUnlocked(meta, 'legendary'),
			IS_DEMO || getParams(this).demo,
		);
		// Test hacks for a new run (test-hacks.md): starting money and Manhas.
		const params = getParams(this);
		if (params.money !== undefined) this.run.money = params.money;
		if (params.manhas)
			this.run.manhas = params.manhas.filter(isManhaId).slice(0, this.run.manhaSlots);
		meta.stats.runs++;
		this.save();
		this.draw();
		if (getParams(this).auto) this.time.delayedCall(300, () => this.autoStep());
	}

	// --- Sidebar -------------------------------------------------------------------------

	/**
	 * The left column of the table-select and shop screens: the Championship, the money and, on
	 * the select screen, the Manhas and consumables with the bar of shortcuts; in the shop, the
	 * navigation buttons.
	 */
	private drawSidebar(run: RunState): void {
		const { L } = this;
		// Same column as the table's sidebar (SIDEBAR), so it never jumps between screens.
		const { w, pad, gap, top } = SIDEBAR;
		const x = L + SIDEBAR.x;
		const mid = x + w / 2;
		const shop = run.phase === 'shop';
		this.box(x, top, w, CHAMP_H);
		const champ = this.put(
			x + pad,
			top + pad,
			t('run.champ', { n: run.champ }),
			14,
			PALETTE.textLight,
			[0, 0],
		);
		// Long names (EN "Championship 1") shrink to the card instead of crossing its edge.
		for (let px = 14; champ.width > w - 2 * pad && px > TYPE.label; px--)
			champ.setFontSize(uiPx(px - 1));
		const partner = this.put(
			mid,
			0,
			`${t(`char.${run.partner}` as I18nKey)}${run.partner === 'juninho' ? ` · ${t('table.lance.level', { n: run.partnerLevel })}` : ''}`,
			6.5,
			PALETTE.textDim,
			[0.5, 1],
			w - 2 * pad,
		);
		partner.setY(top + CHAMP_H - SAFE.panel);
		const trophy = this.icon(mid, 0, 'trophy', 20);
		trophy.setY((champ.getBounds().bottom + partner.getBounds().top) / 2);
		const moneyY = top + CHAMP_H + gap;
		this.box(x, moneyY, w, 40);
		this.icon(x + pad + 11, moneyY + 20, 'coin', 22);
		this.put(
			x + pad + 22 + GAP.inline,
			moneyY + 20,
			t('run.money', { n: run.money }),
			17,
			PALETTE.money,
			[0, 0.5],
		);
		if (shop) {
			const nav = [
				{ icon: 'cart', label: t('run.nav.counter'), on: true, fn: () => {} },
				{ icon: 'star', label: t('run.nav.manhas'), fn: () => this.drawManhaPanel(run) },
				{ icon: 'cards', label: t('run.nav.deck'), fn: () => this.drawDeck(run) },
				{ icon: 'book', label: t('run.nav.almanac'), fn: () => fadeTo(this, 'Almanac') },
				{ icon: 'gear', label: t('run.nav.settings'), fn: () => this.openSettings() },
			];
			const navH = 31;
			nav.forEach((n, i) => {
				const y = moneyY + 40 + gap + navH / 2 + i * (navH + gap);
				this.button(mid, y, n.label, n.fn, w, n.on ? PALETTE.manilha : PALETTE.panel, {
					h: navH,
					size: 11,
					left: pad + 20 + GAP.inline,
					icon: n.icon,
					iconScale: 20 / 24,
				});
			});
			return;
		}
		// The big card: owned Manhas and consumables as slot grids (hover for the text).
		const cardY = moneyY + 40 + gap;
		const barY = LOGICAL_H - SAFE.stage - ICON_BAR_H;
		const cardH = barY - gap - cardY;
		this.box(x, cardY, w, cardH);
		const slotX = (i: number): number => x + pad + SLOT / 2 + i * (SLOT + GAP.list);
		const labelY = cardY + pad;
		this.put(
			x + pad,
			labelY,
			t('run.manhas', { n: run.manhas.length, max: run.manhaSlots }),
			7,
			PALETTE.textDim,
			[0, 0],
		);
		const slot = (
			cx: number,
			cy: number,
			art: string | null,
			tip: string,
			color: number,
		): void => {
			const g = this.add.graphics();
			g.lineStyle(1.5, PALETTE.panelLight, 1).strokeRoundedRect(
				cx - SLOT / 2,
				cy - SLOT / 2,
				SLOT,
				SLOT,
				RADIUS.button,
			);
			this.body.add(g);
			if (!art) return;
			const img = this.add
				.image(cx, cy, tex(this, art))
				.setScale(0.5)
				.setInteractive({ useHandCursor: true });
			img.on('pointerover', () => this.tip(this.cx, 300, tip, color));
			img.on('pointerdown', () => this.tip(this.cx, 300, tip, color));
			img.on('pointerout', () => this.tipText?.setVisible(false));
			this.body.add(img);
		};
		for (let i = 0; i < run.manhaSlots; i++) {
			const id = run.manhas[i];
			const rarity = id ? (MANHA_BY_ID.get(id)?.rarity ?? 'common') : 'common';
			slot(
				slotX(i % 4),
				labelY + 22 + Math.floor(i / 4) * (SLOT + GAP.list),
				id ? `manha.${id}` : null,
				id
					? `${t(`manha.${id}.name` as I18nKey)} · ${t(`rarity.${rarity}` as I18nKey)}\n${t(`manha.${id}.desc` as I18nKey)}`
					: '',
				RARITY_COLOR[rarity],
			);
		}
		const rows = Math.ceil(run.manhaSlots / 4);
		const cy0 = labelY + 12 + rows * (SLOT + GAP.list) + GAP.card;
		this.put(x + pad, cy0, t('run.items'), 7, PALETTE.textDim, [0, 0]);
		for (let i = 0; i < run.consumableSlots; i++) {
			const c = run.consumables[i];
			slot(
				slotX(i),
				cy0 + 22,
				c ? (c.kind === 'simpatia' ? `simpatia.${c.id}` : `lance.${c.id}`) : null,
				c ? `${this.consumableName(c)}\n${this.consumableDesc(c)}` : '',
				PALETTE.cta,
			);
			if (c) {
				const hit = this.add
					.zone(slotX(i), cy0 + 22, SLOT, SLOT)
					.setInteractive({ useHandCursor: true });
				hit.on('pointerup', () => this.use(i));
				this.body.add(hit);
			}
		}
		this.button(
			mid,
			cardY + cardH - pad - BUTTON_H.small / 2,
			t('run.nav.manhas'),
			() => this.drawManhaPanel(run),
			w - 2 * pad,
			undefined,
			{ h: BUTTON_H.small, size: 8 },
		);
		// Three shortcuts filling the column's width, inline gaps between them.
		const iconW = (w - 2 * GAP.inline) / 3;
		const iconX = (i: number): number => x + iconW / 2 + i * (iconW + GAP.inline);
		const iconY = barY + ICON_BAR_H / 2;
		this.iconButton(iconX(0), iconY, iconW, ICON_BAR_H, 'book', () => fadeTo(this, 'Almanac'), {
			border: true,
		});
		this.iconButton(iconX(1), iconY, iconW, ICON_BAR_H, 'cards', () => this.drawDeck(run));
		this.iconButton(iconX(2), iconY, iconW, ICON_BAR_H, 'gear', () => this.openSettings());
	}

	private openSettings(): void {
		this.scene.pause();
		this.scene.launch('Settings', { returnTo: 'Run' });
	}

	private tipText: Phaser.GameObjects.Text | null = null;

	/** One hover tooltip for the Manhas and Simpatias. */
	private tip(x: number, y: number, s: string, color: number): void {
		this.tipText ??= this.add
			.text(0, 0, '', {
				fontFamily: UI_FONT,
				fontSize: `${uiPx(8)}px`,
				fontStyle: '700',
				color: toCss(PALETTE.textLight),
				backgroundColor: toCss(PALETTE.panelDark),
				padding: { x: 6, y: 4 },
				wordWrap: { width: 240 },
				align: 'center',
			})
			.setOrigin(0.5, 1)
			.setDepth(60);
		this.tipText.setText(s).setColor(toCss(color)).setPosition(x, y).setVisible(true);
		this.children.bringToTop(this.tipText);
	}

	private consumableName(c: Consumable): string {
		return c.kind === 'simpatia'
			? t(`simpatia.${c.id}.name` as I18nKey)
			: `${t('consumable.lanceUp')}: ${t(`lance.${c.id}` as I18nKey)}`;
	}

	private consumableDesc(c: Consumable): string {
		return c.kind === 'simpatia'
			? t(`simpatia.${c.id}.desc` as I18nKey)
			: t('consumable.lanceUp.desc');
	}

	private use(i: number): void {
		const run = this.run;
		const c = run?.consumables[i];
		if (!run || !c) return;
		if (needsTarget(c)) {
			this.targeting = i;
			this.drawDeck(run);
			return;
		}
		useConsumable(run, i);
		sfx(this, 'sfx.ui.confirm');
		this.save();
		this.draw();
	}

	// --- Panels (Manhas, deck) -----------------------------------------------------------

	/** A modal panel over the screen: closes with Esc or its button. Returns it and a closer. */
	private modal(
		w: number,
		h: number,
		title: string,
	): { panel: Phaser.GameObjects.Container; close: () => void } {
		const panel = this.add.container(this.cx, this.h / 2).setDepth(40);
		const g = this.add.graphics();
		drawPanel(g, -w / 2, -h / 2, w, h, {
			fill: PALETTE.panel,
			radius: RADIUS.frame,
			shadow: 5,
		});
		g.lineStyle(2, PALETTE.panelLight, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS.frame);
		const close = (): void => {
			panel.destroy();
			this.targeting = null;
			this.closePanel = null;
		};
		this.closePanel = close;
		panel.add([
			this.add.zone(0, 0, 4000, 4000).setInteractive(),
			// The screen behind is dimmed, as under the pause and the tutorial cards.
			this.add.rectangle(0, 0, 4000, 4000, PALETTE.night, 0.6),
			g,
			this.add
				.text(0, -h / 2 + 18, title, {
					fontFamily: UI_FONT,
					fontSize: `${uiPx(16)}px`,
					fontStyle: '700',
					color: toCss(PALETTE.manilha),
					shadow: TEXT_SHADOW,
				})
				.setOrigin(0.5),
		]);
		return { panel, close };
	}

	/** The owned Manhas (sell and move in the shop) and consumables (use, discard). */
	private drawManhaPanel(run: RunState): void {
		const w = 460;
		const rowH = 26;
		// Height fits the rows: title band, the rows, a card gap, then Back over the frame padding.
		const rows = Math.max(1, run.manhas.length) + run.consumables.length;
		const h = Math.min(
			340,
			46 +
				(rows - 1) * rowH +
				(run.consumables.length ? 6 : 0) +
				rowH / 2 +
				GAP.card +
				BUTTON_H.primary +
				PAD.frame,
		);
		const { panel, close } = this.modal(w, h, t('run.nav.manhas'));
		const shop = run.phase === 'shop';
		let y = -h / 2 + 46;
		const iconW = SLOT;
		const textX = -w / 2 + PAD.frame + iconW + GAP.card;
		const row = (art: string, name: string, desc: string, color: number): void => {
			panel.add([
				this.add
					.image(-w / 2 + PAD.frame, y, tex(this, art))
					.setDisplaySize(iconW, iconW)
					.setOrigin(0, 0.5),
				this.add.text(textX, y - 8, name, {
					fontFamily: UI_FONT,
					fontSize: `${uiPx(8)}px`,
					fontStyle: '700',
					color: toCss(color),
				}),
				this.add.text(textX, y + 2, desc, {
					fontFamily: UI_FONT,
					fontSize: `${uiPx(6.5)}px`,
					fontStyle: '700',
					color: toCss(PALETTE.textDim),
					wordWrap: { width: 250 },
				}),
			]);
		};
		// Right-aligned row actions: Sell/Use hug the frame padding, the rest step left of it.
		const sellX = w / 2 - PAD.frame - 24;
		const arrowW = 22;
		const nextX = sellX - 24 - GAP.list - arrowW / 2;
		const prevX = nextX - arrowW - GAP.list;
		const small = (label: string, x: number, fn: () => void, color?: number, bw = 48): void => {
			panel.add(
				new Button(this, label, fn, {
					w: bw,
					h: BUTTON_H.small,
					size: 7,
					...(color ? { color } : {}),
				}).setPosition(x, y),
			);
		};
		if (!run.manhas.length)
			panel.add(
				this.add
					.text(0, y, t('run.manhas', { n: 0, max: run.manhaSlots }), {
						fontFamily: UI_FONT,
						fontSize: `${uiPx(8)}px`,
						color: toCss(PALETTE.textDim),
					})
					.setOrigin(0.5),
			);
		run.manhas.forEach((id, i) => {
			const rarity = MANHA_BY_ID.get(id)?.rarity ?? 'common';
			row(
				`manha.${id}`,
				`${t(`manha.${id}.name` as I18nKey)} · ${t(`rarity.${rarity}` as I18nKey)}`,
				t(`manha.${id}.desc` as I18nKey),
				RARITY_COLOR[rarity],
			);
			if (shop) {
				small(
					`${t('run.sell')} $${sellPrice(id)}`,
					sellX,
					() => {
						sellManha(run, i);
						sfx(this, 'sfx.money');
						this.save();
						close();
						this.draw();
						this.drawManhaPanel(run);
					},
					PALETTE.good,
				);
				if (i > 0)
					small(
						'◀',
						prevX,
						() => {
							moveManha(run, i, i - 1);
							this.save();
							close();
							this.drawManhaPanel(run);
						},
						undefined,
						arrowW,
					);
				if (i < run.manhas.length - 1)
					small(
						'▶',
						nextX,
						() => {
							moveManha(run, i, i + 1);
							this.save();
							close();
							this.drawManhaPanel(run);
						},
						undefined,
						arrowW,
					);
			}
			y += rowH;
		});
		y += 6;
		run.consumables.forEach((c, i) => {
			row(
				c.kind === 'simpatia' ? `simpatia.${c.id}` : `lance.${c.id}`,
				this.consumableName(c),
				this.consumableDesc(c),
				PALETTE.cta,
			);
			small(
				t('run.use'),
				sellX,
				() => {
					close();
					this.use(i);
				},
				PALETTE.good,
			);
			small(t('run.discard'), sellX - 48 - GAP.list, () => {
				discardConsumable(run, i);
				this.save();
				close();
				this.draw();
				this.drawManhaPanel(run);
			});
			y += rowH;
		});
		panel.add(
			new Button(this, t('menu.back'), close, {
				w: 120,
				h: BUTTON_H.primary,
				size: 12,
				color: PALETTE.truco,
				hint: backHint,
			}).setPosition(0, h / 2 - PAD.frame - BUTTON_H.primary / 2),
		);
	}

	/**
	 * The deck, one row per suit in strength order. With a Simpatia waiting for a target
	 * (`targeting`), clicking a card applies it.
	 */
	private drawDeck(run: RunState): void {
		const picking = this.targeting !== null;
		const h = 272;
		const { panel, close } = this.modal(
			612,
			h,
			picking ? t('run.pickCard') : t('run.deck', { n: run.deck.length }),
		);
		const rowsBySuit = SUITS.map((suit) =>
			run.deck.filter((c) => c.suit === suit).sort((a, b) => deckOrder(a) - deckOrder(b)),
		);
		// One pitch for every row; the suit column plus the longest row are centred in the panel.
		const most = Math.max(1, ...rowsBySuit.map((r) => r.length));
		const step = Math.min(36, 520 / Math.max(1, most - 1));
		const cardW = CARD_W * 0.7;
		const suitToCard = 40;
		const suitW = 16;
		const groupW = suitW / 2 + suitToCard + (most - 1) * step + cardW / 2;
		const suitX = -groupW / 2 + suitW / 2;
		SUITS.forEach((suit, row) => {
			const cards = rowsBySuit[row] ?? [];
			const y = -78 + row * 48;
			panel.add([
				this.add.image(suitX, y - 7, tex(this, `ui.suit.${suit}`)),
				this.add
					.text(suitX, y + 11, `${cards.length}`, {
						fontFamily: UI_FONT,
						fontSize: `${uiPx(8)}px`,
						color: toCss(PALETTE.textDim),
					})
					.setOrigin(0.5),
			]);
			cards.forEach((card, i) => {
				const x = suitX + suitToCard + i * step;
				const img = this.add.image(x, y, tex(this, cardArt(card))).setScale(0.7);
				panel.add(img);
				if (card.mod) {
					panel.add(
						this.add.image(x, y, tex(this, `card.mod.${card.mod}`)).setScale(0.7),
					);
					img.setInteractive();
					img.on('pointerover', () =>
						this.say(
							`${t(`mod.${card.mod}.name` as I18nKey)}: ${t(`mod.${card.mod}.desc` as I18nKey)}`,
						),
					);
				}
				if (!picking) return;
				img.setInteractive({ useHandCursor: true });
				img.on('pointerup', () => {
					const ok =
						this.targeting !== null && useConsumable(run, this.targeting, card.id);
					close();
					if (!ok) this.say(t('run.err.deckMin'));
					this.save();
					this.draw();
				});
			});
		});
		panel.add(
			new Button(this, picking ? t('run.cancel') : t('menu.back'), close, {
				w: 120,
				h: BUTTON_H.primary,
				size: 12,
				color: PALETTE.truco,
				hint: backHint,
			}).setPosition(0, h / 2 - PAD.frame - BUTTON_H.primary / 2),
		);
	}

	// --- Next table ----------------------------------------------------------------------

	/**
	 * screen-select.png: the Championship's three tables side by side, each a coloured card
	 * (small green, big gold, boss red) with who sits there, the goal, the prize and "Jogar".
	 */
	private drawSelect(run: RunState): void {
		const { L } = this;
		const boss = championshipBoss(run);
		const KIND = [PALETTE.good, PALETTE.manilha, PALETTE.truco];
		// The three cards share the room right of the sidebar, a card gap apart, inside the stage.
		const left = L + SIDEBAR.x + SIDEBAR.w + GAP.panel;
		const room = L + 640 - SAFE.stage - left;
		const w = Math.floor((room - 2 * GAP.card) / 3);
		const start = left + Math.round((room - 3 * w - 2 * GAP.card) / 2);
		const r = RADIUS.frame;
		TABLE_SIZES.forEach((size, i) => {
			const x0 = start + i * (w + GAP.card);
			const y0 = 50;
			const h = 267;
			const now = i === run.table;
			const color = KIND[i] ?? PALETTE.panelBorder;
			const g = this.add.graphics();
			g.fillStyle(PALETTE.shadow, 0.6).fillRoundedRect(x0, y0 + SHADOW.panel, w, h, r);
			g.fillStyle(shade(color, -0.68), 1).fillRoundedRect(x0, y0, w, h, r);
			g.fillStyle(color, 1).fillRoundedRect(x0, y0, w, 37, { tl: r, tr: r, bl: 0, br: 0 });
			g.fillStyle(shade(color, -0.55), 1).fillRect(x0 + 3, y0 + 37, w - 6, 115);
			g.lineStyle(2.5, color, 1).strokeRoundedRect(x0, y0, w, h, r);
			if (now)
				g.lineStyle(2, PALETTE.textLight, 0.9).strokeRoundedRect(
					x0 - 2,
					y0 - 2,
					w + 4,
					h + 4,
					r,
				);
			const panel = this.add.container(0, 0, [g]);
			this.body.add(panel);
			const add = (...o: Phaser.GameObjects.GameObject[]): void => {
				panel.add(o);
			};
			const cx = x0 + w / 2;
			const txt = (
				x: number,
				y: number,
				s: string,
				px: number,
				c: number,
				o: [number, number] = [0.5, 0.5],
				wrap?: number,
			) =>
				this.add
					.text(x, y, s, {
						fontFamily: UI_FONT,
						fontSize: `${uiPx(px)}px`,
						fontStyle: '700',
						color: toCss(c),
						align: o[0] === 0 ? 'left' : o[0] === 1 ? 'right' : 'center',
						wordWrap: wrap ? { width: wrap } : undefined,
						shadow:
							inkOn(color) === PALETTE.textDark && c === inkOn(color)
								? undefined
								: TEXT_SHADOW,
					})
					.setOrigin(o[0], o[1]);
			add(txt(cx, y0 + 19, t(`run.table.${size}` as I18nKey), 15, inkOn(color)));
			if (i < run.table) {
				add(
					txt(cx, y0 + 95, '✓', 34, PALETTE.good),
					txt(cx, y0 + 130, t('run.table.done'), 11, PALETTE.good),
				);
				panel.setAlpha(0.6);
				return;
			}
			if (size === 'boss' && boss) {
				add(
					this.add
						.image(cx, y0 + 92, tex(this, `charcard.${boss}`))
						.setDisplaySize(60, 80),
					txt(cx, y0 + 138, t(`boss.${boss}.name` as I18nKey), 8, PALETTE.textLight),
				);
				add(
					txt(
						cx,
						y0 + 147,
						t(`boss.${boss}.rule` as I18nKey),
						6,
						PALETTE.textDim,
						[0.5, 0],
						w - 18,
					).setY(y0 + 142),
				);
			} else if (now) {
				run.rivals.chars.forEach((id, k) => {
					const face = this.add
						.image(cx + (k ? 33 : -33), y0 + 100, tex(this, `charcard.${id}`))
						.setDisplaySize(44, 58)
						.setInteractive();
					if (isCompanion(id))
						face.on('pointerover', () =>
							this.say(`${this.charName(id)}: ${perkText(id)} · ${flawText(id)}`),
						);
					add(face);
				});
				add(
					txt(
						cx,
						y0 + 137,
						t('run.rivals', {
							a: this.charName(run.rivals.chars[0]),
							b: this.charName(run.rivals.chars[1]),
						}),
						7,
						PALETTE.textLight,
						[0.5, 0],
						w - 14,
					),
				);
			} else add(txt(cx, y0 + 100, '?', 34, PALETTE.textDim));
			// Goal and prize rows.
			const rows = this.add.graphics();
			// Label at the left, value at the right edge, in both rows (Goal and prize).
			const inX = x0 + PAD.card;
			const inW = w - 2 * PAD.card;
			const textL = x0 + 2 * PAD.card;
			const textR = x0 + w - 2 * PAD.card;
			rows.fillStyle(PALETTE.panelDark, 1)
				.fillRoundedRect(inX, y0 + 159, inW, 27, RADIUS.button)
				.fillRoundedRect(inX, y0 + 190, inW, 27, RADIUS.button);
			add(rows);
			add(
				txt(textL, y0 + 172.5, t('table.side.goal'), 10, PALETTE.textLight, [0, 0.5]),
				txt(
					textR,
					y0 + 172.5,
					formatPoints(goalOf(run, size), getLang()),
					17,
					PALETTE.manilha,
					[1, 0.5],
				),
				this.add
					.image(textL, y0 + 203.5, tex(this, 'icon.coin'))
					.setScale(0.8)
					.setOrigin(0, 0.5),
				txt(textR, y0 + 203.5, `$${ECONOMY.prize[size]}`, 15, PALETTE.manilha, [1, 0.5]),
			);
			if (!now) {
				panel.setAlpha(0.72);
				return;
			}
			const skip = canSkip(run);
			// Play takes what Skip leaves; Skip is wide enough for its label at the 7 px floor.
			const skipW = 67;
			const playW = skip ? inW - GAP.list - skipW : inW;
			add(
				new Button(this, t('run.play'), () => this.play(), {
					w: playW,
					h: BUTTON_H.primary,
					size: 12,
					color,
					...(skip ? {} : { left: 30 }),
				}).setPosition(inX + playW / 2, y0 + 239),
			);
			if (skip)
				add(
					new Button(
						this,
						t('run.skip'),
						() => {
							const p = skipTable(run);
							if (p)
								this.say(
									t('run.promise', { p: t(`promise.${p}.name` as I18nKey) }),
								);
							this.save();
							this.draw();
						},
						{ w: skipW, h: BUTTON_H.primary, size: TYPE.small },
					).setPosition(inX + inW - skipW / 2, y0 + 239),
				);
		});
	}

	private charName(id: string): string {
		return t((isBossId(id) ? `boss.${id}.name` : `char.${id}`) as I18nKey);
	}

	private play(): void {
		const run = this.run;
		if (!run || this.entering) return;
		this.entering = true;
		startTable(run);
		this.save();
		fadeTo(this, 'Table', { run: true });
	}

	// --- Shop ----------------------------------------------------------------------------

	private offerName(o: Offer): string {
		if (o.kind === 'manha') return t(`manha.${o.id}.name` as I18nKey);
		if (o.kind === 'consumable') return this.consumableName(o.item);
		if (o.kind === 'upgrade') return t(`upgrade.${o.id}.name` as I18nKey);
		return t(`pack.${o.pack}` as I18nKey);
	}

	private offerDesc(o: Offer): string {
		if (o.kind === 'manha') return t(`manha.${o.id}.desc` as I18nKey);
		if (o.kind === 'consumable') return this.consumableDesc(o.item);
		if (o.kind === 'upgrade') return t(`upgrade.${o.id}.desc` as I18nKey);
		return t('pack.desc');
	}

	private offerArt(o: Offer): string {
		if (o.kind === 'manha') return `manha.${o.id}`;
		if (o.kind === 'consumable')
			return o.item.kind === 'simpatia' ? `simpatia.${o.item.id}` : `lance.${o.item.id}`;
		if (o.kind === 'upgrade') return `upgrade.${o.id}`;
		return `pack.${o.pack}`;
	}

	/** Kind label and colour on top of an item card (Manhas show their rarity). */
	private offerTag(o: Offer | PackOption): { tag: string; color: number } {
		if (o.kind === 'manha') {
			const r = MANHA_BY_ID.get(o.id)?.rarity ?? 'common';
			return { tag: t(`rarity.${r}` as I18nKey), color: RARITY_COLOR[r] };
		}
		if (o.kind === 'consumable')
			return {
				tag: t(o.item.kind === 'simpatia' ? 'kind.simpatia' : 'kind.lance'),
				color: PALETTE.cta,
			};
		if (o.kind === 'upgrade') return { tag: t('kind.upgrade'), color: PALETTE.chips };
		if (o.kind === 'card') return { tag: t('kind.card'), color: PALETTE.cardFace };
		return { tag: t('kind.pack'), color: PALETTE.fame };
	}

	/** screen-shop.png: the counter with items on top, packs below, "Renovar" and "Próxima mesa". */
	private drawShop(run: RunState): void {
		const shop = run.shop;
		if (!shop) return;
		const { L } = this;
		if (shop.opened) {
			this.drawPack(run, shop.opened);
			return;
		}
		// Everything sits on the painted chalkboard (its place follows the backdrop's cover fit):
		// title on top, the offers in a row, the packs as slim buttons under them; Renew and Next
		// table go right under the board, on the counter.
		// On windows that are not 16:9 the board can reach under the sidebar or off the stage: the
		// UI keeps to the part of it that is inside the stage, with room for the buttons below.
		const raw = shopSlate(getView(this));
		const x0 = Math.max(raw.x, L + SIDEBAR.x + SIDEBAR.w + GAP.panel);
		const x1 = Math.min(raw.x + raw.w, L + 640 - SAFE.stage);
		const y0 = Math.max(raw.y, SAFE.stage);
		const y1 = Math.min(raw.y + raw.h, 360 - SAFE.stage - 8 - BUTTON_H.primary);
		const slate = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
		const pad = 6;
		const inL = slate.x + pad;
		const inW = slate.w - 2 * pad;
		const mid = slate.x + slate.w / 2;
		this.screenTitle(mid, t('run.shop'), 'cart', slate.y + 13);
		const items = [
			...shop.offers.map((o, i) => ({ o, where: 'offers' as const, i })),
			...(shop.upgrade ? [{ o: shop.upgrade, where: 'upgrade' as const, i: 0 }] : []),
		];
		const packs = shop.packs.map((o, i) => ({ o, where: 'packs' as const, i }));
		type Entry = (typeof items)[number] | (typeof packs)[number];
		const buyer = (e: Entry) => (): void => {
			if (!this.err(buy(run, e.where, e.i))) return;
			sfx(this, 'sfx.shop.buy');
			this.save();
			this.draw();
			this.focusNextBuy(`${e.where}:${e.i}`);
		};
		const titleH = 31;
		const packH = 22;
		const gap = 4;
		const offersTop = slate.y + titleH;
		const cardH = slate.h - titleH - packH - 2 * gap - pad;
		const cardW = Math.min(
			118,
			Math.floor((inW - (Math.max(items.length, 1) - 1) * gap) / Math.max(items.length, 1)),
		);
		const rowW = items.length * cardW + (items.length - 1) * gap;
		for (const [k, e] of items.entries()) {
			const { tag, color } = this.offerTag(e.o);
			const tryBuy = buyer(e);
			this.body.add(
				itemCard(this, {
					art: tex(this, this.offerArt(e.o)),
					title: this.offerName(e.o),
					desc: this.offerDesc(e.o),
					tag,
					color: e.o.sold ? PALETTE.panelLight : color,
					w: cardW,
					h: cardH,
					dim: e.o.sold,
					button: {
						label: e.o.sold ? t('run.sold') : `$${e.o.price}`,
						color: PALETTE.buttonLight,
						enabled: !e.o.sold && run.money >= e.o.price,
						onClick: tryBuy,
						// A click on a price you cannot pay still says why (error sound + message).
						...(e.o.sold ? {} : { onBlocked: tryBuy }),
					},
				})
					.setPosition(
						mid - rowW / 2 + cardW / 2 + k * (cardW + gap),
						offersTop + cardH / 2,
					)
					// Which offer the card sells (QA picks the pack by this, not by its price).
					.setData('offer', `${e.where}:${e.i}`),
			);
		}
		const packW = Math.floor(
			(inW - (Math.max(packs.length, 1) - 1) * gap) / Math.max(packs.length, 1),
		);
		for (const [k, e] of packs.entries()) {
			const tryBuy = buyer(e);
			const holder = this.add
				.container(inL + packW / 2 + k * (packW + gap), slate.y + slate.h - pad - packH / 2)
				.setData('offer', `${e.where}:${e.i}`);
			const b = new Button(
				this,
				`${this.offerName(e.o)} · ${e.o.sold ? t('run.sold') : `$${e.o.price}`}`,
				tryBuy,
				{
					w: packW,
					h: packH,
					size: 8,
					color: PALETTE.buttonLight,
					...(e.o.sold ? {} : { onBlocked: tryBuy }),
				},
			).setEnabled(!e.o.sold && run.money >= e.o.price);
			holder.add(b);
			this.body.add(holder);
		}
		// "Próxima mesa" first: Enter never buys by accident.
		const btnY = slate.y + slate.h + 8 + BUTTON_H.primary / 2;
		const bigW = Math.floor((inW - gap) / 2);
		this.button(
			mid + gap / 2 + bigW / 2,
			btnY,
			t('run.next'),
			() => {
				leaveShop(run);
				this.save();
				this.draw();
			},
			bigW,
			PALETTE.good,
			{ h: BUTTON_H.primary, size: 11, left: 10 },
		);
		const doReroll = (): void => {
			if (!this.err(reroll(run))) return;
			sfx(this, 'sfx.shop.reroll');
			this.save();
			this.draw();
		};
		this.button(
			mid - gap / 2 - bigW / 2,
			btnY,
			t('run.reroll'),
			doReroll,
			bigW,
			PALETTE.manilha,
			{
				h: BUTTON_H.primary,
				size: 11,
				left: 10,
				hint: () => `$${rerollCost(run)}`,
				onBlocked: doReroll,
			},
		).setEnabled(run.money >= rerollCost(run));
	}

	/**
	 * After a buy (keyboard or pad): start the focus on the same slot if it still sells, else on
	 * the next item the money pays for, so buying twice needs no walk back from "Próxima mesa".
	 */
	private focusNextBuy(from: string): void {
		const run = this.run;
		const shop = run?.shop;
		if (!run || !shop || shop.opened) return;
		const all = [
			...shop.offers.map((o, i) => ({ o, id: `offers:${i}` })),
			...(shop.upgrade ? [{ o: shop.upgrade, id: 'upgrade:0' }] : []),
			...shop.packs.map((o, i) => ({ o, id: `packs:${i}` })),
		];
		const k = Math.max(
			0,
			all.findIndex((e) => e.id === from),
		);
		const next = [...all.slice(k), ...all.slice(0, k)].find(
			(e) => !e.o.sold && e.o.price <= run.money,
		);
		if (next) this.nav?.prefer((b) => b.parentContainer?.getData('offer') === next.id);
	}

	/** screen-pack.png: "Escolha 1" with the options as three cards and "Pular". */
	private drawPack(run: RunState, options: PackOption[]): void {
		const { cx } = this;
		sfx(this, 'sfx.pack.open');
		this.screenTitle(cx, t('run.packPick'), 'cards');
		// Four options at the three-option width (4 × 166) overflow the 640 stage.
		const w = options.length > 3 ? 144 : 166;
		const step = w + GAP.card;
		options.forEach((opt, i) => {
			const { tag, color } = this.offerTag(opt);
			const card =
				opt.kind === 'card'
					? {
							art: tex(this, cardArt(opt.card)),
							title: `${opt.card.rank} ${t(`suit.${opt.card.suit}` as I18nKey)}`,
							desc: opt.card.mod
								? `${t(`mod.${opt.card.mod}.name` as I18nKey)}: ${t(`mod.${opt.card.mod}.desc` as I18nKey)}`
								: t('run.cardPlain'),
						}
					: opt.kind === 'manha'
						? {
								art: tex(this, `manha.${opt.id}`),
								title: t(`manha.${opt.id}.name` as I18nKey),
								desc: t(`manha.${opt.id}.desc` as I18nKey),
							}
						: {
								art: tex(
									this,
									opt.item.kind === 'simpatia'
										? `simpatia.${opt.item.id}`
										: `lance.${opt.item.id}`,
								),
								title: this.consumableName(opt.item),
								desc: this.consumableDesc(opt.item),
							};
			this.body.add(
				itemCard(this, {
					...card,
					tag,
					color: opt.kind === 'card' && opt.card.mod ? PALETTE.money : color,
					w,
					h: 200,
					artScale: 1.3,
					button: {
						label: t('run.take'),
						onClick: () => {
							if (!this.err(choosePack(run, i))) return;
							this.save();
							this.draw();
						},
					},
				}).setPosition(cx + (i - (options.length - 1) / 2) * step, 172),
			);
		});
		this.button(
			cx,
			310,
			t('run.skipPack'),
			() => {
				choosePack(run, -1);
				this.save();
				this.draw();
			},
			166,
			undefined,
			{ h: BUTTON_H.primary, size: 12, hint: backHint },
		);
	}

	// --- End -----------------------------------------------------------------------------

	private drawEnd(run: RunState): void {
		const { cx } = this;
		const won = run.phase === 'won';
		const leave = (): void => {
			getSave(this).run = null;
			persist(this);
			fadeTo(this, 'Menu');
		};
		const demo = won && run.demo;
		const L = cx - 200;
		this.box(L, 24, 400, 312, { fill: PALETTE.panelDark, radius: RADIUS.frame });
		this.icon(cx, 50, won ? 'crown' : 'skull', 32);
		this.title(cx, 82, t(demo ? 'demo.end' : won ? 'run.won' : 'run.lost'), 20).setColor(
			toCss(demo ? PALETTE.good : won ? PALETTE.manilha : PALETTE.bad),
		);
		const plural = (key: 'run.end.tables' | 'run.end.hands', n: number): string =>
			t(`${key}.${n === 1 ? 'one' : 'other'}`, { n });
		let top: [string, number] | null = null;
		for (const [id, n] of Object.entries(run.levels))
			if (n !== undefined && n > (top?.[1] ?? 1)) top = [id, n];
		const rows = [
			t('run.champ', { n: run.champ }),
			plural('run.end.tables', run.stats.tables),
			plural('run.end.hands', run.stats.hands),
			t('run.end.best', { n: formatPoints(run.stats.bestHand, getLang()) }),
			t('run.end.money', { n: run.money }),
			top
				? t('run.end.lance', { l: t(`lance.${top[0]}` as I18nKey), n: top[1] })
				: t('run.end.lanceNone'),
		];
		if (!won)
			rows.push(
				t('run.end.lostTo', {
					a: this.charName(run.rivals.chars[0]),
					b: this.charName(run.rivals.chars[1]),
				}),
			);
		const stats = rows.map((s, i) =>
			this.put(0, 108 + i * 17, s, 9, i ? PALETTE.textLight : PALETTE.manilha, [0, 0]),
		);
		// Portrait and stats are one group centred in the panel (the Manhas row starts under it).
		const face = 76;
		const statsX = face + 2 * GAP.card;
		const groupW = statsX + Math.max(...stats.map((s) => s.width));
		const gx = Math.round(cx - groupW / 2);
		for (const s of stats) s.setX(gx + statsX);
		this.body.add(
			this.add
				.image(gx + face / 2, 142, tex(this, `charcard.${run.partner}`))
				.setDisplaySize((face * 3) / 4, face),
		);
		this.put(gx + face / 2, 190, t(`char.${run.partner}` as I18nKey), 9);
		// The demo pitch for the full game sits between the stats and the Manhas.
		if (demo) this.put(cx, 210, t('demo.body'), 8, PALETTE.textLight, [0.5, 0], 368);
		const my = demo ? 240 : 228;
		this.put(gx, my, t('run.end.manhas'), 7, PALETTE.textDim, [0, 0]);
		const slots = this.add.graphics();
		this.body.add(slots);
		for (let i = 0; i < run.manhaSlots; i++) {
			const x = gx + 16 + i * 36;
			slots
				.lineStyle(1.5, PALETTE.panelLight, 1)
				.strokeRoundedRect(x - 16, my + 14, 32, 32, RADIUS.button);
			const id = run.manhas[i];
			if (id)
				this.body.add(
					this.add.image(x, my + 30, tex(this, `manha.${id}`)).setDisplaySize(28, 28),
				);
		}
		const menuW = won ? 180 : 200;
		// Two buttons centred as a pair, a card gap apart.
		const pairX = (menuW + GAP.card) / 2;
		if (demo)
			this.button(
				cx - pairX,
				306,
				t('demo.wishlist'),
				() => openStore(),
				menuW,
				PALETTE.good,
				{
					h: BUTTON_H.primary,
				},
			);
		else if (won)
			this.button(
				cx - pairX,
				306,
				t('run.endless'),
				() => {
					continueEndless(run);
					this.save();
					this.draw();
				},
				menuW,
				PALETTE.good,
				{ h: BUTTON_H.primary },
			);
		this.button(
			won ? cx + pairX : cx,
			306,
			t('table.menu'),
			leave,
			menuW,
			won ? undefined : PALETTE.good,
			{
				h: BUTTON_H.primary,
			},
		);
	}
}

/** Deck viewer order: by rank, the jokers and special cards last (they sit in the clubs row). */
const deckOrder = (c: Card): number =>
	isSpecial(c) ? RANKS.length : RANKS.indexOf(c.rank as Rank);

/** Boss ids appear as rival characters at a boss table. */
const isBossId = (id: string): boolean =>
	id === FINAL_BOSS || (BOSS_POOL as readonly string[]).includes(id);
