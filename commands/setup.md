---
description: Configure this project to use a shared claude-remote-config repository
argument-hint: --remote <repo> [--ref <ref>] [--profile <profile>]
allowed-tools: Bash(claude-remote-config setup:*)
---

Configure this project with Claude Remote Config.

Use the arguments exactly as provided:

```bash
claude-remote-config setup $ARGUMENTS
```

If `--remote` is missing, ask for the remote repository before running the command.

If `--ref` is missing, add `--ref v1.0.0`.

If `--profile` is missing, add `--profile node-service`.

After setup succeeds, tell the user to review and commit:

```text
.claude-remote-config.yml
.claude/CLAUDE.md
.gitignore
```

Then tell them to restart Claude Code in this project to fetch the remote ruleset. On restart, the plugin's `SessionStart` hook runs `init` automatically.
