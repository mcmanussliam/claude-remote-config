import { describe, expect, it } from 'vitest';
import { compileRule, substituteParams } from '../../src/output/compiler.js';
import { mergeSettings } from '../../src/output/settings.js';

describe('compiler', () => {
  it('substitutes parameters and validates missing values', () => {
    expect(substituteParams('Use {{ package_manager }}', { package_manager: 'pnpm' })).toBe('Use pnpm');
    expect(() => substituteParams('Use {{ missing }}', {})).toThrow(/missing parameter/i);
  });

  it('compiles rules preserving only native paths frontmatter', () => {
    const output = compileRule({
      id: 'typescript.error-handling',
      paths: ['src/**/*.ts'],
      body: 'Use {{ package_manager }}',
    });

    expect(output).toContain('paths:');
    expect(output).not.toContain('priority:');
    expect(output).toContain('typescript.error-handling');
    expect(output).toContain('Use {{ package_manager }}');
  });
});

describe('mergeSettings', () => {
  it('merges settings fragments deeply', () => {
    expect(
      mergeSettings([
        { permissions: { allow: ['Bash(git status)'] }, hooks: ['a'], scalar: 'old' },
        { permissions: { allow: ['Bash(git status)', 'Read(*)'] }, hooks: ['b'], scalar: 'new' },
      ]),
    ).toEqual({
      permissions: { allow: ['Bash(git status)', 'Read(*)'] },
      hooks: ['a', 'b'],
      scalar: 'new',
    });
  });
});
