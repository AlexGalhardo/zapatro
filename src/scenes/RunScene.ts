import Phaser from 'phaser';
import { CARD_W, COVER_H, COVER_W, cardArt, tex } from '../art/flat';
import { LOGICAL_H } from '../config/constants';
import { IS_DEMO, SHOP_SIMPLE, TRINKETS } from '../config/features';
import { PALETTE, SHOP_RARITY_COLOR, shade, toCss } from '../config/palette';
import { BUTTON_H, GAP, PAD, RADIUS, SAFE, SHADOW, SIDEBAR, TYPE } from '../config/ui';
import { sfx } from '../core/audio';
import { getParams, getSave, persist } from '../core/context';
import { playAmbience, playMusic } from '../core/music';
import { openStore } from '../core/platform';
import { getView } from '../core/viewport';
import { BOSS_POOL, FINAL_BOSS } from '../data/bosses';
import { RUN_MODES, type RunMode, TABLE_SIZES } from '../data/championships';
import { COMPANION_IDS, COMPANIONS, type CompanionId, isCompanion } from '../data/companions';
import type { Consumable } from '../data/consumables';
import { DECK_IDS, DECKS, type DeckId, deckNeedsPartner } from '../data/decks';
import { ECONOMY } from '../data/economy';
import { FEATS } from '../data/feats';
import { isManhaId, MANHA_BY_ID, type Rarity } from '../data/manhas';
import { rarityOfPrice } from '../data/rarity';
import { MAX_STAKE, type StakeChange, stakeChanges } from '../data/stakes';
import { isTrinketId, TRINKET_BY_ID, TRINKET_IDS } from '../data/trinkets';
import { botShop } from '../game/run-sim';
import { getLang, type I18nKey, t } from '../i18n';
import { trinketName, trinketRarityName, trinketTexts } from '../i18n/trinket';
import {
	canStartRun,
	isUnlocked,
	maxStake,
	recordRunStart,
	recordRunState,
	unlockFeat,
} from '../logic/meta';
import { Rng, randomSeed } from '../logic/rng';
import { drawCandidates } from '../logic/run/draw';
import {
	buy,
	continueEndless,
	discardConsumable,
	dropUnfitTrinkets,
	leaveShop,
	moveManha,
	needsTarget,
	newRun,
	type Offer,
	offerPrice,
	parseRun,
	type RunState,
	reroll,
	rerollCost,
	type ShopError,
	type ShopState,
	sellManha,
	sellPrice,
	startTable,
	useConsumable,
} from '../logic/run/run';
import {
	type NextUnlock,
	nextUnlock,
	type RunUnlocks,
	runSummary,
	unlockedThisRun,
} from '../logic/run/summary';
import { equip, levelOf, mergeCollection, unequip } from '../logic/run/trinkets';
import type { RunSetup } from '../logic/save';
import { formatPoints } from '../logic/score/format';
import { type Card, isSpecial, RANKS, type Rank, SUITS } from '../logic/truco/cards';
import { fitArt } from '../logic/viewport';
import { Button } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { itemCard, RARITY_COLOR } from '../ui/item-card';
import { backHint } from '../ui/key-hint';
import { onKey, onSceneEvent } from '../ui/keys';
import { type ButtonNav, buttonNav } from '../ui/nav';
import { offerCard, offerCardHeight } from '../ui/offer-card';
import { drawPanel } from '../ui/panel';
import { fadeTo, setupScreen } from '../ui/screen';
import { addTitle, screenTitle } from '../ui/title';
import { featToast } from '../ui/toast';
import { touchUi, uiPx } from '../ui/touch';
import { levelColor, trinketCard, trinketMedal } from '../ui/trinket-ui';
import { comfort } from '../view/comfort';
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
 * The run between tables (PLAN A4): partner choice, shop, consumables and the end of the run.
 * One screen that redraws from the saved `RunState`.
 * Layouts follow references/concept-art/zapatro (screen-partner, -shop) on the
 * 640×360 stage: `L` is the stage's left edge when the view is wider than 16:9.
 */
