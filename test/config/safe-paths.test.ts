import { describe, expect, it } from 'vitest';
import { assertSafeProjectWrite } from '../../src/config/safe-paths.js';

describe('safe paths', () => {
  it('allows approved generated paths', () => {
    expect(() => assertSafeProjectWrite('/repo', '/repo/.claude-remote-config/cache/something')).not.toThrow();
    expect(() => assertSafeProjectWrite('/repo', '/repo/.claude/settings.local.json')).not.toThrow();
    expect(() => assertSafeProjectWrite('/repo', '/repo/.claude/rules/remote/strict.md')).not.toThrow();
    expect(() => assertSafeProjectWrite('/repo', '/repo/.claude/commands/remote/test.md')).not.toThrow();
    expect(() => assertSafeProjectWrite('/repo', '/repo/.claude/skills/remote-review/SKILL.md')).not.toThrow();
  });

  it('rejects traversal and shared config paths', () => {
    expect(() => assertSafeProjectWrite('/repo', '/repo/.claude/settings.json')).toThrow(/not an approved/);
    expect(() => assertSafeProjectWrite('/repo', '/repo/../outside/file')).toThrow(/outside project/);
  });

  it('rejects writing to the project root itself', () => {
    expect(() => assertSafeProjectWrite('/repo', '/repo')).toThrow();
  });
});
