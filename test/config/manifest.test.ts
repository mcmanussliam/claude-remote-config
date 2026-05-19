import { describe, expect, it } from 'vitest';
import { parseManifest } from '../../src/config/manifest.js';

describe('parseManifest', () => {
  it('parses the MVP manifest shape with defaults', () => {
    const manifest = parseManifest(`
remote: ../rules
ref: v1.0.0
profile: node-service
materialize:
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
    expect(manifest.materialize.settings_local).toBe(true);
    expect(manifest.params.package_manager).toBe('pnpm');
    expect(manifest.include.tags).toEqual(['concern:security']);
    expect(manifest.exclude.rules).toEqual(['testing.playwright']);
  });

  it('rejects invalid manifests', () => {
    expect(() => parseManifest('remote: ../rules\nprofile: node-service\n')).toThrow(/ref/i);
  });

  it('rejects unrecognised materialize fields', () => {
    expect(() =>
      parseManifest('remote: ../rules\nref: v1\nprofile: p\nmaterialize:\n  mcp_local: true\n')
    ).toThrow();
  });
});
