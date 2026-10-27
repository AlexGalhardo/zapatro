import Phaser from 'phaser';
import { CARD_H, CARD_W, canvasTex, cardArt, drawKey, markedArt, panelTex, tex } from '../art/flat';
import { GAME_SPEEDS, type GameSpeed } from '../config/constants';
import { PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, DEPTH, GAP, PAD, RADIUS, SAFE, SHADOW, SIDEBAR, TYPE } from '../config/ui';
import { sfx, voice } from '../core/audio';
import { getParams, getSave, persist } from '../core/context';
import { shake, zoomPunch } from '../core/feel';
import { duckMusic, playAmbience, playMusic } from '../core/music';
import { pokiGameplay } from '../core/poki';
import { trackZoom } from '../core/viewport';
import { AI_PROFILE_IDS, AI_PROFILES, type AiProfileId } from '../data/ai-profiles';
import { BOSS_POOL, type BossId, FINAL_BOSS } from '../data/bosses';
import { CHAMPIONSHIPS, type ChampionshipId } from '../data/championships';
import { type Expression, SIGN_CATEGORY, SIGN_MARK, TABLE_TIMING } from '../data/characters';
import { COMPANION_IDS, COMPANIONS, type CompanionId, isCompanion } from '../data/companions';
import { JOKER_EFFECTS } from '../data/jokers';
import type { Action as KeyAction } from '../data/keybinds';
import type { LanceId } from '../data/lances';
import { isManhaId } from '../data/manhas';
import { DUCK, type VoLine } from '../data/sfx';
import { SPECIAL_CARDS, specialOf } from '../data/specials';
import { TUTORIAL_DEAL, type TutorialAnchor, type TutorialTrigger } from '../data/tutorial';
import { Match, manilhasSeen, type SeatBrain } from '../game/match';
import { RemoteMatch } from '../game/remote-match';
import { GOOD_BOT } from '../game/run-sim';
import { rivalBrain, tableMatch } from '../game/run-table';
import { seatTraits } from '../game/traits';
import { getLang, type I18nKey, t } from '../i18n';
import { honestSign } from '../logic/ai/decide';
import { actionFor } from '../logic/keybinds';
import { recordHand, recordRunEnd, recordRunState, recordTable } from '../logic/meta';
import { Rng, randomSeed } from '../logic/rng';
import { championshipId, finishTable, parseRun, type RunState, tableSize } from '../logic/run/run';
import { formatPoints } from '../logic/score/format';
import { type ScoreStep, tableGoal, totals } from '../logic/score/score';
import { TOUCH_TEXT_MIN } from '../logic/touch';
import {
	type Card,
	isSpecial,
	isZap,
	JOKER,
	manilhaOf,
	parseCard,
	RANKS,
	SUITS,
	standardDeck,
	strength,
} from '../logic/truco/cards';
import {
	type Action,
	jokerEffects,
	type PlayEffect,
	type Seat,
	SIGNS,
	type Sign,
	type TableEvent,
	type Team,
	teamOf,
} from '../logic/truco/table';
import type { ViewSize } from '../logic/viewport';
import type { NetClient } from '../net/client';
import type { ServerMessage, TableSnapshot, TableStart } from '../net/protocol';
import { Button } from '../ui/Button';
import { TEXT_SHADOW, UI_FONT } from '../ui/font';
import { actionHint, hintMode } from '../ui/key-hint';
import { onKey, onSceneEvent } from '../ui/keys';
import { type ButtonNav, buttonNav } from '../ui/nav';
import { drawPanel } from '../ui/panel';
import { fadeTo } from '../ui/screen';
import { featToast } from '../ui/toast';
import { touchUi, uiPx } from '../ui/touch';
import { comfort } from '../view/comfort';
import { artToView, fitCamera } from '../view/stage';
import { setBackdrop } from './BackdropScene';

const CALL_KEY: Record<number, I18nKey> = {
	3: 'table.call.3',
	6: 'table.call.6',
	9: 'table.call.9',
	12: 'table.call.12',
};

/** Press this long on a card to read its strength (touch) instead of playing it. */
const HOLD_MS = 350;

/** A tip opened by a touch closes by itself after this long (ms). */
const TIP_MS = 4000;

/** Row height of the signal picker (touch buttons are taller). */
const CALL_BTN = [3, 6, 9, 12];
const SIGN_ROW = (): number => (touchUi.on ? 24 : 18);

const isBoss = (id: string): boolean =>
	id === FINAL_BOSS || (BOSS_POOL as readonly string[]).includes(id);

const SUIT_MARK: Record<string, string> = { diamonds: '♦', spades: '♠', hearts: '♥', clubs: '♣' };

/** Colours the ZAP's glow runs through. */
const ZAP_GLOW = [
	PALETTE.manilha,
	PALETTE.mult,
	PALETTE.fame,
	PALETTE.chips,
	PALETTE.good,
] as const;

/** A small white dot for the ZAP's sparkles (tinted by the emitter). */
function sparkTexture(scene: Phaser.Scene): string {
	return canvasTex(scene, 'fx.spark', 4, 4, (ctx) => {
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(2, 2, 2, 0, Math.PI * 2);
		ctx.fill();
	});
}

const CALL_VO: Record<number, VoLine> = { 3: 'truco', 6: 'seis', 9: 'nove', 12: 'doze' };

/*
 * Layout of the table on the 640×360 stage (docs/visual.md): the felt table in the middle, the
 * partner on top, the rivals on the sides, your hand at the bottom.
 */

/**
 * Where each seat's character (or your hand) and played card sit. The top and bottom cards are
 * staggered 28 px sideways and the lower one is drawn on top (`PLAYED_DEPTH`), so both rank
 * indices (top-left corner) stay readable (BUGS.md B-04).
 */
const SEAT_POS: Record<Seat, { portrait: [number, number]; play: [number, number] }> = {
	0: { portrait: [390, 345], play: [390, 225] },
	1: { portrait: [586, 162], play: [437, 179] },
	2: { portrait: [345, 46], play: [390, 133] },
	3: { portrait: [195, 162], play: [344, 179] },
};

/** Avatars on the table: characters (48 px art) and bosses (96 px art) both end up this wide. */
const AVATAR = 64;

/**
 * Per seat: top-left of the avatar card (portrait + name plate below it), top-left of the first
 * card-back tile and the step to the next, and where the speech bubble sits (`tail`: which
 * side of it points at the avatar; a bottom tail anchors the bubble's bottom centre, so a
 * wrapped line grows upwards, a left tail its left middle). Measured on
 * references/concept-art/zapatro/screen-table.png.
 */
const SEAT_UI: Record<
	Exclude<Seat, 0>,
	{
		avatar: [number, number];
		backs: [number, number];
		step: [number, number];
		bubble: [number, number];
		tail: 'left' | 'bottom';
	}
> = {
	1: {
		avatar: [554, 130],
		backs: [513, 112],
		step: [0, 38.5],
		bubble: [600, 126],
		tail: 'bottom',
	},
	// The partner's group ends 16 px (2 × GAP.panel) left of the HUD block.
	2: { avatar: [313, 14], backs: [382, 45], step: [39, 0], bubble: [382, 25], tail: 'left' },
	3: {
		avatar: [163, 130],
		backs: [236, 112],
		step: [0, 38.5],
		bubble: [248, 122],
		tail: 'bottom',
	},
};

/** The felt: a rounded rectangle right of the sidebar (screen-table.png: 147,6 to 634,354). */
const FELT = { x: 147, y: 6, w: 487, h: 348 };

/**
 * Sidebar of cards on the left (the shared SIDEBAR column): top and height of each card, 4 px
 * apart from the felt's top (6) to its bottom (354), where the bottom bar ends.
 */
const SIDE = {
	x: SIDEBAR.x,
	w: SIDEBAR.w,
	champ: [6, 47],
	goal: [57, 70],
	chipsMult: [131, 55],
	bet: [190, 42],
	theirs: [236, 50],
	money: [290, 30],
	bar: [324, 30],
} as const satisfies Record<string, number | readonly [number, number]>;

/** Top of each sidebar card's label. */
const SIDE_LABEL = 7;

/** Top-right HUD block inside the felt: Manhas, Fame, our tentos and their quedas. */
const HUD = { x: 510, y: 10, w: 118, h: 80 };

/** Inner margin of the HUD block (slots, labels, bars). */
const HUD_PAD = 5;

/** Played cards stack by height on the table (the cross of screen-table.png). */
const PLAYED_DEPTH = {
	2: DEPTH.played,
	1: DEPTH.played + 0.1,
	3: DEPTH.played + 0.1,
	0: DEPTH.played + 0.2,
} as const;
const PLAYED_SCALE = 0.9;

/** Your hand as a fan at the bottom: centre, spread, tilt (°), drop per card and card scale. */
const HAND = { x: 390, y: 305, step: 51, tilt: 8, drop: 4, scale: 1.12 };

/** The action column (bottom right of the felt): x, width, height and the rows' centres. */
const ACTIONS = { x: 580, w: 96, h: 24, normal: [250, 278, 306, 334], answer: [274, 304, 334] };

const VIRA = { x: 190, y: 46, scale: 0.78 };

/**
 * The manilha block in the felt's bottom-left corner (free: left of your hand, under the left
 * rival): its left edge and bottom, padded in from the felt; it grows upwards with extra lines.
 */
const MANILHA = { x: FELT.x + PAD.panel, bottom: FELT.y + FELT.h - PAD.panel };

/**
 * The status line's slot: left of your played card (which starts at x 368) and under the left
 * rival's cards, so no card ever covers it. Centre and widest bar.
 */
const STATUS = { x: 256, y: 240, w: 210 };

/** Reward of a finished run table (null when the run ends). */
type TableReward = ReturnType<typeof finishTable>;

/** A signal's button: gesture · meaning. */
const signLabel = (sign: Sign): string =>
	`${t(`sign.${sign}.gesture` as I18nKey)} · ${t(`sign.${sign}` as I18nKey)}`;

/** Width of the end-of-table panel: the count panel's, between the side card columns. */
const END_W = 228;

interface SeatView {
	/** Pointer of the speech bubble towards the avatar. */
	tail: Phaser.GameObjects.Triangle;
	/** Flat avatar (characters change expression; bosses have one). */
	portrait: Phaser.GameObjects.Image;
	name: Phaser.GameObjects.Text;
	backs: Phaser.GameObjects.Container;
	bubble: Phaser.GameObjects.Text;
	expression: Phaser.GameObjects.Container;
	charId: string;
}

/**
 * The table (PLAN PA3): one Truco match to 12 against the AI, driven by the pure `Match`.
 * Every rule event becomes a short animation in a queue; AI seats act when the queue is idle.
 */
