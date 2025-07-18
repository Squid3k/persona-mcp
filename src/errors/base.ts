/**
 * Base error class for all custom errors in the application
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to a JSON-serializable format for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Helper type for error details
 */
export interface ErrorDetails {
  [key: string]: unknown;
}