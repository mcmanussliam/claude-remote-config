import { readFile } from 'node:fs/promises';

import { parse } from 'yaml';
import { z } from 'zod';

import { REMOTE_FILES } from '../config/paths.js';
import { assertSafeRemoteRead } from '../config/safe-paths.js';

const ConfigSchema = z.object({
  id: z.string(),
  version: z.string(),
  profiles: z.array(z.string()).default([]),
  minimum_plugin_version: z.string().optional(),
});

const ProfileSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  version: z.string().optional(),
  memory: z.object({ include: z.array(z.string()).default([]) }).default({ include: [] }),
  rules: z
    .object({
      required: z.array(z.string()).default([]),
      include_tags: z.array(z.string()).default([]),
    })
    .default({ required: [], include_tags: [] }),
  settings_local: z.object({ include: z.array(z.string()).default([]) }).default({ include: [] }),
  agents_local: z.object({ include: z.array(z.string()).default([]) }).optional(),
  mcp_local: z.object({ include: z.array(z.string()).default([]) }).optional(),
  hooks_local: z.object({ include: z.array(z.string()).default([]) }).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export async function loadConfig(remoteDir: string): Promise<Config> {
  const content = await readFile(assertSafeRemoteRead(remoteDir, REMOTE_FILES.config), 'utf8');
  const parsed = ConfigSchema.safeParse(parse(content) ?? {});

  if (!parsed.success) {
    throw new Error(`Invalid remote claude-remote-manifest.yml: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function loadProfile(remoteDir: string, profileId: string): Promise<Profile> {
  const profilePath = `${REMOTE_FILES.profilesDir}/${profileId}.yml`;
  const content = await readFile(assertSafeRemoteRead(remoteDir, profilePath), 'utf8');
  const parsed = ProfileSchema.safeParse(parse(content) ?? {});

  if (!parsed.success) {
    throw new Error(`Invalid profile ${profileId}: ${parsed.error.message}`);
  }

  if (parsed.data.id !== profileId) {
    throw new Error(`Profile id mismatch: expected ${profileId}, got ${parsed.data.id}`);
  }

  return parsed.data;
}

export function assertProfileListed(config: Config, profileId: string): void {
  if (!config.profiles.includes(profileId)) {
    throw new Error(`Profile missing from claude-remote-manifest.yml: ${profileId}`);
  }
}
