// Catalog of every audio key of Truco Roguelite (docs/audio.md). Files follow the loader contract
// (src/scenes/BootScene.ts): sound effects and voices in public/assets/audio/sfx/<key>.mp3 (extra
// takes <key>.2.mp3 …), music and ambience loops in public/assets/audio/music/<key>.mp3.
// Raw ElevenLabs takes live in art-src/elevenlabs/<kind>/<key>/<n>.mp3 (never overwritten).
/** Priority of a sound: 1 = needed for the release, 2 = nice to have. */
type Tier = 1 | 2;

export type AudioKind = 'sfx' | 'ui' | 'music' | 'amb' | 'vo';

export interface AudioSpec {
	key: string;
	tier: Tier;
	kind: AudioKind;
	/** SFX/ambience/music prompt, or the line to speak for voices. */
	prompt: string;
	/** Seconds (SFX 0.5–30; music 3–300). */
	seconds: number;
	takes: number;
	/** Voices only: the character (voice) that speaks the line. */
	voice?: string;
}

/** Loudness targets (LUFS) per kind; true peak −1 dBTP. */
export const TARGET_LUFS: Record<AudioKind, number> = {
	sfx: -16,
	ui: -20,
	music: -18,
	amb: -30,
	vo: -16,
};

export const audioFile = (key: string, take: number): string => {
	const folder = key.startsWith('music.') || key.startsWith('amb.') ? 'music' : 'sfx';
	return `public/assets/audio/${folder}/${take === 1 ? key : `${key}.${take}`}.mp3`;
};

export const rawFile = (a: AudioSpec, take: number): string =>
	`art-src/elevenlabs/${a.kind}/${a.key}/${take}.mp3`;

const fx = (
	key: string,
	prompt: string,
	seconds: number,
	takes = 1,
	tier: Tier = 1,
): AudioSpec => ({
	key,
	tier,
	kind: 'sfx',
	prompt,
	seconds,
	takes,
});
const ui = (key: string, prompt: string, seconds: number): AudioSpec => ({
	key,
	tier: 1,
	kind: 'ui',
	prompt,
	seconds,
	takes: 1,
});

const MUSIC_COMMON =
	'instrumental, no vocals, seamless loop for a cozy pixel art card game set in a small bar in the countryside of Sao Paulo, Brazil';

const AMB_COMMON = 'no music, no clear words, seamless loop, steady background ambience';

/** Championship ambiences (tier 2) — one per location. */
const AMBIENCES: Record<string, string> = {
	barDeEstrada:
		'roadside truck stop bar at night: trucks passing on a highway outside, a buzzing neon sign, a few men murmuring',
	quermesse:
		'brazilian june festival at night: crowd chatter outdoors, a crackling bonfire, distant accordion forro music very faint, kids laughing',
	clube: 'old social club hall: quiet murmur of older people, domino tiles clacking, a big ceiling fan',
	festaDoPeao:
		'rodeo festival at night: big crowd far away, a rodeo announcer echoing unintelligibly, cattle mooing, dust and wind',
	regional:
		'small town gymnasium: echoing hall, crowd murmur, sneakers squeaking, folding chairs',
	estadual:
		'big championship hall: large audience murmuring, occasional applause, camera shutters',
	reiDoTruco:
		'legendary luxurious old bar: tense audience murmuring clearly in the room, glasses clinking, a grandfather clock ticking',
};

/** Voice lines (D-30): PT-BR, 2–3 takes each (the takes vary delivery). */
export const VO_LINES: Record<string, string> = {
	truco: 'TRUCO!',
	seis: 'SEIS!',
	nove: 'NOVE!',
	doze: 'DOZE!',
	bora: 'Bora! Desce!',
	corre: 'Tô fora.',
	caiu: 'Caiu!',
	oloco: 'Ô loco!',
};

/** Who speaks, and the voice design prompt for each (tier 2). */
export const VOICES: Record<string, string> = {
	tonhao: 'big burly brazilian man in his 40s, deep booming loud friendly voice, Sao Paulo countryside accent',
	donaCida:
		'older brazilian woman in her 60s, sharp clever voice, dry humor, Sao Paulo countryside accent',
	zeMalandro: 'brazilian man in his 30s, smooth slick street-smart voice, charming, playful',
	juninho: 'brazilian teenage boy, 16 years old, excited cracking voice, fast talker',
	ze: 'skinny brazilian man in his 50s, raspy nasal voice with a strong caipira accent',
	bia: 'young brazilian woman in her 20s, confident loud cheerful voice',
	joca: 'chubby young brazilian guy, goofy loud voice, laughs easily',
	lurdes: 'brazilian woman in her 50s, high pitched gossipy voice, dramatic',
	tiao: 'old brazilian man in his 70s, slow calm low voice, wise, gentle caipira accent',
	neide: 'brazilian woman in her 40s, dry suspicious nasal voice',
	valentao: 'huge brazilian brute, very deep gravelly threatening voice',
	cartomante: 'mysterious brazilian woman, low whispery theatrical voice',
	juiz: 'stern old brazilian man, strict authoritative voice',
	agiota: 'fat brazilian loan shark, greasy smug voice, slow',
	delegado: 'brazilian police chief, commanding loud voice with a mustache grumble',
	reiDoTruco: 'legendary old brazilian card player, rich warm confident voice, theatrical',
};

