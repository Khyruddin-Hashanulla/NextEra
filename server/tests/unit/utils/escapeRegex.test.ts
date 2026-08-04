import {
  escapeRegex,
  validateSearchInput,
  buildSafeRegex,
  buildSafeRegexPattern,
} from '../../../src/utils/escapeRegex';

describe('escapeRegex', () => {
  it('escapes all regex metacharacters', () => {
    const input = `.*+?^${'$'}()|[\\]{}`;
    const escaped = escapeRegex(input);
    for (const char of input.split('')) {
      expect(escaped).toContain(`\\${char}`);
    }
  });

  it('leaves plain alphanumeric text untouched', () => {
    expect(escapeRegex('React Hooks 101')).toBe('React Hooks 101');
  });

  it('handles empty string', () => {
    expect(escapeRegex('')).toBe('');
  });

  it('prevents regex injection patterns from matching literally', () => {
    const malicious = '.*(^$)|';
    const escaped = escapeRegex(malicious);
    expect(new RegExp(escaped).test(malicious)).toBe(true);
    expect(new RegExp(escaped).test('anything')).toBe(false);
  });
});

describe('validateSearchInput', () => {
  it('returns empty string for non-string input', () => {
    expect(validateSearchInput(undefined)).toBe('');
    expect(validateSearchInput(null)).toBe('');
    expect(validateSearchInput(123)).toBe('');
    expect(validateSearchInput({})).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(validateSearchInput('  hello  ')).toBe('hello');
  });

  it('returns empty for whitespace-only input', () => {
    expect(validateSearchInput('   ')).toBe('');
  });

  it('truncates input beyond the default max length', () => {
    const long = 'a'.repeat(250);
    const out = validateSearchInput(long);
    expect(out.length).toBe(200);
  });

  it('respects a custom max length', () => {
    const out = validateSearchInput('abcdef', { maxLength: 3 });
    expect(out).toBe('abc');
  });

  it('allows input exactly at max length', () => {
    expect(validateSearchInput('a'.repeat(200))).toHaveLength(200);
  });
});

describe('buildSafeRegex', () => {
  it('returns null for empty input', () => {
    expect(buildSafeRegex('')).toBeNull();
    expect(buildSafeRegex(undefined)).toBeNull();
    expect(buildSafeRegex('   ')).toBeNull();
  });

  it('builds a case-insensitive regex by default', () => {
    expect(buildSafeRegex('React')).toEqual({ $regex: 'React', $options: 'i' });
  });

  it('escapes metacharacters in the built regex', () => {
    expect(buildSafeRegex('a+b.c')).toEqual({ $regex: 'a\\+b\\.c', $options: 'i' });
  });

  it('supports case-sensitive matching', () => {
    expect(buildSafeRegex('React', { caseInsensitive: false })).toEqual({
      $regex: 'React',
      $options: '',
    });
  });

  it('respects max length when building', () => {
    expect(buildSafeRegex('abcdef', { maxLength: 3 })).toEqual({ $regex: 'abc', $options: 'i' });
  });
});

describe('buildSafeRegexPattern', () => {
  it('returns empty pattern for invalid input', () => {
    expect(buildSafeRegexPattern('')).toEqual({ $regex: '', $options: '' });
    expect(buildSafeRegexPattern(null)).toEqual({ $regex: '', $options: '' });
  });

  it('returns the built pattern for valid input', () => {
    expect(buildSafeRegexPattern('vue')).toEqual({ $regex: 'vue', $options: 'i' });
  });
});
