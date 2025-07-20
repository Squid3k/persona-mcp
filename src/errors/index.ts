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
  PathTraversalError,
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
import { ErrorSanitizer } from '../utils/error-sanitizer.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log non-operational errors (bugs)
  if (!(error instanceof BaseError) || !error.isOperational) {
    // Use logAndSanitize to securely log the error
    ErrorSanitizer.logAndSanitize(error, `${req.method} ${req.path}`);
  }

  // Get sanitized error response
  const httpResponse = ErrorSanitizer.createHttpErrorResponse(error);
  const sanitizedError = httpResponse.error;
  
  // Use the status code from the sanitized error
  const statusCode = sanitizedError.statusCode || 500;
  
  // Create the response object
  const errorResponse: Record<string, unknown> = {
    success: false,
    error: sanitizedError.message,
    code: sanitizedError.code,
    timestamp: httpResponse.timestamp,
  };

  res.status(statusCode).json(errorResponse);
}
