import fg from 'fast-glob';
export async function collectProjectFacts(projectDir) {
    const files = new Set(await fg('**/*', { cwd: projectDir, onlyFiles: true, deep: 4, dot: true, ignore: ['node_modules/**', '.git/**'] }));
    return { files };
}
