import { stringify } from 'yaml';

import { memoryTemplate, ruleGeneratedComment, type MemoryTemplateInput } from './templates.js';

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

export type CompileMemoryInput = MemoryTemplateInput;

export function compileMemory(input: CompileMemoryInput): string {
  return memoryTemplate(input);
}

export interface CompileRuleInput {
  id: string;
  version: string;
  paths?: string[];
  body: string;
  params: Record<string, unknown>;
}

export function compileRule(input: CompileRuleInput): string {
  const frontmatter = input.paths?.length ? `---\n${stringify({ paths: input.paths }).trim()}\n---\n\n` : '';
  const body = substituteParams(input.body, input.params).trim();

  return `${frontmatter}${ruleGeneratedComment(input.id, input.version)}\n\n${body}\n`;
}

export function generatedRuleFilename(index: number, id: string): string {
  const slug = id.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${String(index + 1).padStart(3, '0')}-${slug}.md`;
}
