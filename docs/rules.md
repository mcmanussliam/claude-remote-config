# Rules

This guide is for remote config authors writing Markdown rule files under `rules/**/*.md`.

## Simple rule

```markdown
---
id: repo.hygiene
title: Repository hygiene
version: 1.0.0
profiles:
  - node-service
priority: 20
---

Keep generated files out of committed source unless the project explicitly documents otherwise.
```

`id`, `title`, and `version` are required.

## Frontmatter reference

`status` is optional metadata.

`profiles` selects the rule when the consuming project uses any listed profile.

`tags` selects the rule when the profile or project manifest includes a matching tag.

`paths` is copied to the generated rule file as Claude Code native rule frontmatter.

`priority` sorts selected rules. Lower numbers are written first. The default is `100`.

`requires` skips the rule unless project facts match.

`conflicts_with` fails generation if another selected rule has a conflicting ID.

`parameters` defines optional defaults and allowed values for placeholders.

## Path-scoped rule

```markdown
---
id: typescript.error-handling
title: TypeScript error handling
version: 1.2.0
tags:
  - language:typescript
paths:
  - "src/**/*.ts"
priority: 10
---

Return typed errors at module boundaries and avoid throwing raw strings.
```

The generated rule keeps only the `paths` frontmatter and a generated source comment.

## Rule with requirements

```markdown
---
id: testing.vitest
title: Vitest testing
version: 1.0.0
tags:
  - concern:testing
requires:
  files_any:
    - vitest.config.ts
    - vitest.config.mts
  package_json_any:
    devDependencies:
      - vitest
---

Use Vitest for unit tests in this repository.
```

Supported `requires` checks:

```yaml
requires:
  files_any:
    - tsconfig.json
  files_all:
    - package.json
    - tsconfig.json
  package_json_any:
    dependencies:
      - react
    devDependencies:
      - vitest
```

## Parameterized rule

```markdown
---
id: javascript.package-manager
title: Package manager
version: 1.0.0
tags:
  - language:javascript
parameters:
  package_manager:
    default: npm
    allowed:
      - npm
      - pnpm
      - yarn
---

Use {{ package_manager }} for package installation and scripts.
```

The consuming project can override the value:

```yaml
params:
  package_manager: pnpm
```

If a placeholder has no value and no default, generation fails with a missing parameter error.

## Selection order

Rules are selected in this order:

1. Required rule IDs from the profile.
2. Rules matching the selected profile.
3. Rules matching profile tags or manifest tags.
4. Explicit exclusions from `exclude.rules`.
5. `requires` checks.
6. Conflict detection.
7. Sort by `priority`, then rule ID, then source path.