export class RunScene extends Phaser.Scene {
	private run: RunState | null = null;
	private debugTrinkets = false;
	/** A table is being entered: draws and key repeats must not start it twice. */
	private entering = false;
	/** The run-end screen already played its music and entrance (a redraw must not repeat them). */
	private endTuned = false;
	/** The New run choices: remembered in the save settings, edited on the setup screen. */
	private setup: RunSetup = { mode: '2v2', stake: 1, deck: 'normal' };
	/** `?stake=N` (test hacks) preselects a Stake without the unlock check. */
	private debugStake = false;
	/** Closes the panel open over the screen (Esc), if any. */
	private closePanel: (() => void) | null = null;
	/** The mode picked on the first screen of a new run (`?mode=1v1` picks it ahead). */
	private mode: RunMode | null = null;
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
		this.mode = getParams(this).mode ?? null;
		this.setup = { ...(save.settings.runSetup ?? this.setup) };
		const debugStake = getParams(this).stake;
		this.debugStake = debugStake !== undefined;
		if (debugStake !== undefined) this.setup.stake = Math.min(MAX_STAKE, debugStake);
		this.tipText = null;
		this.entering = false;
		this.endTuned = false;
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
		if (!this.run && this.mode === '1v1') this.startRun(undefined);
		if (getParams(this).auto) this.time.delayedCall(400, () => this.autoStep());
	}

	/** `?auto=1`: the bot drives the run screens too (smoke and QA). */
	private autoStep(): void {
		if (!this.sys.isActive()) return;
		const run = this.run;
		if (!run) {
			if (this.mode === null) this.confirmSetup();
			else this.choosePartner(this.ensureCandidates()[0] ?? 'bruto');
			if (!this.run) this.time.delayedCall(300, () => this.autoStep());
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
			if (this.mode === null) this.drawSetup();
			else this.drawPartners();
			return;
		}
		if (run.phase === 'won' || run.phase === 'lost') {
			this.drawEnd(run);
			return;
		}
		// The next table starts at once (a saved run mid-Championship too).
		if (run.phase === 'select') {
			this.play();
			return;
		}
		// The main area first: its button is the first one, so it starts focused.
		this.drawShop(run);
		if (SHOP_SIMPLE) return;
		this.drawSidebar(run);
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
		/** Draw at `px` even on a touch screen (the partner cards shrink to fit). */
		exact = false,
	): Phaser.GameObjects.Text {
		const txt = this.add
			.text(x, y, s, {
				fontFamily: UI_FONT,
				fontSize: `${exact ? px : uiPx(px)}px`,
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

	/** An icon over a button. */
	private buttonIcon(x: number, y: number, name: string, size: number): void {
		this.icon(x, y, name, size);
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

	// --- Mode and partner ----------------------------------------------------------------

	/** The text of one Stake rule (`stake.<k>`). */
	private stakeChange(c: StakeChange): string {
		return t(`stake.${c.k}` as I18nKey, 'n' in c ? { n: c.n } : undefined);
	}

	/** What a locked deck asks for: the feat that unlocks it. */
	private deckLockText(deck: DeckId): string {
		const feat = unlockFeat(`deck:${deck}`);
		return t('run.setup.lockedDeck', { feat: feat ? t(`feat.${feat}.desc` as I18nKey) : '' });
	}

	private pickSetup(patch: Partial<RunSetup>, tag: string): void {
		this.setup = { ...this.setup, ...patch };
		getSave(this).settings.runSetup = { ...this.setup };
		persist(this);
		this.nav?.prefer((b) => b.getData('setup') === tag);
		this.draw();
	}

	/** Start (2×2 goes on to the partner choice, 1×1 begins the run); a locked setup does not. */
	private confirmSetup(): void {
		const s = this.setup;
		if (!this.debugStake && !canStartRun(getSave(this).meta, s.mode, s.deck, s.stake)) {
			sfx(this, 'sfx.ui.error');
			this.say(t('run.setup.locked'));
			return;
		}
		getSave(this).settings.runSetup = { ...s };
		persist(this);
		this.mode = s.mode;
		if (s.mode === '1v1') this.startRun(undefined);
		else this.draw();
	}

	/**
	 * First screen of a new run, all on one page: mode, Stake and starting deck, remembered from
	 * the last run, and one button to go on. "Start" is the first button so a first-time player
	 * confirms the defaults (Teams 2×2, Stake 1, normal deck) with a single Enter or tap. Locked
	 * Stakes and decks stay in the rows, dimmed; selecting one explains what unlocks it.
	 */
	private drawSetup(): void {
		const { cx } = this;
		const meta = getSave(this).meta;
		const s = this.setup;
		// The partners are drawn now so the run's seed exists whichever mode is picked.
		this.ensureCandidates();
		const left = cx - 280;
		const controlsX = left + 100;
		const controlsW = 280 * 2 - 100;
		const startable = this.debugStake || canStartRun(meta, s.mode, s.deck, s.stake);
		const bad = PALETTE.bad;

		// First in the scene so the keyboard and the pad start focused on it.
		this.button(
			cx,
			292,
			s.mode === '1v1' ? t('run.setup.start') : t('run.setup.pickPartner'),
			() => this.confirmSetup(),
			220,
			PALETTE.good,
			{ h: BUTTON_H.primary, size: 12, onBlocked: () => this.confirmSetup() },
		).setEnabled(startable);
		this.button(cx, 324, t('menu.back'), () => fadeTo(this, 'Menu'), 100, undefined, {
			hint: backHint,
		});
		this.title(cx, 22, t('run.setup.title'), TYPE.screenTitle);
		const label = (y: number, key: I18nKey): void => {
			this.put(left, y, t(key).toLocaleUpperCase(getLang()), 8, PALETTE.manilha, [0, 0.5]);
		};

		// Mode.
		label(62, 'run.setup.mode');
		const modeW = 150;
		for (const [i, mode] of RUN_MODES.entries()) {
			const b = this.button(
				controlsX + modeW / 2 + i * (modeW + 8),
				62,
				t(`run.mode.${mode}` as I18nKey),
				() => this.pickSetup({ mode }, `mode:${mode}`),
				modeW,
				s.mode === mode ? PALETTE.good : undefined,
				{ h: BUTTON_H.action, size: 10 },
			);
			b.setData('setup', `mode:${mode}`);
		}
		this.put(
			controlsX,
			84,
			t(`run.mode.${s.mode}.desc` as I18nKey),
			7,
			PALETTE.textDim,
			[0, 0.5],
			controlsW,
		);

		// Stake: one numbered button per Stake; the locked ones are dimmed.
		label(116, 'run.setup.stake');
		const top = maxStake(meta, s.deck);
		const stakeW = 52;
		const stakeGap = (controlsW - MAX_STAKE * stakeW) / (MAX_STAKE - 1);
		for (let n = 1; n <= MAX_STAKE; n++) {
			const locked = !this.debugStake && n > top;
			const sx = controlsX + stakeW / 2 + (n - 1) * (stakeW + stakeGap);
			const b = this.button(
				sx,
				116,
				String(n),
				() => this.pickSetup({ stake: n }, `stake:${n}`),
				stakeW,
				s.stake === n ? PALETTE.good : undefined,
				{ h: BUTTON_H.action, size: 11 },
			);
			b.setData('setup', `stake:${n}`);
			if (locked) {
				b.setAlpha(0.6);
				this.icon(sx + stakeW / 2 - 9, 116 - BUTTON_H.action / 2 + 9, 'lock', 12);
			}
		}
		const changes = stakeChanges(s.stake).map((c) => this.stakeChange(c));
		this.put(
			controlsX,
			145,
			`${t('run.setup.stakeN', { n: s.stake })}: ${changes.join(' · ') || t('run.setup.stakeBase')}`,
			7.5,
			PALETTE.textLight,
			[0, 0.5],
			controlsW,
		);
		const stakeLocked = !this.debugStake && s.stake > top;
		this.put(
			controlsX,
			158,
			stakeLocked
				? t('run.setup.lockedStake', { n: s.stake - 1 })
				: s.stake > 1
					? t('run.setup.stakeAll')
					: '',
			7,
			stakeLocked ? bad : PALETTE.textDim,
			[0, 0.5],
			controlsW,
		);

		// Starting deck: the card back and the name of each.
		label(204, 'run.setup.deck');
		const deckW = 86;
		const deckH = 62;
		const deckGap = (controlsW - DECK_IDS.length * deckW) / (DECK_IDS.length - 1);
		for (const [i, id] of DECK_IDS.entries()) {
			const x = controlsX + deckW / 2 + i * (deckW + deckGap);
			const open =
				isUnlocked(meta, `deck:${id}`) && !(s.mode === '1v1' && deckNeedsPartner(id));
			const b = this.button(
				x,
				204,
				'',
				() => this.pickSetup({ deck: id }, `deck:${id}`),
				deckW,
				s.deck === id ? PALETTE.good : undefined,
				{ h: deckH },
			);
			b.setData('setup', `deck:${id}`);
			const back = this.add
				.image(x, 204 - 13, tex(this, `card.back.${DECKS[id].back}`))
				.setScale(0.45);
			const name = this.put(
				x,
				204 + 18,
				t(`deck.${id}.name` as I18nKey),
				7,
				PALETTE.textDark,
				[0.5, 0.5],
				deckW - 6,
			);
			this.body.add(back);
			if (!open) {
				b.setAlpha(0.6);
				back.setAlpha(0.6);
				name.setAlpha(0.7);
				this.icon(x + deckW / 2 - 9, 204 - deckH / 2 + 9, 'lock', 12);
			}
		}
		this.put(
			controlsX,
			242,
			`${t(`deck.${s.deck}.name` as I18nKey)}: ${t(`deck.${s.deck}.desc` as I18nKey)}`,
			7.5,
			PALETTE.textLight,
			[0, 0.5],
			controlsW,
		);
		const deckLock = !isUnlocked(meta, `deck:${s.deck}`)
			? this.deckLockText(s.deck)
			: s.mode === '1v1' && deckNeedsPartner(s.deck)
				? t('run.setup.needsPartner')
				: '';
		this.put(controlsX, 255, deckLock, 7, bad, [0, 0.5], controlsW);
	}

	/**
	 * Partner choice: three rows, each a character card (3:4) on the left and the partner's name,
	 * play style, perk, flaw and passive beside it, with the pick button at the row's right end.
	 * Rows (not columns) because three side-by-side panels leave the texts too narrow at 640 px.
	 * The deck is always the normal one and the Stake 1 (`?stake=N` still presets it for tests).
	 */
	private drawPartners(): void {
		const { cx } = this;
		const offer = this.ensureCandidates();
		// Three panels side by side across the stage, each a grid of two columns: the character
		// card over the panel's whole height on the left (3:4 art, the sides cropped to the column),
		// and on the right the name, style, perk and flaw with the pick button on the base.
		const pad = 5;
		// Pointer screens: title, panels and Back are one block centred on the stage. Touch screens
		// (the text grows to 10 px and spills): the title sits near the top and the cards take the
		// rest, so every section and the pick button stay inside the card, clear of Back.
		const mobile = touchUi.on;
		const BLOCK_GAP = mobile ? 6 : 14;
		const titleH = TYPE.screenTitle;
		const backH = BUTTON_H.primary;
		const panelW = mobile ? 200 : 184;
		const gap = GAP.card;
		let panelH: number;
		let top: number;
		let titleY: number;
		if (mobile) {
			titleY = 18;
			const backTop = this.h - 6 - backH;
			top = Math.round(titleY + titleH / 2 + BLOCK_GAP);
			panelH = backTop - BLOCK_GAP - top;
		} else {
			panelH = COVER_H + 2 * pad;
			const blockH = titleH + BLOCK_GAP + panelH + BLOCK_GAP + backH;
			const blockTop = (this.h - blockH) / 2;
			top = blockTop + titleH + BLOCK_GAP;
			titleY = blockTop + titleH / 2;
		}
		this.title(cx, titleY, t('run.choosePartner'), TYPE.screenTitle);
		const x0 = cx - (3 * panelW + 2 * gap) / 2;
		const cw = COVER_W;
		const ch = mobile ? panelH - 2 * pad : COVER_H;
		const btnH = 24;
		const sub = 4;
		const tx = (i: number): number => x0 + i * (panelW + gap) + pad + cw + pad;
		const tw = panelW - pad - cw - 2 * pad;
		const cards = (id: CompanionId): { title: string; body: string; color: number }[] => [
			{
				title: t('partner.card.style'),
				body: t(`partner.style.${COMPANIONS[id].style}` as I18nKey),
				color: PALETTE.manilha,
			},
			{
				title: t('partner.card.perk'),
				body: t(`companion.${id}.perk` as I18nKey),
				color: PALETTE.good,
			},
			{
				title: t('partner.card.flaw'),
				body: t(`companion.${id}.flaw` as I18nKey),
				color: PALETTE.bad,
			},
		];
		const SUB_PAD = 4;
		/** Name strip at the foot of the card (name at 16 px, capitals) and sub-card title size. */
		const STRIP_H = 28;
		const HEAD_PX = 10.5;
		// Each sub-card's height is that of the tallest of the three panels' in its row, so the
		// rows line up across the panels.
		const probe = (text: string, px: number, exact = false): number => {
			const o = this.put(0, 0, text, px, PALETTE.textLight, [0, 0], tw - 2 * SUB_PAD, exact);
			const h = o.height;
			o.destroy();
			return h;
		};
		const rowHeights = (px: number, exact: boolean): number[] =>
			[0, 1, 2].map((row) =>
				Math.max(
					...offer.map((id) => {
						const c = cards(id)[row];
						return (
							SUB_PAD * 2 +
							probe((c?.title ?? '').toLocaleUpperCase(getLang()), HEAD_PX) +
							1 +
							probe(c?.body ?? '', px, exact)
						);
					}),
				),
			);
		// Touch text starts at the touch minimum. If the three sections still pass the button,
		// step the body down until they sit inside the card.
		let bodyPx = mobile ? 10 : 6.5;
		const room = panelH - 2 * pad - btnH - 4;
		const stackOf = (hs: number[]): number =>
			hs.reduce((sum, h) => sum + h, 0) + sub * Math.max(0, hs.length - 1);
		if (mobile) {
			while (bodyPx > 7 && stackOf(rowHeights(bodyPx, bodyPx < uiPx(bodyPx))) > room) {
				bodyPx -= 0.5;
			}
		}
		const exactBody = mobile && bodyPx < uiPx(bodyPx);
		const heights = rowHeights(bodyPx, exactBody);
		offer.forEach((id, i) => {
			const px = x0 + i * (panelW + gap);
			this.box(px, top, panelW, panelH);
			this.body.add(
				this.add
					.image(
						px + pad + cw / 2,
						top + pad + ch / 2,
						tex(
							this,
							ch > COVER_H ? `charcover.${id}.${Math.round(ch)}` : `charcover.${id}`,
						),
					)
					.setDisplaySize(cw, ch),
			);
			// The name on a dark strip at the foot of the card, as on the table seats.
			const strip = this.add.graphics();
			strip
				.fillStyle(PALETTE.panelDark, 0.96)
				.fillRoundedRect(px + pad, top + pad + ch - STRIP_H, cw, STRIP_H, {
					tl: 0,
					tr: 0,
					bl: 5,
					br: 5,
				});
			this.body.add(strip);
			const name = this.put(
				px + pad + cw / 2,
				top + pad + ch - STRIP_H / 2,
				t(`char.${id}` as I18nKey).toLocaleUpperCase(getLang()),
				16,
				PALETTE.textLight,
			);
			while (
				name.width > cw - 2 * pad &&
				Number.parseInt(String(name.style.fontSize), 10) > 5
			)
				name.setFontSize(Number.parseInt(String(name.style.fontSize), 10) - 1);
			let ty = top + pad;
			for (const [row, c] of cards(id).entries()) {
				const h = heights[row] ?? 0;
				const g = this.add.graphics();
				g.fillStyle(PALETTE.panelLight, 1).fillRoundedRect(tx(i), ty, tw, h, RADIUS.button);
				this.body.add(g);
				const head = this.put(
					tx(i) + SUB_PAD,
					ty + SUB_PAD,
					c.title.toLocaleUpperCase(getLang()),
					HEAD_PX,
					c.color,
					[0, 0],
					tw - 2 * SUB_PAD,
				);
				this.put(
					tx(i) + SUB_PAD,
					head.getBounds().bottom + 1,
					c.body,
					bodyPx,
					PALETTE.textLight,
					[0, 0],
					tw - 2 * SUB_PAD,
					exactBody,
				);
				ty += h + sub;
			}
			this.button(
				tx(i) + tw / 2,
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
			top + panelH + BLOCK_GAP + backH / 2,
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
		this.startRun(id);
	}

	/** Creates the run: with a partner (2×2) or without (1×1, mano a mano). */
	private startRun(partner: CompanionId | undefined): void {
		const meta = getSave(this).meta;
		if (!this.runSeed) this.ensureCandidates();
		this.candidates = [];
		const mode: RunMode = partner ? '2v2' : '1v1';
		// A deck or Stake still locked (`?mode=` skips the setup screen) falls back to the base game.
		const open = this.debugStake || canStartRun(meta, mode, this.setup.deck, this.setup.stake);
		this.run = newRun(
			this.runSeed,
			partner,
			open ? this.setup.deck : 'normal',
			open ? this.setup.stake : 1,
			isUnlocked(meta, 'legendary'),
			IS_DEMO || getParams(this).demo,
			partner ? '2v2' : '1v1',
		);
		// Test hacks for a new run (test-hacks.md): starting money and Manhas.
		const params = getParams(this);
		if (params.money !== undefined) this.run.money = params.money;
		if (params.manhas)
			this.run.manhas = params.manhas.filter(isManhaId).slice(0, this.run.manhaSlots);
		// The profile's trinkets come along (and `?trinkets=` adds some for tests); with any, the
		// first thing is the equip screen, as in the shop between tables.
		mergeCollection(this.run.collection, meta.trinkets);
		// Debug trinkets live only in this run: the profile never learns about them.
		this.debugTrinkets = !!params.trinkets?.length;
		const debug: Record<string, number> = {};
		for (const spec of params.trinkets ?? []) {
			const [tid = '', lv = '1'] = spec.split(':');
			if (isTrinketId(tid)) debug[tid] = Math.min(4, Math.max(1, Number(lv) || 1));
		}
		mergeCollection(this.run.collection, debug);
		for (const tid of Object.keys(this.run.collection)) {
			equip(this.run.trinkets, this.run.collection, tid, this.run.trinketSlots);
		}
		if (TRINKETS && Object.keys(this.run.collection).length) {
			this.run.phase = 'shop';
			this.run.shop = { offers: [], rerolls: 0 };
		}
		dropUnfitTrinkets(this.run);
		recordRunStart(meta, this.run);
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
			run.partner
				? `${t(`char.${run.partner}` as I18nKey)}${run.partner === 'nino' ? ` · ${t('table.lance.level', { n: run.partnerLevel })}` : ''}`
				: t(`run.mode.${run.mode}` as I18nKey),
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
		if (o.kind === 'trinket') return trinketName(o.id);
		if (o.kind === 'manha') return t(`manha.${o.id}.name` as I18nKey);
		return this.consumableName(o.item);
	}

	private offerDesc(o: Offer): string {
		if (o.kind === 'trinket') {
			const x = trinketTexts(o.id, o.level);
			return `${x.perk}\n${x.flaw}`;
		}
		if (o.kind === 'manha') return t(`manha.${o.id}.desc` as I18nKey);
		return this.consumableDesc(o.item);
	}

	private offerArt(o: Offer): string {
		if (o.kind === 'trinket') return `icon.${TRINKET_BY_ID.get(o.id)?.icon ?? 'star'}`;
		if (o.kind === 'manha') return `manha.${o.id}`;
		return o.item.kind === 'simpatia' ? `simpatia.${o.item.id}` : `lance.${o.item.id}`;
	}

	/** Kind label and colour on top of an item card (Manhas show their rarity). */
	private offerTag(o: Offer): { tag: string; color: number } {
		if (o.kind === 'trinket') return { tag: t('trinket.kind'), color: levelColor(o.level) };
		if (o.kind === 'manha') {
			const r = MANHA_BY_ID.get(o.id)?.rarity ?? 'common';
			return { tag: t(`rarity.${r}` as I18nKey), color: RARITY_COLOR[r] };
		}
		return {
			tag: t(o.item.kind === 'simpatia' ? 'kind.simpatia' : 'kind.lance'),
			color: PALETTE.cta,
		};
	}

	/** Rarity of an offer: a Manha's own, else the one its base price falls in (src/data/rarity.ts). */
	private offerRarity(o: Offer): Rarity {
		if (o.kind === 'trinket')
			return (['common', 'uncommon', 'rare', 'legendary'] as const)[o.level - 1] ?? 'common';
		if (o.kind === 'manha') return MANHA_BY_ID.get(o.id)?.rarity ?? 'common';
		return rarityOfPrice(ECONOMY.consumablePrice);
	}

	/** Saves the run and keeps the profile's collection up to date (it survives between runs). */
	private syncCollection(run: RunState): void {
		if (!this.debugTrinkets) mergeCollection(getSave(this).meta.trinkets, run.collection);
		this.save();
	}

	/**
	 * The trinket shop (docs/trinkets.md), two columns on the chalkboard: the four offers on the
	 * left; on the right the equipped slots (click to take one off) above the collection (click to
	 * equip). "Next table" sits at the bottom-right of the screen, off the board. Money is on the
	 * title row.
	 */
	private drawTrinketShop(
		run: RunState,
		shop: ShopState,
		slate: { x: number; y: number; w: number; h: number },
	): void {
		// One inset from the chalkboard, one gap between cards, a wider gap before the loadout.
		// The grid uses the board's height under the title (Next table is outside the frame), and
		// each card stays no wider than it is tall.
		const PAD = 6;
		const GAP = 6;
		const COL_GAP = 16;
		const left = slate.x + PAD;
		const right = slate.x + slate.w - PAD;
		const usableW = right - left;
		const leftW = Math.floor(usableW * 0.62);
		const titleY = slate.y + PAD + 13;
		const bodyTop = titleY + 14 + GAP;
		const bodyBottom = slate.y + slate.h - PAD;
		const bodyH = Math.max(48, Math.floor(bodyBottom - bodyTop));
		const cardH = Math.floor((bodyH - GAP) / 2);
		const cardW = Math.min(Math.floor((leftW - GAP) / 2), cardH);
		const gridW = cardW * 2 + GAP;
		const loadX = left + gridW + COL_GAP;
		const loadW = Math.max(80, right - loadX);
		const items = shop.offers;
		this.body.add(
			addTitle(this, left, titleY, t('run.shop'), TYPE.screenTitle, PALETTE.manilha, 0),
		);
		this.body.add(
			addTitle(this, right, titleY, `$${run.money}`, TYPE.screenTitle, PALETTE.manilha, 1),
		);
		for (const [k, o] of items.entries()) {
			if (o.kind !== 'trinket') continue;
			const buyIt = (): void => {
				if (!this.err(buy(run, k))) return;
				sfx(this, 'sfx.shop.buy');
				this.syncCollection(run);
				this.draw();
			};
			const price = offerPrice(run, o);
			this.body.add(
				trinketCard(this, {
					id: o.id,
					level: o.level,
					w: cardW,
					h: cardH,
					...(o.sold ? { sold: { label: t('run.sold') } } : {}),
					price: {
						label: price === 0 ? t('shop.free') : `$${price}`,
						enabled: !o.sold && run.money >= price,
						onClick: buyIt,
						...(o.sold ? {} : { onBlocked: buyIt }),
					},
				})
					.setPosition(
						left + cardW / 2 + (k % 2) * (cardW + GAP),
						bodyTop + cardH / 2 + Math.floor(k / 2) * (cardH + GAP),
					)
					.setData('offer', `offers:${k}`),
			);
		}
		this.drawLoadout(run, loadX, bodyTop, loadW, bodyH);
		// Bottom-right of the visible screen, under the chalkboard when the frame has room below it.
		const NEXT_H = 28;
		const NEXT_W = 140;
		const REROLL_W = 120;
		const view = getView(this);
		const fit = fitArt(view);
		const worldRight = 320 + view.width / fit / 2;
		const worldBottom = 180 + view.height / fit / 2;
		const edge = SAFE.stage;
		let nextY = worldBottom - edge - NEXT_H / 2;
		const below = slate.y + slate.h + edge + NEXT_H / 2;
		if (nextY - NEXT_H / 2 < slate.y + slate.h && below + NEXT_H / 2 <= worldBottom - edge) {
			nextY = below;
		}
		this.button(
			worldRight - edge - NEXT_W / 2,
			nextY,
			t('run.next'),
			() => {
				leaveShop(run);
				this.save();
				this.draw();
			},
			NEXT_W,
			PALETTE.good,
			{ h: NEXT_H, size: 12 },
		);
		const doReroll = (): void => {
			if (!this.err(reroll(run))) return;
			sfx(this, 'sfx.shop.reroll');
			this.save();
			this.draw();
		};
		const cost = rerollCost(run);
		this.button(
			worldRight - edge - NEXT_W - GAP - REROLL_W / 2,
			nextY,
			`${t('run.reroll')} $${cost}`,
			doReroll,
			REROLL_W,
			PALETTE.manilha,
			{ h: NEXT_H, size: 12, onBlocked: doReroll },
		).setEnabled(run.money >= cost);
	}

	/** Right column of the trinket shop: equipped slots, then the collection (clicks swap them). */
	private drawLoadout(run: RunState, x: number, y: number, w: number, h: number): void {
		const slots = 4;
		const gap = 6;
		const blockGap = 10;
		const labelH = 14;
		// A fixed size: the row used to grow with the column and sit against both labels.
		const slot = Math.min(28, Math.floor((w - gap * (slots - 1)) / slots));
		const label = (lx: number, ly: number, s: string): void => {
			this.body.add(
				this.add.text(lx, ly, s, {
					fontFamily: UI_FONT,
					fontSize: `${uiPx(6)}px`,
					fontStyle: '700',
					color: toCss(PALETTE.textLight),
					shadow: TEXT_SHADOW,
				}),
			);
		};
		label(x, y, t('trinket.equipped'));
		const slotsY = y + labelH + blockGap + slot / 2;
		const hover = (target: Phaser.GameObjects.GameObject, id: string, level: number): void => {
			const v = trinketTexts(id, level);
			target.on('pointerover', () =>
				this.tip(
					x + w / 2,
					y + h,
					`${trinketName(id)} · ${trinketRarityName(level)}\n+ ${v.perk}\n− ${v.flaw}`,
					levelColor(level),
				),
			);
			target.on('pointerout', () => this.tipText?.setVisible(false));
		};
		for (let i = 0; i < slots; i++) {
			const cx = x + slot / 2 + i * (slot + gap);
			const g = this.add.graphics();
			g.lineStyle(1.5, PALETTE.panelLight, i < run.trinketSlots ? 1 : 0.3).strokeRoundedRect(
				cx - slot / 2,
				slotsY - slot / 2,
				slot,
				slot,
				RADIUS.button,
			);
			this.body.add(g);
			const id = run.trinkets[i];
			const level = id ? levelOf(run.collection, id) : 0;
			if (!id || level < 1) continue;
			const m = trinketMedal(this, id, level, slot - 4).setPosition(cx, slotsY);
			const zone = this.add
				.zone(cx, slotsY, slot, slot)
				.setInteractive({ useHandCursor: true });
			zone.on('pointerdown', () => {
				unequip(run.trinkets, id);
				sfx(this, 'sfx.ui.confirm');
				this.save();
				this.draw();
			});
			hover(zone, id, level);
			this.body.add([m, zone]);
		}
		const listLabel = slotsY + slot / 2 + blockGap;
		label(x, listLabel, t('trinket.collection'));
		const listTop = listLabel + labelH + blockGap;
		const owned = TRINKET_IDS.filter((id) => levelOf(run.collection, id) >= 1);
		if (!owned.length) {
			this.body.add(
				this.add
					.text(x, listTop + 2, t('trinket.noCollection'), {
						fontFamily: UI_FONT,
						fontSize: `${uiPx(6)}px`,
						fontStyle: '700',
						color: toCss(PALETTE.textDim),
						wordWrap: { width: w },
					})
					.setOrigin(0, 0),
			);
			return;
		}
		// 8 per row (the 32 trinkets fill 4 rows); the medal is twice the old 16 px.
		const d = 32;
		const cols = Math.min(8, Math.max(1, Math.floor((w + gap) / (d + gap))));
		const rows = Math.max(1, Math.floor((y + h - listTop + gap) / (d + gap)));
		for (const [i, id] of owned.slice(0, cols * rows).entries()) {
			const level = levelOf(run.collection, id);
			const cx = x + d / 2 + (i % cols) * (d + gap);
			const cy = listTop + d / 2 + Math.floor(i / cols) * (d + gap);
			const m = trinketMedal(this, id, level, d).setPosition(cx, cy);
			const on = run.trinkets.includes(id);
			if (on) m.setAlpha(0.35);
			const zone = this.add.zone(cx, cy, d, d).setInteractive({ useHandCursor: true });
			zone.on('pointerdown', () => {
				if (on || !equip(run.trinkets, run.collection, id, run.trinketSlots)) {
					sfx(this, 'sfx.ui.error');
					return;
				}
				sfx(this, 'sfx.ui.confirm');
				this.save();
				this.draw();
			});
			hover(zone, id, level);
			this.body.add([m, zone]);
		}
	}

	/**
	 * The reduced shop (`SHOP_SIMPLE`): the money in a corner of the chalkboard, the three offers
	 * as rarity cards in the middle and "Next table" centred at its foot.
	 */
	private drawShopSimple(
		run: RunState,
		shop: ShopState,
		slate: { x: number; y: number; w: number; h: number },
	): void {
		const mid = slate.x + slate.w / 2;
		const items = shop.offers;
		// The block uses 80% of the board's width (10% free each side) and keeps 6% of its height
		// free above and below, so nothing touches the wooden frame.
		const usableW = slate.w * 0.8;
		const margin = slate.h * 0.06;
		const gap = 8;
		const cardW = Math.floor((usableW - (items.length - 1) * gap) / Math.max(items.length, 1));
		const rowW = items.length * cardW + (items.length - 1) * gap;
		const left = mid - rowW / 2;
		const right = mid + rowW / 2;
		const nextH = 24;
		// The cards take their content's height, but never more than what is left under the title
		// once "Next table" and its gap are in: it sits below them, inside the board.
		const cardH = Math.min(
			offerCardHeight(
				this,
				cardW,
				items.map((o) => this.offerDesc(o)),
			),
			slate.h - 2 * margin - nextH - gap - 26,
		);
		// The whole block (title row, cards, button) sits in the middle of the board, top and bottom.
		const yOff = Math.max(margin, (slate.h - (26 + cardH + gap + nextH)) / 2);
		const titleY = slate.y + yOff + 12;
		const top = slate.y + yOff + 26;
		// Title at the left edge of the first card; the money, the same lettering, at the right.
		this.body.add(
			addTitle(this, left, titleY, t('run.shop'), TYPE.screenTitle, PALETTE.manilha, 0),
		);
		this.body.add(
			addTitle(this, right, titleY, `$${run.money}`, TYPE.screenTitle, PALETTE.manilha, 1),
		);
		for (const [k, o] of items.entries()) {
			const rarity = this.offerRarity(o);
			const tryBuy = (): void => {
				if (!this.err(buy(run, k))) return;
				sfx(this, 'sfx.shop.buy');
				this.save();
				this.draw();
				this.focusNextBuy(`offers:${k}`);
			};
			this.body.add(
				offerCard(this, {
					art: tex(this, this.offerArt(o)),
					name: this.offerName(o),
					kind: o.kind === 'manha' ? t('kind.manha') : this.offerTag(o).tag,
					desc: this.offerDesc(o),
					rarity: {
						id: rarity,
						label: t(`shop.rarity.${rarity}` as I18nKey),
						color: SHOP_RARITY_COLOR[rarity],
					},
					w: cardW,
					h: cardH,
					...(o.sold ? { sold: { label: t('run.sold') } } : {}),
					price: {
						label: offerPrice(run, o) === 0 ? t('shop.free') : `$${offerPrice(run, o)}`,
						enabled: !o.sold && run.money >= offerPrice(run, o),
						onClick: tryBuy,
						...(o.sold ? {} : { onBlocked: tryBuy }),
					},
				})
					.setPosition(left + cardW / 2 + k * (cardW + gap), top + cardH / 2)
					.setData('offer', `offers:${k}`),
			);
		}
		const nextW = 2 * cardW + gap;
		this.button(
			mid,
			top + cardH + gap + nextH / 2,
			t('run.next'),
			() => {
				leaveShop(run);
				this.save();
				this.draw();
			},
			nextW,
			PALETTE.good,
			{ h: nextH, size: 13 },
		);
	}

	/** screen-shop.png: the counter with the items on top, "Renovar" and "Próxima mesa". */
	private drawShop(run: RunState): void {
		const shop = run.shop;
		if (!shop) return;
		const { L } = this;
		// Everything sits on the painted chalkboard (its place follows the backdrop's cover fit):
		// title on top, the offers in a row; Renew and Next table go right under the board, on the
		// counter.
		// On windows that are not 16:9 the board can reach under the sidebar or off the stage: the
		// UI keeps to the part of it that is inside the stage, with room for the buttons below.
		const raw = shopSlate(getView(this));
		const x0 = Math.max(
			raw.x,
			SHOP_SIMPLE ? L + SAFE.stage : L + SIDEBAR.x + SIDEBAR.w + GAP.panel,
		);
		const x1 = Math.min(raw.x + raw.w, L + 640 - SAFE.stage);
		const y0 = Math.max(raw.y, SAFE.stage);
		const y1 = Math.min(
			raw.y + raw.h,
			360 - SAFE.stage - (SHOP_SIMPLE ? 0 : 8 + BUTTON_H.primary),
		);
		const slate = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
		if (TRINKETS) {
			this.drawTrinketShop(run, shop, slate);
			return;
		}
		if (SHOP_SIMPLE) {
			this.drawShopSimple(run, shop, slate);
			return;
		}
		const pad = 6;
		const inW = slate.w - 2 * pad;
		const mid = slate.x + slate.w / 2;
		this.screenTitle(mid, t('run.shop'), 'cart', slate.y + 13);
		const items = shop.offers.map((o, i) => ({ o, i }));
		type Entry = (typeof items)[number];
		const buyer = (e: Entry) => (): void => {
			if (!this.err(buy(run, e.i))) return;
			sfx(this, 'sfx.shop.buy');
			this.save();
			this.draw();
			this.focusNextBuy(`offers:${e.i}`);
		};
		const titleH = 31;
		const gap = 4;
		const offersTop = slate.y + titleH;
		const cardH = slate.h - titleH - gap - pad;
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
					// Which offer the card sells (QA picks it by this, not by its price).
					.setData('offer', `offers:${e.i}`),
			);
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
		if (!run || !shop) return;
		const all = shop.offers.map((o, i) => ({ o, id: `offers:${i}` }));
		const k = Math.max(
			0,
			all.findIndex((e) => e.id === from),
		);
		const next = [...all.slice(k), ...all.slice(0, k)].find(
			(e) => !e.o.sold && e.o.price <= run.money,
		);
		if (next) this.nav?.prefer((b) => b.parentContainer?.getData('offer') === next.id);
	}

	// --- End -----------------------------------------------------------------------------

	/** The run's summary: the result, how far it went, what scored, what it unlocked and what is next. */
	private drawEnd(run: RunState): void {
		const { cx } = this;
		const meta = getSave(this).meta;
		const s = runSummary(run);
		const got = unlockedThisRun(meta, run);
		const next = nextUnlock(meta);
		const demo = s.won && s.demo;
		if (!this.endTuned) {
			this.endTuned = true;
			playMusic(this, s.won ? 'music.win' : 'music.lose', {
				once: true,
				after: 'music.menu',
			});
			if (!comfort.reduceFlashes)
				this.tweens.add({
					targets: this.body,
					alpha: { from: 0, to: 1 },
					y: { from: 8, to: 0 },
					duration: 360,
					ease: 'Cubic.easeOut',
				});
		}
		const leave = (): void => {
			getSave(this).run = null;
			persist(this);
			fadeTo(this, 'Menu');
		};
		const again = (): void => {
			getSave(this).run = null;
			persist(this);
			fadeTo(this, 'Run', { fresh: true });
		};
		const W = 540;
		const L = cx - W / 2;
		const IN = 14;
		this.box(L, 10, W, 340, { fill: PALETTE.panelDark, radius: RADIUS.frame });

		// Header: the result, then how far it went.
		this.icon(L + 34, 38, s.won ? 'crown' : 'skull', 30);
		const head = this.put(
			L + 62,
			32,
			t(demo ? 'demo.end' : s.won ? 'run.won' : 'run.lost'),
			18,
			demo ? PALETTE.good : s.won ? PALETTE.manilha : PALETTE.bad,
			[0, 0.5],
		);
		head.setShadow(-2, 3, toCss(PALETTE.shadow), 0, true, true);
		const how = [
			t('run.champ', { n: s.champ }),
			t(`table.side.table.${TABLE_SIZES[s.table]}` as I18nKey),
			t(`run.mode.${s.mode}` as I18nKey),
			t('run.stake', { n: s.stake }),
			t(`deck.${s.deck}.name` as I18nKey),
		].join(' · ');
		this.put(L + 62, 52, how, 8, PALETTE.textDim, [0, 0.5], W - 62 - 70);
		if (!s.won)
			this.put(
				L + 62,
				64,
				run.mode === '1v1'
					? t('run.end.lostTo1v1', { a: this.charName(run.rivals.chars[0]) })
					: t('run.end.lostTo', {
							a: this.charName(run.rivals.chars[0]),
							b: this.charName(run.rivals.chars[1]),
						}),
				8,
				PALETTE.textLight,
				[0, 0.5],
				W - 62 - 70,
			);
		if (s.partner)
			this.body.add(
				this.add
					.image(L + W - IN - 20, 40, tex(this, `charcard.${s.partner}`))
					.setDisplaySize(36, 48),
			);

		// Three tiles: the best hand, the item that scored most, the tables won.
		const tileY = 78;
		const tileH = 68;
		const tileW = (W - 2 * IN - 2 * GAP.card) / 3;
		const tile = (i: number, label: string): { x: number; y: number } => {
			const x = L + IN + i * (tileW + GAP.card);
			this.box(x, tileY, tileW, tileH, { fill: PALETTE.panel });
			this.put(x + tileW / 2, tileY + 9, label, 7, PALETTE.textDim);
			return { x: x + tileW / 2, y: tileY };
		};
		const best = tile(0, t('run.end.bestTitle'));
		this.put(best.x, best.y + 36, formatPoints(s.bestHand, getLang()), 18, PALETTE.manilha);
		const top = tile(1, t('run.end.item'));
		if (s.topItem) {
			const { kind, id, points } = s.topItem;
			const level = kind === 'trinket' ? levelOf(run.collection, id) : 0;
			const name = kind === 'trinket' ? trinketName(id) : t(`manha.${id}.name` as I18nKey);
			if (kind === 'trinket' && level > 0)
				this.body.add(trinketMedal(this, id, level, 22).setPosition(top.x, top.y + 28));
			else
				this.body.add(
					this.add
						.image(top.x, top.y + 28, tex(this, `manha.${id}`))
						.setDisplaySize(22, 22),
				);
			this.put(top.x, top.y + 46, name, 8, PALETTE.textLight, [0.5, 0.5], tileW - 12);
			this.put(
				top.x,
				top.y + 58,
				t('run.end.itemPts', { n: formatPoints(points, getLang()) }),
				8,
				PALETTE.manilha,
			);
		} else this.put(top.x, top.y + 38, t('run.end.itemNone'), 8, PALETTE.textDim);
		const won = tile(2, t('run.end.tablesWon'));
		this.put(won.x, won.y + 28, String(s.tables), 18, PALETTE.textLight);
		this.put(
			won.x,
			won.y + 46,
			t(`run.end.hands.${s.hands === 1 ? 'one' : 'other'}`, { n: s.hands }),
			8,
			PALETTE.textDim,
		);
		this.put(won.x, won.y + 58, t('run.end.money', { n: s.money }), 8, PALETTE.textDim);

		// The trinkets the run ended with, and the seed.
		const rowY = tileY + tileH + GAP.card;
		const rowH = 50;
		const seedW = 190;
		const trinW = W - 2 * IN - GAP.card - seedW;
		this.box(L + IN, rowY, trinW, rowH, { fill: PALETTE.panel });
		this.put(L + IN + 8, rowY + 9, t('run.end.trinkets'), 7, PALETTE.textDim, [0, 0.5]);
		if (!s.trinkets.length)
			this.put(
				L + IN + 8,
				rowY + 32,
				t('run.end.trinketsNone'),
				8,
				PALETTE.textDim,
				[0, 0.5],
			);
		s.trinkets.forEach((id, i) => {
			const level = levelOf(run.collection, id);
			if (level < 1) return;
			const x = L + IN + 22 + i * 36;
			const y = rowY + 32;
			const zone = this.add.zone(x, y, 30, 30).setInteractive();
			zone.on('pointerover', () =>
				this.tip(
					x,
					y + 20,
					`${trinketName(id)} · ${trinketRarityName(level)}`,
					levelColor(level),
				),
			);
			zone.on('pointerout', () => this.tipText?.setVisible(false));
			this.body.add([trinketMedal(this, id, level, 28).setPosition(x, y), zone]);
		});
		const sx = L + IN + trinW + GAP.card;
		this.box(sx, rowY, seedW, rowH, { fill: PALETTE.panel });
		this.put(sx + 8, rowY + 9, t('run.end.seed'), 7, PALETTE.textDim, [0, 0.5]);
		this.put(sx + 8, rowY + 32, String(s.seed), 11, PALETTE.textLight, [0, 0.5]);
		this.button(
			sx + seedW - 38,
			rowY + 32,
			t('run.end.copy'),
			() => this.copySeed(s.seed),
			60,
			undefined,
			{ h: BUTTON_H.small, size: 8 },
		);

		// What the run unlocked and what is missing for the next one.
		const unY = rowY + rowH + GAP.card;
		const unH = 84;
		const half = (W - 2 * IN - GAP.card) / 2;
		this.box(L + IN, unY, half, unH, { fill: PALETTE.panel });
		this.put(L + IN + 8, unY + 9, t('run.end.unlocked'), 7, PALETTE.textDim, [0, 0.5]);
		const lines = unlockLines(got, s.deck);
		const shown = lines.slice(0, 4);
		if (!lines.length)
			this.put(L + IN + 8, unY + 36, t('run.end.unlockedNone'), 8, PALETTE.textDim, [0, 0.5]);
		for (const [i, line] of shown.entries())
			this.put(L + IN + 8, unY + 24 + i * 13, line, 8, PALETTE.good, [0, 0.5], half - 16);
		if (lines.length > shown.length)
			this.put(
				L + IN + half - 8,
				unY + unH - 9,
				t('run.end.more', { n: lines.length - shown.length }),
				7,
				PALETTE.textDim,
				[1, 0.5],
			);
		const nx = L + IN + half + GAP.card;
		this.box(nx, unY, half, unH, { fill: PALETTE.panel });
		this.put(nx + 8, unY + 9, t('run.end.next'), 7, PALETTE.textDim, [0, 0.5]);
		this.put(
			nx + 8,
			unY + 24,
			nextText(next),
			8,
			next ? PALETTE.textLight : PALETTE.textDim,
			[0, 0],
			half - 16,
		);

		// New run in one tap, the main menu, and the one extra the end offers.
		const by = unY + unH + GAP.card + BUTTON_H.primary / 2 + 2;
		const bw = 150;
		const extra = demo
			? { label: t('demo.wishlist'), fn: () => openStore() }
			: s.won
				? {
						label: t('run.endless'),
						fn: () => {
							continueEndless(run);
							this.save();
							this.endTuned = false;
							this.draw();
						},
					}
				: null;
		const step = bw + GAP.card;
		const row = (n: number): number[] =>
			Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * step);
		const slots = row(extra ? 3 : 2);
		const primary = { h: BUTTON_H.primary };
		let k = 0;
		if (extra)
			this.button(slots[k++] ?? cx, by, extra.label, extra.fn, bw, PALETTE.good, primary);
		this.button(
			slots[k++] ?? cx,
			by,
			t('run.end.new'),
			again,
			bw,
			extra ? undefined : PALETTE.good,
			primary,
		);
		this.button(slots[k] ?? cx, by, t('table.menu'), leave, bw, undefined, primary);
	}

	/** Copies the seed; where the Clipboard API is missing or refused, it is shown to be read. */
	private copySeed(seed: number): void {
		const text = String(seed);
		const shown = (): void => {
			try {
				window.prompt(t('run.end.seed'), text);
			} catch {
				// Some shells (Electron) have no prompt: the line below still shows the seed.
			}
			this.say(t('run.end.seedShown', { n: text }));
		};
		const clip = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
		if (clip) clip.writeText(text).then(() => this.say(t('run.end.copied')), shown);
		else shown();
	}
}

/** What the run unlocked as lines: each feat (with the content it opened) and a new Stake. */
function unlockLines(got: RunUnlocks, deck: DeckId): string[] {
	const name = (key: string): string =>
		key.startsWith('deck:')
			? t(`deck.${key.slice(5)}.name` as I18nKey)
			: t(`char.${key.slice(8)}` as I18nKey);
	const lines = got.feats.map((id) => {
		const opens = FEATS.find((f) => f.id === id)?.unlocks;
		return `★ ${t(`feat.${id}.name` as I18nKey)}${opens ? ` → ${name(opens)}` : ''}`;
	});
	if (got.stake !== null)
		lines.push(
			`★ ${t('run.end.stakeOpen', { n: got.stake, deck: t(`deck.${deck}.name` as I18nKey) })}`,
		);
	return lines;
}

/** The next unlock in the player's words: the feat's own description, or the next Stake. */
function nextText(next: NextUnlock | null): string {
	if (!next) return t('run.end.next.none');
	if (next.kind === 'stake')
		return t('run.end.next.stake', {
			n: next.stake,
			deck: t(`deck.${next.deck}.name` as I18nKey),
		});
	const count = next.need > 1 ? ` (${next.have}/${next.need})` : '';
	return `${t(`feat.${next.feat}.desc` as I18nKey)}${count}`;
}

/** Deck viewer order: by rank, the jokers and special cards last (they sit in the clubs row). */
const deckOrder = (c: Card): number =>
	isSpecial(c) ? RANKS.length : RANKS.indexOf(c.rank as Rank);

/** Boss ids appear as rival characters at a boss table. */
const isBossId = (id: string): boolean =>
	id === FINAL_BOSS || (BOSS_POOL as readonly string[]).includes(id);
