import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaScorer } from '../../src/recommendation/persona-scorer.js';
import { Persona } from '../../src/types/persona.js';
import { TaskDescription } from '../../src/types/recommendation.js';

describe('PersonaScorer', () => {
  let scorer: PersonaScorer;
  let testPersona: Persona;
  let testTask: TaskDescription;

  beforeEach(() => {
    scorer = new PersonaScorer();

    testPersona = {
      id: 'test-architect',
      name: 'Test Architect',
      role: 'architect',
      description: 'Focuses on system design and architecture',
      expertise: ['system design', 'architecture', 'scalability', 'patterns'],
      approach: 'Think big picture first',
      promptTemplate: 'You are an architect...',
      tags: ['architecture', 'design', 'system'],
    };

    testTask = {
      title: 'Design a scalable microservices architecture',
      description:
        'We need to design a system that can handle high traffic and scale horizontally',
      keywords: ['microservices', 'scalability', 'architecture'],
      domain: 'backend',
      complexity: 'complex',
    };
  });

  describe('scorePersona', () => {
    it('should return a score between 0 and 1', () => {
      const score = scorer.scorePersona(testPersona, testTask);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return higher score for well-matched persona and task', () => {
      const score = scorer.scorePersona(testPersona, testTask);
      expect(score).toBeGreaterThan(0.6); // Should be a good match
    });

    it('should return lower score for mismatched persona and task', () => {
      const mismatchedTask: TaskDescription = {
        title: 'Write unit tests',
        description: 'Create comprehensive unit tests for the payment module',
        keywords: ['testing', 'unit tests', 'jest'],
        domain: 'testing',
        complexity: 'simple',
      };

      const score = scorer.scorePersona(testPersona, mismatchedTask);
      expect(score).toBeLessThan(0.5); // Should be a poor match
    });

    it('should handle task without optional fields', () => {
      const simpleTask: TaskDescription = {
        title: 'Build a feature',
        description: 'Create a new feature for the application',
      };

      const score = scorer.scorePersona(testPersona, simpleTask);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should consider keyword matches in scoring', () => {
      const taskWithKeywords: TaskDescription = {
        title: 'System architecture',
        description: 'Design system architecture',
        keywords: ['system design', 'architecture'],
      };

      const taskWithoutKeywords: TaskDescription = {
        title: 'Random task',
        description: 'Some unrelated task',
      };

      const scoreWithKeywords = scorer.scorePersona(
        testPersona,
        taskWithKeywords
      );
      const scoreWithoutKeywords = scorer.scorePersona(
        testPersona,
        taskWithoutKeywords
      );

      expect(scoreWithKeywords).toBeGreaterThan(scoreWithoutKeywords);
    });

    it('should handle different complexity levels appropriately', () => {
      const complexTask: TaskDescription = {
        title: 'Enterprise architecture',
        description: 'Design enterprise-level architecture',
        complexity: 'expert',
      };

      const simpleTask: TaskDescription = {
        title: 'Simple component',
        description: 'Create a simple component',
        complexity: 'simple',
      };

      const complexScore = scorer.scorePersona(testPersona, complexTask);
      const simpleScore = scorer.scorePersona(testPersona, simpleTask);

      expect(complexScore).toBeGreaterThan(simpleScore);
    });
  });

  describe('generateReasoning', () => {
    it('should generate excellent match reasoning for very high scores', () => {
      const score = 0.85;
      const reasoning = scorer.generateReasoning(testPersona, testTask, score);

      expect(reasoning).toContain('Excellent match');
      expect(reasoning).toContain(testTask.title);
      expect(reasoning.length).toBeGreaterThan(10);
    });

    it('should generate meaningful reasoning for high scores', () => {
      const score = 0.7;
      const reasoning = scorer.generateReasoning(testPersona, testTask, score);

      expect(reasoning).toContain('Good match');
      expect(reasoning).toContain(testTask.title);
      expect(reasoning.length).toBeGreaterThan(10);
    });

    it('should generate appropriate reasoning for low scores', () => {
      const score = 0.3;
      const reasoning = scorer.generateReasoning(testPersona, testTask, score);

      expect(reasoning).toContain('Limited match');
      expect(reasoning).toContain(testTask.title);
    });

    it('should include keyword matches in reasoning', () => {
      const score = 0.7;
      const reasoning = scorer.generateReasoning(testPersona, testTask, score);

      expect(reasoning).toContain('keyword alignment');
    });

    it('should include complexity information when available', () => {
      const score = 0.7;
      const reasoning = scorer.generateReasoning(testPersona, testTask, score);

      expect(reasoning).toMatch(/complex|expert|moderate|simple/i);
    });
  });

  describe('identifyStrengths', () => {
    it('should identify relevant strengths', () => {
      const strengths = scorer.identifyStrengths(testPersona, testTask);

      expect(strengths).toBeInstanceOf(Array);
      expect(strengths.length).toBeGreaterThan(0);
      expect(strengths.length).toBeLessThanOrEqual(3);
    });

    it('should include role-specific strengths', () => {
      const strengths = scorer.identifyStrengths(testPersona, testTask);

      expect(strengths.some(s => s.includes('System-level thinking'))).toBe(
        true
      );
    });

    it('should identify expertise matches', () => {
      const strengths = scorer.identifyStrengths(testPersona, testTask);

      expect(
        strengths.some(
          s => s.includes('Specialized in') || s.includes('Expert knowledge')
        )
      ).toBe(true);
    });

    it('should identify debugger role strengths', () => {
      const debuggerPersona: Persona = {
        id: 'test-debugger',
        name: 'Test Debugger',
        role: 'debugger',
        description: 'Focuses on debugging and problem-solving',
        expertise: ['debugging', 'troubleshooting'],
        approach: 'Systematic analysis',
        promptTemplate: 'You are a debugger...',
        tags: ['debugging', 'analysis'],
      };

      const debugTask: TaskDescription = {
        title: 'Debug performance issue',
        description: 'Find root cause of performance degradation',
        domain: 'backend',
      };

      const strengths = scorer.identifyStrengths(debuggerPersona, debugTask);

      expect(strengths.some(s => s.includes('Systematic problem-solving'))).toBe(true);
    });
  });

  describe('identifyLimitations', () => {
    it('should identify limitations when appropriate', () => {
      const taskWithUnknownDomain: TaskDescription = {
        title: 'Mobile app development',
        description: 'Build a mobile application',
        domain: 'mobile development',
        complexity: 'simple',
      };

      const limitations = scorer.identifyLimitations(
        testPersona,
        taskWithUnknownDomain
      );

      expect(limitations).toBeInstanceOf(Array);
      expect(limitations.length).toBeLessThanOrEqual(2);
    });

    it('should identify complexity mismatches', () => {
      const simpleTask: TaskDescription = {
        title: 'Simple component',
        description: 'Create a simple component',
        complexity: 'simple',
      };

      const limitations = scorer.identifyLimitations(testPersona, simpleTask);

      expect(limitations.some(l => l.includes('overcomplicate'))).toBe(true);
    });

    it('should identify architectural guidance needed for expert tasks with non-architect persona', () => {
      const developerPersona: Persona = {
        id: 'test-developer',
        name: 'Test Developer',
        role: 'developer',
        description: 'Focuses on implementation',
        expertise: ['coding', 'implementation'],
        approach: 'Code first',
        promptTemplate: 'You are a developer...',
        tags: ['development', 'coding'],
      };

      const expertTask: TaskDescription = {
        title: 'Complex distributed system',
        description: 'Design a complex distributed system',
        complexity: 'expert',
        domain: 'backend',
      };

      const limitations = scorer.identifyLimitations(developerPersona, expertTask);

      expect(limitations.some(l => l.includes('architectural guidance'))).toBe(true);
    });

    it('should return empty array when no limitations identified', () => {
      const wellMatchedTask: TaskDescription = {
        title: 'System architecture design',
        description: 'Design a complex system architecture',
        domain: 'backend',
        complexity: 'complex',
      };

      const limitations = scorer.identifyLimitations(
        testPersona,
        wellMatchedTask
      );

      expect(limitations).toBeInstanceOf(Array);
    });
  });

  describe('custom scoring weights', () => {
    it('should use custom weights when provided', () => {
      const customWeights = {
        keywordMatch: 0.5,
        roleAlignment: 0.3,
        expertiseMatch: 0.1,
        contextRelevance: 0.05,
        complexityFit: 0.05,
      };

      const customScorer = new PersonaScorer(customWeights);
      const score = customScorer.scorePersona(testPersona, testTask);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should use default weights when not provided', () => {
      const defaultScorer = new PersonaScorer();
      const score = defaultScorer.scorePersona(testPersona, testTask);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle persona with minimal information', () => {
      const minimalPersona: Persona = {
        id: 'minimal',
        name: 'Minimal',
        role: 'developer',
        description: 'Basic persona',
        expertise: ['coding'],
        approach: 'Code',
        promptTemplate: 'Code',
      };

      const score = scorer.scorePersona(minimalPersona, testTask);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle task with very long description', () => {
      const longTask: TaskDescription = {
        title: 'Complex system',
        description:
          'A'.repeat(1000) + ' system design architecture scalability patterns',
      };

      const score = scorer.scorePersona(testPersona, longTask);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle empty keywords array', () => {
      const taskWithEmptyKeywords: TaskDescription = {
        title: 'System design',
        description: 'Design a system',
        keywords: [],
      };

      const score = scorer.scorePersona(testPersona, taskWithEmptyKeywords);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('complexity fit in reasoning', () => {
    it('should include default complexity fit message for unknown role', () => {
      // Test with a custom persona that has an unusual role
      const customPersona: Persona = {
        id: 'custom',
        name: 'Custom Role',
        role: 'specialist' as any, // Role not in the predefined list
        description: 'Custom specialist',
        expertise: ['custom'],
        approach: 'Custom approach',
        promptTemplate: 'Custom template',
      };

      const task: TaskDescription = {
        title: 'Task',
        description: 'Some task',
        complexity: 'moderate',
      };

      // The complexity fit message should appear in the reasoning
      const score = scorer.scorePersona(customPersona, task);
      const reasoning = scorer.generateReasoning(customPersona, task, score);
      
      expect(reasoning).toContain('Moderate fit for this complexity level');
    });
  });
});
