import { describe, expect, test } from 'bun:test';
import { MANHAS, type ManhaId } from '../src/data/manhas';
import { Rng } from '../src/logic/rng';
import { type ScoreContext, scoreHand } from '../src/logic/score/score';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { type Action, apply, deal, type Seat, type TableState } from '../src/logic/truco/table';

/** `3h` or `3h+heavy` (card with a modifier). */
const c = (text: string): Card => {
	const [id = '', mod] = text.split('+');
	const card = parseCard(id);
	if (!card) throw new Error(text);
	return mod ? { ...card, mod } : card;
};

interface Setup {
	kind?: TableState['kind'];
	bet?: TableState['bet'];
}

/** Plays a hand with fixed cards (vira 4♣ → manilha 5; dealer 3 → seat 0 starts). */
function play(hands: string[][], moves: (string | Action)[], setup: Setup = {}): TableState {
	let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c('4c') });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	if (setup.kind) s = { ...s, kind: setup.kind, elevenDecided: true };
	if (setup.bet) s = { ...s, bet: setup.bet };
	const rng = new Rng(1);
	for (const m of moves) {
		const action: Action =
			typeof m === 'string'
				? { kind: 'play', seat: s.turn as Seat, cardId: parseCard(m)?.id ?? m }
				: m;
		s = apply(s, action, rng).state;
	}
	return s;
}

const base = (): string[][] => [
	['3h', '2h', 'Ah'],
	['4d', '4s', '6d'],
	['7h', 'Kh', 'Qs'],
	['4h', '6s', '7d'],
];
const LIMPA = ['3h', '4d', '7h', '4h', '2h', '4s', 'Kh', '6s'];
const VIRADA = ['3h', '5c', '7h', '4h', '4s', 'Kh', '6s', '2h', 'Ah', '6d', 'Qs', '7d'];
const viradaHands = (): string[][] => {
	const h = base();
	h[1] = ['5c', '4s', '6d'];
	return h;
};

type Ctx = Omit<ScoreContext, 'state' | 'queda'> & { queda?: boolean };
const score = (s: TableState, manhas: ManhaId[], ctx: Ctx = {}) =>
	scoreHand({ state: s, queda: false, ...ctx, manhas });
const fired = (s: TableState, id: ManhaId, ctx: Ctx = {}) =>
	score(s, [id], ctx).steps.filter((st) => st.source === `manha:${id}`);

