import type Phaser from 'phaser';
import { getSave } from './context';

export type MusicKey =
	| 'music.menu'
	| 'music.table'
	| 'music.boss'
	| 'music.king'
	| 'music.win'
	| 'music.lose';
export const MUSIC_KEYS: readonly MusicKey[] = [
	'music.menu',
	'music.table',
	'music.boss',
	'music.king',
	'music.win',
	'music.lose',
];

const FADE_MS = 800;
/** Music sits under the SFX in the mix. */
const MUSIC_GAIN = 0.55;

let current: { key: MusicKey; sound: Phaser.Sound.BaseSound } | null = null;
/** Ducking multiplier: the music dips under big moments (TRUCO!, table won). */
const duckState = { gain: 1 };

function targetVolume(scene: Phaser.Scene): number {
	const v = getSave(scene).settings.volume;
	return v.master * v.music * MUSIC_GAIN * duckState.gain;
}

/** Dips the music to `gain` for `ms` (fast attack, slow release), then restores it. */
export function duckMusic(scene: Phaser.Scene, gain: number, ms: number): void {
	scene.tweens.killTweensOf(duckState);
	scene.tweens.chain({
		targets: duckState,
		tweens: [
			{ gain, duration: 120, onUpdate: () => refreshMusicVolume(scene) },
			{ gain: 1, delay: ms, duration: 700, onUpdate: () => refreshMusicVolume(scene) },
		],
	});
}

/** Loops `key`, crossfading from whatever is playing (the sound manager is global). */
export function playMusic(scene: Phaser.Scene, key: MusicKey): void {
	if (import.meta.env.SOUND_MUTED === 'true') return;
	if (current?.key === key && current.sound.isPlaying) return;
	if (!scene.cache.audio.exists(key)) return;
	stopMusic(scene);
	const sound = scene.sound.add(key, { loop: true, volume: 0 });
	sound.play();
	scene.tweens.add({ targets: sound, volume: targetVolume(scene), duration: FADE_MS });
	current = { key, sound };
}

export function stopMusic(scene: Phaser.Scene): void {
	if (!current) return;
	const old = current.sound;
	current = null;
	scene.tweens.add({
		targets: old,
		volume: 0,
		duration: FADE_MS,
		onComplete: () => old.destroy(),
	});
}

/** Ambience sits further under the music (crowd, crickets, bar noise). */
const AMBIENCE_GAIN = 0.35;
let ambience: { key: string; sound: Phaser.Sound.BaseSound } | null = null;

/** Ambience follows the Master and Music sliders (Music 0 silences it); it is not ducked. */
export function ambienceVolume(v: { master: number; music: number }): number {
	return v.master * v.music * AMBIENCE_GAIN;
}

/** Settings changed (or a duck step): apply the new music and ambience volumes right away. */
export function refreshMusicVolume(scene: Phaser.Scene): void {
	if (current) (current.sound as Phaser.Sound.WebAudioSound).setVolume(targetVolume(scene));
	if (ambience)
		(ambience.sound as Phaser.Sound.WebAudioSound).setVolume(
			ambienceVolume(getSave(scene).settings.volume),
		);
}

/** Loops an ambience (`amb.<place>`) under the music, or stops it with `null` (PLAN B3.1). */
export function playAmbience(scene: Phaser.Scene, key: string | null): void {
	if (ambience?.key === key) return;
	if (ambience) {
		const old = ambience.sound;
		scene.tweens.add({
			targets: old,
			volume: 0,
			duration: FADE_MS,
			onComplete: () => old.destroy(),
		});
		ambience = null;
	}
	if (!key || import.meta.env.SOUND_MUTED === 'true' || !scene.cache.audio.exists(key)) return;
	const sound = scene.sound.add(key, { loop: true, volume: 0 });
	sound.play();
	scene.tweens.add({
		targets: sound,
		volume: ambienceVolume(getSave(scene).settings.volume),
		duration: FADE_MS,
	});
	ambience = { key, sound };
}
