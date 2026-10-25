/**
 * Boteco upgrades (design §4.5, PLAN A4.3): one offer per Championship, permanent for the run.
 * Names in i18n (`upgrade.<id>.name|desc`); art `upgrade.<id>`.
 */
export const UPGRADES = {
	maisManha: { price: 10 },
	maisConsumivel: { price: 8 },
	desconto: { price: 10 },
	rerollBarato: { price: 8 },
	maisSinal: { price: 8 },
	espiarMonte: { price: 6 },
} as const;
export type UpgradeId = keyof typeof UPGRADES;
export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];

/** Shop prices with the discount upgrade; reroll saving with rerollBarato. */
export const DISCOUNT = 0.75;
export const CHEAP_REROLL = 2;
