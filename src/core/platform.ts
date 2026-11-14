import { MULTIPLAYER_ENABLED } from '../config/features';

/** The Steam build: Electron adds "Electron/<version>" to the user agent. */
export function isElectron(): boolean {
	return navigator.userAgent.includes('Electron/');
}

/** A table served from this computer: its port and the addresses friends type to join. */
export interface LanHost {
	port: number;
	addresses: string[];
}

const shellBridge = (): { hostLan?: () => Promise<LanHost> } | undefined =>
	(window as unknown as { trucoShell?: { hostLan?: () => Promise<LanHost> } }).trucoShell;

/** Only the desktop app can serve a LAN table (desktop/main.js runs the Colyseus server). */
export const canHostLan = (): boolean => Boolean(shellBridge()?.hostLan);

export const hostLan = (): Promise<LanHost> => {
	const host = shellBridge()?.hostLan;
	return host ? host() : Promise.reject(new Error('no LAN host'));
};

/**
 * LAN play needs a plain `ws://` connection to another computer, which a browser blocks from an
 * `https://` page (the website, itch.io, Poki). The desktop and Android apps allow it.
 */
export const lanAvailable = (): boolean =>
	MULTIPLAYER_ENABLED && (isElectron() || capacitor() !== null || location.protocol === 'http:');

/**
 * Starts the game over. In Electron the shell relaunches the whole app (desktop/preload.cjs): once
 * Chromium has turned the GPU off, only a new process gets WebGL back. Elsewhere, a page reload.
 */
export function restartApp(): void {
	const shell = (window as unknown as { trucoShell?: { relaunch(): void } }).trucoShell;
	if (shell) shell.relaunch();
	else location.reload();
}

type CapacitorGlobal = {
	isNativePlatform?: () => boolean;
	Plugins?: Record<string, unknown>;
};

/**
 * Short vibration on phones (MOB4.2): the Haptics plugin in the Android app, the Vibration API
 * in a mobile browser; silently nothing elsewhere.
 */
export function vibrate(ms: number): void {
	const haptics = capacitor()?.Plugins?.Haptics as
		| { vibrate(o: { duration: number }): Promise<unknown> }
		| undefined;
	if (haptics) haptics.vibrate({ duration: ms }).catch(() => undefined);
	else navigator.vibrate?.(ms);
}

/** The Android build: Capacitor injects `window.Capacitor` into the WebView. */
export function capacitor(): CapacitorGlobal | null {
	const cap = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
	return cap?.isNativePlatform?.() ? cap : null;
}

/** Store page (wishlist button of the demo). Placeholder until the Steam app id exists (RC4). */
export const STORE_URL = 'https://store.steampowered.com/search/?term=truco%20roguelite';

/** Opens the store page: a new tab on the web, the system browser in Electron and Capacitor. */
export function openStore(): void {
	// Electron and Capacitor route window.open to the system browser (desktop/main, Capacitor).
	window.open(STORE_URL, '_blank', 'noopener');
}
