/**
 * Rate limiting middleware for Express
 *
 * NOTE: This requires installing express-rate-limit:
 * npm install express-rate-limit
 */
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { RateLimitError } from '../errors/index.js';

/**
 * Create a custom rate limit handler that uses our error system
 */
function createRateLimitHandler(windowMs: number) {
  return (
    _req: unknown,
    _res: unknown,
    _next: unknown,
    _options: { windowMs: number }
  ) => {
    const retryAfter = Math.ceil(windowMs / 1000);
    throw new RateLimitError(
      `Too many requests from this IP, please try again after ${retryAfter} seconds`,
      retryAfter
    );
  };
}

/**
 * General API rate limiter
 * Allows 100 requests per 15 minutes per IP
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(15 * 60 * 1000),
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: req => {
    // Use X-Forwarded-For if behind a proxy, otherwise use IP
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

/**
 * Stricter rate limiter for recommendation endpoints
 * Allows 10 requests per minute per IP
 */
export const recommendLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(1 * 60 * 1000),
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many recommendation requests, please try again later',
});

/**
 * Very strict rate limiter for compute-intensive operations
 * Allows 5 requests per 5 minutes per IP
 */
export const computeIntensiveLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(5 * 60 * 1000),
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed requests
  message: 'Too many compute-intensive requests, please try again later',
});

/**
 * Authentication/login rate limiter
 * Allows 5 attempts per 15 minutes per IP
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(15 * 60 * 1000),
  skipSuccessfulRequests: true, // Only count failed attempts
  skipFailedRequests: false,
  message: 'Too many authentication attempts, please try again later',
});

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  enabled: boolean;
  trustProxy: boolean;
  bypassTokens?: string[];
  customLimits?: {
    api?: number;
    recommend?: number;
    compute?: number;
  };
}

/**
 * Create custom rate limiters based on configuration
 */
export function createRateLimiters(config: RateLimitConfig) {
  if (!config.enabled) {
    // Return no-op middleware if rate limiting is disabled
    return {
      apiLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
      recommendLimiter: (_req: unknown, _res: unknown, next: () => void) =>
        next(),
      computeIntensiveLimiter: (
        _req: unknown,
        _res: unknown,
        next: () => void
      ) => next(),
      authLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
    };
  }

  // Create limiters with custom limits if provided
  const limiters = {
    apiLimiter: config.customLimits?.api
      ? rateLimit({
          windowMs: 15 * 60 * 1000,
          max: config.customLimits.api,
          standardHeaders: true,
          legacyHeaders: false,
          handler: createRateLimitHandler(15 * 60 * 1000),
        })
      : apiLimiter,
    recommendLimiter: config.customLimits?.recommend
      ? rateLimit({
          windowMs: 1 * 60 * 1000,
          max: config.customLimits.recommend,
          standardHeaders: true,
          legacyHeaders: false,
          handler: createRateLimitHandler(1 * 60 * 1000),
        })
      : recommendLimiter,
    computeIntensiveLimiter: config.customLimits?.compute
      ? rateLimit({
          windowMs: 5 * 60 * 1000,
          max: config.customLimits.compute,
          standardHeaders: true,
          legacyHeaders: false,
          handler: createRateLimitHandler(5 * 60 * 1000),
        })
      : computeIntensiveLimiter,
    authLimiter,
  };

  return limiters;
}
