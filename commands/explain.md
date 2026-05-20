---
description: Show which rules, commands, and skills would be applied from the remote config (dry run)
allowed-tools: Bash(claude-remote-config explain*)
---

Show what Claude Remote Config would apply to this project without writing any files.

Run the command:

```bash
claude-remote-config explain --project ${CLAUDE_PROJECT_DIR}
```

Present the output to the user, highlighting which assets are selected and which are skipped and why.
