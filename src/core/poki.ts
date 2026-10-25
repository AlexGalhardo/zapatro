import { IS_POKI } from '../config/features';

/**
 * Poki SDK (PLAN B5.4): loaded only in the Poki build (`VITE_POKI=1`). Reports gameplay start and
 * stop around each table; every call is a no-op elsewhere or when the SDK failed to load
 * (ad blockers), so the game never waits on it.
 */
interface PokiSdk {
	init(): Promise<void>;
	gameLoadingFinished(): void;
	gameplayStart(): void;
	gameplayStop(): void;
}

const sdk = (): PokiSdk | null => (window as unknown as { PokiSDK?: PokiSdk }).PokiSDK ?? null;

let playing = false;

export function initPoki(): Promise<void> {
	if (!IS_POKI) return Promise.resolve();
	return new Promise((done) => {
		const s = document.createElement('script');
		s.src = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
		s.onload = () => {
			sdk()
				?.init()
				.catch(() => undefined)
				.finally(() => done());
		};
		s.onerror = () => done();
		document.head.append(s);
	});
}

export function pokiLoaded(): void {
	sdk()?.gameLoadingFinished();
}

export function pokiGameplay(on: boolean): void {
	if (!IS_POKI || on === playing) return;
	playing = on;
	if (on) sdk()?.gameplayStart();
	else sdk()?.gameplayStop();
}
