import { describe, expect, test } from 'bun:test';
import { MANHAS, type ManhaId } from '../src/data/manhas';
import { Rng } from '../src/logic/rng';
import { type ScoreContext, scoreHand } from '../src/logic/score/score';
import { type Card, parseCard, standardDeck } from '../src/logic/truco/cards';
import { type Action, apply, deal, type Seat, type TableState } from '../src/logic/truco/table';

const c = (text: string): Card => {
	const card = parseCard(text);
	if (!card) throw new Error(text);
	return card;
};

/** Plays a hand with fixed cards (vira 4♣ → manilha 5 unless `vira`; dealer 3 → seat 0 starts). */
function play(
	hands: string[][],
	moves: (string | Action)[],
	o: { vira?: string; bet?: TableState['bet'] } = {},
): TableState {
	let s = deal(standardDeck(), 3, { us: 0, them: 0 }, new Rng(1), { vira: c(o.vira ?? '4c') });
	s.hands = hands.map((h) => h.map(c)) as TableState['hands'];
	if (o.bet) s = { ...s, bet: o.bet };
	const rng = new Rng(1);
	for (const m of moves)
		s = apply(
			s,
			typeof m === 'string' ? { kind: 'play', seat: s.turn as Seat, cardId: c(m).id } : m,
			rng,
		).state;
	return s;
}

const B = (): string[][] => [
	['3h', '2h', 'Ah'],
	['4d', '4s', '6d'],
	['7h', 'Kh', 'Qs'],
	['4h', '6s', '7d'],
];
const withSeat = (seat: number, cards: string[]): string[][] => {
	const h = B();
	h[seat] = cards;
	return h;
};
const LIMPA_M = ['3h', '4d', '7h', '4h', '2h', '4s', 'Kh', '6s'];

/** Named hands, each a finished TableState. */
const S = {
	limpa: (o = {}) => play(B(), LIMPA_M, o),
	virada: () =>
		play(withSeat(1, ['5c', '4s', '6d']), [
			'3h',
			'5c',
			'7h',
			'4h',
			'4s',
			'Kh',
			'6s',
			'2h',
			'Ah',
			'6d',
			'Qs',
			'7d',
		]),
	suada: () =>
		play(
			[
				['3h', '6h', '2h'],
				['4d', 'Ks', '6d'],
				['7h', 'Qh', 'Qs'],
				['4h', '6s', '7d'],
			],
			['3h', '4d', '7h', '4h', '6h', 'Ks', 'Qh', '6s', '6d', 'Qs', '7d', '2h'],
		),
	weak: () =>
		play(
			[
				['Kh', 'Qh', 'Jh'],
				['4d', '4s', '6d'],
				['7h', '6h', '7s'],
				['4h', '6s', '7d'],
			],
			['Kh', '4d', '7h', '4h', 'Qh', '4s', '6h', '6s'],
		),
	suits: () =>
		play(withSeat(0, ['3s', '2c', 'Ad']), ['3s', '4d', '7h', '4h', '2c', '4s', 'Kh', '6s']),
	partner: () =>
		play(
			[
				['6h', '2h', 'Ah'],
				['4d', '4s', '6d'],
				['3s', 'Kh', 'Qs'],
				['4h', '6s', '7d'],
			],
			['6h', '4d', '3s', '4h', 'Kh', '6s', '2h', '4s'],
		),
	manilhas: () =>
		play(withSeat(0, ['5h', '5c', 'Ah']), ['5h', '4d', '7h', '4h', '5c', '4s', 'Kh', '6s']),
	corrida: () =>
		play(B(), [
			{ kind: 'truco', seat: 0 },
			{ kind: 'fold', seat: 1 },
		]),
	weFolded: () =>
		play(B(), [
			{ kind: 'truco', seat: 0 },
			{ kind: 'truco', seat: 1 },
			{ kind: 'fold', seat: 0 },
		]),
	lost: () =>
		play(
			[
				['6d', '7s', 'Qd'],
				['5c', '3s', '2s'],
				['6h', '7c', 'Jd'],
				['4h', '4d', 'Kd'],
			],
			['6d', '5c', '6h', '4h', '3s', '7c', '4d', '7s'],
		),
};

type Ctx = Partial<Omit<ScoreContext, 'state' | 'manhas'>>;
const steps = (s: TableState, id: ManhaId, ctx: Ctx = {}): number =>
	scoreHand({ state: s, queda: false, ...ctx, manhas: [id] }).steps.filter(
		(x) => x.source === `manha:${id}`,
	).length;

