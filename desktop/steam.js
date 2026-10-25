// Steamworks bridge (PLAN B5.1): achievements mirror the game's feats (Steam API name = feat id,
// docs/desktop.md). Cloud saves need no code (Auto-Cloud on the userData folder, D-28).
// Off until the App ID exists: `steamAppId` in desktop/package.json, or STEAM_APP_ID=480 (Spacewar)
// to try it with Steam running. Any failure (Steam closed, not owned, no native module) is a no-op:
// the game never depends on Steam.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

/** @typedef {{ achievement: { activate(id: string): boolean; isActivated(id: string): boolean } }} SteamClient */

/** @type {SteamClient | null} */
let client = null;

/** @param {string} dir desktop/ folder (package.json lives there) */
export function initSteam(dir) {
	const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
	const appId = Number(process.env.STEAM_APP_ID ?? pkg.steamAppId ?? 0);
	if (!appId) return;
	try {
		const steamworks = createRequire(import.meta.url)('steamworks.js');
		client = steamworks.init(appId);
		console.log(`steam: on (app ${appId})`);
	} catch (e) {
		client = null;
		console.warn(`steam: off (${e instanceof Error ? e.message : e})`);
	}
}

/** Unlocks the achievements of these feats (already unlocked ones are skipped). @param {unknown} ids */
export function unlockAchievements(ids) {
	if (!client || !Array.isArray(ids)) return;
	for (const id of ids) {
		if (typeof id !== 'string' || !/^\w{1,64}$/.test(id)) continue;
		try {
			if (!client.achievement.isActivated(id)) client.achievement.activate(id);
		} catch {
			// Achievement not configured in Steamworks yet: ignore.
		}
	}
}
