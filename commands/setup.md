---
description: Configure this project to use a shared remote config repository
argument-hint: --remote <remote> [--ref <ref>]
allowed-tools: Bash(claude-remote-config setup*)
---

Configure this project with Claude Remote Config.

Use the arguments exactly as provided:

```bash
claude-remote-config setup $ARGUMENTS
```

If `--remote` is missing, ask for the remote repository before running the command.

After setup succeeds, tell the user to review and commit:

```text
.claude-remote-config.json
.gitignore
```

Then tell them to restart Claude Code in this project to fetch the remote config. On restart, the plugin's `SessionStart` hook runs `init` automatically.
