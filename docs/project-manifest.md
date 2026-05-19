# Project Manifest

This guide is for project users configuring `.claude-remote-config.yml` in a consuming repository.

## Example

```yaml
remote: git@example.com:your-org/claude-config.git
ref: v1.0.0
profile: node-service

materialize:
  memory: true
  rules: true
  settings_local: true

params:
  package_manager: pnpm
  test_command: npm test

include:
  tags:
    - concern:security

exclude:
  rules:
    - testing.playwright
```

## Fields

`remote` is the git repository containing shared Claude configuration.

`ref` is the tag, branch, or commit to check out. Tags or commit SHAs are best for reproducible configuration.

`profile` selects `profiles/<profile>.yml` from the remote repository.

`materialize.memory` controls whether `.claude-remote-config/generated/CLAUDE.md` is written.

`materialize.rules` controls whether selected rules are written to `.claude/rules/claude-remote-config/`.

`materialize.settings_local` controls whether `.claude/settings.local.json` is generated from remote settings fragments.

`params` provides values for `{{ parameter_name }}` placeholders in memory and rules.

`include.tags` adds rule tags to select in addition to the profile's own tags.

`exclude.rules` removes selected rules by ID. Required rules can still fail if their `requires` checks do not pass.

## What to commit

Commit:

```text
.claude-remote-config.yml
.claude-remote-config.lock.yml
.claude/CLAUDE.md
.gitignore
```

Do not normally commit generated cache, generated memory, generated rules, or `.claude/settings.local.json`.
