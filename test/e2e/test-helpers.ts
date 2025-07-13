import { spawn, ChildProcess } from 'child_process';
import waitPort from 'wait-port';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TestServerOptions {
  port?: number;
  host?: string;
  args?: string[];
}

export class TestServer {
  private process: ChildProcess | null = null;
  private port: number;
  private host: string;

  constructor(options: TestServerOptions = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
  }

  async start(additionalArgs: string[] = []): Promise<void> {
    const serverPath = join(__dirname, '..', '..', 'dist', 'index.js');
    const args = [
      serverPath,
      '--port',
      this.port.toString(),
      '--host',
      this.host,
      ...additionalArgs,
    ];

    return new Promise((resolve, reject) => {
      this.process = spawn('node', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let serverStarted = false;
      const startTimeout = setTimeout(() => {
        if (!serverStarted) {
          this.stop();
          reject(new Error('Server failed to start within timeout'));
        }
      }, 10000);

      // Capture stderr for debugging
      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString();
        console.error(`[Server Error]: ${message}`);

        // Check if server has started
        if (message.includes('MCP server running on')) {
          serverStarted = true;
          clearTimeout(startTimeout);

          // Wait a bit more to ensure server is fully ready
          setTimeout(() => resolve(), 500);
        }
      });

      this.process.on('error', error => {
        clearTimeout(startTimeout);
        reject(error);
      });

      this.process.on('exit', (code, signal) => {
        if (!serverStarted) {
          clearTimeout(startTimeout);
          reject(
            new Error(`Server exited with code ${code} and signal ${signal}`)
          );
        }
      });
    });
  }

  async waitForReady(): Promise<void> {
    const result = await waitPort({
      host: this.host,
      port: this.port,
      timeout: 5000,
    });

    if (!result.open) {
      throw new Error(`Server did not start on ${this.host}:${this.port}`);
    }

    // Also wait for MCP server to be ready
    await this.waitForMcpReady();
  }

  async waitForMcpReady(): Promise<void> {
    const maxAttempts = 10;
    const delay = 500; // 500ms between attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.getUrl('/ready')}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          const data = (await response.json()) as {
            ready?: boolean;
            server?: string;
          };
          if (data.ready && data.server === 'connected') {
            return; // MCP server is ready
          }
        }
      } catch {
        // Ignore fetch errors and retry
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(
      `MCP server did not become ready within ${maxAttempts * delay}ms`
    );
  }

  async initializeMcpSession(): Promise<string> {
    // Send initialize request to get session ID
    const response = await fetch(`${this.getUrl('/mcp')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(createInitializeRequest()),
    });

    if (!response.ok) {
      throw new Error(
        `MCP initialization failed: ${response.status} ${response.statusText}`
      );
    }

    // Get session ID from response headers
    const sessionId =
      response.headers.get('mcp-session-id') ||
      response.headers.get('x-session-id');
    if (!sessionId) {
      throw new Error('MCP initialization did not return session ID');
    }

    return sessionId;
  }

  stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  getUrl(path: string = ''): string {
    return `http://${this.host}:${this.port}${path}`;
  }

  getPort(): number {
    return this.port;
  }
}

// Helper to create MCP-compliant JSON-RPC request
export function createJsonRpcRequest(
  method: string,
  params: Record<string, unknown> = {},
  id: string | number = 1
) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id,
  };
}

// Helper to generate session ID
export function generateSessionId(): string {
  return 'test-session-' + Math.random().toString(36).substring(2, 15);
}

// Helper to create MCP initialize request
export function createInitializeRequest(id: string | number = 1) {
  return {
    jsonrpc: '2.0' as const,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
        sampling: {},
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
    id,
  };
}

// Helper to create MCP headers
export function createMcpHeaders(sessionId?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };

  if (sessionId) {
    headers['x-session-id'] = sessionId;
    headers['mcp-session-id'] = sessionId; // Use lowercase
  }

  return headers;
}
