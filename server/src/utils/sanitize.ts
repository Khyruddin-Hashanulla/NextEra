import sanitizeHtml from 'sanitize-html';
import { Request, Response, NextFunction } from 'express';

const RICH_TEXT_ALLOWED_TAGS = [
  'b', 'strong', 'i', 'em', 'u', 's',
  'ul', 'ol', 'li',
  'a', 'p', 'code', 'pre', 'br',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'hr', 'sub', 'sup',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span',
];

const RICH_TEXT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel', 'title'],
  span: ['class', 'style'],
  code: ['class'],
  pre: ['class'],
  th: ['style', 'colspan', 'rowspan'],
  td: ['style', 'colspan', 'rowspan'],
};

const RICH_TEXT_ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizePlainText(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: RICH_TEXT_ALLOWED_TAGS,
    allowedAttributes: RICH_TEXT_ALLOWED_ATTRIBUTES,
    allowedSchemes: RICH_TEXT_ALLOWED_SCHEMES,
    disallowedTagsMode: 'discard',
    allowedSchemesByTag: { a: ['http', 'https', 'mailto'] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => {
      if (frame.tag === 'a') {
        const href = (frame.attribs?.href || '').toLowerCase();
        if (href.startsWith('javascript:') || href.startsWith('vbscript:') || href.startsWith('data:')) {
          return true;
        }
      }
      return false;
    },
  }).trim();
}

export function sanitizeString(input: string, isRichText = false): string {
  return isRichText ? sanitizeRichText(input) : sanitizePlainText(input);
}

function walkAndSanitize(value: unknown, richTextFields: Set<string>, parentKey = ''): unknown {
  if (isString(value)) {
    const isRich = richTextFields.has(parentKey);
    return sanitizeString(value, isRich);
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => walkAndSanitize(item, richTextFields, parentKey));
  }
  if (isObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = walkAndSanitize(val, richTextFields, key);
    }
    return result;
  }
  return value;
}

export function sanitizeObject<T>(obj: T, richTextFieldNames: string[] = []): T {
  const richSet = new Set(richTextFieldNames);
  return walkAndSanitize(obj, richSet) as T;
}

const RICH_TEXT_FIELDS = [
  'content', 'articleContent', 'description', 'body', 'answer',
  'message', 'agenda', 'notes', 'welcomeMessage', 'congratulationMessage',
  'adminNote', 'reason', 'reply', 'instructions', 'explanation',
  'solutionApproach', 'instructorSolution', 'feedback',
];

export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body, RICH_TEXT_FIELDS);
  }
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(req.query)) {
      sanitizedQuery[key] = isString(val) ? sanitizePlainText(val) : val;
    }
    req.query = sanitizedQuery as any;
  }
  if (req.params && typeof req.params === 'object') {
    const sanitizedParams: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(req.params)) {
      sanitizedParams[key] = isString(val) ? sanitizePlainText(val) : val;
    }
    req.params = sanitizedParams as any;
  }
  next();
}
