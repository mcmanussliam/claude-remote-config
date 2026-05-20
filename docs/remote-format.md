# Remote Format

A remote config repository is a git repository with a Claude-shaped `.claude/` tree. The plugin treats the remote as data: it clones or fetches with `git`, reads files, and writes selected assets into the consuming project.

## Layout

```text
.claude/
  rules/
    .index.json
    typescript/
      .index.json
      strict-types.md
      vitest/
        .index.json
        tests.md
  commands/
    .index.json
    testing/
      test.md
  skills/
    review/
      SKILL.md
      references/
        checklist.md
  settings.json
  hooks.json
```

Rules and commands are discovered recursively. Skills are discovered from immediate subdirectories of `.claude/skills/` that contain `SKILL.md`; all files inside that skill directory are copied. Settings and hooks are read from `.claude/settings.json` and `.claude/hooks.json`.

## Rules

Rules are Markdown files under `.claude/rules/**/*.md`. They are copied as-is to `.claude/rules/remote/`, preserving any Claude Code-supported frontmatter:

```markdown
---
paths:
  - "src/**/*.ts"
---

Return typed errors at module boundaries and avoid throwing raw strings.
```

## Commands

Commands are Markdown files under `.claude/commands/**/*.md`. They are copied to `.claude/commands/remote/`.

Claude Code resolves command names by filename stem only. For example, `.claude/commands/remote/testing/test.md` exposes `/test`, not `/remote/testing/test`.

Before writing commands, the plugin checks local project commands outside `.claude/commands/remote/`. If a generated command has the same filename stem as a local command, sync aborts with a collision error.

## Skills

Skills are copied with a `remote-` prefix:

```text
remote: .claude/skills/review/SKILL.md
local:  .claude/skills/remote-review/SKILL.md
```

The generated skill exposes `/remote-review`. The prefix keeps generated skills separate from local project skills.

## Settings and hooks

When enabled in the project manifest:

```text
remote: .claude/settings.json
local:  .claude/settings.local.json

remote: .claude/hooks.json
local:  .claude/hooks.local.json
```

These generated local files are replaced entirely on each sync. Keep project-specific committed settings in `.claude/settings.json`, not in generated `.local` files.

## Directory gates

Directories under `.claude/rules/` and `.claude/commands/` can include `.index.json`:

```json
{
  "tags": ["language:typescript"],
  "requires": {
    "filesAll": ["package.json", "tsconfig.json"],
    "filesAny": ["vitest.config.ts", "vitest.config.mts"]
  }
}
```

`filesAll` requires every listed file to exist in the consuming project. `filesAny` requires at least one listed file. Checks are based on project-relative file paths.

If a directory gate fails, that directory and its children are skipped. Child directories can add their own gates.

The current implementation applies `.index.json` gates only while walking rules and commands. Skills, settings, and hooks are controlled by the project manifest output flags, not by `.index.json`.

## Tags

Tags are project-selected labels for directory inclusion.

If the consuming project has an empty `tags` array, tagged directories are included. If the consuming project has one or more tags, a tagged directory must share at least one tag with the project manifest. Untagged directories are always included when file requirements pass.
