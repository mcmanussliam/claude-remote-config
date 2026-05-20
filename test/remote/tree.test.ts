import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverRemoteTree } from '../../src/remote/tree.js';
import type { ProjectFacts } from '../../src/remote/requires.js';

const typescriptProject: ProjectFacts = {
  files: new Set(['package.json', 'tsconfig.json', 'vitest.config.ts']),
  packageJson: {
    dependencies: { typescript: '5.0.0' },
    devDependencies: { vitest: '2.1.9' },
  },
};

async function write(path: string, content: string): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
}

describe('discoverRemoteTree', () => {
  it('discovers assets from passing directories', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-tree-'));

    await write(
      join(dir, '.claude/index.json'),
      JSON.stringify({ schema: 'claude-remote-config/v2' }),
    );
    await write(
      join(dir, '.claude/rules/typescript/index.json'),
      JSON.stringify({ requires: { filesAll: ['tsconfig.json'] }, tags: ['language:typescript'] }),
    );
    await write(join(dir, '.claude/rules/typescript/strict.md'), 'Use strict TypeScript.');
    await write(join(dir, '.claude/commands/testing/test.md'), 'Run tests.');
    await write(join(dir, '.claude/skills/review/SKILL.md'), '---\nname: review\n---\nReview code.');
    await write(join(dir, '.claude/settings.json'), '{ "permissions": { "allow": ["Bash(npm test)"] } }');
    await write(join(dir, '.claude/hooks.json'), '{ "hooks": { "SessionStart": [] } }');

    const result = await discoverRemoteTree(dir, { tags: [], project: typescriptProject });

    expect(result.rules.map((rule) => rule.remotePath)).toEqual(['.claude/rules/typescript/strict.md']);
    expect(result.commands.map((command) => command.remotePath)).toEqual(['.claude/commands/testing/test.md']);
    expect(result.skills.map((skill) => skill.name)).toEqual(['review']);
    expect(result.settings?.remotePath).toBe('.claude/settings.json');
    expect(result.hooks?.remotePath).toBe('.claude/hooks.json');
    expect(result.skipped).toEqual([]);
  });

  it('does not descend into failing directories', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-tree-'));

    await write(join(dir, '.claude/index.json'), JSON.stringify({ schema: 'claude-remote-config/v2' }));
    await write(
      join(dir, '.claude/rules/python/index.json'),
      JSON.stringify({ requires: { filesAll: ['pyproject.toml'] } }),
    );
    await write(join(dir, '.claude/rules/python/style.md'), 'Use Python style.');

    const result = await discoverRemoteTree(dir, { tags: [], project: typescriptProject });

    expect(result.rules).toEqual([]);
    expect(result.skipped).toEqual([
      {
        path: '.claude/rules/python',
        reason: 'missing required file: pyproject.toml',
      },
    ]);
  });

  it('filters tagged directories when project tags are provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-tree-'));

    await write(join(dir, '.claude/index.json'), JSON.stringify({ schema: 'claude-remote-config/v2' }));
    await write(join(dir, '.claude/rules/security/index.json'), JSON.stringify({ tags: ['concern:security'] }));
    await write(join(dir, '.claude/rules/testing/index.json'), JSON.stringify({ tags: ['concern:testing'] }));
    await write(join(dir, '.claude/rules/security/secrets.md'), 'Do not leak secrets.');
    await write(join(dir, '.claude/rules/testing/tests.md'), 'Write tests.');

    const result = await discoverRemoteTree(dir, { tags: ['concern:security'], project: typescriptProject });

    expect(result.rules.map((rule) => rule.remotePath)).toEqual(['.claude/rules/security/secrets.md']);
    expect(result.skipped).toContainEqual({
      path: '.claude/rules/testing',
      reason: 'tags did not match: concern:testing',
    });
  });

  it('evaluates child directory tags independently from parent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-tree-'));

    await write(join(dir, '.claude/index.json'), JSON.stringify({ schema: 'claude-remote-config/v2' }));
    await write(join(dir, '.claude/rules/typescript/index.json'), JSON.stringify({ tags: ['language:typescript'] }));
    await write(join(dir, '.claude/rules/typescript/strict.md'), 'Use strict TypeScript.');
    await write(
      join(dir, '.claude/rules/typescript/vitest/index.json'),
      JSON.stringify({ tags: ['framework:vitest'], requires: { filesAny: ['vitest.config.ts'] } }),
    );
    await write(join(dir, '.claude/rules/typescript/vitest/testing.md'), 'Write Vitest tests.');

    // Only language:typescript is in manifest tags — framework:vitest is not, so child is skipped
    const result = await discoverRemoteTree(dir, { tags: ['language:typescript'], project: typescriptProject });

    expect(result.rules.map((r) => r.remotePath)).toEqual(['.claude/rules/typescript/strict.md']);
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ path: '.claude/rules/typescript/vitest', reason: expect.stringMatching(/tags did not match/) }),
    );
  });
});
