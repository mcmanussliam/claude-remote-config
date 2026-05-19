export const PROJECT_FILES = {
  manifest: '.claude-remote-config.yml',
  lockfile: '.claude-remote-config.lock.yml',
  gitignore: '.gitignore',
  bridgeClaude: '.claude/CLAUDE.md',
  generatedMemory: '.claude-remote-config/generated/CLAUDE.md',
  generatedMemoryDir: '.claude-remote-config/generated',
  generatedCacheDir: '.claude-remote-config/cache',
  generatedRulesDir: '.claude/rules/claude-remote-config',
  settingsLocal: '.claude/settings.local.json',
  mcpLocal: '.claude/mcp.local.json',
  agentsLocalDir: '.claude/agents.local',
  hooksLocal: '.claude/hooks.local.json',
} as const;

export const PLUGIN_DATA = {
  remotesDir: 'remotes',
  sourceDir: 'source',
} as const;

export const REMOTE_FILES = {
  config: 'claude-remote-manifest.yml',
  profilesDir: 'profiles',
  rulesGlob: 'rules/**/*.md',
} as const;

export const CLAUDE_HOOKS = {
  sessionStart: 'SessionStart',
} as const;
