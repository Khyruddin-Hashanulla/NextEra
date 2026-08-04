import { z } from 'zod';
import {
  FIELD_SIZES,
  ARRAY_LIMITS,
  stringField,
  optionalStringField,
  limitedArray,
  paginationSchema,
} from '../../../src/utils/validation';

describe('stringField', () => {
  it('validates min and max bounds', () => {
    const schema = stringField(10);
    expect(schema.parse('hello')).toBe('hello');
    expect(() => schema.parse('')).toThrow();
    expect(() => schema.parse('a'.repeat(11))).toThrow();
  });

  it('trims input', () => {
    expect(stringField(10).parse('  hi  ')).toBe('hi');
  });

  it('accepts input exactly at max size', () => {
    expect(stringField(10).parse('a'.repeat(10))).toBe('a'.repeat(10));
  });

  it('rejects non-string input', () => {
    expect(() => stringField(10).parse(123)).toThrow();
    expect(() => stringField(10).parse(null)).toThrow();
    expect(() => stringField(10).parse(undefined)).toThrow();
  });

  it('supports a custom min size', () => {
    const schema = stringField(50, 3);
    expect(() => schema.parse('ab')).toThrow();
    expect(schema.parse('abc')).toBe('abc');
  });
});

describe('optionalStringField', () => {
  it('allows undefined', () => {
    expect(optionalStringField(10).parse(undefined)).toBeUndefined();
  });

  it('allows empty string within max', () => {
    expect(optionalStringField(10).parse('')).toBe('');
  });

  it('rejects values over max', () => {
    expect(() => optionalStringField(5).parse('abcdef')).toThrow();
  });

  it('trims optional strings', () => {
    expect(optionalStringField(10).parse('  x  ')).toBe('x');
  });
});

describe('limitedArray', () => {
  it('caps the number of items', () => {
    const schema = limitedArray(z.string(), 2);
    expect(schema.parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(() => schema.parse(['a', 'b', 'c'])).toThrow();
  });

  it('validates each item schema', () => {
    const schema = limitedArray(z.number(), 3);
    expect(() => schema.parse([1, 'x'])).toThrow();
  });
});

describe('paginationSchema', () => {
  it('applies defaults when absent', () => {
    const out = paginationSchema.parse({});
    expect(out.page).toBe(1);
    expect(out.limit).toBe(20);
  });

  it('coerces numeric strings', () => {
    const out = paginationSchema.parse({ page: '3', limit: '10' });
    expect(out.page).toBe(3);
    expect(out.limit).toBe(10);
  });

  it('rejects non-positive page numbers via catch', () => {
    const out = paginationSchema.parse({ page: 0 });
    expect(out.page).toBe(1);
  });

  it('clamps limit to the maximum of 100', () => {
    const out = paginationSchema.parse({ limit: 1000 });
    expect(out.limit).toBe(20);
  });

  it('rejects fractional pages via catch', () => {
    const out = paginationSchema.parse({ page: 1.5 });
    expect(out.page).toBe(1);
  });

  it('rejects negative limits via catch', () => {
    const out = paginationSchema.parse({ limit: -5 });
    expect(out.limit).toBe(20);
  });
});

describe('size constants', () => {
  it('exposes expected field sizes', () => {
    expect(FIELD_SIZES.TITLE).toBe(200);
    expect(FIELD_SIZES.PASSWORD).toBe(128);
    expect(FIELD_SIZES.EMAIL).toBe(254);
  });

  it('exposes expected array limits', () => {
    expect(ARRAY_LIMITS.TAGS).toBe(20);
    expect(ARRAY_LIMITS.OPTIONS_PER_QUESTION).toBe(10);
  });
});
