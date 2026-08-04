export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorEnvelope {
  success: boolean;
  message: string;
}

export interface PaginationMeta {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export function buildApiResponse<T>(data: T, overrides: Partial<ApiResponseEnvelope<T>> = {}): ApiResponseEnvelope<T> {
  return { success: true, data, ...overrides };
}

export function buildApiError(message = 'Request failed', status = 400): ApiErrorEnvelope & { status: number } {
  return { success: false, message, status };
}

export function buildPagination(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return { page: 1, pages: 1, total: 1, limit: 12, ...overrides };
}

export function buildQueryState<T>(
  overrides: Partial<{
    data: T;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: unknown;
  }> = {}
) {
  return {
    data: undefined as T | undefined,
    isLoading: false,
    isError: false,
    isSuccess: true,
    error: null,
    ...overrides,
  };
}

export function buildMutationState<T>(
  overrides: Partial<{
    data: T | undefined;
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: unknown;
    variables: unknown;
  }> = {}
) {
  return {
    data: undefined as T | undefined,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    variables: undefined,
    mutate: (() => {}) as () => void,
    mutateAsync: (async () => undefined) as () => Promise<unknown>,
    ...overrides,
  };
}
