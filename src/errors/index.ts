/**
 * Central export point for all error types
 */

// Base error
export { BaseError, type ErrorDetails } from './base.js';

// Import BaseError for use in this file
import { BaseError } from './base.js';

// Persona-related errors
export {
  PersonaNotFoundError,
  InvalidPersonaURIError,
  PersonaValidationError,
  PersonaLoadingError,
  PersonaConflictError,
} from './persona-errors.js';

// MCP protocol errors
export {
  TransportNotInitializedError,
  InvalidPromptNameError,
  ServerInitializationError,
  ServerShutdownError,
  ToolNotFoundError,
  InvalidResourceRequestError,
} from './mcp-errors.js';

// API errors
export {
  ValidationError,
  MissingParameterError,
  RateLimitError,
  InternalServerError,
} from './api-errors.js';

/**
 * Type guard to check if an error is one of our custom errors
 */
export function isOperationalError(error: unknown): error is BaseError {
  return error instanceof BaseError && error.isOperational;
}

/**
 * Error handler middleware for Express
 */
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log non-operational errors (bugs)
  if (!(error instanceof BaseError) || !error.isOperational) {
    console.error('Unexpected error:', error);
  }

  // Determine status code and message
  let statusCode = 500;
  let errorResponse: Record<string, unknown> = {
    success: false,
    error: 'Internal server error',
  };

  if (error instanceof BaseError) {
    statusCode = error.statusCode;
    errorResponse = {
      success: false,
      ...error.toJSON(),
    };
  } else if (error instanceof Error) {
    // In development, include stack traces for debugging
    if (process.env.NODE_ENV === 'development') {
      errorResponse = {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  res.status(statusCode).json(errorResponse);
}
