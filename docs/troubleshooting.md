# Troubleshooting

This guide is for project users fixing common `claude-remote-config` setup and sync problems.

## Missing manifest

If commands say the project is not configured, create `.claude-remote-config.json`:

```bash
claude-remote-config setup --remote <repo> --ref <ref>
```

## Migrating from YAML manifest

If you have a `.claude-remote-config.yml` file from an older version, convert it to `.claude-remote-config.json`.

Old:

```yaml
remote: git@example.com:your-org/claude-config.git
ref: v1.0.0
tags:
  - concern:testing
```

New:

```json
{
  "remote": "git@example.com:your-org/claude-config.git",
  "ref": "v1.0.0",
  "tags": ["concern:testing"],
  "output": {
    "rules": true,
    "commands": false,
    "skills": false,
    "settingsLocal": false,
    "hooksLocal": false
  }
}
```

Then delete `.claude-remote-config.yml` and commit `.claude-remote-config.json`.

## Remote clone or fetch failure

Check that the remote URL is correct and your shell can access it:

```bash
git ls-remote <repo>
```

If the remote was previously cached in a bad state, run `init` again. The cache sync will retry with a fresh clone when needed.

## Offline mode without a cache

`--offline` requires the remote repository to already exist in the plugin data cache. Run once without `--offline`, then use offline mode later.

## Remote missing `.claude/index.json`

The remote repository must be a `claude-remote-config/v2` remote with a `.claude/index.json` file at the root. Legacy remotes using `claude-remote-manifest.yml` and `rules/**/*.md` are not supported by this version.

## Generated files are not updating

Run `init` without `--offline` and confirm the selected tags:

```bash
claude-remote-config init
```
