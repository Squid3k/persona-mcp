import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { PersonasMcpServer } from '../src/server.js';
import {
  PersonaNotFoundError,
  InvalidPersonaURIError,
  ValidationError,
  errorHandler,
} from '../src/errors/index.js';
import { ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Server Error Handling', () => {
  let app: express.Application;
  let server: PersonasMcpServer;

  beforeEach(async () => {
    server = new PersonasMcpServer({ port: 0 });
    await server.initialize();

    // Create a test Express app with error handling
    app = express();
    app.use(express.json());

    // Add test routes that throw our custom errors
    app.get('/test/persona-not-found', () => {
      throw new PersonaNotFoundError('missing-persona');
    });

    app.get('/test/invalid-uri', () => {
      throw new InvalidPersonaURIError('bad://uri');
    });

    app.post('/test/validation-error', () => {
      throw new ValidationError([
        { field: 'name', message: 'Required field' },
        { field: 'age', message: 'Must be a number' },
      ]);
    });

    app.get('/test/generic-error', () => {
      throw new Error('Something went wrong');
    });

    // Add our error handler
    app.use(errorHandler);
  });

  describe('Custom Error Responses', () => {
    it('should handle PersonaNotFoundError', async () => {
      const response = await request(app)
        .get('/test/persona-not-found')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        code: 'PERSONA_NOT_FOUND',
        error: 'Persona not found: missing-persona',
        timestamp: expect.any(String),
      });
    });

    it('should handle InvalidPersonaURIError', async () => {
      const response = await request(app).get('/test/invalid-uri').expect(400);

      expect(response.body).toEqual({
        success: false,
        code: 'INVALID_PERSONA_URI',
        error: expect.stringContaining('Invalid persona URI: bad://uri'),
        timestamp: expect.any(String),
      });
    });

    it('should handle ValidationError', async () => {
      const response = await request(app)
        .post('/test/validation-error')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        code: 'VALIDATION_ERROR',
        error: expect.stringContaining('Validation failed'),
        timestamp: expect.any(String),
      });
    });

    it('should handle generic errors in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/test/generic-error')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'An error occurred while processing your request',
        timestamp: expect.any(String),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/test/generic-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        code: 'UNKNOWN_ERROR',
        error: 'Something went wrong',
        timestamp: expect.any(String),
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('MCP Protocol Error Handling', () => {
    it('should return proper error for invalid persona URI', async () => {
      const mockServer = {
        setRequestHandler: vi.fn(),
      };

      // Mock the persona manager
      const mockPersonaManager = {
        getPersona: vi.fn().mockReturnValue(null),
      };

      // Test the actual error handling in the request handler
      const handlers = new Map();
      mockServer.setRequestHandler.mockImplementation((schema, handler) => {
        handlers.set(schema, handler);
      });

      // Simulate setting up handlers
      const serverInstance = new PersonasMcpServer({ port: 0 });
      serverInstance['server'] = mockServer as any;
      serverInstance['personaManager'] = mockPersonaManager as any;
      serverInstance['setupHandlers']();

      // Get the ReadResource handler
      const handler = handlers.get(ReadResourceRequestSchema);

      // Test invalid URI
      await expect(
        handler({ params: { uri: 'invalid://test' } })
      ).rejects.toThrow(InvalidPersonaURIError);

      // Test missing persona
      await expect(
        handler({ params: { uri: 'persona://missing' } })
      ).rejects.toThrow(PersonaNotFoundError);
    });
  });
});
