import { relative, resolve, sep } from 'node:path';
import { PROJECT_FILES } from './paths.js';
const approvedExact = new Set([
    PROJECT_FILES.generatedRulesDir,
    PROJECT_FILES.generatedCommandsDir,
    PROJECT_FILES.settingsLocal,
    PROJECT_FILES.hooksLocal,
    PROJECT_FILES.gitignore,
]);
const approvedPrefixes = [
    `${PROJECT_FILES.generatedCacheDir}/`,
    `${PROJECT_FILES.generatedRulesDir}/`,
    `${PROJECT_FILES.generatedCommandsDir}/`,
    `${PROJECT_FILES.generatedSkillsPrefix}`,
    '.claude/skills/remote-',
];
export function assertInside(root, target, label) {
    const rootPath = resolve(root);
    const targetPath = resolve(target);
    const rel = relative(rootPath, targetPath);
    if (targetPath === rootPath || rel === '..' || rel.startsWith(`..${sep}`)) {
        throw new Error(`${label} is outside project: ${target}`);
    }
    return targetPath;
}
/** Enforces an allowlist of approved write paths; prevents accidental writes to non-generated project files. */
export function assertSafeProjectWrite(projectDir, target) {
    const targetPath = assertInside(projectDir, target, 'Generated output path');
    const rel = relative(resolve(projectDir), targetPath).replaceAll('\\', '/');
    if (approvedExact.has(rel) || approvedPrefixes.some((prefix) => rel.startsWith(prefix))) {
        return targetPath;
    }
    throw new Error(`Path is not an approved claude-remote-config write location: ${rel}`);
}
/** Prevents path traversal attacks from untrusted remote content. */
export function assertSafeRemoteRead(remoteDir, relativePath) {
    if (relativePath.includes('\0')) {
        throw new Error(`Invalid remote path: ${relativePath}`);
    }
    const target = resolve(remoteDir, relativePath);
    const rootPath = resolve(remoteDir);
    const rel = relative(rootPath, target).replaceAll('\\', '/');
    if (rel.startsWith('../') || rel === '..' || rel.startsWith('/')) {
        throw new Error(`Remote path escapes repository: ${relativePath}`);
    }
    return target;
}
export function setupWritePath(projectDir, absolutePath) {
    const target = resolve(absolutePath);
    const rel = relative(resolve(projectDir), target).replaceAll('\\', '/');
    if (rel === PROJECT_FILES.manifest || rel === PROJECT_FILES.gitignore) {
        return target;
    }
    throw new Error(`Path is not an approved setup write location: ${absolutePath}`);
}
