#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;
const date = new Date().toISOString().slice(0, 10);

let lastTag = '';
try {
  lastTag = execSync('git describe --tags --abbrev=0 --match "remote-config--v*"', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  }).trim();
} catch {}

const range = lastTag ? `${lastTag}..HEAD` : '';
const raw = execSync(`git log ${range} --pretty=format:"%s"`.trim(), { encoding: 'utf8' }).trim();
const commits = raw ? raw.split('\n') : [];

const sections = {
  feat: { title: 'Features', items: [] },
  fix: { title: 'Bug Fixes', items: [] },
  perf: { title: 'Performance', items: [] },
  refactor: { title: 'Refactors', items: [] },
  docs: { title: 'Documentation', items: [] },
  chore: { title: 'Chores', items: [] },
};

const pattern = /^(\w+)(\([^)]+\))?!?: (.+)$/;

for (const line of commits) {
  const match = line.match(pattern);
  if (!match) continue;
  const [, type, scope, desc] = match;
  if (!sections[type]) continue;
  const label = scope ? `**${scope.slice(1, -1)}**: ${desc}` : desc;
  sections[type].items.push(`- ${label}`);
}

const content = Object.values(sections)
  .filter((s) => s.items.length > 0)
  .map((s) => `### ${s.title}\n\n${s.items.join('\n')}`)
  .join('\n\n');

if (!content) {
  process.exit(0);
}

const entry = `## [${version}] - ${date}\n\n${content}`;

// stdout — captured by the release workflow as release notes
process.stdout.write(`${entry}\n`);

// Prepend to CHANGELOG.md
const changelogPath = 'CHANGELOG.md';
const header = '# Changelog\n\n';
const existing = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : '';
const rest = existing.startsWith(header) ? existing.slice(header.length) : existing;
writeFileSync(changelogPath, `${`${header}${entry}\n\n${rest}`.trimEnd()}\n`);
