import { CARD_MODS, type CardModDef, isCardModId } from '../../data/card-mods';
import type { LanceId } from '../../data/lances';
import type { ManhaDef, ManhaWhen, PerTrickWon } from '../../data/manhas';
import { type Card, type CardRank, isSpecial, isZap, type Rank } from '../truco/cards';
import { type Played, type Seat, type TableState, teamOf } from '../truco/table';
import type { ScoreStep } from './score';

/** What a finished hand looked like, for Manha conditions (PLAN A3.1). */
export interface HandFacts {
	state: TableState;
	lance: LanceId | null;
	/** Seat 0's three cards (played and unplayed). */
	myHand: Card[];
	/** Seats that called or raised truco this hand. */
	calls: readonly Seat[];
	/** Fame of your team (design §5.3). */
	fame: number;
}

export function handFacts(
	state: TableState,
	lance: LanceId | null,
	calls: readonly Seat[],
	fame = 0,
): HandFacts {
	const played = state.tricks.flatMap((t) =>
		t.plays.filter((p) => p.seat === 0).map((p) => p.card),
	);
	return { state, lance, myHand: [...played, ...state.hands[0]], calls, fame };
}

const holdsManilha = (f: HandFacts): boolean => f.myHand.some((c) => c.rank === f.state.manilha);

function holds(f: HandFacts, w: ManhaWhen): boolean {
	const s = f.state;
	const r = s.tricks.map((t) => t.result);
	switch (w.k) {
		case 'calledNoManilha':
			return f.calls.includes(0) && !holdsManilha(f);
		case 'firstTrickLost':
			return r[0] === 'them';
		case 'lostFirstWonThird':
			return r[0] === 'them' && r[2] === 'us';
		case 'betAtLeast':
			return s.bet >= w.bet;
		case 'rivalFoldedNoManilha':
			return s.over?.reason === 'fold' && s.over.winner === 'us' && !holdsManilha(f);
		case 'holdsZap':
			return f.myHand.some((c) => isZap(c, s.manilha));
		case 'lance':
			return f.lance === w.lance;
		case 'anyTie':
			return r.includes('tie');
		case 'won':
			return s.over?.winner === 'us';
		case 'lost':
			return s.over?.winner === 'them';
		case 'weFolded':
			return s.over?.reason === 'fold' && s.over.winner === 'them';
		case 'rivalFolded':
			return s.over?.reason === 'fold' && s.over.winner === 'us';
		case 'noTrucoCall':
			return f.calls.length === 0;
		case 'iCalled':
			return f.calls.includes(0);
		case 'partnerCalled':
			return f.calls.includes(2);
		case 'rivalCalled':
			return f.calls.some((c) => teamOf(c) === 'them');
		case 'ourCalls':
			return f.calls.filter((c) => teamOf(c) === 'us').length >= w.n;
		case 'trick':
			return r[w.index] === w.result;
		case 'weakHand':
			return f.myHand.every((c) => c.rank !== s.manilha && !STRONG.includes(c.rank));
		case 'noManilha':
			return !holdsManilha(f);
		case 'manilhasHeld':
			return f.myHand.filter((c) => c.rank === s.manilha).length >= w.n;
		case 'manilhaRank':
			return s.manilha === w.rank;
		case 'bothWon': {
			const won = wonTricks(s).map((p) => p.seat);
			return won.includes(0) && won.includes(2);
		}
		case 'fameAtLeast':
			return f.fame >= w.fame;
		case 'fameAtMost':
			return f.fame <= w.fame;
	}
}

/** Winning plays of the tricks your team took, in order. */
function wonTricks(s: TableState): Played[] {
	const out: Played[] = [];
	for (const t of s.tricks) {
		if (t.result !== 'us') continue;
		const win = t.plays.find((p) => p.seat === t.winner);
		if (win) out.push(win);
	}
	return out;
}

const STRONG: readonly CardRank[] = ['3', '2', 'A'];

const matches = (p: Played, per: PerTrickWon, manilha: Rank): boolean =>
	(!per.manilha || p.card.rank === manilha) &&
	(per.by !== 'partner' || p.seat === 2) &&
	(!per.ranks || per.ranks.some((r) => r === p.card.rank)) &&
	(!per.suit || (p.card.suit === per.suit && !isSpecial(p.card)));

/** Steps of one Manha (none when its condition fails). */
export function manhaSteps(def: ManhaDef, f: HandFacts): ScoreStep[] {
	if (def.rule || !def.when.every((w) => holds(f, w))) return [];
	const times = def.per
		? wonTricks(f.state).filter((p) => matches(p, def.per ?? {}, f.state.manilha)).length
		: 1;
	return Array.from({ length: times }, () => ({ source: `manha:${def.id}`, ...def.effect }));
}

/** Steps of a card modifier played by your team in trick `index`, which your team won. */
export function modSteps(p: Played, s: TableState, index: number): ScoreStep[] {
	const mod = p.card.mod;
	if (!mod || !isCardModId(mod) || p.faceDown || teamOf(p.seat) !== 'us') return [];
	const def: CardModDef = CARD_MODS[mod];
	if (def.trucado && s.bet < 3) return [];
	if (def.lastTrick && index !== 2) return [];
	if (!def.chips && !def.addMult && !def.money && !def.xMult) return [];
	return [
		{
			source: `mod:${mod}`,
			card: p.card.id,
			...(def.chips ? { chips: def.chips } : {}),
			...(def.addMult ? { addMult: def.addMult } : {}),
			...(def.money ? { money: def.money } : {}),
			...(def.xMult ? { xMult: def.xMult } : {}),
		},
	];
}
