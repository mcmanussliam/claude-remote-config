import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PROJECT_FILES } from '../config/paths.js';
import { setupWritePath } from '../config/safe-paths.js';
import { ensureGitignoreEntries } from '../output/gitignore.js';
export async function setupProject(options) {
    const manifest = {
        remote: options.remote,
        ...(options.ref ? { ref: options.ref } : {}),
        output: {
            rules: true,
            commands: false,
            skills: false,
            settingsLocal: false,
            hooksLocal: false,
        },
        tags: [],
    };
    const manifestPath = setupWritePath(options.projectDir, join(options.projectDir, PROJECT_FILES.manifest));
    await writeIfMissing(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await ensureGitignoreEntries(options.projectDir);
}
async function writeIfMissing(path, content) {
    try {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content, { flag: 'wx' });
        return true;
    }
    catch (error) {
        if (error.code === 'EEXIST') {
            return false;
        }
        throw error;
    }
}
