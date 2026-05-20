# Local Settings

This guide is for remote config authors providing generated Claude Code local settings.

## Enable settings materialization

The consuming project must enable local settings generation in `.claude-remote-config.json`:

```json
{
  "output": {
    "settingsLocal": true
  }
}
```

## Settings format

The remote `.claude/settings.json` is a standard Claude Code settings file:

```json
{
  "permissions": {
    "allow": ["Bash(git status)", "Read(*)"]
  }
}
```

It is written to `.claude/settings.local.json` in the consuming project on each sync.

## Ownership

The remote owns `.claude/settings.local.json` entirely. Its content replaces whatever was there previously on every sync.

If a project needs local-only settings additions, use `.claude/settings.json` (the committed project-level settings file) instead. Claude Code merges `.claude/settings.json` and `.claude/settings.local.json` at runtime.

## Safety

`claude-remote-config` writes `.claude/settings.local.json`, not `.claude/settings.json`.

This keeps generated settings separate from shared Claude Code project settings committed to the repository.
