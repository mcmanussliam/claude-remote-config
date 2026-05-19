import { describe, expect, it } from 'vitest';
import { buildLockfile, assertFrozenLockfile } from '../../src/output/lockfile.js';

const baseInput = {
  remote: 'git@example.com:org/rules.git',
  requestedRef: 'v1.0.0',
  resolvedCommit: 'abcdef1234567890',
  profile: 'node-service',
  memory: [{ source: 'memory/base.md' }],
  rules: [{ id: 'repo.hygiene', version: '1.0.0', source: 'rules/hygiene.md' }],
  settingsLocal: []
};

describe('lockfile', () => {
  it('builds a lockfile with all expected fields', () => {
    const out = buildLockfile({ ...baseInput, generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(out).toContain('remote: git@example.com:org/rules.git');
    expect(out).toContain('resolved_commit: abcdef1234567890');
    expect(out).toContain('generated_at:');
    expect(out).toContain('repo.hygiene');
  });

  it('passes frozen check when only generated_at differs', () => {
    const a = buildLockfile({ ...baseInput, generatedAt: '2026-01-01T00:00:00.000Z' });
    const b = buildLockfile({ ...baseInput, generatedAt: '2026-06-01T12:00:00.000Z' });
    expect(() => assertFrozenLockfile(a, b)).not.toThrow();
  });

  it('fails frozen check when resolved commit changes', () => {
    const a = buildLockfile({ ...baseInput, generatedAt: '2026-01-01T00:00:00.000Z' });
    const b = buildLockfile({ ...baseInput, resolvedCommit: 'deadbeef', generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(() => assertFrozenLockfile(a, b)).toThrow(/frozen lockfile/i);
  });

  it('fails frozen check when existing lockfile is null', () => {
    const b = buildLockfile({ ...baseInput, generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(() => assertFrozenLockfile(null, b)).toThrow(/frozen lockfile/i);
  });
});
