import { readFile } from 'node:fs/promises';

import { assertSafeRemoteRead } from '../config/safe-paths.js';
import { substituteParams } from '../output/compiler.js';

export async function loadMemoryFragments(
  remoteDir: string,
  sources: string[],
  params: Record<string, unknown>,
): Promise<Array<{ source: string; content: string }>> {
  return Promise.all(
    sources.map(async (source) => ({
      source,
      content: substituteParams(await readFile(assertSafeRemoteRead(remoteDir, source), 'utf8'), params),
    })),
  );
}
