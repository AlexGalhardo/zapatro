import { AI_PROFILES, type AiProfile } from '../data/ai-profiles';
import { type BossId, SORTUDA_CHANCE } from '../data/bosses';
import { CARD_MODS } from '../data/card-mods';
import { RIVAL_QUEDAS_TO_WIN } from '../data/championships';
import { COMPANIONS, type CompanionId, type Trait } from '../data/companions';
import {
	CARA_DE_PAU_SCALE,
	MANHA_BY_ID,
	type ManhaId,
	type ManhaRule,
	RIG_VIRA_CHANCE,
} from '../data/manhas';
import { decide, honestSign, randomAction } from '../logic/ai/decide';
import { fameAfterShowdown, isStrongCall } from '../logic/ai/fame';
import type { HandInfo } from '../logic/meta';
import { Rng } from '../logic/rng';
import type { TableProgress } from '../logic/run/run';
import { handFacts } from '../logic/score/manhas';
import {
	afterQueda,
	type HandScore,
	type LanceLevels,
	scoreHand,
	type TableOutcome,
	tableOutcome,
} from '../logic/score/score';
import { type Card, jokerCard, standardDeck } from '../logic/truco/cards';
import { observe } from '../logic/truco/observe';
import {
	type Action,
	apply,
	type DealOptions,
	deal,
	elevenDecider,
	legalActions,
	matchWinner,
	nextDealer,
	type Seat,
	SIGNS,
	type TableEvent,
	type TableRules,
	type TableState,
	type Team,
	teamOf,
} from '../logic/truco/table';

import { find, pairTraits } from './traits';

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/** Who plays a seat: a person (the scene asks) or an AI profile. */
export type SeatBrain = { kind: 'human' } | { kind: 'ai'; profile: AiProfile } | { kind: 'random' };

export interface MatchOptions {
	rng: Rng;
	brains: [SeatBrain, SeatBrain, SeatBrain, SeatBrain];
	deck?: Card[];
	dealer?: Seat;
	score?: Record<Team, number>;
	fame?: number;
	/** Base chance of the human seat to catch rival signals (Manhas raise it). */
	humanCatch?: number;
	/** Forced first deal (debug params, tests). */
	firstDeal?: Pick<DealOptions, 'vira' | 'hand0'>;
	/**
	 * Points goal of a roguelite table (§5.10): hands are scored and the table ends on the goal
	 * (win), rivals at 12 (loss) or goes on after a Queda. Without it: plain Truco to 12.
	 */
	goal?: number;
	levels?: LanceLevels;
	/** Owned Manhas, left to right (roguelite mode). */
	manhas?: ManhaId[];
	partner?: { id: CompanionId; level: number };
	/** false: the player answers every truco against the team (the partner never runs). */
	partnerFolds?: boolean;
	boss?: BossId;
	/** Extra signals per hand for the player (Boteco upgrade). */
	extraSignals?: number;
	/** Promise "vida extra": the rivals need one more queda this table. */
	extraRivalQuedas?: number;
	/** Starting deck do Interior: Chips ×2 for these ranks. */
	doubleChipRanks?: readonly string[];
	/** Upgrade "espiar o monte": one card out of play is shown every hand. */
	peekPile?: boolean;
	/** Traits of whoever sits at each seat (perk and flaw of the companions). */
	traits?: [Trait[], Trait[], Trait[], Trait[]];
	/** Continue a saved table (the rng in it replaces `rng`). */
	resume?: TableProgress;
}

/**
 * A match of Truco (PLAN PA2/PA3) or a roguelite table (A2–A4): deals hands, applies actions,
 * asks AI seats, keeps Fame, scores hands and applies Manha, partner and boss rules.
 * Pure: no Phaser, the scene and the simulations drive it.
 */
