export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T;
  public readonly meta?: Record<string, unknown>;

  constructor(success: boolean, message: string, data: T, meta?: Record<string, unknown>) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success<T>(message: string, data: T, meta?: Record<string, unknown>): ApiResponse<T> {
    return new ApiResponse(true, message, data, meta);
  }

  static created<T>(message: string, data: T): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static paginated<T>(message: string, data: T, meta: Record<string, unknown>): ApiResponse<T> {
    return new ApiResponse(true, message, data, meta);
  }
}
