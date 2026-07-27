export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  message: string;
  stack?: string;
}