export class Match {
	readonly rng: Rng;
	readonly brains: MatchOptions['brains'];
	readonly deck: Card[];
	readonly rules: TableRules;
	dealer: Seat;
	state!: TableState;
	/** Fame of the player's team (design §5.3). */
	fame: number;
	hands = 0;
	readonly goal: number | undefined;
	readonly levels: LanceLevels;
	/** Owned Manhas; `active` drops the one the Juiz disables. */
	readonly manhas: ManhaId[];
	readonly partner: MatchOptions['partner'];
	readonly boss: BossId | undefined;
	/** Money earned at this table (Manhas, modifiers, bosses); may be negative. */
	money = 0;
	/** Points scored at this table (roguelite mode). */
	points = 0;
	/** Score of the last finished hand (roguelite mode). */
	lastScore: HandScore | null = null;
	outcome: TableOutcome = 'playing';
	quedas = 0;
	/** Quedas the rivals closed at this table (they win the table on RIVAL_QUEDAS_TO_WIN). */
	rivalQuedas = 0;
	/** Vidro cards that broke at this table (they leave the run deck). */
	broken: string[] = [];
	/** Espiar o monte: a card out of play this hand. */
	pileCard: Card | null = null;
	readonly rivalQuedasNeeded: number;
	private readonly doubleChipRanks: readonly string[] | undefined;
	private readonly peekPile: boolean;
	private readonly traits: [Trait[], Trait[], Trait[], Trait[]];
	/** Cards each seat was dealt this hand (the state loses them as they are played). */
	private dealt: Card[][] = [];
	/** Bisbilhoteiro: a rival card shown to the player this hand. */
	peek: { seat: Seat; cardId: string } | null = null;
	/** State at the start of the current hand (what the save stores). */
	progress!: TableProgress;
	/** Seats that called or raised truco in the current hand. */
	private calls: Seat[] = [];
	/** Strength of the player's team's last truco call in this hand (for Fame). */
	private usCallStrong: boolean | null = null;
	private gritadorUsed = false;
	/** Cara de Pau: armed after your team runs, spent on your next call. */
	private caraDePau = false;

	constructor(opts: MatchOptions) {
		const r = opts.resume;
		this.rng = r ? new Rng(r.rng) : opts.rng;
		this.brains = opts.brains;
		this.deck = opts.deck ?? [...standardDeck(), jokerCard()];
		this.fame = r?.fame ?? opts.fame ?? 0;
		this.goal = opts.goal;
		this.levels = opts.levels ?? {};
		this.manhas = opts.manhas ?? [];
		this.partner = opts.partner;
		this.boss = opts.boss;
		this.rivalQuedasNeeded = RIVAL_QUEDAS_TO_WIN + (opts.extraRivalQuedas ?? 0);
		this.peekPile = opts.peekPile ?? false;
		this.traits = opts.traits ?? [[], [], [], []];
		this.doubleChipRanks = opts.doubleChipRanks;
		const catchBonus = this.partner
			? (COMPANIONS[this.partner.id].catchBonus?.[this.partner.level - 1] ?? 0)
			: 0;
		const catchOf = (b: SeatBrain): number =>
			b.kind === 'ai'
				? b.profile.catchChance
				: (opts.humanCatch ?? AI_PROFILES.pro.catchChance * 0.66);
		this.rules = {
			// O Mudo: no signals with your partner.
			signals: (this.boss === 'mudo'
				? [0, 1, 0, 1]
				: [1 + (opts.extraSignals ?? 0), 1, 1, 1]
			).map((n, i) =>
				n > 0
					? Math.max(
							0,
							n + sum(find(this.pair(i as Seat), 'signals').map((t) => t.delta)),
						)
					: 0,
			) as TableRules['signals'],
			// Dona Cida's bonus goes to seat 0 whoever plays it (the player or the balance bot).
			catchChance: opts.brains.map((b, i) => {
				const own = sum(find(this.pair(i as Seat), 'catch').map((t) => t.delta));
				const caught = find(this.pair(((i + 1) % 4) as Seat), 'caughtMult').reduce(
					(x, t) => x * t.x,
					1,
				);
				const base = catchOf(b) + (i === 0 ? catchBonus : 0) + own;
				return Math.min(1, Math.max(0, catchChanceFor(this.boss, i, base) * caught));
			}) as TableRules['catchChance'],
			...(this.has('startBet3') || this.boss === 'reiDoTruco'
				? { startBet: 3 as const }
				: {}),
			...(opts.partnerFolds === false ? { humanAnswers: true } : {}),
		};
		this.dealer = r?.dealer ?? opts.dealer ?? 3;
		this.points = r?.points ?? 0;
		this.money = r?.money ?? 0;
		this.quedas = r?.quedas ?? 0;
		this.rivalQuedas = r?.rivalQuedas ?? 0;
		this.gritadorUsed = r?.gritadorUsed ?? false;
		this.hands = (r?.hands ?? 1) - 1;
		const start = r?.score ?? opts.score ?? { us: 0, them: 0 };
		const head = (seat: Seat): number =>
			sum(find(this.pair(seat), 'headStart').map((t) => t.n));
		this.dealHand(
			r ? start : { us: start.us + head(0), them: start.them + head(1) },
			r ? undefined : opts.firstDeal,
		);
	}

