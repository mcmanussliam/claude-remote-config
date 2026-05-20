import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ensureGitignoreEntries } from '../../src/output/gitignore.js';

describe('ensureGitignoreEntries', () => {
  it('appends the block to an empty .gitignore', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-gitignore-'));
    const added = await ensureGitignoreEntries(dir);
    expect(added).toBe(true);
    const content = await readFile(join(dir, '.gitignore'), 'utf8');
    expect(content).toContain('# claude-remote-config generated files');
    expect(content).toContain('.claude/commands/remote/');
    expect(content).toContain('.claude/skills/remote-*/');
  });

  it('appends to an existing .gitignore without duplicating', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-gitignore-'));
    const { writeFile } = await import('node:fs/promises');
    await writeFile(join(dir, '.gitignore'), '*.log\n');

    await ensureGitignoreEntries(dir);
    const content = await readFile(join(dir, '.gitignore'), 'utf8');
    expect(content).toContain('*.log');
    expect(content).toContain('# claude-remote-config generated files');
  });

  it('is idempotent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-gitignore-'));
    await ensureGitignoreEntries(dir);
    const second = await ensureGitignoreEntries(dir);
    expect(second).toBe(false);
    const content = await readFile(join(dir, '.gitignore'), 'utf8');
    expect(content.split('# claude-remote-config generated files').length - 1).toBe(1);
  });
});
