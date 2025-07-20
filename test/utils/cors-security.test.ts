import { describe, it, expect, beforeEach } from 'vitest';
import { CorsSecurity } from '../../src/utils/cors-security.js';

describe('CorsSecurity', () => {
  beforeEach(() => {
    // Reset NODE_ENV for each test
    delete process.env.NODE_ENV;
  });

  describe('createSecureCorsOptions', () => {
    it('should reject wildcard origin with credentials', () => {
      expect(() => {
        CorsSecurity.createSecureCorsOptions(['*'], true);
      }).toThrow('Cannot use wildcard origin (*) with credentials');
    });

    it('should reject undefined origins with credentials', () => {
      process.env.NODE_ENV = 'production';
      expect(() => {
        CorsSecurity.createSecureCorsOptions(undefined, true);
      }).toThrow('Cannot use wildcard origin (*) with credentials');
    });

    it('should allow wildcard without credentials', () => {
      const options = CorsSecurity.createSecureCorsOptions(['*'], false);
      expect(options).toBeDefined();
      expect(options.credentials).toBe(false);
    });

    it('should use default localhost origins in development', () => {
      process.env.NODE_ENV = 'development';
      const options = CorsSecurity.createSecureCorsOptions([], true);
      
      // Test the origin function
      const originFunc = options.origin as Function;
      let allowed = false;
      originFunc('http://localhost:3000', (err: any, result: any) => {
        allowed = result;
      });
      
      expect(allowed).toBe(true);
    });

    it('should disable CORS in production with no origins', () => {
      process.env.NODE_ENV = 'production';
      const options = CorsSecurity.createSecureCorsOptions([], false);
      expect(options.origin).toBe(false);
    });

    it('should validate origins correctly', () => {
      const allowedOrigins = ['https://app.example.com', 'https://test.example.com'];
      const options = CorsSecurity.createSecureCorsOptions(allowedOrigins, true);
      const originFunc = options.origin as Function;

      // Test allowed origin
      let allowed = false;
      originFunc('https://app.example.com', (err: any, result: any) => {
        allowed = !err && result;
      });
      expect(allowed).toBe(true);

      // Test disallowed origin
      let disallowed = true;
      originFunc('https://evil.com', (err: any, _result: any) => {
        disallowed = !!err;
      });
      expect(disallowed).toBe(true);
    });

    it('should allow requests with no origin', () => {
      const options = CorsSecurity.createSecureCorsOptions(['https://app.example.com'], true);
      const originFunc = options.origin as Function;

      let allowed = false;
      originFunc(undefined, (err: any, result: any) => {
        allowed = !err && result;
      });
      expect(allowed).toBe(true);
    });

    it('should include all required headers and methods', () => {
      const options = CorsSecurity.createSecureCorsOptions(['https://app.example.com'], true);
      
      expect(options.methods).toContain('GET');
      expect(options.methods).toContain('POST');
      expect(options.methods).toContain('DELETE');
      expect(options.methods).toContain('OPTIONS');
      
      expect(options.allowedHeaders).toContain('Content-Type');
      expect(options.allowedHeaders).toContain('Authorization');
      expect(options.allowedHeaders).toContain('Mcp-Session-Id');
      
      expect(options.exposedHeaders).toContain('Mcp-Session-Id');
      expect(options.maxAge).toBe(86400);
    });
  });

  describe('isOriginAllowed', () => {
    const allowedOrigins = ['https://app.example.com', 'http://localhost:3000'];

    it('should allow matching origins', () => {
      expect(CorsSecurity.isOriginAllowed('https://app.example.com', allowedOrigins)).toBe(true);
      expect(CorsSecurity.isOriginAllowed('http://localhost:3000', allowedOrigins)).toBe(true);
    });

    it('should reject non-matching origins', () => {
      expect(CorsSecurity.isOriginAllowed('https://evil.com', allowedOrigins)).toBe(false);
      expect(CorsSecurity.isOriginAllowed('http://localhost:4000', allowedOrigins)).toBe(false);
    });

    it('should allow undefined origin', () => {
      expect(CorsSecurity.isOriginAllowed(undefined, allowedOrigins)).toBe(true);
    });
  });

  describe('normalizeOrigin', () => {
    it('should remove trailing slashes', () => {
      expect(CorsSecurity.normalizeOrigin('https://example.com/')).toBe('https://example.com');
      expect(CorsSecurity.normalizeOrigin('https://example.com')).toBe('https://example.com');
      expect(CorsSecurity.normalizeOrigin('http://localhost:3000/')).toBe('http://localhost:3000');
    });
  });

  describe('parseOriginsFromEnv', () => {
    it('should parse comma-separated origins', () => {
      const envVar = 'https://app.example.com, http://localhost:3000, https://test.example.com/';
      const origins = CorsSecurity.parseOriginsFromEnv(envVar);
      
      expect(origins).toEqual([
        'https://app.example.com',
        'http://localhost:3000',
        'https://test.example.com', // Trailing slash removed
      ]);
    });

    it('should handle empty strings', () => {
      expect(CorsSecurity.parseOriginsFromEnv('')).toEqual([]);
      expect(CorsSecurity.parseOriginsFromEnv(undefined)).toEqual([]);
    });

    it('should filter out empty entries', () => {
      const envVar = 'https://app.example.com,,, http://localhost:3000';
      const origins = CorsSecurity.parseOriginsFromEnv(envVar);
      
      expect(origins).toEqual([
        'https://app.example.com',
        'http://localhost:3000',
      ]);
    });

    it('should trim whitespace', () => {
      const envVar = '  https://app.example.com  ,  http://localhost:3000  ';
      const origins = CorsSecurity.parseOriginsFromEnv(envVar);
      
      expect(origins).toEqual([
        'https://app.example.com',
        'http://localhost:3000',
      ]);
    });
  });
});