import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = join(__dirname, '../../dist/index.js');

describe('CLI Error Path Tests', () => {
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockProcessExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: string | number | null) => {
        throw new Error('Process.exit called');
      }) as any;
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
    vi.clearAllMocks();
  });

  describe('Configuration Errors', () => {
    it('should handle invalid JSON in environment variables', async () => {
      // The parseArgs function checks METRICS_HEADERS for JSON parsing
      process.env.METRICS_HEADERS = '{ invalid json }';

      const { parseArgs } = await import('../../src/cli-functions.js');

      expect(() => parseArgs([])).toThrow();

      delete process.env.METRICS_HEADERS;
    });

    it('should handle invalid port values', async () => {
      const { parseArgs } = await import('../../src/cli-functions.js');

      // Test invalid port
      expect(() => parseArgs(['--port', 'invalid'])).toThrow();
    });

    it('should handle port out of range', async () => {
      const { parseArgs } = await import('../../src/cli-functions.js');

      // parseArgs validates port range and calls process.exit
      expect(() => parseArgs(['--port', '70000'])).toThrow(
        'Process.exit called'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Port must be between 0 and 65535'
      );
    });

    it('should handle missing argument values', async () => {
      const { parseArgs } = await import('../../src/cli-functions.js');

      // Missing host value
      expect(() => parseArgs(['--host'])).toThrow();

      // Missing port value
      expect(() => parseArgs(['--port'])).toThrow();
    });
  });

  describe('CLI Process Error Handling', () => {
    it('should handle invalid command line arguments', async () => {
      const result = await runCLI(['--invalid-option']);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Unknown option');
    });

    it('should handle port conflicts using CLI', async () => {
      // Start first server
      const server1 = spawn('node', [CLI_PATH, '--port', '45678'], {
        env: { ...process.env, NODE_ENV: 'test' },
      });

      // Wait for first server to start
      await waitForOutput(server1, 'MCP server running', 5000);

      // Try to start second server on same port
      const result = await runCLI(['--port', '45678']);

      expect(result.code).toBe(1);
      expect(result.stderr).toMatch(/EADDRINUSE|address already in use/i);

      // Clean up
      server1.kill('SIGTERM');
      await waitForExit(server1);
    });

    it('should handle missing config file', async () => {
      const result = await runCLI(['--config', '/nonexistent/config.json']);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Failed to load configuration');
    });
  });

  describe('Signal Handling via CLI', () => {
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

  describe('Startup Errors', () => {
    it('should handle invalid host address', async () => {
      const result = await runCLI(['--host', '999.999.999.999', '--port', '0']);

      expect(result.code).toBe(1);
      expect(result.stderr).toMatch(/invalid|EINVAL/i);
    });

    it('should handle permission denied on privileged port', async () => {
      // This test may not work in all environments
      if (process.getuid && process.getuid() !== 0) {
        const result = await runCLI(['--port', '80']);

        expect(result.code).toBe(1);
        expect(result.stderr).toMatch(/EACCES|permission denied/i);
      }
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
      child.kill('SIGTERM');
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
