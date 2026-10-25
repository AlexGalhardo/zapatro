// Screen QA: screenshots of the main screens on the phones and monitors our players use
// (scripts/lib/devices.ts), through scripts/shot.ts. Needs `bun run dev` on --url.
// Usage: bun scripts/qa-devices.ts --set mobile|desktop [--url http://localhost:5191]
//        [--out qa-devices] [--only id,id] [screen…]
//        (default screens: menu settings controls table signals pause)
// Output: <out>/<set>/<device>/<screen>-<css w>x<css h>.png + <out>/<set>/index.md.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { computeView } from '../src/logic/viewport';
import { BR_PHONES, STEAM_DISPLAYS } from './lib/devices';

const args = process.argv.slice(2);
const opt = (name: string, d: string) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const set = opt('set', 'mobile');
const url = opt('url', 'http://localhost:5191');
const out = `${opt('out', 'qa-devices')}/${set}`;
const only = opt('only', '');
const screens = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const want = screens.length
	? screens
	: ['menu', 'settings', 'controls', 'table', 'signals', 'pause'];
const devices = (set === 'desktop' ? STEAM_DISPLAYS : BR_PHONES).filter(
	(d) => !only || only.split(',').includes(d.id),
);

mkdirSync(out, { recursive: true });
const rows: string[] = [];
let failed = 0;
for (const d of devices) {
	const cssW = Math.round(d.w / d.dpr);
	const cssH = Math.round(d.h / d.dpr);
	const view = computeView(d.w, d.h);
	const r = spawnSync(
		'bun',
		[
			'scripts/shot.ts',
			'--url',
			url,
			'--out',
			`${out}/${d.id}`,
			'--size',
			`${cssW}x${cssH}`,
			'--dpr',
			String(d.dpr),
			...(d.mobile ? ['--mobile'] : []),
			...want,
		],
		{ encoding: 'utf-8' },
	);
	const ok = r.status === 0 && r.stdout.includes('no console errors');
	if (!ok) failed++;
	const logical = `${Math.round(view.width)}×${Math.round(view.height)}`;
	const line = `| ${d.name} | ${d.w}×${d.h} | ${cssW}×${cssH} @${d.dpr} | ×${view.zoom} → ${logical} | ${ok ? 'ok' : 'FAIL'} |`;
	rows.push(line);
	console.log(line);
	if (!ok) console.log(r.stdout.slice(-800), r.stderr.slice(-800));
}
writeFileSync(
	`${out}/index.md`,
	`| Tela | Pixels físicos | Viewport CSS | Zoom → área lógica | Resultado |\n|---|---|---|---|---|\n${rows.join('\n')}\n`,
);
process.exit(failed ? 1 : 0);
