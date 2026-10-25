import { AGIOTA_FINE, type BossId, DELEGADO_CORRIDA_X } from '../../data/bosses';
import { MANILHA_CHIPS, RANK_CHIPS, ZAP_CHIPS } from '../../data/cards';
import {
	CHAMPIONSHIP_GOALS,
	ENDLESS_GOAL_GROWTH,
	RIVAL_QUEDAS_TO_WIN,
	TABLE_GOAL_MULT,
	type TableSize,
} from '../../data/championships';
import { COMPANIONS, type CompanionId } from '../../data/companions';
import { JOKER_CHIPS, JOKER_DOUBLE_X } from '../../data/jokers';
import { LANCES, type LanceId } from '../../data/lances';
import { MANHA_BY_ID, type ManhaId } from '../../data/manhas';
import { type Card, isZap, JOKER, type Rank } from '../truco/cards';
import { jokerEffects, type Seat, type TableState, type Team } from '../truco/table';
import { handFacts, manhaSteps, modSteps } from './manhas';

/**
 * Hand scoring (PLAN §4.3, D-02, design §2.3–2.4). Pure. `steps` is the ordered list the UI
 * animates; totals are always derived from the steps.
 */
export interface ScoreStep {
	/** `card:<id>`, `mod:<id>`, `lance:<id>`, `bet`, `manha:<id>`. */
	source: string;
	chips?: number;
	addMult?: number;
	xMult?: number;
	/** Money for the run; never part of the points. */
	money?: number;
	/** The card a modifier step came from (Vidro may break it). */
	card?: string;
}

export interface HandScore {
	lance: LanceId | null;
	steps: ScoreStep[];
	chips: number;
	mult: number;
	points: number;
	money: number;
}

export type LanceLevels = Partial<Record<LanceId, number>>;

export function cardChips(card: Card, manilha: Rank): number {
	if (card.rank === JOKER) return JOKER_CHIPS;
	if (isZap(card, manilha)) return ZAP_CHIPS;
	return card.rank === manilha ? MANILHA_CHIPS[card.suit] : RANK_CHIPS[card.rank];
}

/** Chips and Mult of a Lance at a level (1 = base). */
export function lanceValue(id: LanceId, level = 1): { chips: number; mult: number } {
	const l = LANCES[id];
	const up = Math.max(0, level - 1);
	return { chips: l.chips + up * l.chipsPerLevel, mult: l.mult + up * l.multPerLevel };
}

/**
 * How `team` won the hand (design §2.4), or null when it did not. Priority: Queda, Ferro, Onze,
 * Corrida, then the trick pattern. A hand won in two tricks without losing one (2-0, or a tie
 * then a win) is Vaza Limpa.
 */
export function classifyLance(s: TableState, team: Team, queda: boolean): LanceId | null {
	const end = s.over;
	if (!end || end.winner !== team) return null;
	if (queda) return 'queda';
	if (s.kind === 'iron') return 'ferro';
	if (s.kind === 'eleven') return 'onze';
	if (end.reason !== 'tricks') return 'corrida';
	const results = s.tricks.map((t) => t.result);
	if (results[0] !== undefined && results[0] !== team && results[0] !== 'tie') return 'virada';
	return results.length >= 3 ? 'suada' : 'limpa';
}

/** Chips, Mult and points from ordered steps: chips add up; Mult applies left to right. */
export function totals(steps: readonly ScoreStep[]): {
	chips: number;
	mult: number;
	points: number;
} {
	let chips = 0;
	let mult = 0;
	for (const st of steps) {
		chips += st.chips ?? 0;
		mult += st.addMult ?? 0;
		if (st.xMult !== undefined) mult *= st.xMult;
	}
	return { chips, mult, points: chips * mult };
}

export interface ScoreContext {
	/** The finished hand. */
	state: TableState;
	/** The player's team reached 12 tentos with this hand (Queda, §5.10). */
	queda: boolean;
	levels?: LanceLevels;
	/** Owned Manhas, left to right. */
	manhas?: readonly ManhaId[];
	/** Seats that called or raised truco this hand (Manha conditions). */
	calls?: readonly Seat[];
	partner?: { id: CompanionId; level: number };
	boss?: BossId;
	/** Fame of your team (Manha conditions). */
	fame?: number;
	/** Starting deck do Interior: these ranks give Chips ×2. */
	doubleChipRanks?: readonly string[];
}

/**
 * Points of the player's team for a finished hand, in order: the cards of every trick it took
 * (each followed by its modifier, when your team played it), the Lance Chips, the bet as base
 * Mult, the Lance Mult, then the Manhas left to right. Face-down cards are worth 0 chips (they
 * never count in the trick either). Losing or folding scores 0: only money steps remain.
 */
