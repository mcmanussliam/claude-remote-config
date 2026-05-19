import { readFile } from 'node:fs/promises';

import { parse } from 'yaml';
import { z } from 'zod';

import { REMOTE_FILES } from '../config/paths.js';
import { assertSafeRemoteRead } from '../config/safe-paths.js';

const ConfigSchema = z.object({
  id: z.string(),
  version: z.string(),
  minimum_plugin_version: z.string().optional(),
  memory: z.object({ include: z.array(z.string()).default([]) }).default({ include: [] }),
  settings_local: z.object({ include: z.array(z.string()).default([]) }).default({ include: [] }),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function loadConfig(remoteDir: string): Promise<Config> {
  const content = await readFile(assertSafeRemoteRead(remoteDir, REMOTE_FILES.config), 'utf8');
  const parsed = ConfigSchema.safeParse(parse(content) ?? {});

  if (!parsed.success) {
    throw new Error(`Invalid remote claude-remote-manifest.yml: ${parsed.error.message}`);
  }

  return parsed.data;
}
