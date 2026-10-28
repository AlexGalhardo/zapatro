import { VO_JOKE, VO_JOKES, VO_SACANAGEM_BET, type VoJoke, type VoLine } from '../data/sfx';

/** Voice languages on disk: Portuguese and English. */
export type VoLang = 'pt' | 'en';

/** UI language (`en`, `pt-BR`) → the voice files it uses. */
export function voLang(lang: string): VoLang {
	return lang.startsWith('pt') ? 'pt' : 'en';
}

/** Cache key of a voice line (take 1; take n adds `.<n>`). */
export function voKey(lang: VoLang, char: string, line: VoLine): string {
	return `vo.${lang}.${char}.${line}`;
}

/** Accepting a call: "Bora!" or "Quero ver!", half and half (`roll` in [0, 1)). */
export function acceptLine(roll: number): VoLine {
	return roll < 0.5 ? 'bora' : 'ver';
}

/** Folding a call to `bet` points: a big one hurts more. */
export function foldLine(bet: number): VoLine {
	return bet >= VO_SACANAGEM_BET ? 'sacanagem' : 'corre';
}

/** Whether a joke may start at this hand start (`handsSince` counts hand starts since the last one). */
export function jokeDue(handsSince: number, roll: number): boolean {
	return handsSince >= VO_JOKE.minHands && roll < VO_JOKE.chance;
}

/** A joke for a character, never the one they told last. */
export function nextJoke(last: VoJoke | undefined, roll: number): VoJoke {
	return pickOther(VO_JOKES, last, roll);
}

/** A random item of `items` other than `prev` (any item when there is only one). */
export function pickOther<T>(items: readonly T[], prev: T | undefined, roll: number): T {
	const pool = items.length > 1 ? items.filter((i) => i !== prev) : items;
	return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))] as T;
}
