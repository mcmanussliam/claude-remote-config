import fg from 'fast-glob';

import type { ProjectFacts } from './requires.js';

export type { ProjectFacts };

export async function collectProjectFacts(projectDir: string): Promise<ProjectFacts> {
  const files = new Set(
    await fg('**/*', { cwd: projectDir, onlyFiles: true, deep: 4, dot: true, ignore: ['node_modules/**', '.git/**'] }),
  );

  return { files };
}
