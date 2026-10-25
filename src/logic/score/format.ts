/**
 * Points on screen (D-56): grouped below 1e6 (`12.345`), abbreviated up to 1e15 (`1,2M`, `3,4B`,
 * `5,6T`), scientific above (`1,2e15`). Plain `number`, no BigInt.
 */
const UNITS: [number, string][] = [
	[1e12, 'T'],
	[1e9, 'B'],
	[1e6, 'M'],
];

export function formatPoints(n: number, locale: string): string {
	if (!Number.isFinite(n)) return '∞';
	const one = (x: number): string =>
		x.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 0 });
	const abs = Math.abs(n);
	if (abs >= 1e15) {
		const exp = Math.floor(Math.log10(abs));
		return `${one(n / 10 ** exp)}e${exp}`;
	}
	for (const [size, unit] of UNITS)
		if (abs >= size) return `${one(Math.floor((n / size) * 10) / 10)}${unit}`;
	return Math.round(n).toLocaleString(locale);
}
