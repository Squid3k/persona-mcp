import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  TestServer,
  generateSessionId,
  createJsonRpcRequest,
  createMcpHeaders,
} from './test-helpers.js';

describe('MCP Inspector Compatibility E2E Tests', () => {
  let server: TestServer;
  const TEST_PORT = 3458;

  beforeAll(async () => {
    server = new TestServer({ port: TEST_PORT });
    await server.start();
    await server.waitForReady();
  }, 15000);

  afterAll(() => {
    server.stop();
  });

  describe('SSE Transport Handling', () => {
    it('should reject SSE transport with helpful error message', async () => {
      // Simulate MCP Inspector trying to use SSE
      const response = await request(server.getUrl())
        .get('/sse')
        .set('Accept', 'text/event-stream')
        .expect(400);

      expect(response.body).toEqual({
        error:
          'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http',
      });
    });

    it('should handle SSE POST requests with deprecation message', async () => {
      // Simulate MCP Inspector POST to SSE endpoint
      const sessionId = generateSessionId();
      const response = await request(server.getUrl())
        .post('/sse')
        .set('x-session-id', sessionId)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {},
          id: 1,
        })
        .expect(400);

      expect(response.body.error).toContain('SSE transport is deprecated');
      expect(response.body.endpoint).toBe('/mcp');
    });
  });

  describe('StreamableHTTP Transport', () => {
    it('should handle GET requests for streaming', async () => {
      const sessionId = generateSessionId();

      // StreamableHTTP uses GET for establishing connections
      const response = await request(server.getUrl())
        .get('/mcp')
        .set('x-session-id', sessionId)
        .set('Accept', 'application/json, text/event-stream');

      // The exact response depends on the transport implementation
      // We're verifying it doesn't return 404
      expect(response.status).not.toBe(404);
      // 400 might be expected for GET requests when using JSON mode
    });

    it('should require session ID for streaming connections', async () => {
      // Try to connect without session ID
      const response = await request(server.getUrl())
        .get('/mcp')
        .set('Accept', 'application/json, text/event-stream');

      // Should fail without session ID
      expect([400, 401, 405, 406]).toContain(response.status);
    });

    it('should handle POST requests with session ID', async () => {
      const sessionId = generateSessionId();

      const response = await request(server.getUrl())
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .set('x-session-id', sessionId)
        .set('Mcp-Session-Id', sessionId)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '0.1.0',
            capabilities: {},
            clientInfo: {
              name: 'mcp-inspector',
              version: '1.0.0',
            },
          },
          id: 1,
        });

      // Should not be a transport-level error
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(405);
    });
  });

  describe('CORS and Headers', () => {
    it('should handle preflight requests for MCP endpoint', async () => {
      const response = await request(server.getUrl())
        .options('/mcp')
        .set('Origin', 'http://localhost:5173') // Common MCP Inspector port
        .set('Access-Control-Request-Method', 'POST')
        .set(
          'Access-Control-Request-Headers',
          'content-type,x-session-id,mcp-session-id'
        )
        .expect(204);

      const allowedHeaders =
        response.headers['access-control-allow-headers'].toLowerCase();
      expect(allowedHeaders).toContain('x-session-id');
      expect(allowedHeaders).toContain('mcp-session-id');
      expect(allowedHeaders).toContain('content-type');
    });

    it('should expose required headers in responses', async () => {
      const sessionId = generateSessionId();

      const response = await request(server.getUrl())
        .post('/mcp')
        .set('Origin', 'http://localhost:5173')
        .set('Content-Type', 'application/json')
        .set('x-session-id', sessionId)
        .send({
          jsonrpc: '2.0',
          method: 'ping',
          id: 1,
        });

      const exposedHeaders = response.headers['access-control-expose-headers'];
      expect(exposedHeaders).toContain('Mcp-Session-Id');
      expect(exposedHeaders).toContain('x-session-id');
    });
  });

  describe('Error Handling for Inspector Edge Cases', () => {
    it('should handle missing Content-Type gracefully', async () => {
      const sessionId = generateSessionId();

      const response = await request(server.getUrl())
        .post('/mcp')
        .set('x-session-id', sessionId)
        .send('{"jsonrpc":"2.0","method":"test","id":1}');

      // Should either process the request or return a clear error
      expect(response.status).toBeLessThan(500); // Not a server error
    });

    it('should handle malformed JSON with clear error', async () => {
      const sessionId = generateSessionId();

      const response = await request(server.getUrl())
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json, text/event-stream')
        .set('x-session-id', sessionId)
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    it('should handle empty POST body', async () => {
      const sessionId = generateSessionId();

      const response = await request(server.getUrl())
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .set('x-session-id', sessionId)
        .send('');

      expect([400, 406]).toContain(response.status);
    });
  });

  describe('Inspector Connection Flow', () => {
    it('should support typical inspector connection sequence', async () => {
      // Use proper session initialization like the working tests
      const sessionId = await server.initializeMcpSession();

      // Step 1: List resources (initialization already done)
      const resourcesResponse = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(createJsonRpcRequest('resources/list', {}))
        .expect(200);

      expect(resourcesResponse.body.result?.resources).toBeDefined();

      // Step 2: List prompts
      const promptsResponse = await request(server.getUrl())
        .post('/mcp')
        .set(createMcpHeaders(sessionId))
        .send(createJsonRpcRequest('prompts/list', {}))
        .expect(200);

      expect(promptsResponse.body.result?.prompts).toBeDefined();
    });
  });
});
