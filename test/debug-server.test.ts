import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Debug Server Connection', () => {
  it('should work with plain Express app', async () => {
    const app = express();
    app.get('/test', (req, res) => {
      res.json({ success: true });
    });

    const response = await request(app).get('/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('should work with Express app from server', async () => {
    const { PersonasMcpServer } = await import('../src/server.js');
    const server = new PersonasMcpServer({
      port: 0,
      forceHttpMode: true,
    });

    await server.run();

    const app = server.getExpressApp();
    if (!app) {
      throw new Error('No app available');
    }

    // Try direct request without supertest first
    const address = server.getServerAddress();
    console.log('Server address:', address);

    // Test with supertest
    const response = await request(app).get('/health');
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    await server.shutdown();
  });
});
