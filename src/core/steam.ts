/**
 * Steam achievements (PLAN B5.1): the Electron shell exposes `window.trucoSteam` (desktop/preload.cjs);
 * on the web and Android it does not exist and these calls do nothing.
 */
type SteamBridge = { unlock(ids: string[]): void };

const bridge = (): SteamBridge | undefined =>
	(window as unknown as { trucoSteam?: SteamBridge }).trucoSteam;

/** Mirrors newly unlocked feats (or, at boot, all of them) as Steam achievements. */
export function steamUnlock(ids: readonly string[]): void {
	if (ids.length) bridge()?.unlock([...ids]);
}
