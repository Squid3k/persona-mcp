import { spawn, ChildProcess } from 'child_process';
import waitPort from 'wait-port';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'net';

// AbortController is available in Node.js 16+
declare const AbortController: typeof globalThis.AbortController;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TestServerOptions {
  port?: number;
  host?: string;
  args?: string[];
}

// Utility to get a random available port
export async function getRandomPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const address = server.address() as { port: number } | null;
      const port = address?.port;
      server.close(error => {
        if (error) {
          reject(error);
        } else if (port) {
          resolve(port);
        } else {
          reject(new Error('Failed to get random port'));
        }
      });
    });
    server.on('error', reject);
  });
}

// Check if a port is available
export async function checkPortAvailable(
  port: number,
  host: string = 'localhost'
): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer();
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

export class TestServer {
  private process: ChildProcess | null = null;
  private port: number;
  private host: string;

  constructor(options: TestServerOptions = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
  }

  // Set port dynamically (useful for dynamic allocation)
  setPort(port: number): void {
    this.port = port;
  }

  async start(additionalArgs: string[] = []): Promise<void> {
    // Check if port is available first
    const isPortAvailable = await checkPortAvailable(this.port, this.host);
    if (!isPortAvailable) {
      throw new Error(`Port ${this.port} is already in use`);
    }

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
      let outputBuffer = '';
      let errorBuffer = '';

      const startTimeout = setTimeout(() => {
        if (!serverStarted) {
          void this.stop();
          reject(
            new Error(
              `Server failed to start within timeout.\n` +
                `STDOUT: ${outputBuffer}\n` +
                `STDERR: ${errorBuffer}`
            )
          );
        }
      }, 15000); // Increased timeout

      // Capture stdout for debugging
      this.process.stdout?.on('data', (data: Buffer) => {
        const message = data.toString();
        outputBuffer += message;
        console.error(`[Server Output]: ${message}`);

        // Check if server has started
        if (message.includes('MCP server running on')) {
          serverStarted = true;
          clearTimeout(startTimeout);
          // Wait a bit more to ensure server is fully ready
          setTimeout(() => resolve(), 1000);
        }
      });

      // Capture stderr for debugging
      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString();
        errorBuffer += message;
        console.error(`[Server Error]: ${message}`);

        // Also check stderr for startup message
        if (message.includes('MCP server running on')) {
          serverStarted = true;
          clearTimeout(startTimeout);
          setTimeout(() => resolve(), 1000);
        }
      });

      this.process.on('error', error => {
        clearTimeout(startTimeout);
        reject(new Error(`Process error: ${error.message}`));
      });

      this.process.on('exit', (code, signal) => {
        if (!serverStarted) {
          clearTimeout(startTimeout);
          reject(
            new Error(
              `Server exited with code ${code} and signal ${signal}.\n` +
                `STDOUT: ${outputBuffer}\n` +
                `STDERR: ${errorBuffer}`
            )
          );
        }
      });
    });
  }

  async waitForReady(): Promise<void> {
    // Wait for port to be open
    const result = await waitPort({
      host: this.host,
      port: this.port,
      timeout: 10000, // Increased timeout
    });

    if (!result.open) {
      throw new Error(`Server did not start on ${this.host}:${this.port}`);
    }

    // Wait a bit for the server to fully initialize
    await new Promise<void>(resolve => setTimeout(resolve, 500));

    // Also wait for MCP server to be ready
    await this.waitForMcpReady();
  }

  async waitForMcpReady(): Promise<void> {
    const maxAttempts = 20; // Increased attempts
    const delay = 500; // 500ms between attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${this.getUrl('/health')}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as {
            status?: string;
            server?: { name?: string };
          };
          if (data.status === 'healthy' && data.server?.name) {
            return; // Server is ready
          }
        }
      } catch (error) {
        // Log the error for debugging but continue retrying
        console.error(
          `[Server Health Check] Attempt ${attempt} failed:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      if (attempt < maxAttempts) {
        await new Promise<void>(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(
      `Server did not become ready within ${maxAttempts * delay}ms`
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

  stop(): Promise<void> {
    return new Promise(resolve => {
      if (!this.process) {
        resolve();
        return;
      }

      const process = this.process;
      this.process = null;

      // Set a timeout for forceful termination
      const forceKillTimeout = setTimeout(() => {
        if (!process.killed) {
          console.warn(`[Server]: Force killing process ${process.pid}`);
          process.kill('SIGKILL');
        }
      }, 5000);

      process.on('exit', () => {
        clearTimeout(forceKillTimeout);
        resolve();
      });

      // Try graceful shutdown first
      process.kill('SIGTERM');
    });
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
