# Memory

This guide is for remote config authors writing shared memory fragments.

## Profile references

Profiles include memory fragments by path:

```yaml
memory:
  include:
    - memory/base.md
    - memory/node-service.md
```

Each path is read from the remote repository. Paths cannot escape the remote repository root.

## Parameters

Memory fragments can use project parameters:

```markdown
Use {{ package_manager }} when installing dependencies.
```

The consuming project supplies values in `.claude-remote-config.yml`:

```yaml
params:
  package_manager: pnpm
```

Missing values fail generation.

## Generated output

Memory fragments are compiled into:

```text
.claude-remote-config/generated/CLAUDE.md
```

The generated file includes metadata for:

- remote repository
- requested ref
- resolved commit
- selected profile
- loaded memory fragments
- selected rules

The bridge file at `.claude/CLAUDE.md` references this generated memory file so Claude Code can load it for the project.
