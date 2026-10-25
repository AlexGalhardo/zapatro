// App icons for web (favicon), Electron and Capacitor from the flat club-and-lightning vector
// (art-src/app-icon.svg, 1024²), rendered at each size.
// After running: `bun run --cwd mobile assets` spreads the Android sizes.
import sharp from 'sharp';

const SRC = 'art-src/app-icon.svg';
// Splash background = the game's flat neutral (PALETTE.bgNeutral, Art Bible v2).
const BG = '#2B2B2B';
const icon = (size: number) => sharp(SRC, { density: 288 }).resize(size, size).png();

async function write(file: string, size: number): Promise<void> {
	await icon(size).toFile(file);
	console.log(`${file} (${size}px)`);
}

/** Icon centred on a plain background (splash screens). */
async function onBackground(file: string, size: number, iconSize: number): Promise<void> {
	await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
		.composite([{ input: await icon(iconSize).toBuffer() }])
		.png()
		.toFile(file);
	console.log(`${file} (${size}px)`);
}

await write('public/favicon.png', 64);
await write('desktop/build/icon.png', 512);
await write('mobile/assets/icon-only.png', 1024);
await write('mobile/assets/play-store-icon-512.png', 512);
// Adaptive icon: the art is full-bleed, so it is the background layer (the launcher crops the
// outer third) and the foreground stays empty.
await write('mobile/assets/icon-background.png', 1024);
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#00000000' } })
	.png()
	.toFile('mobile/assets/icon-foreground.png');
console.log('mobile/assets/icon-foreground.png (1024px)');
for (const file of ['mobile/assets/splash.png', 'mobile/assets/splash-dark.png'])
	await onBackground(file, 2732, 512);
