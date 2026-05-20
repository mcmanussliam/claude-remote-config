# Project Manifest

This guide is for project users configuring `.claude-remote-config.json` in a consuming repository.

## Example

```json
{
  "remote": "git@example.com:your-org/claude-config.git",
  "ref": "v1.0.0",
  "output": {
    "rules": true,
    "commands": true,
    "skills": true,
    "settingsLocal": true,
    "hooksLocal": true
  },
  "tags": ["concern:testing"]
}
```

## Fields

`remote` is the git repository containing shared Claude configuration.

`ref` is the tag, branch, or commit to check out. Tags or commit SHAs are best for reproducible configuration.

`output` controls which generated assets are written. Default values are:

```json
{
  "rules": true,
  "commands": false,
  "skills": false,
  "settingsLocal": false,
  "hooksLocal": false
}
```

`tags` selects directory subtrees from the remote. A directory with tags is only included if the project manifest tags contain at least one matching tag.

## What to commit

Commit:

```text
.claude-remote-config.json
.gitignore
```

Do not normally commit generated cache, generated rules, generated commands, generated skills, or local Claude Code config files.
