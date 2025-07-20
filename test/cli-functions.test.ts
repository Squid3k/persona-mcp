import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { printVersion, printHelp, parseArgs } from '../src/cli-functions.js';
import { VERSION } from '../src/version.js';

describe('CLI Functions', () => {
  let mockLog: Mock;
  let mockError: Mock;
  let mockExit: Mock;
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let originalExit: typeof process.exit;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalLog = console.log.bind(console);
    originalError = console.error.bind(console);
    originalExit = process.exit.bind(process);
    originalEnv = { ...process.env };

    mockLog = vi.fn();
    mockError = vi.fn();
    mockExit = vi.fn();

    console.log = mockLog;
    console.error = mockError;
    process.exit = mockExit as any;

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;

    // Clean up all environment variables
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.METRICS_ENABLED;
    delete process.env.METRICS_ENDPOINT;
    delete process.env.METRICS_HEADERS;
    delete process.env.METRICS_INTERVAL;

    // Restore original environment
    Object.assign(process.env, originalEnv);
  });

  describe('printVersion', () => {
    it('should print the version', () => {
      printVersion();

      expect(mockLog).toHaveBeenCalledWith(VERSION);
      expect(mockLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('printHelp', () => {
    it('should print help text', () => {
      printHelp();

      expect(mockLog).toHaveBeenCalledTimes(1);
      const helpText = mockLog.mock.calls[0][0];
      expect(helpText).toContain('Usage: personas-mcp [options]');
      expect(helpText).toContain('Options:');
      expect(helpText).toContain('--port');
      expect(helpText).toContain('--host');
      expect(helpText).toContain('--no-cors');
      expect(helpText).toContain('--version');
      expect(helpText).toContain('--help');
      expect(helpText).toContain('Examples:');
      expect(helpText).toContain('Persona Directories:');
    });
  });

  describe('parseArgs', () => {
    it('should parse empty args to empty config', () => {
      const config = parseArgs([]);

      expect(config).toEqual({});
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should parse --port with valid number', () => {
      const config = parseArgs(['--port', '8080']);

      expect(config.port).toBe(8080);
      expect(config.forceHttpMode).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should parse -p with valid number', () => {
      const config = parseArgs(['-p', '3000']);

      expect(config.port).toBe(3000);
      expect(config.forceHttpMode).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should error on invalid port number', () => {
      parseArgs(['--port', 'invalid']);

      expect(mockError).toHaveBeenCalledWith('Invalid port number');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should error on missing port value', () => {
      parseArgs(['--port']);

      expect(mockError).toHaveBeenCalledWith('Invalid port number');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should parse --host with value', () => {
      const config = parseArgs(['--host', '0.0.0.0']);

      expect(config.host).toBe('0.0.0.0');
      expect(config.forceHttpMode).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should parse -h with value', () => {
      const config = parseArgs(['-h', 'localhost']);

      expect(config.host).toBe('localhost');
      expect(config.forceHttpMode).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should error on missing host value', () => {
      parseArgs(['--host']);

      expect(mockError).toHaveBeenCalledWith('Host value required');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should parse --no-cors flag', () => {
      const config = parseArgs(['--no-cors']);

      expect(config.http?.enableCors).toBe(false);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should parse multiple arguments', () => {
      const config = parseArgs([
        '--port',
        '8080',
        '--host',
        '0.0.0.0',
        '--no-cors',
      ]);

      expect(config.port).toBe(8080);
      expect(config.host).toBe('0.0.0.0');
      expect(config.forceHttpMode).toBe(true);
      expect(config.http?.enableCors).toBe(false);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should error on unknown option', () => {
      parseArgs(['--unknown']);

      expect(mockError).toHaveBeenCalledWith('Unknown option: --unknown');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should skip non-option arguments', () => {
      const config = parseArgs(['somevalue', '--port', '8080']);

      expect(config.port).toBe(8080);
      expect(config.forceHttpMode).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should handle --no-cors with existing http config', () => {
      // First set some http config, then add --no-cors
      const args = ['--no-cors'];
      const config = parseArgs(args);

      expect(config.http?.enableCors).toBe(false);
    });

    describe('Environment variable parsing', () => {
      let originalEnv: NodeJS.ProcessEnv;

      beforeEach(() => {
        originalEnv = { ...process.env };
        // Clear all mocks before each environment test
        vi.clearAllMocks();
      });

      afterEach(() => {
        // Clean up all environment variables that might have been set
        delete process.env.PORT;
        delete process.env.HOST;
        delete process.env.CORS_ALLOWED_ORIGINS;
        delete process.env.METRICS_ENABLED;
        delete process.env.METRICS_ENDPOINT;
        delete process.env.METRICS_HEADERS;
        delete process.env.METRICS_INTERVAL;

        // Restore original environment
        Object.assign(process.env, originalEnv);
      });

      it('should parse PORT from environment', () => {
        process.env.PORT = '4000';
        const config = parseArgs([]);
        expect(config.port).toBe(4000);
      });

      it('should parse HOST from environment', () => {
        process.env.HOST = '0.0.0.0';
        const config = parseArgs([]);
        expect(config.host).toBe('0.0.0.0');
      });

      it('should prefer CLI args over environment variables', () => {
        process.env.PORT = '4000';
        const config = parseArgs(['--port', '5000']);
        expect(config.port).toBe(5000);
      });

      describe('METRICS configuration', () => {
        it('should parse valid METRICS_HEADERS JSON', () => {
          process.env.METRICS_HEADERS =
            '{"Authorization": "Bearer token", "X-API-Key": "key123"}';

          const config = parseArgs([]);

          expect(config.metrics?.headers).toEqual({
            Authorization: 'Bearer token',
            'X-API-Key': 'key123',
          });
          expect(mockError).not.toHaveBeenCalled();
        });

        it('should handle invalid METRICS_HEADERS JSON gracefully', () => {
          process.env.METRICS_HEADERS = '{invalid json}';

          const config = parseArgs([]);

          expect(config.metrics?.headers).toBeUndefined();
          expect(mockError).toHaveBeenCalledTimes(2);
          expect(mockError).toHaveBeenNthCalledWith(
            1,
            'Warning: Invalid JSON in METRICS_HEADERS environment variable:',
            expect.any(Error)
          );
          expect(mockError).toHaveBeenNthCalledWith(
            2,
            'METRICS_HEADERS will be ignored. Expected format: \'{"key": "value"}\''
          );
        });

        it('should handle empty METRICS_HEADERS', () => {
          process.env.METRICS_HEADERS = '';

          const config = parseArgs([]);

          expect(config.metrics).toBeUndefined();
          expect(mockError).not.toHaveBeenCalled();
        });

        it('should parse valid METRICS_INTERVAL', () => {
          process.env.METRICS_INTERVAL = '30000';

          const config = parseArgs([]);

          expect(config.metrics?.interval).toBe(30000);
          expect(mockError).not.toHaveBeenCalled();
        });

        it('should handle invalid METRICS_INTERVAL gracefully', () => {
          process.env.METRICS_INTERVAL = 'not-a-number';

          const config = parseArgs([]);

          expect(config.metrics?.interval).toBeUndefined();
          expect(mockError).toHaveBeenCalledTimes(2);
          expect(mockError).toHaveBeenNthCalledWith(
            1,
            'Warning: Invalid METRICS_INTERVAL value:',
            'not-a-number'
          );
          expect(mockError).toHaveBeenNthCalledWith(
            2,
            'METRICS_INTERVAL must be a positive number (milliseconds). Using default.'
          );
        });

        it('should reject negative METRICS_INTERVAL', () => {
          process.env.METRICS_INTERVAL = '-5000';

          const config = parseArgs([]);

          expect(config.metrics?.interval).toBeUndefined();
          expect(mockError).toHaveBeenCalledTimes(2);
          expect(mockError).toHaveBeenNthCalledWith(
            1,
            'Warning: Invalid METRICS_INTERVAL value:',
            '-5000'
          );
          expect(mockError).toHaveBeenNthCalledWith(
            2,
            'METRICS_INTERVAL must be a positive number (milliseconds). Using default.'
          );
        });

        it('should reject zero METRICS_INTERVAL', () => {
          process.env.METRICS_INTERVAL = '0';

          const config = parseArgs([]);

          expect(config.metrics?.interval).toBeUndefined();
          expect(mockError).toHaveBeenCalledTimes(2);
          expect(mockError).toHaveBeenNthCalledWith(
            1,
            'Warning: Invalid METRICS_INTERVAL value:',
            '0'
          );
          expect(mockError).toHaveBeenNthCalledWith(
            2,
            'METRICS_INTERVAL must be a positive number (milliseconds). Using default.'
          );
        });

        it('should handle all metrics environment variables together', () => {
          process.env.METRICS_ENABLED = 'true';
          process.env.METRICS_ENDPOINT = 'http://localhost:4318/v1/metrics';
          process.env.METRICS_HEADERS = '{"Authorization": "Bearer token"}';
          process.env.METRICS_INTERVAL = '60000';

          const config = parseArgs([]);

          expect(config.metrics).toEqual({
            enabled: true,
            endpoint: 'http://localhost:4318/v1/metrics',
            headers: { Authorization: 'Bearer token' },
            interval: 60000,
          });
        });

        it('should handle METRICS_ENABLED false', () => {
          process.env.METRICS_ENABLED = 'false';

          const config = parseArgs([]);

          expect(config.metrics?.enabled).toBe(false);
        });

        it('should handle mix of valid and invalid metrics values', () => {
          process.env.METRICS_ENABLED = 'false';
          process.env.METRICS_ENDPOINT = 'http://localhost:4318/v1/metrics';
          process.env.METRICS_HEADERS = '{bad json}';
          process.env.METRICS_INTERVAL = 'invalid';

          const config = parseArgs([]);

          expect(config.metrics).toEqual({
            enabled: false,
            endpoint: 'http://localhost:4318/v1/metrics',
            headers: undefined,
            interval: undefined,
          });
          expect(mockError).toHaveBeenCalledTimes(4); // 2 for headers, 2 for interval
          // Verify the error messages
          expect(mockError).toHaveBeenNthCalledWith(
            1,
            'Warning: Invalid JSON in METRICS_HEADERS environment variable:',
            expect.any(Error)
          );
          expect(mockError).toHaveBeenNthCalledWith(
            3,
            'Warning: Invalid METRICS_INTERVAL value:',
            'invalid'
          );
        });
      });
    });
  });
});
