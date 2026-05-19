# Remote Repository

This guide is for remote config authors maintaining the shared Claude Code configuration repository.

## Layout

A remote config repository should use this shape:

```text
claude-remote-manifest.yml
profiles/
  node-service.yml
rules/
  base/
    hygiene.md
  security/
    secrets.md
memory/
  base.md
settings/
  default.json
```

Only the files referenced by the selected profile and selected rules are used by a consuming project.

## Remote manifest

`claude-remote-manifest.yml` lists the profiles available in the remote repository.

```yaml
id: company-claude-config
version: 1.0.0
minimum_plugin_version: 0.1.0
profiles:
  - node-service
  - frontend-app
```

`id` identifies the remote configuration set.

`version` is the version of the remote configuration format or bundle.

`minimum_plugin_version` is optional metadata for the minimum expected plugin version.

`profiles` lists valid profile IDs. A consuming project cannot use a profile unless it is listed here.

## Versioning

Consumers pin a git ref in `.claude-remote-config.yml`:

```yaml
ref: v1.0.0
```

Use tags or commit SHAs for predictable rollouts. Branches work, but the generated lockfile will change when the branch moves.
