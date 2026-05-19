# Local Settings

This guide is for remote config authors providing generated Claude Code local settings.

## Enable settings materialization

The consuming project must enable local settings generation:

```yaml
materialize:
  settings_local: true
```

The selected profile chooses the source fragments:

```yaml
settings_local:
  include:
    - settings/default.json
    - settings/node-service.json
```

## Fragment format

Settings fragments are JSON files:

```json
{
  "permissions": {
    "allow": ["Bash(git status)", "Read(*)"]
  }
}
```

Fragments are merged in profile order and written to:

```text
.claude/settings.local.json
```

## Merge behavior

Objects are merged deeply.

Arrays are deduplicated by JSON value.

Scalars use last-write-wins behavior.

For example:

```json
[
  {
    "permissions": {
      "allow": ["Bash(git status)"]
    },
    "theme": "light"
  },
  {
    "permissions": {
      "allow": ["Bash(git status)", "Read(*)"]
    },
    "theme": "dark"
  }
]
```

Produces:

```json
{
  "permissions": {
    "allow": ["Bash(git status)", "Read(*)"]
  },
  "theme": "dark"
}
```

## Safety

`claude-remote-config` writes `.claude/settings.local.json`, not `.claude/settings.json`.

This keeps generated settings local to the project checkout and avoids overwriting shared Claude Code project settings.