	/** Traits of the pair `seat` sits in. */
	private pair(seat: Seat): Trait[] {
		return pairTraits(this.traits, seat);
	}

	/** Manhas that work this table (the Juiz disables the leftmost). */
	get active(): ManhaId[] {
		return this.boss === 'juiz' ? this.manhas.slice(1) : this.manhas;
	}

	/** Cara de Pau is armed: the rivals read your next call as weaker. */
	get caraDePauArmed(): boolean {
		return this.caraDePau;
	}

	/** Your Fame as `seat` reads it (rivals only); O Professor counts it double. */
	fameSeenBy(seat: Seat): number {
		if (teamOf(seat) === 'us') return 0;
		return this.fame * (this.boss === 'professor' ? 2 : 1);
	}

	/** What the finished hand means for the meta-progression (feats, stats). */
	handInfo(): HandInfo {
		const s = this.state;
		const facts = handFacts(s, this.lastScore?.lance ?? null, this.calls, this.fame);
		const noManilha = facts.myHand.every((c) => c.rank !== s.manilha);
		const won = s.over?.winner === 'us';
		return {
			won,
			points: this.lastScore?.points ?? 0,
			bet: s.bet,
			lance: this.lastScore?.lance ?? null,
			weak: noManilha && facts.myHand.every((c) => !['3', '2', 'A'].includes(c.rank)),
			called: this.calls.some((c) => teamOf(c) === 'us'),
			bluff: won && this.calls.includes(0) && noManilha,
		};
	}

	/** Whether an active Manha has this table rule. */
	has(rule: ManhaRule): boolean {
		return this.active.some((id) => MANHA_BY_ID.get(id)?.rule === rule);
	}

	get score(): Record<Team, number> {
		return this.state.score;
	}

	get winner(): Team | null {
		if (this.goal === undefined) return matchWinner(this.state.score);
		return this.outcome === 'won' ? 'us' : this.outcome === 'lost' ? 'them' : null;
	}

	/** The seat that must act now, or null when the hand is over. */
	actor(): Seat | null {
		const s = this.state;
		if (s.over) return null;
		const decider = elevenDecider(s);
		if (decider !== null) return decider;
		return s.pending ? s.pending.responder : s.turn;
	}

	legal(seat: Seat): ReturnType<typeof legalActions> {
		return legalActions(this.state, seat);
	}

