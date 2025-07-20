import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  TestServer,
  createJsonRpcRequest,
  createMcpHeaders,
  getRandomPort,
} from './test-helpers.js';

describe('MCP Protocol E2E Tests', () => {
  let server: TestServer;
  let testPort: number;
  let sessionId: string;

  beforeAll(async () => {
    testPort = await getRandomPort();
    server = new TestServer({ port: testPort });
    await server.start();
    await server.waitForReady();
    sessionId = await server.initializeMcpSession();
  }, 30000);

  afterAll(async () => {
    await server.stop();
  });

  describe('List Resources', () => {
    it('should list all persona resources', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(createJsonRpcRequest('resources/list', {}))
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        result: {
          resources: expect.arrayContaining([
            expect.objectContaining({
              uri: expect.stringMatching(/^persona:\/\/\w+$/),
              name: expect.any(String),
              description: expect.any(String),
              mimeType: 'application/json',
            }),
          ]),
        },
      });

      // Should have at least the default personas
      expect(response.body.result.resources.length).toBeGreaterThanOrEqual(4);
    });

    it('should return error for missing session ID', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json, text/event-stream')
        .send(createJsonRpcRequest('resources/list', {}))
        .expect(400);

      // The exact error format depends on the transport implementation
      expect(response.status).toBe(400);
    });
  });

  describe('Read Resource', () => {
    it('should read a specific persona resource', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(
          createJsonRpcRequest('resources/read', { uri: 'persona://architect' })
        )
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        result: {
          contents: [
            {
              uri: 'persona://architect',
              mimeType: 'application/json',
              text: expect.any(String),
            },
          ],
        },
      });

      // Verify the content is valid JSON
      const personaData = JSON.parse(
        response.body.result.contents[0].text as string
      ) as Record<string, unknown>;
      expect(personaData).toMatchObject({
        id: 'architect',
        name: 'Software Architect',
        role: expect.any(String),
        core: {
          identity: expect.any(String),
          primaryObjective: expect.any(String),
          constraints: expect.any(Array),
        },
        behavior: {
          mindset: expect.any(Array),
          methodology: expect.any(Array),
          priorities: expect.any(Array),
          antiPatterns: expect.any(Array),
        },
        expertise: {
          domains: expect.any(Array),
          skills: expect.any(Array),
        },
        decisionCriteria: expect.any(Array),
        examples: expect.any(Array),
        tags: expect.any(Array),
      });
    });

    it('should return error for invalid persona URI', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(createJsonRpcRequest('resources/read', { uri: 'invalid://test' }))
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        error: expect.objectContaining({
          code: expect.any(Number),
          message: expect.stringContaining('Invalid persona URI'),
        }),
      });
    });

    it('should return error for non-existent persona', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(
          createJsonRpcRequest('resources/read', {
            uri: 'persona://non-existent',
          })
        )
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        error: expect.objectContaining({
          code: expect.any(Number),
          message: expect.stringContaining('Persona not found'),
        }),
      });
    });
  });

  describe('List Prompts', () => {
    it('should list all persona adoption prompts', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(createJsonRpcRequest('prompts/list', {}))
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        result: {
          prompts: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringMatching(/^adopt-persona-\w+$/),
              description: expect.stringContaining('Adopt the'),
              arguments: expect.arrayContaining([
                expect.objectContaining({
                  name: 'context',
                  description: expect.any(String),
                  required: false,
                }),
              ]),
            }),
          ]),
        },
      });

      expect(response.body.result.prompts.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Get Prompt', () => {
    it('should get a specific persona prompt without context', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(
          createJsonRpcRequest('prompts/get', {
            name: 'adopt-persona-developer',
            arguments: {},
          })
        )
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        result: {
          description: expect.stringContaining('Developer persona'),
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: expect.stringContaining('craftsperson'),
              },
            },
          ],
        },
      });
    });

    it('should get a specific persona prompt with context', async () => {
      const context = 'Build a REST API for user management';
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(
          createJsonRpcRequest('prompts/get', {
            name: 'adopt-persona-developer',
            arguments: { context },
          })
        )
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        result: {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: expect.stringContaining(context),
              },
            },
          ],
        },
      });
    });

    it('should return error for invalid prompt name', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(
          createJsonRpcRequest('prompts/get', {
            name: 'invalid-prompt-name',
            arguments: {},
          })
        )
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        error: expect.objectContaining({
          code: expect.any(Number),
          message: expect.stringContaining('Invalid prompt name'),
        }),
      });
    });

    it('should return error for non-existent persona in prompt', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(
          createJsonRpcRequest('prompts/get', {
            name: 'adopt-persona-nonexistent',
            arguments: {},
          })
        )
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        error: expect.objectContaining({
          code: expect.any(Number),
          message: expect.stringContaining('Persona not found'),
        }),
      });
    });
  });

  describe('Invalid Requests', () => {
    it('should handle malformed JSON-RPC requests', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send({ invalid: 'request' })
        .expect(400); // Malformed requests should return 400 Bad Request

      // The server correctly rejects malformed requests with a 400 status
      // Response body parsing may fail due to supertest handling of 400 responses
      expect(response.status).toBe(400);
    });

    it('should handle unknown methods', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(createJsonRpcRequest('unknown/method', {}))
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        error: expect.objectContaining({
          code: -32601, // Method not found
          message: expect.any(String),
        }),
      });
    });

    it('should handle missing required parameters', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(createJsonRpcRequest('resources/read', {})) // Missing uri parameter
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        error: expect.objectContaining({
          code: -32603, // Internal error (parameter validation failure)
          message: expect.any(String),
        }),
      });
    });
  });

  describe('Batch Requests', () => {
    it('should handle batch JSON-RPC requests', async () => {
      const batchRequest = [
        createJsonRpcRequest('resources/list', {}, 1),
        createJsonRpcRequest('prompts/list', {}, 2),
      ];

      const response = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(batchRequest)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(1);
      expect(response.body[1].id).toBe(2);
    });
  });
});
