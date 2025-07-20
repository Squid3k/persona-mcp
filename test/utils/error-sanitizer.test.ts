import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorSanitizer } from '../../src/utils/error-sanitizer.js';
import { BaseError, PersonaNotFoundError, InternalServerError } from '../../src/errors/index.js';

// Create simple test error classes
class TestValidationError extends BaseError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

describe('ErrorSanitizer', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  describe('Development Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });
    
    it('should return full error details for BaseError', () => {
      const error = new TestValidationError('Invalid input at /home/user/project/file.ts:42:10');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Invalid input at /home/user/project/file.ts:42:10');
      expect(sanitized.code).toBe('VALIDATION_ERROR');
      expect(sanitized.statusCode).toBe(400);
    });
    
    it('should return full error details for regular Error', () => {
      const error = new Error('Something went wrong in /Users/john/app.js');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Something went wrong in /Users/john/app.js');
      expect(sanitized.code).toBe('UNKNOWN_ERROR');
      expect(sanitized.statusCode).toBe(500);
    });
    
    it('should handle non-Error objects', () => {
      const sanitized = ErrorSanitizer.sanitize('string error');
      
      expect(sanitized.message).toBe('string error');
      expect(sanitized.code).toBe('UNKNOWN_ERROR');
      expect(sanitized.statusCode).toBe(500);
    });
  });
  
  describe('Production Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });
    
    it('should sanitize operational errors', () => {
      const error = new PersonaNotFoundError('persona-id');
      error.message = 'Resource not found at /home/user/data/file.yaml';
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Resource not found at /home/[user][file]');
      expect(sanitized.code).toBe('PERSONA_NOT_FOUND');
      expect(sanitized.statusCode).toBe(404);
    });
    
    it('should return generic message for non-operational errors', () => {
      const error = new InternalServerError('Database connection failed');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('An error occurred while processing your request');
      expect(sanitized.code).toBe('INTERNAL_ERROR');
      expect(sanitized.statusCode).toBe(500);
    });
    
    it('should return generic message for regular errors', () => {
      const error = new Error('Unexpected error with sensitive data');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('An error occurred while processing your request');
      expect(sanitized.code).toBe('INTERNAL_ERROR');
      expect(sanitized.statusCode).toBe(500);
    });
    
    it('should remove file paths from messages', () => {
      const error = new TestValidationError('Failed to load /var/lib/app/config.json');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Failed to load [path]');
    });
    
    it('should remove usernames from paths', () => {
      const error = new TestValidationError('Access denied for /Users/johndoe/documents/secret.txt');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Access denied for /Users/[user]/documents/secret.txt');
    });
    
    it('should remove stack traces', () => {
      const error = new TestValidationError('Error at processFile (/app/src/loader.ts:42:10)');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Error');
    });
    
    it('should redact potential secrets', () => {
      const error = new TestValidationError('Invalid api_key=sk-1234567890 provided');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Invalid api_key=[redacted] provided');
    });
    
    it('should redact passwords', () => {
      const error = new TestValidationError('Login failed for user with password=mysecret123');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Login failed for user with password=[redacted]');
    });
    
    it('should redact tokens', () => {
      const error = new TestValidationError('Invalid token: Bearer abc123xyz');
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Invalid token=[redacted]');
    });
    
    it('should handle multiple sensitive patterns', () => {
      const error = new TestValidationError(
        'Failed at /home/admin/app.js:10:5 with api_key=secret123 and password: pass456'
      );
      const sanitized = ErrorSanitizer.sanitize(error);
      
      expect(sanitized.message).toBe('Failed with api_key=[redacted] and password=[redacted]');
    });
  });
  
  describe('logAndSanitize', () => {
    it('should log in production and return sanitized error', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Sensitive error');
      
      const sanitized = ErrorSanitizer.logAndSanitize(error, 'test-context');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in test-context:'),
        error
      );
      expect(sanitized.message).toBe('An error occurred while processing your request');
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should not log in development', () => {
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Dev error');
      
      ErrorSanitizer.logAndSanitize(error, 'test-context');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('createHttpErrorResponse', () => {
    it('should create a structured error response', () => {
      const error = new TestValidationError('Bad request');
      const response = ErrorSanitizer.createHttpErrorResponse(error);
      
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('timestamp');
      expect(response.error.message).toBe('Bad request');
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
    
    it('should sanitize errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Internal error with /etc/passwd');
      const response = ErrorSanitizer.createHttpErrorResponse(error);
      
      expect(response.error.message).toBe('An error occurred while processing your request');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});