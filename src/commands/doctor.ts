import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { loadManifest } from '../config/manifest.js';
import { PROJECT_FILES } from '../config/paths.js';

export async function doctorProject(projectDir: string): Promise<string> {
  const manifest = await loadManifest(projectDir);

  if (!manifest) {
    return `claude-remote-config doctor: missing ${PROJECT_FILES.manifest}\n`;
  }

  const checks: string[] = [`manifest: ok (${manifest.profile})`];

  const [gitignoreExists, lockfileExists, generatedMemoryExists] = await Promise.all([
    exists(join(projectDir, PROJECT_FILES.gitignore)),
    exists(join(projectDir, PROJECT_FILES.lockfile)),
    exists(join(projectDir, PROJECT_FILES.generatedMemory)),
  ]);

  checks.push(
    gitignoreExists ? 'gitignore: present' : 'gitignore: missing',
    lockfileExists ? 'lockfile: present' : 'lockfile: missing',
    generatedMemoryExists ? 'generated memory: present' : 'generated memory: missing',
  );

  return `claude-remote-config doctor\n${checks.join('\n')}\n`;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
