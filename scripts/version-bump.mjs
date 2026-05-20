#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const type = process.argv[2];

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: version-bump.mjs <patch|minor|major>');
  process.exit(1);
}

function bump(version, type) {
  const [maj, min, pat] = version.split('.').map(Number);
  if (type === 'major') return `${maj + 1}.0.0`;
  if (type === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

function updateJson(path, fn) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  fn(data);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const next = bump(pkg.version, type);

console.log(`${pkg.version} → ${next}`);

updateJson('package.json', (d) => {
  d.version = next;
});

updateJson('.claude-plugin/plugin.json', (d) => {
  d.version = next;
});

updateJson('.claude-plugin/marketplace.json', (d) => {
  for (const plugin of d.plugins) {
    if (plugin.name === 'remote-config') {
      plugin.version = next;
      plugin.source.ref = `remote-config--v${next}`;
    }
  }
});
