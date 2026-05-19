import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parse } from 'yaml';
import { z } from 'zod';

import { PROJECT_FILES } from './paths.js';

const OutputSchema = z
  .object({
    memory: z.boolean().default(true),
    rules: z.boolean().default(true),
    settings_local: z.boolean().default(false),
  })
  .strict()
  .default({});

const ManifestSchema = z.object({
  remote: z.string().min(1),
  ref: z.string().min(1).optional(),
  output: OutputSchema,
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  include: z
    .object({
      tags: z.array(z.string()).default([]),
    })
    .default({ tags: [] }),
  exclude: z
    .object({
      rules: z.array(z.string()).default([]),
    })
    .default({ rules: [] }),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export function parseManifest(content: string): Manifest {
  const raw = parse(content) ?? {};
  const parsed = ManifestSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid ${PROJECT_FILES.manifest}: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function loadManifest(projectDir: string): Promise<Manifest | null> {
  try {
    return parseManifest(await readFile(join(projectDir, PROJECT_FILES.manifest), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