export class TableScene extends Phaser.Scene {
	match!: Match;
	/** A LAN match: the server plays, this scene only shows what it is sent (see `onNet`). */
	private net: { client: NetClient; start: TableStart } | null = null;
	private netQueue: Extract<ServerMessage, { type: 'step' | 'deal' | 'start' }>[] = [];
	private draining = false;
	/** Names people typed in the lobby, by seat (bots keep their character's name). */
	private seatNames: Partial<Record<Seat, string>> = {};
	private speed: GameSpeed = 1;
	private busy = false;
	private auto = false;
	private reveal = false;
	/** Centre of the table (popups, banners, panels). */
	private readonly cx = 390;
	private readonly cy = 180;
	/** Language the table was drawn in (Settings can change it under the pause). */
	private lang = getLang();
	/** Objects of the sidebar and HUD block, rebuilt on a language change. */
	private sidebar: Phaser.GameObjects.GameObject[] = [];
	private signBtns: Button[] = [];
	/** Arrow/pad focus over the table's panels. */
	private nav: ButtonNav | null = null;
	/** The tip a touch left open, the object it belongs to and its timer. */
	private pinned: {
		owner: Phaser.GameObjects.GameObject;
		box: Phaser.GameObjects.Text;
		timer: Phaser.Time.TimerEvent;
	} | null = null;
	/** The table's result once it ended (the end panel is drawn from it). */
	private ended: { winner: Team; reward: TableReward } | null = null;
	/**
	 * Draws for the NPCs' small talk: its own stream, so a line said or skipped never shifts the
	 * deals or the AI (the match's Rng stays as the rules use it).
	 */
	private chatter = new Rng(1);
	private seats = new Map<Seat, SeatView>();
	private handCards: Phaser.GameObjects.Image[] = [];
	/** The key (or pad button) that plays each card, under it. */
	private cardKeys: Phaser.GameObjects.Text[] = [];
	private played: Phaser.GameObjects.Image[] = [];
	private vira!: Phaser.GameObjects.Image;
	private viraLabel!: Phaser.GameObjects.Text;
	private manilhaBox!: Phaser.GameObjects.Image;
	private manilhaText!: Phaser.GameObjects.Text;
	private betText!: Phaser.GameObjects.Text;
	private fameText!: Phaser.GameObjects.Text;
	private status!: Phaser.GameObjects.Text;
	private statusBar!: Phaser.GameObjects.Graphics;
	private statusW = 0;
	private turnArrow!: Phaser.GameObjects.Triangle;
	private quedasText!: Phaser.GameObjects.Text;
	private banner!: Phaser.GameObjects.Text;
	private pointsText!: Phaser.GameObjects.Text;
	private scoreBox!: Phaser.GameObjects.Container;
	private scoreTitle!: Phaser.GameObjects.Text;
	private chipsVal!: Phaser.GameObjects.Text;
	private multVal!: Phaser.GameObjects.Text;
	private scoreTotal!: Phaser.GameObjects.Text;
	/** Points shown by the last count animation (QA compares it with `scoreHand`). */
	private shownPoints = 0;
	private bestHand = 0;
	private focusCard = 0;
	/** The keyboard or a gamepad moved the card focus (mouse players see no lifted card). */
	private keyFocus = false;
	/** The run this table belongs to (null: a quick match from ?skipMenu). */
	private runState: RunState | null = null;
	/** Points and money on the HUD (they catch up with the match after each count). */
	private hudPoints = 0;
	private hudMoney = 0;
	private moneyText!: Phaser.GameObjects.Text;
	/** Chips × Mult blocks of the sidebar and the bars, tentos and dots drawn over its cards. */
	private sideChips!: Phaser.GameObjects.Text;
	private sideMult!: Phaser.GameObjects.Text;
	private hudGfx!: Phaser.GameObjects.Graphics;
	private manhaList = false;
	private betNote!: Phaser.GameObjects.Text;
	private manhaRow!: Phaser.GameObjects.Container;
	private manhaTip!: Phaser.GameObjects.Text;
	/** Strength of the hovered card in this hand (A6.2). */
	private cardTip!: Phaser.GameObjects.Text;
	private popup!: Phaser.GameObjects.Text;
	private btn!: Record<'truco' | 'raise' | 'accept' | 'fold' | 'signal' | 'cover', Button>;
	private signPicker!: Phaser.GameObjects.Container;
	private eleven!: Phaser.GameObjects.Container;
	private endPanel!: Phaser.GameObjects.Container;
	private cover = false;
	private vignette!: Phaser.GameObjects.Rectangle;
	/** Last view size (the tutorial coach converts anchors into it). */
	private view: ViewSize | null = null;
	/** Played tutorial (A6.1): fixed deal, and the coach overlay listens to `tutorial` events. */
	private tutorial = false;

	constructor() {
		super('Table');
	}

	create(data: {
		run?: boolean;
		tutorial?: boolean;
		net?: { client: NetClient; start: TableStart; snap: TableSnapshot };
	}): void {
		const params = getParams(this);
		const save = getSave(this);
		this.speed = params.speed ?? save.settings.gameSpeed;
		this.auto = params.auto;
		this.reveal = params.reveal;
		this.chatter = new Rng(params.seed ?? randomSeed());
		this.ended = null;
		this.pinned = null;
		this.net = null;
		this.netQueue = [];
		this.draining = false;
		this.seatNames = {};
		this.input.on(
			'pointerdown',
			(_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
				if (this.pinned && !over.includes(this.pinned.owner)) this.unpinTip();
			},
		);
		this.lang = getLang();
		onSceneEvent(this, 'resume', () => {
			if (getLang() !== this.lang) this.relabel();
		});
		this.busy = false;
		this.cover = false;
		this.shownPoints = 0;
		this.bestHand = 0;
		this.hudPoints = 0;
		this.hudMoney = 0;
		this.seats.clear();
		this.handCards = [];
		this.played = [];
		this.tutorial = Boolean(data?.tutorial);
		this.runState = data?.run ? parseRun(save.run) : null;
		if (data?.net) {
			const { client, start, snap } = data.net;
			this.net = { client, start };
			this.seatNames = start.names;
			const remote = new RemoteMatch();
			remote.load(snap);
			this.match = remote;
			this.startTable(start.chars);
			client.listen((m) => this.onNet(m));
			this.events.once('shutdown', () => {
				// Out of this table for good (menu, quit): leave the room. The lobby button keeps it.
				if (this.net) client.leave();
			});
			return;
		}
		// parseRun returns a copy (old saves get defaults): the save must hold the same object.
		if (this.runState) save.run = this.runState;
		if (this.runState) {
			const run = this.runState;
			this.match = tableMatch(
				run,
				this.auto ? { kind: 'ai', profile: GOOD_BOT } : { kind: 'human' },
			);
			run.tableSave = this.match.progress;
			persist(this);
			this.hudPoints = this.match.points;
			this.hudMoney = this.match.money;
			this.startTable({
				0: 'player',
				1: run.rivals.chars[0],
				2: run.partner,
				3: run.rivals.chars[1],
			});
			return;
		}
		const deal = this.tutorial ? TUTORIAL_DEAL : null;
		const rng = new Rng(deal?.seed ?? params.seed ?? randomSeed());
		const partner: CompanionId = isCompanion(params.partner) ? params.partner : 'tonhao';
		const rivals = rng.shuffle(COMPANION_IDS.filter((id) => id !== partner)).slice(0, 2) as [
			CompanionId,
			CompanionId,
		];
		const rivalProfiles = [rng.pick(AI_PROFILE_IDS), rng.pick(AI_PROFILE_IDS)] as AiProfileId[];
		const ai = (id: AiProfileId): SeatBrain => ({ kind: 'ai', profile: AI_PROFILES[id] });
		const chars: Record<Seat, string> = {
			0: 'player',
			1: params.boss && isBoss(params.boss) ? params.boss : rivals[0],
			2: partner,
			3: rivals[1],
		};
		const viraText = deal?.vira ?? params.vira;
		const vira = viraText ? parseCard(viraText) : null;
		const quickBoss = params.boss && isBoss(params.boss) ? (params.boss as BossId) : undefined;
		const hand0 = (deal?.hand ?? params.hand)
			?.map((x) => parseCard(x))
			.filter((c): c is Card => c !== null);
		this.match = new Match({
			rng,
			// The tutorial's scripted deal stays predictable: no joker there.
			...(this.tutorial ? { deck: standardDeck() } : {}),
			brains: [
				this.auto ? ai('pro') : { kind: 'human' },
				rivalBrain(rivalProfiles[0] as AiProfileId, chars[1]),
				{ kind: 'ai', profile: COMPANIONS[partner].profile },
				rivalBrain(rivalProfiles[1] as AiProfileId, chars[3]),
			],
			traits: seatTraits(chars),
			...(params.score ? { score: params.score } : {}),
			...(quickBoss ? { boss: quickBoss } : {}),
			// Quick match is plain Truco to 12 (GDD §11); the tutorial teaches the points goal.
			...(this.tutorial
				? { goal: tableGoal(1, 'small') }
				: params.goal
					? { goal: params.goal }
					: {}),
			manhas: (deal?.manhas ?? params.manhas ?? []).filter(isManhaId),
			firstDeal: {
				...(vira ? { vira } : {}),
				...(hand0 && hand0.length === 3 ? { hand0 } : {}),
			},
		});
		this.startTable(chars);
		if (this.tutorial) this.scene.launch('Tutorial');
	}

	private startTable(chars: Record<Seat, string>): void {
		this.buildLayout(chars);
		const boss = this.match.boss;
		playMusic(this, boss === 'reiDoTruco' ? 'music.king' : boss ? 'music.boss' : 'music.table');
		playAmbience(this, `amb.${this.place()}`);
		this.bindKeys();
		trackZoom(this, this.cameras.main, (view) => this.layout(view));
		this.cameras.main.fadeIn(200, 5, 5, 8);
		this.renderHand(true);
		// Nobody's controls work until the first pump decides whose turn it is.
		this.updateControls(false);
		this.announceKind();
		pokiGameplay(true);
		this.events.once('shutdown', () => pokiGameplay(false));
		this.time.delayedCall(250, () => this.pump());
	}

	override update(): void {
		// The status bar grows with the line, up to its slot; long lines wrap and it grows taller.
		const w = this.status.text ? Math.min(STATUS.w, Math.ceil(this.status.width) + 20) : 0;
		const h = Math.max(18, Math.ceil(this.status.height) + 6);
		if (this.statusW === w * 1000 + h) return;
		this.statusW = w * 1000 + h;
		this.statusBar.clear();
		if (w)
			this.statusBar
				.fillStyle(PALETTE.panelDark, 0.92)
				.fillRoundedRect(this.status.x - w / 2, this.status.y - h / 2, w, h, 9);
	}

	/** State snapshot for the smoke test and QA (`window.__GAME__`). */
	probe(): Record<string, unknown> {
		return {
			hands: this.match.hands,
			score: this.match.score,
			winner: this.match.winner,
			actor: this.match.actor(),
			bet: this.match.state.bet,
			kind: this.match.state.kind,
			fame: this.match.fame,
			points: this.match.points,
			goal: this.match.goal,
			outcome: this.match.outcome,
			shownPoints: this.shownPoints,
			money: this.match.money,
			manhas: this.match.manhas,
		};
	}

	/** Screen area of a table element, for the tutorial coach's highlight (its view coordinates). */
	anchor(name: TutorialAnchor): Phaser.Geom.Rectangle | null {
		const r = this.anchorInArt(name);
		return r && this.view ? artToView(r, this.view) : r;
	}

	private anchorInArt(name: TutorialAnchor): Phaser.Geom.Rectangle | null {
		const union = (objs: { getBounds(): Phaser.Geom.Rectangle }[]) =>
			objs
				.map((o) => o.getBounds())
				.reduce<Phaser.Geom.Rectangle | null>(
					(acc, r) => (acc ? Phaser.Geom.Rectangle.Union(acc, r) : r),
					null,
				);
		const seat = (n: Seat) => this.seats.get(n)?.portrait;
		const seats = (ns: Seat[]) =>
			union(ns.map(seat).filter((p): p is Phaser.GameObjects.Image => Boolean(p)));
		switch (name) {
			case 'partner':
				return seats([2]);
			case 'rivals':
				return seats([1, 3]);
			// The sidebar cards from the goal down to their tentos; our tentos and quedas are `hud`.
			case 'score':
				return new Phaser.Geom.Rectangle(
					SIDE.x,
					SIDE.goal[0],
					SIDE.w,
					SIDE.theirs[0] + SIDE.theirs[1] - SIDE.goal[0],
				);
			case 'hud':
				return new Phaser.Geom.Rectangle(HUD.x, HUD.y, HUD.w, HUD.h);
			case 'hand':
				return union(this.handCards);
			case 'vira':
				return union([this.vira, this.viraLabel]);
			case 'played':
				return new Phaser.Geom.Rectangle(this.cx - 96, this.cy - 96, 192, 164);
			case 'signal':
				return union([this.btn.signal]);
			case 'truco':
				return union([this.btn.truco]);
			case 'answer':
				return union([this.btn.raise, this.btn.accept, this.btn.fold]);
			case 'points':
				return union([this.pointsText, this.moneyText]);
			case 'manhas':
				return this.match.manhas.length ? union([this.manhaRow]) : null;
		}
	}

	private cue(trigger: TutorialTrigger): void {
		if (this.tutorial) this.events.emit('tutorial', trigger);
	}

	private dur(ms: number): number {
		return ms / this.speed;
	}

	private wait(ms: number): Promise<void> {
		return new Promise((res) => this.time.delayedCall(this.dur(ms), () => res()));
	}

