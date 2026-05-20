import { createHash } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';
import { PLUGIN_DATA } from '../config/paths.js';
/** Clones on first run; fetches on subsequent runs. Wipes a corrupt clone before retrying. */
export async function syncRemote(options) {
    const sourceDir = join(options.pluginDataDir, PLUGIN_DATA.remotesDir, hashRemote(options.remote), PLUGIN_DATA.sourceDir);
    if (!options.offline) {
        await mkdir(join(options.pluginDataDir, PLUGIN_DATA.remotesDir, hashRemote(options.remote)), { recursive: true });
        try {
            await git(['rev-parse', '--git-dir'], sourceDir);
            await git(['fetch', '--tags', '--prune', 'origin'], sourceDir);
        }
        catch {
            await rm(sourceDir, { recursive: true, force: true });
            await git(['clone', '--no-checkout', options.remote, sourceDir]);
        }
    }
    await git(['checkout', '--force', options.ref ?? 'origin/HEAD'], sourceDir);
    const resolvedCommit = (await git(['rev-parse', 'HEAD'], sourceDir)).trim();
    return { sourceDir, resolvedCommit };
}
export function hashRemote(remote) {
    return createHash('sha256').update(remote).digest('hex').slice(0, 24);
}
async function git(args, cwd) {
    const result = await execa('git', args, { cwd });
    return result.stdout;
}
