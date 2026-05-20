import { z } from 'zod';

const RequiresSchema = z
  .object({
    filesAny: z.array(z.string()).optional(),
    filesAll: z.array(z.string()).optional(),
    packageJsonAny: z
      .object({
        dependencies: z.array(z.string()).optional(),
        devDependencies: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .strict()
  .optional();

export type Requires = z.infer<typeof RequiresSchema>;

export interface ProjectFacts {
  files: Set<string>;
  packageJson: {
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
  };
}

export interface RequiresResult {
  pass: boolean;
  reason?: string;
}

export function parseRequires(value: unknown): Requires {
  const parsed = RequiresSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(`Invalid requires: ${parsed.error.message}`);
  }

  return parsed.data;
}

export function evaluateRequires(requires: Requires, project: ProjectFacts): RequiresResult {
  if (!requires) {
    return { pass: true };
  }

  if (requires.filesAll?.length) {
    const missing = requires.filesAll.filter((file) => !project.files.has(file));
    if (missing.length) {
      return { pass: false, reason: `missing required file: ${missing[0]}` };
    }
  }

  if (requires.filesAny?.length && !requires.filesAny.some((file) => project.files.has(file))) {
    return { pass: false, reason: `none of required files exist: ${requires.filesAny.join(', ')}` };
  }

  if (requires.packageJsonAny) {
    const dependencyNames = requires.packageJsonAny.dependencies ?? [];
    const devDependencyNames = requires.packageJsonAny.devDependencies ?? [];
    const dependencyMatches = dependencyNames.map((name) => Boolean(project.packageJson.dependencies?.[name]));
    const devDependencyMatches = devDependencyNames.map((name) => Boolean(project.packageJson.devDependencies?.[name]));

    if (
      dependencyMatches.length + devDependencyMatches.length > 0 &&
      ![...dependencyMatches, ...devDependencyMatches].some(Boolean)
    ) {
      const names = [...dependencyNames, ...devDependencyNames].join(', ');
      return { pass: false, reason: `none of required package.json dependencies exist: ${names}` };
    }
  }

  return { pass: true };
}