	private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
		return new Promise((res) =>
			this.tweens.add({
				...cfg,
				duration: this.dur(Number(cfg.duration ?? 200)),
				onComplete: () => res(),
			}),
		);
	}

	/** Bold label with the flat drop shadow. */
	private bold(
		size: number,
		color: number = PALETTE.textLight,
	): Phaser.Types.GameObjects.Text.TextStyle {
		return {
			fontFamily: UI_FONT,
			fontSize: `${uiPx(size)}px`,
			fontStyle: '700',
			color: toCss(color),
			shadow: TEXT_SHADOW,
			align: 'center',
		};
	}

	/** Championship of this table; a quick match plays in `?champ`'s room (the Boteco by default). */
	private place(): ChampionshipId {
		if (this.runState) return championshipId(this.runState);
		return CHAMPIONSHIPS[(getParams(this).champ ?? 1) - 1] ?? 'botecoBairro';
	}

	private playPos(seat: Seat): [number, number] {
		return SEAT_POS[seat].play;
	}

	private portraitPos(seat: Seat): [number, number] {
		return SEAT_POS[seat].portrait;
	}

	private text(
		size: number,
		color: number = PALETTE.textLight,
	): Phaser.Types.GameObjects.Text.TextStyle {
		return {
			fontFamily: UI_FONT,
			fontSize: `${uiPx(size)}px`,
			fontStyle: '700',
			color: toCss(color),
			shadow: TEXT_SHADOW,
			align: 'center',
		};
	}

	private cardKey(card: Card): string {
		const key = cardArt(card);
		if (isSpecial(card)) return tex(this, key);
		// Four-colour deck: the `.4c` art when it exists, else the placeholder's own variant.
		const four = `${key}.4c`;
		if (comfort.fourColor && (this.textures.exists(four) || !this.textures.exists(key)))
			return tex(this, four);
		return tex(this, key);
	}

	/** The painted felt (public/assets/gfx/bg/table.webp) with a soft shadow; flat felt if it is missing. */
	private drawTable(): void {
		setBackdrop(this, 'main');
		const { x, y, w, h } = FELT;
		const g = this.add.graphics();
		g.fillStyle(PALETTE.shadow, 0.55).fillRoundedRect(x, y + 3, w, h, 12);
		if (!this.textures.exists('img.bg.table')) {
			g.fillStyle(this.feltColor(), 1).fillRoundedRect(x, y, w, h, 12);
			g.lineStyle(2, shade(this.feltColor(), -0.3), 1).strokeRoundedRect(x, y, w, h, 12);
			return;
		}
		const board = this.add.image(x + w / 2, y + h / 2, 'img.bg.table').setDisplaySize(w, h);
		// The painting is green: later Championships tint it blue and red (docs/visual.md §3).
		const champ = this.runState?.champ ?? getParams(this).champ ?? 1;
		if (champ > 3) board.setTint(champ <= 6 ? 0x6f9bff : 0xff7a6a);
	}

	/** Felt by Championship: green 1–3, blue 4–6, red 7–8 (docs/visual.md §3). */
	private feltColor(): number {
		const champ = this.runState?.champ ?? getParams(this).champ ?? 1;
		return champ <= 3 ? PALETTE.felt : champ <= 6 ? PALETTE.feltBlue : PALETTE.feltRed;
	}

	private buildLayout(chars: Record<Seat, string>): void {
		this.drawTable();
		for (const seat of [1, 2, 3] as const) {
			const id = chars[seat];
			const ui = SEAT_UI[seat];
			const [ax, ay] = ui.avatar;
			const key = tex(this, this.portraitKey(id, 'neutral'));
			const portrait = this.add.image(ax + AVATAR / 2, ay + AVATAR / 2, key);
			portrait.setScale(AVATAR / portrait.width);
			// The name plate hangs under the portrait, part of the same card.
			const plate = this.add.graphics();
			plate
				.fillStyle(PALETTE.panelDark, 0.96)
				.fillRoundedRect(ax, ay + AVATAR - 3, AVATAR, 17, { tl: 0, tr: 0, bl: 5, br: 5 });
			const name = this.add
				.text(
					ax + AVATAR / 2,
					ay + AVATAR + 5.5,
					this.seatNames[seat] ||
						t((isBoss(id) ? `boss.${id}.name` : `char.${id}`) as I18nKey),
					this.bold(8, isBoss(id) ? PALETTE.bad : PALETTE.textLight),
				)
				.setOrigin(0.5);
			while (name.width > AVATAR - 6 && name.style.fontSize !== '5px')
				name.setFontSize(Number.parseInt(String(name.style.fontSize), 10) - 1);
			const backs = this.add.container(...ui.backs);
			const [bx, by] = ui.bubble;
			// Speech: a cream bubble with a pointer towards the avatar.
			const bubble = this.add
				.text(bx, by, '', {
					...this.bold(9, PALETTE.textDark),
					shadow: undefined,
					backgroundColor: toCss(PALETTE.cardFace),
					padding: { x: 7, y: 4 },
					// Long lines wrap: the partner's bubble stays left of the HUD block.
					wordWrap: {
						width: seat === 2 ? HUD.x - SAFE.panel - bx - 14 : seat === 1 ? 110 : 150,
					},
				})
				.setOrigin(ui.tail === 'left' ? 0 : 0.5, ui.tail === 'left' ? 0.5 : 1)
				.setVisible(false)
				.setDepth(DEPTH.speech);
			const tail = this.add
				.triangle(0, 0, 0, 0, 8, -5, 8, 5, PALETTE.cardFace)
				.setVisible(false)
				.setDepth(DEPTH.speech);
			// Your partner's signal, as a category mark in a round bubble at the card's corner.
			const expression = this.add
				.container(ax + AVATAR - 2, ay + 4, [
					this.add.circle(0, 0, 11, PALETTE.cardFace),
					this.add
						.text(0, 0, '', { ...this.bold(13, PALETTE.textDark), shadow: undefined })
						.setOrigin(0.5),
				])
				.setVisible(false)
				.setDepth(DEPTH.signal);
			this.seats.set(seat, {
				tail,
				portrait,
				name,
				backs,
				bubble,
				expression,
				charId: id,
			});
		}
		this.vignette = this.add
			.rectangle(0, 0, 4000, 4000, PALETTE.night, 1)
			.setAlpha(0)
			.setDepth(DEPTH.vignette);
		this.vira = this.add
			.image(VIRA.x, VIRA.y, tex(this, 'card.back.default'))
			.setScale(VIRA.scale);
		this.viraLabel = this.add
			.text(VIRA.x, VIRA.y + 31, '', this.bold(8, PALETTE.textLight))
			.setOrigin(0.5, 0);
		// Origin at the bottom of its drop shadow, so the panel itself ends at MANILHA.bottom.
		this.manilhaBox = this.add
			.image(MANILHA.x, MANILHA.bottom + SHADOW.panel, '__DEFAULT')
			.setOrigin(0, 1);
		this.manilhaText = this.add
			.text(MANILHA.x + PAD.card, MANILHA.bottom - PAD.card, '', {
				...this.bold(TYPE.label, PALETTE.textLight),
				align: 'left',
				lineSpacing: 2,
			})
			.setOrigin(0, 1);
		this.sidebar = this.collect(() => this.buildSidebar());
		// The count panel (screen-score.png): the hand's name, Chips × Mult = points.
		this.scoreBox = this.add.container(0, 0).setDepth(DEPTH.score).setVisible(false);
		this.scoreTitle = this.add.text(0, -27, '', this.bold(17)).setOrigin(0.5);
		this.chipsVal = this.add.text(-73, 15, '', this.bold(19)).setOrigin(0.5);
		this.multVal = this.add.text(-7, 15, '', this.bold(19)).setOrigin(0.5);
		this.scoreTotal = this.add.text(64, 15, '', this.bold(27, PALETTE.manilha)).setOrigin(0.5);
		const board = this.add.graphics();
		drawPanel(board, -114, -52, 228, 104, {
			shadow: 4,
			fill: PALETTE.panelDark,
			radius: RADIUS.panel,
		});
		board
			.lineStyle(1.5, PALETTE.panelLight, 1)
			.strokeRoundedRect(-114, -52, 228, 104, RADIUS.panel);
		board.fillStyle(PALETTE.chips, 1).fillRoundedRect(-96, -2, 46, 34, 6);
		board.fillStyle(PALETTE.mult, 1).fillRoundedRect(-30, -2, 46, 34, 6);
		this.scoreBox.add([
			board,
			this.add.text(-40, 15, '×', this.bold(14, PALETTE.textLight)).setOrigin(0.5),
			this.add.text(26, 15, '=', this.bold(16, PALETTE.textLight)).setOrigin(0.5),
			this.scoreTitle,
			this.chipsVal,
			this.multVal,
			this.scoreTotal,
		]);
		this.popup = this.add
			.text(0, 0, '', this.text(9, PALETTE.textLight))
			.setOrigin(0.5)
			.setPadding(6, 2)
			.setBackgroundColor(toCss(PALETTE.night))
			.setDepth(DEPTH.popup)
			.setVisible(false);
		this.cardTip = this.add
			.text(0, 0, '', {
				...this.text(7),
				backgroundColor: toCss(PALETTE.panelDark),
				padding: { x: 4, y: 2 },
			})
			.setOrigin(0.5, 1)
			.setDepth(DEPTH.tips)
			.setVisible(false);
		this.cardKeys = [0, 1, 2].map((i) =>
			this.add
				.text(0, 0, '', {
					...this.bold(8),
					backgroundColor: toCss(PALETTE.panelDark),
					padding: { x: 3, y: 1 },
				})
				.setOrigin(0.5, 0)
				.setDepth(DEPTH.played)
				.setData('i', i),
		);
		this.manhaTip = this.add
			.text(0, 0, '', {
				...this.text(7),
				align: 'right',
				backgroundColor: toCss(PALETTE.panelDark),
				padding: { x: 4, y: 3 },
				wordWrap: { width: 200 },
			})
			.setOrigin(1, 0)
			.setDepth(DEPTH.tips)
			.setVisible(false);
		this.manhaRow = this.add.container(0, 0).setDepth(DEPTH.manhas);
		this.match.manhas.forEach((id, i) => {
			const icon = this.add
				.image(i * 22, 0, tex(this, `manha.${id}`))
				.setScale(0.4)
				.setData('id', id)
				.setInteractive({ useHandCursor: true });
			this.tipOn(icon, this.manhaTip, () =>
				this.manhaTip
					.setText(`${t(`manha.${id}.name` as I18nKey)}
${t(`manha.${id}.desc` as I18nKey)}`)
					// Under the HUD block, flush with its right edge: clear of the partner on top
					// (the ☰ list moves the same box, so the origin is set each time).
					.setOrigin(1, 0)
					.setPosition(HUD.x + HUD.w, HUD.y + HUD.h + GAP.list),
			);
			this.manhaRow.add(icon);
		});
		// Status bar over the felt; the arrow points at your hand when it is your turn.
		this.statusBar = this.add.graphics().setDepth(DEPTH.statusBar);
		this.status = this.add
			.text(STATUS.x, STATUS.y, '', { ...this.bold(9), wordWrap: { width: STATUS.w - 20 } })
			.setOrigin(0.5)
			.setDepth(DEPTH.status);
		this.turnArrow = this.add
			.triangle(this.cx, 252, 0, 0, 12, 0, 6, 7, PALETTE.manilha)
			.setDepth(DEPTH.status)
			.setVisible(false);
		// Banners (TRUCO!, the joker's draw…) sit over the played cards: a dark plate keeps them
		// apart from the cards under them (BUGS.md B-10).
		this.banner = this.add
			.text(0, 0, '', this.text(18, PALETTE.manilha))
			.setOrigin(0.5)
			.setPadding(8, 3)
			.setBackgroundColor(toCss(PALETTE.night))
			.setDepth(DEPTH.banner)
			.setVisible(false);
		// The action column (bottom right of the felt, screen-table.png): Truco, Enviar Sinal,
		// Desistir, Esconder; while a call waits on you: Aceitar, Desistir and the raise.
		// Every control shows the key or pad button that does the same (none on touch screens).
		const hint = (a: KeyAction) => () => actionHint(getSave(this).settings.keys, a);
		const action = (label: string, fn: () => void, color: number | undefined, a: KeyAction) =>
			new Button(this, label, fn, {
				w: ACTIONS.w,
				h: ACTIONS.h,
				size: 11,
				left: true,
				...(color !== undefined ? { color } : {}),
				hint: hint(a),
			}).setDepth(DEPTH.controls);
		const truco = () => this.human({ kind: 'truco', seat: 0 });
		this.btn = {
			truco: action(t('table.btn.call.3'), truco, PALETTE.truco, 'truco'),
			signal: action(
				t('table.btn.signal'),
				() => this.toggleSignals(),
				PALETTE.signal,
				'signal',
			),
			fold: action(
				t('table.btn.fold'),
				() => this.human({ kind: 'fold', seat: 0 }),
				PALETTE.disabled,
				'fold',
			),
			cover: action(
				t('table.btn.cover'),
				() => this.toggleCover(),
				PALETTE.panelDark,
				'cover',
			),
			raise: action(t('table.btn.call.6'), truco, PALETTE.truco, 'truco'),
			accept: action(
				t('table.accept'),
				() => this.human({ kind: 'accept', seat: 0 }),
				PALETTE.good,
				'accept',
			),
		};
		this.layoutActions(false);
		// Bottom bar of the sidebar: settings, pause and the Manha list. Pause is wide enough to
		// keep its keycap inside (a narrow button drops it below, off the bottom edge).
		const bar = (label: string, fn: () => void, x: number, w: number, a?: KeyAction) =>
			new Button(this, label, fn, {
				w,
				h: 30,
				size: 12,
				...(a ? { hint: hint(a) } : {}),
			})
				.setPosition(SIDE.x + x + w / 2, SIDE.bar[0] + SIDE.bar[1] / 2)
				.setDepth(DEPTH.controls);
		bar('⚙', () => this.openPause('Settings'), 0, 34);
		bar('II', () => this.openPause(), 38, 56, 'pause');
		// The list of owned Manhas: only a run has any, so elsewhere the button would do nothing.
		const hasManhas = this.match.manhas.length > 0;
		bar('☰', () => this.toggleManhaList(), 98, 34)
			.setVisible(hasManhas)
			.setEnabled(hasManhas);
		this.signPicker = this.add.container(0, 0).setDepth(DEPTH.pickers).setVisible(false);
		const pickerBg = this.add.graphics();
		drawPanel(pickerBg, -46, -SIGN_ROW() / 2 - 6, 190, SIGNS.length * SIGN_ROW() + 12);
		this.signPicker.add(pickerBg);
		this.signBtns = SIGNS.map((sign, i) => {
			// Face icon + gesture + meaning: the signal reads at a glance (pixel "emoji").
			const btn = new Button(this, signLabel(sign), () => this.sendSignal(sign), {
				w: 176,
				h: 16,
				size: 7,
			});
			btn.setPosition(48, i * SIGN_ROW());
			const face = this.add.image(-30, i * SIGN_ROW(), tex(this, `ui.sign.${sign}`));
			this.signPicker.add([btn, face]);
			return btn;
		});
		this.eleven = this.buildEleven();
		this.endPanel = this.add.container(0, 0).setDepth(DEPTH.endPanel).setVisible(false);
		this.refreshHud();
	}

	private buildEleven(): Phaser.GameObjects.Container {
		const c = this.add.container(0, 0).setDepth(DEPTH.eleven).setVisible(false);
		const panel = this.add.graphics();
		drawPanel(panel, -118, -48, 236, 96, { shadow: 4 });
		const title = this.add
			.text(0, -38, t('table.eleven.title'), this.text(12, PALETTE.manilha))
			.setOrigin(0.5, 0);
		const body = this.add
			.text(0, -18, t('table.eleven.body'), {
				...this.text(7),
				wordWrap: { width: 236 - 2 * PAD.panel },
			})
			.setOrigin(0.5, 0);
		const play = new Button(
			this,
			t('table.eleven.play'),
			() => this.human({ kind: 'eleven', seat: 0, play: true }),
			{
				w: 100,
				h: BUTTON_H.action,
				color: PALETTE.good,
			},
		);
		const fold = new Button(
			this,
			t('table.eleven.fold'),
			() => this.human({ kind: 'eleven', seat: 0, play: false }),
			{
				w: 100,
				h: BUTTON_H.action,
			},
		);
		play.setPosition(-54, 28);
		fold.setPosition(54, 28);
		c.add([panel, title, body, play, fold]);
		return c;
	}

	private layout(view: ViewSize): void {
		this.view = view;
		fitCamera(this.cameras.main, view);
		const { cx, cy } = this;
		this.manhaRow.setPosition(HUD.x + HUD_PAD + 10, HUD.y + HUD_PAD + 10);
		this.popup.setPosition(cx, cy - 72);
		this.scoreBox.setPosition(cx, cy - 20);
		this.banner.setPosition(cx, cy - 40);
		this.signPicker.setPosition(ACTIONS.x - ACTIONS.w / 2 - 148, 150);
		this.eleven.setPosition(cx, cy + 14);
		this.endPanel.setPosition(cx, cy - 10);
		this.layoutHand();
		this.layoutPlayed();
	}

	private layoutHand(): void {
		const n = this.handCards.length;
		this.focusCard = Math.min(this.focusCard, Math.max(0, n - 1));
		this.handCards.forEach((img, i) => {
			// Keyboard/gamepad focus lifts the card (PLAN B4.1).
			const lift = this.keyFocus && i === this.focusCard ? 8 : 0;
			const d = i - (n - 1) / 2;
			img.setTexture(this.tilted(img.getData('key') as string, d * HAND.tilt));
			img.setScale(HAND.scale);
			img.setPosition(HAND.x + d * HAND.step, HAND.y + Math.abs(d) * HAND.drop - lift);
		});
		this.placeCardKeys();
	}

	/**
	 * Under each card, the key that plays it (1 2 3); with a pad, ✕ under the card in focus.
	 * Only while you can play; never on touch screens (a tap plays the card).
	 */
	private placeCardKeys(): void {
		const mode = hintMode();
		const keys = getSave(this).settings.keys;
		const on = this.turnArrow?.visible ?? false;
		this.cardKeys.forEach((label, i) => {
			const img = this.handCards[i];
			const text =
				!img || !on || mode === 'touch'
					? ''
					: mode === 'pad'
						? i === this.focusCard
							? '✕'
							: ''
						: actionHint(keys, `card${i + 1}` as KeyAction);
			label.setText(text).setVisible(text !== '');
			// Inside the card's bottom edge: the outer cards sit lower, and their keys keep a margin
			// to the felt's border.
			if (img) label.setPosition(img.x, img.y + (CARD_H * HAND.scale) / 2 - 10);
		});
	}

	/** A panel with buttons is open: the arrows move between its buttons instead of the cards. */
	private overlayOpen(): boolean {
		return this.eleven.visible || this.signPicker.visible || this.endPanel.visible;
	}

	private layoutPlayed(): void {
		for (const img of this.played) {
			const seat = img.getData('seat') as Seat;
			img.setPosition(...this.playPos(seat));
		}
	}

	/** The sidebar of cards (docs/visual.md §5): static panels and the texts the HUD updates. */
	private buildSidebar(): void {
		const run = this.runState;
		const champ = run?.champ ?? getParams(this).champ ?? 1;
		const size = run ? tableSize(run) : 'small';
		const rects = [SIDE.champ, SIDE.goal, SIDE.chipsMult, SIDE.bet, SIDE.theirs, SIDE.money];
		// Images, not a Graphics: WebGL re-triangulates a Graphics every frame (~1.5 ms here).
		for (const [y, h] of rects)
			this.add
				.image(
					SIDE.x,
					y,
					panelTex(this, SIDE.w, h, PALETTE.panelDark, RADIUS.panel, SHADOW.panel),
				)
				.setOrigin(0);
		const lx = SIDE.x + SIDEBAR.pad;
		const inner = SIDE.w - 2 * SIDEBAR.pad;
		// Smallest text the sidebar may shrink to: never under the touch minimum on touch screens.
		const minPx = touchUi.on ? TOUCH_TEXT_MIN : 6;
		// Long subtitles (touch text, EN) shrink to one line; at the floor they wrap to two, raised.
		const fit = (o: Phaser.GameObjects.Text): Phaser.GameObjects.Text => {
			for (
				let px = Number.parseInt(String(o.style.fontSize), 10);
				o.width > inner && px > minPx;
			)
				o.setFontSize(--px);
			if (o.width > inner)
				o.setWordWrapWidth(inner)
					.setAlign('left')
					.setY(SIDE.champ[0] + 22);
			return o;
		};
		const at = (y: number, str: string, style: Phaser.Types.GameObjects.Text.TextStyle) =>
			this.add.text(lx, y, str, style).setOrigin(0, 0);
		const small = this.text(7, PALETTE.textDim);
		const boss = this.match.boss;
		if (boss) {
			// A boss table names itself and states the boss's rule here (GD-003); long rules shrink
			// down to the floor, then end in "…" and the card shows the whole rule when touched.
			at(SIDE.champ[0] + 4, t('run.table.boss'), this.bold(10, PALETTE.bad));
			const full = t(`boss.${boss}.rule` as I18nKey);
			const rule = at(SIDE.champ[0] + 18, full, {
				...this.bold(7),
				align: 'left',
				wordWrap: { width: SIDE.w - 16 },
			});
			const room = SIDE.champ[1] - 20;
			for (let px = uiPx(7); rule.height > room && px > minPx; ) rule.setFontSize(--px);
			const words = full.split(' ');
			while (rule.height > room && words.length > 1) {
				words.pop();
				rule.setText(`${words.join(' ')}…`);
			}
			if (rule.text !== full) {
				// Its own tip box (the Manha tips keep theirs); a new touch restarts the timer.
				const box = this.add
					.text(SIDE.x + SIDE.w + 6, SIDE.champ[0], full, {
						...this.text(7),
						align: 'left',
						backgroundColor: toCss(PALETTE.panelDark),
						padding: { x: 4, y: 3 },
						wordWrap: { width: 200 },
					})
					.setDepth(DEPTH.tips)
					.setVisible(false);
				const zone = this.add
					.zone(SIDE.x, SIDE.champ[0], SIDE.w, SIDE.champ[1])
					.setOrigin(0)
					.setInteractive();
				this.tipOn(zone, box, () => box);
			}
		} else if (this.match.goal === undefined) {
			at(SIDE.champ[0] + SIDE_LABEL, t('menu.quick'), this.bold(10));
			fit(at(SIDE.champ[0] + 25, t('table.side.quickSub'), small));
		} else {
			at(SIDE.champ[0] + SIDE_LABEL, t('run.champ', { n: champ }), this.bold(10));
			fit(at(SIDE.champ[0] + 25, t(`run.table.${size}` as I18nKey), small));
		}
		// Without a goal (quick match) the card counts the tentos to 12 instead.
		at(
			SIDE.goal[0] + SIDE_LABEL,
			t(this.match.goal === undefined ? 'table.side.tentos' : 'table.side.goal'),
			small,
		);
		this.pointsText = at(SIDE.goal[0] + 21, '', this.bold(15, PALETTE.manilha));
		// A quick match scores no hands and pays nothing: its Chips × Mult and money cards stay in
		// place (same sidebar) but faded, so the frozen 0 × 0 and $0 read as "not in this mode".
		const off = this.match.goal === undefined ? 0.35 : 1;
		at(SIDE.chipsMult[0] + SIDE_LABEL, t('table.side.chipsMult'), small).setAlpha(off);
		const by = SIDE.chipsMult[0] + 21;
		this.add
			.image(lx, by, panelTex(this, 52, 27, PALETTE.chips, 6))
			.setOrigin(0)
			.setAlpha(off);
		this.add
			.image(lx + 62, by, panelTex(this, 52, 27, PALETTE.mult, 6))
			.setOrigin(0)
			.setAlpha(off);
		this.add
			.text(lx + 57, by + 13.5, '×', this.text(9, PALETTE.textLight))
			.setOrigin(0.5)
			.setAlpha(off);
		this.sideChips = this.add
			.text(lx + 26, by + 13.5, '0', this.bold(14))
			.setOrigin(0.5)
			.setAlpha(off);
		this.sideMult = this.add
			.text(lx + 88, by + 13.5, '0', this.bold(14))
			.setOrigin(0.5)
			.setAlpha(off);
		at(SIDE.bet[0] + SIDE_LABEL, t('table.side.bet'), small);
		this.betText = this.add
			.text(lx + 12, SIDE.bet[0] + 28, '', this.bold(15, PALETTE.manilha))
			.setOrigin(0.5)
			.setDepth(DEPTH.sideValue);
		this.betNote = this.add
			.text(lx + 34, SIDE.bet[0] + 28, '', this.bold(8, PALETTE.textLight))
			.setOrigin(0, 0.5);
		at(SIDE.theirs[0] + SIDE_LABEL, t('table.side.theirTentos'), small);
		this.moneyText = this.add
			.text(lx, SIDE.money[0] + SIDE.money[1] / 2, '', this.bold(14, PALETTE.money))
			.setOrigin(0, 0.5)
			.setAlpha(off);
		// The Manha slots, fame, our tentos and their quedas, inside the felt (top right).
		this.add
			.image(
				HUD.x,
				HUD.y,
				panelTex(this, HUD.w, HUD.h, PALETTE.panelDark, RADIUS.panel, SHADOW.panel),
			)
			.setOrigin(0);
		const slots = this.runState?.manhaSlots ?? 5;
		const g = this.add.graphics().lineStyle(1.5, PALETTE.panelLight, 1);
		for (let i = 0; i < slots; i++)
			g.strokeRoundedRect(HUD.x + HUD_PAD + i * 22, HUD.y + HUD_PAD, 20, 20, RADIUS.button);
		this.fameText = this.add.text(HUD.x + HUD_PAD, HUD.y + 38, '', small).setOrigin(0, 0.5);
		this.quedasText = this.add.text(HUD.x + HUD_PAD, HUD.y + 68, '', small).setOrigin(0, 0.5);
		this.hudGfx = this.add.graphics().setDepth(DEPTH.hudShapes);
	}

	/** Bars, ovals and dots of the sidebar and the HUD block. */
	private drawHudShapes(us: number, them: number, fame: number): void {
		const g = this.hudGfx.clear();
		const m = this.match;
		const lx = SIDE.x + SIDEBAR.pad;
		const done =
			m.goal === undefined ? Math.min(1, us / 12) : Math.min(1, this.hudPoints / m.goal);
		const barY = SIDE.goal[0] + 53;
		g.fillStyle(PALETTE.shadow, 0.6).fillRoundedRect(lx, barY, 114, 7, 3.5);
		if (done > 0) g.fillStyle(PALETTE.manilha, 1).fillRoundedRect(lx, barY, 114 * done, 7, 3.5);
		// Aposta: the number sits on a red block once a call is on the table.
		const called = m.state.bet > 1 || m.state.pending !== null;
		if (called) g.fillStyle(PALETTE.truco, 1).fillRoundedRect(lx, SIDE.bet[0] + 18, 25, 20, 5);
		for (let i = 0; i < 12; i++) {
			const x = lx + 5 + (i % 6) * 20.5;
			const y = SIDE.theirs[0] + 29 + Math.floor(i / 6) * 14;
			if (i < Math.min(12, them)) g.fillStyle(PALETTE.truco, 1).fillCircle(x, y, 5);
			else g.lineStyle(1.5, PALETTE.panelLight, 1).strokeCircle(x, y, 5);
		}
		const fy = HUD.y + 38;
		const fw = HUD.w - HUD_PAD - 38;
		g.fillStyle(PALETTE.shadow, 0.6).fillRoundedRect(HUD.x + 38, fy - 4, fw, 8, 4);
		g.fillStyle(PALETTE.fame, 1).fillRect(
			HUD.x + 38 + (fw / 2) * (1 + fame) - 2,
			fy - 6,
			4,
			12,
		);
		for (let i = 0; i < 12; i++) {
			const x = HUD.x + HUD_PAD + 0.5 + i * 9.2;
			const y = HUD.y + 54;
			if (i < Math.min(12, us)) g.fillStyle(PALETTE.manilha, 1).fillEllipse(x + 3, y, 7, 5);
			else g.lineStyle(1, PALETTE.panelLight, 1).strokeEllipse(x + 3, y, 7, 5);
		}
		for (let i = 0; i < m.rivalQuedasNeeded; i++) {
			const x = HUD.x + HUD.w - HUD_PAD - 4 - (m.rivalQuedasNeeded - 1 - i) * 13;
			if (i < m.rivalQuedas) g.fillStyle(PALETTE.truco, 1).fillCircle(x, HUD.y + 68, 4);
			else g.lineStyle(1.5, PALETTE.panelLight, 1).strokeCircle(x, HUD.y + 68, 4);
		}
	}

	/** The ☰ button: the owned Manhas with their texts, in the tip box. */
	private toggleManhaList(): void {
		this.manhaList = !this.manhaList;
		if (!this.manhaList || !this.match.manhas.length) {
			this.manhaTip.setVisible(false);
			this.manhaList = false;
			return;
		}
		const lines = this.match.manhas.map(
			(id) => `${t(`manha.${id}.name` as I18nKey)}: ${t(`manha.${id}.desc` as I18nKey)}`,
		);
		this.manhaTip
			.setText(lines.join(String.fromCharCode(10)))
			.setOrigin(0, 1)
			.setPosition(SIDE.x + SIDE.w + 8, SIDE.bar[0] + SIDE.bar[1])
			.setVisible(true);
	}

	private refreshHud(): void {
		const s = this.match.state;
		const m = this.match;
		const lang = getLang();
		const bet = s.pending ? `${s.bet} → ${s.pending.to}` : `${s.bet}`;
		const called = s.bet > 1 || s.pending !== null;
		this.betText
			.setText(s.pending ? `${s.pending.to}` : bet)
			.setColor(toCss(called ? PALETTE.textLight : PALETTE.manilha));
		this.betNote.setText(t(called ? 'table.side.called' : 'table.side.noCall'));
		this.pointsText.setText(
			m.goal === undefined
				? `${Math.min(12, s.score.us)} × ${Math.min(12, s.score.them)}`
				: `${formatPoints(this.hudPoints, lang)} / ${formatPoints(m.goal, lang)}`,
		);
		this.moneyText.setText(t('table.money', { n: this.hudMoney }));
		const fame = m.fame;
		this.fameText.setText(t('table.fame'));
		this.quedasText.setText(
			m.goal !== undefined ? t('table.hud.quedas', { us: m.quedas }) : '',
		);
		this.drawHudShapes(s.score.us, s.score.them, fame);
		// A Cartomante hides the vira until the first trick is over.
		const hidden = m.boss === 'cartomante' && s.tricks.length === 1 && !s.over;
		this.vira.setTexture(hidden ? tex(this, 'card.back.default') : this.cardKey(s.vira));
		const count = m.has('countManilhas')
			? `\n${t('table.manilhasSeen', { n: manilhasSeen(s) })}`
			: '';
		const pc = m.pileCard;
		const pile = pc
			? `
${t('table.pile', { c: `${pc.rank}${SUIT_MARK[pc.suit]}` })}`
			: '';
		const manilha = hidden ? t('table.viraHidden') : t('table.manilha', { r: s.manilha });
		const zap = hidden
			? ''
			: `\n${t('table.zap', { c: `${manilhaOf(s.manilha)}${SUIT_MARK.clubs}` })}`;
		this.viraLabel.setText(t('table.vira'));
		this.manilhaText.setText(`${manilha}${zap}${count}${pile}`);
		const mw = Math.ceil(this.manilhaText.width) + 2 * PAD.card;
		const mh = Math.ceil(this.manilhaText.height) + 2 * PAD.card;
		this.manilhaBox.setTexture(
			panelTex(this, mw, mh, PALETTE.panelDark, RADIUS.panel, SHADOW.panel),
		);
		for (const [seat, v] of this.seats) {
			v.backs.removeAll(true);
			const hand = s.hands[seat];
			hand.forEach((card, i) => {
				const peeked =
					(m.peek?.seat === seat && m.peek.cardId === card.id) ||
					s.known.some((k) => k.to === 'us' && k.seat === seat && k.cardId === card.id);
				const face = this.reveal || peeked || jokerEffects(s).includes('showdown');
				const ui = SEAT_UI[seat as Exclude<Seat, 0>];
				const img = this.add
					.image(
						i * ui.step[0],
						i * ui.step[1],
						face ? this.cardKey(card) : tex(this, 'card.back.tile'),
					)
					.setOrigin(0, 0)
					.setScale(face ? 0.66 : 1);
				v.backs.add(img);
			});
		}
	}

	/**
	 * `key` tilted by `deg`, drawn once on a 2D canvas from its vector art. Phaser 4.2.1 WebGL drops triangles of
	 * rotated sprites batched before nine-slices and texts, so the fan of cards never rotates on
	 * the GPU.
	 */
	private tilted(key: string, deg: number): string {
		const f = this.textures.getFrame(key);
		// A missing or destroyed source texture (B-01) keeps the card straight instead of crashing.
		if (!deg || !f?.source?.image) return key;
		const [fw, fh] = [f.realWidth, f.realHeight];
		const a = Phaser.Math.DegToRad(deg);
		const [cos, sin] = [Math.abs(Math.cos(a)), Math.abs(Math.sin(a))];
		const w = Math.ceil(fw * cos + fh * sin);
		const h = Math.ceil(fw * sin + fh * cos);
		return canvasTex(this, `${key}@${deg}`, w, h, (ctx) => {
			ctx.translate(w / 2, h / 2);
			ctx.rotate(a);
			ctx.translate(-fw / 2, -fh / 2);
			drawKey(ctx, key);
		});
	}

	/** Manilhas change every hand, so their faces get a gold frame (the ZAP also a star). */
	private markManilha(img: Phaser.GameObjects.Image, card: Card): void {
		const zap = isZap(card, this.match.state.manilha);
		if (!zap && card.rank !== this.match.state.manilha) return;
		const key = tex(this, markedArt(img.getData('key') ?? img.texture.key, zap ? 'z' : 'm'));
		img.setTexture(key).setData('key', key);
		if (zap) this.markZap(img);
	}

	/**
	 * The ZAP, the strongest card of the hand (PLAN §5.2): coloured sparkles around the card
	 * ("reduce flashes": the gold frame alone).
	 */
	private markZap(img: Phaser.GameObjects.Image): void {
		if (comfort.reduceFlashes) return;
		const sparks = this.add
			.particles(0, 0, sparkTexture(this), {
				speed: { min: 8, max: 26 },
				lifespan: 650,
				scale: { start: 1, end: 0 },
				alpha: { start: 1, end: 0 },
				frequency: 60,
				tint: [...ZAP_GLOW],
				blendMode: Phaser.BlendModes.ADD,
				emitZone: {
					type: 'random',
					source: {
						// Anywhere on the card.
						getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => {
							p.x = Phaser.Math.Between(-CARD_W / 2, CARD_W / 2);
							p.y = Phaser.Math.Between(-CARD_H / 2, CARD_H / 2);
						},
					},
				},
			})
			.setDepth(img.depth + 0.5)
			.startFollow(img);
		img.once(Phaser.GameObjects.Events.DESTROY, () => sparks.destroy());
	}

	private showStrength(img: Phaser.GameObjects.Image, card: Card): void {
		const manilha = this.match.state.manilha;
		const n = strength(card, manilha) + 1;
		// Common ranks, the four manilhas and the ZAP.
		const of = RANKS.length + SUITS.length + 1;
		this.cardTip
			.setText(
				card.rank === JOKER
					? t('table.strength.joker')
					: isSpecial(card)
						? t('table.strength.special')
						: isZap(card, manilha)
							? t('table.strength.zap', { n, of })
							: card.rank === manilha
								? t('table.strength.manilha', {
										name: t(`card.manilha.${card.suit}` as I18nKey),
										n,
										of,
									})
								: t('table.strength', { n, of }),
			)
			.setPosition(img.x, img.y - CARD_H / 2 - 4)
			.setVisible(true);
	}

	/** Your hand at the bottom (face down in the iron hand). */
	private renderHand(deal = false): void {
		if (deal) {
			this.sideChips.setText('0');
			this.sideMult.setText('0');
		}
		for (const img of this.handCards) img.destroy();
		const s = this.match.state;
		this.handCards = s.hands[0].map((card, i) => {
			const key = s.kind === 'iron' ? tex(this, 'card.back.default') : this.cardKey(card);
			const img = this.add
				.image(0, 0, key)
				.setInteractive({ useHandCursor: true })
				.setData('card', card)
				.setData('key', key)
				.setDepth(DEPTH.table);
			if (s.kind !== 'iron') this.markManilha(img, card);
			img.on('pointerover', (p: Phaser.Input.Pointer) => {
				if (p.wasTouch) return;
				img.setY(img.y - 4);
				if (s.kind !== 'iron') this.showStrength(img, card);
			});
			img.on('pointerout', (p: Phaser.Input.Pointer) => {
				if (p.wasTouch) return;
				this.cardTip.setVisible(false);
				this.layoutHand();
			});
			// Touch has no hover: holding a card shows its strength instead of playing it.
			let hold: Phaser.Time.TimerEvent | undefined;
			let held = false;
			img.on('pointerdown', (p: Phaser.Input.Pointer) => {
				held = false;
				if (s.kind !== 'iron')
					hold = this.time.delayedCall(HOLD_MS, () => {
						held = true;
						this.showStrength(img, card);
						if (p.wasTouch) this.pinTip(img, this.cardTip);
					});
			});
			img.on('pointerup', (p: Phaser.Input.Pointer) => {
				hold?.remove();
				// After a long press a touch leaves the strength pinned; the mouse hides it.
				if (held) {
					if (!p.wasTouch) this.cardTip.setVisible(false);
				} else {
					this.unpinTip();
					this.cardTip.setVisible(false);
					this.playCard(i);
				}
			});
			if (deal) {
				img.setAlpha(0);
				this.tweens.add({
					targets: img,
					alpha: 1,
					delay: this.dur(i * TABLE_TIMING.deal),
					duration: this.dur(120),
				});
			}
			return img;
		});
		this.layoutHand();
		this.refreshHud();
		if (deal && s.kind !== 'iron' && s.hands[0].some((c) => isZap(c, s.manilha))) {
			sfx(this, 'sfx.zap.reveal');
			this.showBanner(t('table.zapDealt'), 1400);
		}
	}

	private announceKind(): void {
		const k = this.match.state.kind;
		if (k === 'iron') this.showBanner(t('table.iron'), 1600);
		// When you decide the mão de 11 its panel carries the title: no banner over it.
		if (k === 'eleven' && (this.match.state.elevenTeam !== 'us' || this.auto))
			this.showBanner(t('table.eleven.title'), 1200);
		// After the banner: the side at 11 talks (your partner, or the rival on the right).
		const s = this.match.state;
		if (k === 'iron') this.time.delayedCall(this.dur(1600), () => this.chat(2, 'say.iron', 2));
		if (k === 'eleven')
			this.time.delayedCall(this.dur(1200), () =>
				this.chat(s.elevenTeam === 'them' ? 1 : 2, 'say.eleven', 3),
			);
		// Vignette for the mão de 11 and the iron hand (B6.1).
		this.tweens.add({
			targets: this.vignette,
			alpha: k === 'normal' ? 0 : k === 'iron' ? 0.55 : 0.3,
			duration: this.dur(300),
		});
		if (k !== 'normal') this.cameras.main.setBackgroundColor(PALETTE.night);
		sfx(this, 'sfx.card.shuffle');
	}

	private showBanner(text: string, ms = 900): void {
		this.banner.setText(text).setVisible(true).setScale(1.3).setAlpha(1);
		this.tweens.add({
			targets: this.banner,
			scale: 1,
			duration: this.dur(160),
			ease: 'Back.easeOut',
		});
		this.time.delayedCall(this.dur(ms), () => this.banner.setVisible(false));
	}

	/**
	 * A tip for `owner`: the mouse shows it while hovering; a touch pins it (`pinTip`) until a
	 * touch elsewhere or TIP_MS. `show` fills and places `box`.
	 */
	private tipOn(
		owner: Phaser.GameObjects.GameObject,
		box: Phaser.GameObjects.Text,
		show: () => Phaser.GameObjects.Text,
	): void {
		owner.on('pointerover', (p: Phaser.Input.Pointer) => {
			if (!p.wasTouch) show().setVisible(true);
		});
		owner.on('pointerout', (p: Phaser.Input.Pointer) => {
			if (!p.wasTouch) box.setVisible(false);
		});
		owner.on('pointerdown', (p: Phaser.Input.Pointer) => {
			if (!p.wasTouch) return;
			show();
			this.pinTip(owner, box);
		});
	}

	/** Shows `box` for a touch on `owner`, closing any other pinned tip. */
	private pinTip(owner: Phaser.GameObjects.GameObject, box: Phaser.GameObjects.Text): void {
		this.unpinTip();
		box.setVisible(true);
		this.pinned = { owner, box, timer: this.time.delayedCall(TIP_MS, () => this.unpinTip()) };
	}

	private unpinTip(): void {
		if (!this.pinned) return;
		this.pinned.timer.remove();
		this.pinned.box.setVisible(false);
		this.pinned = null;
	}

	/** Objects `build` adds to the scene's display list. */
	private collect(build: () => void): Phaser.GameObjects.GameObject[] {
		const before = new Set(this.children.list);
		build();
		return this.children.list.filter((o) => !before.has(o));
	}

	/**
	 * The language changed under the pause: every text of the table is drawn again in the new
	 * one, without restarting (the hand in play stays as it is).
	 */
	private relabel(): void {
		this.unpinTip();
		this.lang = getLang();
		const chips = this.sideChips.text;
		const mult = this.sideMult.text;
		for (const o of this.sidebar) o.destroy();
		this.sidebar = this.collect(() => this.buildSidebar());
		this.sideChips.setText(chips);
		this.sideMult.setText(mult);
		this.btn.signal.setLabel(t('table.btn.signal'));
		this.btn.fold.setLabel(t('table.btn.fold'));
		this.btn.accept.setLabel(t('table.accept'));
		for (const [i, sign] of SIGNS.entries()) this.signBtns[i]?.setLabel(signLabel(sign));
		const open = this.eleven.visible;
		this.eleven.destroy();
		this.eleven = this.buildEleven().setVisible(open);
		this.eleven.setPosition(this.cx, this.cy + 14);
		this.status.setText('');
		this.drawEnd();
		this.refreshHud();
		const actor = this.match.actor();
		this.updateControls(!this.ended && !this.busy && actor === 0 && !this.auto);
	}

	private say(seat: Seat, key: I18nKey): void {
		const v = this.seats.get(seat);
		if (!v) return;
		this.speak(seat, t(key), PALETTE.textDark);
	}

	/** A cream speech bubble beside the avatar: `text` in `color` (the calls shout in red). */
	private speak(seat: Seat, text: string, color: number, ms: number = TABLE_TIMING.speech): void {
		const v = this.seats.get(seat);
		if (!v || seat === 0) return;
		const ui = SEAT_UI[seat];
		const [bx, by] = ui.bubble;
		v.bubble.setText(text).setColor(toCss(color)).setPosition(bx, by).setVisible(true);
		// Kept inside the felt; the tail still points at the avatar.
		const w = v.bubble.displayWidth;
		const left = bx - w * v.bubble.originX;
		const shift =
			Math.max(0, FELT.x + SAFE.panel - left) -
			Math.max(0, left + w - (FELT.x + FELT.w - SAFE.panel));
		v.bubble.setX(bx + shift);
		const b = v.bubble.getBounds();
		if (ui.tail === 'left') v.tail.setPosition(b.left - 3, b.centerY).setAngle(180);
		else
			v.tail
				.setPosition(
					Math.min(Math.max(ui.avatar[0] + AVATAR / 2, b.left + 9), b.right - 9),
					b.bottom + 2,
				)
				.setAngle(105);
		v.tail.setVisible(true);
		this.time.delayedCall(this.dur(ms), () => {
			v.bubble.setVisible(false);
			v.tail.setVisible(false);
		});
	}

	/** Bosses have one big portrait (`boss.<id>`); characters have expressions. */
	private portraitKey(id: string, expr: string): string {
		return isBoss(id) ? `boss.${id}` : `portrait.${id}.${expr}`;
	}

	private face(seat: Seat, expr: Expression, ms: number = TABLE_TIMING.signalFace): void {
		const v = this.seats.get(seat);
		// Bosses have one pose.
		if (!v || isBoss(v.charId)) return;
		v.portrait.setTexture(tex(this, `portrait.${v.charId}.${expr}`));
		this.time.delayedCall(this.dur(ms), () =>
			v.portrait.setTexture(tex(this, `portrait.${v.charId}.neutral`)),
		);
	}

	/**
	 * Your partner's signal: the bubble beside them shows only the kind of card (strong, a 3 or
	 * nothing), never which one, and the status line says it in words.
	 */
	private partnerSignal(sign: Sign): void {
		this.signMark(2, sign);
		const cat = SIGN_CATEGORY[sign];
		this.status.setText(t('table.partnerSign', { cat: t(`sign.cat.${cat}` as I18nKey) }));
	}

	/** The mark of a signal (★, 3, ✗) in the bubble over a portrait: the partner's, or a caught rival's. */
	private signMark(seat: Seat, sign: Sign): void {
		const v = this.seats.get(seat);
		if (!v) return;
		const cat = SIGN_CATEGORY[sign];
		(v.expression.last as Phaser.GameObjects.Text)
			.setText(SIGN_MARK[cat])
			.setColor(toCss(cat === 'strong' ? PALETTE.cta : PALETTE.textDark));
		v.expression.setVisible(true);
		this.time.delayedCall(this.dur(TABLE_TIMING.signalFace), () =>
			v.expression.setVisible(false),
		);
	}

	private charOf(seat: Seat): string {
		return this.seats.get(seat)?.charId ?? 'player';
	}

	/**
	 * Small talk: an NPC says one of `n` lines, with probability `chance`. Never you, and never
	 * over another bubble (a call, a brag): one line per event at most.
	 */
	private chat(seat: Seat, prefix: string, n: number, chance = 1): void {
		if (this.net || seat === 0 || !this.seats.has(seat)) return;
		for (const v of this.seats.values()) if (v.bubble.visible) return;
		if (!this.chatter.chance(chance)) return;
		this.say(seat, `${prefix}.${this.chatter.int(0, n - 1)}` as I18nKey);
	}

	/**
	 * After a trick, now and then (35%): a tie gets a line from anyone at the table; a won trick
	 * from its winner, or, when you won it, from your partner (glad) or a rival (sore).
	 */
	private trickChat(winner: Seat | undefined): void {
		if (winner === undefined) {
			this.chat(this.chatter.pick([1, 2, 3] as const), 'say.tie', 3, 0.35);
			return;
		}
		const seat: Seat = winner !== 0 ? winner : this.chatter.pick([1, 2, 3] as const);
		const won = teamOf(seat) === teamOf(winner);
		this.chat(seat, won ? 'say.trick.us' : 'say.trick.them', 3, 0.35);
	}

	/** One line of a set of variants (seeded, so replays match). */
	private line(prefix: string, n: number): I18nKey {
		return `${prefix}.${this.match.rng.int(0, n - 1)}` as I18nKey;
	}

	// --- Turn loop --------------------------------------------------------------------------

	/** Moves the game on: hand over → next hand; AI seat → decide; human → wait for input. */
	private pump(): void {
		if (this.busy || !this.sys.isActive()) return;
		const m = this.match;
		const actor = m.actor();
		// A LAN table waits for the server: it deals the next hand and plays the bots.
		if (actor === null && this.net) return;
		if (actor === null) {
			void this.endHand();
			return;
		}
		const human = actor === 0 && !this.auto;
		this.updateControls(human);
		if (human) {
			// The arrow and the keycaps on the controls say it is your turn; no hint line.
			this.status.setText('');
			this.cue('yourTurn');
			return;
		}
		this.status.setText('');
		if (this.net) return;
		this.busy = true;
		this.time.delayedCall(this.dur(TABLE_TIMING.think), () => {
			if (!this.sys.isActive()) return;
			void this.run(m.aiAction(actor));
		});
	}

	/** A message from the LAN server: steps and deals queue up and play one after the other. */
	private onNet(m: ServerMessage): void {
		if (m.type === 'step' || m.type === 'deal' || m.type === 'start') {
			this.netQueue.push(m);
			void this.drain();
		} else if (m.type === 'rejected') {
			sfx(this, 'sfx.ui.error');
			this.busy = false;
			this.pump();
		} else if (m.type === 'closed') {
			this.netQueue = [];
			this.showBanner(t('net.closed'), 2000);
			this.time.delayedCall(2200, () => fadeTo(this, 'Menu'));
		}
	}

	private async drain(): Promise<void> {
		if (this.draining) return;
		this.draining = true;
		const match = this.match as RemoteMatch;
		for (let m = this.netQueue.shift(); m; m = this.netQueue.shift()) {
			if (!this.sys.isActive()) break;
			this.busy = true;
			this.updateControls(false);
			match.load(m.snap);
			if (m.type === 'step') {
				for (const e of m.events) {
					if (!this.sys.isActive()) return;
					await this.animate(e);
				}
			} else {
				for (const img of this.played) img.destroy();
				this.played = [];
				this.renderHand(true);
				this.announceKind();
				await this.wait(400);
			}
			this.busy = false;
			this.refreshHud();
			const winner = match.winner;
			if (winner) this.showEnd(winner);
			else this.pump();
		}
		this.draining = false;
	}

	private human(action: Action): void {
		if (this.busy || this.match.actor() !== 0 || this.auto) return;
		const ok = this.match.legal(0).some((a) => JSON.stringify(a) === JSON.stringify(action));
		if (!ok) {
			sfx(this, 'sfx.ui.error');
			return;
		}
		this.signPicker.setVisible(false);
		this.busy = true;
		if (this.net) {
			this.updateControls(false);
			this.net.client.send({ type: 'action', action });
			return;
		}
		void this.run(action);
	}

	private async run(action: Action): Promise<void> {
		this.updateControls(false);
		const events = this.match.act(action);
		for (const e of events) {
			if (!this.sys.isActive()) return;
			await this.animate(e);
		}
		this.busy = false;
		this.refreshHud();
		this.pump();
	}

	private async animate(e: TableEvent): Promise<void> {
		switch (e.type) {
			case 'played': {
				sfx(this, e.faceDown ? 'sfx.card.cover' : 'sfx.card.play');
				if (e.seat === 0) this.renderHand();
				else this.refreshHud();
				const [px, py] = this.playPos(e.seat);
				const key = e.faceDown ? tex(this, 'card.back.default') : this.cardKey(e.card);
				const img = this.add
					.image(...this.portraitPos(e.seat), key)
					.setData('seat', e.seat)
					.setScale(PLAYED_SCALE)
					.setDepth(PLAYED_DEPTH[e.seat]);
				if (!e.faceDown) this.markManilha(img, e.card);
				this.played.push(img);
				await this.tween({
					targets: img,
					x: px,
					y: py,
					duration: TABLE_TIMING.play,
					ease: 'Quad.easeOut',
				});
				// Squash on landing (B6.1): wide and flat, then back.
				img.setScale(PLAYED_SCALE * 1.14, PLAYED_SCALE * 0.86);
				this.tweens.add({
					targets: img,
					scaleX: PLAYED_SCALE,
					scaleY: PLAYED_SCALE,
					duration: this.dur(140),
					ease: 'Back.easeOut',
				});
				break;
			}
			case 'trick': {
				const winImg = this.played.find((i) => i.getData('seat') === e.winner);
				if (winImg)
					this.tweens.add({
						targets: winImg,
						scale: PLAYED_SCALE * 1.15,
						yoyo: true,
						duration: this.dur(160),
					});
				if (e.result !== 'tie') sfx(this, 'sfx.trick.win');
				// Situational lines (B6.2): a rival brags about a manilha, your partner about his.
				const top =
					e.winner !== undefined
						? this.match.state.tricks[e.index]?.plays.find((p) => p.seat === e.winner)
						: undefined;
				if (top && e.winner !== 0 && top.card.rank === this.match.state.manilha)
					this.say(
						e.winner as Seat,
						this.line(e.result === 'us' ? 'say.manilha.us' : 'say.manilha.them', 5),
					);
				else this.trickChat(e.winner);
				this.status.setText(
					e.result === 'tie' ? t('table.trick.tie') : t(`table.trick.${e.result}`),
				);
				this.cue('trick');
				await this.wait(TABLE_TIMING.trickHold);
				const to =
					e.winner !== undefined
						? this.portraitPos(e.winner)
						: ([this.cx, this.cy - 20] as [number, number]);
				await this.tween({
					targets: this.played,
					x: to[0],
					y: to[1],
					alpha: 0,
					duration: TABLE_TIMING.collect,
				});
				for (const img of this.played) img.destroy();
				this.played = [];
				break;
			}
			case 'truco': {
				sfx(this, 'sfx.truco');
				if (e.to === 12) sfx(this, 'sfx.bet.doze');
				duckMusic(this, DUCK.truco.gain, DUCK.truco.ms);
				zoomPunch(this, 0.04, this.dur(220));
				shake(this, this.dur(160), 0.004);
				if (e.seat === 0) this.showBanner(t(CALL_KEY[e.to] ?? 'table.call.3'));
				this.cue('truco');
				if (e.seat !== 0) {
					voice(this, this.charOf(e.seat), CALL_VO[e.to] ?? 'truco');
					// The first call is shouted in one of five ways; Seis/Nove/Doze keep their name.
					const shout =
						e.to === 3
							? (`say.truco.${this.chatter.int(0, 4)}` as I18nKey)
							: (CALL_KEY[e.to] ?? 'table.call.3');
					this.speak(e.seat, t(shout), PALETTE.truco, 1400);
					this.face(e.seat, 'angry', 900);
				}
				await this.wait(700);
				break;
			}
			case 'accepted':
				sfx(this, 'sfx.bet.accept');
				if (e.seat !== 0) {
					voice(this, this.charOf(e.seat), 'bora');
					this.say(e.seat, this.line('say.accept', 5));
				}
				await this.wait(500);
				break;
			case 'folded':
				sfx(this, 'sfx.bet.run');
				if (e.seat !== 0) {
					voice(this, this.charOf(e.seat), 'corre');
					this.say(e.seat, this.line('say.fold', 5));
					this.face(e.seat, 'sweat', 900);
				}
				await this.wait(600);
				break;
			case 'joker': {
				await this.jokerRoulette(e.effect);
				break;
			}
			case 'vira': {
				sfx(this, 'sfx.card.flip');
				this.refreshHud();
				this.showBanner(t('table.newVira'), 900);
				this.vira.setScale(0, VIRA.scale);
				await this.tween({ targets: this.vira, scaleX: VIRA.scale, duration: 220 });
				break;
			}
			case 'signal': {
				sfx(this, 'sfx.signal');
				if (e.seat === 2) this.partnerSignal(e.sign);
				if (e.seat !== 0 && teamOf(e.seat) === 'them' && e.caughtBy.includes(0)) {
					this.signMark(e.seat, e.sign);
					this.status.setText(
						t('table.caught', { sign: t(`sign.${e.sign}` as I18nKey) }),
					);
				}
				if (e.seat === 0 && e.caughtBy.length) {
					sfx(this, 'sfx.signal.caught');
					this.showBanner(t('table.youWereCaught'), 800);
					const by = e.caughtBy.find((seat) => seat !== 0);
					if (by !== undefined) this.chat(by, 'say.caught', 3);
				}
				await this.wait(250);
				break;
			}
			case 'eleven':
				this.eleven.setVisible(false);
				this.showBanner(t(e.play ? 'table.eleven.played' : 'table.eleven.folded'), 900);
				await this.wait(500);
				break;
			case 'handOver': {
				const { winner, tentos } = e.end;
				this.refreshHud();
				// Rivals gloat when they take the hand; a big hand of yours gets an "ô loco".
				if (winner === 'them') {
					sfx(this, 'sfx.hand.lose');
					voice(this, this.charOf(1), 'caiu');
				} else if (winner === 'us' && tentos >= 6) voice(this, this.charOf(3), 'oloco');
				this.showBanner(
					winner
						? t(winner === 'us' ? 'table.hand.us' : 'table.hand.them', { n: tentos })
						: t('table.hand.none'),
					TABLE_TIMING.handEnd,
				);
				await this.wait(TABLE_TIMING.handEnd);
				const score = this.match.lastScore;
				this.bestHand = Math.max(this.bestHand, score?.points ?? 0);
				if (score?.lance) await this.countScore(score.steps, score.lance);
				else if (score) for (const st of score.steps) await this.showEffect(st);
				this.hudPoints = this.match.points;
				this.hudMoney = this.match.money;
				this.refreshHud();
				if (this.runState)
					featToast(this, recordHand(getSave(this).meta, this.match.handInfo()));
				this.cue('scored');
				// The team that closes a queda cheers: your partner, or the rival on the right.
				if (this.match.outcome === 'queda') this.chat(2, 'say.queda', 3);
				if (this.match.outcome === 'rivalQueda') this.chat(1, 'say.queda', 3);
				if (this.match.outcome === 'queda') {
					sfx(this, 'sfx.queda');
					this.showBanner(t('table.queda'), 1400);
					await this.wait(1400);
				}
				break;
			}
		}
	}

	/**
	 * The joker's draw (PLAN §5.12): the banner spins through the effects and lands on the one
	 * drawn, with its description under it.
	 */
	private async jokerRoulette(effect: PlayEffect): Promise<void> {
		const name = (e: PlayEffect) => t(`joker.${e}.name` as I18nKey);
		// The joker spins through its ten effects, a special card through its own three.
		const card = specialOf(effect);
		const pool: readonly PlayEffect[] = card ? SPECIAL_CARDS[card] : JOKER_EFFECTS;
		const step = pool.length > 3 ? 3 : 1;
		this.showBanner(
			card ? `${t(`special.${card}.name` as I18nKey).toUpperCase()}!` : t('table.joker'),
			500,
		);
		await this.wait(450);
		for (let i = 0; i < 8; i++) {
			const e = pool[(pool.indexOf(effect) + step + i * step) % pool.length];
			this.banner
				.setText(name(e as PlayEffect))
				.setVisible(true)
				.setScale(1)
				.setAlpha(0.7);
			sfx(this, 'sfx.ui.move');
			await this.wait(60 + i * 12);
		}
		sfx(this, 'sfx.pack.open');
		this.showBanner(name(effect), 1500);
		this.popup
			.setText(t(`joker.${effect}.desc` as I18nKey))
			.setColor(toCss(PALETTE.textLight))
			.setVisible(true);
		await this.wait(1300);
		this.popup.setVisible(false);
		// Effects that change the bet or the hands redraw them.
		if (effect === 'swap' || effect === 'redraw') this.renderHand();
		this.refreshHud();
	}

	/** Chips × Mult counted step by step (the same `steps` the total comes from, D-02). */
	private async countScore(steps: readonly ScoreStep[], lance: LanceId): Promise<void> {
		const level = this.match.levels[lance] ?? 1;
		this.scoreTitle.setText(
			`${t(`lance.${lance}` as I18nKey)}${level > 1 ? ` · ${t('table.lance.level', { n: level })}` : ''}`,
		);
		this.scoreTotal.setText('');
		this.scoreBox.setVisible(true).setScale(0.9);
		this.tweens.add({ targets: this.scoreBox, scale: 1, duration: this.dur(120) });
		for (let i = 0; i < steps.length; i++) {
			const st = steps[i];
			const now = totals(steps.slice(0, i + 1));
			const bump = st?.chips !== undefined ? this.chipsVal : this.multVal;
			this.chipsVal.setText(`${now.chips}`);
			this.multVal.setText(`${now.mult}`);
			this.sideChips.setText(`${now.chips}`);
			this.sideMult.setText(`${now.mult}`);
			bump.setScale(1.3);
			this.tweens.add({ targets: bump, scale: 1, duration: this.dur(90) });
			if (!st) continue;
			if (/^(manha|mod|joker):/.test(st.source)) {
				await this.showEffect(st);
				continue;
			}
			if (st.xMult !== undefined) sfx(this, 'sfx.score.xmult');
			else if (st.addMult !== undefined) sfx(this, 'sfx.score.mult');
			else sfx(this, 'sfx.score.chip');
			await this.wait(st.chips !== undefined ? 60 : 220);
		}
		this.shownPoints = totals(steps).points;
		this.scoreTotal.setText(formatPoints(this.shownPoints, getLang()));
		zoomPunch(this, 0.02, this.dur(160));
		this.hudPoints = this.match.points;
		this.hudMoney = this.match.money;
		this.refreshHud();
		await this.wait(900);
		this.scoreBox.setVisible(false);
	}

	/** Popup `[Manha] why · effect` for a Manha or card modifier step (design §4.2). */
	private async showEffect(st: ScoreStep): Promise<void> {
		const [kind, id] = st.source.split(':');
		const gain = [
			st.chips !== undefined ? `+${st.chips} ${t('table.chips')}` : '',
			st.addMult !== undefined ? `+${st.addMult} ${t('table.mult')}` : '',
			st.xMult !== undefined ? `×${st.xMult} ${t('table.mult')}` : '',
			st.money !== undefined ? `+${t('table.money', { n: st.money })}` : '',
		]
			.filter(Boolean)
			.join(' ');
		const name = t(`${kind}.${id}.name` as I18nKey);
		const why = kind === 'manha' ? ` ${t(`manha.${id}.why` as I18nKey)} ·` : '';
		const color =
			st.money !== undefined
				? PALETTE.money
				: st.chips !== undefined
					? PALETTE.chips
					: PALETTE.mult;
		this.popup
			.setText(`[${name}]${why} ${gain}`)
			.setColor(toCss(color))
			.setVisible(true)
			.setScale(1.2);
		this.tweens.add({ targets: this.popup, scale: 1, duration: this.dur(140) });
		const icon = this.manhaRow.list.find(
			(o) => o instanceof Phaser.GameObjects.Image && o.getData('id') === id,
		);
		if (icon)
			this.tweens.add({ targets: icon, scale: 0.52, yoyo: true, duration: this.dur(120) });
		sfx(this, st.money !== undefined ? 'sfx.money' : 'sfx.manha.trigger');
		await this.wait(650);
		this.popup.setVisible(false);
	}

	private async endHand(): Promise<void> {
		this.busy = true;
		const m = this.match;
		const winner = m.winner;
		if (winner) {
			this.showEnd(winner);
			return;
		}
		m.nextHand();
		for (const img of this.played) img.destroy();
		this.played = [];
		this.renderHand(true);
		this.announceKind();
		// Save at the start of every hand (D-32): a reload re-deals this same hand.
		if (this.runState) this.runState.tableSave = m.progress;
		persist(this);
		await this.wait(400);
		this.busy = false;
		this.pump();
	}

	private showEnd(winner: Team): void {
		pokiGameplay(false);
		sfx(this, winner === 'us' ? 'sfx.table.win' : 'sfx.table.lose');
		playMusic(this, winner === 'us' ? 'music.win' : 'music.lose');
		this.updateControls(false);
		let reward: TableReward = null;
		if (this.runState) {
			const m = this.match;
			reward = finishTable(this.runState, {
				won: winner === 'us',
				rivalTentos: m.state.score.them,
				money: m.money,
				fame: m.fame,
				hands: m.hands,
				bestHand: this.bestHand,
				broken: m.broken,
			});
			const meta = getSave(this).meta;
			const feats = [
				...recordTable(meta, {
					won: winner === 'us',
					rivalTentos: m.state.score.them,
					...(m.boss ? { boss: m.boss } : {}),
				}),
				...recordRunState(meta, this.runState),
			];
			if (this.runState.phase === 'won' || this.runState.phase === 'lost')
				feats.push(...recordRunEnd(meta, this.runState, this.runState.phase, Date.now()));
			featToast(this, feats);
			getSave(this).run = this.runState;
			persist(this);
			if (this.auto) this.time.delayedCall(600, () => fadeTo(this, 'Run', { fresh: false }));
		}
		this.ended = { winner, reward };
		this.drawEnd();
		this.status.setText('');
	}

	/** The end-of-table panel, in the current language. */
	private drawEnd(): void {
		if (!this.ended) return;
		const { winner, reward } = this.ended;
		this.endPanel.removeAll(true);
		const box = this.add.graphics();
		const title = this.add
			.text(
				0,
				0,
				t(
					winner === 'us'
						? this.match.goal === undefined
							? 'table.matchWin'
							: 'table.goalWin'
						: this.runState
							? 'table.goalLose'
							: 'table.matchLose',
				),
				{
					...this.text(12, winner === 'us' ? PALETTE.good : PALETTE.bad),
					wordWrap: { width: END_W - 2 * PAD.panel },
				},
			)
			.setOrigin(0.5);
		// As wide as the count panel (between the side card columns) and as tall as its body:
		// the title in the 30 px header, then the reward list (if any) and the buttons, padded.
		const frame = (info?: Phaser.GameObjects.Text): number => {
			const list = info?.text ? info.height + GAP.panel : 0;
			const h = 30 + PAD.panel + list + BUTTON_H.action + PAD.panel;
			drawPanel(box, -END_W / 2, -h / 2, END_W, h, { header: 30, shadow: 4 });
			title.setY(-h / 2 + 15);
			info?.setY(-h / 2 + 30 + PAD.panel + info.height / 2);
			return h / 2 - PAD.panel - BUTTON_H.action / 2;
		};
		if (this.runState) {
			const lines = reward
				? t('table.reward', {
						p: reward.prize,
						s: reward.speed,
						i: reward.interest,
						m: reward.table,
						total: reward.prize + reward.speed + reward.interest + reward.table,
					})
				: '';
			const info = this.add
				.text(0, 0, lines, { ...this.text(8), wordWrap: { width: END_W - 2 * PAD.panel } })
				.setOrigin(0.5);
			const next = new Button(
				this,
				t('table.continue'),
				() => fadeTo(this, 'Run', { fresh: false }),
				{
					w: 130,
					h: BUTTON_H.action,
					color: PALETTE.good,
				},
			);
			next.setPosition(0, frame(info));
			this.endPanel.add([box, title, info, next]).setVisible(true);
			return;
		}
		const net = this.net;
		const again = new Button(
			this,
			t(net ? 'net.backToLobby' : 'table.again'),
			() => {
				if (!net) return this.scene.restart();
				this.net = null;
				net.client.listen(null);
				fadeTo(this, 'Lobby', { client: net.client });
			},
			{
				w: 100,
				h: BUTTON_H.action,
				color: PALETTE.good,
			},
		);
		const menu = new Button(this, t('table.menu'), () => fadeTo(this, 'Menu'), {
			w: 100,
			h: BUTTON_H.action,
		});
		const by = frame();
		again.setPosition(-54, by);
		menu.setPosition(54, by);
		// After the tutorial, Enter goes on to the menu instead of replaying the tutorial.
		if (this.tutorial) {
			this.nav?.reset();
			this.nav?.prefer((b) => b === menu);
		}
		this.endPanel.add([box, title, again, menu]).setVisible(true);
	}

	// --- Human controls ---------------------------------------------------------------------

	/** Button label of a call: "Truco", "Seis", "Nove", "Doze" (the bubble shouts them). */
	private callLabel(bet: number): string {
		return t(`table.btn.call.${CALL_BTN.includes(bet) ? bet : 3}` as I18nKey);
	}

	/** Puts the action column in its normal or answering shape. */
	private layoutActions(answering: boolean): void {
		const b = this.btn;
		const rows = answering ? ACTIONS.answer : ACTIONS.normal;
		const order = answering
			? [b.accept, b.fold, b.raise]
			: [b.truco, b.signal, b.fold, b.cover];
		for (const btn of [b.truco, b.signal, b.cover, b.accept, b.raise, b.fold])
			btn.setVisible(order.includes(btn));
		order.forEach((btn, i) => {
			btn.setPosition(ACTIONS.x, rows[i] ?? 0);
		});
	}

	private updateControls(human: boolean): void {
		const legal = human ? this.match.legal(0) : [];
		const has = (kind: Action['kind']) => legal.some((a) => a.kind === kind);
		const s = this.match.state;
		const pendingForMe = human && s.pending?.responder === 0;
		const nextCall = s.pending ? Math.min(12, s.pending.to + 3) : s.bet === 1 ? 3 : s.bet + 3;
		this.layoutActions(Boolean(pendingForMe));
		this.btn.truco.setLabel(this.callLabel(nextCall)).setEnabled(has('truco'));
		this.btn.raise
			.setLabel(this.callLabel(nextCall))
			.setEnabled(Boolean(pendingForMe) && has('truco'));
		this.btn.accept.setEnabled(has('accept'));
		this.btn.fold.setEnabled(has('fold'));
		this.btn.signal.setEnabled(has('signal'));
		this.turnArrow.setVisible(has('play'));
		this.placeCardKeys();
		const canCover = legal.some((a) => a.kind === 'play' && a.faceDown);
		if (!canCover) this.cover = false;
		this.btn.cover
			.setEnabled(canCover)
			.setLabel(t(this.cover ? 'table.btn.cover.on' : 'table.btn.cover'));
		if (!has('signal')) this.signPicker.setVisible(false);
		this.eleven.setVisible(has('eleven'));
		if (has('eleven')) this.showPartnerHand();
		// Dimmed while it is not your turn to play.
		for (const img of this.handCards)
			if (human && has('play')) img.clearTint();
			else img.setTint(0xb8b0a4);
	}

	private showPartnerHand(): void {
		const v = this.seats.get(2);
		if (!v) return;
		v.backs.removeAll(true);
		this.match.state.hands[2].forEach((card, i) => {
			v.backs.add(
				this.add
					.image(i * 30, 0, this.cardKey(card))
					.setOrigin(0, 0)
					.setScale(0.62),
			);
		});
	}

	private playCard(index: number): void {
		const card = this.handCards[index]?.getData('card') as Card | undefined;
		if (!card) return;
		this.human({
			kind: 'play',
			seat: 0,
			cardId: card.id,
			...(this.cover ? { faceDown: true } : {}),
		});
	}

	private toggleCover(): void {
		this.cover = !this.cover;
		this.btn.cover.setLabel(t(this.cover ? 'table.btn.cover.on' : 'table.btn.cover'));
	}

	private toggleSignals(): void {
		this.signPicker.setVisible(!this.signPicker.visible);
	}

	private sendSignal(sign: Sign): void {
		const hand = this.match.state.hands[0];
		const honest = sign === honestSign(hand, this.match.state.manilha);
		this.human({ kind: 'signal', seat: 0, sign, honest });
	}

	private bindKeys(): void {
		const kb = this.input.keyboard;
		this.nav = buttonNav(this, {
			when: () => this.overlayOpen(),
			roots: () => [this.eleven, this.signPicker, this.endPanel].filter((c) => c.visible),
		});
		const step = (d: number) => {
			if (this.overlayOpen() || !this.handCards.length) return;
			this.keyFocus = true;
			this.focusCard = (this.focusCard + d + this.handCards.length) % this.handCards.length;
			sfx(this, 'sfx.ui.move');
			this.layoutHand();
		};
		onKey(kb, 'keydown-LEFT', () => step(-1));
		onKey(kb, 'keydown-RIGHT', () => step(1));
		onKey(kb, 'keydown-ENTER', () => {
			if (this.overlayOpen()) return;
			if (this.match.state.pending?.responder === 0) this.btn.accept.click();
			else this.playCard(this.focusCard);
		});
		onKey(kb, 'keydown', (e) => {
			const keys = getSave(this).settings.keys;
			const a = actionFor(keys, e.code);
			if (!a) return;
			if (a === 'pause') this.openPause();
			else if (a === 'speed') {
				e.preventDefault();
				this.speed = GAME_SPEEDS[
					(GAME_SPEEDS.indexOf(this.speed) + 1) % GAME_SPEEDS.length
				] as GameSpeed;
				this.showBanner(`${this.speed}×`, 500);
			} else if (a === 'card1' || a === 'card2' || a === 'card3')
				this.playCard(Number(a.slice(4)) - 1);
			else if (a === 'truco') this.btn.truco.click();
			else if (a === 'accept') this.btn.accept.click();
			else if (a === 'fold') this.btn.fold.click();
			else if (a === 'signal') this.btn.signal.click();
			else if (a === 'cover') this.btn.cover.click();
		});
		// Android back button / Esc.
		this.game.events.on('pause', this.onBackground, this);
		this.events.once('shutdown', () => this.game.events.off('pause', this.onBackground, this));
	}

	private onBackground(): void {
		if (this.sys.isActive()) this.openPause();
	}

	private openPause(overlay: 'Pause' | 'Settings' = 'Pause'): void {
		if (!this.sys.isActive() || this.endPanel.visible) return;
		this.scene.pause();
		this.scene.launch(overlay, { returnTo: 'Table' });
	}
}
