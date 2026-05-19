import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { loadManifest, type Manifest } from '../config/manifest.js';
import { assertSafeProjectWrite, assertSafeRemoteRead } from '../config/safe-paths.js';
import { PROJECT_FILES } from '../config/paths.js';
import { syncRemote } from '../remote/git.js';
import { assertProfileListed, loadConfig, loadProfile } from '../remote/profile.js';
import { collectProjectFacts, loadRules, resolveRuleParams, selectRules, type RuleSelection } from '../remote/rules.js';
import { loadMemoryFragments } from '../remote/memory.js';
import { compileMemory, compileRule, generatedRuleFilename } from '../output/compiler.js';
import { mergeSettings, type JsonValue } from '../output/settings.js';
import { buildLockfile, assertFrozenLockfile } from '../output/lockfile.js';
import { ensureGitignoreEntries } from '../output/gitignore.js';
import { hookFallbackWarning, initSummaryTemplate } from '../output/templates.js';

export interface InitOptions {
  projectDir: string;
  pluginDataDir: string;
  /** Formats output as a Claude Code hook response instead of plain text. */
  hookMode?: boolean;
  /** Skip network fetch; use the cached remote clone. */
  offline?: boolean;
  /** Fail if the generated lockfile would differ from the committed one (for CI). */
  frozenLockfile?: boolean;
  gitignore?: boolean;
  /** Skip all file writes; used by explain and print commands. */
  dryRun?: boolean;
  verbose?: boolean;
}

export interface InitResult {
  manifest: Manifest | null;
  summary: string;
  selection?: RuleSelection;
  resolvedCommit?: string;
}

export async function initProject(options: InitOptions): Promise<InitResult> {
  const projectDir = resolve(options.projectDir);
  const pluginDataDir = resolve(options.pluginDataDir);

  const manifest = await loadManifest(projectDir);

  if (!manifest) {
    return { manifest: null, summary: '' };
  }

  try {
    return await initWithManifest({ ...options, projectDir, pluginDataDir }, manifest);
  } catch (error) {
    const hasOutput = await hasGeneratedOutput(projectDir);

    if (options.hookMode && hasOutput) {
      return {
        manifest,
        summary: hookFallbackWarning(formatError(error)),
      };
    }

    throw error;
  }
}

async function initWithManifest(
  options: Required<Pick<InitOptions, 'projectDir' | 'pluginDataDir'>> & InitOptions,
  manifest: Manifest,
): Promise<InitResult> {
  const remote = await syncRemote({
    remote: manifest.remote,
    ref: manifest.ref,
    pluginDataDir: options.pluginDataDir,
    offline: options.offline,
  });

  const config = await loadConfig(remote.sourceDir);
  assertProfileListed(config, manifest.profile);

  const [profile, rules, projectFacts] = await Promise.all([
    loadProfile(remote.sourceDir, manifest.profile),
    loadRules(remote.sourceDir),
    collectProjectFacts(options.projectDir),
  ]);

  const selection = selectRules({
    profileId: manifest.profile,
    requiredIds: profile.rules.required,
    profileTags: profile.rules.include_tags,
    manifestTags: manifest.include.tags,
    excludedIds: manifest.exclude.rules,
    rules,
    project: projectFacts,
  });

  if (!options.dryRun) {
    await Promise.all([
      manifest.materialize.memory
        ? materializeMemory(options.projectDir, remote.sourceDir, profile.memory.include, manifest, remote.resolvedCommit, selection)
        : Promise.resolve(),
      manifest.materialize.rules
        ? materializeRules(options.projectDir, remote.sourceDir, selection, manifest)
        : Promise.resolve(),
      manifest.materialize.settings_local
        ? materializeSettings(options.projectDir, remote.sourceDir, profile.settings_local.include)
        : Promise.resolve(),
    ]);

    await writeLockfileAndGitignore(options, manifest, remote.resolvedCommit, profile, selection);
  }

  return {
    manifest,
    selection,
    resolvedCommit: remote.resolvedCommit,
    summary: initSummaryTemplate(manifest, remote.resolvedCommit),
  };
}

