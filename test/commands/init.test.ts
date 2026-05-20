import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { initProject } from '../../src/commands/init.js';

vi.mock('../../src/remote/git.js', () => ({
  syncRemote: vi.fn(async ({ remote }: { remote: string }) => ({
    sourceDir: remote,
    resolvedCommit: 'abc1234567890000',
  })),
}));

async function write(path: string, content: string): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
}

describe('initProject', () => {
  it('syncs selected claude tree assets from a local remote', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'claude-remote-project-'));
    const remoteDir = await mkdtemp(join(tmpdir(), 'claude-remote-source-'));
    const pluginDataDir = await mkdtemp(join(tmpdir(), 'claude-remote-data-'));

    await write(
      join(projectDir, '.claude-remote-config.json'),
      JSON.stringify({
        remote: remoteDir,
        output: {
          rules: true,
          commands: true,
          skills: true,
          settingsLocal: true,
          hooksLocal: true,
        },
        tags: [],
      }),
    );
    await write(join(projectDir, 'tsconfig.json'), '{}');
    await write(join(projectDir, 'package.json'), JSON.stringify({ devDependencies: { vitest: '2.1.9' } }));

    await write(join(remoteDir, '.claude/.index.json'), JSON.stringify({ schema: 'claude-remote-config/v2' }));
    await write(
      join(remoteDir, '.claude/rules/typescript/.index.json'),
      JSON.stringify({ requires: { filesAll: ['tsconfig.json'] } }),
    );
    await write(join(remoteDir, '.claude/rules/typescript/strict.md'), 'Use strict TypeScript.\n');
    await write(join(remoteDir, '.claude/commands/testing/test.md'), 'Run tests.\n');
    await write(join(remoteDir, '.claude/skills/review/SKILL.md'), 'Review code.\n');
    await write(join(remoteDir, '.claude/settings.json'), JSON.stringify({ permissions: { allow: ['Bash(npm test)'] } }));
    await write(join(remoteDir, '.claude/hooks.json'), JSON.stringify({ hooks: { SessionStart: [] } }));

    const result = await initProject({ projectDir, pluginDataDir });

    expect(result.manifest?.remote).toBe(remoteDir);
    await expect(readFile(join(projectDir, '.claude/rules/remote/typescript/strict.md'), 'utf8')).resolves.toContain(
      'strict TypeScript',
    );
    await expect(readFile(join(projectDir, '.claude/commands/remote/testing/test.md'), 'utf8')).resolves.toContain(
      'Run tests',
    );
    await expect(readFile(join(projectDir, '.claude/skills/remote-review/SKILL.md'), 'utf8')).resolves.toContain(
      'Review code',
    );
    await expect(readFile(join(projectDir, '.claude/settings.local.json'), 'utf8')).resolves.toContain('npm test');
    await expect(readFile(join(projectDir, '.claude/hooks.local.json'), 'utf8')).resolves.toContain('SessionStart');
  });
});
