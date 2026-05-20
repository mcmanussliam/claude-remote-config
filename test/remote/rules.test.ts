import { describe, expect, it } from 'vitest';
import { parseRule, selectRules } from '../../src/remote/rules.js';

const projectHasTypescript = {
  files: new Set(['package.json', 'tsconfig.json']),
};

describe('rules', () => {
  it('parses rule frontmatter', () => {
    const rule = parseRule(
      'rules/typescript/error.md',
      `---
id: typescript.error-handling
title: Error handling
version: 1.2.0
tags:
  - language:typescript
paths:
  - "src/**/*.ts"
priority: 20
---
# Body
`,
    );

    expect(rule.id).toBe('typescript.error-handling');
    expect(rule.paths).toEqual(['src/**/*.ts']);
    expect(rule.body.trim()).toBe('# Body');
  });

  it('selects all rules when no tags specified', () => {
    const rules = [
      parseRule('rules/a.md', '---\nid: a\ntitle: A\nversion: 1.0.0\ntags: [x]\n---\nA'),
      parseRule('rules/b.md', '---\nid: b\ntitle: B\nversion: 1.0.0\ntags: [y]\n---\nB'),
      parseRule('rules/c.md', '---\nid: c\ntitle: C\nversion: 1.0.0\n---\nC'),
    ];

    const result = selectRules({ manifestTags: [], excludedIds: [], rules, project: projectHasTypescript });
    expect(result.selected.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('selects by tags, then excludes and sorts', () => {
    const rules = [
      parseRule(
        'rules/base/hygiene.md',
        `---
id: repo.hygiene
title: Hygiene
version: 1.0.0
tags: [concern:hygiene]
priority: 20
---
Hygiene`,
      ),
      parseRule(
        'rules/security/secrets.md',
        `---
id: security.secrets
title: Secrets
version: 1.1.0
tags: [concern:security]
priority: 10
---
Secrets`,
      ),
      parseRule(
        'rules/testing/playwright.md',
        `---
id: testing.playwright
title: Playwright
version: 1.0.0
tags: [concern:testing]
priority: 5
---
Playwright`,
      ),
    ];

    const result = selectRules({
      manifestTags: ['concern:security', 'concern:hygiene'],
      excludedIds: ['testing.playwright'],
      rules,
      project: projectHasTypescript,
    });

    expect(result.selected.map((rule) => rule.id)).toEqual(['security.secrets', 'repo.hygiene']);
    expect(result.skipped.find((item) => item.id === 'testing.playwright')?.reason).toMatch(/excluded/);
  });

  it('skips rules that fail requires checks', () => {
    const rules = [
      parseRule(
        'rules/typescript/error.md',
        `---
id: typescript.error-handling
title: Error handling
version: 1.0.0
tags: [language:typescript]
requires:
  filesAll:
    - tsconfig.json
---
Body`,
      ),
    ];

    const result = selectRules({
      manifestTags: ['language:typescript'],
      excludedIds: [],
      rules,
      project: { files: new Set(['package.json']) },
    });

    expect(result.selected).toHaveLength(0);
    expect(result.skipped[0]?.reason).toMatch(/requires/i);
  });

  it('detects conflicts', () => {
    const rules = [
      parseRule(
        'rules/a.md',
        `---
id: a
title: A
version: 1.0.0
tags: [concern:test]
conflicts_with: [b]
---
A`,
      ),
      parseRule(
        'rules/b.md',
        `---
id: b
title: B
version: 1.0.0
tags: [concern:test]
---
B`,
      ),
    ];

    expect(() =>
      selectRules({
        manifestTags: ['concern:test'],
        excludedIds: [],
        rules,
        project: projectHasTypescript,
      }),
    ).toThrow(/conflict/i);
  });
});
