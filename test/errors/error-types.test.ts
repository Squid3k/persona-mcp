import { describe, it, expect } from 'vitest';
import {
  BaseError,
  PersonaNotFoundError,
  InvalidPersonaURIError,
  PersonaValidationError,
  PersonaLoadingError,
  PersonaConflictError,
  TransportNotInitializedError,
  InvalidPromptNameError,
  ServerInitializationError,
  ToolNotFoundError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  isOperationalError,
} from '../../src/errors/index.js';
import { ZodError } from 'zod';

describe('Error Types', () => {
  describe('BaseError', () => {
    class TestError extends BaseError {
      constructor() {
        super('Test error', 'TEST_ERROR', 400);
      }
    }

    it('should create error with correct properties', () => {
      const error = new TestError();
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('TestError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new TestError();
      const json = error.toJSON();
      
      expect(json).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error',
        statusCode: 400,
      });
    });

    it('should maintain stack trace', () => {
      const error = new TestError();
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError');
    });
  });

  describe('Persona Errors', () => {
    describe('PersonaNotFoundError', () => {
      it('should create error with persona ID', () => {
        const error = new PersonaNotFoundError('test-persona');
        
        expect(error.message).toBe('Persona not found: test-persona');
        expect(error.code).toBe('PERSONA_NOT_FOUND');
        expect(error.statusCode).toBe(404);
        expect(error.name).toBe('PersonaNotFoundError');
      });
    });

    describe('InvalidPersonaURIError', () => {
      it('should create error with invalid URI', () => {
        const error = new InvalidPersonaURIError('invalid://uri');
        
        expect(error.message).toContain('Invalid persona URI: invalid://uri');
        expect(error.message).toContain('Expected format: persona://[id]');
        expect(error.code).toBe('INVALID_PERSONA_URI');
        expect(error.statusCode).toBe(400);
      });
    });

    describe('PersonaValidationError', () => {
      it('should create error with validation errors', () => {
        const validationErrors = ['Missing name field', 'Invalid role'];
        const error = new PersonaValidationError('test-persona', validationErrors);
        
        expect(error.message).toContain("Validation failed for persona 'test-persona'");
        expect(error.message).toContain('Missing name field');
        expect(error.message).toContain('Invalid role');
        expect(error.validationErrors).toEqual(validationErrors);
        expect(error.statusCode).toBe(422);
      });

      it('should include validation errors in JSON', () => {
        const validationErrors = ['Error 1', 'Error 2'];
        const error = new PersonaValidationError('test', validationErrors);
        const json = error.toJSON();
        
        expect(json.validationErrors).toEqual(validationErrors);
      });
    });

    describe('PersonaLoadingError', () => {
      it('should create error with file path', () => {
        const error = new PersonaLoadingError('/path/to/persona.yaml');
        
        expect(error.message).toBe('Failed to load persona from /path/to/persona.yaml');
        expect(error.filePath).toBe('/path/to/persona.yaml');
        expect(error.statusCode).toBe(500);
      });

      it('should include original error', () => {
        const originalError = new Error('File not found');
        const error = new PersonaLoadingError('/path/to/persona.yaml', originalError);
        
        expect(error.message).toContain('File not found');
        expect(error.originalError).toBe(originalError);
      });

      it('should include file path and original error in JSON', () => {
        const originalError = new Error('Parse error');
        const error = new PersonaLoadingError('/test.yaml', originalError);
        const json = error.toJSON();
        
        expect(json.filePath).toBe('/test.yaml');
        expect(json.originalError).toBe('Parse error');
      });
    });

    describe('PersonaConflictError', () => {
      it('should create error with conflicts', () => {
        const conflicts = [
          { id: 'persona1', sources: ['user', 'project'] },
          { id: 'persona2', sources: ['default', 'user'] },
        ];
        const error = new PersonaConflictError(conflicts);
        
        expect(error.message).toContain('Persona conflicts detected');
        expect(error.message).toContain('persona1 (user vs project');
        expect(error.message).toContain('persona2 (default vs user');
        expect(error.conflicts).toEqual(conflicts);
        expect(error.statusCode).toBe(409);
      });
    });
  });

  describe('MCP Errors', () => {
    describe('TransportNotInitializedError', () => {
      it('should create error for HTTP transport', () => {
        const error = new TransportNotInitializedError('HTTP');
        
        expect(error.message).toBe('HTTP transport not initialized');
        expect(error.code).toBe('TRANSPORT_NOT_INITIALIZED');
        expect(error.statusCode).toBe(503);
      });

      it('should create error for Stdio transport', () => {
        const error = new TransportNotInitializedError('Stdio');
        
        expect(error.message).toBe('Stdio transport not initialized');
      });
    });

    describe('InvalidPromptNameError', () => {
      it('should create error with prompt name', () => {
        const error = new InvalidPromptNameError('invalid-prompt');
        
        expect(error.message).toContain('Invalid prompt name: invalid-prompt');
        expect(error.message).toContain('Expected format: adopt-persona-[id]');
        expect(error.statusCode).toBe(400);
      });
    });

    describe('ServerInitializationError', () => {
      it('should create non-operational error', () => {
        const error = new ServerInitializationError('Database connection failed');
        
        expect(error.message).toBe('Failed to initialize MCP server: Database connection failed');
        expect(error.isOperational).toBe(false);
        expect(error.statusCode).toBe(500);
      });

      it('should preserve original error stack', () => {
        const originalError = new Error('Connection timeout');
        const error = new ServerInitializationError('DB error', originalError);
        
        expect(error.stack).toBe(originalError.stack);
      });
    });

    describe('ToolNotFoundError', () => {
      it('should create error with tool name', () => {
        const error = new ToolNotFoundError('unknown-tool');
        
        expect(error.message).toBe('Unknown tool: unknown-tool');
        expect(error.code).toBe('TOOL_NOT_FOUND');
        expect(error.statusCode).toBe(404);
      });
    });
  });

  describe('API Errors', () => {
    describe('ValidationError', () => {
      it('should create error from Zod error', () => {
        const zodError = new ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['name'],
            message: 'Expected string, received number',
          },
          {
            code: 'too_small',
            minimum: 1,
            type: 'string',
            inclusive: true,
            path: ['query'],
            message: 'String must contain at least 1 character(s)',
          },
        ]);
        
        const error = new ValidationError(zodError);
        
        expect(error.message).toContain('Validation failed');
        expect(error.message).toContain('name - Expected string, received number');
        expect(error.message).toContain('query - String must contain at least 1 character(s)');
        expect(error.validationErrors).toHaveLength(2);
        expect(error.statusCode).toBe(400);
      });

      it('should create error from custom validation errors', () => {
        const customErrors = [
          { field: 'email', message: 'Invalid email format' },
          { field: 'age', message: 'Must be at least 18' },
        ];
        
        const error = new ValidationError(customErrors);
        
        expect(error.validationErrors).toEqual(customErrors);
        expect(error.message).toContain('email - Invalid email format');
        expect(error.message).toContain('age - Must be at least 18');
      });

      it('should include validation errors in JSON', () => {
        const customErrors = [{ field: 'test', message: 'Test error' }];
        const error = new ValidationError(customErrors);
        const json = error.toJSON();
        
        expect(json.validationErrors).toEqual(customErrors);
      });
    });

    describe('RateLimitError', () => {
      it('should create error with default message', () => {
        const error = new RateLimitError();
        
        expect(error.message).toBe('Too many requests');
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(error.statusCode).toBe(429);
      });

      it('should create error with custom message and retry after', () => {
        const error = new RateLimitError('Slow down!', 60);
        
        expect(error.message).toBe('Slow down!');
        expect(error.retryAfter).toBe(60);
      });

      it('should include retryAfter in JSON when provided', () => {
        const error = new RateLimitError('Limited', 30);
        const json = error.toJSON();
        
        expect(json.retryAfter).toBe(30);
      });
    });

    describe('InternalServerError', () => {
      it('should create non-operational error', () => {
        const error = new InternalServerError();
        
        expect(error.message).toBe('An internal server error occurred');
        expect(error.isOperational).toBe(false);
        expect(error.statusCode).toBe(500);
      });

      it('should preserve original error stack', () => {
        const originalError = new Error('Unexpected error');
        const error = new InternalServerError('Server crashed', originalError);
        
        expect(error.message).toBe('Server crashed');
        expect(error.stack).toBe(originalError.stack);
      });
    });
  });

  describe('Error Type Guards', () => {
    it('should identify operational errors', () => {
      const operationalError = new PersonaNotFoundError('test');
      const nonOperationalError = new InternalServerError();
      const regularError = new Error('Regular error');
      
      expect(isOperationalError(operationalError)).toBe(true);
      expect(isOperationalError(nonOperationalError)).toBe(false);
      expect(isOperationalError(regularError)).toBe(false);
    });
  });
});