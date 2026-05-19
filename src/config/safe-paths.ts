import { relative, resolve, sep } from 'node:path';

import { PROJECT_FILES } from './paths.js';

const approvedExact = new Set<string>([
  PROJECT_FILES.generatedRulesDir,
  PROJECT_FILES.settingsLocal,
  PROJECT_FILES.gitignore,
]);

const approvedPrefixes = [
  `${PROJECT_FILES.generatedMemoryDir}/`,
  `${PROJECT_FILES.generatedCacheDir}/`,
  `${PROJECT_FILES.generatedRulesDir}/`,
];

export function assertInside(root: string, target: string, label: string): string {
  const rootPath = resolve(root);
  const targetPath = resolve(target);
  const rel = relative(rootPath, targetPath);

  if (targetPath === rootPath || rel === '..' || rel.startsWith(`..${sep}`)) {
    throw new Error(`${label} is outside project: ${target}`);
  }

  return targetPath;
}

/** Enforces an allowlist of approved write paths; prevents accidental writes to non-generated project files. */
export function assertSafeProjectWrite(projectDir: string, target: string): string {
  const targetPath = assertInside(projectDir, target, 'Generated output path');
  const rel = relative(resolve(projectDir), targetPath).replaceAll('\\', '/');

  if (approvedExact.has(rel) || approvedPrefixes.some((prefix) => rel.startsWith(prefix))) {
    return targetPath;
  }

  throw new Error(`Path is not an approved claude-remote-config write location: ${rel}`);
}

/** Prevents path traversal attacks from untrusted remote content. */
export function assertSafeRemoteRead(remoteDir: string, relativePath: string): string {
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

export function setupWritePath(projectDir: string, relativePath: string): string {
  const target = resolve(projectDir, relativePath);
  const rel = relative(resolve(projectDir), target).replaceAll('\\', '/');

  if (rel === PROJECT_FILES.manifest || rel === PROJECT_FILES.gitignore) {
    return target;
  }

  throw new Error(`Path is not an approved setup write location: ${relativePath}`);
}
