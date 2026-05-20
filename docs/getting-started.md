# Getting Started

Claude Remote Config is a Claude Code plugin plus a small CLI. Inside Claude Code, the plugin appears as `remote config`. It syncs a shared `.claude/` tree from a git repository into generated, gitignored Claude Code paths in each project.

## Install the plugin

Add the marketplace and install the plugin:

```bash
claude plugin marketplace add mcmanussliam/claude-remote-config
claude plugin install remote-config@mcmanussliam
```

For local testing without installing from a marketplace:

```bash
claude --plugin-dir /path/to/claude-remote-config
```

## Configure a project

From Claude Code, run the bundled slash command:

```bash
/remote-config setup --remote git@example.com:your-org/claude-config.git
```

`setup` creates `.claude-remote-config.json` when missing and updates `.gitignore`. Commit both files.

## Project manifest

The project manifest selects the remote, optional ref, generated output types, and tags:

```json
{
  "remote": "git@example.com:your-org/claude-config.git",
  "ref": "v1.0.0",
  "output": {
    "rules": true,
    "commands": false,
    "skills": false,
    "settingsLocal": false,
    "hooksLocal": false
  },
  "tags": []
}
```

`remote` is required. `ref` is optional; tags or commit SHAs are best for reproducible rollouts.

`output` is optional. Defaults are:

```json
{
  "rules": true,
  "commands": false,
  "skills": false,
  "settingsLocal": false,
  "hooksLocal": false
}
```

If `tags` is empty, every remote directory that passes its file requirements is included. If `tags` contains values, tagged directories must match at least one project tag. Untagged directories are always included when their file requirements pass.

## Generated paths

Generated paths are owned by this plugin and should normally stay gitignored:

```text
.claude/rules/remote/
.claude/commands/remote/
.claude/skills/remote-*/
.claude/settings.local.json
.claude/hooks.local.json
.claude-remote-config/cache/
```

The `.gitignore` block also reserves `.claude/mcp.local.json` and `.claude/agents.local/` for generated local Claude Code config. The current implementation does not write those paths.
