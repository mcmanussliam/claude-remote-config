# Profiles

This guide is for remote config authors defining project-specific bundles under `profiles/`.

## Example

Create a profile at `profiles/node-service.yml`:

```yaml
id: node-service
title: Node Service
version: 1.0.0

memory:
  include:
    - memory/base.md
    - memory/node-service.md

rules:
  required:
    - repo.hygiene
  include_tags:
    - language:typescript
    - runtime:node

settings_local:
  include:
    - settings/default.json
```

## Fields

`id` must match the filename and the profile selected by the consuming project.

`title` is optional human-readable metadata.

`version` is optional profile metadata.

`memory.include` lists Markdown fragments to compile into generated shared memory.

`rules.required` lists rule IDs that must be selected. Required rules still need to pass their `requires` checks.

`rules.include_tags` selects rules that have any matching tag.

`settings_local.include` lists JSON fragments to merge into `.claude/settings.local.json` when the consuming project enables `materialize.settings_local`.

## Future-facing fields

The profile parser currently accepts these sections, but the current materializer does not write them:

```yaml
agents_local:
  include: []

mcp_local:
  include: []

hooks_local:
  include: []
```

Avoid relying on those sections until materialization support exists.
