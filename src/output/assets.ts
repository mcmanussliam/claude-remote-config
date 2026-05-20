import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import fg from 'fast-glob';

import { PROJECT_FILES } from '../config/paths.js';
import type { RemoteCommandAsset, RemoteTreeSelection } from '../remote/assets.js';

export async function materializeRemoteAssets(projectDir: string, selection: RemoteTreeSelection): Promise<void> {
  // Clean stale generated rules and commands
  await rm(join(projectDir, PROJECT_FILES.generatedRulesDir), { recursive: true, force: true });
  await rm(join(projectDir, PROJECT_FILES.generatedCommandsDir), { recursive: true, force: true });

  // Clean stale generated skills (directories starting with remote-)
  await cleanGeneratedSkills(projectDir);

  // Write rules
  for (const rule of selection.rules) {
    const dest = join(projectDir, PROJECT_FILES.generatedRulesDir, rule.relativeOutputPath);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, rule.content);
  }

  // Write commands
  for (const command of selection.commands) {
    const dest = join(projectDir, PROJECT_FILES.generatedCommandsDir, command.relativeOutputPath);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, command.content);
  }

  // Write skills
  for (const skill of selection.skills) {
    for (const file of skill.files) {
      const dest = join(projectDir, PROJECT_FILES.skillsDir, file.relativeOutputPath);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, file.content);
    }
  }

  // Write settings
  if (selection.settings) {
    const settingsPath = join(projectDir, PROJECT_FILES.settingsLocal);
    await mkdir(dirname(settingsPath), { recursive: true });
    await writeFile(settingsPath, `${JSON.stringify(selection.settings.value, null, 2)}\n`);
  }

  // Write hooks
  if (selection.hooks) {
    const hooksPath = join(projectDir, PROJECT_FILES.hooksLocal);
    await mkdir(dirname(hooksPath), { recursive: true });
    await writeFile(hooksPath, `${JSON.stringify(selection.hooks.value, null, 2)}\n`);
  }
}

async function cleanGeneratedSkills(projectDir: string): Promise<void> {
  const skillsDir = join(projectDir, PROJECT_FILES.skillsDir);

  let entries: string[];

  try {
    entries = await readdir(skillsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    if (entry.startsWith('remote-')) {
      await rm(join(skillsDir, entry), { recursive: true, force: true });
    }
  }
}

export async function validateNoCommandCollisions(projectDir: string, commands: RemoteCommandAsset[]): Promise<void> {
  const commandsDir = join(projectDir, PROJECT_FILES.commandsDir);

  // Scan all local command .md files excluding the remote/ subdirectory
  const localCommandFiles = await fg('**/*.md', {
    cwd: commandsDir,
    onlyFiles: true,
    ignore: ['remote/**'],
  }).catch(() => [] as string[]);

  const localCommandNames = new Set(localCommandFiles.map((file) => basename(file, '.md')));

  for (const command of commands) {
    if (localCommandNames.has(command.commandName)) {
      throw new Error(`command collision: generated command "${command.commandName}" conflicts with local command`);
    }
  }
}
