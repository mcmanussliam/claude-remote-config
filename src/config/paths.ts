export const PROJECT_FILES = {
  manifest: '.claude-remote-config.json',
  gitignore: '.gitignore',
  generatedCacheDir: '.claude-remote-config/cache',
  generatedRulesDir: '.claude/rules/remote',
  generatedCommandsDir: '.claude/commands/remote',
  generatedSkillsPrefix: '.claude/skills/remote-',
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
  claudeDir: '.claude',
  rulesDir: '.claude/rules',
  commandsDir: '.claude/commands',
  skillsDir: '.claude/skills',
  settings: '.claude/settings.json',
  hooks: '.claude/hooks.json',
} as const;

export const CLAUDE_HOOKS = {
  sessionStart: 'SessionStart',
} as const;
