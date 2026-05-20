import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { materializeRemoteAssets, validateNoCommandCollisions } from '../../src/output/assets.js';

describe('materializeRemoteAssets', () => {
  it('writes generated assets to owned paths', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-output-'));

    await materializeRemoteAssets(dir, {
      rules: [
        {
          kind: 'rule',
          remotePath: '.claude/rules/typescript/strict.md',
          relativeOutputPath: 'typescript/strict.md',
          content: 'Use strict TypeScript.\n',
        },
      ],
      commands: [
        {
          kind: 'command',
          remotePath: '.claude/commands/testing/test.md',
          relativeOutputPath: 'testing/test.md',
          commandName: 'test',
          content: 'Run tests.\n',
        },
      ],
      skills: [
        {
          kind: 'skill',
          remotePath: '.claude/skills/review/SKILL.md',
          relativeOutputPath: 'remote-review/SKILL.md',
          name: 'review',
          generatedName: 'remote-review',
          files: [
            {
              remotePath: '.claude/skills/review/SKILL.md',
              relativeOutputPath: 'remote-review/SKILL.md',
              content: '---\nname: review\n---\nReview code.\n',
            },
          ],
        },
      ],
      settings: { remotePath: '.claude/settings.json', value: { permissions: { allow: ['Bash(npm test)'] } } },
      hooks: { remotePath: '.claude/hooks.json', value: { hooks: { SessionStart: [] } } },
      skipped: [],
    });

    await expect(readFile(join(dir, '.claude/rules/remote/typescript/strict.md'), 'utf8')).resolves.toBe(
      'Use strict TypeScript.\n',
    );
    await expect(readFile(join(dir, '.claude/commands/remote/testing/test.md'), 'utf8')).resolves.toBe('Run tests.\n');
    await expect(readFile(join(dir, '.claude/skills/remote-review/SKILL.md'), 'utf8')).resolves.toContain(
      'Review code.',
    );
    await expect(readFile(join(dir, '.claude/settings.local.json'), 'utf8')).resolves.toContain('npm test');
    await expect(readFile(join(dir, '.claude/hooks.local.json'), 'utf8')).resolves.toContain('SessionStart');
  });

  it('cleans stale generated output before writing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-output-'));
    await mkdir(join(dir, '.claude/rules/remote/old'), { recursive: true });
    await writeFile(join(dir, '.claude/rules/remote/old/stale.md'), 'stale');

    await materializeRemoteAssets(dir, {
      rules: [],
      commands: [],
      skills: [],
      skipped: [],
    });

    await expect(readFile(join(dir, '.claude/rules/remote/old/stale.md'), 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});

describe('validateNoCommandCollisions', () => {
  it('rejects generated command names that collide with local commands', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-output-'));
    await mkdir(join(dir, '.claude/commands'), { recursive: true });
    await writeFile(join(dir, '.claude/commands/test.md'), 'local');

    await expect(
      validateNoCommandCollisions(dir, [
        {
          kind: 'command',
          remotePath: '.claude/commands/remote/test.md',
          relativeOutputPath: 'remote/test.md',
          commandName: 'test',
          content: 'remote',
        },
      ]),
    ).rejects.toThrow(/command collision.*test/);
  });
});
