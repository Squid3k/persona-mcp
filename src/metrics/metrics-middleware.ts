import type { Request, Response, NextFunction } from 'express';
import { metricsCollector } from './metrics-collector.js';

export interface MetricsMiddlewareOptions {
  excludePaths?: string[];
  includeQueryParams?: boolean;
}

export function createMetricsMiddleware(
  options: MetricsMiddlewareOptions = {}
) {
  const { excludePaths = ['/health', '/ready'], includeQueryParams = false } =
    options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip excluded paths
    if (excludePaths.includes(req.path)) {
      next();
      return;
    }

    const startTime = Date.now();

    // Track active connections
    metricsCollector.incrementActiveConnections();

    // Override end function to capture metrics with proper overload handling
    const captureMetrics = () => {
      // Calculate duration
      const duration = Date.now() - startTime;

      // Get endpoint (with or without query params)
      let endpoint = req.path;
      if (
        includeQueryParams &&
        req.query &&
        Object.keys(req.query).length > 0
      ) {
        endpoint = req.originalUrl;
      }

      // Record metrics
      metricsCollector.recordHttpRequest(
        req.method,
        endpoint,
        res.statusCode,
        duration
      );

      // Decrement active connections
      metricsCollector.decrementActiveConnections();
    };

    // Monkey-patch the end method with overloads
    const origEnd = res.end.bind(res);
    res.end = function (
      chunk: unknown,
      encoding?: string | (() => void),
      cb?: () => void
    ): Response {
      captureMetrics();
      if (typeof encoding === 'function') {
        return origEnd(chunk, encoding);
      }
      return origEnd(chunk, encoding as string, cb);
    } as typeof res.end;

    next();
  };
}

// Helper to measure async function execution time
export async function measureAsyncExecution<T>(
  fn: () => Promise<T>,
  recordMetric: (duration: number) => void
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    recordMetric(duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordMetric(duration);
    throw error;
  }
}

// Helper to measure sync function execution time
export function measureSyncExecution<T>(
  fn: () => T,
  recordMetric: (duration: number) => void
): T {
  const startTime = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - startTime;
    recordMetric(duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordMetric(duration);
    throw error;
  }
}
