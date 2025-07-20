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

        if (!result.success) {
          console.error(
            `Validation errors for ${persona.id}:`,
            result.error.errors
          );
        }
        expect(result.success).toBe(true);
      }
    );
  });

  describe('Architect Persona', () => {
    it('should have correct basic properties', () => {
      expect(architectPersona.id).toBe('architect');
      expect(architectPersona.name).toBe('Software Architect');
      expect(architectPersona.role).toBe(PersonaRole.ARCHITECT);
      expect(architectPersona.core.identity).toContain('architect');
    });

    it('should have comprehensive expertise areas', () => {
      expect(architectPersona.expertise.domains).toContain(
        'System architecture patterns'
      );
      expect(architectPersona.expertise.domains).toContain(
        'Distributed systems design'
      );
      expect(architectPersona.expertise.skills).toContain(
        'Architectural decision making'
      );
      expect(architectPersona.expertise.domains.length).toBeGreaterThanOrEqual(
        4
      );
      expect(architectPersona.expertise.skills.length).toBeGreaterThanOrEqual(
        4
      );
    });

    it('should have detailed behavior structure', () => {
      expect(architectPersona.behavior.mindset).toContain(
        'Think in systems & interactions'
      );
      expect(architectPersona.behavior.methodology).toContain(
        'Analyze domain & business requirements'
      );
      expect(architectPersona.behavior.priorities).toContain(
        'Scalability & performance'
      );
      expect(architectPersona.behavior.antiPatterns).toContain(
        'Tightly coupled monoliths'
      );
    });

    it('should have relevant examples', () => {
      expect(architectPersona.examples).toBeDefined();
      expect(architectPersona.examples.length).toBeGreaterThanOrEqual(2);
      expect(
        architectPersona.examples.some(ex => ex.includes('Microservices'))
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
      expect(developerPersona.core.identity).toContain('craftsperson');
    });

    it('should have implementation-focused expertise', () => {
      expect(developerPersona.expertise.domains).toContain(
        'Clean code principles'
      );
      expect(developerPersona.expertise.domains).toContain(
        'Test-driven development'
      );
      expect(developerPersona.expertise.domains).toContain(
        'Refactoring techniques'
      );
      expect(developerPersona.expertise.skills).toContain(
        'Performance profiling'
      );
    });

    it('should have development-focused behavior structure', () => {
      expect(developerPersona.behavior.mindset).toContain(
        'Design foundations enable quality code'
      );
      expect(developerPersona.behavior.methodology).toContain(
        'Write failing tests first'
      );
      expect(developerPersona.behavior.priorities).toContain(
        'Correctness over speed'
      );
    });

    it('should have implementation examples', () => {
      expect(developerPersona.examples).toBeDefined();
      expect(developerPersona.examples.length).toBeGreaterThanOrEqual(2);
      expect(
        developerPersona.examples.some(
          ex => ex.includes('test') || ex.includes('Refactoring')
        )
      ).toBe(true);
    });
  });

  describe('Reviewer Persona', () => {
    it('should have correct basic properties', () => {
      expect(reviewerPersona.id).toBe('reviewer');
      expect(reviewerPersona.name).toBe('Code Reviewer');
      expect(reviewerPersona.role).toBe(PersonaRole.REVIEWER);
      expect(reviewerPersona.core.identity).toContain('reviewer');
    });

    it('should have review-focused expertise', () => {
      expect(reviewerPersona.expertise.domains).toContain(
        'Security vulnerability patterns'
      );
      expect(reviewerPersona.expertise.domains).toContain('Perf optimization');
      expect(reviewerPersona.expertise.skills).toContain(
        'Pattern recognition for bugs'
      );
      expect(reviewerPersona.expertise.skills).toContain(
        'Risk assessment & mitigation'
      );
    });

    it('should have review-focused behavior structure', () => {
      expect(reviewerPersona.behavior.mindset).toContain(
        'Every review teaches'
      );
      expect(reviewerPersona.behavior.methodology).toContain(
        'Third pass: assess security & perf'
      );
      expect(reviewerPersona.behavior.priorities).toContain(
        'Security over style'
      );
    });

    it('should have security and quality examples', () => {
      expect(reviewerPersona.examples).toBeDefined();
      expect(reviewerPersona.examples.length).toBeGreaterThanOrEqual(2);
      expect(
        reviewerPersona.examples.some(
          ex => ex.includes('SQL injection') || ex.includes('race condition')
        )
      ).toBe(true);
    });
  });

  describe('Debugger Persona', () => {
    it('should have correct basic properties', () => {
      expect(debuggerPersona.id).toBe('debugger');
      expect(debuggerPersona.name).toBe('Debugging Specialist');
      expect(debuggerPersona.role).toBe(PersonaRole.DEBUGGER);
      expect(debuggerPersona.core.identity).toContain('investigator');
    });

    it('should have debugging-focused expertise', () => {
      expect(debuggerPersona.expertise.domains).toContain(
        'Debugging techniques'
      );
      expect(debuggerPersona.expertise.domains).toContain(
        'Root cause analysis'
      );
      expect(debuggerPersona.expertise.skills).toContain('Pattern recognition');
      expect(debuggerPersona.expertise.skills).toContain(
        'Debugger tool mastery'
      );
    });

    it('should have systematic debugging approach', () => {
      expect(debuggerPersona.behavior.mindset).toContain(
        'Every bug has logical explanation'
      );
      expect(debuggerPersona.behavior.methodology).toContain(
        'Reproduce consistently'
      );
      expect(debuggerPersona.behavior.priorities).toContain(
        'Root cause over symptoms'
      );
    });

    it('should have debugging examples', () => {
      expect(debuggerPersona.examples).toBeDefined();
      expect(debuggerPersona.examples.length).toBeGreaterThanOrEqual(2);
      expect(
        debuggerPersona.examples.some(
          ex => ex.includes('Memory leak') || ex.includes('Race condition')
        )
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

    it('should all have complete core identity and behavior', () => {
      allPersonas.forEach(({ persona }) => {
        expect(persona.core.identity.length).toBeGreaterThan(50);
        expect(persona.behavior.mindset.length).toBeGreaterThanOrEqual(3);
        expect(persona.behavior.methodology.length).toBeGreaterThanOrEqual(4);
        expect(persona.behavior.priorities.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should all have at least 4 expertise domains and skills', () => {
      allPersonas.forEach(({ persona }) => {
        expect(persona.expertise.domains.length).toBeGreaterThanOrEqual(4);
        expect(persona.expertise.skills.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should all have examples and tags', () => {
      allPersonas.forEach(({ persona }) => {
        expect(persona.examples).toBeDefined();
        expect(persona.examples.length).toBeGreaterThanOrEqual(2);
        expect(persona.tags).toBeDefined();
        expect(persona.tags.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
