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

const MUSIC_FINAL =
	'instrumental, no vocals, seamless loop, upbeat but relaxed card-game table background, mid-tempo so it never fights the voice lines';

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

export const LANGS = ['pt', 'en'] as const;
export type VoLang = (typeof LANGS)[number];

/**
 * Voice lines (docs/audio-final-game.md): 8 standard barks, the same for every character, and 3
 * jokes per character (`piada1`–`piada3`, in `VO_JOKES`). Each has a text per language; each is
 * recorded in 2 takes (the takes vary delivery).
 */
export const VO_LINES: Record<string, Record<VoLang, string>> = {
	truco: { pt: 'TRUCO!', en: 'TRUCO!' },
	seis: { pt: 'SEIS!', en: 'SIX!' },
	nove: { pt: 'NOVE!', en: 'NINE!' },
	doze: { pt: 'DOZE!', en: 'TWELVE!' },
	corre: { pt: 'Tô fora!', en: "I'm out!" },
	bora: { pt: 'Bora!', en: "Let's go!" },
	ver: { pt: 'Quero ver!', en: 'Show me!' },
	sacanagem: { pt: 'Tá de sacanagem comigo!', en: "You're kidding me!" },
};

/** Who speaks, and the voice design prompt for each. One voice speaks both languages. */
export const VOICES: Record<string, string> = {
	bruto: 'Big burly Brazilian man in his 40s, very deep gravelly voice, slow and intimidating but with dry humor, smoker rasp, Sao Paulo accent',
	cida: 'Brazilian woman in her 50s, warm husky laugh in her voice, loud cheerful gossipy bar-owner energy, Sao Paulo accent',
	jhony: 'Brazilian man in his mid 20s, smooth cocky street-smart voice, slick and playful, confident smirk you can hear, Rio-influenced accent',
	nino: 'Young Brazilian man in his late 20s, energetic friendly voice, football-fan enthusiasm, fast and playful, Rio carioca accent',
	ze: 'Brazilian man in his 60s, friendly raspy voice, warm bar-owner banter, slightly nasal with a strong caipira accent, always smiling',
	mia: 'Young Brazilian woman in her late 20s, confident sporty voice, teasing and a little flirty, bright and loud, beach-town accent',
	chico: 'Brazilian man in his mid 30s, relaxed easygoing country voice, lazy drawl, chuckling, caipira accent',
	beti: 'Brazilian woman in her 50s, rich warm theatrical voice, dramatic gossipy whisper that rises into laughter, mystical but cozy',
	ayla: 'Young Brazilian woman in her mid 20s, raspy punk-rock attitude, relaxed sarcastic cool, a bit of vocal fry, Sao Paulo city accent',
	sheila: 'Brazilian woman in her early 30s, glamorous sultry voice, slow and sassy, diva who is bored and amused, polished accent',
	valentao:
		'Huge Brazilian brute, extremely deep growling threatening voice, short aggressive sentences, no humor',
	cartomante:
		'Mysterious Brazilian woman, low whispery theatrical voice, slow hypnotic delivery, smug and all-knowing',
	juiz: 'Stern old Brazilian man in his 60s, strict authoritative courtroom voice, clipped and formal, dry sarcasm',
	agiota: 'Heavyset Brazilian man in his 50s, greasy smug voice, slow and syrupy, cigar-roughened, sounds like he is counting money',
	tony: 'Brazilian police chief in his 50s, commanding loud gruff voice, mustache grumble, tough-guy deadpan, Rio accent',
	stuart: 'Brazilian man in his early 40s, friendly nerdy professor voice, articulate and a bit excited, explaining with enthusiasm',
	peter: 'Brazilian man in his early 40s, low calm quiet voice, slow minimalist delivery, thoughtful and laid-back, almost murmuring',
	sortuda:
		'Brazilian woman in her early 30s, playful lucky-charm voice, honeyed and teasing, giggly with a wink in the tone',
	reiDoTruco:
		'Legendary old Brazilian card-player in his 60s, rich warm confident voice, theatrical godfather gravitas, slow and amused',
};