	act(action: Action): TableEvent[] {
		const before = this.state;
		const { state, events } = apply(before, action, this.rng);
		for (const e of events) {
			if (e.type === 'truco') this.calls.push(e.seat);
			if (e.type === 'truco' && teamOf(e.seat) === 'us')
				this.usCallStrong = isStrongCall(before.hands[e.seat], before.manilha);
			if (e.type === 'handOver' && e.end.reason === 'tricks' && this.usCallStrong !== null)
				this.fame = fameAfterShowdown(this.fame, this.usCallStrong);
			if (e.type === 'folded' && teamOf(e.seat) === 'us' && this.has('caraDePau'))
				this.caraDePau = true;
			if ((e.type === 'accepted' || e.type === 'folded') && teamOf(e.seat) === 'them')
				this.caraDePau = false;
		}
		if (before.rules.bonusStep && !state.rules.bonusStep) this.gritadorUsed = true;
		this.state = this.withHandBonus(before, state);
		if (this.goal !== undefined && state.over && !before.over) {
			this.lastScore = scoreHand({
				state,
				queda: state.score.us >= 12,
				levels: this.levels,
				manhas: this.active,
				calls: this.calls,
				partner: this.partner,
				boss: this.boss,
				fame: this.fame,
				doubleChipRanks: this.doubleChipRanks,
			});
			this.points += this.lastScore.points;
			this.money += this.lastScore.money;
			for (const st of this.lastScore.steps)
				if (
					st.source === 'mod:vidro' &&
					st.card &&
					this.rng.chance(CARD_MODS.vidro.breakChance)
				)
					this.broken.push(st.card);
			this.outcome = tableOutcome(
				this.points,
				this.goal,
				state.score,
				this.rivalQuedas,
				this.rivalQuedasNeeded,
			);
		}
		return events;
	}

	/** Tentos from the winners' traits (a call he made, a win with no manilha), up to 12. */
	private withHandBonus(before: TableState, state: TableState): TableState {
		const winner = state.over?.winner;
		if (!winner || before.over) return state;
		const seats = ([0, 1, 2, 3] as const).filter((s) => teamOf(s) === winner);
		const noManilha = seats.every((s) =>
			(this.dealt[s] ?? []).every((c) => c.rank !== state.manilha),
		);
		let bonus = 0;
		for (const s of seats) {
			if (this.calls.includes(s))
				bonus += sum(find(this.traits[s], 'callTentos').map((t) => t.n));
			if (noManilha) bonus += sum(find(this.traits[s], 'weakWinTento').map((t) => t.n));
		}
		if (!bonus) return state;
		return {
			...state,
			score: { ...state.score, [winner]: Math.min(12, state.score[winner] + bonus) },
		};
	}

	/** The AI (or random bot) choice for `seat`. */
	aiAction(seat: Seat): Action {
		const legal = this.legal(seat);
		const brain = this.brains[seat];
		if (brain.kind === 'random') return randomAction(legal, this.rng);
		const s = this.state;
		const them = teamOf(seat) === 'them';
		// O Valentão: the rivals call truco in every hand.
		const call = legal.find((a) => a.kind === 'truco');
		if (
			this.boss === 'valentao' &&
			them &&
			call &&
			!s.pending &&
			!this.calls.some((c) => teamOf(c) === 'them')
		)
			return call;
		const own = this.traits[seat];
		const base = brain.kind === 'ai' ? brain.profile : AI_PROFILES.pro;
		const profile: AiProfile = {
			...base,
			error: base.error * find(own, 'error').reduce((x, t) => x * t.x, 1),
			...(find(own, 'honestSignals').length ? { signalRate: 1 } : {}),
		};
		const answeringUs = them && s.pending !== null && teamOf(s.pending.by) === 'us';
		return this.withTraits(
			seat,
			legal,
			decide(
				observe(s, seat),
				legal,
				{
					profile,
					deck: this.deck,
					rivalFame: this.fameSeenBy(seat),
					...(answeringUs && this.caraDePau ? { callScale: CARA_DE_PAU_SCALE } : {}),
				},
				this.rng,
			),
		);
	}

