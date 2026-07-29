const REGEX_METACHARACTERS = /[.*+?^${}()|[\]\\]/g;
const MAX_SEARCH_LENGTH = 200;

export function escapeRegex(input: string): string {
  return input.replace(REGEX_METACHARACTERS, '\\$&');
}

export interface SafeRegexOptions {
  maxLength?: number;
  caseInsensitive?: boolean;
}

export function validateSearchInput(
  input: unknown,
  options?: SafeRegexOptions
): string {
  const maxLength = options?.maxLength ?? MAX_SEARCH_LENGTH;

  if (typeof input !== 'string') {
    return '';
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return '';
  }

  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }

  return trimmed;
}

export function buildSafeRegex(
  input: unknown,
  options?: SafeRegexOptions
): { $regex: string; $options: string } | null {
  const validated = validateSearchInput(input, options);

  if (!validated) {
    return null;
  }

  const escaped = escapeRegex(validated);
  const caseInsensitive = options?.caseInsensitive ?? true;

  return {
    $regex: escaped,
    $options: caseInsensitive ? 'i' : '',
  };
}

export function buildSafeRegexPattern(
  input: unknown,
  options?: SafeRegexOptions
): { $regex: string; $options: string } {
  const built = buildSafeRegex(input, options);
  if (!built) {
    return { $regex: '', $options: '' };
  }
  return built;
}
