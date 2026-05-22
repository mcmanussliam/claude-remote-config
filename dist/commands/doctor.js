import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { loadManifest } from '../config/manifest.js';
import { PROJECT_FILES } from '../config/paths.js';
export async function doctorProject(projectDir) {
    const manifest = await loadManifest(projectDir);
    if (!manifest) {
        return `claude-remote-config doctor: missing ${PROJECT_FILES.manifest}\n`;
    }
    const checks = [`manifest: ok (${manifest.remote})`];
    const [gitignoreExists, generatedRulesExists, generatedCommandsExists, generatedSkillsExists, settingsLocalExists, hooksLocalExists,] = await Promise.all([
        exists(join(projectDir, PROJECT_FILES.gitignore)),
        exists(join(projectDir, PROJECT_FILES.generatedRulesDir)),
        exists(join(projectDir, PROJECT_FILES.generatedCommandsDir)),
        hasGeneratedSkills(projectDir),
        exists(join(projectDir, PROJECT_FILES.settingsLocal)),
        exists(join(projectDir, PROJECT_FILES.hooksLocal)),
    ]);
    checks.push(gitignoreExists ? 'gitignore: present' : 'gitignore: missing', generatedRulesExists ? 'generated rules: present' : 'generated rules: missing', generatedCommandsExists ? 'generated commands: present' : 'generated commands: missing', generatedSkillsExists ? 'generated skills: present' : 'generated skills: missing', settingsLocalExists ? 'settings local: present' : 'settings local: missing', hooksLocalExists ? 'hooks local: present' : 'hooks local: missing');
    return `claude-remote-config doctor\n${checks.join('\n')}\n`;
}
async function exists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
async function hasGeneratedSkills(projectDir) {
    let entries = null;
    try {
        entries = await readdir(join(projectDir, PROJECT_FILES.skillsDir));
    }
    catch {
        return false;
    }
    return entries.some((entry) => entry.startsWith('remote-'));
}
