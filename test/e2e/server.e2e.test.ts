import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { TestServer, getRandomPort } from './test-helpers.js';

describe('Server E2E Tests', () => {
  let server: TestServer;
  let testPort: number;

  beforeAll(async () => {
    testPort = await getRandomPort();
    server = new TestServer({ port: testPort });
    await server.start();
    await server.waitForReady();
  }, 30000);

  afterAll(async () => {
    await server.stop();
  });

  describe('Basic HTTP Endpoints', () => {
    it('should respond to health check', async () => {
      const response = await request(server.getUrl())
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        server: {
          name: 'personas-mcp',
          version: expect.any(String),
          transport: 'http',
          endpoint: '/mcp',
        },
        personas: {
          total: expect.any(Number),
          valid: expect.any(Number),
          invalid: 0,
          conflicts: 1,
        },
      });
    });

    it('should respond to root info endpoint', async () => {
      const response = await request(server.getUrl()).get('/').expect(200);

      expect(response.body).toMatchObject({
        name: 'personas-mcp',
        version: expect.any(String),
        description: expect.any(String),
        transport: 'http',
        endpoints: {
          mcp: '/mcp',
          health: '/health',
        },
        features: {
          cors: true,
          fileWatching: true,
          yamlPersonas: true,
        },
      });
    });

    it('should return 404 for non-existent endpoints', async () => {
      await request(server.getUrl()).get('/non-existent').expect(404);
    });
  });

  describe('CORS Configuration', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(server.getUrl())
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      // CORS headers should be present
      const corsOrigin = response.headers['access-control-allow-origin'];
      const corsCredentials =
        response.headers['access-control-allow-credentials'];
      const exposedHeaders = response.headers['access-control-expose-headers'];

      // At least one CORS header should be present
      expect(corsOrigin || corsCredentials || exposedHeaders).toBeTruthy();

      // If exposed headers are present, check they include our custom headers
      if (exposedHeaders) {
        expect(exposedHeaders.toLowerCase()).toContain('mcp-session-id');
        expect(exposedHeaders.toLowerCase()).toContain('x-session-id');
      }
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(server.getUrl())
        .options('/mcp')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,x-session-id')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toContain(
        'POST'
      );
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain(
        'x-session-id'
      );
    });
  });

  describe('Deprecated SSE Endpoint', () => {
    it('should return deprecation error for GET /sse', async () => {
      const response = await request(server.getUrl()).get('/sse').expect(400);

      expect(response.body).toEqual({
        error:
          'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http',
      });
    });

    it('should return deprecation error for POST /sse', async () => {
      const response = await request(server.getUrl())
        .post('/sse')
        .send({ test: 'data' })
        .expect(400);

      expect(response.body).toEqual({
        error:
          'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http',
      });
    });
  });

  describe('MCP Endpoint Basic Tests', () => {
    it('should accept GET requests to /mcp', async () => {
      // The StreamableHTTPServerTransport will handle this differently
      // We just want to ensure the endpoint exists and doesn't 404
      const response = await request(server.getUrl())
        .get('/mcp')
        .set('x-session-id', 'test-session');

      // The actual response depends on the transport implementation
      // We mainly care that it's not a 404
      expect(response.status).not.toBe(404);
    });

    it('should accept POST requests to /mcp', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .set('x-session-id', 'test-session')
        .send({
          jsonrpc: '2.0',
          method: 'test',
          params: {},
          id: 1,
        });

      // The response will depend on the MCP handler
      // We're mainly checking that the endpoint exists
      expect(response.status).not.toBe(404);
    });

    it('should handle invalid content-type for POST', async () => {
      const response = await request(server.getUrl())
        .post('/mcp')
        .set('x-session-id', 'test-session')
        .send('invalid-json');

      // Either 400 (Bad Request) or 406 (Not Acceptable) are valid error responses
      expect([400, 406]).toContain(response.status);
    });
  });

  describe('Server Configuration', () => {
    it('should run on the configured port', async () => {
      const response = await request(`http://localhost:${testPort}`)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    it('should handle server errors gracefully', async () => {
      // Send malformed JSON to trigger error handling
      const response = await request(server.getUrl())
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json, text/event-stream')
        .set('x-session-id', 'test-session')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });
});
