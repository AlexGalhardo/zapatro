import { expect, test } from 'bun:test';

// flat.ts reads the screen at load (its raster scale); a bare stand-in is enough here.
(globalThis as { window?: unknown }).window ??= { devicePixelRatio: 1 };
const { parseTiltedKey, tiltedKey, tiltedSize } = await import('../src/art/flat');

test('a rotated card key splits back into its card key and angle', () => {
	for (const [key, deg] of [
		['card.raio', -8],
		['card.4.diamonds', 8],
		['card.7.hearts.z', -4],
	] as const)
		expect(parseTiltedKey(tiltedKey(key, deg))).toEqual({ key, deg });
	expect(parseTiltedKey('card.4.diamonds')).toBeNull();
	expect(parseTiltedKey('portrait.ze.neutral')).toBeNull();
	// Turning a card makes its box wider; no turn keeps the card's own size.
	expect(tiltedSize('card.raio', 0)).toEqual([48, 64]);
	expect(tiltedSize('card.raio', 8)[0]).toBeGreaterThan(48);
});
