import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';

import { z } from 'zod';

import { REMOTE_FILES } from '../config/paths.js';
import type {
  RemoteCommandAsset,
  RemoteJsonAsset,
  RemoteRuleAsset,
  RemoteSkillAsset,
  RemoteTreeSelection,
} from './assets.js';
import { type ProjectFacts, evaluateRequires, parseRequires } from './requires.js';

const DirectoryIndexSchema = z
  .object({
    tags: z.array(z.string()).default([]),
    requires: z.unknown().optional().transform(parseRequires),
  })
  .strict();

type DirectoryIndex = z.infer<typeof DirectoryIndexSchema>;

interface DiscoverRemoteTreeInput {
  tags: string[];
  project: ProjectFacts;
}

export async function discoverRemoteTree(
  remoteDir: string,
  input: DiscoverRemoteTreeInput,
): Promise<RemoteTreeSelection> {
  const rules: RemoteRuleAsset[] = [];
  const commands: RemoteCommandAsset[] = [];
  const skills: RemoteSkillAsset[] = [];
  const skipped: Array<{ path: string; reason: string }> = [];

  const claudeDir = join(remoteDir, REMOTE_FILES.claudeDir);

  // Discover rules
  const rulesDir = join(remoteDir, REMOTE_FILES.rulesDir);
  await walkDirectory(rulesDir, remoteDir, input, skipped, async (filePath, relDir) => {
    if (filePath.endsWith('.md')) {
      const content = await readFile(filePath, 'utf8');
      const remotePath = relative(remoteDir, filePath);
      const relativeOutputPath = relative(join(remoteDir, REMOTE_FILES.rulesDir), filePath);
      rules.push({ kind: 'rule', remotePath, relativeOutputPath, content });
    }
  });

  // Discover commands
  const commandsDir = join(remoteDir, REMOTE_FILES.commandsDir);
  await walkDirectory(commandsDir, remoteDir, input, skipped, async (filePath, relDir) => {
    if (filePath.endsWith('.md')) {
      const content = await readFile(filePath, 'utf8');
      const remotePath = relative(remoteDir, filePath);
      const relativeOutputPath = relative(join(remoteDir, REMOTE_FILES.commandsDir), filePath);
      const commandName = basename(filePath, '.md');
      commands.push({ kind: 'command', remotePath, relativeOutputPath, commandName, content });
    }
  });

  // Discover skills — immediate subdirectories of .claude/skills/ that contain SKILL.md
  const skillsDir = join(remoteDir, REMOTE_FILES.skillsDir);
  await discoverSkills(skillsDir, remoteDir, skills, skipped);

  // Discover settings and hooks
  let settings: RemoteJsonAsset | undefined;
  let hooks: RemoteJsonAsset | undefined;

  const settingsPath = join(remoteDir, REMOTE_FILES.settings);
  try {
    const content = await readFile(settingsPath, 'utf8');
    settings = { remotePath: REMOTE_FILES.settings, value: JSON.parse(content) as unknown };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const hooksPath = join(remoteDir, REMOTE_FILES.hooks);
  try {
    const content = await readFile(hooksPath, 'utf8');
    hooks = { remotePath: REMOTE_FILES.hooks, value: JSON.parse(content) as unknown };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return { rules, commands, skills, settings, hooks, skipped };
}

async function readDirectoryIndex(dir: string): Promise<DirectoryIndex | null> {
  const indexPath = join(dir, '.index.json');

  try {
    const content = await readFile(indexPath, 'utf8');
    const raw = JSON.parse(content) as unknown;
    const parsed = DirectoryIndexSchema.safeParse(raw);

    if (!parsed.success) {
      throw new Error(`Invalid .index.json at ${indexPath}: ${parsed.error.message}`);
    }

    return parsed.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function walkDirectory(
  dir: string,
  remoteDir: string,
  input: DiscoverRemoteTreeInput,
  skipped: Array<{ path: string; reason: string }>,
  onFile: (filePath: string, relDir: string) => Promise<void>,
): Promise<void> {
  let entries: string[];

  try {
    entries = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }

  for (const entry of entries.sort()) {
    if (entry === '.index.json') {
      continue;
    }

    const fullPath = join(dir, entry);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) {
      const relPath = relative(remoteDir, fullPath);
      const index = await readDirectoryIndex(fullPath);

      // Check tag filtering
      if (index?.tags?.length && input.tags.length > 0) {
        const hasMatchingTag = index.tags.some((tag) => input.tags.includes(tag));
        if (!hasMatchingTag) {
          skipped.push({ path: relPath, reason: `tags did not match: ${index.tags.join(', ')}` });
          continue;
        }
      }

      // Check requires
      if (index?.requires) {
        const result = evaluateRequires(index.requires, input.project);
        if (!result.pass) {
          skipped.push({ path: relPath, reason: result.reason ?? 'requires check failed' });
          continue;
        }
      }

      await walkDirectory(fullPath, remoteDir, input, skipped, onFile);
    } else if (fileStat.isFile()) {
      await onFile(fullPath, dir);
    }
  }
}

async function discoverSkills(
  skillsDir: string,
  remoteDir: string,
  skills: RemoteSkillAsset[],
  skipped: Array<{ path: string; reason: string }>,
): Promise<void> {
  let entries: string[];

  try {
    entries = await readdir(skillsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }

  for (const entry of entries.sort()) {
    const fullPath = join(skillsDir, entry);
    const fileStat = await stat(fullPath);

    if (!fileStat.isDirectory()) {
      continue;
    }

    const skillMdPath = join(fullPath, 'SKILL.md');

    try {
      await stat(skillMdPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    const name = entry;
    const generatedName = `remote-${name}`;
    const remotePath = relative(remoteDir, skillMdPath);
    const relativeOutputPath = `${generatedName}/SKILL.md`;

    // Collect all files in the skill directory recursively
    const files: RemoteSkillAsset['files'] = [];
    await collectSkillFiles(fullPath, fullPath, remoteDir, generatedName, files);

    skills.push({
      kind: 'skill',
      remotePath,
      relativeOutputPath,
      name,
      generatedName,
      files,
    });
  }
}

async function collectSkillFiles(
  dir: string,
  skillRoot: string,
  remoteDir: string,
  generatedName: string,
  files: RemoteSkillAsset['files'],
): Promise<void> {
  const entries = await readdir(dir);

  for (const entry of entries.sort()) {
    const fullPath = join(dir, entry);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) {
      await collectSkillFiles(fullPath, skillRoot, remoteDir, generatedName, files);
    } else if (fileStat.isFile()) {
      const content = await readFile(fullPath, 'utf8');
      const relativeToSkillRoot = relative(skillRoot, fullPath);
      files.push({
        remotePath: relative(remoteDir, fullPath),
        relativeOutputPath: `${generatedName}/${relativeToSkillRoot}`,
        content,
      });
    }
  }
}
