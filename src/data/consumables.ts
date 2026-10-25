import type { CardModId } from './card-mods';
import type { LanceId } from './lances';

/**
 * Consumables (design §4.4, PLAN A3.5): Simpatias change the run deck, Lance cards level up a
 * Lance. Two slots. Names in i18n (`simpatia.<id>.name|desc`, `lance.<id>` + `consumable.lanceUp`);
 * art `simpatia.<id>` / `lance.<id>`.
 */
export type SimpatiaOp =
	| { op: 'mod'; mod: CardModId }
	| { op: 'remove' }
	| { op: 'duplicate' }
	| { op: 'suit' };

export const SIMPATIAS = {
	rezaDeVo: { op: 'mod', mod: 'gold' },
	benzedeira: { op: 'remove' },
	espelho: { op: 'duplicate' },
	figa: { op: 'suit' },
	aguaBenta: { op: 'mod', mod: 'heavy' },
	velaAcesa: { op: 'mod', mod: 'hot' },
	olhoGrego: { op: 'mod', mod: 'mentirosa' },
	ferradura: { op: 'mod', mod: 'vidro' },
} as const satisfies Record<string, SimpatiaOp>;
export type SimpatiaId = keyof typeof SIMPATIAS;
export const SIMPATIA_IDS = Object.keys(SIMPATIAS) as SimpatiaId[];

/** A consumable in a slot: a Simpatia, or a Lance card that levels that Lance up. */
export type Consumable = { kind: 'simpatia'; id: SimpatiaId } | { kind: 'lance'; id: LanceId };
