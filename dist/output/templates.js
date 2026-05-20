export function hookFallbackWarning(errorMessage) {
    return `claude-remote-config warning: ${errorMessage}
Using existing generated claude-remote-config files for this session.
`;
}
export function initSummaryTemplate(manifest, resolvedCommit, selection) {
    const counts = selection
        ? `rules=${selection.rules.length}, commands=${selection.commands.length}, skills=${selection.skills.length}, skipped=${selection.skipped.length}`
        : 'selection unavailable';
    return `claude-remote-config synced ${manifest.remote} at ${resolvedCommit} (${counts})`;
}
