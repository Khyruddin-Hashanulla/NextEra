interface ISanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedSchemes?: string[];
  disallowedTagsMode?: 'discard' | 'escape';
  allowedSchemesByTag?: Record<string, string[]>;
  allowProtocolRelative?: boolean;
  exclusiveFilter?: (frame: { tag: string; attribs: Record<string, string> }) => boolean;
}

function sanitizeHtml(input: string, options: ISanitizeOptions = {}): string {
  const { allowedTags = [], allowedAttributes = {}, disallowedTagsMode = 'discard' } = options;

  // Strip script tags and their content
  let result = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<script\b[^>]*\/?>/gi, '');

  // Strip style tags and their content
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  result = result.replace(/<style\b[^>]*\/?>/gi, '');

  // Strip iframe tags
  result = result.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  result = result.replace(/<iframe\b[^>]*\/?>/gi, '');

  // Strip svg tags with event handlers
  result = result.replace(/<svg\b[^>]*\son\w+\s*=\s*"[^"]*"[^>]*>/gi, '<svg>');
  result = result.replace(/<svg\b[^>]*\son\w+\s*=\s*'[^']*'[^>]*>/gi, '<svg>');

  // Remove event handlers from all tags
  result = result.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');

  // Remove javascript: vbscript: data: from href
  result = result.replace(/href\s*=\s*"(?:javascript|vbscript|data):[^"]*"/gi, 'href="#"');
  result = result.replace(/href\s*=\s*'(?:javascript|vbscript|data):[^']*'/gi, "href='#'");

  // Remove style-based attacks
  result = result.replace(/style\s*=\s*"[^"]*"(?=[^>]*>)/gi, (match) => {
    if (match.toLowerCase().includes('javascript') || match.toLowerCase().includes('expression')) {
      return '';
    }
    return match;
  });
  result = result.replace(/style\s*=\s*'[^']*'(?=[^>]*>)/gi, (match) => {
    if (match.toLowerCase().includes('javascript') || match.toLowerCase().includes('expression')) {
      return '';
    }
    return match;
  });

  if (allowedTags.length === 0) {
    // Strip all HTML tags
    result = result.replace(/<[^>]*>/g, '');
    return result;
  }

  // Allow only whitelisted tags
  const allowedSet = new Set(allowedTags.map((t) => t.toLowerCase()));
  result = result.replace(/<\/?(\w+)[^>]*>/gi, (match, tagName) => {
    if (allowedSet.has(tagName.toLowerCase())) {
      // For allowed tags, strip disallowed attributes
      const allowedAttrs = allowedAttributes[tagName.toLowerCase()] || [];
      const attrSet = new Set(allowedAttrs.map((a) => a.toLowerCase()));
      return match.replace(/\s+(\w+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|\S+))?/gi, (attrMatch, attrName) => {
        if (attrSet.has(attrName.toLowerCase())) {
          return attrMatch;
        }
        return '';
      });
    }
    return '';
  });

  return result;
}

export = sanitizeHtml;
