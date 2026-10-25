import type { I18nKey } from '../i18n';
import type { TouchMode } from '../logic/save';
import { touchActive, touchPx } from '../logic/touch';

/** Phones and tablets: touch screen with a coarse pointer (or a mobile user agent). */
export function isTouchDevice(): boolean {
	if (typeof window === 'undefined') return false;
	const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
	return (
		(navigator.maxTouchPoints > 0 && coarse) ||
		/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
	);
}

/**
 * Touch UI mode (MOB1.1): the one switch for bigger text and rows, touch hints, HUD buttons and
 * tap-to-inspect. Set on boot and when Settings → Controls changes; scenes read it on create.
 */
export const touchUi = { on: false };

export function applyTouch(mode: TouchMode): void {
	touchUi.on = touchActive(mode, isTouchDevice());
}

/** UI font size for the current mode (small text grows on touch screens). */
export const uiPx = (size: number): number => touchPx(size, touchUi.on);

/**
 * Hint text for the current mode (MOB1.4): keys with a `.touch` twin (EN and PT-BR, checked by
 * tests/i18n.test.ts) swap keyboard instructions for touch ones.
 */
export const byMode = (key: I18nKey): I18nKey => (touchUi.on ? (`${key}.touch` as I18nKey) : key);
