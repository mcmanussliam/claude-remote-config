---
description: Check the health of this project's Claude Remote Config setup
allowed-tools: Bash(claude-remote-config doctor*)
---

Check the Claude Remote Config configuration for this project.

Run the command:

```bash
claude-remote-config doctor --project ${CLAUDE_PROJECT_DIR}
```

Report the results to the user. If anything is missing, explain what it means and suggest running `/remote-config sync` to regenerate files, or `/remote-config setup` if the project has not been configured yet.
