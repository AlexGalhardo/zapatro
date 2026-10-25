import { PALETTE, toCss } from '../config/palette';
import { t } from '../i18n';
import { isTouchDevice } from '../ui/touch';
import { isElectron } from './platform';

/**
 * "Rotate your phone" (web build): the game is a 16:9 landscape stage, so a touch device held
 * upright gets a plain DOM card over the canvas until it is turned. The game keeps running under
 * it. Never on desktop or in Electron, nor on a portrait window without touch.
 */
export function installRotateHint(): void {
	if (isElectron() || !isTouchDevice()) return;
	let box: HTMLDivElement | null = null;
	const update = (): void => {
		const portrait = window.innerHeight > window.innerWidth;
		if (!portrait) {
			box?.remove();
			box = null;
			return;
		}
		if (box) return;
		box = card();
		document.body.append(box);
	};
	window.addEventListener('resize', update);
	window.addEventListener('orientationchange', update);
	update();
}

function card(): HTMLDivElement {
	const box = document.createElement('div');
	box.setAttribute('role', 'alert');
	box.dataset.rotateHint = '';
	// Under the error overlay (z-index 10), over the canvas.
	box.style.cssText = `position:fixed;inset:0;z-index:9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;background:${toCss(PALETTE.bgNeutral)};font-family:"Rubik","Segoe UI",sans-serif`;
	const cream = toCss(PALETTE.textLight);
	const gold = toCss(PALETTE.manilha);
	// A phone outline turning a quarter turn (still with prefers-reduced-motion).
	box.innerHTML = `<style>@keyframes zp-rotate{0%,25%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}.zp-phone{animation:zp-rotate 1.8s ease-in-out infinite alternate}@media (prefers-reduced-motion:reduce){.zp-phone{animation:none;transform:rotate(-90deg)}}</style><svg class="zp-phone" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><rect x="18" y="4" width="28" height="56" rx="5" fill="none" stroke="${cream}" stroke-width="4"/><rect x="28" y="51" width="8" height="3" rx="1.5" fill="${gold}"/></svg>`;
	const h = document.createElement('h2');
	h.textContent = t('orient.title');
	h.style.cssText = `margin:0;font-size:24px;font-weight:700;color:${gold}`;
	const p = document.createElement('p');
	p.textContent = t('orient.body');
	p.style.cssText = `margin:0;max-width:280px;font-size:16px;font-weight:500;line-height:1.4;color:${cream}`;
	box.append(h, p);
	return box;
}