async function materializeMemory(
  projectDir: string,
  sourceDir: string,
  memorySources: string[],
  manifest: Manifest,
  resolvedCommit: string,
  selection: RuleSelection,
): Promise<void> {
  const fragments = await loadMemoryFragments(sourceDir, memorySources, manifest.params);
  await writeProjectFile(
    projectDir,
    PROJECT_FILES.generatedMemory,
    compileMemory({
      remote: manifest.remote,
      requestedRef: manifest.ref,
      resolvedCommit,
      profile: manifest.profile,
      memorySources: fragments.map((f) => f.source),
      loadedRules: selection.selected.map((rule) => `${rule.id}@${rule.version}`),
      contents: fragments.map((f) => f.content),
    }),
  );
}

async function materializeRules(
  projectDir: string,
  sourceDir: string,
  selection: RuleSelection,
  manifest: Manifest,
): Promise<void> {
  const rulesDir = assertSafeProjectWrite(projectDir, join(projectDir, PROJECT_FILES.generatedRulesDir));
  await rm(rulesDir, { recursive: true, force: true });
  await mkdir(rulesDir, { recursive: true });

  await Promise.all(
    selection.selected.map((rule, index) => {
      const params = resolveRuleParams(rule, manifest.params);
      return writeProjectFile(
        projectDir,
        `${PROJECT_FILES.generatedRulesDir}/${generatedRuleFilename(index, rule.id)}`,
        compileRule({ id: rule.id, version: rule.version, paths: rule.paths, body: rule.body, params }),
      );
    }),
  );
}

async function materializeSettings(projectDir: string, sourceDir: string, sources: string[]): Promise<void> {
  const settings = await loadSettingsFragments(sourceDir, sources);
  await writeProjectFile(projectDir, PROJECT_FILES.settingsLocal, `${JSON.stringify(mergeSettings(settings), null, 2)}\n`);
}

async function writeLockfileAndGitignore(
  options: Required<Pick<InitOptions, 'projectDir' | 'pluginDataDir'>> & InitOptions,
  manifest: Manifest,
  resolvedCommit: string,
  profile: { memory: { include: string[] }; settings_local: { include: string[] } },
  selection: RuleSelection,
): Promise<void> {
  const generatedAt = new Date().toISOString();
  const lockfile = buildLockfile({
    remote: manifest.remote,
    requestedRef: manifest.ref,
    resolvedCommit,
    profile: manifest.profile,
    generatedAt,
    memory: profile.memory.include.map((source) => ({ source })),
    rules: selection.selected.map((rule) => ({ id: rule.id, version: rule.version, source: rule.source })),
    settingsLocal: manifest.materialize.settings_local ? profile.settings_local.include.map((source) => ({ source })) : [],
  });

  const lockPath = join(options.projectDir, PROJECT_FILES.lockfile);

  if (options.frozenLockfile) {
    let existing: string | null = null;
    try {
      existing = await readFile(lockPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    assertFrozenLockfile(existing, lockfile);
  } else {
    await writeProjectFile(options.projectDir, PROJECT_FILES.lockfile, lockfile);
  }

  if (options.gitignore !== false) {
    await ensureGitignoreEntries(options.projectDir);
  }
}

async function loadSettingsFragments(remoteDir: string, sources: string[]): Promise<JsonValue[]> {
  return Promise.all(
    sources.map(async (source) => JSON.parse(await readFile(assertSafeRemoteRead(remoteDir, source), 'utf8')) as JsonValue),
  );
}

async function writeProjectFile(projectDir: string, relativePath: string, content: string): Promise<void> {
  const target = assertSafeProjectWrite(projectDir, join(projectDir, relativePath));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

async function hasGeneratedOutput(projectDir: string): Promise<boolean> {
  try {
    await access(join(projectDir, PROJECT_FILES.lockfile));
    return true;
  } catch {
    return false;
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
