import { describe, expect, test } from 'bun:test';
import { CARD_FLIGHT, CARD_TIERS, TIER_FEEL, TRICK_SWEEP } from '../src/config/feel-cards';
import { REACTION_FEEL, REACTION_OF, REACTIONS } from '../src/config/feel-seats';
import { EXPRESSIONS, TABLE_TIMING } from '../src/data/characters';
import {
	type Card,
	isZap,
	manilhaOf,
	RANKS,
	type Rank,
	SUITS,
	strength,
} from '../src/logic/truco/cards';
import { cardWeight } from '../src/view/fx/card-weight';
import { breathOffset, reactionOffset } from '../src/view/fx/seat-pose';

const card = (rank: Rank, suit: Card['suit']): Card => ({ id: `${rank}${suit}`, rank, suit });
// Vira is a 5, so 6 is the manilha; its higher neighbour holds the ZAP.
const MANILHA: Rank = manilhaOf('5');

describe('card weight', () => {
	test('a face-down card lands quietly whatever it is', () => {
		expect(cardWeight(card('3', 'clubs'), MANILHA, true).tier).toBe('down');
	});

	test('common, strong, manilha and ZAP follow the strength order', () => {
		expect(cardWeight(card('4', 'hearts'), MANILHA).tier).toBe('common');
		expect(cardWeight(card('K', 'hearts'), MANILHA).tier).toBe('common');
		for (const r of ['A', '2', '3'] as const)
			if (r !== MANILHA) expect(cardWeight(card(r, 'spades'), MANILHA).tier).toBe('strong');
		expect(cardWeight(card(MANILHA, 'diamonds'), MANILHA).tier).toBe('manilha');
	});

	test('the ZAP is the card the game ranks above every manilha', () => {
		const zaps = RANKS.flatMap((r) => SUITS.map((s) => card(r, s))).filter((c) =>
			isZap(c, MANILHA),
		);
		expect(zaps.length).toBe(1);
		const zap = zaps[0] as Card;
		expect(cardWeight(zap, MANILHA).tier).toBe('zap');
		for (const s of SUITS)
			expect(strength(zap, MANILHA)).toBeGreaterThan(strength(card(MANILHA, s), MANILHA));
	});

	test('manilhas get heavier by suit, in the game order', () => {
		const suits = SUITS.map((s) => cardWeight(card(MANILHA, s), MANILHA).suit);
		expect(suits).toEqual([...suits].sort((a, b) => a - b));
		expect(suits[0]).toBe(0);
		expect(suits[3]).toBe(1);
	});

	test('heavier tiers land harder and sound deeper', () => {
		const f = CARD_TIERS.map((t) => TIER_FEEL[t]);
		for (let i = 1; i < f.length; i++) {
			expect((f[i] as (typeof f)[0]).squash).toBeGreaterThanOrEqual(
				(f[i - 1] as (typeof f)[0]).squash,
			);
			expect((f[i] as (typeof f)[0]).detune).toBeLessThanOrEqual(
				(f[i - 1] as (typeof f)[0]).detune,
			);
		}
	});
});

describe('nothing delays the player', () => {
	test('the awaited time of a play and of a collection is not above what it was', () => {
		expect(CARD_FLIGHT.travel).toBeLessThanOrEqual(TABLE_TIMING.play);
		expect(TRICK_SWEEP.gather + TRICK_SWEEP.sweep).toBeLessThanOrEqual(TABLE_TIMING.collect);
	});

	test('the ZAP entrance adds at most 250 ms', () => {
		expect(CARD_FLIGHT.zapBeat).toBeLessThanOrEqual(250);
	});
});

describe('seat reactions', () => {
	test('every Expression maps to a reaction with a feel', () => {
		for (const e of EXPRESSIONS) {
			expect(REACTIONS).toContain(REACTION_OF[e]);
			expect(REACTION_FEEL[REACTION_OF[e]].ms).toBeGreaterThan(0);
		}
	});

	test('every reaction starts and ends at rest', () => {
		for (const k of REACTIONS)
			for (const p of [0, 1]) {
				const o = reactionOffset(k, p);
				for (const v of Object.values(o)) expect(Math.abs(v)).toBeLessThan(1e-6);
			}
	});

	test('a reaction actually moves the card', () => {
		for (const k of REACTIONS) {
			const moved = [0.2, 0.35, 0.5, 0.65].some((p) =>
				Object.values(reactionOffset(k, p)).some((v) => Math.abs(v) > 1e-3),
			);
			expect(moved).toBe(true);
		}
	});

	test('the awake seat breathes harder than a sleeping one', () => {
		const peak = (awake: boolean) =>
			Math.max(
				...[0, 300, 600, 900, 1200, 1500].map((t) =>
					Math.abs(breathOffset(t, 0, awake).sy),
				),
			);
		expect(peak(true)).toBeGreaterThan(peak(false));
	});
});