/** Three jokes per character, spoken at random on the table (`piada1`–`piada3`). */
export const VO_JOKES: Record<string, Record<VoLang, [string, string, string]>> = {
	bruto: {
		pt: [
			'Aqui não tem conversa fiada!',
			'Respeito é o que eu cobro, e hoje tá caro.',
			'Segura a cerveja que lá vem trovão.',
		],
		en: [
			'No small talk at this table!',
			"Respect is what I charge, and today it's pricey.",
			'Hold your beer, here comes thunder.',
		],
	},
	cida: {
		pt: [
			'Ai, que dó... de vocês!',
			'Tô na cerveja, mas na cartada eu tô sóbria!',
			'Pode vir, meu bem, a tia Cida não perdoa!',
		],
		en: [
			'Aww, how sad... for you!',
			"I'm on the beer, but my cards are sober!",
			"Come on, honey, Auntie Cida doesn't forgive!",
		],
	},
	jhony: {
		pt: [
			'Esse jogo eu pago em dinheiro vivo!',
			'Relógio de ouro não marca hora de perder.',
			'Até meu colar tá rindo de vocês!',
		],
		en: [
			"I'm paying for this game in cold cash!",
			"A gold watch doesn't tell the time for losing.",
			'Even my chain is laughing at you!',
		],
	},
	nino: {
		pt: [
			'Camisa 10 em campo, bicho!',
			'Eu jogo truco igual jogo bola: no drible!',
			'Gol de placa, meu povo!',
		],
		en: [
			'Number 10 on the pitch, man!',
			'I play truco like I play football: with a dribble!',
			'What a goal, folks!',
		],
	},
	ze: {
		pt: [
			'Fiado só amanhã, mas carta é na hora!',
			'Esse truco eu aprendi atrás do balcão.',
			'Uma gelada por conta da casa, que eu cobro depois!',
		],
		en: [
			'Credit is for tomorrow, but cards are for now!',
			'I learned this truco behind the counter.',
			"A cold one on the house, I'll bill you later!",
		],
	},
	mia: {
		pt: [
			'Treino pesado, jogo leve, vitória na mão!',
			'Pode olhar, mas só quem aguenta o peso vence.',
			'Meu bíceps trabalha, minha cartada também!',
		],
		en: [
			'Heavy workout, light game, victory in hand!',
			'Go ahead and look, only the strong win.',
			'My biceps work, and so does my play!',
		],
	},
	chico: {
		pt: [
			'Peixe grande não cai em anzol pequeno!',
			'Pode vir, que o chapéu dá sorte!',
			'Tô só no palito, esperando a sua jogada.',
		],
		en: [
			"Big fish don't bite small hooks!",
			'Come on, the hat is lucky!',
			'Just chewing my toothpick, waiting for your move.',
		],
	},
	beti: {
		pt: [
			'A bola de cristal disse que você vai perder!',
			'Dá a mão que eu leio... o seu blefe!',
			'Vela acesa, sorte garantida, meu filho!',
		],
		en: [
			'The crystal ball says you will lose!',
			"Give me your hand and I'll read... your bluff!",
			'Lit candle, guaranteed luck, dear!',
		],
	},
	ayla: {
		pt: [
			'Rock baby! Esse truco é pesado!',
			'Meu skate tem mais manha que o seu baralho!',
			'Vem na manobra, que eu caio e levanto!',
		],
		en: [
			'Rock baby! This truco goes hard!',
			'My skateboard has more tricks than your deck!',
			'Bring the trick, I fall and get back up!',
		],
	},
	sheila: {
		pt: [
			'Amor, esse jogo é caro, mas eu tô bem acompanhada!',
			'Bolsa de grife, jogada de rainha!',
			'Ai, quebrou uma unha... e a sua esperança!',
		],
		en: [
			"Darling, this game is expensive, but I'm in good company!",
			"Designer bag, queen's play!",
			'Oh, I broke a nail... and your hope!',
		],
	},
	valentao: {
		pt: [
			'Aqui quem manda sou eu e o meu truco!',
			'Tá olhando o quê? Joga logo!',
			'Meu punho é mais forte que a sua carta!',
		],
		en: [
			'I run this place, and so does my truco!',
			'What are you looking at? Play already!',
			'My fist is stronger than your card!',
		],
	},
	cartomante: {
		pt: [
			'Eu vi esse seu truco antes de você nascer!',
			'As cartas falam, e hoje elas riem de você.',
			'A vira tá escondida, mas o seu medo não!',
		],
		en: [
			'I saw this truco of yours before you were born!',
			'The cards speak, and today they laugh at you.',
			'The vira is hidden, but your fear is not!',
		],
	},
	juiz: {
		pt: [
			'Ordem na mesa! Truco é coisa séria!',
			'Condenado a perder a mão.',
			'Silêncio! O martelo já decidiu.',
		],
		en: [
			'Order at the table! Truco is serious business!',
			'Sentenced to lose the hand.',
			'Silence! The gavel has decided.',
		],
	},
	agiota: {
		pt: [
			'Perdeu a mão? Põe na conta, com juros!',
			'Todo mundo me deve, até a sorte.',
			'Dinheiro não aceita desaforo, amigo.',
		],
		en: [
			'Lost the hand? Put it on the tab, with interest!',
			'Everybody owes me, even luck.',
			"Money doesn't take disrespect, friend.",
		],
	},
	tony: {
		pt: [
			'Documentos, e a carta mais alta!',
			'Você tem o direito de blefar... eu tenho o de prender.',
			'Isso aqui é jogo limpo, ou eu fecho o boteco!',
		],
		en: [
			'License, and your highest card!',
			'You have the right to bluff... I have the right to arrest.',
			'Clean game, or I shut down the bar!',
		],
	},
	stuart: {
		pt: [
			'Pela matemática, você tem 12% de chance.',
			'A filosofia ensina: quem blefa, aprende.',
			'Café, ideias e planos... e agora, um truco.',
		],
		en: [
			'Mathematically, you have a 12% chance.',
			'Philosophy teaches: who bluffs, learns.',
			'Coffee, ideas and plans... and now, a truco.',
		],
	},
	peter: {
		pt: [
			'Hmm... interessante.',
			'Não preciso de sinal... eu sinto a sua mão.',
			'Silêncio também é jogada.',
		],
		en: [
			'Hmm... interesting.',
			'I need no signal... I feel your hand.',
			'Silence is also a play.',
		],
	},
	sortuda: {
		pt: [
			'Sorte? Não, é talento... com um pouquinho de sorte.',
			'Hoje a manilha é minha, eu já sei.',
			'Sopra a ficha que dá sorte!',
		],
		en: [
			"Luck? No, it's talent... with a little luck.",
			'Today the manilha is mine, I just know.',
			'Blow on the chip, it brings luck!',
		],
	},
	reiDoTruco: {
		pt: [
			'Eu era rei antes de vocês nascerem.',
			'A coroa não cai, só muda de cabeça... e hoje é a minha.',
			'Respeito se conquista, truco se cobra.',
		],
		en: [
			'I was king before you were born.',
			"The crown never falls, it only changes heads... and today it's mine.",
			'Respect is earned, truco is collected.',
		],
	},
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
	{
		key: 'music.table2',
		tier: 2,
		kind: 'music',
		prompt: `Sunset Miami Beach lounge, synthwave-tinged tropical house, warm analog pads, soft electric piano, chill groove at 100 bpm, palm trees and neon, retro sunshine. ${MUSIC_FINAL}`,
		seconds: 60,
		takes: 1,
	},
	{
		key: 'music.table3',
		tier: 2,
		kind: 'music',
		prompt: `Hawaiian casino lounge, slack-key guitar and ukulele with vibraphone and upright bass, brushed drums, smoky jazz-lounge swing at 96 bpm, ocean breeze, poker night. ${MUSIC_FINAL}`,
		seconds: 60,
		takes: 1,
	},
	{
		key: 'music.table4',
		tier: 2,
		kind: 'music',
		prompt: `Sao Paulo bar at golden hour, samba-rock with cavaquinho, nylon guitar, 7-string guitar bass runs, light pandeiro and tamborim, cozy beer-table groove at 104 bpm. ${MUSIC_FINAL}`,
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
	// Voices: key `vo.<lang>.<char>.<line>`, 2 takes each.
	...LANGS.flatMap((lang) =>
		Object.keys(VOICES).flatMap((voice) => [
			...Object.entries(VO_LINES).map(
				([line, text]): AudioSpec => ({
					key: `vo.${lang}.${voice}.${line}`,
					tier: 2,
					kind: 'vo',
					prompt: text[lang],
					seconds: 1.5,
					takes: 2,
					voice,
				}),
			),
			...(VO_JOKES[voice]?.[lang] ?? []).map(
				(text, i): AudioSpec => ({
					key: `vo.${lang}.${voice}.piada${i + 1}`,
					tier: 2,
					kind: 'vo',
					prompt: text,
					seconds: 4,
					takes: 2,
					voice,
				}),
			),
		]),
	),
];
