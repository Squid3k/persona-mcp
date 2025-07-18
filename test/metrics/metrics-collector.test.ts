import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MetricsCollector } from '../../src/metrics/metrics-collector.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector({
      enabled: true,
      endpoint: 'http://localhost:4318/v1/metrics',
    });
  });

  afterEach(async () => {
    await collector.shutdown();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultCollector = new MetricsCollector();
      expect(defaultCollector).toBeDefined();
    });

    it('should accept custom config', () => {
      const customCollector = new MetricsCollector({
        enabled: true,
        endpoint: 'http://custom:4318/v1/metrics',
        headers: { 'X-API-Key': 'test' },
        interval: 30000,
        serviceName: 'test-service',
        serviceVersion: '2.0.0',
      });
      expect(customCollector).toBeDefined();
    });

    it('should create no-op meter when disabled', () => {
      const disabledCollector = new MetricsCollector({ enabled: false });
      expect(disabledCollector).toBeDefined();
      // Calling methods should not throw
      disabledCollector.recordHttpRequest('GET', '/test', 200, 100);
    });
  });

  describe('HTTP metrics', () => {
    it('should record HTTP requests', () => {
      expect(() => {
        collector.recordHttpRequest('GET', '/api/test', 200, 150);
        collector.recordHttpRequest('POST', '/api/users', 201, 250);
        collector.recordHttpRequest('GET', '/api/error', 500, 50);
      }).not.toThrow();
    });

    it('should track active connections', () => {
      expect(() => {
        collector.incrementActiveConnections();
        collector.incrementActiveConnections();
        collector.decrementActiveConnections();
      }).not.toThrow();
    });
  });

  describe('MCP metrics', () => {
    it('should record MCP requests', () => {
      expect(() => {
        collector.recordMcpRequest('ListResources', 'success', 100);
        collector.recordMcpRequest('ReadResource', 'success', 50);
        collector.recordMcpRequest('CallTool', 'error', 200);
      }).not.toThrow();
    });
  });

  describe('Persona metrics', () => {
    it('should record persona requests', () => {
      expect(() => {
        collector.recordPersonaRequest('developer');
        collector.recordPersonaRequest('architect');
        collector.recordPersonaRequest('developer');
      }).not.toThrow();
    });

    it('should record persona prompt generations', () => {
      expect(() => {
        collector.recordPersonaPromptGeneration('developer');
        collector.recordPersonaPromptGeneration('tester');
      }).not.toThrow();
    });

    it('should record persona load duration', () => {
      expect(() => {
        collector.recordPersonaLoadDuration(1500);
      }).not.toThrow();
    });
  });

  describe('Tool metrics', () => {
    it('should record tool invocations', () => {
      expect(() => {
        collector.recordToolInvocation('recommend-persona');
        collector.recordToolInvocation('compare-personas');
      }).not.toThrow();
    });

    it('should record tool executions', () => {
      expect(() => {
        collector.recordToolExecution('recommend-persona', 150, true);
        collector.recordToolExecution('compare-personas', 100, true);
        collector.recordToolExecution('recommend-persona', 50, false);
      }).not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      await expect(collector.shutdown()).resolves.not.toThrow();
    });

    it('should handle multiple shutdowns', async () => {
      await collector.shutdown();
      await expect(collector.shutdown()).resolves.not.toThrow();
    });
  });
});
