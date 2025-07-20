/**
 * Error sanitizer utility for production environments
 * Prevents leaking sensitive information in error messages
 */

import { BaseError } from '../errors/index.js';

export interface SanitizedError {
  message: string;
  code?: string;
  statusCode?: number;
}

export class ErrorSanitizer {
  private static get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
  
  /**
   * Sanitize an error for external exposure
   * In production, this replaces detailed error messages with generic ones
   * In development, it returns the full error details
   */
  static sanitize(error: unknown): SanitizedError {
    // In development, return full error details
    if (!this.isProduction) {
      if (error instanceof BaseError) {
        return {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        };
      }
      
      if (error instanceof Error) {
        return {
          message: error.message,
          code: 'UNKNOWN_ERROR',
          statusCode: 500,
        };
      }
      
      return {
        message: String(error),
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
      };
    }
    
    // In production, sanitize based on error type
    if (error instanceof BaseError) {
      // Only expose user-facing errors
      if (error.isOperational) {
        return {
          message: this.sanitizeMessage(error.message),
          code: error.code,
          statusCode: error.statusCode,
        };
      }
    }
    
    // For all other errors in production, return generic message
    return {
      message: 'An error occurred while processing your request',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }
  
  /**
   * Sanitize a message by removing sensitive information
   */
  private static sanitizeMessage(message: string): string {
    // Remove potential usernames first (more specific patterns)
    message = message.replace(/\/home\/\w+/gi, '/home/[user]');
    message = message.replace(/\/Users\/\w+/gi, '/Users/[user]');
    
    // Remove full absolute paths that don't have usernames
    message = message.replace(/\/(var|etc|usr|lib|opt|tmp)\/([\w-/.])+/gi, '[path]');
    
    // Remove file paths with extensions
    message = message.replace(/(?<!\/)\/([\w-/.])+\.(js|ts|json|yaml|yml)/gi, '[file]');
    
    // Remove stack traces
    message = message.replace(/\s+at\s+.+\(.+\)/gi, '');
    message = message.replace(/\s+at\s+.+:\d+:\d+/gi, '');
    
    // Remove line numbers
    message = message.replace(/:\d+:\d+/g, ':[line]:[column]');
    
    // Remove potential secrets (basic patterns)
    message = message.replace(/api[_-]?key[\s=:]+[\w-]+/gi, 'api_key=[redacted]');
    message = message.replace(/password[\s=:]+[\w-]+/gi, 'password=[redacted]');
    message = message.replace(/token:?\s*(Bearer\s+)?[\w-.]+/gi, 'token=[redacted]');
    
    return message.trim();
  }
  
  /**
   * Log error details securely
   * Full details go to logs, sanitized version is returned
   */
  static logAndSanitize(error: unknown, context?: string): SanitizedError {
    // Log full error details (these should go to secure logs)
    if (this.isProduction) {
      console.error(`[${new Date().toISOString()}] Error in ${context || 'unknown context'}:`, error);
    }
    
    // Return sanitized version for external use
    return this.sanitize(error);
  }
  
  /**
   * Create a safe error response for HTTP endpoints
   */
  static createHttpErrorResponse(error: unknown): {
    error: SanitizedError;
    timestamp: string;
  } {
    return {
      error: this.sanitize(error),
      timestamp: new Date().toISOString(),
    };
  }
}