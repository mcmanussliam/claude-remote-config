import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { setupProject } from '../../src/commands/setup.js';

describe('setupProject', () => {
  it('creates the manifest and gitignore without writing .claude/CLAUDE.md', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-setup-'));

    await setupProject({ projectDir: dir, remote: '../rules' });

    const manifest = await readFile(join(dir, '.claude-remote-config.yml'), 'utf8');
    expect(manifest).toContain('remote: ../rules');
    expect(manifest).not.toContain('profile');
    await expect(readFile(join(dir, '.gitignore'), 'utf8')).resolves.toContain('# claude-remote-config generated files');
    await expect(readFile(join(dir, '.claude/CLAUDE.md'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('includes ref in manifest when provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-setup-'));

    await setupProject({ projectDir: dir, remote: '../rules', ref: 'v2.0.0' });

    await expect(readFile(join(dir, '.claude-remote-config.yml'), 'utf8')).resolves.toContain('ref: v2.0.0');
  });

  it('does not overwrite existing .claude/CLAUDE.md', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-setup-'));
    await mkdir(join(dir, '.claude'), { recursive: true });
    await writeFile(join(dir, '.claude/CLAUDE.md'), 'human content');

    await setupProject({ projectDir: dir, remote: '../rules' });

    await expect(readFile(join(dir, '.claude/CLAUDE.md'), 'utf8')).resolves.toBe('human content');
  });
});
