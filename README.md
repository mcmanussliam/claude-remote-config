<p align="center">
  <img width="1836" height="904" alt="claude-remote-config-header" src="https://github.com/user-attachments/assets/0adb7f05-e06f-4ad3-a19f-a50f5aa1d142" />
</p>

<h1 align="center">Claude Remote Config</h1>
<p align="center">
  Shared, versioned Claude Code configuration for every project.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff" />
</p>

## Features

- **One shared `.claude/` tree**, maintained once and generated into every repository that needs it.
- **Directory filtering**, using project tags and required files.
- **Local generated output**, keeping shared guidance, commands, skills, settings, and hooks separate from human-authored Claude files.

## Quick Start

1. Add the marketplace and install the plugin. Claude displays it as `remote config`:

```bash
claude plugin marketplace add mcmanussliam/claude-remote-config
claude plugin install remote-config@mcmanussliam
```

2. In each project that should use the shared config, run the setup slash command from Claude Code:

```text
/claude-remote-config setup --remote git@example.com:your-org/claude-config.git
```

3. Review and commit the project config created by setup:

```text
.claude-remote-config.json
.gitignore
```

4. Restart Claude Code in the project. The plugin's `SessionStart` hook syncs the remote config and generates local Claude files automatically.


## Docs

- [Getting started](docs/getting-started.md)
- [Remote format](docs/remote-format.md)

<p align="center">
  Version your Claude Code guidance once, then apply it everywhere.
</p>
