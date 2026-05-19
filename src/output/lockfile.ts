import { stringify } from 'yaml';

export interface LockfileInput {
  remote: string;
  /** The ref string from the manifest (e.g. v1.0.0). */
  requestedRef: string;
  /** The full SHA that ref resolved to at generation time. */
  resolvedCommit: string;
  profile: string;
  /** ISO timestamp written for human reference; excluded from frozen comparisons. */
  generatedAt: string;
  memory: Array<{ source: string }>;
  rules: Array<{ id: string; version: string; source: string }>;
  settingsLocal: Array<{ source: string }>;
}

/** Serialises the lockfile to YAML. generated_at is included for human reference only. */
export function buildLockfile(input: LockfileInput): string {
  return stringify({
    remote: input.remote,
    requested_ref: input.requestedRef,
    resolved_commit: input.resolvedCommit,
    profile: input.profile,
    generated_at: input.generatedAt,
    memory: input.memory,
    rules: input.rules,
    settings_local: input.settingsLocal,
  });
}

/** Compares lockfiles after stripping generated_at, so timestamps never cause false mismatches. */
export function assertFrozenLockfile(existing: string | null, next: string): void {
  if (normaliseLockfile(existing) !== normaliseLockfile(next)) {
    throw new Error('Frozen lockfile mismatch: generated lockfile would differ');
  }
}

function normaliseLockfile(s: string | null): string {
  return (s ?? '').replace(/^generated_at:.*$/m, '').trim();
}
