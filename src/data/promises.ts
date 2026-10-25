/**
 * Promises (design §3.3, PLAN A4.4): skipping a small or big table gives one, cashed at the next
 * shop. Names in i18n (`promise.<id>.name|desc`); art `promise.<id>`.
 */
export const PROMISES = [
	'manhaRara',
	'dezReais',
	'pacoteGratis',
	'fichaExtra',
	'multExtra',
	'cartaNova',
	'simpatiaGratis',
	'vidaExtra',
] as const;
export type PromiseId = (typeof PROMISES)[number];

/** Money of the "money" Promise. */
export const PROMISE_MONEY = 10;
