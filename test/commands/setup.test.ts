import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { setupProject } from '../../src/commands/setup.js';

describe('setupProject', () => {
  it('does not overwrite existing .claude/CLAUDE.md', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-setup-'));
    await mkdir(join(dir, '.claude'), { recursive: true });
    await writeFile(join(dir, '.claude/CLAUDE.md'), 'human content');

    await setupProject({ projectDir: dir, remote: '../rules', ref: 'v1.0.0', profile: 'node-service' });

    await expect(readFile(join(dir, '.claude/CLAUDE.md'), 'utf8')).resolves.toBe('human content');
    await expect(readFile(join(dir, '.claude-remote-config.yml'), 'utf8')).resolves.toContain('profile: node-service');
  });
});
