import Phaser from 'phaser';
import {
	CARD_H,
	CARD_W,
	canvasTex,
	cardArt,
	drawTilted,
	markedArt,
	panelTex,
	tex,
	tiltedKey,
	tiltedSize,
} from '../art/flat';
import { titleMetrics } from '../art/title';
import { GAME_SPEEDS, type GameSpeed } from '../config/constants';
import { SHOW_MANILHA_BOX, SHOW_MONEY_PANEL, SHOW_SCORE_PANEL } from '../config/features';
import { TIER_FEEL } from '../config/feel-cards';
import { FELT_CENTER } from '../config/feel-felt';
import { isTrucoStep, TRUCO_CALL } from '../config/feel-truco';
import { PALETTE, shade, toCss } from '../config/palette';
import { BUTTON_H, DEPTH, GAP, PAD, RADIUS, SAFE, SHADOW, SIDEBAR, TYPE } from '../config/ui';
import { sfx, voice, voiceBusy } from '../core/audio';
import { getParams, getSave, persist } from '../core/context';
import { zoomPunch } from '../core/feel';
import { playAmbience, playMusic, tableMusic } from '../core/music';
import { pokiGameplay } from '../core/poki';
import { trackZoom } from '../core/viewport';
import { AI_PROFILE_IDS, AI_PROFILES, type AiProfileId } from '../data/ai-profiles';
import { BOSS_POOL, type BossId, FINAL_BOSS } from '../data/bosses';
import { CHAMPIONSHIPS, type ChampionshipId, type RunMode } from '../data/championships';
import { type Expression, SIGN_CATEGORY, SIGNAL_EMOJI, TABLE_TIMING } from '../data/characters';
import { COMPANION_IDS, COMPANIONS, type CompanionId, isCompanion } from '../data/companions';
import { DECKS } from '../data/decks';
import { JOKER_EFFECTS } from '../data/jokers';
import type { Action as KeyAction } from '../data/keybinds';
import type { LanceId } from '../data/lances';
import { isManhaId } from '../data/manhas';
import { VO_JOKE, type VoJoke, type VoLine } from '../data/sfx';
import { SPECIAL_CARDS, specialOf } from '../data/specials';
import { TRINKET_SLOTS } from '../data/trinkets';
import { TUTORIAL_DEAL, type TutorialAnchor, type TutorialTrigger } from '../data/tutorial';
import { Match, type MatchOptions, manilhasSeen, type SeatBrain } from '../game/match';
import { RemoteMatch } from '../game/remote-match';
import { GOOD_BOT } from '../game/run-sim';
import { rivalBrain, tableMatch } from '../game/run-table';
import { getLang, type I18nKey, t, tDuel } from '../i18n';
import { trinketName, trinketRarityName, trinketTexts } from '../i18n/trinket';
import { continueWithoutTruco, honestSign } from '../logic/ai/decide';
import { actionFor } from '../logic/keybinds';
import { recordHand, recordRunEnd, recordRunState, recordTable } from '../logic/meta';
import { Rng, randomSeed } from '../logic/rng';
import {
	championshipId,
	finishTable,
	parseRun,
	projectedReward,
	type RunState,
	tableSize,
} from '../logic/run/run';
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
import { trickMarks } from '../logic/truco/trick-marks';
import type { ViewSize } from '../logic/viewport';
import { acceptLine, foldLine, jokeDue, nextJoke } from '../logic/voice-lines';
import type { NetClient } from '../net/client';
import {
	type ServerMessage,
	type TableSnapshot,
	type TableStart,
	TURN_CLOCK_WARN_S,
} from '../net/protocol';
import { Button } from '../ui/Button';
import { EMOJI_FONT, TEXT_SHADOW, UI_FONT } from '../ui/font';
import { actionHint, hintMode, keyHint } from '../ui/key-hint';
import { onKey, onSceneEvent } from '../ui/keys';
import { type ButtonNav, buttonNav } from '../ui/nav';
import { drawPanel } from '../ui/panel';
import { fadeTo } from '../ui/screen';
import { addTitle } from '../ui/title';
import { featToast } from '../ui/toast';
import { touchUi, uiPx } from '../ui/touch';
import { levelColor, trinketMedal } from '../ui/trinket-ui';
import { comfort } from '../view/comfort';
import { collectTrick, type FxEnv, flyCard, landCard, tieBump } from '../view/fx/card-fx';
import { cardWeight } from '../view/fx/card-weight';
import { createFeltCenter, type FeltCenter } from '../view/fx/felt-center';
import { NoticeBoard } from '../view/fx/notice';
import { SeatMotion } from '../view/fx/seat-react';
import { playTrucoCall, type TrucoCallHandle } from '../view/fx/truco-call';
import { handEffects, visibleHandEffects } from '../view/hand-effects';
import { artToView, fitCamera } from '../view/stage';
import { tentosBead } from '../view/tentos-grid';
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
const SIGN_ROW = (): number => (touchUi.on ? 28 : 22);

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

/** The ZAP's comet: one light running around the card's edge, with a fading tail. */
const COMET_MS = 1800;
const COMET_TAIL = 16;
const COMET_STEP = 1.6;

/** Draws the comet at `at` (0–1 of the lap, clockwise from the top-left corner). */
function drawComet(g: Phaser.GameObjects.Graphics, at: number): void {
	const w = CARD_W + 6;
	const h = CARD_H + 6;
	const lap = 2 * (w + h);
	const point = (s: number): [number, number] => {
		let d = ((s % lap) + lap) % lap;
		if (d < w) return [-w / 2 + d, -h / 2];
		d -= w;
		if (d < h) return [w / 2, -h / 2 + d];
		d -= h;
		if (d < w) return [w / 2 - d, h / 2];
		d -= w;
		return [-w / 2, h / 2 - d];
	};
	g.clear();
	const head = at * lap;
	for (let i = 0; i < COMET_TAIL; i++) {
		const k = 1 - i / COMET_TAIL;
		const [x0, y0] = point(head - i * COMET_STEP);
		const [x1, y1] = point(head - (i + 1) * COMET_STEP);
		g.lineStyle(0.6 + 1.6 * k, PALETTE.zapGoldLight, k).lineBetween(x0, y0, x1, y1);
	}
	const [hx, hy] = point(head);
	g.fillStyle(0xffffff, 1).fillCircle(hx, hy, 1.2);
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
	0: { portrait: [390, 345], play: [390, 230] },
	1: { portrait: [586, 162], play: [450, 179] },
	2: { portrait: [345, 46], play: [390, 125] },
	3: { portrait: [195, 162], play: [330, 179] },
};

/** The two-seat table: the rival (slot 2) is a bigger card at the top, so the played cards sit lower. */
const DUEL_POS: Record<0 | 2, { portrait: [number, number]; play: [number, number] }> = {
	0: { portrait: [390, 345], play: [390, 232] },
	2: { portrait: [324, 62], play: [390, 166] },
};

/** Avatars on the table: characters (48 px art) and bosses (96 px art) both end up this wide. */
/** A seat's character card, 3:4 like the painted art; the name plate hangs under it. */
const SEAT_CARD = { w: 54, h: 72 };

/** The lone rival of a two-seat table: bigger than a seat of the four-seat table (R2.2). */
const DUEL_CARD = { w: 72, h: 96 };

/**
 * The rival's avatar and card backs, centred on top as one group (felt centre 390.5): avatar,
 * 10 px gap, the three backs; the bubble sits right of the avatar, above the backs.
 */
const DUEL_UI: (typeof SEAT_UI)[2] = {
	avatar: [288, 14],
	backs: [370, 32],
	step: [38, 0],
	bubble: [370, 20],
	tail: 'left',
};

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
		/** Bubble anchor and wrap width when the default (centred above the avatar) would cover cards. */
		anchor?: [number, number];
		wrap?: number;
	}
> = {
	1: {
		avatar: [554, 130],
		backs: [513, 112],
		step: [0, 36],
		// Above the portrait and right of the card-back column, inside the felt.
		bubble: [626, 127],
		tail: 'bottom',
		anchor: [1, 1],
		wrap: 62,
	},
	// The partner's group ends 16 px (2 × GAP.panel) left of the Championship card.
	2: { avatar: [313, 14], backs: [382, 45], step: [38, 0], bubble: [382, 25], tail: 'left' },
	3: {
		avatar: [163, 130],
		backs: [236, 112],
		step: [0, 36],
		bubble: [156, 127],
		tail: 'bottom',
		anchor: [0, 1],
		wrap: 66,
	},
};

/** The felt: a rounded rectangle right of the sidebar (screen-table.png: 147,6 to 634,354). */
const FELT = { x: 147, y: 6, w: 487, h: 348 };

/**
 * Sidebar of cards on the left (the shared SIDEBAR column): top and height of each card, 4 px
 * apart from the felt's top (6) to its bottom (354), where the bottom bar ends.
 */
/**
 * Sidebar cards top to bottom, 4 px apart: the HUD block (trinket slots, bonuses, flaws),
 * the goal, Chips × Mult, the bet and their tentos; the button bar keeps the base. The money card
 * is hidden (SHOW_MONEY_PANEL).
 * shortcut: with SHOW_MONEY_PANEL on, its card overlaps the bar; shorten a card when it comes back.
 */
/** Tentos card: four rows of three beads, plus the NÓS / ELES labels. */
const TENTOS_H = 116;

const SIDE = {
	x: SIDEBAR.x,
	w: SIDEBAR.w,
	hud: [6, 40],
	// Same 4 px gap between every card. With the score panel on, the cards above the tentos
	// give up a little height so the taller tentos card and the button bar still end on the felt.
	...(SHOW_SCORE_PANEL
		? ({
				goal: [50, 48],
				chipsMult: [102, 58],
				bet: [164, 36],
				theirs: [204, TENTOS_H],
			} as const)
		: ({
				goal: [50, 56],
				chipsMult: [0, 0],
				bet: [110, 40],
				theirs: [154, TENTOS_H],
			} as const)),
	money: [323, 30],
	bar: SHOW_SCORE_PANEL ? ([324, 30] as const) : ([154 + TENTOS_H + GAP.list, 30] as const),
} as const satisfies Record<string, number | readonly [number, number]>;

/** The Championship card ("Campeonato 1 / Mesa 1"): top right of the felt, the felt's padding in. */
const CHAMP = { x: 634 - PAD.panel - 118, y: 6 + PAD.panel, w: 118, h: 47 };

/** The two mini-cards on its second line (table, prize): height and the gap between them. */
const CHAMP_MINI = { y: 24, h: 26, gap: 4 };

/** Inner width of a sidebar card: its width minus the same padding on both sides (`SIDEBAR.pad`). */
const SIDE_INNER_W = SIDEBAR.w - 2 * SIDEBAR.pad;

/** Top of each sidebar card's label. */
const SIDE_LABEL = 7;

