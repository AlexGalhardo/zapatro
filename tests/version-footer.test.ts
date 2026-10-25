import { expect, test } from 'bun:test';
import { buildLabel } from '../src/ui/version-footer';

test('footer shows the SemVer build, tagged in dev', () => {
	expect(buildLabel('0.1.0-alpha.1', false)).toBe('v0.1.0-alpha.1');
	expect(buildLabel('0.1.0-alpha.1', true)).toBe('v0.1.0-alpha.1 (dev)');
	expect(buildLabel('0.1.0-beta.2', false, 'playdev-1')).toBe('v0.1.0-beta.2 · playdev-1');
});
