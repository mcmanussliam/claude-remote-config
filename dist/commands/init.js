import { access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadManifest } from '../config/manifest.js';
import { PROJECT_FILES } from '../config/paths.js';
import { materializeRemoteAssets } from '../output/assets.js';
import { ensureGitignoreEntries } from '../output/gitignore.js';
import { hookFallbackWarning, initSummaryTemplate } from '../output/templates.js';
import { syncRemote } from '../remote/git.js';
import { collectProjectFacts } from '../remote/rules.js';
import { discoverRemoteTree } from '../remote/tree.js';
export async function initProject(options) {
    const projectDir = resolve(options.projectDir);
    const pluginDataDir = resolve(options.pluginDataDir);
    const manifest = await loadManifest(projectDir);
    if (!manifest) {
        return { manifest: null, summary: '' };
    }
    try {
        return await initWithManifest({ ...options, projectDir, pluginDataDir }, manifest);
    }
    catch (error) {
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
async function initWithManifest(options, manifest) {
    const remote = await syncRemote({
        remote: manifest.remote,
        ref: manifest.ref,
        pluginDataDir: options.pluginDataDir,
        offline: options.offline,
    });
    const projectFacts = await collectProjectFacts(options.projectDir);
    const selection = await discoverRemoteTree(remote.sourceDir, {
        tags: manifest.tags,
        project: projectFacts,
    });
    const result = {
        manifest,
        selection,
        resolvedCommit: remote.resolvedCommit,
        summary: initSummaryTemplate(manifest, remote.resolvedCommit, selection),
    };
    if (options.dryRun) {
        return result;
    }
    await materializeRemoteAssets(options.projectDir, {
        ...selection,
        rules: manifest.output.rules ? selection.rules : [],
        commands: manifest.output.commands ? selection.commands : [],
        skills: manifest.output.skills ? selection.skills : [],
        settings: manifest.output.settingsLocal ? selection.settings : undefined,
        hooks: manifest.output.hooksLocal ? selection.hooks : undefined,
    });
    if (options.gitignore) {
        await ensureGitignoreEntries(options.projectDir);
    }
    return result;
}
async function hasGeneratedOutput(projectDir) {
    const paths = [
        PROJECT_FILES.generatedRulesDir,
        PROJECT_FILES.generatedCommandsDir,
        PROJECT_FILES.skillsDir,
        PROJECT_FILES.settingsLocal,
        PROJECT_FILES.hooksLocal,
    ];
    return Promise.any(paths.map((p) => access(join(projectDir, p)))).then(() => true, () => false);
}
function formatError(error) {
    return error instanceof Error ? error.message : String(error);
}
