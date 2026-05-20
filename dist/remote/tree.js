import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { z } from 'zod';
import { REMOTE_FILES } from '../config/paths.js';
import { evaluateRequires, parseRequires } from './requires.js';
const DirectoryIndexSchema = z
    .object({
    tags: z.array(z.string()).default([]),
    requires: z.unknown().optional().transform(parseRequires),
})
    .strict();
export async function discoverRemoteTree(remoteDir, input) {
    const rules = [];
    const commands = [];
    const skills = [];
    const skipped = [];
    const [settings, hooks] = await Promise.all([
        readJsonAsset(join(remoteDir, REMOTE_FILES.settings), REMOTE_FILES.settings),
        readJsonAsset(join(remoteDir, REMOTE_FILES.hooks), REMOTE_FILES.hooks),
        walkDirectory(join(remoteDir, REMOTE_FILES.rulesDir), remoteDir, input, skipped, async (filePath) => {
            if (!filePath.endsWith('.md'))
                return;
            const content = await readFile(filePath, 'utf8');
            rules.push({
                kind: 'rule',
                remotePath: relative(remoteDir, filePath),
                relativeOutputPath: relative(join(remoteDir, REMOTE_FILES.rulesDir), filePath),
                content,
            });
        }),
        walkDirectory(join(remoteDir, REMOTE_FILES.commandsDir), remoteDir, input, skipped, async (filePath) => {
            if (!filePath.endsWith('.md'))
                return;
            const content = await readFile(filePath, 'utf8');
            commands.push({
                kind: 'command',
                remotePath: relative(remoteDir, filePath),
                relativeOutputPath: relative(join(remoteDir, REMOTE_FILES.commandsDir), filePath),
                commandName: basename(filePath, '.md'),
                content,
            });
        }),
        discoverSkills(join(remoteDir, REMOTE_FILES.skillsDir), remoteDir, skills),
    ]);
    return { rules, commands, skills, settings, hooks, skipped };
}
async function readJsonAsset(path, remotePath) {
    const content = await readFile(path, 'utf8').catch((err) => {
        if (err.code === 'ENOENT')
            return null;
        throw err;
    });
    return content !== null ? { remotePath, value: JSON.parse(content) } : undefined;
}
async function readDirectoryIndex(dir) {
    const content = await readFile(join(dir, '.index.json'), 'utf8').catch((err) => {
        if (err.code === 'ENOENT')
            return null;
        throw err;
    });
    if (content === null)
        return null;
    const parsed = DirectoryIndexSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
        throw new Error(`Invalid .index.json at ${join(dir, '.index.json')}: ${parsed.error.message}`);
    }
    return parsed.data;
}
async function walkDirectory(dir, remoteDir, input, skipped, onFile) {
    const entries = await readdir(dir).catch((err) => {
        if (err.code === 'ENOENT')
            return null;
        throw err;
    });
    if (!entries)
        return;
    await Promise.all(entries
        .filter((entry) => entry !== '.index.json')
        .sort()
        .map(async (entry) => {
        const fullPath = join(dir, entry);
        const fileStat = await stat(fullPath);
        if (fileStat.isFile()) {
            await onFile(fullPath);
            return;
        }
        if (!fileStat.isDirectory())
            return;
        const relPath = relative(remoteDir, fullPath);
        const index = await readDirectoryIndex(fullPath);
        if (index?.tags?.length && input.tags.length > 0) {
            const hasMatchingTag = index.tags.some((tag) => input.tags.includes(tag));
            if (!hasMatchingTag) {
                skipped.push({ path: relPath, reason: `tags did not match: ${index.tags.join(', ')}` });
                return;
            }
        }
        if (index?.requires) {
            const result = evaluateRequires(index.requires, input.project);
            if (!result.pass) {
                skipped.push({ path: relPath, reason: result.reason ?? 'requires check failed' });
                return;
            }
        }
        await walkDirectory(fullPath, remoteDir, input, skipped, onFile);
    }));
}
async function discoverSkills(skillsDir, remoteDir, skills) {
    const entries = await readdir(skillsDir).catch((err) => {
        if (err.code === 'ENOENT')
            return null;
        throw err;
    });
    if (!entries)
        return;
    await Promise.all(entries.sort().map(async (entry) => {
        const fullPath = join(skillsDir, entry);
        const fileStat = await stat(fullPath);
        if (!fileStat.isDirectory())
            return;
        const skillMdStat = await stat(join(fullPath, 'SKILL.md')).catch((err) => {
            if (err.code === 'ENOENT')
                return null;
            throw err;
        });
        if (!skillMdStat)
            return;
        const generatedName = `remote-${entry}`;
        const files = await collectSkillFiles(fullPath, fullPath, remoteDir, generatedName);
        skills.push({
            kind: 'skill',
            remotePath: relative(remoteDir, join(fullPath, 'SKILL.md')),
            relativeOutputPath: `${generatedName}/SKILL.md`,
            name: entry,
            generatedName,
            files,
        });
    }));
}
async function collectSkillFiles(dir, skillRoot, remoteDir, generatedName) {
    const entries = await readdir(dir);
    const results = await Promise.all(entries.sort().map(async (entry) => {
        const fullPath = join(dir, entry);
        const fileStat = await stat(fullPath);
        if (fileStat.isDirectory()) {
            return collectSkillFiles(fullPath, skillRoot, remoteDir, generatedName);
        }
        const content = await readFile(fullPath, 'utf8');
        return [
            {
                remotePath: relative(remoteDir, fullPath),
                relativeOutputPath: `${generatedName}/${relative(skillRoot, fullPath)}`,
                content,
            },
        ];
    }));
    return results.flat();
}
