import { describe, expect, it } from 'vitest';
import { parseRule, selectRules } from '../../src/remote/rules.js';

const projectHasTypescript = {
  files: new Set(['package.json', 'tsconfig.json']),
  packageJson: {
    dependencies: { typescript: '5.0.0' },
    devDependencies: {}
  }
};

describe('rules', () => {
  it('parses rule frontmatter', () => {
    const rule = parseRule('rules/typescript/error.md', `---
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
`);

    expect(rule.id).toBe('typescript.error-handling');
    expect(rule.paths).toEqual(['src/**/*.ts']);
    expect(rule.body.trim()).toBe('# Body');
  });

  it('selects by required, profile, and tags, then excludes and sorts', () => {
    const rules = [
      parseRule('rules/base/hygiene.md', `---
id: repo.hygiene
title: Hygiene
version: 1.0.0
profiles: [node-service]
priority: 20
---
Hygiene`),
      parseRule('rules/security/secrets.md', `---
id: security.secrets
title: Secrets
version: 1.1.0
tags: [concern:security]
priority: 10
---
Secrets`),
      parseRule('rules/testing/playwright.md', `---
id: testing.playwright
title: Playwright
version: 1.0.0
tags: [concern:testing]
priority: 5
---
Playwright`)
    ];

    const result = selectRules({
      profileId: 'node-service',
      requiredIds: ['repo.hygiene'],
      profileTags: [],
      manifestTags: ['concern:security'],
      excludedIds: ['testing.playwright'],
      rules,
      project: projectHasTypescript
    });

    expect(result.selected.map((rule) => rule.id)).toEqual(['security.secrets', 'repo.hygiene']);
    expect(result.skipped.find((item) => item.id === 'testing.playwright')?.reason).toMatch(/excluded/);
  });

  it('fails when a required rule does not pass requires checks', () => {
    const rules = [
      parseRule('rules/typescript/error.md', `---
id: typescript.error-handling
title: Error handling
version: 1.0.0
requires:
  files_all:
    - tsconfig.json
---
Body`)
    ];

    expect(() =>
      selectRules({
        profileId: 'node-service',
        requiredIds: ['typescript.error-handling'],
        profileTags: [],
        manifestTags: [],
        excludedIds: [],
        rules,
        project: { files: new Set(['package.json']), packageJson: {} }
      })
    ).toThrow(/required rule.*requires/i);
  });

  it('detects conflicts', () => {
    const rules = [
      parseRule('rules/a.md', `---
id: a
title: A
version: 1.0.0
profiles: [node-service]
conflicts_with: [b]
---
A`),
      parseRule('rules/b.md', `---
id: b
title: B
version: 1.0.0
profiles: [node-service]
---
B`)
    ];

    expect(() =>
      selectRules({
        profileId: 'node-service',
        requiredIds: [],
        profileTags: [],
        manifestTags: [],
        excludedIds: [],
        rules,
        project: projectHasTypescript
      })
    ).toThrow(/conflict/i);
  });
});
