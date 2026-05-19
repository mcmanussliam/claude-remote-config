import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { doctorProject } from '../../src/commands/doctor.js';

describe('doctorProject', () => {
  it('reports missing manifest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-doctor-'));
    const out = await doctorProject(dir);
    expect(out).toContain('missing .claude-remote-config.yml');
  });

  it('reports present manifest and missing generated files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-doctor-'));
    await writeFile(
      join(dir, '.claude-remote-config.yml'),
      'remote: ../rules\n'
    );
    const out = await doctorProject(dir);
    expect(out).toContain('manifest: ok (../rules)');
    expect(out).toContain('lockfile: missing');
    expect(out).toContain('generated memory: missing');
  });

  it('reports present lockfile and generated memory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'claude-remote-config-doctor-'));
    await writeFile(
      join(dir, '.claude-remote-config.yml'),
      'remote: ../rules\n'
    );
    await writeFile(join(dir, '.claude-remote-config.lock.yml'), 'remote: ../rules\n');
    await mkdir(join(dir, '.claude-remote-config/generated'), { recursive: true });
    await writeFile(join(dir, '.claude-remote-config/generated/CLAUDE.md'), '# Generated\n');

    const out = await doctorProject(dir);
    expect(out).toContain('lockfile: present');
    expect(out).toContain('generated memory: present');
  });
});
