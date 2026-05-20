import { ruleGeneratedComment } from './templates.js';

/** Replaces {{ key }} placeholders. Throws on any missing key. */
export function substituteParams(content: string, params: Record<string, unknown>): string {
  return content.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = params[key];

    if (value === undefined || value === null) {
      throw new Error(`Missing parameter: ${key}`);
    }

    return String(value);
  });
}

export interface CompileRuleInput {
  id: string;
  paths?: string[];
  body: string;
}

export function compileRule(input: CompileRuleInput): string {
  const frontmatter = input.paths?.length ? `${formatPathsFrontmatter(input.paths)}\n\n` : '';
  return `${frontmatter}${ruleGeneratedComment(input.id)}\n\n${input.body.trim()}\n`;
}

function formatPathsFrontmatter(paths: string[]): string {
  const lines = ['---', 'paths:', ...paths.map((path) => `  - ${JSON.stringify(path)}`), '---'];
  return lines.join('\n');
}

export function generatedRuleFilename(index: number, id: string): string {
  const slug = id
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${String(index + 1).padStart(3, '0')}-${slug}.md`;
}
