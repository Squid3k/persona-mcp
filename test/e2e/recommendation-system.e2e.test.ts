import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersonasMcpServer } from '../../src/server.js';
import { RecommendationTool } from '../../src/tools/recommendation-tool.js';
import { EnhancedPersonaManager } from '../../src/enhanced-persona-manager.js';
import { getRandomPort } from './test-helpers.js';

describe('Recommendation System E2E', () => {
  let server: PersonasMcpServer;
  let personaManager: EnhancedPersonaManager;
  let recommendationTool: RecommendationTool;
  let testPort: number;

  beforeEach(async () => {
    testPort = await getRandomPort();
    server = new PersonasMcpServer({
      port: testPort,
    });

    await server.initialize();

    // Access private members for testing
    personaManager = (server as any).personaManager;
    recommendationTool = (server as any).recommendationTool;
  });

  afterEach(async () => {
    await server.shutdown();
  });

  describe('System Integration', () => {
    it('should load default personas successfully', () => {
      const personas = personaManager.getAllPersonas();
      expect(personas.length).toBeGreaterThan(0);

      const personaIds = personas.map(p => p.id);
      expect(personaIds).toContain('architect');
      expect(personaIds).toContain('developer');
      expect(personaIds).toContain('reviewer');
      expect(personaIds).toContain('debugger');
    });

    it('should provide tool definitions', () => {
      const tools = recommendationTool.getToolDefinitions();
      expect(tools).toHaveLength(4);

      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('recommend-persona');
      expect(toolNames).toContain('explain-persona-fit');
      expect(toolNames).toContain('compare-personas');
      expect(toolNames).toContain('get-recommendation-stats');
    });

    it('should recommend personas for architecture tasks', async () => {
      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: 'Design microservices architecture',
          description:
            'Design a scalable microservices architecture for an e-commerce platform',
          keywords: ['microservices', 'architecture', 'scalability'],
          complexity: 'complex',
          domain: 'backend',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(3);

      // Architect should be highly ranked for architecture tasks
      const topRecommendation = result.data.recommendations[0];
      expect(topRecommendation.personaId).toBe('architect');
      expect(topRecommendation.score).toBeGreaterThan(70);
      expect(topRecommendation.strengths).toContain(
        'System-level thinking and design patterns'
      );
    });

    it('should recommend personas for development tasks', async () => {
      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: 'Implement user authentication',
          description:
            'Implement secure user authentication with JWT tokens and password hashing',
          keywords: ['implementation', 'authentication', 'security'],
          complexity: 'moderate',
          domain: 'backend',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(3);

      // Developer should be highly ranked for implementation tasks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const developerRec = result.data.recommendations.find(
        (r: any) => r.personaId === 'developer'
      );
      expect(developerRec).toBeDefined();
      expect(developerRec!.score).toBeGreaterThan(30);
    });

    it('should recommend personas for debugging tasks', async () => {
      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: 'Debug memory leak',
          description:
            'Investigate and fix memory leaks in the Node.js application',
          keywords: ['debugging', 'memory', 'troubleshooting'],
          complexity: 'complex',
          domain: 'backend',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(3);

      // Debugger should be highly ranked for debugging tasks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const debuggerRec = result.data.recommendations.find(
        (r: any) => r.personaId === 'debugger'
      );
      expect(debuggerRec).toBeDefined();
      expect(debuggerRec!.score).toBeGreaterThanOrEqual(60);
    });

    it('should recommend personas for code review tasks', async () => {
      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: 'Review security implementation',
          description:
            'Review the security implementation of the authentication system',
          keywords: ['review', 'security', 'analysis'],
          complexity: 'moderate',
          domain: 'security',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(3);

      // Reviewer should be highly ranked for review tasks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const reviewerRec = result.data.recommendations.find(
        (r: any) => r.personaId === 'reviewer'
      );
      expect(reviewerRec).toBeDefined();
      expect(reviewerRec!.score).toBeGreaterThan(60);
    });

    it('should explain persona fit accurately', async () => {
      const result = await recommendationTool.handleToolCall(
        'explain-persona-fit',
        {
          personaId: 'architect',
          title: 'System design',
          description: 'Design a high-performance distributed system',
          complexity: 'expert',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.persona.id).toBe('architect');
      expect(result.data.score).toBeGreaterThan(70);
      expect(result.data.reasoning).toContain('match');
      expect(result.data.strengths).toContain(
        'System-level thinking and design patterns'
      );
    });

    it('should compare personas accurately', async () => {
      const result = await recommendationTool.handleToolCall(
        'compare-personas',
        {
          personaIds: ['architect', 'developer', 'reviewer'],
          title: 'API design',
          description: 'Design RESTful APIs for the microservices',
          complexity: 'moderate',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.comparisons).toHaveLength(3);

      // Results should be sorted by score
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      const scores = result.data.comparisons.map((c: any) => c.score);
      for (let i = 0; i < scores.length - 1; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }

      // Architect should likely score highest for API design
      expect(result.data.comparisons[0].personaId).toBe('architect');
    });

    it('should provide system statistics', async () => {
      const result = await recommendationTool.handleToolCall(
        'get-recommendation-stats',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.data.totalPersonas).toBe(6);
      expect(result.data.availableRoles).toEqual(
        expect.arrayContaining([
          'architect',
          'developer',
          'reviewer',
          'debugger',
        ])
      );
      expect(result.data.scoringWeights).toBeDefined();
      expect(result.data.systemInfo).toBeDefined();
      expect(result.data.systemInfo.version).toBe('1.0.0');
      expect(result.data.systemInfo.features).toContain('keyword-matching');
    });

    it('should handle edge cases gracefully', async () => {
      // Test with minimal input
      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: 'Task',
          description: 'Do something',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(3);

      // All recommendations should have valid scores
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      result.data.recommendations.forEach((rec: any) => {
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(100);
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should handle complex tasks with multiple keywords', async () => {
      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: 'Full-stack development project',
          description:
            'Build a full-stack application with React frontend, Node.js backend, and PostgreSQL database',
          keywords: [
            'react',
            'nodejs',
            'postgresql',
            'full-stack',
            'database',
            'api',
          ],
          complexity: 'complex',
          domain: 'web development',
          urgency: 'high',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(3);

      // Should provide meaningful recommendations
      const topRec = result.data.recommendations[0];
      expect(topRec.score).toBeGreaterThan(30);
      expect(topRec.reasoning).toContain('match');
      expect(topRec.strengths).toHaveLength(3);
    });

    it('should maintain consistency across multiple calls', async () => {
      const taskArgs = {
        title: 'Database optimization',
        description: 'Optimize database queries and improve performance',
        keywords: ['database', 'optimization', 'performance'],
        complexity: 'moderate',
      };

      const result1 = await recommendationTool.handleToolCall(
        'recommend-persona',
        taskArgs
      );
      const result2 = await recommendationTool.handleToolCall(
        'recommend-persona',
        taskArgs
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Results should be identical for same input
      expect(result1.data.recommendations).toEqual(
        result2.data.recommendations
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool names gracefully', async () => {
      await expect(
        recommendationTool.handleToolCall('invalid-tool', {})
      ).rejects.toThrow('Unknown tool: invalid-tool');
    });

    it('should handle malformed input gracefully', async () => {
      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: '', // Invalid empty title
          description: 'Test',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent persona in explain-persona-fit', async () => {
      const result = await recommendationTool.handleToolCall(
        'explain-persona-fit',
        {
          personaId: 'nonexistent',
          title: 'Test task',
          description: 'Test description',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persona not found: nonexistent');
    });

    it('should handle empty persona list in compare-personas', async () => {
      const result = await recommendationTool.handleToolCall(
        'compare-personas',
        {
          personaIds: [],
          title: 'Test task',
          description: 'Test description',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.comparisons).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should process recommendations within reasonable time', async () => {
      const start = Date.now();

      const result = await recommendationTool.handleToolCall(
        'recommend-persona',
        {
          title: 'Performance test',
          description: 'Test recommendation performance',
          maxRecommendations: 5,
        }
      );

      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.data.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple concurrent requests', async () => {
      const tasks = Array(5)
        .fill(null)
        .map((_, i) =>
          recommendationTool.handleToolCall('recommend-persona', {
            title: `Task ${i}`,
            description: `Description for task ${i}`,
            complexity: 'moderate',
          })
        );

      const results = await Promise.all(tasks);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.recommendations).toHaveLength(3);
      });
    });
  });
});
