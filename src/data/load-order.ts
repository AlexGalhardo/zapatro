/**
 * When each public/ file loads (src/scenes/BootScene.ts). The first web download stays under 8 MB
 * (GD-017), so what the first screen never needs loads after it opens: later Championships'
 * ambiences, the final music, the extra table loops, every voice line, the painted character
 * cards, the shop/partner/extra menu paintings and the painted backs and faces other than the
 * standard deck's. Voice files carry their language (`vo.<lang>.…`): only the Settings language
 * loads; the other one streams in when the language changes.
 */
const LATER =
	/^assets\/(audio\/(sfx|music)\/(amb\.(?!botecoBairro)|music\.(king|table\d)|vo\.)|gfx\/(card\/|bg\/(shop|partner|street|bg[4-6]|menu-[2-7])\.|back\/(?!default\.)))/;
const VOICE = /^assets\/audio\/sfx\/vo\.(pt|en)\./;

/** The language of a voice file, or undefined for any other file. */
export function voiceLang(file: string): string | undefined {
	return VOICE.exec(file)?.[1];
}

/** `first`: before the first screen; `later`: right after it opens; `skip`: the other language. */
export function loadPhase(file: string, lang: string): 'first' | 'later' | 'skip' {
	const v = voiceLang(file);
	if (v !== undefined && v !== lang) return 'skip';
	return LATER.test(file) ? 'later' : 'first';
}
