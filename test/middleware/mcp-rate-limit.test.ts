import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  McpRateLimiter, 
  getMcpRateLimiter, 
  extractMcpClientId,
  mcpRateLimiters 
} from '../../src/middleware/mcp-rate-limit.js';
import { RateLimitError } from '../../src/errors/index.js';

describe('McpRateLimiter', () => {
  let limiter: McpRateLimiter;
  
  beforeEach(() => {
    limiter = new McpRateLimiter({
      windowMs: 1000, // 1 second for testing
      maxRequests: 3,
      keyPrefix: 'test',
    });
  });
  
  afterEach(() => {
    limiter.shutdown();
  });
  
  describe('checkLimit', () => {
    it('should allow requests within limit', () => {
      const clientId = 'test-client';
      
      expect(() => limiter.checkLimit(clientId)).not.toThrow();
      expect(() => limiter.checkLimit(clientId)).not.toThrow();
      expect(() => limiter.checkLimit(clientId)).not.toThrow();
    });
    
    it('should throw RateLimitError when limit exceeded', () => {
      const clientId = 'test-client';
      
      // Use up the limit
      limiter.checkLimit(clientId);
      limiter.checkLimit(clientId);
      limiter.checkLimit(clientId);
      
      // Should throw on 4th request
      expect(() => limiter.checkLimit(clientId)).toThrow(RateLimitError);
    });
    
    it('should reset after window expires', async () => {
      const clientId = 'test-client';
      
      // Use up the limit
      limiter.checkLimit(clientId);
      limiter.checkLimit(clientId);
      limiter.checkLimit(clientId);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should allow new requests
      expect(() => limiter.checkLimit(clientId)).not.toThrow();
    });
    
    it('should track different clients separately', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';
      
      // Use up limit for client1
      limiter.checkLimit(client1);
      limiter.checkLimit(client1);
      limiter.checkLimit(client1);
      
      // Client2 should still have full limit
      expect(() => limiter.checkLimit(client2)).not.toThrow();
      expect(() => limiter.checkLimit(client2)).not.toThrow();
      expect(() => limiter.checkLimit(client2)).not.toThrow();
      
      // Both should be limited now
      expect(() => limiter.checkLimit(client1)).toThrow(RateLimitError);
      expect(() => limiter.checkLimit(client2)).toThrow(RateLimitError);
    });
  });
  
  describe('getStatus', () => {
    it('should return full limit for new client', () => {
      const status = limiter.getStatus('new-client');
      
      expect(status).not.toBeNull();
      expect(status!.remaining).toBe(3);
      expect(status!.resetAt).toBeInstanceOf(Date);
    });
    
    it('should return correct remaining count', () => {
      const clientId = 'test-client';
      
      limiter.checkLimit(clientId);
      let status = limiter.getStatus(clientId);
      expect(status!.remaining).toBe(2);
      
      limiter.checkLimit(clientId);
      status = limiter.getStatus(clientId);
      expect(status!.remaining).toBe(1);
      
      limiter.checkLimit(clientId);
      status = limiter.getStatus(clientId);
      expect(status!.remaining).toBe(0);
    });
  });
  
  describe('reset', () => {
    it('should reset limits for specific client', () => {
      const clientId = 'test-client';
      
      // Use up the limit
      limiter.checkLimit(clientId);
      limiter.checkLimit(clientId);
      limiter.checkLimit(clientId);
      
      // Should be limited
      expect(() => limiter.checkLimit(clientId)).toThrow(RateLimitError);
      
      // Reset
      limiter.reset(clientId);
      
      // Should allow requests again
      expect(() => limiter.checkLimit(clientId)).not.toThrow();
    });
  });
  
  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      const clientId = 'test-client';
      
      // Make a request
      limiter.checkLimit(clientId);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Force cleanup (normally happens automatically)
      (limiter as any).cleanup();
      
      // Status should show full limit available
      const status = limiter.getStatus(clientId);
      expect(status!.remaining).toBe(3);
    });
  });
});

describe('getMcpRateLimiter', () => {
  afterEach(() => {
    // Clean up the singleton limiters
    mcpRateLimiters.general.shutdown();
    mcpRateLimiters.tools.shutdown();
    mcpRateLimiters.resources.shutdown();
    mcpRateLimiters.prompts.shutdown();
  });
  
  it('should return tools limiter for tool calls', () => {
    const limiter = getMcpRateLimiter('tools/call');
    expect(limiter).toBe(mcpRateLimiters.tools);
  });
  
  it('should return resources limiter for resource operations', () => {
    expect(getMcpRateLimiter('resources/read')).toBe(mcpRateLimiters.resources);
    expect(getMcpRateLimiter('resources/list')).toBe(mcpRateLimiters.resources);
  });
  
  it('should return prompts limiter for prompt operations', () => {
    expect(getMcpRateLimiter('prompts/get')).toBe(mcpRateLimiters.prompts);
    expect(getMcpRateLimiter('prompts/list')).toBe(mcpRateLimiters.prompts);
  });
  
  it('should return general limiter for unknown methods', () => {
    expect(getMcpRateLimiter('unknown/method')).toBe(mcpRateLimiters.general);
    expect(getMcpRateLimiter('')).toBe(mcpRateLimiters.general);
  });
});

describe('extractMcpClientId', () => {
  it('should extract session ID if available', () => {
    const request = { sessionId: 'session-123' };
    expect(extractMcpClientId(request)).toBe('session-123');
  });
  
  it('should extract from headers if no session ID', () => {
    const request = {
      headers: { 'x-session-id': 'header-session-456' }
    };
    expect(extractMcpClientId(request)).toBe('header-session-456');
  });
  
  it('should use IP if no session info', () => {
    const request = { ip: '192.168.1.100' };
    expect(extractMcpClientId(request)).toBe('192.168.1.100');
  });
  
  it('should return default for unknown client', () => {
    expect(extractMcpClientId({})).toBe('unknown-client');
    expect(extractMcpClientId(null)).toBe('unknown-client');
  });
});