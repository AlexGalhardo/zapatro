import { loadFont } from '@remotion/google-fonts/Rubik';
import type { ReactNode } from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	OffthreadVideo,
	random,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import enClips from '../public/clips/en/clips.json';
import ptClips from '../public/clips/pt/clips.json';
import { type Cue, FPS, NOT_BANDED, TEASER_CUES, TRAILER_CUES } from './script';
import { type Lang, TEXT } from './text';

type ClipIndex = Record<string, { ready: number; marks?: Record<string, number> }>;
/** Per language: second each recorded clip's scene became ready, plus timeline marks (scripts/record-clips.ts). */
const CLIPS: Record<Lang, ClipIndex> = { en: enClips, pt: ptClips };

/** The game's only font (Art Bible v2). */
const { fontFamily } = loadFont('normal', { weights: ['500', '700'], subsets: ['latin'] });

/** The game's palette (src/config/palette.ts). */
export const C = {
	ground: '#2B2B2B',
	night: '#14100d',
	text: '#f4ead8',
	gold: '#ffd24a',
	mult: '#ff4a4a',
	truco: '#d8322f',
	cta: '#e8741c',
	panel: '#231C17',
};

export const sfx = (key: string): string => staticFile(`game/audio/sfx/${key}.mp3`);
export const music = (key: string): string => staticFile(`game/audio/music/${key}.mp3`);
export const s = (sec: number): number => Math.round(sec * FPS);

/**
 * A stretch of a recorded clip in the cut's language: `at` seconds after its scene became ready,
 * or after a timeline mark (`call3`, `count`…) when given.
 */
export function Clip({
	lang,
	name,
	at,
	mark,
}: {
	lang: Lang;
	name: string;
	at: number;
	mark?: string;
}): ReactNode {
	const info = CLIPS[lang][name];
	const from = (mark ? (info?.marks?.[mark] ?? 0) : (info?.ready ?? 0)) + at;
	return (
		<AbsoluteFill style={{ background: C.night }}>
			<OffthreadVideo
				src={staticFile(`clips/${lang}/${name}.webm`)}
				startFrom={s(from)}
				muted
				style={{ width: '100%', height: '100%', objectFit: 'cover' }}
			/>
		</AbsoluteFill>
	);
}

