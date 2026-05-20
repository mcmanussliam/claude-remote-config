import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { doctorProject } from '../../src/commands/doctor.js';

describe('doctorProject', () => {
  it('reports missing manifest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-doctor-'));
    const out = await doctorProject(dir);
    expect(out).toContain('missing .claude-remote-config.json');
  });

  it('reports present manifest and missing generated files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-doctor-'));
    await writeFile(
      join(dir, '.claude-remote-config.json'),
      JSON.stringify({
        remote: '../rules',
        output: { rules: true, commands: false, skills: false, settingsLocal: false, hooksLocal: false },
        tags: [],
      }),
    );
    const out = await doctorProject(dir);
    expect(out).toContain('manifest: ok (../rules)');
    expect(out).toContain('generated rules: missing');
    expect(out).toContain('generated commands: missing');
    expect(out).toContain('generated skills: missing');
  });

  it('reports present generated rules', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-doctor-'));
    await writeFile(
      join(dir, '.claude-remote-config.json'),
      JSON.stringify({
        remote: '../rules',
        output: { rules: true, commands: false, skills: false, settingsLocal: false, hooksLocal: false },
        tags: [],
      }),
    );
    await mkdir(join(dir, '.claude/rules/remote'), { recursive: true });
    await writeFile(join(dir, '.claude/rules/remote/strict.md'), '# Generated\n');

    const out = await doctorProject(dir);
    expect(out).toContain('generated rules: present');
    expect(out).toContain('generated commands: missing');
    expect(out).toContain('generated skills: missing');
  });
});
