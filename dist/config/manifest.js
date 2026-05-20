import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { PROJECT_FILES } from './paths.js';
const OutputSchema = z
    .object({
    rules: z.boolean().default(true),
    commands: z.boolean().default(false),
    skills: z.boolean().default(false),
    settingsLocal: z.boolean().default(false),
    hooksLocal: z.boolean().default(false),
})
    .strict()
    .default({});
const ManifestSchema = z.object({
    remote: z.string().min(1),
    ref: z.string().min(1).optional(),
    output: OutputSchema,
    tags: z.array(z.string()).default([]),
});
export function parseManifest(content) {
    let raw;
    try {
        raw = JSON.parse(content);
    }
    catch (error) {
        throw new Error(`Invalid ${PROJECT_FILES.manifest}: ${error.message}`);
    }
    const parsed = ManifestSchema.safeParse(raw ?? {});
    if (!parsed.success) {
        throw new Error(`Invalid ${PROJECT_FILES.manifest}: ${parsed.error.message}`);
    }
    return parsed.data;
}
export async function loadManifest(projectDir) {
    try {
        return parseManifest(await readFile(join(projectDir, PROJECT_FILES.manifest), 'utf8'));
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}
