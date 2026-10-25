/**
 * Light mode trigger (MOB4.4): best-selling phones in Brazil are entry-level (Galaxy A07,
 * Moto G06), so instead of guessing the device, the run watches its own frame rate and asks to
 * drop the extras (vignette, table effects) after `seconds` straight seconds below `minFps`.
 */
export class FpsGuard {
	private slow = 0;
	private acc = 0;
	private fired = false;

	constructor(
		private readonly minFps = 45,
		private readonly seconds = 5,
	) {}

	/**
	 * Feed one frame. `watch` is false outside fights or when the extras are already off.
	 * Returns true once, on the frame the budget is exhausted.
	 */
	sample(deltaMs: number, fps: number, watch: boolean): boolean {
		if (this.fired || !watch) {
			this.slow = 0;
			this.acc = 0;
			return false;
		}
		this.acc += deltaMs;
		if (this.acc < 1000) return false;
		this.acc -= 1000;
		this.slow = fps < this.minFps ? this.slow + 1 : 0;
		if (this.slow < this.seconds) return false;
		this.fired = true;
		return true;
	}
}
