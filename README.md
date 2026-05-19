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

- **One shared rule set**, maintained once and generated into every repository that needs it.
- **Simple filtering**, using profiles, tags, required rules, excludes, and project checks.
- **Local generated output**, keeping shared guidance consistent without overwriting human-authored Claude files.

## Quick Start

1. Install Claude Remote Config as a Claude Code plugin from your team's plugin marketplace.
2. In each project that should use the shared rules, run the setup slash command from Claude Code:

```text
/claude-remote-config setup --remote git@example.com:your-org/claude-config.git
```

3. Review and commit the project config created by the setup command:

```bash
.claude-remote-config.yml
.claude/CLAUDE.md
```

4. Restart Claude Code in the project to fetch the remote ruleset. The plugin's `SessionStart` hook syncs the pinned remote config and generates the local Claude files automatically.
5. Commit `.claude-remote-config.lock.yml` after the first successful sync.
6. And that's it 🎉.

## Docs

- [Project manifest](docs/project-manifest.md)
- [Remote repository format](docs/remote-repository.md)
- [Profiles](docs/profiles.md)
- [Rules](docs/rules.md)
- [Memory](docs/memory.md)
- [Local settings](docs/settings-local.md)
- [Commands](docs/commands.md)
- [Generated files](docs/generated-files.md)
- [Troubleshooting](docs/troubleshooting.md)

<p align="center">
  Version your Claude Code guidance once, then apply it everywhere.
</p>
