import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import fg from 'fast-glob';
import matter from 'gray-matter';
import { z } from 'zod';

import { REMOTE_FILES } from '../config/paths.js';
import { assertSafeRemoteRead } from '../config/safe-paths.js';

const RequiresSchema = z
  .object({
    files_any: z.array(z.string()).optional(),
    files_all: z.array(z.string()).optional(),
    package_json_any: z
      .object({
        dependencies: z.array(z.string()).optional(),
        devDependencies: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .optional();

const RuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  status: z.string().optional(),
  tags: z.array(z.string()).default([]),
  paths: z.array(z.string()).default([]),
  priority: z.number().default(100),
  requires: RequiresSchema,
  conflicts_with: z.array(z.string()).default([]),
  parameters: z
    .record(
      z.string(),
      z.object({
        default: z.union([z.string(), z.number(), z.boolean()]).optional(),
        allowed: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
      }),
    )
    .default({}),
});

export interface Rule extends z.infer<typeof RuleSchema> {
  /** Relative path within the remote repo, used for diagnostics. */
  source: string;
  body: string;
  /** Glob patterns passed through to the generated rule file's frontmatter. */
  paths: string[];
}

export interface ProjectFacts {
  /** Set of relative file paths found in the project (depth-limited). */
  files: Set<string>;
  /** Parsed package.json content, or empty object if absent. */
  packageJson: {
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
  };
}

export interface RuleSelectionInput {
  /** Tags added by the project's manifest include.tags. */
  manifestTags: string[];
  /** Rule IDs explicitly excluded by the manifest. */
  excludedIds: string[];
  rules: Rule[];
  project: ProjectFacts;
}

export interface RuleSelection {
  selected: Rule[];
  skipped: Array<{ id: string; source: string; reason: string }>;
}

export function parseRule(source: string, content: string): Rule {
  const parsedMatter = matter(content);
  const parsed = RuleSchema.safeParse(parsedMatter.data);

  if (!parsed.success) {
    throw new Error(`Invalid rule frontmatter in ${source}: ${parsed.error.message}`);
  }

  return { ...parsed.data, source, body: parsedMatter.content };
}

export async function loadRules(remoteDir: string): Promise<Rule[]> {
  const entries = await fg(REMOTE_FILES.rulesGlob, { cwd: remoteDir, onlyFiles: true, dot: false });
  const rules = await Promise.all(
    entries.sort().map(async (entry) => parseRule(entry, await readFile(assertSafeRemoteRead(remoteDir, entry), 'utf8'))),
  );

  const seen = new Set<string>();

  for (const rule of rules) {
    if (seen.has(rule.id)) {
      throw new Error(`Duplicate rule id: ${rule.id}`);
    }
    seen.add(rule.id);
  }

  return rules;
}

/** Selects rules by tag match; excluded IDs and requires checks run last. */
export function selectRules(input: RuleSelectionInput): RuleSelection {
  const byId = new Map(input.rules.map((rule) => [rule.id, rule]));
  const selected = new Map<string, Rule>();
  const skipped: Array<{ id: string; source: string; reason: string }> = [];
  const tagSet = new Set(input.manifestTags);

  for (const rule of input.rules) {
    if (tagSet.size === 0 || rule.tags.some((tag) => tagSet.has(tag))) {
      selected.set(rule.id, rule);
    }
  }

  for (const id of input.excludedIds) {
    const rule = byId.get(id);
    if (rule) {
      selected.delete(id);
      skipped.push({ id, source: rule.source, reason: 'excluded by manifest' });
    }
  }

  for (const rule of [...selected.values()]) {
    if (requiresPass(rule, input.project)) {
      continue;
    }

    selected.delete(rule.id);
    skipped.push({ id: rule.id, source: rule.source, reason: 'requires checks failed' });
  }

  const output = [...selected.values()].sort(
    (left, right) => left.priority - right.priority || left.id.localeCompare(right.id) || left.source.localeCompare(right.source),
  );

  detectConflicts(output);

  return { selected: output, skipped };
}

function requiresPass(rule: Rule, project: ProjectFacts): boolean {
  if (!rule.requires) {
    return true;
  }

  const { files_any: filesAny, files_all: filesAll, package_json_any: packageJsonAny } = rule.requires;

  if (filesAny?.length && !filesAny.some((file) => project.files.has(file))) {
    return false;
  }

  if (filesAll?.length && !filesAll.every((file) => project.files.has(file))) {
    return false;
  }

  if (packageJsonAny) {
    const checks = [
      ...(packageJsonAny.dependencies ?? []).map((name) => Boolean(project.packageJson.dependencies?.[name])),
      ...(packageJsonAny.devDependencies ?? []).map((name) => Boolean(project.packageJson.devDependencies?.[name])),
    ];
    if (checks.length && !checks.some(Boolean)) {
      return false;
    }
  }

  return true;
}

function detectConflicts(rules: Rule[]): void {
  const ids = new Set(rules.map((rule) => rule.id));

  for (const rule of rules) {
    const conflict = rule.conflicts_with.find((id) => ids.has(id));
    if (conflict) {
      throw new Error(`Rule conflict: ${rule.id} conflicts with ${conflict}`);
    }
  }
}

export async function collectProjectFacts(projectDir: string): Promise<ProjectFacts> {
  const files = new Set(
    await fg('**/*', { cwd: projectDir, onlyFiles: true, deep: 4, dot: true, ignore: ['node_modules/**', '.git/**'] }),
  );

  let packageJson: ProjectFacts['packageJson'] = {};

  try {
    packageJson = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8')) as ProjectFacts['packageJson'];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return { files, packageJson };
}

export function resolveRuleParams(rule: Rule, manifestParams: Record<string, unknown>): Record<string, unknown> {
  const params: Record<string, unknown> = { ...manifestParams };

  for (const [name, config] of Object.entries(rule.parameters)) {
    if (params[name] === undefined && config.default !== undefined) {
      params[name] = config.default;
    }
    if (config.allowed && params[name] !== undefined && !config.allowed.includes(params[name] as string)) {
      throw new Error(`Parameter value not allowed for ${name}: ${String(params[name])}`);
    }
  }

  return params;
}
