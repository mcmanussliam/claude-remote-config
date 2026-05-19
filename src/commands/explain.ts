import type { InitResult } from './init.js';

export function formatExplain(result: InitResult): string {
  if (!result.manifest || !result.selection) {
    return 'claude-remote-config is not configured for this project.\n';
  }

  const selected = result.selection.selected.map((rule) => `selected ${rule.id} from ${rule.source}`).join('\n');
  const skipped = result.selection.skipped.map((item) => `skipped ${item.id}: ${item.reason}`).join('\n');

  return [selected, skipped].filter(Boolean).join('\n') + '\n';
}
