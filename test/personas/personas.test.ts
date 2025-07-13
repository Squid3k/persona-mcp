import { describe, it, expect } from 'vitest';
import { PersonaSchema, PersonaRole } from '../../src/types/persona.js';
import { architectPersona } from '../../src/personas/architect.js';
import { developerPersona } from '../../src/personas/developer.js';
import { reviewerPersona } from '../../src/personas/reviewer.js';
import { debuggerPersona } from '../../src/personas/debugger.js';

describe('Default Personas', () => {
  const allPersonas = [
    { persona: architectPersona, name: 'architect' },
    { persona: developerPersona, name: 'developer' },
    { persona: reviewerPersona, name: 'reviewer' },
    { persona: debuggerPersona, name: 'debugger' },
  ];

  describe('Schema Validation', () => {
    it.each(allPersonas)(
      'should validate $name persona against schema',
      ({ persona }) => {
        const result = PersonaSchema.safeParse(persona);

        expect(result.success).toBe(true);
        if (!result.success) {
          console.error(
            `Validation errors for ${persona.id}:`,
            result.error.errors
          );
        }
      }
    );
  });

  describe('Architect Persona', () => {
    it('should have correct basic properties', () => {
      expect(architectPersona.id).toBe('architect');
      expect(architectPersona.name).toBe('Software Architect');
      expect(architectPersona.role).toBe(PersonaRole.ARCHITECT);
      expect(architectPersona.description).toContain('system design');
    });

    it('should have comprehensive expertise areas', () => {
      expect(architectPersona.expertise).toContain('System architecture');
      expect(architectPersona.expertise).toContain('Design patterns');
      expect(architectPersona.expertise).toContain('Scalability');
      expect(architectPersona.expertise.length).toBeGreaterThan(5);
    });

    it('should have detailed prompt template', () => {
      expect(architectPersona.promptTemplate).toContain('Software Architect');
      expect(architectPersona.promptTemplate).toContain(
        'ARCHITECTURAL THINKING'
      );
      expect(architectPersona.promptTemplate).toContain('DESIGN PRINCIPLES');
    });

    it('should have relevant examples', () => {
      expect(architectPersona.examples).toBeDefined();
      expect(architectPersona.examples!.length).toBeGreaterThan(2);
      expect(
        architectPersona.examples!.some(ex => ex.includes('microservices'))
      ).toBe(true);
    });

    it('should have appropriate tags', () => {
      expect(architectPersona.tags).toContain('architecture');
      expect(architectPersona.tags).toContain('design');
      expect(architectPersona.tags).toContain('scalability');
    });
  });

  describe('Developer Persona', () => {
    it('should have correct basic properties', () => {
      expect(developerPersona.id).toBe('developer');
      expect(developerPersona.name).toBe('Code Developer');
      expect(developerPersona.role).toBe(PersonaRole.DEVELOPER);
      expect(developerPersona.description).toContain(
        'clean, efficient, and maintainable code'
      );
    });

    it('should have implementation-focused expertise', () => {
      expect(developerPersona.expertise).toContain('Clean code practices');
      expect(developerPersona.expertise).toContain('Test-driven development');
      expect(developerPersona.expertise).toContain('Refactoring');
      expect(developerPersona.expertise).toContain('Performance optimization');
    });

    it('should have development-focused prompt template', () => {
      expect(developerPersona.promptTemplate).toContain('Code Developer');
      expect(developerPersona.promptTemplate).toContain(
        'CLEAN CODE PRINCIPLES'
      );
      expect(developerPersona.promptTemplate).toContain('TESTING MINDSET');
    });

    it('should have implementation examples', () => {
      expect(developerPersona.examples).toBeDefined();
      expect(
        developerPersona.examples!.some(ex => ex.includes('unit tests'))
      ).toBe(true);
      expect(
        developerPersona.examples!.some(ex => ex.includes('Refactoring'))
      ).toBe(true);
    });
  });

  describe('Reviewer Persona', () => {
    it('should have correct basic properties', () => {
      expect(reviewerPersona.id).toBe('reviewer');
      expect(reviewerPersona.name).toBe('Code Reviewer');
      expect(reviewerPersona.role).toBe(PersonaRole.REVIEWER);
      expect(reviewerPersona.description).toContain(
        'code quality, security, performance'
      );
    });

    it('should have review-focused expertise', () => {
      expect(reviewerPersona.expertise).toContain('Code review best practices');
      expect(reviewerPersona.expertise).toContain('Security vulnerabilities');
      expect(reviewerPersona.expertise).toContain('Performance analysis');
      expect(reviewerPersona.expertise).toContain('Code quality metrics');
    });

    it('should have review-focused prompt template', () => {
      expect(reviewerPersona.promptTemplate).toContain('Code Reviewer');
      expect(reviewerPersona.promptTemplate).toContain('SECURITY & SAFETY');
      expect(reviewerPersona.promptTemplate).toContain(
        'PERFORMANCE & EFFICIENCY'
      );
    });

    it('should have security and quality examples', () => {
      expect(reviewerPersona.examples).toBeDefined();
      expect(
        reviewerPersona.examples!.some(ex => ex.includes('SQL injection'))
      ).toBe(true);
      expect(
        reviewerPersona.examples!.some(ex => ex.includes('race conditions'))
      ).toBe(true);
    });
  });

  describe('Debugger Persona', () => {
    it('should have correct basic properties', () => {
      expect(debuggerPersona.id).toBe('debugger');
      expect(debuggerPersona.name).toBe('Debugging Specialist');
      expect(debuggerPersona.role).toBe(PersonaRole.DEBUGGER);
      expect(debuggerPersona.description).toContain(
        'identifying, isolating, and fixing bugs'
      );
    });

    it('should have debugging-focused expertise', () => {
      expect(debuggerPersona.expertise).toContain('Debugging techniques');
      expect(debuggerPersona.expertise).toContain('Root cause analysis');
      expect(debuggerPersona.expertise).toContain('Error pattern recognition');
      expect(debuggerPersona.expertise).toContain('Logging and monitoring');
    });

    it('should have systematic debugging approach', () => {
      expect(debuggerPersona.promptTemplate).toContain('Debugging Specialist');
      expect(debuggerPersona.promptTemplate).toContain('SCIENTIFIC DEBUGGING');
      expect(debuggerPersona.promptTemplate).toContain('PROBLEM ISOLATION');
    });

    it('should have debugging examples', () => {
      expect(debuggerPersona.examples).toBeDefined();
      expect(
        debuggerPersona.examples!.some(ex => ex.includes('memory leak'))
      ).toBe(true);
      expect(
        debuggerPersona.examples!.some(ex => ex.includes('race condition'))
      ).toBe(true);
    });
  });

  describe('Consistency Checks', () => {
    it('should have unique IDs across all personas', () => {
      const ids = allPersonas.map(({ persona }) => persona.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names across all personas', () => {
      const names = allPersonas.map(({ persona }) => persona.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it('should all have non-empty prompt templates', () => {
      allPersonas.forEach(({ persona }) => {
        expect(persona.promptTemplate.length).toBeGreaterThan(100);
        expect(persona.promptTemplate).toContain(persona.name);
      });
    });

    it('should all have at least 3 expertise areas', () => {
      allPersonas.forEach(({ persona }) => {
        expect(persona.expertise.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should all have examples and tags', () => {
      allPersonas.forEach(({ persona }) => {
        expect(persona.examples).toBeDefined();
        expect(persona.examples!.length).toBeGreaterThan(0);
        expect(persona.tags).toBeDefined();
        expect(persona.tags!.length).toBeGreaterThan(0);
      });
    });
  });
});