/** [Manha, firing hand + context, times it fires, hand + context where it must not fire]. */
const CASES: [ManhaId, () => TableState, Ctx, number, () => TableState, Ctx][] = [
	['rendaExtra', S.limpa, {}, 1, S.limpa, { calls: [0] }],
	['naoDouNada', S.weak, {}, 1, S.limpa, {}],
	['figurao', S.weak, {}, 2, S.limpa, {}],
	['coracaoMole', S.limpa, {}, 2, S.suits, {}],
	['espadachim', S.suits, {}, 1, S.limpa, {}],
	['pauFerro', S.suits, {}, 1, S.limpa, {}],
	['asNaManga', S.virada, {}, 1, S.limpa, {}],
	['doisDeOuro', S.limpa, {}, 1, S.weak, {}],
	['tresSecos', S.limpa, {}, 1, S.weak, {}],
	['saidaBoa', S.limpa, {}, 1, S.virada, {}],
	['vazaDoMeio', S.limpa, {}, 1, S.lost, {}],
	['humildade', S.weFolded, {}, 1, S.limpa, {}],
	['apanhouLevantou', S.lost, {}, 1, S.limpa, {}],
	['copoAmericano', S.corrida, {}, 1, S.limpa, {}],
	['olharSerio', S.limpa, { calls: [0] }, 1, S.limpa, {}],
	['desafio', S.corrida, { calls: [0] }, 1, S.corrida, { calls: [2] }],
	[
		'seisMaldito',
		() =>
			play(
				withSeat(3, ['4h', 'Jc', '7d']),
				['3h', '4d', '7h', '4h', '2h', '4s', 'Kh', 'Jc'],
				{ vira: '5c' },
			),
		{},
		1,
		S.limpa,
		{},
	],
	['caoDeGuarda', S.virada, {}, 1, S.limpa, {}],
	['contragolpe', S.suada, {}, 1, S.limpa, {}],
	['vaiASeis', () => S.limpa({ bet: 6 }), {}, 1, () => S.limpa({ bet: 3 }), {}],
	['parceiroDeAco', S.limpa, { calls: [2] }, 1, S.limpa, { calls: [0] }],
	['confiaEmMim', S.partner, {}, 1, S.limpa, {}],
	['manilhaDeReserva', S.limpa, {}, 1, S.manilhas, {}],
	['mentirosoConvincente', S.limpa, { fame: 0.5 }, 1, S.limpa, { fame: 0 }],
	['palavraDeHonra', S.limpa, { fame: -0.5 }, 1, S.limpa, { fame: 0 }],
	['peitudo', S.limpa, { calls: [1] }, 1, S.limpa, {}],
	['caixaDeFosforo', S.manilhas, {}, 2, S.limpa, {}],
	['ouTudoOuNada', () => S.limpa({ bet: 9 }), {}, 1, () => S.limpa({ bet: 6 }), {}],
	['viraDourada', S.manilhas, {}, 2, S.limpa, {}],
	['blefeProfissional', S.limpa, { calls: [0] }, 1, S.limpa, {}],
	['caraDeTacho', S.lost, { calls: [0] }, 1, S.lost, {}],
	['duplaQuasePerfeita', S.partner, {}, 1, S.limpa, {}],
	['quedaLivre', S.limpa, { queda: true }, 1, S.limpa, {}],
	['trucoDeBoteco', S.limpa, { calls: [0, 2] }, 1, S.limpa, { calls: [0] }],
	['cartaNaManga', S.virada, {}, 1, S.limpa, {}],
	['faxina', S.limpa, {}, 1, S.virada, {}],
	['zapDeOuro', () => play(withSeat(0, ['3h', '2h', '6c']), LIMPA_M), {}, 1, S.limpa, {}],
	['maoDeOuro', S.manilhas, {}, 1, S.limpa, {}],
	['dozeOuNada', () => S.limpa({ bet: 12 }), {}, 1, () => S.limpa({ bet: 9 }), {}],
	['lendaDoBoteco', S.limpa, {}, 2, S.lost, {}],
];

describe('BETA Manhas (B1.1)', () => {
	test('60 Manhas: 24 common, 18 uncommon, 12 rare, 6 legendary', () => {
		const n = (r: string) => MANHAS.filter((m) => m.rarity === r).length;
		expect(MANHAS).toHaveLength(60);
		expect([n('common'), n('uncommon'), n('rare'), n('legendary')]).toEqual([24, 18, 12, 6]);
	});

	for (const [id, yes, yesCtx, times, no, noCtx] of CASES)
		test(`${id}: fires when it should and only then`, () => {
			expect(steps(yes(), id, yesCtx)).toBe(times);
			expect(steps(no(), id, noCtx)).toBe(0);
		});

	test('money Manhas pay in a lost hand, Chips/Mult ones do not', () => {
		const lost = S.lost();
		expect(scoreHand({ state: lost, queda: false, manhas: ['apanhouLevantou'] }).money).toBe(1);
		expect(scoreHand({ state: lost, queda: false, manhas: ['lendaDoBoteco'] }).points).toBe(0);
	});
});