describe('Manhas (A3)', () => {
	test('every Manha has a unique id and a price', () => {
		expect(new Set(MANHAS.map((m) => m.id)).size).toBe(MANHAS.length);
		for (const m of MANHAS) expect(m.price).toBeGreaterThan(0);
	});

	test('Malandro: +4 Mult when you called truco without a manilha', () => {
		const s = play(base(), LIMPA);
		expect(fired(s, 'malandro', { calls: [0] })).toEqual([
			{ source: 'manha:malandro', addMult: 4 },
		]);
		expect(fired(s, 'malandro', { calls: [2] })).toHaveLength(0);
		const withManilha = base();
		withManilha[0] = ['3h', '2h', '5h'];
		expect(fired(play(withManilha, LIMPA), 'malandro', { calls: [0] })).toHaveLength(0);
	});

	test('Mão de Lixo: losing the first trick pays $2, even in a lost hand', () => {
		expect(score(play(viradaHands(), VIRADA), ['maoDeLixo']).money).toBe(2);
		expect(score(play(base(), LIMPA), ['maoDeLixo']).money).toBe(0);
		const lost = play(
			[
				['6d', '7s', 'Qd'],
				['5c', '3s', '2s'],
				['6h', '7c', 'Jd'],
				['4h', '4d', 'Kd'],
			],
			['6d', '5c', '6h', '4h', '3s', '7c', '4d', '7s'],
		);
		expect(lost.over?.winner).toBe('them');
		expect(score(lost, ['maoDeLixo'])).toMatchObject({ points: 0, money: 2 });
	});

	test('Seu Zé: +15 Chips per trick won with a 4, 5, 6 or 7', () => {
		const h = base();
		h[0] = ['7h', '2h', 'Ah'];
		h[2] = ['6h', 'Kh', 'Qs'];
		const s = play(h, ['7h', '4d', '6h', '4h', '2h', '4s', 'Kh', '6s']);
		expect(fired(s, 'seuZe')).toEqual([{ source: 'manha:seuZe', chips: 15 }]);
		expect(fired(play(base(), LIMPA), 'seuZe')).toHaveLength(0);
	});

	test('Mão Leve: +$1 per trick won with a ♦ card', () => {
		const h = base();
		h[0] = ['3d', '2h', 'Ah'];
		expect(
			score(play(h, ['3d', '4d', '7h', '4h', '2h', '4s', 'Kh', '6s']), ['maoLeve']).money,
		).toBe(1);
		expect(score(play(base(), LIMPA), ['maoLeve']).money).toBe(0);
	});

	test('Última Cartada: ×2 Mult when you lost the 1st trick and won the 3rd', () => {
		expect(fired(play(viradaHands(), VIRADA), 'ultimaCartada')).toHaveLength(1);
		expect(fired(play(base(), LIMPA), 'ultimaCartada')).toHaveLength(0);
	});

	test('Sangue Frio: +8 Mult when the bet is 6 or more', () => {
		expect(fired(play(base(), LIMPA, { bet: 6 }), 'sangueFrio')).toHaveLength(1);
		expect(fired(play(base(), LIMPA, { bet: 3 }), 'sangueFrio')).toHaveLength(0);
	});

	test('Dupla Dinâmica: +3 Mult per trick won by the partner', () => {
		const h = base();
		h[0] = ['6h', '2h', 'Ah'];
		h[2] = ['3s', 'Kh', 'Qs'];
		const s = play(h, ['6h', '4d', '3s', '4h', 'Kh', '6s', '2h', '4s']);
		expect(fired(s, 'duplaDinamica')).toHaveLength(1);
		expect(fired(play(base(), LIMPA), 'duplaDinamica')).toHaveLength(0);
	});

	test('Teatro: ×3 Mult when a rival runs and you held no manilha', () => {
		const run: Action[] = [
			{ kind: 'truco', seat: 0 },
			{ kind: 'fold', seat: 1 },
		];
		expect(fired(play(base(), run), 'teatro')).toHaveLength(1);
		const h = base();
		h[0] = ['3h', '2h', '5h'];
		expect(fired(play(h, run), 'teatro')).toHaveLength(0);
	});

	test('Zap Zap: ×1.5 Mult per trick won while you hold the zap', () => {
		const h = base();
		// Vira 4: the ZAP is the 6♣ (PLAN §5.2).
		h[0] = ['3h', '2h', '6c'];
		expect(fired(play(h, LIMPA), 'zapZap')).toHaveLength(2);
		expect(fired(play(base(), LIMPA), 'zapZap')).toHaveLength(0);
	});

	test('Ferro Quente and Onze Letras: iron hand ×4, mão de 11 ×2', () => {
		expect(fired(play(base(), LIMPA, { kind: 'iron' }), 'ferroQuente')).toHaveLength(1);
		expect(fired(play(base(), LIMPA), 'ferroQuente')).toHaveLength(0);
		expect(fired(play(base(), LIMPA, { kind: 'eleven' }), 'onzeLetras')).toHaveLength(1);
		expect(fired(play(base(), LIMPA), 'onzeLetras')).toHaveLength(0);
	});

	test('Cangaceiro: +8 Mult when a trick tied', () => {
		const h = base();
		h[1] = ['3d', '4s', '6d'];
		const s = play(h, ['3h', '3d', '7h', '4h', '2h', '4s', 'Kh', '6s']);
		expect(s.tricks[0]?.result).toBe('tie');
		expect(fired(s, 'cangaceiro')).toHaveLength(1);
		expect(fired(play(base(), LIMPA), 'cangaceiro')).toHaveLength(0);
	});

	test('Pé-Quente on Vaza Limpa, Reviravolta on Virada', () => {
		expect(fired(play(base(), LIMPA), 'peQuente')).toHaveLength(1);
		expect(fired(play(viradaHands(), VIRADA), 'peQuente')).toHaveLength(0);
		expect(fired(play(viradaHands(), VIRADA), 'reviravolta')).toHaveLength(1);
		expect(fired(play(base(), LIMPA), 'reviravolta')).toHaveLength(0);
	});

	test('Manhas fire left to right: order changes the points', () => {
		const s = play(viradaHands(), VIRADA);
		const a = score(s, ['malandro', 'ultimaCartada'], { calls: [0] }).points;
		const b = score(s, ['ultimaCartada', 'malandro'], { calls: [0] }).points;
		// Virada: 60 Chips; Mult (1 + 2 + 4) × 2 = 14 vs (1 + 2) × 2 + 4 = 10.
		expect(a).toBe(60 * 14);
		expect(b).toBe(60 * 10);
	});
});

describe('card modifiers (A3.4)', () => {
	test('Pesada adds 20 Chips only when your team plays it', () => {
		const h = base();
		h[0] = ['3h+heavy', '2h', 'Ah'];
		expect(score(play(h, LIMPA), []).chips).toBe(46 + 20);
		const rival = base();
		rival[1] = ['4d+heavy', '4s', '6d'];
		expect(score(play(rival, LIMPA), []).chips).toBe(46);
	});

	test('Quente adds 4 Mult only in a trucado hand; Dourada pays $1', () => {
		const h = base();
		h[0] = ['3h+hot', '2h+gold', 'Ah'];
		expect(score(play(h, LIMPA), []).mult).toBe(2);
		expect(score(play(h, LIMPA, { bet: 3 }), []).mult).toBe(3 + 1 + 4);
		expect(score(play(h, LIMPA), []).money).toBe(1);
	});
});
