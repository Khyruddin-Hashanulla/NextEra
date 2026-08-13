export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(statusCode: number, message: string, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, true, code);
  }

  static unauthorized(message: string, code?: string): ApiError {
    return new ApiError(401, message, true, code);
  }

  static forbidden(message: string, code?: string): ApiError {
    return new ApiError(403, message, true, code);
  }

  static notFound(message: string, code?: string): ApiError {
    return new ApiError(404, message, true, code);
  }

  static conflict(message: string, code?: string): ApiError {
    return new ApiError(409, message, true, code);
  }

  static tooManyRequests(message: string, code?: string): ApiError {
    return new ApiError(429, message, true, code);
  }

  static internal(message: string, code?: string): ApiError {
    return new ApiError(500, message, false, code);
  }
}
