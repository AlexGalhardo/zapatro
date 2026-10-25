import type Phaser from 'phaser';
import { SFX, SFX_MIN_INTERVAL, type SfxKey, VO_DEF, VO_LINES, type VoLine } from '../data/sfx';
import { pitchRate, VoiceLimiter } from '../logic/voice-limiter';
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

/** A character's voice line (`vo.<char>.<line>`), one at a time per character; silent if absent. */
export function voice(scene: Phaser.Scene, char: string, line: VoLine): void {
	if (import.meta.env.SOUND_MUTED === 'true') return;
	const key = `vo.${char}.${line}`;
	if (!scene.cache.audio.exists(key)) return;
	if (!limiter.tryStart(`vo.${char}`, performance.now(), VO_DEF.ms, VO_DEF.voices)) return;
	const v = getSave(scene).settings.volume;
	const gain = v.master * v.sfx * VO_DEF.volume;
	if (gain <= 0) return;
	const n = 1 + Math.floor(Math.random() * VO_LINES[line]);
	const take = n > 1 && scene.cache.audio.exists(`${key}.${n}`) ? `${key}.${n}` : key;
	scene.sound.play(take, { volume: gain });
}

/** Random take among the loaded variants of a key (take 1 is the base file). */
function pickTake(scene: Phaser.Scene, key: SfxKey): string {
	const count: number = SFX[key].takes ?? 1;
	if (count <= 1) return key;
	const n = 1 + Math.floor(Math.random() * count);
	const take = n === 1 ? key : `${key}.${n}`;
	return scene.cache.audio.exists(take) ? take : key;
}
