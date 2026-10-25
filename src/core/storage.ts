import type { Lang } from '../i18n';
import {
	defaultSave,
	type ParseFailure,
	parseSave,
	SAVE_KEY,
	type SaveData,
	serializeSave,
} from '../logic/save';
import { capacitor } from './platform';

const BACKUP_KEY = `${SAVE_KEY}.bak`;
const TMP_KEY = `${SAVE_KEY}.tmp`;
const QUARANTINE_PREFIX = `${SAVE_KEY}.corrupt.`;
/** Quarantined copies kept (oldest dropped) so a loop of bad saves cannot fill the quota. */
const QUARANTINE_MAX = 3;

export interface LoadResult {
	save: SaveData;
	/** The main save was unreadable and the backup (or a fresh save) was used. */
	recovered: boolean;
	/** Why the main save was rejected (when recovered). */
	reason?: ParseFailure;
	/** localStorage is blocked: progress will not persist this session. */
	unavailable: boolean;
}

/** Minimal Storage surface, so tests can pass an in-memory fake. */
export type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

const appVersion = (): string => (typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '');

function store(): KV {
	return globalThis.localStorage;
}

function quarantine(kv: KV, text: string): void {
	try {
		kv.setItem(`${QUARANTINE_PREFIX}${Date.now()}`, text);
		const keys: string[] = [];
		for (let i = 0; i < kv.length; i++) {
			const k = kv.key(i);
			if (k?.startsWith(QUARANTINE_PREFIX)) keys.push(k);
		}
		keys.sort();
		while (keys.length > QUARANTINE_MAX) kv.removeItem(keys.shift() as string);
	} catch {
		/* quota: nothing else to do */
	}
}

/**
 * Main save → backup → fresh. An unreadable main save is copied to quarantine; a save from a
 * newer game version is never overwritten (it stays as the main save and the backup is used).
 */
export function loadSave(lang: Lang, kv: KV = store()): LoadResult {
	try {
		const main = kv.getItem(SAVE_KEY);
		const parsed = parseSave(main, lang);
		if (parsed.ok) return { save: parsed.save, recovered: false, unavailable: false };
		if (main && parsed.reason !== 'future') quarantine(kv, main);
		const backup = parseSave(kv.getItem(BACKUP_KEY), lang);
		const reason = main ? parsed.reason : undefined;
		if (backup.ok) return { save: backup.save, recovered: true, reason, unavailable: false };
		return { save: defaultSave(lang), recovered: main !== null, reason, unavailable: false };
	} catch {
		return { save: defaultSave(lang), recovered: false, unavailable: true };
	}
}

/** Safe write: tmp → verify → current main becomes the backup → promote. */
export function writeSave(save: SaveData, kv: KV = store()): boolean {
	try {
		const text = serializeSave(save, appVersion());
		kv.setItem(TMP_KEY, text);
		if (kv.getItem(TMP_KEY) !== text) return false;
		const current = kv.getItem(SAVE_KEY);
		if (current && parseSave(current, save.settings.lang).ok) kv.setItem(BACKUP_KEY, current);
		kv.setItem(SAVE_KEY, text);
		kv.removeItem(TMP_KEY);
		return true;
	} catch {
		return false;
	}
}

type FilesystemPlugin = {
	writeFile(o: { path: string; data: string; directory: 'CACHE'; encoding: 'utf8' }): Promise<{
		uri: string;
	}>;
};
type SharePlugin = { share(o: { title: string; files: string[] }): Promise<unknown> };

/**
 * Downloads the save as a .json file (manual backup). The Android WebView ignores blob downloads,
 * so the Android build writes the file to the app cache and opens the share sheet instead (Drive,
 * e-mail, Files…), through the Filesystem and Share plugins of mobile/.
 */
export function exportSave(save: SaveData): void {
	const name = `truco-roguelite-save-${new Date().toISOString().slice(0, 10)}.json`;
	shareFile(name, serializeSave(save, appVersion()), 'application/json');
}

/**
 * Hands a text file to the player: the share sheet on Android (a WebView cannot download),
 * a browser download elsewhere (Electron included).
 */
export function shareFile(name: string, data: string, type: string): void {
	const plugins = capacitor()?.Plugins;
	if (plugins?.Filesystem && plugins.Share) {
		const fs = plugins.Filesystem as FilesystemPlugin;
		const share = plugins.Share as SharePlugin;
		fs.writeFile({ path: name, data, directory: 'CACHE', encoding: 'utf8' })
			.then(({ uri }) => share.share({ title: name, files: [uri] }))
			.catch((e: unknown) => console.error('file export failed', e));
		return;
	}
	const url = URL.createObjectURL(new Blob([data], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Asks for a .json file and parses it. Resolves with the save, a failure reason, or null when
 * the dialog was closed. The caller decides whether to replace the current save.
 */
export function pickSaveFile(
	lang: Lang,
): Promise<{ ok: true; save: SaveData } | { ok: false; reason: ParseFailure } | null> {
	return new Promise((resolve) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json,.json';
		input.addEventListener('change', () => {
			const file = input.files?.[0];
			if (!file) return resolve(null);
			file.text().then(
				(text) => {
					const r = parseSave(text, lang);
					resolve(r.ok ? { ok: true, save: r.save } : { ok: false, reason: r.reason });
				},
				() => resolve({ ok: false, reason: 'json' }),
			);
		});
		input.addEventListener('cancel', () => resolve(null));
		input.click();
	});
}
