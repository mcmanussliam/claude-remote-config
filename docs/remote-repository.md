# Remote Repository

This guide is for remote config authors maintaining the shared Claude Code configuration repository.

## Layout

A remote config repository uses the `.claude/` tree shape:

```text
.claude/
  index.json
  rules/
    index.json
    typescript/
      index.json
      strict-types.md
      testing/
        vitest/
          index.json
          test-style.md
  commands/
    index.json
    remote-test.md
    testing/
      index.json
      test.md
  skills/
    index.json
    code-review/
      index.json
      SKILL.md
  settings.json
  hooks.json
```

Only directories that pass their `index.json` gates are included when a consuming project syncs.

## Root index

`.claude/index.json` is required and must declare the schema:

```json
{
  "schema": "claude-remote-config/v2"
}
```

## Directory index gates

Each directory can contain an optional `index.json` that gates whether the directory and all its children are included:

```json
{
  "requires": {
    "filesAll": ["tsconfig.json"],
    "packageJsonAny": {
      "dependencies": ["typescript"],
      "devDependencies": ["typescript"]
    }
  },
  "tags": ["language:typescript"]
}
```

Requirement inheritance is additive. If a parent directory fails, children are not inspected. Child directories can add requirements; they cannot remove parent requirements.

## Tags

If a directory declares `tags`, a consuming project must include at least one matching tag in its `tags` field for the directory to be included. Directories without tags are always included (unless their `requires` fails).

## Supported `requires` checks

```json
{
  "requires": {
    "filesAny": ["vitest.config.ts", "vitest.config.mts"],
    "filesAll": ["package.json", "tsconfig.json"],
    "packageJsonAny": {
      "dependencies": ["react"],
      "devDependencies": ["vitest"]
    }
  }
}
```

## Commands

Remote commands are `.md` files under `.claude/commands/`. They are generated locally under `.claude/commands/remote/`.

**Important:** Claude Code command subdirectories are organizational only. `.claude/commands/remote/testing/test.md` exposes `/test`, not `/remote/testing/test`. The generated directory is an ownership boundary, not a Claude Code command namespace.

If a remote command name collides with a local command of the same filename stem, `init` will abort with a collision error.

## Skills

Remote skills are directories under `.claude/skills/` that contain a `SKILL.md` file. They are generated locally with a `remote-` prefix.

Remote skill `.claude/skills/review/SKILL.md` is generated locally as `.claude/skills/remote-review/SKILL.md` and exposes `/remote-review`.

This prefix prevents collisions with local skills and makes generated skills easy to identify.

## Settings and hooks

`.claude/settings.json` is written to `.claude/settings.local.json` in the consuming project when `output.settingsLocal` is `true`.

`.claude/hooks.json` is written to `.claude/hooks.local.json` in the consuming project when `output.hooksLocal` is `true`.

These files replace the local files entirely on each sync. If a project needs local-only additions, use `.claude/settings.json` (the committed project-level settings file) rather than the generated `.claude/settings.local.json`.

## Versioning

Consumers pin a git ref in `.claude-remote-config.json`:

```json
{
  "ref": "v1.0.0"
}
```

Use tags or commit SHAs for predictable rollouts.

## Example

See [mcmanussliam/claude-config](https://github.com/mcmanussliam/claude-config) for a complete TypeScript-focused remote config repository.
