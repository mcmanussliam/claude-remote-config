import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { ensureGitignoreEntries } from '../output/gitignore.js';
import { PROJECT_FILES } from '../config/paths.js';
import { setupWritePath } from '../config/safe-paths.js';
import { setupManifestTemplate } from '../output/templates.js';

export interface SetupOptions {
  projectDir: string;
  remote: string;
  ref?: string;
}

export async function setupProject(options: SetupOptions): Promise<void> {
  await writeIfMissing(setupWritePath(options.projectDir, PROJECT_FILES.manifest), setupManifestTemplate(options));
  await ensureGitignoreEntries(options.projectDir);
}

async function writeIfMissing(path: string, content: string): Promise<boolean> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, { flag: 'wx' });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      return false;
    }
    throw error;
  }
}
