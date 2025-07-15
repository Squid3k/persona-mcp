import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecommendationEngine } from '../../src/recommendation/recommendation-engine.js';
import { EnhancedPersonaManager } from '../../src/enhanced-persona-manager.js';
import { Persona } from '../../src/types/persona.js';
import {
  TaskDescription,
  RecommendationRequest,
} from '../../src/types/recommendation.js';

// Mock EnhancedPersonaManager
vi.mock('../../src/enhanced-persona-manager.js', () => ({
  EnhancedPersonaManager: vi.fn(),
}));

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;
  let mockPersonaManager: EnhancedPersonaManager;
  let testPersonas: Persona[];
  let testTask: TaskDescription;

  beforeEach(() => {
    testPersonas = [
      {
        id: 'architect',
        name: 'Software Architect',
        role: 'architect',
        description: 'Focuses on system design and architecture',
        expertise: ['system design', 'architecture', 'scalability', 'patterns'],
        approach: 'Think big picture first',
        promptTemplate: 'You are an architect...',
        tags: ['architecture', 'design', 'system'],
      },
      {
        id: 'developer',
        name: 'Developer',
        role: 'developer',
        description: 'Focuses on code implementation',
        expertise: ['coding', 'implementation', 'testing', 'debugging'],
        approach: 'Write clean code',
        promptTemplate: 'You are a developer...',
        tags: ['coding', 'implementation'],
      },
      {
        id: 'reviewer',
        name: 'Code Reviewer',
        role: 'reviewer',
        description: 'Focuses on code quality and best practices',
        expertise: ['code review', 'quality', 'best practices', 'security'],
        approach: 'Ensure quality',
        promptTemplate: 'You are a reviewer...',
        tags: ['review', 'quality'],
      },
    ];

    mockPersonaManager = {
      getAllPersonas: vi.fn().mockReturnValue(testPersonas),
      getPersona: vi
        .fn()
        .mockImplementation((id: string) =>
          testPersonas.find(p => p.id === id)
        ),
    } as any;

    engine = new RecommendationEngine(mockPersonaManager);

    testTask = {
      title: 'Design a scalable microservices architecture',
      description:
        'We need to design a system that can handle high traffic and scale horizontally',
      keywords: ['microservices', 'scalability', 'architecture'],
      domain: 'backend',
      complexity: 'complex',
    };
  });

  describe('processRecommendation', () => {
    it('should process a basic recommendation request', async () => {
      const request: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 3,
        includeReasoning: true,
      };

      const response = await engine.processRecommendation(request);

      expect(response.recommendations).toHaveLength(3);
      expect(response.totalPersonasEvaluated).toBe(3);
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(response.recommendations[0].score).toBeGreaterThanOrEqual(0);
      expect(response.recommendations[0].score).toBeLessThanOrEqual(1);
    });

    it('should respect maxRecommendations parameter', async () => {
      const request: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 2,
        includeReasoning: true,
      };

      const response = await engine.processRecommendation(request);

      expect(response.recommendations).toHaveLength(2);
    });

    it('should sort recommendations by score in descending order', async () => {
      const request: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 3,
        includeReasoning: true,
      };

      const response = await engine.processRecommendation(request);

      for (let i = 0; i < response.recommendations.length - 1; i++) {
        expect(response.recommendations[i].score).toBeGreaterThanOrEqual(
          response.recommendations[i + 1].score
        );
      }
    });

    it('should include reasoning when requested', async () => {
      const request: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 2,
        includeReasoning: true,
      };

      const response = await engine.processRecommendation(request);

      response.recommendations.forEach(rec => {
        expect(rec.reasoning).toBeDefined();
        expect(rec.reasoning.length).toBeGreaterThan(0);
      });
    });

    it('should exclude reasoning when not requested', async () => {
      const request: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 2,
        includeReasoning: false,
      };

      const response = await engine.processRecommendation(request);

      response.recommendations.forEach(rec => {
        expect(rec.reasoning).toBe('');
      });
    });

    it('should include all required fields in recommendations', async () => {
      const request: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 1,
        includeReasoning: true,
      };

      const response = await engine.processRecommendation(request);
      const rec = response.recommendations[0];

      expect(rec.personaId).toBeDefined();
      expect(rec.score).toBeDefined();
      expect(rec.reasoning).toBeDefined();
      expect(rec.strengths).toBeDefined();
      expect(rec.confidence).toBeDefined();
      expect(Array.isArray(rec.strengths)).toBe(true);
    });
  });

  describe('getQuickRecommendation', () => {
    it('should return quick recommendation with minimal input', async () => {
      const recommendations = await engine.getQuickRecommendation(
        'Build a feature',
        'Create a new feature for the application'
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].personaId).toBeDefined();
      expect(recommendations[0].score).toBeGreaterThanOrEqual(0);
    });

    it('should accept optional parameters', async () => {
      const recommendations = await engine.getQuickRecommendation(
        'System design',
        'Design a complex system',
        { maxRecommendations: 2, keywords: ['architecture', 'design'] }
      );

      expect(recommendations).toHaveLength(2);
    });

    it('should default to 1 recommendation when not specified', async () => {
      const recommendations = await engine.getQuickRecommendation(
        'Task',
        'Description'
      );

      expect(recommendations).toHaveLength(1);
    });
  });

  describe('explainPersonaFit', () => {
    it('should explain fit for existing persona', async () => {
      const explanation = await engine.explainPersonaFit('architect', testTask);

      expect(explanation).toBeDefined();
      expect(explanation!.persona.id).toBe('architect');
      expect(explanation!.score).toBeGreaterThanOrEqual(0);
      expect(explanation!.score).toBeLessThanOrEqual(1);
      expect(explanation!.reasoning).toBeDefined();
      expect(explanation!.strengths).toBeDefined();
      expect(explanation!.limitations).toBeDefined();
      expect(explanation!.confidence).toBeGreaterThanOrEqual(0);
      expect(explanation!.confidence).toBeLessThanOrEqual(1);
    });

    it('should return null for non-existent persona', async () => {
      const explanation = await engine.explainPersonaFit(
        'nonexistent',
        testTask
      );
      expect(explanation).toBeNull();
    });

    it('should include all required fields in explanation', async () => {
      const explanation = await engine.explainPersonaFit('developer', testTask);

      expect(explanation).toBeDefined();
      expect(explanation!.persona).toBeDefined();
      expect(explanation!.score).toBeDefined();
      expect(explanation!.reasoning).toBeDefined();
      expect(explanation!.strengths).toBeDefined();
      expect(explanation!.limitations).toBeDefined();
      expect(explanation!.confidence).toBeDefined();
    });
  });

  describe('comparePersonas', () => {
    it('should compare multiple personas for the same task', async () => {
      const comparisons = await engine.comparePersonas(
        ['architect', 'developer', 'reviewer'],
        testTask
      );

      expect(comparisons).toHaveLength(3);
      expect(comparisons[0].personaId).toBe('architect');
      // Order of developer/reviewer may vary based on scoring
      expect(['developer', 'reviewer']).toContain(comparisons[1].personaId);
      expect(['developer', 'reviewer']).toContain(comparisons[2].personaId);
    });

    it('should sort comparisons by score in descending order', async () => {
      const comparisons = await engine.comparePersonas(
        ['architect', 'developer', 'reviewer'],
        testTask
      );

      for (let i = 0; i < comparisons.length - 1; i++) {
        expect(comparisons[i].score).toBeGreaterThanOrEqual(
          comparisons[i + 1].score
        );
      }
    });

    it('should filter out non-existent personas', async () => {
      const comparisons = await engine.comparePersonas(
        ['architect', 'nonexistent', 'developer'],
        testTask
      );

      expect(comparisons).toHaveLength(2);
      expect(comparisons.map(c => c.personaId)).toEqual(
        expect.arrayContaining(['architect', 'developer'])
      );
    });

    it('should handle empty persona list', async () => {
      const comparisons = await engine.comparePersonas([], testTask);
      expect(comparisons).toHaveLength(0);
    });
  });

  describe('getContextualRecommendations', () => {
    it('should adjust recommendations based on context', async () => {
      const recommendations = await engine.getContextualRecommendations(
        testTask,
        { teamSize: 5, timeConstraint: 'tight', priority: 'high' }
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].personaId).toBeDefined();
    });

    it('should handle minimal context', async () => {
      const recommendations = await engine.getContextualRecommendations(
        testTask,
        { teamSize: 2 }
      );

      expect(recommendations).toHaveLength(3);
    });

    it('should adjust complexity based on time constraint', async () => {
      const simpleTask: TaskDescription = {
        title: 'Simple task',
        description: 'A simple task without complexity specified',
      };

      const recommendations = await engine.getContextualRecommendations(
        simpleTask,
        { timeConstraint: 'tight' }
      );

      expect(recommendations).toHaveLength(3);
    });

    it('should adjust complexity based on priority', async () => {
      const simpleTask: TaskDescription = {
        title: 'Important task',
        description: 'An important task without complexity specified',
      };

      const recommendations = await engine.getContextualRecommendations(
        simpleTask,
        { priority: 'critical' }
      );

      expect(recommendations).toHaveLength(3);
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', () => {
      const stats = engine.getSystemStats();

      expect(stats.totalPersonas).toBe(3);
      expect(stats.availableRoles).toContain('architect');
      expect(stats.availableRoles).toContain('developer');
      expect(stats.availableRoles).toContain('reviewer');
      expect(stats.scoringWeights).toBeDefined();
      expect(stats.scoringWeights.keywordMatch).toBeDefined();
      expect(stats.scoringWeights.roleAlignment).toBeDefined();
      expect(stats.scoringWeights.expertiseMatch).toBeDefined();
      expect(stats.scoringWeights.contextRelevance).toBeDefined();
      expect(stats.scoringWeights.complexityFit).toBeDefined();
    });

    it('should return unique roles', () => {
      const stats = engine.getSystemStats();
      const uniqueRoles = [...new Set(stats.availableRoles)];
      expect(stats.availableRoles).toEqual(uniqueRoles);
    });
  });

  describe('updateScoringWeights', () => {
    it('should update scoring weights', () => {
      const newWeights = {
        keywordMatch: 0.4,
        roleAlignment: 0.3,
        expertiseMatch: 0.2,
        contextRelevance: 0.05,
        complexityFit: 0.05,
      };

      engine.updateScoringWeights(newWeights);

      const stats = engine.getSystemStats();
      expect(stats.scoringWeights).toEqual(newWeights);
    });

    it('should affect subsequent recommendations', async () => {
      const originalRequest: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 1,
        includeReasoning: true,
      };

      const originalResponse =
        await engine.processRecommendation(originalRequest);
      const originalScore = originalResponse.recommendations[0].score;

      // Update weights to heavily favor keyword matching
      engine.updateScoringWeights({
        keywordMatch: 0.9,
        roleAlignment: 0.05,
        expertiseMatch: 0.025,
        contextRelevance: 0.0125,
        complexityFit: 0.0125,
      });

      const newResponse = await engine.processRecommendation(originalRequest);
      const newScore = newResponse.recommendations[0].score;

      // The score should be different after weight update
      expect(newScore).not.toBe(originalScore);
    });
  });

  describe('error handling', () => {
    it('should handle empty persona list gracefully', async () => {
      mockPersonaManager.getAllPersonas = vi.fn().mockReturnValue([]);

      const request: RecommendationRequest = {
        task: testTask,
        maxRecommendations: 3,
        includeReasoning: true,
      };

      const response = await engine.processRecommendation(request);

      expect(response.recommendations).toHaveLength(0);
      expect(response.totalPersonasEvaluated).toBe(0);
    });

    it('should handle malformed task gracefully', async () => {
      const malformedTask: TaskDescription = {
        title: '',
        description: '',
      };

      const request: RecommendationRequest = {
        task: malformedTask,
        maxRecommendations: 1,
        includeReasoning: true,
      };

      const response = await engine.processRecommendation(request);

      expect(response.recommendations).toHaveLength(1);
      expect(response.recommendations[0].score).toBeGreaterThanOrEqual(0);
    });
  });
});