/** Caption on a panel near the bottom, popping in. */
function Caption({ text }: { text: string }): ReactNode {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const k = spring({ frame, fps, config: { damping: 14 } });
	return (
		<AbsoluteFill
			style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 90 }}
		>
			<div
				style={{
					fontFamily,
					fontWeight: 700,
					fontSize: 68,
					color: C.text,
					background: C.panel,
					borderRadius: 24,
					boxShadow: '0 10px 0 rgba(0,0,0,0.55)',
					padding: '16px 44px',
					transform: `translateY(${(1 - k) * 60}px)`,
					opacity: k,
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
}

/** Huge shouted word (TRUCO!, SEIS!): punch-in and screen shake. */
function BigWord({ text, color }: { text: string; color: string }): ReactNode {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const k = spring({ frame, fps, config: { damping: 9, stiffness: 180 } });
	const shake = Math.max(0, 1 - frame / 20) * 24;
	const dx = (random(`x${frame}`) - 0.5) * shake;
	const dy = (random(`y${frame}`) - 0.5) * shake;
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle, ${color}55 0%, ${C.ground} 70%)`,
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div
				style={{
					fontFamily,
					fontWeight: 700,
					fontSize: 280,
					color,
					transform: `translate(${dx}px, ${dy}px) scale(${interpolate(k, [0, 1], [2.4, 1])})`,
					textShadow: '0 14px 0 rgba(0,0,0,0.6)',
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
}

/** Logo and tagline on the flat neutral ground; with `cta`, the stores and the site below. */
function Card({ lang, cta }: { lang: Lang; cta: boolean }): ReactNode {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const k = spring({ frame, fps, config: { damping: 12 } });
	const t = TEXT[lang];
	const late = interpolate(frame, [s(0.6), s(1)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				gap: 20,
				background: C.ground,
			}}
		>
			<Img
				src={staticFile('game/app-icon.png')}
				style={{ width: 200, height: 200, transform: `scale(${k})` }}
			/>
			<div
				style={{
					fontFamily,
					fontWeight: 700,
					fontSize: 150,
					color: C.gold,
					textShadow: '0 12px 0 rgba(0,0,0,0.6)',
				}}
			>
				Zapatro
			</div>
			<div style={{ fontFamily, fontWeight: 500, fontSize: 56, color: C.text }}>
				{t.tagline}
			</div>
			{cta ? (
				<>
					<div
						style={{
							fontFamily,
							fontWeight: 700,
							fontSize: 52,
							color: C.night,
							background: C.cta,
							borderRadius: 20,
							boxShadow: '0 10px 0 rgba(0,0,0,0.55)',
							padding: '16px 44px',
							marginTop: 30,
							opacity: late,
						}}
					>
						{t.cta}
					</div>
					<div
						style={{
							fontFamily,
							fontWeight: 500,
							fontSize: 48,
							color: C.gold,
							opacity: late,
						}}
					>
						{t.url}
					</div>
				</>
			) : null}
		</AbsoluteFill>
	);
}

type Shot = { from: number; dur: number; node: ReactNode };
type Sound = {
	from: number;
	src: string;
	dur?: number;
	volume?: number;
	/** Seconds of fade in/out (crossfades keep the music bed unbroken). */
	fadeIn?: number;
	fadeOut?: number;
	loop?: boolean;
};

/** Volume envelope of a sound at frame `f` of its sequence. */
const envelope = (so: Sound, f: number): number => {
	const base = so.volume ?? 1;
	const inK = so.fadeIn ? Math.min(1, f / s(so.fadeIn)) : 1;
	const outK = so.fadeOut && so.dur ? Math.min(1, (s(so.dur) - f) / s(so.fadeOut)) : 1;
	return base * Math.max(0, Math.min(inK, outK));
};

function Cut({
	lang,
	shots,
	sounds,
	cues,
}: {
	lang: Lang;
	shots: Shot[];
	sounds: Sound[];
	cues: Cue[];
}): ReactNode {
	return (
		<AbsoluteFill style={{ background: C.ground }}>
			{shots.map((sh) => (
				<Sequence key={`v${sh.from}`} from={s(sh.from)} durationInFrames={s(sh.dur)}>
					{sh.node}
				</Sequence>
			))}
			{cues
				.filter((c) => !NOT_BANDED.has(c.line))
				.map((c) => (
					<Sequence key={`c${c.from}`} from={s(c.from)} durationInFrames={s(c.dur)}>
						<Caption text={TEXT[lang][c.line]} />
					</Sequence>
				))}
			{sounds.map((so) => (
				<Sequence
					key={`a${so.from}${so.src}`}
					from={s(so.from)}
					{...(so.dur ? { durationInFrames: s(so.dur) } : {})}
				>
					<Audio src={so.src} loop={so.loop} volume={(f) => envelope(so, f)} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
}

const chips = (from: number, n: number, gap: number): Sound[] =>
	Array.from({ length: n }, (_, i) => ({
		from: from + i * gap,
		src: sfx('sfx.score.chip'),
		volume: 0.7,
	}));

/** The 60 s trailer, EN and PT-BR on the same script (src/script.ts). */
export function Trailer({ lang }: { lang: Lang }): ReactNode {
	const t = TEXT[lang];
	const clip = (name: string, at: number, mark?: string): ReactNode => (
		<Clip lang={lang} name={name} at={at} {...(mark ? { mark } : {})} />
	);
	const shots: Shot[] = [
		{ from: 0, dur: 2.5, node: <Card lang={lang} cta={false} /> },
		{ from: 2.5, dur: 2.5, node: <BigWord text={t.truco} color={C.truco} /> },
		{ from: 5, dur: 7, node: clip('table', 0.4) },
		{ from: 12, dur: 4, node: clip('escalate', -0.6, 'call3') },
		{ from: 16, dur: 1.5, node: <BigWord text={t.six} color={C.mult} /> },
		{ from: 17.5, dur: 7.5, node: clip('table', -2.5, 'count') },
		{ from: 25, dur: 4, node: clip('shop', 3.2) },
		{ from: 29, dur: 3.5, node: clip('build', 0.4) },
		{ from: 32.5, dur: 3.5, node: clip('build', 3.3) },
		{ from: 36, dur: 4, node: clip('build', 6.4) },
		{ from: 40, dur: 12, node: clip('boss', 0.5) },
		{ from: 52, dur: 8, node: <Card lang={lang} cta /> },
	];
	const sounds: Sound[] = [
		// Music bed, never silent: table → boss → win, crossfading.
		{
			from: 0,
			src: music('music.table'),
			dur: 42,
			volume: 0.75,
			fadeIn: 0.5,
			fadeOut: 2,
			loop: true,
		},
		{ from: 40, src: music('music.boss'), dur: 14, volume: 0.8, fadeIn: 2, fadeOut: 2 },
		{ from: 52, src: music('music.win'), dur: 8, volume: 0.85, fadeIn: 1, fadeOut: 2 },
		{ from: 2.5, src: sfx('sfx.truco') },
		{ from: 2.6, src: sfx('vo.tonhao.truco') },
		{ from: 5.4, src: sfx('sfx.card.deal') },
		{ from: 12, src: sfx('sfx.truco.2'), volume: 0.8 },
		{ from: 16, src: sfx('vo.bia.seis') },
		{ from: 16, src: sfx('sfx.bet.accept'), volume: 0.7 },
		...chips(18, 8, 0.35),
		{ from: 21, src: sfx('sfx.score.xmult') },
		{ from: 25.4, src: sfx('sfx.shop.buy') },
		{ from: 27.2, src: sfx('sfx.money') },
		{ from: 32.6, src: sfx('sfx.card.shuffle') },
		{ from: 36.2, src: sfx('sfx.pack.open') },
		{ from: 52, src: sfx('sfx.table.win') },
		{ from: 53, src: sfx('vo.tonhao.oloco') },
	];
	return <Cut lang={lang} shots={shots} sounds={sounds} cues={TRAILER_CUES} />;
}

/** 15 s ad cut on the same footage: hand, TRUCO!, the count, a boss, end card. */
export function Teaser({ lang }: { lang: Lang }): ReactNode {
	const t = TEXT[lang];
	const shots: Shot[] = [
		{ from: 0, dur: 3, node: <Clip lang={lang} name="table" at={2} /> },
		{ from: 3, dur: 2, node: <BigWord text={t.truco} color={C.truco} /> },
		{ from: 5, dur: 3.5, node: <Clip lang={lang} name="table" at={-0.4} mark="count" /> },
		{ from: 8.5, dur: 3, node: <Clip lang={lang} name="boss" at={0.5} /> },
		{ from: 11.5, dur: 3.5, node: <Card lang={lang} cta /> },
	];
	const sounds: Sound[] = [
		{ from: 0, src: music('music.table'), dur: 11.5, volume: 0.7, fadeOut: 1 },
		{ from: 3, src: sfx('sfx.truco') },
		{ from: 3.05, src: sfx('vo.tonhao.truco') },
		...chips(5.4, 5, 0.35),
		{ from: 7.3, src: sfx('sfx.score.xmult') },
		{ from: 8.5, src: music('music.boss'), dur: 3, volume: 0.8, fadeIn: 0.5 },
		{ from: 11.5, src: music('music.win'), dur: 3.5, volume: 0.8 },
	];
	return <Cut lang={lang} shots={shots} sounds={sounds} cues={TEASER_CUES} />;
}
