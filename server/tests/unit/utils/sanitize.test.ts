import {
  sanitizePlainText,
  sanitizeRichText,
  sanitizeString,
  sanitizeObject,
  sanitizeRequestBody,
} from '../../../src/utils/sanitize';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

describe('sanitizePlainText', () => {
  it('strips all HTML tags', () => {
    expect(sanitizePlainText('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('removes attributes and scripts', () => {
    expect(sanitizePlainText('<a href="javascript:alert(1)">click</a>')).toBe('click');
  });

  it('trims whitespace', () => {
    expect(sanitizePlainText('  spaced  ')).toBe('spaced');
  });
});

describe('sanitizeRichText', () => {
  it('keeps allowed rich text tags', () => {
    expect(sanitizeRichText('<p>Hello <strong>world</strong></p>')).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('discards disallowed tags', () => {
    expect(sanitizeRichText('<p>Safe</p><script>alert(1)</script><img src="x">')).toBe('<p>Safe</p>');
  });

  it('blocks javascript: hrefs', () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript:');
  });

  it('blocks data: hrefs', () => {
    const out = sanitizeRichText('<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>');
    expect(out).not.toContain('data:');
  });

  it('blocks vbscript: hrefs', () => {
    const out = sanitizeRichText('<a href="vbscript:msgbox(1)">x</a>');
    expect(out).not.toContain('vbscript:');
  });

  it('allows safe http links', () => {
    expect(sanitizeRichText('<a href="https://example.com">ok</a>')).toBe('<a href="https://example.com">ok</a>');
  });
});

describe('sanitizeString', () => {
  it('plain text by default', () => {
    expect(sanitizeString('<b>hi</b>')).toBe('hi');
  });

  it('rich text when requested', () => {
    expect(sanitizeString('<b>hi</b>', true)).toBe('<b>hi</b>');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes string values recursively', () => {
    const out = sanitizeObject({
      title: '<b>Hello</b>',
      nested: { desc: '<i>x</i>' },
      list: ['<i>a</i>'],
    });
    expect(out.title).toBe('Hello');
    expect(out.nested.desc).toBe('x');
    expect(out.list).toEqual(['a']);
  });

  it('leaves non-string values intact', () => {
    const out = sanitizeObject({ count: 3, ok: true, nothing: null });
    expect(out).toEqual({ count: 3, ok: true, nothing: null });
  });

  it('preserves rich text for listed fields', () => {
    const out = sanitizeObject({ content: '<p>Hi</p>' }, ['content']);
    expect(out.content).toBe('<p>Hi</p>');
  });

  it('strips rich text when the field is not whitelisted', () => {
    const out = sanitizeObject({ content: '<p>Hi</p>' }, []);
    expect(out.content).toBe('Hi');
  });
});

describe('sanitizeRequestBody middleware', () => {
  it('sanitizes body, query and params then calls next', () => {
    const req = mockRequest({
      body: { title: '<b>Course</b>', content: '<p>Body</p>' },
      query: { q: '<b>alert(1)</b>' },
      params: { id: '<i>abc</i>' },
    });
    const res = mockResponse();
    const next = mockNext();

    sanitizeRequestBody(req, res, next);

    expect(req.body).toEqual({ title: 'Course', content: '<p>Body</p>' });
    expect(req.query).toEqual({ q: 'alert(1)' });
    expect(req.params).toEqual({ id: 'abc' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('removes script content from plain text fields', () => {
    const req = mockRequest({
      body: { desc: '<script>alert(1)</script>' },
      query: {},
      params: {},
    });
    sanitizeRequestBody(req, mockResponse(), mockNext());
    expect(req.body.desc).toBe('');
  });

  it('does not fail when body is not an object', () => {
    const req = mockRequest({ body: undefined, query: {}, params: {} });
    const next = mockNext();
    sanitizeRequestBody(req, mockResponse(), next);
    expect(next).toHaveBeenCalledOnce();
  });
});
