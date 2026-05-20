import { describe, expect, it } from 'vitest';
import { evaluateRequires, parseRequires, type ProjectFacts } from '../../src/remote/requires.js';

const project: ProjectFacts = {
  files: new Set(['package.json', 'tsconfig.json', 'vitest.config.ts']),
};

describe('requires', () => {
  it('passes when all configured gates match', () => {
    const requires = parseRequires({
      filesAll: ['package.json', 'tsconfig.json'],
      filesAny: ['vitest.config.ts', 'vitest.config.mts'],
    });

    expect(evaluateRequires(requires, project)).toEqual({ pass: true });
  });

  it('fails with a specific missing all-file reason', () => {
    const requires = parseRequires({ filesAll: ['pyproject.toml'] });

    expect(evaluateRequires(requires, project)).toEqual({
      pass: false,
      reason: 'missing required file: pyproject.toml',
    });
  });

  it('fails with a specific any-file reason', () => {
    const requires = parseRequires({ filesAny: ['jest.config.js', 'jest.config.ts'] });

    expect(evaluateRequires(requires, project)).toEqual({
      pass: false,
      reason: 'none of required files exist: jest.config.js, jest.config.ts',
    });
  });
});
