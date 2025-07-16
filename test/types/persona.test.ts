import { describe, it, expect } from 'vitest';
import {
  PersonaSchema,
  PersonaRole,
  type Persona,
} from '../../src/types/persona.js';

describe('Persona Types', () => {
  describe('PersonaSchema', () => {
    const validPersona = {
      id: 'test-persona',
      name: 'Test Persona',
      role: 'tester',
      core: {
        identity: 'You are a test persona for validation',
        primaryObjective: 'Validate and test system functionality',
        constraints: [
          'Must follow testing best practices',
          'Cannot skip validation steps',
          'Must maintain test coverage',
        ],
      },
      behavior: {
        mindset: [
          'Think systematically about edge cases',
          'Consider user experience impact',
          'Validate assumptions through testing',
        ],
        methodology: [
          'Analyze requirements thoroughly',
          'Design comprehensive test cases',
          'Execute tests systematically',
          'Document findings clearly',
        ],
        priorities: [
          'Test coverage and completeness',
          'Bug detection and prevention',
          'System reliability',
        ],
        antiPatterns: [
          'Skipping edge case testing',
          'Ignoring error conditions',
          'Rushing through validation',
        ],
      },
      expertise: {
        domains: [
          'Test automation',
          'Quality assurance',
          'Bug detection',
          'System validation',
        ],
        skills: [
          'Test case design',
          'Automated testing',
          'Performance testing',
          'Security testing',
        ],
      },
      decisionCriteria: [
        'Does this improve test coverage?',
        'Will this catch potential bugs?',
        'Is this testable and maintainable?',
      ],
      examples: ['Example 1', 'Example 2'],
      tags: ['test', 'validation', 'persona'],
    };

    it('should validate a complete valid persona', () => {
      const result = PersonaSchema.safeParse(validPersona);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPersona);
      }
    });

    it('should validate persona without optional fields', () => {
      const minimalPersona = {
        id: 'minimal',
        name: 'Minimal Persona',
        role: 'minimal',
        core: {
          identity: 'You are a minimal persona',
          primaryObjective: 'Perform minimal tasks',
          constraints: [
            'Keep things simple',
            'Avoid complexity',
            'Focus on essentials',
          ],
        },
        behavior: {
          mindset: [
            'Simple and direct',
            'Minimal complexity',
            'Essential focus',
          ],
          methodology: [
            'Identify core requirements',
            'Implement minimal solution',
            'Verify basic functionality',
            'Maintain simplicity',
          ],
          priorities: [
            'Simplicity first',
            'Core functionality',
            'Easy maintenance',
          ],
          antiPatterns: [
            'Over-engineering',
            'Unnecessary complexity',
            'Feature creep',
          ],
        },
        expertise: {
          domains: [
            'Minimal design',
            'Simple solutions',
            'Core functionality',
            'Basic implementation',
          ],
          skills: [
            'Simplification',
            'Essential feature identification',
            'Basic implementation',
            'Core system design',
          ],
        },
        decisionCriteria: [
          'Is this necessary?',
          'Does this add complexity?',
          'Can this be simplified?',
        ],
        examples: ['Minimal example', 'Basic example'],
        tags: ['minimal', 'simple', 'basic'],
      };

      const result = PersonaSchema.safeParse(minimalPersona);

      expect(result.success).toBe(true);
    });

    it('should reject persona with missing required fields', () => {
      const invalidPersona = {
        name: 'Invalid Persona',
        // missing id, role, core, behavior, expertise, decisionCriteria, examples, tags
      };

      const result = PersonaSchema.safeParse(invalidPersona);

      expect(result.success).toBe(false);
    });

    it('should reject persona with invalid field types', () => {
      const invalidPersona = {
        id: 123, // should be string
        name: 'Test Persona',
        role: 'tester',
        core: 'not-object', // should be object
        behavior: 'not-object', // should be object
        expertise: 'not-object', // should be object
        decisionCriteria: 'not-array', // should be array
        examples: 'not-array', // should be array
        tags: 'not-array', // should be array
      };

      const result = PersonaSchema.safeParse(invalidPersona);

      expect(result.success).toBe(false);
    });

    it('should reject persona with empty required strings', () => {
      const invalidPersona = {
        id: '',
        name: '',
        role: '',
        core: {
          identity: '',
          primaryObjective: '',
          constraints: [],
        },
        behavior: {
          mindset: [],
          methodology: [],
          priorities: [],
          antiPatterns: [],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: [],
        examples: [],
        tags: [],
      };

      const result = PersonaSchema.safeParse(invalidPersona);

      expect(result.success).toBe(false);
    });

    it('should validate persona with optional behaviorDiagrams', () => {
      const personaWithOptionalDiagrams = {
        ...validPersona,
        behaviorDiagrams: [
          {
            title: 'Test Diagram',
            mermaidDSL: 'graph TD\n  A --> B',
            diagramType: 'flowchart' as const,
            description: 'A test diagram',
          },
        ],
      };

      const result = PersonaSchema.safeParse(personaWithOptionalDiagrams);

      expect(result.success).toBe(true);
    });
  });

  describe('PersonaRole', () => {
    it('should contain expected role constants', () => {
      expect(PersonaRole.ARCHITECT).toBe('architect');
      expect(PersonaRole.DEVELOPER).toBe('developer');
      expect(PersonaRole.REVIEWER).toBe('reviewer');
      expect(PersonaRole.DEBUGGER).toBe('debugger');
      expect(PersonaRole.OPTIMIZER).toBe('optimizer');
      expect(PersonaRole.SECURITY_ANALYST).toBe('security-analyst');
      expect(PersonaRole.TESTER).toBe('tester');
    });

    it('should have all roles as string literals', () => {
      Object.values(PersonaRole).forEach(role => {
        expect(typeof role).toBe('string');
        expect(role.length).toBeGreaterThan(0);
      });
    });

    it('should contain exactly 11 predefined roles', () => {
      const roleKeys = Object.keys(PersonaRole);
      expect(roleKeys).toHaveLength(11);
    });
  });

  describe('Type compatibility', () => {
    it('should accept PersonaRole values in persona objects', () => {
      const persona: Persona = {
        id: 'type-test',
        name: 'Type Test Persona',
        role: PersonaRole.ARCHITECT, // This should be valid
        core: {
          identity: 'You are a type test persona',
          primaryObjective: 'Test type compatibility',
          constraints: [
            'Must be type safe',
            'Follow TypeScript best practices',
            'Maintain type consistency',
          ],
        },
        behavior: {
          mindset: [
            'Type safety first',
            'Compile time validation',
            'Clear type definitions',
          ],
          methodology: [
            'Define types first',
            'Use strict typing',
            'Validate at compile time',
            'Document type contracts',
          ],
          priorities: ['Type safety', 'Compile time errors', 'Clear contracts'],
          antiPatterns: [
            'Using any type',
            'Ignoring type errors',
            'Weak type definitions',
          ],
        },
        expertise: {
          domains: [
            'TypeScript',
            'Type systems',
            'Static analysis',
            'Compile time validation',
          ],
          skills: [
            'Type definition',
            'Generic programming',
            'Type inference',
            'Interface design',
          ],
        },
        decisionCriteria: [
          'Is this type safe?',
          'Will this catch errors at compile time?',
          'Are the types clear and maintainable?',
        ],
        examples: ['Type safe example', 'Interface example'],
        tags: ['types', 'typescript', 'safety'],
      };

      const result = PersonaSchema.safeParse(persona);
      expect(result.success).toBe(true);
    });
  });
});
