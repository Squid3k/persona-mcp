import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import {
  createMetricsMiddleware,
  measureAsyncExecution,
  measureSyncExecution,
} from '../../src/metrics/metrics-middleware.js';
import {
  initializeMetrics,
  metricsCollector,
} from '../../src/metrics/metrics-collector.js';

describe('Metrics Middleware', () => {
  beforeEach(() => {
    initializeMetrics({ enabled: false }); // Use no-op metrics for tests
  });

  afterEach(async () => {
    if (metricsCollector) {
      await metricsCollector.shutdown();
    }
  });

  describe('createMetricsMiddleware', () => {
    it('should create middleware with default options', () => {
      const middleware = createMetricsMiddleware();
      expect(middleware).toBeInstanceOf(Function);
    });

    it('should skip excluded paths', () => {
      const middleware = createMetricsMiddleware({
        excludePaths: ['/health', '/metrics'],
      });

      const req = {
        path: '/health',
        method: 'GET',
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should track metrics for included paths', () => {
      const middleware = createMetricsMiddleware();

      const req = {
        path: '/api/test',
        method: 'GET',
        query: {},
      } as Request;

      const originalEnd = vi.fn();
      const res = {
        statusCode: 200,
        end: originalEnd,
      } as unknown as Response;

      const next = vi.fn();

      // Spy on metrics methods
      const incrementSpy = vi.spyOn(
        metricsCollector,
        'incrementActiveConnections'
      );
      const decrementSpy = vi.spyOn(
        metricsCollector,
        'decrementActiveConnections'
      );
      const recordSpy = vi.spyOn(metricsCollector, 'recordHttpRequest');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(incrementSpy).toHaveBeenCalledOnce();

      // Simulate response end
      res.end();

      expect(originalEnd).toHaveBeenCalledOnce();
      expect(decrementSpy).toHaveBeenCalledOnce();
      expect(recordSpy).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        200,
        expect.any(Number)
      );
    });

    it('should include query params when configured', () => {
      const middleware = createMetricsMiddleware({
        includeQueryParams: true,
      });

      const req = {
        path: '/api/test',
        originalUrl: '/api/test?param=value',
        method: 'GET',
        query: { param: 'value' },
      } as unknown as Request;

      const originalEnd = vi.fn();
      const res = {
        statusCode: 200,
        end: originalEnd,
      } as unknown as Response;

      const next = vi.fn();
      const recordSpy = vi.spyOn(metricsCollector, 'recordHttpRequest');

      middleware(req, res, next);
      res.end();

      expect(recordSpy).toHaveBeenCalledWith(
        'GET',
        '/api/test?param=value',
        200,
        expect.any(Number)
      );
    });
  });

  describe('measureAsyncExecution', () => {
    it('should measure successful async execution', async () => {
      const recordMetric = vi.fn();
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      };

      const result = await measureAsyncExecution(asyncFn, recordMetric);

      expect(result).toBe('success');
      expect(recordMetric).toHaveBeenCalledWith(expect.any(Number));
      expect(recordMetric.mock.calls[0][0]).toBeGreaterThanOrEqual(10);
    });

    it('should measure failed async execution', async () => {
      const recordMetric = vi.fn();
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('test error');
      };

      await expect(
        measureAsyncExecution(asyncFn, recordMetric)
      ).rejects.toThrow('test error');
      expect(recordMetric).toHaveBeenCalledWith(expect.any(Number));
      expect(recordMetric.mock.calls[0][0]).toBeGreaterThanOrEqual(10);
    });
  });

  describe('measureSyncExecution', () => {
    it('should measure successful sync execution', () => {
      const recordMetric = vi.fn();
      const syncFn = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = measureSyncExecution(syncFn, recordMetric);

      expect(result).toBe(499500);
      expect(recordMetric).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should measure failed sync execution', () => {
      const recordMetric = vi.fn();
      const syncFn = () => {
        throw new Error('sync error');
      };

      expect(() => measureSyncExecution(syncFn, recordMetric)).toThrow(
        'sync error'
      );
      expect(recordMetric).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});
