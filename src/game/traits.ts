import { COMPANIONS, type CompanionId, type Trait } from '../data/companions';
import { partnerOf, type Seat } from '../logic/truco/table';

type SeatTraits = [Trait[], Trait[], Trait[], Trait[]];

/** The traits of whoever sits at each seat; the player and the bosses have none. */
export function seatTraits(chars: Record<Seat, string>): SeatTraits {
	const of = (id: string): Trait[] => {
		const def = COMPANIONS[id as CompanionId];
		return def ? [def.perk, def.flaw] : [];
	};
	return [of(chars[0]), of(chars[1]), of(chars[2]), of(chars[3])];
}

/** Traits of the pair `seat` belongs to (the two seats of a team are 0/2 and 1/3). */
export function pairTraits(traits: SeatTraits, seat: Seat): Trait[] {
	return [...(traits[seat] ?? []), ...(traits[partnerOf(seat)] ?? [])];
}

export function find<K extends Trait['k']>(
	list: readonly Trait[],
	k: K,
): Extract<Trait, { k: K }>[] {
	return list.filter((t): t is Extract<Trait, { k: K }> => t.k === k);
}
