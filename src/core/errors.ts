import Phaser from 'phaser';
import { t } from '../i18n';
import { restartApp } from './platform';
import { shareFile } from './storage';

/**
 * Global error handling (1.0, R1.3): the last log lines are kept in memory; an uncaught error or
 * rejected promise shows a friendly DOM overlay (continue · reload · download the log) instead of
 * a silently broken game. Plain DOM so it works even when Phaser itself is what failed.
 */
const LOG_MAX = 200;
const log: string[] = [];
let overlay: HTMLDivElement | null = null;
let shownAt = 0;

function push(level: string, parts: unknown[]): void {
	const line = `${new Date().toISOString()} [${level}] ${parts
		.map((p) => (p instanceof Error ? `${p.message}\n${p.stack ?? ''}` : String(p)))
		.join(' ')}`;
	log.push(line);
	if (log.length > LOG_MAX) log.shift();
}

export function errorLog(): string {
	return [`Zapatro ${__APP_VERSION__} · ${navigator.userAgent}`, '', ...log].join('\n');
}

function download(): void {
	shareFile(`truco-roguelite-log-${Date.now()}.txt`, errorLog(), 'text/plain');
}

/** Full-screen message over the canvas (also used when WebGL is missing). */
export function showOverlay(
	title: string,
	message: string,
	fatal = false,
	reload: () => void = () => location.reload(),
): void {
	overlay?.remove();
	const box = document.createElement('div');
	box.setAttribute('role', 'alertdialog');
	box.style.cssText =
		'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:10;background:rgba(5,5,8,0.88);font:16px "Rubik","Segoe UI",sans-serif;color:#e8ecf2';
	const card = document.createElement('div');
	card.style.cssText =
		'max-width:560px;padding:24px 28px;background:#151311;border:2px solid #c8a063;text-align:center';
	const h = document.createElement('h2');
	h.textContent = title;
	h.style.cssText =
		'margin:0 0 12px;color:#ff9a2e;font-family:"Rubik","Segoe UI",sans-serif;font-weight:700';
	const p = document.createElement('p');
	p.textContent = message;
	p.style.cssText = 'margin:0 0 18px;line-height:1.4;color:#d9cdb8;white-space:pre-wrap';
	card.append(h, p);
	const button = (label: string, fn: () => void) => {
		const b = document.createElement('button');
		b.textContent = label;
		b.style.cssText =
			'margin:0 6px;padding:8px 14px;font:inherit;font-weight:700;color:#fff;background:#221d18;border:1px solid #c8a063;cursor:pointer';
		b.onclick = fn;
		card.append(b);
	};
	if (!fatal)
		button(t('error.continue'), () => {
			box.remove();
			overlay = null;
		});
	button(t('error.reload'), reload);
	if (!fatal) button(t('error.log'), download);
	box.append(card);
	document.body.append(box);
	overlay = box;
}

function report(err: unknown): void {
	push('uncaught', [err]);
	// One overlay at a time; a burst of the same failure does not stack dialogs.
	if (overlay || Date.now() - shownAt < 5000) return;
	shownAt = Date.now();
	const msg = err instanceof Error ? err.message : String(err);
	showOverlay(t('error.title'), t('error.body', { msg }));
}

export function installErrorHandler(): void {
	for (const level of ['error', 'warn'] as const) {
		const orig = console[level].bind(console);
		console[level] = (...args: unknown[]) => {
			push(level, args);
			orig(...args);
		};
	}
	window.addEventListener('error', (e) => report(e.error ?? e.message));
	window.addEventListener('unhandledrejection', (e) => {
		// A broken or truncated MP3: Phaser's AudioFile/WebAudioSoundManager pass callbacks to
		// decodeAudioData, but Chromium also rejects the promise it returns and nobody awaits it.
		// The loader already drops the file, so that sound stays silent like a missing one.
		if (e.reason instanceof DOMException && e.reason.name === 'EncodingError') {
			e.preventDefault();
			console.warn(`[assets] audio not decoded: ${e.reason.message}`);
			return;
		}
		report(e.reason);
	});
}

/** How long a lost WebGL context may stay lost before the player is told. */
const CONTEXT_LOST_MS = 5000;

/**
 * A lost WebGL context (GPU crash, driver reset) usually comes back on its own and Phaser
 * restores it; when it does not (Chromium turns the GPU off after repeated crashes), the canvas
 * freezes while the game keeps running, so after a while the player gets the reload overlay.
 */
export function watchContextLoss(game: Phaser.Game): void {
	game.events.once(Phaser.Core.Events.READY, () => {
		const renderer = game.renderer;
		if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
		let timer = 0;
		const check = (): void => {
			if (!renderer.contextLost) return;
			// A hidden window may only get its context back once it is shown again.
			if (document.hidden) timer = window.setTimeout(check, CONTEXT_LOST_MS);
			else showOverlay(t('error.gpuTitle'), t('error.gpuBody'), true, restartApp);
		};
		renderer.on(Phaser.Renderer.Events.LOSE_WEBGL, () => {
			push('warn', ['WebGL context lost']);
			window.clearTimeout(timer);
			timer = window.setTimeout(check, CONTEXT_LOST_MS);
		});
		renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, () => {
			push('warn', ['WebGL context restored']);
			window.clearTimeout(timer);
		});
	});
}

/** WebGL 1 or 2 available? The renderer, filters and glows need it (R2.2). */
export function hasWebGL(): boolean {
	try {
		const c = document.createElement('canvas');
		return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
	} catch {
		return false;
	}
}
