import type { InitResult } from './init.js';

export function formatExplain(result: InitResult): string {
  if (!result.manifest || !result.selection) {
    return 'claude-remote-config is not configured for this project.\n';
  }

  const rules = result.selection.rules.map((rule) => `selected rule ${rule.remotePath}`).join('\n');
  const commands = result.selection.commands.map((cmd) => `selected command ${cmd.remotePath}`).join('\n');
  const skills = result.selection.skills.map((skill) => `selected skill ${skill.name}`).join('\n');
  const skipped = result.selection.skipped.map((item) => `skipped ${item.path}: ${item.reason}`).join('\n');

  return [rules, commands, skills, skipped].filter(Boolean).join('\n') + '\n';
}
