import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { PersonasMcpServer } from '../src/server.js';

describe('Server CORS Configuration', () => {
  let server: PersonasMcpServer;

  afterEach(async () => {
    if (server) {
      await server.shutdown();
    }
  });

  it('should reject requests from disallowed origins with credentials', async () => {
    server = new PersonasMcpServer({
      port: 0, // Random port
      forceHttpMode: true, // Force HTTP mode for testing
      http: {
        allowedOrigins: ['http://localhost:3000'],
      },
    });

    await server.run();

    // Get the Express app for testing
    const app = server.getExpressApp();
    if (!app) {
      throw new Error('Express app not initialized');
    }

    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.com')
      .set('Cookie', 'test=value');

    // CORS should block this
    expect(response.status).toBe(500); // CORS error
  });

  it('should allow requests from allowed origins', async () => {
    server = new PersonasMcpServer({
      port: 0, // Random port
      forceHttpMode: true,
      http: {
        allowedOrigins: ['http://localhost:3000'],
      },
    });

    await server.run();

    // Get the Express app for testing
    const app = server.getExpressApp();
    if (!app) {
      throw new Error('Express app not initialized');
    }

    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000'
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow requests with no origin', async () => {
    server = new PersonasMcpServer({
      port: 0, // Random port
      forceHttpMode: true,
      http: {
        allowedOrigins: ['http://localhost:3000'],
      },
    });

    await server.run();

    // Get the Express app for testing
    const app = server.getExpressApp();
    if (!app) {
      throw new Error('Express app not initialized');
    }

    // Request with no Origin header (like from Postman or mobile app)
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
  });

  it('should handle preflight requests correctly', async () => {
    server = new PersonasMcpServer({
      port: 0, // Random port
      forceHttpMode: true,
      http: {
        allowedOrigins: ['http://localhost:3000'],
      },
    });

    await server.run();

    // Get the Express app for testing
    const app = server.getExpressApp();
    if (!app) {
      throw new Error('Express app not initialized');
    }

    const response = await request(app)
      .options('/api/personas')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000'
    );
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain(
      'Content-Type'
    );
    expect(response.headers['access-control-max-age']).toBe('86400');
  });

  it('should work with CORS disabled', async () => {
    server = new PersonasMcpServer({
      port: 0, // Random port
      forceHttpMode: true,
      http: {
        enableCors: false,
      },
    });

    await server.run();

    // Get the Express app for testing
    const app = server.getExpressApp();
    if (!app) {
      throw new Error('Express app not initialized');
    }

    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://any-origin.com');

    expect(response.status).toBe(200);
    // No CORS headers should be present
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should use environment variable for allowed origins', async () => {
    // Environment variables are parsed in CLI, not in server directly
    // So we need to test via the config
    server = new PersonasMcpServer({
      port: 0, // Random port
      forceHttpMode: true,
      http: {
        allowedOrigins: ['http://app.example.com', 'https://test.example.com'],
      },
    });

    await server.run();

    // Get the Express app for testing
    const app = server.getExpressApp();
    if (!app) {
      throw new Error('Express app not initialized');
    }

    // Test allowed origin
    const response1 = await request(app)
      .get('/health')
      .set('Origin', 'http://app.example.com');

    expect(response1.status).toBe(200);
    expect(response1.headers['access-control-allow-origin']).toBe(
      'http://app.example.com'
    );

    // Test disallowed origin
    const response2 = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.com');

    expect(response2.status).toBe(500); // CORS error
  });
});
