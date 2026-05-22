import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import fg from 'fast-glob';

import { PROJECT_FILES } from '../config/paths.js';
import type { RemoteCommandAsset, RemoteTreeSelection } from '../remote/assets.js';

async function writeAsset(dest: string, content: string): Promise<void> {
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, content);
}

export async function materializeRemoteAssets(projectDir: string, selection: RemoteTreeSelection): Promise<void> {
  await Promise.all([
    rm(join(projectDir, PROJECT_FILES.generatedRulesDir), { recursive: true, force: true }),
    rm(join(projectDir, PROJECT_FILES.generatedCommandsDir), { recursive: true, force: true }),
    cleanGeneratedSkills(projectDir),
  ]);

  function writeMap<T>(array: T[], acc: (item: T) => Parameters<typeof writeAsset>): Promise<void>[] {
    return array.map((item) => writeAsset(...acc(item)));
  }

  const rules$ = writeMap(selection.rules, (rule) => [
    join(projectDir, PROJECT_FILES.generatedRulesDir, rule.relativeOutputPath),
    rule.content,
  ]);

  const commands$ = writeMap(selection.commands, (command) => [
    join(projectDir, PROJECT_FILES.generatedCommandsDir, command.relativeOutputPath),
    command.content,
  ]);

  const skills$ = selection.skills.flatMap((skill) =>
    writeMap(skill.files, (file) => [join(projectDir, PROJECT_FILES.skillsDir, file.relativeOutputPath), file.content]),
  );

  const settings$ = selection.settings
    ? [
        writeAsset(
          join(projectDir, PROJECT_FILES.settingsLocal),
          `${JSON.stringify(selection.settings.value, null, 2)}\n`,
        ),
      ]
    : [];

  const hooks$ = selection.hooks
    ? [writeAsset(join(projectDir, PROJECT_FILES.hooksLocal), `${JSON.stringify(selection.hooks.value, null, 2)}\n`)]
    : [];

  await Promise.all([...rules$, ...commands$, ...skills$, ...settings$, ...hooks$]);
}

async function cleanGeneratedSkills(projectDir: string): Promise<void> {
  const skillsDir = join(projectDir, PROJECT_FILES.skillsDir);
  const entries = await readdir(skillsDir).catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'ENOENT') {
      return null;
    }

    throw err;
  });

  if (!entries) {
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.startsWith('remote-'))
      .map((entry) => rm(join(skillsDir, entry), { recursive: true, force: true })),
  );
}

export async function validateNoCommandCollisions(projectDir: string, commands: RemoteCommandAsset[]): Promise<void> {
  const commandsDir = join(projectDir, PROJECT_FILES.commandsDir);

  const localCommandFiles = await fg('**/*.md', {
    cwd: commandsDir,
    onlyFiles: true,
    ignore: ['remote/**'],
  }).catch(() => [] as string[]);

  const localCommandNames = new Set(localCommandFiles.map((file) => basename(file, '.md')));

  for (const command of commands) {
    if (!localCommandNames.has(command.commandName)) {
      continue;
    }

    throw new Error(`command collision: generated command "${command.commandName}" conflicts with local command`);
  }
}
