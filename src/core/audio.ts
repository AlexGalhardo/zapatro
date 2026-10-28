import type Phaser from 'phaser';
import { SFX, SFX_MIN_INTERVAL, type SfxKey, VO_DEF, VO_LINES, type VoLine } from '../data/sfx';
import { pitchRate, VoiceLimiter } from '../logic/voice-limiter';
import { voKey, voLang } from '../logic/voice-lines';
import { getSave } from './context';

const limiter = new VoiceLimiter(SFX_MIN_INTERVAL);

/**
 * Plays a sound effect through its bus (B6.1: master → sfx | ui, from the Settings volumes), with
 * a per-key voice limit (hordes would otherwise stack dozens of hits), a random take and a small
 * random pitch variation.
 */
export function sfx(scene: Phaser.Scene, key: SfxKey, volume = 1): void {
	if (import.meta.env.SOUND_MUTED === 'true') return;
	if (!scene.cache.audio.exists(key)) return;
	const def = SFX[key];
	if (!limiter.tryStart(key, performance.now(), def.ms, def.voices)) return;
	const v = getSave(scene).settings.volume;
	const gain = v.master * (def.bus === 'ui' ? v.ui : v.sfx) * def.volume * volume;
	if (gain <= 0) return;
	scene.sound.play(pickTake(scene, key), {
		volume: gain,
		rate: pitchRate(def.pitch, Math.random()),
	});
}

/** The voice line playing now, if any (jokes never start over another line). */
let speaking: Phaser.Sound.BaseSound | null = null;

export function voiceBusy(): boolean {
	return speaking?.isPlaying === true;
}

/**
 * A character's voice line in the Settings language (`vo.<lang>.<char>.<line>`), one at a time per
 * character; silent if absent (not loaded yet, or a character without a voice).
 */
export function voice(scene: Phaser.Scene, char: string, line: VoLine): boolean {
	if (import.meta.env.SOUND_MUTED === 'true') return false;
	const save = getSave(scene);
	const key = voKey(voLang(save.settings.lang), char, line);
	if (!scene.cache.audio.exists(key)) return false;
	if (!limiter.tryStart(`vo.${char}`, performance.now(), VO_DEF.ms, VO_DEF.voices)) return false;
	const v = save.settings.volume;
	const gain = v.master * v.sfx * VO_DEF.volume;
	if (gain <= 0) return false;
	const n = 1 + Math.floor(Math.random() * VO_LINES[line]);
	const take = n > 1 && scene.cache.audio.exists(`${key}.${n}`) ? `${key}.${n}` : key;
	const sound = scene.sound.add(take, { volume: gain });
	sound.once('complete', () => sound.destroy());
	sound.play();
	speaking = sound;
	return true;
}

/** Random take among the loaded variants of a key (take 1 is the base file). */
function pickTake(scene: Phaser.Scene, key: SfxKey): string {
	const count: number = SFX[key].takes ?? 1;
	if (count <= 1) return key;
	const n = 1 + Math.floor(Math.random() * count);
	const take = n === 1 ? key : `${key}.${n}`;
	return scene.cache.audio.exists(take) ? take : key;
}
