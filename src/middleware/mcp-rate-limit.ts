/**
 * Rate limiting for MCP (Model Context Protocol) endpoints
 * Since MCP uses JSON-RPC over HTTP/SSE, we need custom rate limiting
 */
import { RateLimitError } from '../errors/index.js';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface McpRateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Prefix for identifying different limit types
}

export class McpRateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(private config: McpRateLimitConfig) {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }
  
  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier for the client (e.g., session ID, IP)
   * @returns true if request is allowed, throws RateLimitError if not
   */
  checkLimit(identifier: string): boolean {
    const key = this.config.keyPrefix ? `${this.config.keyPrefix}:${identifier}` : identifier;
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now - entry.windowStart > this.config.windowMs) {
      // New window or expired window
      this.limits.set(key, {
        count: 1,
        windowStart: now,
      });
      return true;
    }
    
    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.windowStart + this.config.windowMs - now) / 1000);
      throw new RateLimitError(
        `Too many MCP requests. Please try again in ${retryAfter} seconds.`,
        retryAfter
      );
    }
    
    // Increment count
    entry.count++;
    return true;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.windowStart > this.config.windowMs) {
        this.limits.delete(key);
      }
    }
  }
  
  /**
   * Reset limits for a specific identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyPrefix ? `${this.config.keyPrefix}:${identifier}` : identifier;
    this.limits.delete(key);
  }
  
  /**
   * Get current limit status for an identifier
   */
  getStatus(identifier: string): { remaining: number; resetAt: Date } | null {
    const key = this.config.keyPrefix ? `${this.config.keyPrefix}:${identifier}` : identifier;
    const entry = this.limits.get(key);
    
    if (!entry) {
      return {
        remaining: this.config.maxRequests,
        resetAt: new Date(Date.now() + this.config.windowMs),
      };
    }
    
    const now = Date.now();
    if (now - entry.windowStart > this.config.windowMs) {
      return {
        remaining: this.config.maxRequests,
        resetAt: new Date(now + this.config.windowMs),
      };
    }
    
    return {
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetAt: new Date(entry.windowStart + this.config.windowMs),
    };
  }
  
  /**
   * Shutdown the rate limiter
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

/**
 * Pre-configured rate limiters for different MCP operations
 */
export const mcpRateLimiters = {
  // General MCP requests: 100 per minute
  general: new McpRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'mcp:general',
  }),
  
  // Tool calls: 20 per minute (more restrictive as they're compute-intensive)
  tools: new McpRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'mcp:tools',
  }),
  
  // Resource reads: 50 per minute
  resources: new McpRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyPrefix: 'mcp:resources',
  }),
  
  // Prompt generation: 30 per minute
  prompts: new McpRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'mcp:prompts',
  }),
};

/**
 * Middleware to apply MCP rate limiting based on request method
 */
export function getMcpRateLimiter(method: string): McpRateLimiter {
  switch (method) {
    case 'tools/call':
      return mcpRateLimiters.tools;
    case 'resources/read':
    case 'resources/list':
      return mcpRateLimiters.resources;
    case 'prompts/get':
    case 'prompts/list':
      return mcpRateLimiters.prompts;
    default:
      return mcpRateLimiters.general;
  }
}

/**
 * Extract session ID or client identifier from MCP request
 */
export function extractMcpClientId(request: unknown): string {
  // Handle null/undefined request
  if (!request) {
    return 'unknown-client';
  }
  
  // Try to get session ID from the request
  if (typeof request === 'object' && request !== null && 'sessionId' in request && typeof (request as { sessionId: unknown }).sessionId === 'string') {
    return (request as { sessionId: string }).sessionId;
  }
  
  // Try to get from headers if available
  if (typeof request === 'object' && request !== null && 'headers' in request) {
    const headers = (request as { headers: unknown }).headers;
    if (typeof headers === 'object' && headers !== null && 'x-session-id' in headers) {
      const sessionId = (headers as { 'x-session-id': unknown })['x-session-id'];
      if (typeof sessionId === 'string') {
        return sessionId;
      }
    }
  }
  
  // Fall back to IP address if available
  if (typeof request === 'object' && request !== null && 'ip' in request && typeof (request as { ip: unknown }).ip === 'string') {
    return (request as { ip: string }).ip;
  }
  
  // Default fallback
  return 'unknown-client';
}