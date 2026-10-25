import type { ReactNode } from 'react';
import { Composition } from 'remotion';
import { FPS, TEASER_SECONDS, TRAILER_SECONDS } from './script';
import { Teaser, Trailer } from './Trailer';

/**
 * Trailer and 15 s ad cut at 1080p60 (PLAN RC3.4), EN and PT-BR on the same script
 * (src/script.ts), each with the footage recorded in its own language.
 */
export function Root(): ReactNode {
	const common = { fps: FPS, width: 1920, height: 1080 } as const;
	return (
		<>
			{(['en', 'pt'] as const).map((lang) => (
				<Composition
					key={`trailer-${lang}`}
					id={`Trailer-${lang}`}
					component={Trailer}
					durationInFrames={TRAILER_SECONDS * FPS}
					defaultProps={{ lang }}
					{...common}
				/>
			))}
			{(['en', 'pt'] as const).map((lang) => (
				<Composition
					key={`teaser-${lang}`}
					id={`Teaser-${lang}`}
					component={Teaser}
					durationInFrames={TEASER_SECONDS * FPS}
					defaultProps={{ lang }}
					{...common}
				/>
			))}
		</>
	);
}
