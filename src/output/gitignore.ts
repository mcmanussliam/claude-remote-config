import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PROJECT_FILES } from '../config/paths.js';

export const gitignoreBlock = `# claude-remote-config generated files
${PROJECT_FILES.generatedMemoryDir}/
${PROJECT_FILES.generatedCacheDir}/
${PROJECT_FILES.generatedRulesDir}/

# claude-remote-config generated local Claude Code config
${PROJECT_FILES.settingsLocal}
${PROJECT_FILES.mcpLocal}
${PROJECT_FILES.agentsLocalDir}/
${PROJECT_FILES.hooksLocal}`;

export async function ensureGitignoreEntries(projectDir: string): Promise<boolean> {
  const path = join(projectDir, PROJECT_FILES.gitignore);
  let existing = '';

  try {
    existing = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  if (existing.includes('# claude-remote-config generated files')) {
    return false;
  }

  const separator = existing.length && !existing.endsWith('\n') ? '\n\n' : existing.length ? '\n' : '';
  await writeFile(path, `${existing}${separator}${gitignoreBlock}\n`);

  return true;
}
