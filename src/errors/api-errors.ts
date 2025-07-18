import { BaseError } from './base.js';
import { ZodError } from 'zod';

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends BaseError {
  public readonly validationErrors: Array<{
    field: string;
    message: string;
  }>;

  constructor(errors: ZodError | Array<{ field: string; message: string }>) {
    let validationErrors: Array<{ field: string; message: string }>;
    
    if (errors instanceof ZodError) {
      validationErrors = errors.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
    } else {
      validationErrors = errors;
    }

    const message = `Validation failed: ${validationErrors
      .map(e => `${e.field} - ${e.message}`)
      .join(', ')}`;

    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Error thrown when required request parameters are missing
 */
export class MissingParameterError extends BaseError {
  constructor(parameterName: string) {
    super(
      `Missing required parameter: ${parameterName}`,
      'MISSING_PARAMETER',
      400
    );
    this.name = 'MissingParameterError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  toJSON(): Record<string, unknown> {
    const json = super.toJSON();
    if (this.retryAfter) {
      json.retryAfter = this.retryAfter;
    }
    return json;
  }
}

/**
 * Error thrown for internal server errors
 */
export class InternalServerError extends BaseError {
  constructor(message = 'An internal server error occurred', originalError?: Error) {
    super(
      message,
      'INTERNAL_SERVER_ERROR',
      500,
      false // Not operational - indicates a bug
    );
    this.name = 'InternalServerError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}