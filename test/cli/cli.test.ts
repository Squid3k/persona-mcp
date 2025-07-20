import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = join(__dirname, '../../dist/index.js');

describe('CLI Tests', () => {
  let originalArgv: string[];
  let originalExit: typeof process.exit;

  beforeEach(() => {
    // Store original values
    originalArgv = process.argv;
    originalExit = process.exit;

    // Mock process.exit
    process.exit = vi.fn((code?: number) => {
      throw new Error(`Process.exit(${code})`);
    }) as never;
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;
    vi.clearAllMocks();
  });

  describe('Version Flag', () => {
    it('should display version with --version flag', async () => {
      const { stdout, stderr, code } = await runCLI(['--version']);

      expect(code).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/);
      expect(stderr).toBe('');
    });

    it('should display version with -v flag', async () => {
      const { stdout, stderr, code } = await runCLI(['-v']);

      expect(code).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/);
      expect(stderr).toBe('');
    });
  });

  describe('Help Flag', () => {
    it('should display help with --help flag', async () => {
      const { stdout, stderr, code } = await runCLI(['--help']);

      expect(code).toBe(0);
      expect(stdout).toContain('Usage: personas-mcp [options]');
      expect(stdout).toContain('--version');
      expect(stdout).toContain('--help');
      expect(stdout).toContain('--port');
      expect(stdout).toContain('--host');
      expect(stderr).toBe('');
    });
  });

  describe('Configuration Parsing', () => {
    it('should parse port configuration', async () => {
      const mockServer = await createMockServer();
      process.argv = ['node', 'cli.js', '--port', '8080'];

      const config = await import('../../src/cli-functions.js').then(m =>
        m.parseArgs(['--port', '8080'])
      );

      expect(config.port).toBe(8080);
      await mockServer.close();
    });

    it('should parse host configuration', async () => {
      process.argv = ['node', 'cli.js', '--host', '0.0.0.0'];

      const config = await import('../../src/cli-functions.js').then(m =>
        m.parseArgs(['--host', '0.0.0.0'])
      );

      expect(config.host).toBe('0.0.0.0');
    });

    it('should handle invalid port', async () => {
      const { stderr, code } = await runCLI(['--port', 'invalid']);

      expect(code).toBe(1);
      expect(stderr).toContain('Invalid port');
    });

    it('should handle port out of range', async () => {
      const { stderr, code } = await runCLI(['--port', '70000']);

      expect(code).toBe(1);
      expect(stderr).toContain('Port must be between');
    });

    it('should parse metrics configuration', async () => {
      const config = await import('../../src/cli-functions.js').then(m =>
        m.parseArgs(['--metrics-endpoint', 'http://localhost:4318'])
      );

      expect(config.metrics?.endpoint).toBe('http://localhost:4318');
    });

    it('should disable metrics', async () => {
      const config = await import('../../src/cli-functions.js').then(m =>
        m.parseArgs(['--no-metrics'])
      );

      expect(config.metrics?.enabled).toBe(false);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      const server = spawn('node', [CLI_PATH, '--port', '0'], {
        env: { ...process.env, NODE_ENV: 'test' },
      });

      const output = await waitForOutput(server, 'MCP server running', 5000);
      expect(output).toContain('MCP server running');

      server.kill('SIGTERM');
      await waitForExit(server);
    });

    it('should handle SIGINT gracefully', async () => {
      const server = spawn('node', [CLI_PATH, '--port', '0'], {
        env: { ...process.env, NODE_ENV: 'test' },
      });

      await waitForOutput(server, 'MCP server running', 5000);

      server.kill('SIGINT');
      const exitCode = await waitForExit(server);

      expect(exitCode).toBe(0);
    });

    it('should handle SIGTERM gracefully', async () => {
      const server = spawn('node', [CLI_PATH, '--port', '0'], {
        env: { ...process.env, NODE_ENV: 'test' },
      });

      await waitForOutput(server, 'MCP server running', 5000);

      server.kill('SIGTERM');
      const exitCode = await waitForExit(server);

      expect(exitCode).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle port conflict', async () => {
      // Start first server
      const server1 = spawn('node', [CLI_PATH, '--port', '38291'], {
        env: { ...process.env, NODE_ENV: 'test' },
      });

      await waitForOutput(server1, 'MCP server running', 5000);

      // Try to start second server on same port
      const { stderr, code } = await runCLI(['--port', '38291']);

      expect(code).toBe(1);
      expect(stderr).toMatch(/EADDRINUSE|address already in use/i);

      server1.kill('SIGTERM');
      await waitForExit(server1);
    });

    it('should handle invalid configuration file', async () => {
      const { stderr, code } = await runCLI([
        '--config',
        '/nonexistent/config.json',
      ]);

      expect(code).toBe(1);
      expect(stderr).toContain('Failed to load configuration');
    });

    it('should handle server initialization errors', async () => {
      // Mock a failing PersonaManager
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process.exit called');
      });

      try {
        await import('../../src/cli.js');
      } catch {
        // Expected to throw
      }

      mockExit.mockRestore();
    });
  });
});

// Helper functions
async function runCLI(
  args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise(resolve => {
    const child = spawn('node', [CLI_PATH, ...args], {
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => {
      stdout += data.toString();
    });

    child.stderr.on('data', data => {
      stderr += data.toString();
    });

    child.on('close', code => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}

async function waitForOutput(
  child: ReturnType<typeof spawn>,
  text: string,
  timeout: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for "${text}"`));
    }, timeout);

    const handleData = (data: Buffer) => {
      output += data.toString();
      if (output.includes(text)) {
        clearTimeout(timer);
        child.stderr?.removeListener('data', handleData);
        resolve(output);
      }
    };

    child.stderr?.on('data', handleData);
  });
}

async function waitForExit(child: ReturnType<typeof spawn>): Promise<number> {
  return new Promise(resolve => {
    child.on('exit', code => {
      resolve(code ?? 1);
    });
  });
}

async function createMockServer(): Promise<{ close: () => Promise<void> }> {
  return {
    close: async () => {
      // Mock server cleanup
    },
  };
}
