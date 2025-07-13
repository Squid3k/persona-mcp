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
      description: 'A test persona for validation',
      expertise: ['testing', 'validation'],
      approach: 'Systematic testing approach',
      promptTemplate: 'You are a test persona.',
      examples: ['Example 1', 'Example 2'],
      tags: ['test', 'validation'],
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
        description: 'Minimal test persona',
        expertise: ['minimal'],
        approach: 'Minimal approach',
        promptTemplate: 'Minimal template.',
      };

      const result = PersonaSchema.safeParse(minimalPersona);

      expect(result.success).toBe(true);
    });

    it('should reject persona with missing required fields', () => {
      const invalidPersona = {
        name: 'Invalid Persona',
        // missing id, role, description, expertise, approach, promptTemplate
      };

      const result = PersonaSchema.safeParse(invalidPersona);

      expect(result.success).toBe(false);
    });

    it('should reject persona with invalid field types', () => {
      const invalidPersona = {
        id: 123, // should be string
        name: 'Test Persona',
        role: 'tester',
        description: 'Test description',
        expertise: 'not-array', // should be array
        approach: 'Test approach',
        promptTemplate: 'Test template',
      };

      const result = PersonaSchema.safeParse(invalidPersona);

      expect(result.success).toBe(false);
    });

    it('should reject persona with empty required strings', () => {
      const invalidPersona = {
        id: '',
        name: '',
        role: '',
        description: '',
        expertise: [],
        approach: '',
        promptTemplate: '',
      };

      const result = PersonaSchema.safeParse(invalidPersona);

      expect(result.success).toBe(false);
    });

    it('should validate persona with empty optional arrays', () => {
      const personaWithEmptyOptionals = {
        ...validPersona,
        examples: [],
        tags: [],
      };

      const result = PersonaSchema.safeParse(personaWithEmptyOptionals);

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

    it('should contain exactly 7 predefined roles', () => {
      const roleKeys = Object.keys(PersonaRole);
      expect(roleKeys).toHaveLength(7);
    });
  });

  describe('Type compatibility', () => {
    it('should accept PersonaRole values in persona objects', () => {
      const persona: Persona = {
        id: 'type-test',
        name: 'Type Test Persona',
        role: PersonaRole.ARCHITECT, // This should be valid
        description: 'Testing type compatibility',
        expertise: ['types'],
        approach: 'Type-safe approach',
        promptTemplate: 'Type-safe template',
      };

      const result = PersonaSchema.safeParse(persona);
      expect(result.success).toBe(true);
    });
  });
});
