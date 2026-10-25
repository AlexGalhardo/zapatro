/**
 * Android versionCode from the SemVer in package.json. Google Play only accepts increasing codes,
 * so every release candidate sorts below its final version: 1.2.3-rc.4 → 1020304, 1.2.3 → 1020399.
 */
export function versionCode(version: string): number {
	const m = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-[a-z]+\.(\d+))?/);
	if (!m) throw new Error(`not a SemVer version: ${version}`);
	const [major, minor, patch] = [m[1], m[2], m[3]].map(Number) as [number, number, number];
	const pre = m[4] === undefined ? 99 : Number(m[4]);
	if (minor > 99 || patch > 99 || (m[4] !== undefined && pre > 98))
		throw new Error(`out of range: ${version}`);
	return major * 1_000_000 + minor * 10_000 + patch * 100 + pre;
}
