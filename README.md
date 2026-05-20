<p align="center">
  <img width="700" height="450" alt="image" src="/assets/README-header.gif">
</p>

<h1 align="center">Claude Remote Config</h1>
<p align="center">
  Shared, versioned Claude Code configuration for every project.
</p>

## Features

- **One shared config repository**, maintained once and pulled into every
  project that needs it.
- **Tag and path filtering**, include only the rules, commands, and skills each
  project needs.
- **Fully generated output**, shared Claude files stay separate from your own so
  nothing gets overwritten.

## Quick Start

1. Install the plugin:

```bash
claude plugin marketplace add mcmanussliam/claude-remote-config
claude plugin install remote-config@mcmanussliam
```

2. In each project, run the setup command from Claude Code:

```bash
/remote-config setup --remote git@example.com:your-org/claude-config.git
```

3. Commit the files setup created:

```txt
.claude-remote-config.json
.gitignore
```

4. Restart Claude Code. The plugin syncs and regenerates your config
   automatically on every session start.
5. And that's it 🎉

## Docs

- [Getting started](docs/getting-started.md)
- [Remote format](docs/remote-format.md)
