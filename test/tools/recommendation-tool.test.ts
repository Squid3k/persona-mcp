import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecommendationTool } from '../../src/tools/recommendation-tool.js';
import { EnhancedPersonaManager } from '../../src/enhanced-persona-manager.js';
import { Persona } from '../../src/types/persona.js';

// Mock the dependencies
vi.mock('../../src/enhanced-persona-manager.js', () => ({
  EnhancedPersonaManager: vi.fn(),
}));

vi.mock('../../src/recommendation/recommendation-engine.js', () => ({
  RecommendationEngine: vi.fn().mockImplementation(() => ({
    processRecommendation: vi.fn(),
    explainPersonaFit: vi.fn(),
    comparePersonas: vi.fn(),
    getSystemStats: vi.fn(),
  })),
}));

describe('RecommendationTool', () => {
  let tool: RecommendationTool;
  let mockPersonaManager: EnhancedPersonaManager;
  let mockRecommendationEngine: any;

  beforeEach(() => {
    mockPersonaManager = {
      getAllPersonas: vi.fn(),
      getPersona: vi.fn(),
    } as any;

    tool = new RecommendationTool(mockPersonaManager);
    mockRecommendationEngine = (tool as any).recommendationEngine;
  });

  describe('getToolDefinitions', () => {
    it('should return all tool definitions', () => {
      const definitions = tool.getToolDefinitions();

      expect(definitions).toHaveLength(4);
      expect(definitions.map(d => d.name)).toEqual([
        'recommend-persona',
        'explain-persona-fit',
        'compare-personas',
        'get-recommendation-stats',
      ]);
    });

    it('should have properly structured tool definitions', () => {
      const definitions = tool.getToolDefinitions();

      definitions.forEach(def => {
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.inputSchema).toBeDefined();
        expect(def.inputSchema.type).toBe('object');
        expect(def.inputSchema.properties).toBeDefined();
      });
    });

    it('should have required fields defined for recommend-persona', () => {
      const definitions = tool.getToolDefinitions();
      const recommendDef = definitions.find(
        d => d.name === 'recommend-persona'
      );

      expect(recommendDef?.inputSchema.required).toEqual([
        'title',
        'description',
      ]);
    });

    it('should have required fields defined for explain-persona-fit', () => {
      const definitions = tool.getToolDefinitions();
      const explainDef = definitions.find(
        d => d.name === 'explain-persona-fit'
      );

      expect(explainDef?.inputSchema.required).toEqual([
        'personaId',
        'title',
        'description',
      ]);
    });

    it('should have required fields defined for compare-personas', () => {
      const definitions = tool.getToolDefinitions();
      const compareDef = definitions.find(d => d.name === 'compare-personas');

      expect(compareDef?.inputSchema.required).toEqual([
        'personaIds',
        'title',
        'description',
      ]);
    });

    it('should have enum values for complexity and urgency', () => {
      const definitions = tool.getToolDefinitions();
      const recommendDef = definitions.find(
        d => d.name === 'recommend-persona'
      );

      expect(
        (recommendDef?.inputSchema.properties as any)?.complexity?.enum
      ).toEqual(['simple', 'moderate', 'complex', 'expert']);
      expect(
        (recommendDef?.inputSchema.properties as any)?.urgency?.enum
      ).toEqual(['low', 'medium', 'high', 'critical']);
    });
  });

  describe('handleToolCall', () => {
    it('should route to correct handler for recommend-persona', async () => {
      const args = {
        title: 'Test task',
        description: 'Test description',
      };

      mockRecommendationEngine.processRecommendation.mockResolvedValue({
        recommendations: [
          {
            personaId: 'test',
            score: 0.8,
            reasoning: 'Good match',
            strengths: ['strength1'],
            confidence: 0.9,
          },
        ],
        totalPersonasEvaluated: 1,
        processingTimeMs: 100,
      });

      const result = (await tool.handleToolCall(
        'recommend-persona',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(1);
      expect(result.data.recommendations[0].score).toBe(80); // Converted to percentage
    });

    it('should route to correct handler for explain-persona-fit', async () => {
      const args = {
        personaId: 'test',
        title: 'Test task',
        description: 'Test description',
      };

      const mockPersona: Persona = {
        id: 'test',
        name: 'Test Persona',
        role: 'developer',
        core: {
          identity: 'Test description',
          primaryObjective: 'Test objectives',
          constraints: ['Constraint 1', 'Constraint 2', 'Constraint 3'],
        },
        behavior: {
          mindset: ['Mindset 1', 'Mindset 2', 'Mindset 3'],
          methodology: ['Method 1', 'Method 2', 'Method 3', 'Method 4'],
          priorities: ['Priority 1', 'Priority 2', 'Priority 3'],
          antiPatterns: ['Anti 1', 'Anti 2', 'Anti 3'],
        },
        expertise: {
          domains: ['testing', 'development', 'coding', 'programming'],
          skills: [
            'test automation',
            'debugging',
            'refactoring',
            'code review',
          ],
        },
        decisionCriteria: ['Criteria 1', 'Criteria 2', 'Criteria 3'],
        examples: ['Example 1', 'Example 2'],
        tags: ['test', 'dev'],
      };

      mockRecommendationEngine.explainPersonaFit.mockResolvedValue({
        persona: mockPersona,
        score: 0.7,
        reasoning: 'Good fit',
        strengths: ['strength1'],
        limitations: ['limitation1'],
        confidence: 0.8,
      });

      const result = (await tool.handleToolCall(
        'explain-persona-fit',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.persona.id).toBe('test');
      expect(result.data.score).toBe(70);
      expect(result.data.confidence).toBe(80);
    });

    it('should route to correct handler for compare-personas', async () => {
      const args = {
        personaIds: ['test1', 'test2'],
        title: 'Test task',
        description: 'Test description',
      };

      mockRecommendationEngine.comparePersonas.mockResolvedValue([
        {
          personaId: 'test1',
          score: 0.8,
          reasoning: 'Good match',
          strengths: ['strength1'],
          confidence: 0.9,
        },
        {
          personaId: 'test2',
          score: 0.6,
          reasoning: 'Moderate match',
          strengths: ['strength2'],
          confidence: 0.7,
        },
      ]);

      const result = (await tool.handleToolCall(
        'compare-personas',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.comparisons).toHaveLength(2);
      expect(result.data.comparisons[0].score).toBe(80);
      expect(result.data.comparisons[1].score).toBe(60);
    });

    it('should route to correct handler for get-recommendation-stats', async () => {
      mockRecommendationEngine.getSystemStats.mockReturnValue({
        totalPersonas: 4,
        availableRoles: ['architect', 'developer'],
        scoringWeights: {
          keywordMatch: 0.3,
          roleAlignment: 0.25,
          expertiseMatch: 0.2,
          contextRelevance: 0.15,
          complexityFit: 0.1,
        },
      });

      const result = (await tool.handleToolCall(
        'get-recommendation-stats',
        {}
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.totalPersonas).toBe(4);
      expect(result.data.availableRoles).toEqual(['architect', 'developer']);
      expect(result.data.scoringWeights).toBeDefined();
      expect(result.data.systemInfo).toBeDefined();
    });

    it('should throw error for unknown tool', async () => {
      await expect(tool.handleToolCall('unknown-tool', {})).rejects.toThrow(
        'Unknown tool: unknown-tool'
      );
    });
  });

  describe('handleRecommendPersona', () => {
    it('should handle valid input', async () => {
      const args = {
        title: 'Design system',
        description: 'Design a scalable system',
        keywords: ['architecture', 'scalability'],
        complexity: 'complex',
        maxRecommendations: 2,
      };

      mockRecommendationEngine.processRecommendation.mockResolvedValue({
        recommendations: [
          {
            personaId: 'architect',
            score: 0.9,
            reasoning: 'Excellent match',
            strengths: ['system design', 'architecture'],
            limitations: undefined,
            confidence: 0.95,
          },
        ],
        totalPersonasEvaluated: 4,
        processingTimeMs: 50,
      });

      const result = (await tool.handleToolCall(
        'recommend-persona',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(1);
      expect(result.data.recommendations[0].personaId).toBe('architect');
      expect(result.data.recommendations[0].score).toBe(90);
      expect(result.data.recommendations[0].confidence).toBe(95);
      expect(result.data.totalPersonasEvaluated).toBe(4);
      expect(result.data.processingTimeMs).toBe(50);
    });

    it('should handle minimal input', async () => {
      const args = {
        title: 'Simple task',
        description: 'A simple task',
      };

      mockRecommendationEngine.processRecommendation.mockResolvedValue({
        recommendations: [
          {
            personaId: 'developer',
            score: 0.6,
            reasoning: 'Moderate match',
            strengths: ['implementation'],
            confidence: 0.7,
          },
        ],
        totalPersonasEvaluated: 4,
        processingTimeMs: 30,
      });

      const result = (await tool.handleToolCall(
        'recommend-persona',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(1);
    });

    it('should handle validation errors', async () => {
      const args = {
        title: '', // Invalid empty title
        description: 'Test description',
      };

      const result = (await tool.handleToolCall(
        'recommend-persona',
        args
      )) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle processing errors', async () => {
      const args = {
        title: 'Test task',
        description: 'Test description',
      };

      mockRecommendationEngine.processRecommendation.mockRejectedValue(
        new Error('Processing failed')
      );

      const result = (await tool.handleToolCall(
        'recommend-persona',
        args
      )) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing failed');
    });

    it('should use default values for optional parameters', async () => {
      const args = {
        title: 'Test task',
        description: 'Test description',
      };

      mockRecommendationEngine.processRecommendation.mockResolvedValue({
        recommendations: [],
        totalPersonasEvaluated: 0,
        processingTimeMs: 0,
      });

      await tool.handleToolCall('recommend-persona', args);

      expect(
        mockRecommendationEngine.processRecommendation
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          maxRecommendations: 3,
          includeReasoning: true,
        })
      );
    });
  });

  describe('handleExplainPersonaFit', () => {
    it('should handle valid persona explanation', async () => {
      const args = {
        personaId: 'architect',
        title: 'System design',
        description: 'Design a complex system',
      };

      const mockPersona: Persona = {
        id: 'architect',
        name: 'Software Architect',
        role: 'architect',
        core: {
          identity: 'Architecture expert',
          primaryObjective: 'Design scalable systems',
          constraints: [
            'Think big picture',
            'Consider scalability',
            'Ensure maintainability',
          ],
        },
        behavior: {
          mindset: ['System thinking', 'Long-term view', 'Scalability focus'],
          methodology: [
            'Analyze requirements',
            'Design architecture',
            'Document decisions',
            'Review implementation',
          ],
          priorities: ['Scalability', 'Maintainability', 'Performance'],
          antiPatterns: [
            'Over-engineering',
            'Ignoring constraints',
            'Short-term thinking',
          ],
        },
        expertise: {
          domains: ['architecture', 'system design', 'scalability', 'patterns'],
          skills: [
            'system design',
            'architecture patterns',
            'scalability analysis',
            'technology selection',
          ],
        },
        decisionCriteria: [
          'Is it scalable?',
          'Is it maintainable?',
          'Does it meet requirements?',
        ],
        examples: ['Design microservices', 'Create system blueprints'],
        tags: ['architecture', 'design', 'system'],
      };

      mockRecommendationEngine.explainPersonaFit.mockResolvedValue({
        persona: mockPersona,
        score: 0.85,
        reasoning: 'Perfect match for system design',
        strengths: ['system thinking', 'architecture patterns'],
        limitations: ['might overcomplicate simple tasks'],
        confidence: 0.9,
      });

      const result = (await tool.handleToolCall(
        'explain-persona-fit',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.persona.id).toBe('architect');
      expect(result.data.score).toBe(85);
      expect(result.data.confidence).toBe(90);
      expect(result.data.strengths).toHaveLength(2);
      expect(result.data.limitations).toHaveLength(1);
    });

    it('should handle non-existent persona', async () => {
      const args = {
        personaId: 'nonexistent',
        title: 'Test task',
        description: 'Test description',
      };

      mockRecommendationEngine.explainPersonaFit.mockResolvedValue(null);

      const result = (await tool.handleToolCall(
        'explain-persona-fit',
        args
      )) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persona not found: nonexistent');
    });

    it('should handle validation errors', async () => {
      const args = {
        personaId: 'architect',
        title: '', // Invalid empty title
        description: 'Test description',
      };

      const result = (await tool.handleToolCall(
        'explain-persona-fit',
        args
      )) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('handleComparePersonas', () => {
    it('should handle valid persona comparison', async () => {
      const args = {
        personaIds: ['architect', 'developer'],
        title: 'System task',
        description: 'Build a system',
      };

      mockRecommendationEngine.comparePersonas.mockResolvedValue([
        {
          personaId: 'architect',
          score: 0.9,
          reasoning: 'Excellent for system design',
          strengths: ['architecture'],
          confidence: 0.95,
        },
        {
          personaId: 'developer',
          score: 0.7,
          reasoning: 'Good for implementation',
          strengths: ['coding'],
          confidence: 0.8,
        },
      ]);

      const result = (await tool.handleToolCall(
        'compare-personas',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.comparisons).toHaveLength(2);
      expect(result.data.comparisons[0].score).toBe(90);
      expect(result.data.comparisons[1].score).toBe(70);
      expect(result.data.task).toBeDefined();
    });

    it('should handle empty persona list', async () => {
      const args = {
        personaIds: [],
        title: 'Test task',
        description: 'Test description',
      };

      mockRecommendationEngine.comparePersonas.mockResolvedValue([]);

      const result = (await tool.handleToolCall(
        'compare-personas',
        args
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.comparisons).toHaveLength(0);
    });

    it('should handle errors during persona comparison', async () => {
      const args = {
        personaIds: ['architect', 'developer'],
        title: 'Test task',
        description: 'Test description',
      };

      const testError = new Error('Comparison failed');
      mockRecommendationEngine.comparePersonas.mockRejectedValue(testError);

      const result = (await tool.handleToolCall(
        'compare-personas',
        args
      )) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comparison failed');
    });

    it('should handle non-Error exceptions during comparison', async () => {
      const args = {
        personaIds: ['architect', 'developer'],
        title: 'Test task',
        description: 'Test description',
      };

      mockRecommendationEngine.comparePersonas.mockRejectedValue(
        'String error'
      );

      const result = (await tool.handleToolCall(
        'compare-personas',
        args
      )) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('handleGetStats', () => {
    it('should return system statistics', async () => {
      mockRecommendationEngine.getSystemStats.mockReturnValue({
        totalPersonas: 4,
        availableRoles: ['architect', 'developer', 'reviewer', 'debugger'],
        scoringWeights: {
          keywordMatch: 0.3,
          roleAlignment: 0.25,
          expertiseMatch: 0.2,
          contextRelevance: 0.15,
          complexityFit: 0.1,
        },
      });

      const result = (await tool.handleToolCall(
        'get-recommendation-stats',
        {}
      )) as any;

      expect(result.success).toBe(true);
      expect(result.data.totalPersonas).toBe(4);
      expect(result.data.availableRoles).toHaveLength(4);
      expect(result.data.scoringWeights).toBeDefined();
      expect(result.data.systemInfo).toBeDefined();
      expect(result.data.systemInfo.version).toBeDefined();
      expect(result.data.systemInfo.features).toBeDefined();
    });

    it('should handle stats retrieval errors', async () => {
      mockRecommendationEngine.getSystemStats.mockImplementation(() => {
        throw new Error('Stats unavailable');
      });

      const result = (await tool.handleToolCall(
        'get-recommendation-stats',
        {}
      )) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stats unavailable');
    });
  });
});
