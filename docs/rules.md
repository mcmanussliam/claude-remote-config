# Rules

This guide is for remote config authors writing Markdown rule files under `.claude/rules/**/*.md`.

## Simple rule

Rules are Markdown files. No frontmatter is required unless you need Claude Code path scoping:

```markdown
Keep generated files out of committed source unless the project explicitly documents otherwise.
```

## Path-scoped rule

Use Markdown frontmatter only for Claude Code native `paths` scoping:

```markdown
---
paths:
  - "src/**/*.ts"
---

Return typed errors at module boundaries and avoid throwing raw strings.
```

The generated rule keeps only the `paths` frontmatter and a generated source comment.

## Directory requirements

Requirements live in `index.json` files in the directory, not in individual rule files:

```json
{
  "requires": {
    "filesAll": ["tsconfig.json"]
  },
  "tags": ["language:typescript"]
}
```

Supported `requires` checks:

```json
{
  "filesAny": ["vitest.config.ts", "vitest.config.mts"],
  "filesAll": ["package.json", "tsconfig.json"],
  "packageJsonAny": {
    "dependencies": ["react"],
    "devDependencies": ["vitest"]
  }
}
```

If a directory's requirements fail, no files in that directory (or any subdirectory) are included.

## Directory tags

Tags control whether a directory subtree is included based on the consuming project's `tags` field:

```json
{
  "tags": ["concern:testing"]
}
```

A consuming project with `"tags": ["concern:testing"]` will include this directory. A project with no matching tags will skip it. Directories without tags are always included when requirements pass.

## Example rule set

See [mcmanussliam/claude-config](https://github.com/mcmanussliam/claude-config) for a TypeScript-focused rule set.