export const AUDIO: AudioSpec[] = [
	// Cards and table (src/data/sfx.ts).
	fx(
		'sfx.card.shuffle',
		'riffle shuffle of a worn paper deck of playing cards on a table, bridge finish',
		1.0,
	),
	fx('sfx.card.deal', 'one playing card dealt and sliding fast across a formica table', 0.5, 2),
	fx(
		'sfx.card.play',
		'playing card slapped down firmly on a formica table, crisp paper snap',
		0.5,
		2,
	),
	fx('sfx.card.flip', 'a single playing card flipped face up on a table, light paper flick', 0.5),
	fx(
		'sfx.trick.win',
		'hand sweeping a small pile of playing cards off a table into a neat stack',
		0.6,
	),
	fx(
		'sfx.truco',
		'powerful open palm slam on a wooden bar table, glasses rattle, dry punchy thud',
		0.8,
		2,
	),
	fx('sfx.bet.accept', 'two quick confident knuckle knocks on a wooden table', 0.5),
	fx(
		'sfx.bet.run',
		'playing cards tossed down in defeat on a table, then a chair scraping back',
		0.8,
	),
	fx('sfx.signal', 'very short soft sneaky whoosh', 0.5),
	fx('sfx.signal.caught', 'one short sharp referee whistle blow', 0.6),
	// Scoring and economy.
	fx('sfx.score.chip', 'one tiny clean poker chip click, very short tick', 0.5),
	fx('sfx.score.mult', 'low punchy wooden thock, short and deep', 0.5),
	fx(
		'sfx.score.xmult',
		'two glass beer bottles clinking loudly together, bright bell-like ring with a shimmering sustained tail',
		1.0,
	),
	fx('sfx.money', 'a few coins dropped onto a wooden table, short bright jingle', 0.6),
	fx('sfx.manha.trigger', 'short playful magical sparkle pop, little chime', 0.5),
	fx('sfx.table.win', 'small bar crowd cheering and clapping, a bottle cap pops, happy', 2.0),
	fx('sfx.table.lose', 'small bar crowd groaning in disappointment, a chair creaks', 2.0),
	// Shop and interface.
	ui('sfx.shop.buy', 'old mechanical cash register ding with a coin drop', 0.6),
	ui(
		'sfx.shop.reroll',
		'loud quick riffle of a stack of paper tickets ending with a sharp click',
		0.8,
	),
	ui(
		'sfx.pack.open',
		'tearing open a paper envelope quickly, then playing cards fanning out',
		1.0,
	),
	ui('sfx.ui.move', 'tiny soft wooden tick, very short', 0.5),
	ui('sfx.ui.confirm', 'short pleasant wooden click with a soft little bell', 0.5),
	ui('sfx.ui.back', 'short soft paper swipe', 0.5),
	ui('sfx.ui.error', 'short dull double wooden knock, negative', 0.5),
	// Game director review 2026-10-25 §8: tier 1 = priority, tier 2 = polish (not generated yet).
	fx(
		'sfx.zap.reveal',
		'Short bright magical sparkle sting with a tiny bell, playful, no reverb tail, mono, for a card game highlight',
		0.6,
	),
	fx(
		'sfx.bet.doze',
		'Dramatic short impact: a heavy wooden table slap followed by a low thud and a quick cymbal choke, dry, mono',
		0.8,
	),
	fx(
		'sfx.queda',
		'Triumphant short brass hit with a rising shaker, bar celebration feel, dry',
		1.0,
	),
	fx(
		'sfx.hand.lose',
		'Two hollow wooden blocks tapped one after the other, the second lower in pitch, a gentle disappointed sound, dry, mono',
		0.5,
	),
	fx(
		'sfx.card.cover',
		'Single playing card placed face down on felt with a muffled slide, very short, mono',
		0.5,
	),
	fx(
		'sfx.joker.spin',
		'Fast ticking spinning wheel of a small prize drum, ending in a click, dry',
		1.2,
		1,
		2,
	),
	fx(
		'sfx.boss.intro',
		'Ominous short accordion chord with a low drum hit, Brazilian countryside bar',
		1.5,
		1,
		2,
	),
	fx(
		'sfx.eleven.enter',
		'Tension riser: low string swell with a heartbeat, ends abruptly',
		2.0,
		1,
		2,
	),
	fx('sfx.iron.enter', 'Metallic anvil hit with a long dark ring', 2.0, 1, 2),
	...(
		[
			[
				'sfx.feat.unlock',
				'Short achievement chime: two ascending glockenspiel notes, clean, no tail',
				0.7,
			],
			// The API minimum is 0.5 s: trim toggle (0.15 s) and slider (0.08 s) after normalizing.
			['sfx.ui.toggle', 'Tiny plastic switch click, very short, mono', 0.5],
			['sfx.ui.slider', 'Very short soft tick, wooden, mono', 0.5],
			['sfx.promise', 'Paper note being folded and tucked into a pocket, short, mono', 0.6],
		] as const
	).map(
		([key, prompt, seconds]): AudioSpec => ({
			key,
			tier: 2,
			kind: 'ui',
			prompt,
			seconds,
			takes: 1,
		}),
	),
	// Music (src/core/music.ts).
	{
		key: 'music.menu',
		tier: 1,
		kind: 'music',
		prompt: `Calm nostalgic Brazilian viola caipira solo with soft acoustic guitar, warm late afternoon mood, gentle and inviting, 80 bpm. ${MUSIC_COMMON}`,
		seconds: 60,
		takes: 1,
	},
	{
		key: 'music.table',
		tier: 1,
		kind: 'music',
		prompt: `Upbeat relaxed Brazilian sertanejo raiz groove as if from an old AM radio in a bar: viola caipira riff, acoustic guitar, soft accordion, light percussion, slightly lo-fi and warm, 100 bpm. ${MUSIC_COMMON}`,
		seconds: 75,
		takes: 1,
	},
	{
		key: 'music.boss',
		tier: 1,
		kind: 'music',
		prompt: `Tense Brazilian showdown: driving zabumba and pandeiro percussion, low tense viola caipira ostinato, dramatic accordion stabs, rising suspense, 120 bpm. ${MUSIC_COMMON}`,
		seconds: 60,
		takes: 1,
	},
	{
		key: 'music.king',
		tier: 2,
		kind: 'music',
		prompt: `Grand legendary final duel theme: majestic viola caipira melody over big orchestral strings, pounding zabumba, triumphant brass, epic but still Brazilian countryside, 110 bpm. ${MUSIC_COMMON}`,
		seconds: 60,
		takes: 1,
	},
	{
		key: 'music.win',
		tier: 1,
		kind: 'music',
		prompt: 'Short joyful Brazilian victory jingle: bright accordion and viola caipira flourish, triangle and zabumba, festive ending, instrumental, no vocals',
		seconds: 12,
		takes: 1,
	},
	{
		key: 'music.lose',
		tier: 1,
		kind: 'music',
		prompt: 'Short sad funny Brazilian defeat jingle: slow descending viola caipira phrase, a sighing accordion, gentle ending, instrumental, no vocals',
		seconds: 10,
		takes: 1,
	},
	{
		key: 'music.shop',
		tier: 2,
		kind: 'music',
		prompt: `Relaxed Brazilian viola caipira and triangle, mid tempo, warm bar afternoon, lighter than the table theme. ${MUSIC_COMMON}`,
		seconds: 60,
		takes: 1,
	},
	// Ambience.
	{
		key: 'amb.decisive',
		tier: 2,
		kind: 'amb',
		prompt: `Bar crowd going quiet then murmuring with tension, a glass set down, ${AMB_COMMON}`,
		seconds: 30,
		takes: 1,
	},
	{
		key: 'amb.botecoBairro',
		tier: 1,
		kind: 'amb',
		prompt: `Small brazilian neighborhood bar at night: murmur of conversation in the background, a ceiling fan humming, glasses clinking now and then, a small tv far away, ${AMB_COMMON}`,
		seconds: 30,
		takes: 1,
	},
	...Object.entries(AMBIENCES).map(
		([id, p]): AudioSpec => ({
			key: `amb.${id}`,
			tier: 2,
			kind: 'amb',
			prompt: `${p}, ${AMB_COMMON}`,
			seconds: 30,
			takes: 1,
		}),
	),
	// Voices.
	...Object.keys(VOICES).flatMap((voice) =>
		Object.entries(VO_LINES).map(
			([line, text]): AudioSpec => ({
				key: `vo.${voice}.${line}`,
				tier: 2,
				kind: 'vo',
				prompt: text,
				seconds: 1.5,
				takes: line === 'truco' ? 3 : 2,
				voice,
			}),
		),
	),
];
