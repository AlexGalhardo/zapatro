import type { Rarity } from './manhas';

/**
 * The shop's four bonus rarities, in order: Normal (cream), Raro (blue), Especial (purple),
 * Lendário (orange). Manhas carry their own rarity (`common` to `legendary`, in the same order);
 * every other offer takes it from its base price, so there is one rule in one place:
 * up to $3 Normal (Simpatias and Lance cards), up to $5 Raro, up to $8 Especial, above Lendário.
 */
export const RARITY_BY_PRICE: readonly (readonly [number, Rarity])[] = [
	[3, 'common'],
	[5, 'uncommon'],
	[8, 'rare'],
	[Number.POSITIVE_INFINITY, 'legendary'],
];

export const rarityOfPrice = (basePrice: number): Rarity =>
	(RARITY_BY_PRICE.find(([max]) => basePrice <= max) ?? RARITY_BY_PRICE[3])?.[1] ?? 'common';
