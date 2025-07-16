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

  beforeEach(() => {
    originalLog = console.log;
    originalError = console.error;
    originalExit = process.exit;

    mockLog = vi.fn();
    mockError = vi.fn();
    mockExit = vi.fn();

    console.log = mockLog;
    console.error = mockError;
    process.exit = mockExit as any;
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
  });

  describe('printVersion', () => {
    it('should print the version', () => {
      printVersion();
      
      expect(mockError).toHaveBeenCalledWith(VERSION);
      expect(mockError).toHaveBeenCalledTimes(1);
    });
  });

  describe('printHelp', () => {
    it('should print help text', () => {
      printHelp();
      
      expect(mockError).toHaveBeenCalledTimes(1);
      const helpText = mockError.mock.calls[0][0];
      expect(helpText).toContain('Personas MCP Server');
      expect(helpText).toContain('USAGE:');
      expect(helpText).toContain('OPTIONS:');
      expect(helpText).toContain('--port');
      expect(helpText).toContain('--host');
      expect(helpText).toContain('--no-cors');
      expect(helpText).toContain('--version');
      expect(helpText).toContain('--help');
      expect(helpText).toContain('EXAMPLES:');
      expect(helpText).toContain('PERSONA DIRECTORIES:');
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
      
      expect(config).toEqual({ port: 8080 });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should parse -p with valid number', () => {
      const config = parseArgs(['-p', '3000']);
      
      expect(config).toEqual({ port: 3000 });
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
      
      expect(config).toEqual({ host: '0.0.0.0' });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should parse -h with value', () => {
      const config = parseArgs(['-h', 'localhost']);
      
      expect(config).toEqual({ host: 'localhost' });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should error on missing host value', () => {
      parseArgs(['--host']);
      
      expect(mockError).toHaveBeenCalledWith('Host value required');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should parse --no-cors flag', () => {
      const config = parseArgs(['--no-cors']);
      
      expect(config).toEqual({
        http: { enableCors: false }
      });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should parse multiple arguments', () => {
      const config = parseArgs([
        '--port', '8080',
        '--host', '0.0.0.0',
        '--no-cors'
      ]);
      
      expect(config).toEqual({
        port: 8080,
        host: '0.0.0.0',
        http: { enableCors: false }
      });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should error on unknown option', () => {
      parseArgs(['--unknown']);
      
      expect(mockError).toHaveBeenCalledWith('Unknown option: --unknown');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should skip non-option arguments', () => {
      const config = parseArgs(['somevalue', '--port', '8080']);
      
      expect(config).toEqual({ port: 8080 });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should handle --no-cors with existing http config', () => {
      // First set some http config, then add --no-cors
      const args = ['--no-cors'];
      const config = parseArgs(args);
      
      expect(config.http?.enableCors).toBe(false);
    });
  });
});