	/** The flaws that override the AI: never runs, runs from raises, lies in signals. */
	private withTraits(seat: Seat, legal: ReturnType<typeof legalActions>, a: Action): Action {
		const own = this.traits[seat];
		const s = this.state;
		if (a.kind === 'fold' && find(own, 'neverFolds').length) {
			const accept = legal.find((x) => x.kind === 'accept');
			if (accept) return accept;
		}
		if (s.pending && s.pending.to >= 6 && find(own, 'foldsRaises').length) {
			const fold = legal.find((x) => x.kind === 'fold');
			if (fold) return fold;
		}
		if (a.kind === 'signal') {
			const lie = find(own, 'falseSignals')[0];
			if (lie && this.rng.chance(lie.rate)) {
				const real = honestSign(s.hands[seat], s.manilha);
				const other = SIGNS.filter((x) => x !== real);
				return { ...a, sign: this.rng.pick(other), honest: false };
			}
		}
		return a;
	}

	/** Deals the next hand (the dealer rotates). */
	nextHand(): void {
		this.dealer = nextDealer(this.dealer);
		let score = this.state.score;
		if (this.outcome === 'queda') {
			score = afterQueda(score, 'us');
			this.quedas++;
		}
		if (this.outcome === 'rivalQueda') {
			score = afterQueda(score, 'them');
			this.rivalQuedas++;
		}
		if (this.outcome !== 'won' && this.outcome !== 'lost') this.outcome = 'playing';
		this.dealHand(score);
	}

	private dealHand(score: Record<Team, number>, forced?: MatchOptions['firstDeal']): void {
		this.usCallStrong = null;
		this.calls = [];
		this.hands++;
		this.progress = {
			rng: this.rng.position,
			dealer: this.dealer,
			score: { ...score },
			points: this.points,
			money: this.money,
			hands: this.hands,
			quedas: this.quedas,
			rivalQuedas: this.rivalQuedas,
			fame: this.fame,
			gritadorUsed: this.gritadorUsed,
		};
		const rules: TableRules =
			this.has('bonusStep') && !this.gritadorUsed
				? { ...this.rules, bonusStep: 'us' }
				: this.rules;
		const dealt = deal(this.deck, this.dealer, score, this.rng, {
			rules,
			...(this.has('rigVira') ? { rigVira: RIG_VIRA_CHANCE } : {}),
			...(this.boss === 'sortuda' ? { rigViraRivals: SORTUDA_CHANCE } : {}),
			...forced,
		});
		this.state = dealt;
		this.dealt = dealt.hands.map((h) => [...h]);
		this.peek = null;
		if (this.peekPile) {
			const inPlay = new Set([...this.state.hands.flat(), this.state.vira].map((c) => c.id));
			const out = this.deck.filter((c) => !inPlay.has(c.id));
			this.pileCard = out.length ? this.rng.pick(out) : null;
		}
		if (this.has('peek')) {
			const seat = this.rng.pick([1, 3] as const);
			this.peek = { seat, cardId: this.rng.pick(this.state.hands[seat]).id };
		}
	}
}

/**
 * Signal catching under the boss rules. Os Irmãos: rival signals are never caught by your team
 * and yours are caught twice as often.
 */
function catchChanceFor(boss: BossId | undefined, seat: number, base: number): number {
	if (boss !== 'irmaos') return base;
	return seat === 0 || seat === 2 ? 0 : Math.min(1, base * 2);
}

/** Manilhas already shown face up in this hand (Contador de Cartas). */
export function manilhasSeen(s: TableState): number {
	return s.tricks.reduce(
		(n, t) => n + t.plays.filter((p) => !p.faceDown && p.card.rank === s.manilha).length,
		0,
	);
}

export type { TableProgress };

/** Plays a whole match with no human seat (simulations, tests). Returns the winner. */
export function simulateMatch(
	opts: MatchOptions,
	maxHands = 200,
): { winner: Team | null; match: Match } {
	if (opts.brains.some((b) => b.kind === 'human')) throw new Error('simulateMatch: human seat');
	const m = new Match(opts);
	for (;;) {
		for (let seat = m.actor(); seat !== null; seat = m.actor()) m.act(m.aiAction(seat));
		if (m.winner || m.hands >= maxHands) return { winner: m.winner, match: m };
		m.nextHand();
	}
}
