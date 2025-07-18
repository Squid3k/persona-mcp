import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersonasMcpServer } from '../../src/server.js';

describe('CLI Error Path Tests', () => {
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockProcessExit: any;

  beforeEach(() => {
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process.exit called');
    });
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
    vi.clearAllMocks();
  });

  describe('Server Initialization Failures', () => {
    it('should handle persona manager initialization failure', async () => {
      const server = new PersonasMcpServer({ port: 0 });
      
      // Mock the persona manager to throw an error
      vi.spyOn(server['personaManager'], 'initialize').mockRejectedValue(
        new Error('Failed to load personas')
      );

      await expect(server.run()).rejects.toThrow('Failed to load personas');
    });

    it('should handle metrics initialization failure', async () => {
      const server = new PersonasMcpServer({
        port: 0,
        metrics: {
          enabled: true,
          endpoint: 'invalid-url',
        }
      });

      // The server should still start even if metrics fail
      await expect(server.initialize()).resolves.not.toThrow();
    });

    it('should handle HTTP server creation failure', async () => {
      const server = new PersonasMcpServer({ port: -1 });

      await expect(server.run()).rejects.toThrow();
    });
  });

  describe('Shutdown Error Handling', () => {
    it('should handle errors during shutdown', async () => {
      const server = new PersonasMcpServer({ port: 0 });
      
      // Start the server
      await server.run();

      // Mock shutdown to throw an error
      vi.spyOn(server['personaManager'], 'shutdown').mockRejectedValue(
        new Error('Shutdown failed')
      );

      // Shutdown should complete even with errors
      await expect(server.shutdown()).resolves.not.toThrow();
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(Error)
      );
    });

    it('should handle HTTP server close timeout', async () => {
      const server = new PersonasMcpServer({ port: 0 });
      
      await server.run();

      // Mock the HTTP server close to never complete
      if (server['httpServer']) {
        (server['httpServer'] as any).close = vi.fn(() => {
          // Never call the callback - just do nothing
        });
      }

      // Should timeout and reject
      await expect(server.shutdown()).rejects.toThrow('Close timeout');
    }, 10000);

    it('should handle transport disconnection errors', async () => {
      const server = new PersonasMcpServer({ port: 0 });
      
      await server.run();

      // Mock transport close to throw
      if (server['httpTransport']) {
        vi.spyOn(server['httpTransport'], 'close').mockRejectedValue(
          new Error('Transport error')
        );
      }

      // Should log error but complete shutdown
      await server.shutdown();
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error disconnecting'),
        expect.any(Error)
      );
    });
  });

  describe('Signal Handling Errors', () => {
    it('should exit with code 1 on shutdown error', async () => {
      const { shutdown } = await import('../../src/cli.js').then(m => ({
        shutdown: (m as any).shutdown
      }));

      const mockServer = {
        shutdown: vi.fn().mockRejectedValue(new Error('Shutdown failed'))
      };

      try {
        await shutdown('SIGTERM', mockServer);
      } catch {
        // Expected to throw due to process.exit mock
      }

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error during shutdown:',
        expect.any(Error)
      );
    });
  });

  describe('Configuration Errors', () => {
    it('should handle invalid JSON in environment variables', async () => {
      process.env.PERSONAS_CONFIG = '{ invalid json }';

      const module = await import('../../src/cli-functions.js');
      const { parseArgs } = module;
      
      expect(() => parseArgs([])).toThrow();
      
      delete process.env.PERSONAS_CONFIG;
    });

    it('should handle missing required configuration', async () => {
      const server = new PersonasMcpServer({
        // Missing required transport configuration
        forceHttpMode: false,
        port: undefined as any,
      });

      await expect(server.run()).rejects.toThrow();
    });
  });

  describe('File System Errors', () => {
    it('should handle persona directory creation failure', async () => {
      const fs = await import('fs/promises');
      const originalMkdir = fs.mkdir;
      
      vi.spyOn(fs, 'mkdir').mockRejectedValue(
        new Error('Permission denied')
      );

      const server = new PersonasMcpServer({ port: 0 });
      
      // Should log error but continue
      await server.initialize();
      
      expect(mockConsoleError).toHaveBeenCalled();
      
      fs.mkdir = originalMkdir;
    });
  });

  describe('Network Errors', () => {
    it('should handle network interface binding errors', async () => {
      const server = new PersonasMcpServer({
        port: 12345,
        host: '999.999.999.999' // Invalid IP
      });

      await expect(server.run()).rejects.toThrow();
    });

    it('should handle DNS resolution errors', async () => {
      const server = new PersonasMcpServer({
        port: 0,
        host: 'invalid.host.that.does.not.exist.com'
      });

      await expect(server.run()).rejects.toThrow();
    });
  });
});