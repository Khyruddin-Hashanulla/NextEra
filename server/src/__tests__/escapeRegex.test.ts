import { escapeRegex, validateSearchInput, buildSafeRegex, buildSafeRegexPattern } from '../utils/escapeRegex';

describe('escapeRegex', () => {
  it('escapes dot', () => {
    expect(escapeRegex('hello.world')).toBe('hello\\.world');
  });

  it('escapes asterisk', () => {
    expect(escapeRegex('hello*world')).toBe('hello\\*world');
  });

  it('escapes plus', () => {
    expect(escapeRegex('hello+world')).toBe('hello\\+world');
  });

  it('escapes question mark', () => {
    expect(escapeRegex('hello?world')).toBe('hello\\?world');
  });

  it('escapes caret', () => {
    expect(escapeRegex('^hello')).toBe('\\^hello');
  });

  it('escapes dollar', () => {
    expect(escapeRegex('hello$')).toBe('hello\\$');
  });

  it('escapes curly braces', () => {
    expect(escapeRegex('hello{2,3}world')).toBe('hello\\{2,3\\}world');
  });

  it('escapes parentheses', () => {
    expect(escapeRegex('(hello)')).toBe('\\(hello\\)');
  });

  it('escapes pipe', () => {
    expect(escapeRegex('hello|world')).toBe('hello\\|world');
  });

  it('escapes square brackets', () => {
    expect(escapeRegex('[hello]')).toBe('\\[hello\\]');
  });

  it('escapes backslash', () => {
    expect(escapeRegex('hello\\world')).toBe('hello\\\\world');
  });

  it('preserves normal text', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
  });

  it('preserves alphanumeric characters', () => {
    expect(escapeRegex('Hello123')).toBe('Hello123');
  });

  it('preserves spaces and punctuation', () => {
    expect(escapeRegex("hello, how's it going?")).toBe("hello, how's it going\\?");
  });
});

describe('validateSearchInput', () => {
  it('returns empty string for non-string input', () => {
    expect(validateSearchInput(null)).toBe('');
    expect(validateSearchInput(undefined)).toBe('');
    expect(validateSearchInput(123)).toBe('');
    expect(validateSearchInput({})).toBe('');
  });

  it('trims whitespace', () => {
    expect(validateSearchInput('  hello  ')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(validateSearchInput('')).toBe('');
    expect(validateSearchInput('   ')).toBe('');
  });

  it('truncates to max length', () => {
    const long = 'a'.repeat(500);
    const result = validateSearchInput(long);
    expect(result.length).toBe(200);
    expect(result).toBe('a'.repeat(200));
  });

  it('accepts custom max length', () => {
    const long = 'a'.repeat(50);
    const result = validateSearchInput(long, { maxLength: 10 });
    expect(result.length).toBe(10);
  });

  it('preserves normal length input', () => {
    expect(validateSearchInput('hello world')).toBe('hello world');
  });
});

describe('buildSafeRegex', () => {
  it('returns null for empty input', () => {
    expect(buildSafeRegex('')).toBeNull();
    expect(buildSafeRegex('   ')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(buildSafeRegex(null)).toBeNull();
    expect(buildSafeRegex(undefined)).toBeNull();
  });

  it('builds regex with case insensitive by default', () => {
    const result = buildSafeRegex('hello');
    expect(result).toEqual({ $regex: 'hello', $options: 'i' });
  });

  it('escapes regex metacharacters in output', () => {
    const result = buildSafeRegex('hello.world');
    expect(result?.$regex).toBe('hello\\.world');
  });

  it('supports case-sensitive option', () => {
    const result = buildSafeRegex('hello', { caseInsensitive: false });
    expect(result?.$options).toBe('');
  });

  it('truncates long input', () => {
    const long = 'a'.repeat(500) + '.b';
    const result = buildSafeRegex(long);
    expect(result?.$regex.length).toBe(200);
    expect(result?.$regex).not.toContain('.b');
  });
});

describe('buildSafeRegexPattern', () => {
  it('returns empty regex for empty input', () => {
    expect(buildSafeRegexPattern('')).toEqual({ $regex: '', $options: '' });
  });

  it('returns empty regex for null input', () => {
    expect(buildSafeRegexPattern(null)).toEqual({ $regex: '', $options: '' });
  });

  it('builds pattern for valid input', () => {
    const result = buildSafeRegexPattern('search term');
    expect(result).toEqual({ $regex: 'search term', $options: 'i' });
  });
});

describe('ReDoS attack patterns', () => {
  it('escapes nested quantifier attack (a+)+b', () => {
    const result = escapeRegex('(a+)+b');
    expect(result).toBe('\\(a\\+\\)\\+b');
    expect(() => new RegExp(result)).not.toThrow();
  });

  it('escapes (a|aa)+b attack', () => {
    const result = escapeRegex('(a|aa)+b');
    expect(result).toBe('\\(a\\|aa\\)\\+b');
    expect(() => new RegExp(result)).not.toThrow();
  });

  it('escapes ([a-zA-Z]+)* attack', () => {
    const result = escapeRegex('([a-zA-Z]+)*');
    expect(result).toBe('\\(\\[a-zA-Z\\]\\+\\)\\*');
    expect(() => new RegExp(result)).not.toThrow();
  });

  it('escapes (.*){1,5} attack', () => {
    const result = escapeRegex('(.*){1,5}');
    expect(result).toBe('\\(\\.\\*\\)\\{1,5\\}');
    expect(() => new RegExp(result)).not.toThrow();
  });

  it('escapes (a+){10} attack', () => {
    const result = escapeRegex('(a+){10}');
    expect(result).toBe('\\(a\\+\\)\\{10\\}');
    expect(() => new RegExp(result)).not.toThrow();
  });

  it('escapes (a|b|c)* attack', () => {
    const result = escapeRegex('(a|b|c)*');
    expect(result).toBe('\\(a\\|b\\|c\\)\\*');
    expect(() => new RegExp(result)).not.toThrow();
  });

  it('prevents ReDoS from (a+)+b on long string', () => {
    const escaped = escapeRegex('(a+)+b');
    const start = Date.now();
    const regex = new RegExp(escaped);
    const testString = 'a'.repeat(50);
    const match = regex.test(testString);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(match).toBe(false);
  });

  it('buildSafeRegex prevents ReDoS via escaped output', () => {
    const result = buildSafeRegex('(a+)+b');
    expect(result?.$regex).not.toContain('(a+)+b');
    expect(result?.$regex).not.toContain('a+');
  });
});

describe('performance verification', () => {
  it('escapes quickly for a long normal string', () => {
    const normal = 'hello world '.repeat(100);
    const start = Date.now();
    const result = escapeRegex(normal);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(result.length).toBeGreaterThan(0);
  });

  it('buildSafeRegex handles 200 char input quickly', () => {
    const input = 'a'.repeat(200);
    const start = Date.now();
    const result = buildSafeRegex(input);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(result?.$regex.length).toBe(200);
  });
});