/** The tentos panel: two halves (ours, theirs), four rows of three beads, clear of the divider. */
const TENTOS = {
	half: SIDE_INNER_W / 2,
	/** First row's centre inside the panel, and the padding under the last row. */
	top: 34,
	bottom: 8,
	r: 5.5,
	/** Clear px between a bead's edge and the centre divider. */
	gap: 6,
};
const TENTOS_STEP = (TENTOS_H - TENTOS.top - TENTOS.bottom - TENTOS.r) / 3;
/** Centre of bead `d` (0–11, row-major) of half `i` (0 ours, 1 theirs), in stage px. */
const beadAt = (i: number, d: number): [number, number] =>
	tentosBead(i, d, {
		x: SIDEBAR.x + SIDEBAR.pad,
		y: SIDE.theirs[0],
		half: TENTOS.half,
		top: TENTOS.top,
		step: TENTOS_STEP,
		r: TENTOS.r,
		gap: TENTOS.gap,
	});

/** A bead of the tentos panel: an empty socket, or a lit one in green/red, drawn at screen zoom. */
function beadTex(scene: Phaser.Scene, kind: 'empty' | 'green' | 'red', r: number): string {
	const d = Math.ceil(2 * r + 6);
	return canvasTex(scene, `bead.${kind}.${r.toFixed(1)}`, d, d, (ctx) => {
		const c = d / 2;
		if (kind === 'empty') {
			// A socket sunk into the panel: darker inside, shadow on top, a light rim below.
			ctx.fillStyle = 'rgba(255,255,255,0.22)';
			ctx.beginPath();
			ctx.arc(c, c + 0.9, r, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#0d0b0a';
			ctx.beginPath();
			ctx.arc(c, c, r, 0, Math.PI * 2);
			ctx.fill();
			const g = ctx.createLinearGradient(0, c - r, 0, c + r);
			g.addColorStop(0, 'rgba(0,0,0,0.85)');
			g.addColorStop(0.6, 'rgba(0,0,0,0)');
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(c, c, r, 0, Math.PI * 2);
			ctx.fill();
			return;
		}
		const base = kind === 'green' ? PALETTE.good : PALETTE.truco;
		ctx.fillStyle = 'rgba(0,0,0,0.55)';
		ctx.beginPath();
		ctx.arc(c, c + 1.4, r, 0, Math.PI * 2);
		ctx.fill();
		const g = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.1, c, c, r);
		g.addColorStop(0, toCss(shade(base, 0.45)));
		g.addColorStop(0.55, toCss(base));
		g.addColorStop(1, toCss(shade(base, -0.5)));
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(c, c, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = 'rgba(255,255,255,0.85)';
		ctx.beginPath();
		ctx.ellipse(c - r * 0.35, c - r * 0.42, r * 0.3, r * 0.2, -0.6, 0, Math.PI * 2);
		ctx.fill();
	});
}

/** The HUD block (the equipped trinkets and what they do): the sidebar's top card. */
const HUD = { x: SIDE.x, y: SIDE.hud[0], w: SIDE.w, h: SIDE.hud[1] };

/** Inner margin of the HUD block: the sidebar's padding. */
const HUD_PAD = SIDEBAR.pad;

/**
 * The Manha slots fill one row of the HUD card's inner width: 20 px wide and spread out, or
 * smaller when more slots (Mais Manha) would not fit, 2 px apart.
 */
const SLOT_ROW = SIDEBAR.w - 2 * HUD_PAD;
const slotSize = (slots: number): number => Math.min(20, (SLOT_ROW - 2 * (slots - 1)) / slots);
const slotStep = (slots: number): number =>
	slots > 1 ? (SLOT_ROW - slotSize(slots)) / (slots - 1) : 0;

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

/** Where each seat's turn-clock bar sits: above its avatar card; yours under your hand. */
const CLOCK_BAR = { h: 5, mine: { x: 390, y: 351, w: 120 } };

/** The vira's size (its place is in `FELT_CENTER`). */
const VIRA = { scale: 0.78 };

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

/** The won table's reward mini-cards and the Total card under them. */
const END_CARD = { h: 40 };
const END_TOTAL = { h: 28 };
/**
 * The end panel's one inner padding (border to everything, all four sides), its one gap (between
 * rows and between cards) and the title's row; cards, Total and buttons share the content width.
 */
const END_PAD = PAD.panel;
const END_GAP = GAP.inline;
const END_TITLE_H = 24;
const END_INNER = END_W - 2 * END_PAD;

/** Keys that have a `<key>.duel` sibling: the wording of a two-seat table (no pair, no partner). */
type Duelable<K extends string = I18nKey> = K extends string
	? `${K}.duel` extends I18nKey
		? K
		: never
	: never;

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
	/** Partner-truco confirmation (OK / Cancel). Null when it is not on screen. */
	private partnerAsk: Phaser.GameObjects.Container | null = null;
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
	/** The call on the table (folding it to 6+ gets the bigger complaint). */
	private pendingCall = 3;
	private handsSinceJoke = 0;
	/** Each character's last joke, so the next one is a different one. */
	private lastJoke = new Map<string, VoJoke>();
	private seats = new Map<Seat, SeatView>();
	private handCards: Phaser.GameObjects.Image[] = [];
	/** The key (or pad button) that plays each card, under it. */
	private cardKeys: Phaser.GameObjects.Text[] = [];
	private played: Phaser.GameObjects.Image[] = [];
	/** The seats' breathing and reactions (src/view/fx/seat-react.ts). */
	private motion!: SeatMotion;
	/** What the card effects (src/view/fx/card-fx.ts) need from this table. */
	private readonly fx: FxEnv = { scene: this, dur: (ms) => this.dur(ms) };
	private vira!: Phaser.GameObjects.Image;
	private viraLabel!: Phaser.GameObjects.Text;
	private feltCenter!: FeltCenter;
	private manilhaBox!: Phaser.GameObjects.Image;
	private manilhaText!: Phaser.GameObjects.Text;
	/** The prize mini-card's value (null outside a run) and the value it shows now. */
	private prizeText: Phaser.GameObjects.Text | null = null;
	private prizeShown: number | null = null;
	private prizeCoin: Phaser.GameObjects.Graphics | null = null;
	private prizeMid = { x: 0, y: 0 };
	private readonly prizeCounter = { v: 0 };
	/** What changes the current hand (boss rule, mão de 11/ferro, joker and special effects). */
	private effectBox!: Phaser.GameObjects.Container;
	/** Joker/special effects of this hand already revealed by their roulette (the box hides the rest). */
	private fxRevealed = Number.POSITIVE_INFINITY;
	private betText!: Phaser.GameObjects.Text;
	private status!: Phaser.GameObjects.Text;
	private statusBar!: Phaser.GameObjects.Graphics;
	private statusW = 0;
	private turnArrow!: Phaser.GameObjects.Triangle;
	private betLabel!: Phaser.GameObjects.Text;
	private quedaMarks: Phaser.GameObjects.Zone[] = [];
	private beads: Phaser.GameObjects.Image[][] = [[], []];
	private beadsLit = [0, 0];
	private notices!: NoticeBoard;
	/** Ends the truco call event in progress (a click, tap or key), when there is one. */
	private skipCall: (() => void) | null = null;
	/** LAN turn clock: the timed seat (as I see it), its deadline on this machine's clock, the seats on autopilot. */
	private netClock = { seat: null as Seat | null, end: 0, total: 0, auto: [] as Seat[], tick: 0 };
	private clockGfx!: Phaser.GameObjects.Graphics;
	private autoLabels: Phaser.GameObjects.Text[] = [];
	private autoBox!: Phaser.GameObjects.Container;
	private pointsText!: Phaser.GameObjects.Text;
	private scoreBox!: Phaser.GameObjects.Container;
	private scoreTitle!: Phaser.GameObjects.Text;
	private chipsVal!: Phaser.GameObjects.Text;
	private multVal!: Phaser.GameObjects.Text;
	private scoreTotal!: Phaser.GameObjects.Text;
	/** ZAP haloes, kept on the card's frame by `syncHalos` every update. */
	private halos: {
		img: Phaser.GameObjects.Image;
		halo: Phaser.GameObjects.Container;
		comet: Phaser.GameObjects.Graphics;
		phase: number;
	}[] = [];
	private haloSync = false;
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
	private betNote!: Phaser.GameObjects.Text;
	private manhaRow!: Phaser.GameObjects.Container;
	/** Card back in play: the run's starting deck has its own (docs/gdd, decks); else the default. */
	private get backKey(): string {
		return `card.back.${DECKS[this.runState?.startDeck ?? 'normal'].back}`;
	}
	/** Two seats (mano a mano): the rival sits on top, no side seats, no partner, no signals. */
	private get duel(): boolean {
		return this.match.seats === 2;
	}
	/** The seats other than yours that sit at this table. */
	private get others(): readonly Seat[] {
		return this.duel ? [1] : [1, 2, 3];
	}
	/** A seat's slot: the lone rival of a two-seat table takes the top (the partner's) one. */
	private slot(seat: Exclude<Seat, 0>): Exclude<Seat, 0> {
		return this.duel ? 2 : seat;
	}
	private seatUi(seat: Exclude<Seat, 0>): (typeof SEAT_UI)[Exclude<Seat, 0>] {
		return this.duel ? DUEL_UI : SEAT_UI[this.slot(seat)];
	}
	/** The avatar card's size: the two-seat rival's is bigger. */
	private get seatCard(): { w: number; h: number } {
		return this.duel ? DUEL_CARD : SEAT_CARD;
	}
	private seatPos(seat: Seat): { portrait: [number, number]; play: [number, number] } {
		if (this.duel) return DUEL_POS[seat === 0 ? 0 : 2];
		return SEAT_POS[seat === 0 ? 0 : this.slot(seat)];
	}
	/** `key`, or its `.duel` wording at a two-seat table. */
	private tx(key: Duelable, vars?: Record<string, string | number>): string {
		return tDuel(key, this.duel, vars);
	}
	/** Trinket slots drawn in the HUD block (always four, the unusable ones dimmed). */
	private get slots(): number {
		return TRINKET_SLOTS;
	}
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
		/** Quick match format; without it `?mode=` decides (2×2 when absent). */
		mode?: RunMode;
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
				this.skipCall?.();
			},
		);
		this.skipCall = null;
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
			this.netClock = { seat: null, end: 0, total: 0, auto: [], tick: 0 };
			this.buildClock(client);
			client.listen((m) => this.onNet(m));
			// Back from an overlay: `pump` skipped while paused, so ask for the turn again.
			onSceneEvent(this, 'resume', () => this.pump());
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
				2: run.partner ?? '',
				3: run.rivals.chars[1],
			});
			return;
		}
		const deal = this.tutorial ? TUTORIAL_DEAL : null;
		const rng = new Rng(deal?.seed ?? params.seed ?? randomSeed());
		const duel = !this.tutorial && (data?.mode ?? params.mode) === '1v1';
		const partner: CompanionId = isCompanion(params.partner) ? params.partner : 'bruto';
		// Mano a mano draws one rival from the whole cast (there is no partner to leave out).
		const rivals: CompanionId[] = duel
			? [rng.pick(COMPANION_IDS)]
			: rng.shuffle(COMPANION_IDS.filter((id) => id !== partner)).slice(0, 2);
		const rivalProfiles: AiProfileId[] = rivals.map(() => rng.pick(AI_PROFILE_IDS));
		const ai = (id: AiProfileId): SeatBrain => ({ kind: 'ai', profile: AI_PROFILES[id] });
		const rival = rivals[0] as CompanionId;
		const chars: Record<Seat, string> = {
			0: 'player',
			1: params.boss && isBoss(params.boss) ? params.boss : rival,
			// Seats 2 and 3 are never drawn at a two-seat table.
			2: duel ? rival : partner,
			3: rivals[1] ?? rival,
		};
		const viraText = deal?.vira ?? params.vira;
		const vira = viraText ? parseCard(viraText) : null;
		const quickBoss = params.boss && isBoss(params.boss) ? (params.boss as BossId) : undefined;
		const hand0 = (deal?.hand ?? params.hand)
			?.map((x) => parseCard(x))
			.filter((c): c is Card => c !== null);
		const me: SeatBrain = this.auto ? ai('pro') : { kind: 'human' };
		const rivalBrain1 = rivalBrain(rivalProfiles[0] as AiProfileId, chars[1]);
		const brains: MatchOptions['brains'] = duel
			? [me, rivalBrain1]
			: [
					me,
					rivalBrain1,
					{ kind: 'ai', profile: COMPANIONS[partner].profile },
					rivalBrain(rivalProfiles[1] as AiProfileId, chars[3]),
				];
		this.match = new Match({
			rng,
			// The tutorial's scripted deal stays predictable: no joker there.
			...(this.tutorial ? { deck: standardDeck() } : {}),
			brains,
			...(params.score ? { score: params.score } : {}),
			...(quickBoss ? { boss: quickBoss } : {}),
			// Quick match is plain Truco to 12 (GDD §11); the tutorial teaches the points goal.
			...(this.tutorial
				? { goal: tableGoal(1, 'small') }
				: params.goal && !duel
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
		playMusic(
			this,
			boss === 'reiDoTruco' ? 'music.king' : boss ? 'music.boss' : tableMusic(this),
		);
		playAmbience(this, `amb.${this.place()}`);
		this.bindKeys();
		trackZoom(this, this.cameras.main, (view) => this.layout(view));
		this.cameras.main.fadeIn(200, 5, 5, 8);
		this.renderHand(true);
		// Nobody's controls work until the first pump decides whose turn it is.
		this.updateControls(false);
		this.announceKind();
		// The boss table is no longer announced by the table-choice screen: name and rule here.
		if (boss && this.match.state.kind === 'normal')
			this.time.delayedCall(this.dur(500), () =>
				this.notices.show(
					'boss',
					`${t(`boss.${boss}.name` as I18nKey)}
${tDuel(`boss.${boss}.rule` as I18nKey, this.duel)}`,
					3200,
				),
			);
		pokiGameplay(true);
		this.events.once('shutdown', () => pokiGameplay(false));
		this.time.delayedCall(250, () => this.pump());
	}

	override update(): void {
		this.drawClock();
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

	/** Top-left and width of a seat's clock bar. */
	private clockBar(seat: Seat): { x: number; y: number; w: number } {
		if (seat === 0) {
			const m = CLOCK_BAR.mine;
			return { x: m.x - m.w / 2, y: m.y, w: m.w };
		}
		const [ax, ay] = this.seatUi(seat).avatar;
		return { x: ax - 4, y: ay - 8, w: this.seatCard.w + 8 };
	}

	/** The turn clock of a LAN table: a bar on the timed seat that drains, and a tick at the end. */
	private drawClock(): void {
		if (!this.net) return;
		const c = this.netClock;
		const g = this.clockGfx.clear();
		this.autoBox.setVisible(c.auto.includes(0));
		for (const seat of [0, 1, 2, 3] as const) {
			const label = this.autoLabels[seat];
			if (!label) continue;
			const on = c.auto.includes(seat) && seat !== 0;
			label.setVisible(on);
			if (on) {
				const b = this.clockBar(seat);
				label.setPosition(b.x + b.w / 2, b.y + CLOCK_BAR.h / 2);
			}
		}
		if (c.seat === null) return;
		const ms = Math.max(0, c.end - this.time.now);
		const frac = c.total > 0 ? Math.min(1, ms / c.total) : 0;
		const b = this.clockBar(c.seat);
		const color = frac > 0.5 ? PALETTE.good : frac > 0.2 ? PALETTE.manilha : PALETTE.bad;
		g.fillStyle(PALETTE.panelDark, 0.9).fillRoundedRect(
			b.x - 1,
			b.y - 1,
			b.w + 2,
			CLOCK_BAR.h + 2,
			3,
		);
		g.fillStyle(color, 1).fillRoundedRect(b.x, b.y, b.w * frac, CLOCK_BAR.h, 2);
		const secs = Math.ceil(ms / 1000);
		if (c.seat === 0 && secs > 0 && secs <= TURN_CLOCK_WARN_S && secs !== c.tick) {
			c.tick = secs;
			sfx(this, 'sfx.ui.move');
		}
	}

	/** State snapshot for the smoke test and QA (`window.__GAME__`). */
	probe(): Record<string, unknown> {
		return {
			seats: this.match.seats,
			hands: this.match.hands,
			score: this.match.score,
			winner: this.match.winner,
			actor: this.match.actor(),
			bet: this.match.state.bet,
			kind: this.match.state.kind,
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
				return union(
					SHOW_MONEY_PANEL ? [this.pointsText, this.moneyText] : [this.pointsText],
				);
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
		return this.seatPos(seat).play;
	}

	private portraitPos(seat: Seat): [number, number] {
		return this.seatPos(seat).portrait;
	}

	/** Sidebar text with real depth: cream letters, a dark outline and a solid drop shadow. */
	private deepText(
		size: number,
		color: number = PALETTE.textLight,
	): Phaser.Types.GameObjects.Text.TextStyle {
		return {
			...this.bold(size, color),
			stroke: toCss(shade(PALETTE.panelDark, -0.7)),
			strokeThickness: 1.6,
			shadow: {
				offsetX: 0,
				offsetY: 2,
				color: 'rgba(0,0,0,0.85)',
				blur: 0,
				stroke: true,
				fill: true,
			},
		};
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
		if (champ > 3) board.setTint(champ <= 6 ? PALETTE.feltBlueTint : PALETTE.feltRedTint);
	}

	/** Felt by Championship: green 1–3, blue 4–6, red 7–8 (docs/visual.md §3). */
	private feltColor(): number {
		const champ = this.runState?.champ ?? getParams(this).champ ?? 1;
		return champ <= 3 ? PALETTE.felt : champ <= 6 ? PALETTE.feltBlue : PALETTE.feltRed;
	}

	private buildLayout(chars: Record<Seat, string>): void {
		this.drawTable();
		const card = this.seatCard;
		this.motion = new SeatMotion(
			this,
			() => this.match?.actor(),
			(ms) => this.dur(ms),
			() => comfort.reduceFlashes,
		);
		for (const seat of this.others as readonly Exclude<Seat, 0>[]) {
			const id = chars[seat];
			const ui = this.seatUi(seat);
			const [ax, ay] = ui.avatar;
			const portrait = this.add
				.image(ax + card.w / 2, ay + card.h / 2, tex(this, `charcard.${id}`))
				.setDisplaySize(card.w, card.h);
			// The name plate hangs under the portrait, part of the same card.
			const plate = this.add.graphics();
			plate
				.fillStyle(PALETTE.panelDark, 0.96)
				.fillRoundedRect(ax, ay + card.h - 3, card.w, 17, {
					tl: 0,
					tr: 0,
					bl: 5,
					br: 5,
				});
			const name = this.add
				.text(
					ax + card.w / 2,
					ay + card.h + 5.5,
					this.seatNames[seat] ||
						t((isBoss(id) ? `boss.${id}.name` : `char.${id}`) as I18nKey),
					this.bold(8, isBoss(id) ? PALETTE.bad : PALETTE.textLight),
				)
				.setOrigin(0.5);
			while (name.width > card.w - 6 && name.style.fontSize !== '5px')
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
					// Long lines wrap: the partner's bubble stays left of the Championship card.
					wordWrap: {
						width: ui.wrap ?? CHAMP.x - SAFE.panel - bx - 14,
					},
				})
				.setOrigin(
					...(ui.anchor ?? [ui.tail === 'left' ? 0 : 0.5, ui.tail === 'left' ? 0.5 : 1]),
				)
				.setVisible(false)
				.setDepth(DEPTH.speech);
			const tail = this.add
				.triangle(0, 0, 0, 0, 8, -5, 8, 5, PALETTE.cardFace)
				.setVisible(false)
				.setDepth(DEPTH.speech);
			// Your partner's signal: the same emoji as the picker, at the card's corner.
			const expression = this.add
				.container(ax + card.w - 2, ay + 4, [
					this.add
						.text(0, 0, '', { fontFamily: EMOJI_FONT, fontSize: '22px' })
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
			this.motion.add(seat, portrait, [ax + 10, ay + 10]);
		}
		this.vignette = this.add
			.rectangle(0, 0, 4000, 4000, PALETTE.night, 1)
			.setAlpha(0)
			.setDepth(DEPTH.vignette);
		const center = FELT_CENTER[this.duel ? 'duel' : 'table'];
		this.feltCenter = createFeltCenter(this, this.duel ? 'duel' : 'table', this.backKey);
		this.vira = this.add
			.image(center.vira.x, center.vira.y, tex(this, this.backKey))
			.setScale(VIRA.scale);
		this.viraLabel = this.add
			.text(center.vira.x, center.vira.y + 31, '', this.bold(8, PALETTE.textLight))
			.setOrigin(0.5, 0);
		// Origin at the bottom of its drop shadow, so the panel itself ends at MANILHA.bottom.
		this.manilhaBox = this.add
			.image(MANILHA.x, MANILHA.bottom + SHADOW.panel, '__DEFAULT')
			.setOrigin(0, 1)
			.setVisible(SHOW_MANILHA_BOX);
		this.manilhaText = this.add
			.text(MANILHA.x + PAD.card, MANILHA.bottom - PAD.card, '', {
				...this.bold(TYPE.label, PALETTE.textLight),
				align: 'left',
				lineSpacing: 2,
			})
			.setOrigin(0, 1)
			.setVisible(SHOW_MANILHA_BOX);
		this.effectBox = this.add.container(MANILHA.x, MANILHA.bottom).setVisible(false);
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
				.image(i * slotStep(this.slots), 0, tex(this, `manha.${id}`))
				.setScale((0.4 * slotSize(this.slots)) / 20)
				.setData('id', id)
				.setInteractive({ useHandCursor: true });
			this.tipOn(icon, this.manhaTip, () =>
				this.manhaTip
					.setText(`${t(`manha.${id}.name` as I18nKey)}
${t(`manha.${id}.desc` as I18nKey)}`)
					// Right of the HUD card in the sidebar, level with its top.
					.setOrigin(0, 0)
					.setPosition(HUD.x + HUD.w + GAP.list, HUD.y),
			);
			this.manhaRow.add(icon);
		});
		this.match.trinketList.forEach((e, i) => {
			const medal = trinketMedal(this, e.id, e.level, slotSize(this.slots), false)
				.setPosition(i * slotStep(this.slots), 0)
				.setData('id', e.id)
				.setSize(slotSize(this.slots), slotSize(this.slots))
				.setInteractive({ useHandCursor: true });
			medal.on('pointerover', (p: Phaser.Input.Pointer) => {
				if (!p.wasTouch) this.showTrinketTip(e);
			});
			medal.on('pointerout', (p: Phaser.Input.Pointer) => {
				if (!p.wasTouch) this.hideTrinketTip();
			});
			medal.on('pointerdown', (p: Phaser.Input.Pointer) => {
				if (!p.wasTouch) return;
				this.showTrinketTip(e);
				this.time.delayedCall(TIP_MS, () => this.hideTrinketTip());
			});
			this.manhaRow.add(medal);
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
		// Every notice (new vira, the joker's draw…) goes through this strip (R5.5).
		this.notices = new NoticeBoard(this, (ms) => this.dur(ms));
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
		const bar = (label: string, fn: () => void, x: number, w: number, key?: () => string) =>
			new Button(this, label, fn, {
				w,
				h: 30,
				size: 10,
				hintInside: true,
				...(key ? { hint: key } : {}),
			})
				.setPosition(SIDE.x + x + w / 2, SIDE.bar[0] + SIDE.bar[1] / 2)
				.setDepth(DEPTH.controls);
		// Three equal buttons spanning the sidebar's width, 3 px apart.
		const barW = (SIDE.w - 2 * 3) / 3;
		bar('⚙', () => this.openPause('Settings'), 0, barW);
		bar('II', () => this.openPause(), barW + 3, barW, hint('pause'));
		bar(
			'?',
			() => this.openPause('Rules'),
			2 * (barW + 3),
			barW,
			() => keyHint('F1'),
		);
		this.signPicker = this.add.container(0, 0).setDepth(DEPTH.pickers).setVisible(false);
		const pickerBg = this.add.graphics();
		drawPanel(pickerBg, -46, -SIGN_ROW() / 2 - 6, 190, SIGNS.length * SIGN_ROW() + 12);
		this.signPicker.add(pickerBg);
		this.signBtns = SIGNS.map((sign, i) => {
			const btn = new Button(this, signLabel(sign), () => this.sendSignal(sign), {
				w: 176,
				h: SIGN_ROW() - 4,
				size: 8,
				left: 28,
				emoji: SIGNAL_EMOJI[sign],
			});
			btn.setPosition(48, i * SIGN_ROW());
			this.signPicker.add(btn);
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
			.text(0, -18, this.tx('table.eleven.body'), {
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
			this.tx('table.eleven.fold'),
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
		const half = slotSize(this.slots) / 2;
		this.manhaRow.setPosition(HUD.x + HUD_PAD + half, HUD.y + HUD_PAD + 10);
		this.popup.setPosition(cx, cy - 72);
		this.scoreBox.setPosition(cx, cy - 20);
		this.notices.setPosition(cx, cy - 40);
		this.autoBox?.setPosition(cx, cy + 30);
		this.signPicker.setPosition(ACTIONS.x - ACTIONS.w / 2 - 148, 126);
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
							? keyHint('Enter')
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
		return (
			this.eleven.visible ||
			this.signPicker.visible ||
			this.endPanel.visible ||
			this.partnerAsk !== null
		);
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
		const rects = [
			SIDE.goal,
			...(SHOW_SCORE_PANEL ? [SIDE.chipsMult] : []),
			SIDE.bet,
			SIDE.theirs,
			...(SHOW_MONEY_PANEL ? [SIDE.money] : []),
		];
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
		// The Championship card sits on the felt; its texts start at its own padding.
		const cx = CHAMP.x + SIDEBAR.pad;
		const cInner = CHAMP.w - 2 * SIDEBAR.pad;
		const quick = this.match.goal === undefined && !this.match.boss;
		const champH = quick ? CHAMP.h : CHAMP_MINI.y + CHAMP_MINI.h + SIDEBAR.pad;
		this.add
			.image(
				CHAMP.x,
				CHAMP.y,
				panelTex(this, CHAMP.w, champH, PALETTE.panelDark, RADIUS.panel, SHADOW.panel),
			)
			.setOrigin(0);
		// Smallest text the sidebar may shrink to: never under the touch minimum on touch screens.
		const minPx = touchUi.on ? TOUCH_TEXT_MIN : 6;
		// Long subtitles (touch text, EN) shrink to one line; at the floor they wrap to two, raised.
		const fit = (o: Phaser.GameObjects.Text): Phaser.GameObjects.Text => {
			for (
				let px = Number.parseInt(String(o.style.fontSize), 10);
				o.width > cInner && px > minPx;
			)
				o.setFontSize(--px);
			if (o.width > cInner)
				o.setWordWrapWidth(cInner)
					.setAlign('left')
					.setY(CHAMP.y + 22);
			return o;
		};
		const at = (y: number, str: string, style: Phaser.Types.GameObjects.Text.TextStyle) =>
			this.add.text(lx, y, str, style).setOrigin(0, 0);
		const atChamp = (y: number, str: string, style: Phaser.Types.GameObjects.Text.TextStyle) =>
			this.add.text(cx, y, str, style).setOrigin(0, 0);
		const small = this.deepText(7);
		// The card names the Championship and the table (Mesa 1 → Mesa 2 → Chefão); the boss's
		// rule is in the "in play" box. A quick match keeps its own title.
		this.prizeText = null;
		this.prizeCoin = null;
		if (quick) {
			atChamp(CHAMP.y + SIDE_LABEL, t('menu.quick'), this.bold(10))
				.setOrigin(0.5, 0)
				.setX(CHAMP.x + CHAMP.w / 2);
			fit(atChamp(CHAMP.y + 25, this.tx('table.side.quickSub'), small));
		} else {
			const table = this.match.boss ? 'boss' : size;
			atChamp(CHAMP.y + SIDE_LABEL, t('run.champ', { n: champ }), this.bold(10))
				.setOrigin(0.5, 0)
				.setX(CHAMP.x + CHAMP.w / 2);
			// Second line: the table, and what winning it pays now (a run only).
			const my = CHAMP.y + CHAMP_MINI.y;
			const mw = (cInner - CHAMP_MINI.gap) / 2;
			const mini = (x: number): void => {
				this.add
					.image(x, my, panelTex(this, mw, CHAMP_MINI.h, PALETTE.panel, RADIUS.button))
					.setOrigin(0);
			};
			mini(cx);
			const name = this.add
				.text(
					cx + mw / 2,
					my + CHAMP_MINI.h / 2,
					t(`table.side.table.${table}` as I18nKey),
					{
						...this.bold(8),
					},
				)
				.setOrigin(0.5);
			for (let px = uiPx(8); name.width > mw - 6 && px > minPx; ) name.setFontSize(--px);
			if (this.runState) {
				const rx = cx + mw + CHAMP_MINI.gap;
				mini(rx);
				// A coin (gold disc, darker rim) and the value, centred together in the mini-card.
				this.prizeCoin = this.add
					.graphics()
					.fillStyle(PALETTE.manilha, 1)
					.fillCircle(0, 0, 3.5)
					.lineStyle(1, shade(PALETTE.manilha, -0.4), 1)
					.strokeCircle(0, 0, 3.5);
				this.prizeMid = { x: rx + mw / 2, y: my + CHAMP_MINI.h / 2 };
				this.prizeText = this.add
					.text(0, this.prizeMid.y, '', this.bold(9, PALETTE.manilha))
					.setOrigin(0, 0.5);
				this.prizeShown = null;
			}
		}
		// Without a goal (quick match) the card counts the tentos to 12 instead.
		// One line: the label on the left, the score on the right; the bar under it.
		const goalLine = SIDE.goal[0] + 19;
		at(
			goalLine,
			(this.match.goal === undefined
				? this.tx('table.side.tentos')
				: t('table.side.goal')
			).toLocaleUpperCase(),
			small,
		).setOrigin(0, 0.5);
		this.pointsText = this.add
			.text(lx + SIDE_INNER_W, goalLine, '', {
				...this.deepText(15, PALETTE.manilha),
			})
			.setOrigin(1, 0.5);
		// A quick match scores no hands and pays nothing: its Chips × Mult and money cards stay in
		// place (same sidebar) but faded, so the frozen 0 × 0 and $0 read as "not in this mode".
		const off = this.match.goal === undefined ? 0.35 : 1;
		at(SIDE.chipsMult[0] + SIDE_LABEL, t('table.side.chipsMult'), small)
			.setAlpha(off)
			.setVisible(SHOW_SCORE_PANEL);
		const by = SIDE.chipsMult[0] + 27;
		this.add
			.image(lx, by, panelTex(this, 52, 27, PALETTE.chips, 6))
			.setOrigin(0)
			.setAlpha(off)
			.setVisible(SHOW_SCORE_PANEL);
		this.add
			.image(lx + 62, by, panelTex(this, 52, 27, PALETTE.mult, 6))
			.setOrigin(0)
			.setAlpha(off)
			.setVisible(SHOW_SCORE_PANEL);
		this.add
			.text(lx + 57, by + 13.5, '×', this.text(9, PALETTE.textLight))
			.setOrigin(0.5)
			.setVisible(SHOW_SCORE_PANEL)
			.setAlpha(off)
			.setVisible(SHOW_SCORE_PANEL);
		this.sideChips = this.add
			.text(lx + 26, by + 13.5, '0', this.bold(14))
			.setOrigin(0.5)
			.setAlpha(off)
			.setVisible(SHOW_SCORE_PANEL);
		this.sideMult = this.add
			.text(lx + 88, by + 13.5, '0', this.bold(14))
			.setOrigin(0.5)
			.setAlpha(off)
			.setVisible(SHOW_SCORE_PANEL);
		// One line, like the goal card: the label on the left, the bet and its state on the right.
		const betLine = SIDE.bet[0] + SIDE.bet[1] / 2;
		this.betLabel = at(betLine, t('table.side.bet').toLocaleUpperCase(), small).setOrigin(
			0,
			0.5,
		);
		this.betText = this.add
			.text(lx + SIDE_INNER_W, betLine, '', this.deepText(15, PALETTE.manilha))
			.setOrigin(1, 0.5)
			.setDepth(DEPTH.sideValue);
		this.betNote = this.add
			.text(lx + SIDE_INNER_W, betLine, '', this.deepText(8))
			.setOrigin(1, 0.5);
		// Tentos: one panel, ours (green beads) left and theirs (red) right, a groove between.
		for (const [i, key] of (['table.side.us', 'table.side.them'] as const).entries()) {
			const cx = lx + i * TENTOS.half + TENTOS.half / 2;
			this.add
				.text(cx, SIDE.theirs[0] + 15, this.tx(key).toLocaleUpperCase(), small)
				.setOrigin(0.5);
			// A mark appears here once the pair has closed a queda; hovering it explains it.
			const zone = this.add
				.zone(cx + TENTOS.half / 2 - 9, SIDE.theirs[0] + 15, 14, 14)
				.setInteractive({ useHandCursor: true });
			this.quedaMarks[i] = zone;
			const text = t(i === 0 ? 'table.side.usQueda' : 'table.side.themQueda');
			this.tipOn(zone, this.manhaTip, () =>
				this.manhaTip
					.setText(text)
					.setOrigin(0, 0)
					.setPosition(HUD.x + HUD.w + GAP.list, SIDE.theirs[0]),
			);
			this.beads[i] = Array.from({ length: 12 }, (_, d) => {
				const [x, y] = beadAt(i, d);
				return this.add
					.image(x, y, beadTex(this, 'empty', TENTOS.r))
					.setDepth(DEPTH.sideValue);
			});
		}
		this.moneyText = this.add
			.text(lx, SIDE.money[0] + SIDE.money[1] / 2, '', this.bold(14, PALETTE.money))
			.setOrigin(0, 0.5)
			.setAlpha(off)
			.setVisible(SHOW_MONEY_PANEL);
		// The trinket slots and what the equipped ones do: the sidebar's top card.
		this.add
			.image(
				HUD.x,
				HUD.y,
				panelTex(this, HUD.w, HUD.h, PALETTE.panelDark, RADIUS.panel, SHADOW.panel),
			)
			.setOrigin(0);
		const slots = this.slots;
		const usable = this.runState?.trinketSlots ?? slots;
		const g = this.add.graphics();
		for (let i = 0; i < slots; i++)
			g.lineStyle(1.5, PALETTE.panelLight, i < usable ? 1 : 0.3).strokeRoundedRect(
				HUD.x + HUD_PAD + i * slotStep(slots),
				HUD.y + HUD_PAD + 10 - slotSize(slots) / 2,
				slotSize(slots),
				slotSize(slots),
				RADIUS.button,
			);
		this.hudGfx = this.add.graphics().setDepth(DEPTH.hudShapes);
	}

	/** Bars, ovals and dots of the sidebar and the HUD block. */
	private drawHudShapes(us: number, them: number): void {
		const g = this.hudGfx.clear();
		const m = this.match;
		const lx = SIDE.x + SIDEBAR.pad;
		const done =
			m.goal === undefined ? Math.min(1, us / 12) : Math.min(1, this.hudPoints / m.goal);
		const barY = SIDE.goal[0] + 34;
		g.fillStyle(PALETTE.shadow, 0.6).fillRoundedRect(lx, barY, 114, 7, 3.5);
		if (done > 0) g.fillStyle(PALETTE.manilha, 1).fillRoundedRect(lx, barY, 114 * done, 7, 3.5);
		// Aposta: the number sits on a red block once a call is on the table.
		const called = m.state.bet > 1 || m.state.pending !== null;
		if (called) {
			const b = this.betText;
			g.fillStyle(PALETTE.truco, 1).fillRoundedRect(
				b.x - b.width - 4,
				b.y - 10,
				b.width + 8,
				20,
				5,
			);
		}
		// The groove between the halves: a dark line with a light edge.
		const gx = lx + TENTOS.half;
		const gy = SIDE.theirs[0] + 8;
		const gh = SIDE.theirs[1] - 16;
		g.fillStyle(shade(PALETTE.panelDark, -0.6), 1).fillRect(gx - 1, gy, 1.5, gh);
		g.fillStyle(shade(PALETTE.panelLight, 0.1), 0.7).fillRect(gx + 0.5, gy, 1, gh);
		for (const [i, n] of [us, them].entries()) {
			const lit = Math.min(12, n);
			const kind = i === 0 ? 'green' : 'red';
			const closed = (i === 0 ? m.quedas : m.rivalQuedas) > 0;
			const mark = this.quedaMarks[i];
			if (mark?.input) mark.input.enabled = closed;
			if (closed)
				g.fillStyle(i === 0 ? PALETTE.good : PALETTE.truco, 1).fillCircle(
					lx + i * TENTOS.half + TENTOS.half - 9,
					SIDE.theirs[0] + 15,
					3.2,
				);
			for (let d = 0; d < 12; d++) {
				const bead = this.beads[i]?.[d];
				if (!bead) continue;
				const on = d < lit;
				bead.setTexture(beadTex(this, on ? kind : 'empty', TENTOS.r));
				if (on && d >= (this.beadsLit[i] ?? 0) && !comfort.reduceFlashes) {
					this.tweens.killTweensOf(bead);
					bead.setScale(1.45);
					this.tweens.add({
						targets: bead,
						scale: 1,
						duration: this.dur(180),
						ease: 'Back.easeOut',
					});
				}
			}
			this.beadsLit[i] = lit;
		}
	}

	/**
	 * The "in play" box at the felt's base: icon, name and a line of text. At most the two newest
	 * lines, so a third drops the oldest and the box stays clear of the left portrait. Hidden on a
	 * plain hand; returns its height (0 when hidden).
	 */
	private drawEffects(): number {
		const s = this.match.state;
		// A new hand (fewer effects than were shown) starts the count again.
		if (jokerEffects(s).length < this.fxRevealed) this.fxRevealed = 0;
		const list = visibleHandEffects(handEffects(s, this.match.boss, this.fxRevealed));
		const box = this.effectBox.removeAll(true).setVisible(list.length > 0);
		if (!list.length) return 0;
		const w = 150;
		const icon = 9;
		const textX = PAD.card + icon + 4;
		const wrap = { width: w - textX - PAD.card };
		const rows: Phaser.GameObjects.GameObject[] = [];
		let y = PAD.card;
		for (const e of list) {
			rows.push(
				this.add
					.image(PAD.card + icon / 2, y + icon / 2, tex(this, `icon.${e.icon}`))
					.setDisplaySize(icon, icon),
			);
			const name = this.add.text(textX, y, e.name, {
				...this.bold(TYPE.label, PALETTE.manilha),
				align: 'left',
				wordWrap: wrap,
			});
			rows.push(name);
			y += name.height;
			if (e.desc) {
				const desc = this.add.text(textX, y, e.desc, {
					...this.text(7, PALETTE.textLight),
					align: 'left',
					wordWrap: wrap,
				});
				rows.push(desc);
				y += desc.height;
			}
			y += 3;
		}
		const h = Math.ceil(y - 3 + PAD.card);
		// As wide as the longest line (up to `w`): a short rule leaves the hand's cards clear.
		const texts = rows.filter(
			(r): r is Phaser.GameObjects.Text => r instanceof Phaser.GameObjects.Text,
		);
		const bw = Math.min(
			w,
			Math.ceil(Math.max(...texts.map((r) => r.width)) + textX + PAD.card),
		);
		box.setPosition(MANILHA.x, MANILHA.bottom - h);
		box.add([
			this.add
				.image(
					0,
					h + SHADOW.panel,
					panelTex(this, bw, h, PALETTE.panelDark, RADIUS.panel, SHADOW.panel),
				)
				.setOrigin(0, 1),
			...rows,
		]);
		return h;
	}

	/**
	 * The prize mini-card: what winning the table pays right now (`projectedReward`, the same math
	 * as the payout); a change counts up (green) or down (red) for a moment. Sheila adds "×2?".
	 */
	private refreshPrize(): void {
		const text = this.prizeText;
		if (!text || !this.runState) return;
		const p = projectedReward(this.runState, this.match.money, this.match.state.score.them);
		const show = (n: number): void => {
			text.setText(`${t('table.money', { n: Math.round(n) })}${p.mayDouble ? ' ×2?' : ''}`);
			const { x, y } = this.prizeMid;
			const left = x - (7 + 3 + text.width) / 2;
			this.prizeCoin?.setPosition(left + 3.5, y);
			text.setX(left + 10);
		};
		const from = this.prizeShown;
		// Unchanged: a count already running keeps going.
		if (from === p.gain) return;
		this.prizeShown = p.gain;
		this.tweens.killTweensOf(this.prizeCounter);
		if (from === null || comfort.reduceFlashes) {
			text.setColor(toCss(PALETTE.manilha));
			show(p.gain);
			return;
		}
		text.setColor(toCss(p.gain > from ? PALETTE.good : PALETTE.bad));
		this.prizeCounter.v = from;
		this.tweens.add({
			targets: this.prizeCounter,
			v: p.gain,
			duration: 450,
			ease: 'Quad.easeOut',
			onUpdate: () => show(this.prizeCounter.v),
			onComplete: () => {
				show(p.gain);
				text.setColor(toCss(PALETTE.manilha));
			},
		});
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
		// The state goes right of the number when both fit beside the label, else only the number.
		const gap = 5;
		const room = SIDE_INNER_W - this.betLabel.width - 8;
		const both = this.betText.width + gap + this.betNote.width <= room;
		this.betNote.setVisible(both);
		this.betText.setX(
			SIDE.x + SIDEBAR.pad + SIDE_INNER_W - (both ? this.betNote.width + gap : 0),
		);
		this.pointsText.setText(
			m.goal === undefined
				? `${Math.min(12, s.score.us)} × ${Math.min(12, s.score.them)}`
				: `${formatPoints(this.hudPoints, lang)} / ${formatPoints(m.goal, lang)}`,
		);
		// Big numbers shrink so the score never reaches the label on its left.
		const base = uiPx(15);
		this.pointsText.setFontSize(base);
		for (let px = base; this.pointsText.width > SIDE_INNER_W - 40 && px > 8; )
			this.pointsText.setFontSize(--px);
		this.moneyText.setText(t('table.money', { n: this.hudMoney }));
		this.refreshPrize();
		this.drawHudShapes(s.score.us, s.score.them);
		// A Cartomante hides the vira until the first trick is over.
		const hidden = m.boss === 'cartomante' && s.tricks.length === 1 && !s.over;
		this.vira.setTexture(hidden ? tex(this, this.backKey) : this.cardKey(s.vira));
		const count = m.has('countManilhas')
			? `\n${t('table.manilhasSeen', { n: manilhasSeen(s) })}`
			: '';
		const manilha = hidden ? t('table.viraHidden') : t('table.manilha', { r: s.manilha });
		const zap = hidden
			? ''
			: `\n${t('table.zap', { c: `${manilhaOf(s.manilha)}${SUIT_MARK.clubs}` })}`;
		this.viraLabel.setText(t('table.vira'));
		// A trick whose cards still lie on the felt is not announced before they are collected.
		const settled = s.tricks.map((tr, i) =>
			i === s.tricks.length - 1 && this.played.length > 0 ? {} : tr,
		);
		this.feltCenter.update({
			bet: s.bet,
			pending: s.pending?.to ?? null,
			marks: trickMarks(settled, 0),
			live: !s.over,
			dur: (ms) => this.dur(ms),
		});
		this.manilhaText.setText(`${manilha}${zap}${count}`);
		const mw = Math.ceil(this.manilhaText.width) + 2 * PAD.card;
		const mh = Math.ceil(this.manilhaText.height) + 2 * PAD.card;
		this.manilhaBox.setTexture(
			panelTex(this, mw, mh, PALETTE.panelDark, RADIUS.panel, SHADOW.panel),
		);
		// The "in play" box sits at the felt's base; Manilha/ZAP (when shown) stacks above it.
		const eh = this.drawEffects();
		const mb = MANILHA.bottom - (eh ? eh + SHADOW.panel + GAP.panel : 0);
		this.manilhaBox.setY(mb + SHADOW.panel);
		this.manilhaText.setY(mb - PAD.card);
		for (const [seat, v] of this.seats) {
			v.backs.removeAll(true);
			const hand = s.hands[seat];
			hand.forEach((card, i) => {
				const peeked =
					(m.peek?.seat === seat && m.peek.cardId === card.id) ||
					s.known.some((k) => k.to === 'us' && k.seat === seat && k.cardId === card.id);
				const face = this.reveal || peeked || jokerEffects(s).includes('showdown');
				const ui = this.seatUi(seat as Exclude<Seat, 0>);
				const img = this.add
					.image(
						i * ui.step[0],
						i * ui.step[1],
						face
							? this.cardKey(card)
							: tex(this, this.backKey.replace('back.', 'back.tile.')),
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
		// The same size and drawing `registerPortraits` uses when a late picture redraws it.
		const [w, h] = tiltedSize(key, deg);
		return canvasTex(this, tiltedKey(key, deg), w, h, (ctx) => drawTilted(ctx, key, deg));
	}

	/** Manilhas change every hand, so their faces get a gold frame (the ZAP also a star). */
	private markManilha(img: Phaser.GameObjects.Image, card: Card): void {
		const zap = isZap(card, this.match.state.manilha);
		if (!zap && card.rank !== this.match.state.manilha) return;
		const key = tex(this, markedArt(img.getData('key') ?? img.texture.key, zap ? 'z' : 'm'));
		img.setTexture(key).setData('key', key);
		if (zap) this.markZap(img);
		else this.manilhaGlow(img);
	}

	/** A manilha (not the ZAP): the face darkened and an orange glow around the card. */
	private manilhaGlow(img: Phaser.GameObjects.Image): void {
		img.setTint(PALETTE.manilhaShade);
		img.filters?.internal.clear().addGlow(PALETTE.manilhaGlow, 3.5);
	}

	/**
	 * The ZAP's halo: a gold comet running around the card's edge and four stars blinking at its corners.
	 * It sits under the card in the card's parent and follows it on every update.
	 */
	private zapHalo(img: Phaser.GameObjects.Image): void {
		const comet = this.add.graphics();
		const corners: [number, number][] = [
			[-CARD_W / 2 + 3, -CARD_H / 2 + 4],
			[CARD_W / 2 - 3, -CARD_H / 2 + 9],
			[-CARD_W / 2 + 6, CARD_H / 2 - 5],
			[CARD_W / 2 - 4, CARD_H / 2 - 3],
		];
		const stars = corners.map(([x, y], i) => {
			const star = this.add
				.image(x, y, sparkTexture(this))
				.setTint(PALETTE.zapGoldLight)
				.setScale(1.4);
			this.tweens.add({
				targets: star,
				alpha: 0,
				duration: 420,
				yoyo: true,
				repeat: -1,
				delay: i * 210,
				ease: 'Sine.easeInOut',
			});
			return star;
		});
		const halo = this.add.container(img.x, img.y, [comet, ...stars]);
		const host = img.parentContainer;
		if (host) host.addAt(halo, host.getIndex(img));
		else halo.setDepth(img.depth - 0.1);
		this.halos.push({ img, halo, comet, phase: 0 });
		if (!this.haloSync) {
			this.haloSync = true;
			onSceneEvent(this, 'update', () => this.syncHalos());
			this.events.once('shutdown', () => {
				this.haloSync = false;
				this.halos = [];
			});
		}
	}

	private syncHalos(): void {
		const dt = this.game.loop.delta;
		this.halos = this.halos.filter((e) => {
			const { img, halo, comet } = e;
			if (!img.active) {
				halo.destroy();
				return false;
			}
			halo.setPosition(img.x, img.y).setVisible(img.visible);
			e.phase = (e.phase + dt / COMET_MS) % 1;
			drawComet(comet, e.phase);
			return true;
		});
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
		img.filters?.internal.clear().addGlow(PALETTE.zapGoldLight, 3);
		this.zapHalo(img);
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
			const key = s.kind === 'iron' ? tex(this, this.backKey) : this.cardKey(card);
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
			this.notices.show('zap', t('table.zapDealt'), 1400);
		}
	}

	private announceKind(): void {
		const k = this.match.state.kind;
		if (k === 'iron') this.notices.show('iron', t('table.iron'), 1600);
		// When you decide the mão de 11 its panel carries the title: no banner over it.
		if (k === 'eleven' && (this.match.state.elevenTeam !== 'us' || this.auto))
			this.notices.show('eleven', t('table.eleven.title'), 1200);
		// After the banner: the side at 11 talks (your partner, or the rival on the right).
		const s = this.match.state;
		const talker: Seat = this.duel ? 1 : 2;
		if (k === 'iron')
			this.time.delayedCall(this.dur(1600), () => this.chat(talker, 'say.iron', 2));
		if (k === 'eleven')
			this.time.delayedCall(this.dur(1200), () =>
				this.chat(s.elevenTeam === 'them' ? 1 : talker, 'say.eleven', 3),
			);
		// Vignette for the mão de 11 and the iron hand (B6.1).
		this.tweens.add({
			targets: this.vignette,
			alpha: k === 'normal' ? 0 : k === 'iron' ? 0.55 : 0.3,
			duration: this.dur(300),
		});
		sfx(this, 'sfx.card.shuffle');
		this.pendingCall = 3;
		this.handsSinceJoke++;
		if (k === 'normal' && jokeDue(this.handsSinceJoke, this.chatter.next()))
			this.time.delayedCall(this.dur(VO_JOKE.delayMs), () => this.tellJoke());
	}

	/** A calm-moment joke by a random NPC, never over another line or speech bubble. */
	private tellJoke(): void {
		if (this.net || voiceBusy()) return;
		for (const v of this.seats.values()) if (v.bubble.visible) return;
		const seat = this.others[this.chatter.int(0, this.others.length - 1)] ?? 1;
		const char = this.charOf(seat);
		const joke = nextJoke(this.lastJoke.get(char), this.chatter.next());
		if (!voice(this, char, joke)) return;
		this.lastJoke.set(char, joke);
		this.handsSinceJoke = 0;
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

	private trinketTip: Phaser.GameObjects.Container | null = null;

	private hideTrinketTip(): void {
		this.trinketTip?.destroy();
		this.trinketTip = null;
	}

	/** Tooltip of an equipped trinket: name, rarity, Bonus (green) and Flaw (red) at its level. */
	private showTrinketTip(e: { id: string; level: number; flawX?: number }): void {
		this.hideTrinketTip();
		const tx = trinketTexts(e.id, e.level, e.flawX);
		const w = 150;
		const rows: [string, number, number][] = [
			[trinketName(e.id), PALETTE.textLight, 8],
			[trinketRarityName(e.level), levelColor(e.level), 6.5],
			[tx.perk, PALETTE.good, 7],
			[tx.flaw, PALETTE.bad, 7],
		];
		const c = this.add.container(HUD.x + HUD.w + GAP.list, HUD.y).setDepth(DEPTH.tips);
		const bg = this.add.graphics();
		c.add(bg);
		let y = 4;
		for (const [str, color, px] of rows) {
			const o = this.add
				.text(5, y, str, {
					...this.bold(px, color),
					align: 'left',
					wordWrap: { width: w - 10 },
				})
				.setOrigin(0, 0);
			c.add(o);
			y += o.height + 2;
		}
		bg.fillStyle(PALETTE.panelDark, 1).fillRoundedRect(0, 0, w, y + 3, RADIUS.button);
		bg.lineStyle(1.5, levelColor(e.level), 1).strokeRoundedRect(0, 0, w, y + 3, RADIUS.button);
		this.trinketTip = c;
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
		const ui = this.seatUi(seat);
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
					Math.min(Math.max(ui.avatar[0] + this.seatCard.w / 2, b.left + 9), b.right - 9),
					b.bottom + 2,
				)
				.setAngle(105);
		v.tail.setVisible(true);
		this.time.delayedCall(this.dur(ms), () => {
			v.bubble.setVisible(false);
			v.tail.setVisible(false);
		});
	}

	/**
	 * A reaction (docs/game-feel.md §6): the painted card has one pose, so `expr` becomes a motion,
	 * a colour wash and an emotion stamp. `_ms` is kept for the callers; each reaction has its own length.
	 */
	private face(seat: Seat, expr: Expression, _ms?: number, strong = false): void {
		this.motion.react(seat, expr, strong);
	}

	/** Seats react to the events whose animation does not call `face` itself (truco and folded do). */
	private reactTo(e: TableEvent): void {
		const cheer = (winner: Team, strong: boolean) => {
			for (const seat of this.seats.keys())
				this.face(seat, teamOf(seat) === winner ? 'happy' : 'sweat', undefined, strong);
		};
		switch (e.type) {
			case 'trick':
				if (e.result === 'tie')
					for (const seat of this.seats.keys()) this.face(seat, 'eyebrow');
				else cheer(e.result, false);
				break;
			case 'accepted':
				this.face(e.seat, 'eyebrow');
				break;
			case 'signal':
				if (e.seat === 2) this.face(2, 'wink');
				if (e.seat !== 0 && teamOf(e.seat) === 'them' && e.caughtBy.includes(0))
					this.face(e.seat, 'mouth');
				if (e.seat === 0) for (const by of e.caughtBy) this.face(by, 'tongue');
				break;
			case 'handOver': {
				const queda = this.match.outcome === 'queda' || this.match.outcome === 'rivalQueda';
				if (e.end.winner) cheer(e.end.winner, queda);
				break;
			}
		}
	}

	/**
	 * Your partner's signal: the exact gesture they made (its icon with the card's badge) beside
	 * their card, and the status line says in words what it claims. It may be a lie, but it is the
	 * gesture they made.
	 */
	private partnerSignal(sign: Sign): void {
		this.signMark(2, sign);
		const cat = SIGN_CATEGORY[sign];
		this.status.setText(t('table.partnerSign', { cat: t(`sign.cat.${cat}` as I18nKey) }));
	}

	/** The partner's warning before a truco: the honest signal, as the same emoji the player sends. */
	private partnerTrucoEmoji(): string {
		const hand = this.match.state.hands[2];
		const sign = hand?.length ? honestSign(hand, this.match.state.manilha) : 'nothing';
		return SIGNAL_EMOJI[sign];
	}

	/**
	 * Partner is about to call truco. The player sees only the emoji and answers OK (call) or
	 * Cancel (play on without the call). Headless and `?auto=1` take OK without waiting.
	 */
	private askPartnerTruco(truco: Action): void {
		const headless =
			this.auto || (typeof navigator !== 'undefined' && navigator.webdriver === true);
		if (headless) {
			void this.run(truco);
			return;
		}
		this.partnerAsk?.destroy();
		const w = 216;
		const h = 170;
		// Upper middle of the felt: below the partner, above the hand, left of the action buttons.
		const x = 268;
		const y = 112;
		const box = this.add.container(0, 0).setDepth(DEPTH.eleven);
		const g = this.add.graphics();
		drawPanel(g, x, y, w, h);
		const question = this.add
			.text(x + w / 2, y + 8, t('table.partnerTrucoAsk'), {
				...this.text(10.5, PALETTE.textLight),
				align: 'center',
				wordWrap: { width: w - 16 },
			})
			.setOrigin(0.5, 0);
		const emoji = this.add
			.text(x + w / 2, y + 64, this.partnerTrucoEmoji(), {
				fontFamily: EMOJI_FONT,
				fontSize: '28px',
			})
			.setOrigin(0.5);
		const go = (ok: boolean): void => {
			box.destroy();
			this.partnerAsk = null;
			const action = ok ? truco : continueWithoutTruco(this.match.legal(2));
			void this.run(action);
		};
		// Stacked and centred under the emoji: OK above Cancel, both inside the card.
		const okBtn = new Button(this, t('table.partnerTrucoOk'), () => go(true), {
			w: 160,
			h: 34,
			size: 20,
			color: PALETTE.good,
		}).setPosition(x + w / 2, y + 100);
		const cancelBtn = new Button(this, t('table.partnerTrucoCancel'), () => go(false), {
			w: 160,
			h: 34,
			size: 18,
		}).setPosition(x + w / 2, y + 142);
		box.add([g, question, emoji, okBtn, cancelBtn]);
		this.partnerAsk = box;
	}

	/** The signal emoji over a portrait: the partner's, or a caught rival's. */
	private signMark(seat: Seat, sign: Sign): void {
		const v = this.seats.get(seat);
		if (!v) return;
		const mark = v.expression.list[0] as Phaser.GameObjects.Text;
		mark.setText(SIGNAL_EMOJI[sign]);
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
			this.chat(this.chatter.pick(this.others), 'say.tie', 3, 0.35);
			return;
		}
		const seat: Seat = winner !== 0 ? winner : this.chatter.pick(this.others);
		const won = teamOf(seat) === teamOf(winner);
		this.chat(
			seat,
			won ? (this.duel ? 'say.trick.duel' : 'say.trick.us') : 'say.trick.them',
			3,
			0.35,
		);
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
			const action = m.aiAction(actor);
			if (action.kind === 'truco' && actor === 2) {
				this.askPartnerTruco(action);
				return;
			}
			void this.run(action);
		});
	}

	/** The clock's bar, the "auto" tags on other seats and my "I'm back" panel (hidden until needed). */
	private buildClock(client: NetClient): void {
		this.clockGfx = this.add.graphics().setDepth(DEPTH.signal);
		this.autoLabels = ([0, 1, 2, 3] as const).map(() =>
			this.add
				.text(0, 0, t('net.auto.seat'), this.bold(5, PALETTE.textLight))
				.setOrigin(0.5)
				.setDepth(DEPTH.signal)
				.setVisible(false),
		);
		const panel = this.add.graphics();
		drawPanel(panel, -120, -34, 240, 68, {
			shadow: 3,
			fill: PALETTE.panelDark,
			radius: RADIUS.panel,
		});
		const label = this.add
			.text(0, -16, t('net.auto.you'), {
				...this.text(9, PALETTE.manilha),
				align: 'center',
				wordWrap: { width: 220 },
			})
			.setOrigin(0.5);
		const back = new Button(this, t('net.auto.back'), () => this.takeBack(client), {
			w: 120,
			h: 20,
			size: 10,
			color: PALETTE.good,
		}).setPosition(0, 18);
		this.autoBox = this.add
			.container(0, 0, [panel, label, back])
			.setDepth(DEPTH.eleven)
			.setVisible(false);
		this.autoBox.setPosition(this.cx, this.cy + 30);
	}

	private takeBack(client: NetClient): void {
		client.send({ type: 'back' });
		this.netClock.auto = this.netClock.auto.filter((s) => s !== 0);
	}

	/** A message from the LAN server: steps and deals queue up and play one after the other. */
	private onNet(m: ServerMessage): void {
		// A new `start` while the table is open (the host began another match): portraits and
		// names may differ, so the table is built again instead of queued as a deal.
		if (m.type === 'start' && this.net) {
			const { client } = this.net;
			// Detached first: leaving the scene must not leave the room (the shutdown hook checks).
			this.net = null;
			client.listen(null);
			this.scene.restart({ net: { client, start: m.start, snap: m.snap } });
		} else if (m.type === 'step' || m.type === 'deal' || m.type === 'start') {
			this.netQueue.push(m);
			void this.drain();
		} else if (m.type === 'timer') {
			const c = this.netClock;
			c.seat = m.seat;
			c.end = this.time.now + m.ms;
			c.total = Math.max(m.ms, (this.net?.client.lobby?.clockS ?? 0) * 1000);
			c.auto = m.auto;
			c.tick = 0;
		} else if (m.type === 'rejected') {
			sfx(this, 'sfx.ui.error');
			this.busy = false;
			this.pump();
		} else if (m.type === 'closed') {
			this.netQueue = [];
			this.notices.show('info', t('net.closed'), 2000);
			this.time.delayedCall(2200, () => fadeTo(this, 'Menu'));
		}
	}

	private async drain(): Promise<void> {
		if (this.draining) return;
		this.draining = true;
		const match = this.match as RemoteMatch;
		// A paused table (manual, settings) keeps animating what arrives; only a stopped one quits.
		const gone = (): boolean => this.sys.settings.status >= Phaser.Scenes.SHUTDOWN;
		for (let m = this.netQueue.shift(); m; m = this.netQueue.shift()) {
			if (gone()) break;
			this.busy = true;
			this.updateControls(false);
			match.load(m.snap);
			if (m.type === 'step') {
				for (const e of m.events) {
					if (gone()) return;
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
		this.reactTo(e);
		switch (e.type) {
			case 'played': {
				if (e.seat === 0) this.renderHand();
				else this.refreshHud();
				const [px, py] = this.playPos(e.seat);
				const key = e.faceDown ? tex(this, this.backKey) : this.cardKey(e.card);
				const img = this.add
					.image(...this.portraitPos(e.seat), key)
					.setData('seat', e.seat)
					.setScale(PLAYED_SCALE)
					.setDepth(PLAYED_DEPTH[e.seat]);
				if (!e.faceDown) this.markManilha(img, e.card);
				this.played.push(img);
				const weight = cardWeight(e.card, this.match.state.manilha, e.faceDown);
				await flyCard(this.fx, img, [px, py], weight);
				landCard(this.fx, img, weight);
				const feel = TIER_FEEL[weight.tier];
				sfx(
					this,
					e.faceDown ? 'sfx.card.cover' : 'sfx.card.play',
					feel.volume,
					feel.detune,
				);
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
				const trickText =
					e.result === 'tie' ? t('table.trick.tie') : this.tx(`table.trick.${e.result}`);
				this.status.setText(trickText);
				this.cue('trick');
				if (e.result === 'tie') tieBump(this.fx, this.played);
				await this.wait(TABLE_TIMING.trickHold);
				const to =
					e.winner !== undefined
						? this.portraitPos(e.winner)
						: ([this.cx, this.cy - 20] as [number, number]);
				await collectTrick(this.fx, this.played, to);
				for (const img of this.played) img.destroy();
				this.played = [];
				// Said once the cards are gone: the strip sits where the top card was.
				this.notices.show(
					e.result === 'tie' ? 'trickTie' : e.result === 'us' ? 'trickUs' : 'trickThem',
					trickText,
				);
				// The marker of this trick shows its result as the cards leave.
				this.refreshHud();
				break;
			}
			case 'truco': {
				sfx(this, 'sfx.truco', isTrucoStep(e.to) ? TRUCO_CALL[e.to].volume : 1);
				if (e.to === 12) sfx(this, 'sfx.bet.doze');
				this.cue('truco');
				this.pendingCall = e.to;
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
				if (isTrucoStep(e.to)) {
					const call: TrucoCallHandle = playTrucoCall(this, {
						step: e.to,
						label: t(CALL_KEY[e.to] ?? 'table.call.3'),
						centre: [this.cx, this.cy],
						from: e.seat === 0 ? null : this.portraitPos(e.seat),
						charId: e.seat === 0 ? null : this.charOf(e.seat),
						speed: this.speed,
					});
					this.skipCall = call.skip;
					await call.done;
					this.skipCall = null;
				} else await this.wait(700);
				// The proposed value shows on the chips as the call leaves the screen.
				this.refreshHud();
				break;
			}
			case 'accepted':
				sfx(this, 'sfx.bet.accept');
				// The stack slams with the notice, not at the end of the action.
				this.refreshHud();
				this.notices.show('raise', t('table.raise', { n: e.bet }));
				if (e.seat !== 0) {
					voice(this, this.charOf(e.seat), acceptLine(this.chatter.next()));
					this.say(e.seat, this.line('say.accept', 5));
				}
				await this.wait(500);
				break;
			case 'folded':
				sfx(this, 'sfx.bet.run');
				this.notices.show('fold', t('table.folded'));
				if (e.seat !== 0) {
					voice(this, this.charOf(e.seat), foldLine(this.pendingCall));
					this.say(e.seat, this.line('say.fold', 5));
					this.face(e.seat, 'sweat', 900);
				}
				await this.wait(600);
				break;
			case 'joker': {
				await this.jokerRoulette(e.effect);
				this.fxRevealed++;
				this.refreshHud();
				break;
			}
			case 'vira': {
				sfx(this, 'sfx.card.flip');
				this.refreshHud();
				this.notices.show('vira', t('table.newVira'));
				this.vira.setScale(0, VIRA.scale);
				await this.tween({ targets: this.vira, scaleX: VIRA.scale, duration: 220 });
				break;
			}
			case 'signal': {
				sfx(this, 'sfx.signal');
				if (e.seat === 0) {
					const cat = SIGN_CATEGORY[e.sign];
					this.status.setText(
						t('table.signalSent', { sign: t(`sign.${e.sign}` as I18nKey) }),
					);
					this.speak(
						2,
						t('table.signalAck', { cat: t(`sign.cat.${cat}` as I18nKey) }),
						PALETTE.textDark,
						1600,
					);
				}
				if (e.seat === 2) this.partnerSignal(e.sign);
				if (e.seat !== 0 && teamOf(e.seat) === 'them' && e.caughtBy.includes(0)) {
					this.signMark(e.seat, e.sign);
					this.status.setText(
						t('table.caught', { sign: t(`sign.${e.sign}` as I18nKey) }),
					);
				}
				if (e.seat === 0 && e.caughtBy.length) {
					sfx(this, 'sfx.signal.caught');
					this.notices.show('caught', t('table.youWereCaught'));
					const by = e.caughtBy.find((seat) => seat !== 0);
					if (by !== undefined) this.chat(by, 'say.caught', 3);
				}
				await this.wait(250);
				break;
			}
			case 'eleven':
				this.eleven.setVisible(false);
				this.notices.show(
					'eleven',
					this.tx(e.play ? 'table.eleven.played' : 'table.eleven.folded'),
				);
				await this.wait(500);
				break;
			case 'handOver': {
				const { winner, tentos } = e.end;
				this.refreshHud();
				if (winner === 'them') sfx(this, 'sfx.hand.lose');
				this.notices.show(
					winner ? (winner === 'us' ? 'handUs' : 'handThem') : 'handNone',
					winner
						? this.tx(winner === 'us' ? 'table.hand.us' : 'table.hand.them', {
								n: tentos,
							})
						: t('table.hand.none'),
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
					this.notices.show('queda', t('table.queda'));
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
		this.notices.show(
			'joker',
			card ? `${t(`special.${card}.name` as I18nKey).toUpperCase()}!` : t('table.joker'),
			500,
		);
		await this.wait(450);
		for (let i = 0; i < 8; i++) {
			const e = pool[(pool.indexOf(effect) + step + i * step) % pool.length];
			this.notices.show('joker', name(e as PlayEffect), 200);
			sfx(this, 'sfx.ui.move');
			await this.wait(60 + i * 12);
		}
		sfx(this, 'sfx.pack.open');
		this.notices.show('joker', name(effect), 1500);
		this.popup
			.setText(tDuel(`joker.${effect}.desc` as I18nKey, this.duel))
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
			if (/^(manha|mod|joker|trinket):/.test(st.source)) {
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
		const name =
			kind === 'trinket' ? trinketName(id ?? '') : t(`${kind}.${id}.name` as I18nKey);
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
			(o) =>
				(o instanceof Phaser.GameObjects.Image ||
					o instanceof Phaser.GameObjects.Container) &&
				o.getData('id') === id,
		);
		if (
			icon instanceof Phaser.GameObjects.Image ||
			icon instanceof Phaser.GameObjects.Container
		)
			this.tweens.add({
				targets: icon,
				scale: icon.scale * 1.3,
				yoyo: true,
				duration: this.dur(120),
			});
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
			// The prize card keeps the value it promised; after the payout the projection is moot.
			this.prizeText = null;
			reward = finishTable(this.runState, {
				won: winner === 'us',
				rivalTentos: m.state.score.them,
				money: m.money,
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

	/**
	 * The won table's reward as cards: one mini-card per payout line (icon, label, value) and the
	 * Total under them, all one family (light panel with depth), the Total marked by a thin gold
	 * edge and a bigger number; the cards come in one by one and their numbers count up (all at
	 * once with "reduce flashes"). Lines that are always there show even at $0 (greyed); the Jhony
	 * and Sheila lines only when they apply. Returns the body's height.
	 */
	private rewardCards(into: Phaser.GameObjects.Container, r: NonNullable<TableReward>): number {
		const extra = r.doubled
			? Math.max(0, r.table) + r.prize + r.speed + r.interest + r.partner
			: 0;
		const lines: { icon: string; label: I18nKey; value: number }[] = [
			{ icon: 'coin', label: 'table.end.prize', value: r.prize },
			{ icon: 'next', label: 'table.end.speed', value: r.speed },
			{ icon: 'calc', label: 'table.end.interest', value: r.interest },
			...(this.runState?.partner === 'jhony'
				? [{ icon: 'people', label: 'table.end.partner' as I18nKey, value: r.partner }]
				: []),
			{ icon: 'cards', label: 'table.end.table', value: r.table },
			...(r.doubled
				? [{ icon: 'sparkle', label: 'table.end.double' as I18nKey, value: extra }]
				: []),
		];
		const total = r.prize + r.speed + r.interest + r.partner + r.table + extra;
		const H = END_CARD.h;
		const perRow = lines.length <= 4 ? lines.length : Math.ceil(lines.length / 2);
		const rows = Math.ceil(lines.length / perRow);
		const money = (n: number): string =>
			`${n > 0 ? '+' : n < 0 ? '−' : ''}${t('table.money', { n: Math.abs(Math.round(n)) })}`;
		const tint = (n: number): number =>
			n > 0 ? PALETTE.manilha : n < 0 ? PALETTE.bad : PALETTE.textDim;
		const still = comfort.reduceFlashes;
		const count = (text: Phaser.GameObjects.Text, to: number, delay: number): void => {
			if (still || !to) return void text.setText(money(to));
			const c = { v: 0 };
			text.setText(money(0));
			this.tweens.add({
				targets: c,
				v: to,
				delay,
				duration: 320,
				ease: 'Quad.easeOut',
				onUpdate: () => text.setText(money(c.v)),
				onComplete: () => text.setText(money(to)),
			});
		};
		const enter = (o: Phaser.GameObjects.Container, delay: number): void => {
			if (still) return;
			const y = o.y;
			o.setAlpha(0).setY(y + 6);
			this.tweens.add({
				targets: o,
				alpha: 1,
				y,
				delay,
				duration: 160,
				ease: 'Quad.easeOut',
			});
		};
		lines.forEach((line, i) => {
			const row = Math.floor(i / perRow);
			const inRow = Math.min(perRow, lines.length - row * perRow);
			const col = i - row * perRow;
			// Every row spans the content width: its cards share it, END_GAP apart.
			const W = (END_INNER - (inRow - 1) * END_GAP) / inRow;
			const x = -END_INNER / 2 + col * (W + END_GAP) + W / 2;
			const y = row * (H + END_GAP) + H / 2;
			const card = this.add.container(x, y);
			card.add(this.add.image(0, 0, panelTex(this, W, H, PALETTE.panelLight, RADIUS.button)));
			card.add(this.endIcon(line.icon, 0, -H / 2 + 8));
			card.add(
				this.add
					.text(0, -H / 2 + 18, t(line.label), this.text(6, PALETTE.textDim))
					.setOrigin(0.5),
			);
			const value = this.add
				.text(0, H / 2 - 9, '', this.bold(10, tint(line.value)))
				.setOrigin(0.5);
			card.add(value);
			into.add(card);
			enter(card, i * 90);
			count(value, line.value, i * 90 + 80);
		});
		const gridH = rows * H + (rows - 1) * END_GAP;
		const ty = gridH + END_GAP + END_TOTAL.h / 2;
		const box = this.add.container(0, ty);
		const edge = this.add
			.graphics()
			.lineStyle(1, PALETTE.manilha, 1)
			.strokeRoundedRect(
				-END_INNER / 2 + 0.5,
				-END_TOTAL.h / 2 + 0.5,
				END_INNER - 1,
				END_TOTAL.h - 1,
				RADIUS.button,
			);
		const totalValue = this.add
			.text(END_INNER / 2 - END_PAD, 0, '', this.bold(14, tint(total)))
			.setOrigin(1, 0.5);
		box.add([
			this.add.image(
				0,
				0,
				panelTex(this, END_INNER, END_TOTAL.h, PALETTE.panelLight, RADIUS.button),
			),
			edge,
			this.add
				.text(-END_INNER / 2 + END_PAD, 0, t('table.end.total'), this.bold(9))
				.setOrigin(0, 0.5),
			totalValue,
		]);
		into.add(box);
		const last = lines.length * 90;
		enter(box, last);
		count(totalValue, total, last + 80);
		return ty + END_TOTAL.h / 2;
	}

	/** A reward card's icon: all gold, 10 px, line style (the coin is a drawn ring). */
	private endIcon(name: string, x: number, y: number): Phaser.GameObjects.GameObject {
		if (name === 'coin')
			return this.add
				.graphics()
				.lineStyle(1.6, PALETTE.manilha, 1)
				.strokeCircle(x, y, 4)
				.lineStyle(1.2, PALETTE.manilha, 1)
				.lineBetween(x, y - 2, x, y + 2);
		return this.add
			.image(x, y, tex(this, `icon.${name}`))
			.setDisplaySize(10, 10)
			.setTint(PALETTE.manilha);
	}

	/** The end-of-table panel, in the current language. */
	private drawEnd(): void {
		if (!this.ended) return;
		const { winner, reward } = this.ended;
		this.endPanel.removeAll(true);
		const box = this.add.graphics();
		const label =
			winner === 'us'
				? this.match.goal === undefined
					? this.tx('table.matchWin')
					: t('table.goalWin')
				: this.runState
					? t('table.goalLose')
					: this.tx('table.matchLose');
		// The screen-title look, shrunk until it fits the content width.
		const color = winner === 'us' ? PALETTE.good : PALETTE.bad;
		let size = 16;
		let title = addTitle(this, 0, 0, label, size, color);
		while (title.width - 2 * titleMetrics(size).pad > END_INNER && size > 9) {
			title.destroy();
			title = addTitle(this, 0, 0, label, --size, color);
		}
		// One padding around everything and one gap between the title, the body and the buttons.
		const frame = (body = 0): { top: number; buttons: number } => {
			const h =
				END_PAD +
				END_TITLE_H +
				END_GAP +
				(body ? body + END_GAP : 0) +
				BUTTON_H.action +
				END_PAD;
			drawPanel(box, -END_W / 2, -h / 2, END_W, h, { shadow: 4 });
			title.setY(-h / 2 + END_PAD + END_TITLE_H / 2);
			return {
				top: -h / 2 + END_PAD + END_TITLE_H + END_GAP,
				buttons: h / 2 - END_PAD - BUTTON_H.action / 2,
			};
		};
		if (this.runState) {
			const cards = this.add.container(0, 0);
			const { top, buttons } = frame(reward ? this.rewardCards(cards, reward) : 0);
			cards.setY(top);
			const next = new Button(
				this,
				t('table.continue'),
				() => fadeTo(this, 'Run', { fresh: false }),
				{
					w: END_INNER,
					h: BUTTON_H.action,
					color: PALETTE.good,
				},
			);
			next.setPosition(0, buttons);
			this.endPanel.add([box, title, cards, next]).setVisible(true);
			return;
		}
		const net = this.net;
		// Two buttons share the content width, END_GAP apart.
		const half = (END_INNER - END_GAP) / 2;
		const again = new Button(
			this,
			t(net ? 'net.backToLobby' : 'table.again'),
			() => {
				if (!net) return this.scene.restart({ mode: this.duel ? '1v1' : '2v2' });
				this.net = null;
				net.client.listen(null);
				fadeTo(this, 'Lan', { client: net.client });
			},
			{
				w: half,
				h: BUTTON_H.action,
				color: PALETTE.good,
			},
		);
		const menu = new Button(this, t('table.menu'), () => fadeTo(this, 'Menu'), {
			w: half,
			h: BUTTON_H.action,
		});
		const by = frame().buttons;
		again.setPosition(-(half + END_GAP) / 2, by);
		menu.setPosition((half + END_GAP) / 2, by);
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
			: this.duel
				? [b.truco, b.fold, b.cover]
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
		onKey(kb, 'keydown', (e) => {
			if (!e.repeat) this.skipCall?.();
		});
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
			if (e.code === 'F1') {
				e.preventDefault();
				this.openPause('Rules');
				return;
			}
			const keys = getSave(this).settings.keys;
			const a = actionFor(keys, e.code);
			if (!a) return;
			if (a === 'pause' && this.signPicker.visible) {
				// Esc closes the signal choice first; the pause menu comes with the next press.
				this.signPicker.setVisible(false);
				return;
			}
			if (a === 'pause') this.openPause();
			else if (a === 'speed') {
				e.preventDefault();
				this.speed = GAME_SPEEDS[
					(GAME_SPEEDS.indexOf(this.speed) + 1) % GAME_SPEEDS.length
				] as GameSpeed;
				this.notices.show('speed', `${this.speed}×`);
			} else if (a === 'card1' || a === 'card2' || a === 'card3')
				this.playCard(Number(a.slice(4)) - 1);
			else if (a === 'truco') this.btn.truco.click();
			else if (a === 'accept') this.btn.accept.click();
			else if (a === 'fold') this.btn.fold.click();
			else if (a === 'signal' && !this.duel) this.btn.signal.click();
			else if (a === 'cover') this.btn.cover.click();
		});
		// Android back button / Esc.
		this.game.events.on('pause', this.onBackground, this);
		this.events.once('shutdown', () => this.game.events.off('pause', this.onBackground, this));
	}

	private onBackground(): void {
		if (this.sys.isActive()) this.openPause();
	}

	private openPause(overlay: 'Pause' | 'Settings' | 'Rules' = 'Pause'): void {
		if (!this.sys.isActive() || this.endPanel.visible) return;
		this.scene.pause();
		this.scene.launch(overlay, {
			returnTo: 'Table',
			...(overlay === 'Rules' && this.duel ? { page: 'duel' } : {}),
		});
	}
}