export function scoreHand(ctx: ScoreContext): HandScore {
	const s = ctx.state;
	const lance = classifyLance(s, 'us', ctx.queda);
	const steps: ScoreStep[] = [];
	// ×Mult modifiers wait until the bet and the Lance have set the base Mult.
	const late: ScoreStep[] = [];
	s.tricks.forEach((trick, index) => {
		if (trick.result !== 'us') return;
		for (const p of trick.plays) {
			if (p.faceDown) continue;
			const double = ctx.doubleChipRanks?.includes(p.card.rank) && p.card.rank !== s.manilha;
			steps.push({
				source: `card:${p.card.id}`,
				chips: cardChips(p.card, s.manilha) * (double ? 2 : 1),
			});
			for (const m of modSteps(p, s, index)) (m.xMult ? late : steps).push(m);
		}
	});
	if (lance) {
		const lv = lanceValue(lance, ctx.levels?.[lance]);
		steps.push({ source: `lance:${lance}`, chips: lv.chips });
		steps.push({ source: 'bet', addMult: s.bet });
		steps.push({ source: `lance:${lance}`, addMult: lv.mult });
	}
	steps.push(...late);
	const partner = ctx.partner && COMPANIONS[ctx.partner.id];
	if (lance && partner?.callMult && ctx.calls?.includes(2))
		steps.push({
			source: `partner:${ctx.partner?.id}`,
			addMult: partner.callMult[(ctx.partner?.level ?? 1) - 1] ?? partner.callMult[0],
		});
	// Zé Malandro: his calls count as yours for the Manhas; his bluffs pay Chips.
	const ze = ctx.partner?.id === 'zeMalandro';
	const calls = ze ? (ctx.calls ?? []).map((c) => (c === 2 ? 0 : c)) : (ctx.calls ?? []);
	const bluff = partner?.bluffChips?.[(ctx.partner?.level ?? 1) - 1];
	if (
		lance &&
		ze &&
		bluff &&
		ctx.calls?.includes(2) &&
		!s.hands[2].concat(playedBy(s, 2)).some((c) => c.rank === s.manilha)
	)
		steps.push({ source: 'partner:zeMalandro', chips: bluff });
	const facts = handFacts(s, lance, calls, ctx.fame ?? 0);
	for (const id of ctx.manhas ?? []) {
		const def = MANHA_BY_ID.get(id);
		if (def) steps.push(...manhaSteps(def, facts));
	}
	if (ctx.boss === 'delegado' && lance === 'corrida')
		steps.push({ source: 'boss:delegado', xMult: DELEGADO_CORRIDA_X });
	// Joker effects on the hand's count come last: ×2, then zeroed.
	const effects = jokerEffects(s);
	if (effects.includes('double')) steps.push({ source: 'joker:double', xMult: JOKER_DOUBLE_X });
	if (effects.includes('zeroed')) steps.push({ source: 'joker:zeroed', xMult: 0 });
	if (ctx.boss === 'agiota' && s.over?.winner === 'them')
		steps.push({ source: 'boss:agiota', money: -AGIOTA_FINE });
	const kept = lance
		? steps
		: steps.flatMap((st) => (st.money ? [{ source: st.source, money: st.money }] : []));
	const money = kept.reduce((sum, st) => sum + (st.money ?? 0), 0);
	return { lance, steps: kept, ...totals(kept), money };
}

/** Cards a seat played in the hand. */
const playedBy = (s: TableState, seat: Seat): Card[] =>
	s.tricks.flatMap((t) => t.plays.filter((p) => p.seat === seat).map((p) => p.card));

/**
 * Goal of a table: championship base × table size (design §3.2). Endless mode (beyond 8): the
 * last goal grows by ENDLESS_GOAL_GROWTH per Championship.
 */
export function tableGoal(championship: number, size: TableSize): number {
	const n = CHAMPIONSHIP_GOALS.length;
	const c = Math.max(championship, 1);
	const base =
		c <= n
			? (CHAMPIONSHIP_GOALS[c - 1] ?? 0)
			: (CHAMPIONSHIP_GOALS[n - 1] ?? 0) * ENDLESS_GOAL_GROWTH ** (c - n);
	return Math.round(base * TABLE_GOAL_MULT[size]);
}

export type TableOutcome = 'won' | 'lost' | 'queda' | 'rivalQueda' | 'playing';

/**
 * State of the table after a hand was scored (§5.10): reaching the goal wins (checked first);
 * rivals at 12 close a queda and beat you on their RIVAL_QUEDAS_TO_WIN-th; the player's team at
 * 12 before the goal is a Queda. Every queda resets only that team's tentos.
 */
export function tableOutcome(
	points: number,
	goal: number,
	score: Record<Team, number>,
	rivalQuedas = 0,
	needed = RIVAL_QUEDAS_TO_WIN,
): TableOutcome {
	if (points >= goal) return 'won';
	if (score.them >= 12) return rivalQuedas + 1 >= needed ? 'lost' : 'rivalQueda';
	if (score.us >= 12) return 'queda';
	return 'playing';
}

/** Tentos after a queda of `team`: only that team resets. */
export const afterQueda = (
	score: Record<Team, number>,
	team: Team = 'us',
): Record<Team, number> => ({ ...score, [team]: 0 });
