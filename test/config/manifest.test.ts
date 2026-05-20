import { describe, expect, it } from 'vitest';
import { parseManifest } from '../../src/config/manifest.js';

describe('parseManifest', () => {
  it('parses the JSON project manifest', () => {
    const manifest = parseManifest(`{
      "remote": "git@example.com:org/config.git",
      "ref": "v1.0.0",
      "tags": ["concern:testing"],
      "output": {
        "rules": true,
        "commands": true,
        "skills": true,
        "settingsLocal": true,
        "hooksLocal": true
      }
    }`);

    expect(manifest).toEqual({
      remote: 'git@example.com:org/config.git',
      ref: 'v1.0.0',
      tags: ['concern:testing'],
      output: {
        rules: true,
        commands: true,
        skills: true,
        settingsLocal: true,
        hooksLocal: true,
      },
    });
  });

  it('defaults output sections conservatively', () => {
    const manifest = parseManifest(`{ "remote": "../config" }`);

    expect(manifest.output).toEqual({
      rules: true,
      commands: false,
      skills: false,
      settingsLocal: false,
      hooksLocal: false,
    });
    expect(manifest.tags).toEqual([]);
  });

  it('rejects YAML content with a JSON manifest error', () => {
    expect(() => parseManifest('remote: ../config\n')).toThrow(/Invalid .claude-remote-config.json/);
  });
});
