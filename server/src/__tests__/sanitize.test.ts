import { sanitizePlainText, sanitizeRichText, sanitizeObject, sanitizeRequestBody } from '../utils/sanitize';
import { Request, Response, NextFunction } from 'express';

describe('sanitizePlainText', () => {
  it('strips script tags', () => {
    expect(sanitizePlainText('<script>alert(1)</script>')).toBe('');
  });

  it('strips img tags with onerror', () => {
    expect(sanitizePlainText('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('strips svg tags with onload', () => {
    expect(sanitizePlainText('<svg onload=alert(1)>')).toBe('');
  });

  it('strips javascript: URLs in links', () => {
    expect(sanitizePlainText('<a href="javascript:alert(1)">Click</a>')).toBe('Click');
  });

  it('strips all HTML tags', () => {
    expect(sanitizePlainText('<b>bold</b><i>italic</i>')).toBe('bolditalic');
  });

  it('strips iframe injection', () => {
    expect(sanitizePlainText('<iframe src="https://evil.com"></iframe>')).toBe('');
  });

  it('strips inline event handlers', () => {
    expect(sanitizePlainText('<div onclick="alert(1)">click</div>')).toBe('click');
  });

  it('strips style-based attacks', () => {
    expect(sanitizePlainText('<div style="background:url(javascript:alert(1))">text</div>')).toBe('text');
  });

  it('strips vbscript: URLs', () => {
    expect(sanitizePlainText('<a href="vbscript:msgbox(1)">click</a>')).toBe('click');
  });

  it('strips data: URLs in links', () => {
    expect(sanitizePlainText('<a href="data:text/html,<script>alert(1)</script>">click</a>')).toBe('click');
  });

  it('handles common XSS polyglots', () => {
    const payload = '"><script>alert(1)</script>';
    const result = sanitizePlainText(payload);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('returns empty string for purely malicious input', () => {
    expect(sanitizePlainText('<script>document.cookie</script>')).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizePlainText('Hello, world!')).toBe('Hello, world!');
  });
});

describe('sanitizeRichText', () => {
  it('preserves allowed tags', () => {
    const result = sanitizeRichText('<b>bold</b> <i>italic</i> <p>paragraph</p>');
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
    expect(result).toContain('<p>paragraph</p>');
  });

  it('strips script tags from rich text', () => {
    expect(sanitizeRichText('<b>safe</b><script>alert(1)</script>')).not.toContain('<script>');
  });

  it('strips event handlers from allowed tags', () => {
    const result = sanitizeRichText('<p onclick="alert(1)">text</p>');
    expect(result).not.toContain('onclick');
  });

  it('removes javascript: scheme from href', () => {
    const result = sanitizeRichText('<a href="javascript:alert(1)">link</a>');
    expect(result).not.toContain('javascript:');
  });

  it('removes data: scheme from href', () => {
    const result = sanitizeRichText('<a href="data:text/html,<script>alert(1)</script>">link</a>');
    expect(result).not.toContain('data:');
  });

  it('preserves safe href values', () => {
    const result = sanitizeRichText('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('allows code and pre tags', () => {
    const result = sanitizeRichText('<code>const x = 1;</code><pre>print("hello")</pre>');
    expect(result).toContain('<code>');
    expect(result).toContain('<pre>');
  });

  it('strips disallowed tags like img and iframe', () => {
    const result = sanitizeRichText('<img src="x"><iframe src="evil"></iframe>');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<iframe');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes all string fields in a flat object', () => {
    const obj = {
      name: '<script>alert(1)</script>John',
      bio: '<p>Hello</p>',
      age: 30,
    };
    const result = sanitizeObject(obj);
    expect(result.name).toBe('John');
    expect(result.bio).toBe('Hello');
    expect(result.age).toBe(30);
  });

  it('sanitizes nested objects recursively', () => {
    const obj = {
      profile: {
        name: '<script>alert(1)</script>Jane',
        social: {
          twitter: '<a href="javascript:alert(1)">tw</a>',
        },
      },
    };
    const result = sanitizeObject(obj);
    expect((result as any).profile.name).toBe('Jane');
    expect((result as any).profile.social.twitter).toBe('tw');
  });

  it('sanitizes arrays of strings', () => {
    const obj = {
      tags: ['<script>alert(1)</script>', '<b>bold</b>'],
    };
    const result = sanitizeObject(obj);
    expect(result.tags[0]).toBe('');
    expect(result.tags[1]).toBe('bold');
  });

  it('applies rich text sanitization to specified fields', () => {
    const obj = {
      name: '<script>alert(1)</script>John',
      content: '<b>safe</b><script>alert(1)</script>',
    };
    const result = sanitizeObject(obj, ['content']);
    expect(result.name).toBe('John');
    expect((result as any).content).toContain('<b>safe</b>');
    expect((result as any).content).not.toContain('<script>');
  });

  it('handles null and undefined values', () => {
    const obj = { name: null, bio: undefined, title: '<script>x</script>' };
    const result = sanitizeObject(obj);
    expect(result.name).toBeNull();
    expect(result.bio).toBeUndefined();
    expect(result.title).toBe('');
  });
});

describe('sanitizeRequestBody middleware', () => {
  function mockReq(body: any, query: any = {}, params: any = {}): Partial<Request> {
    return { body, query, params } as any;
  }
  function mockRes(): Partial<Response> {
    return {};
  }

  it('sanitizes req.body strings', () => {
    const req = mockReq({ name: '<script>alert(1)</script>' }) as Request;
    const next: NextFunction = jest.fn();
    sanitizeRequestBody(req, mockRes() as Response, next);
    expect(req.body.name).toBe('');
    expect(next).toHaveBeenCalled();
  });

  it('sanitizes req.query strings', () => {
    const req = mockReq({}, { search: '<script>alert(1)</script>' }) as any;
    const next: NextFunction = jest.fn();
    sanitizeRequestBody(req, mockRes() as Response, next);
    expect(req.query.search).toBe('');
  });

  it('sanitizes req.params strings', () => {
    const req = mockReq({}, {}, { id: '<script>alert(1)</script>' }) as any;
    const next: NextFunction = jest.fn();
    sanitizeRequestBody(req, mockRes() as Response, next);
    expect(req.params.id).toBe('');
  });
});
