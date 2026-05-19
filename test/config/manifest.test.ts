import { describe, expect, it } from 'vitest';
import { parseManifest } from '../../src/config/manifest.js';

describe('parseManifest', () => {
  it('parses the MVP manifest shape with defaults', () => {
    const manifest = parseManifest(`
remote: ../rules
ref: v1.0.0
output:
  memory: true
  rules: true
  settings_local: true
params:
  package_manager: pnpm
include:
  tags:
    - concern:security
exclude:
  rules:
    - testing.playwright
`);

    expect(manifest.remote).toBe('../rules');
    expect(manifest.ref).toBe('v1.0.0');
    expect(manifest.output.settings_local).toBe(true);
    expect(manifest.params.package_manager).toBe('pnpm');
    expect(manifest.include.tags).toEqual(['concern:security']);
    expect(manifest.exclude.rules).toEqual(['testing.playwright']);
  });

  it('parses manifest without ref (defaults to origin/HEAD)', () => {
    const manifest = parseManifest('remote: ../rules\n');
    expect(manifest.remote).toBe('../rules');
    expect(manifest.ref).toBeUndefined();
  });

  it('rejects unrecognised output fields', () => {
    expect(() =>
      parseManifest('remote: ../rules\noutput:\n  mcp_local: true\n')
    ).toThrow();
  });
});
