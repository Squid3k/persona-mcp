import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaManager } from '../src/persona-manager.js';
import { Persona, PersonaRole } from '../src/types/persona.js';

describe('PersonaManager', () => {
  let personaManager: PersonaManager;

  beforeEach(() => {
    personaManager = new PersonaManager();
  });

  describe('getAllPersonas', () => {
    it('should return all default personas', () => {
      const personas = personaManager.getAllPersonas();

      expect(personas).toHaveLength(12);
      expect(personas.map(p => p.id)).toEqual(
        expect.arrayContaining([
          'architect',
          'developer',
          'reviewer',
          'debugger',
          'product-manager',
          'technical-writer',
          'engineering-manager',
          'optimizer',
          'security-analyst',
          'tester',
          'ui-designer',
          'performance-analyst',
        ])
      );
    });

    it('should return personas with correct structure', () => {
      const personas = personaManager.getAllPersonas();

      personas.forEach(persona => {
        expect(persona).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          role: expect.any(String),
          core: {
            identity: expect.any(String),
            primaryObjective: expect.any(String),
            constraints: expect.any(Array),
          },
          behavior: {
            mindset: expect.any(Array),
            methodology: expect.any(Array),
            priorities: expect.any(Array),
            antiPatterns: expect.any(Array),
          },
          expertise: {
            domains: expect.any(Array),
            skills: expect.any(Array),
          },
          decisionCriteria: expect.any(Array),
          examples: expect.any(Array),
          tags: expect.any(Array),
        });
      });
    });
  });

  describe('getPersona', () => {
    it('should return specific persona by id', () => {
      const architect = personaManager.getPersona('architect');

      expect(architect).toBeDefined();
      expect(architect?.id).toBe('architect');
      expect(architect?.name).toBe('Software Architect');
      expect(architect?.role).toBe(PersonaRole.ARCHITECT);
    });

    it('should return developer persona with correct details', () => {
      const developer = personaManager.getPersona('developer');

      expect(developer).toBeDefined();
      expect(developer?.id).toBe('developer');
      expect(developer?.name).toBe('Code Developer');
      expect(developer?.role).toBe(PersonaRole.DEVELOPER);
    });

    it('should return undefined for non-existent persona', () => {
      const nonExistent = personaManager.getPersona('non-existent');

      expect(nonExistent).toBeUndefined();
    });
  });

  describe('generatePrompt', () => {
    it('should generate prompt with persona template', () => {
      const testPersona: Persona = {
        id: 'test',
        name: 'Test Persona',
        role: 'test',
        core: {
          identity: 'You are a test persona.',
          primaryObjective: 'Test approach',
          constraints: ['Test constraint 1', 'Test constraint 2', 'Test constraint 3']
        },
        behavior: {
          mindset: ['Test mindset 1', 'Test mindset 2', 'Test mindset 3'],
          methodology: ['Test method 1', 'Test method 2', 'Test method 3', 'Test method 4'],
          priorities: ['Test priority 1', 'Test priority 2', 'Test priority 3'],
          antiPatterns: ['Test anti-pattern 1', 'Test anti-pattern 2', 'Test anti-pattern 3']
        },
        expertise: {
          domains: ['testing', 'quality assurance'],
          skills: ['unit testing', 'integration testing']
        },
        decisionCriteria: ['Test criteria 1', 'Test criteria 2', 'Test criteria 3'],
        examples: ['Example 1', 'Example 2'],
        tags: ['test'],
      };

      const prompt = personaManager.generatePrompt(testPersona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).toContain('Examples:');
      expect(prompt).toContain('1. Example 1');
      expect(prompt).toContain('2. Example 2');
    });

    it('should generate prompt with context when provided', () => {
      const testPersona: Persona = {
        id: 'test',
        name: 'Test Persona',
        role: 'test',
        core: {
          identity: 'You are a test persona.',
          primaryObjective: 'Test approach',
          constraints: ['Test constraint 1', 'Test constraint 2', 'Test constraint 3']
        },
        behavior: {
          mindset: ['Test mindset 1', 'Test mindset 2', 'Test mindset 3'],
          methodology: ['Test method 1', 'Test method 2', 'Test method 3', 'Test method 4'],
          priorities: ['Test priority 1', 'Test priority 2', 'Test priority 3'],
          antiPatterns: ['Test anti-pattern 1', 'Test anti-pattern 2', 'Test anti-pattern 3']
        },
        expertise: {
          domains: ['testing', 'quality assurance'],
          skills: ['unit testing', 'integration testing']
        },
        decisionCriteria: ['Test criteria 1', 'Test criteria 2', 'Test criteria 3'],
        examples: [],
        tags: ['test'],
      };

      const context = 'Build a REST API';
      const prompt = personaManager.generatePrompt(testPersona, context);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).toContain(`Context: ${context}`);
    });

    it('should generate prompt without examples when not provided', () => {
      const testPersona: Persona = {
        id: 'test',
        name: 'Test Persona',
        role: 'test',
        core: {
          identity: 'You are a test persona.',
          primaryObjective: 'Test approach',
          constraints: ['Test constraint 1', 'Test constraint 2', 'Test constraint 3']
        },
        behavior: {
          mindset: ['Test mindset 1', 'Test mindset 2', 'Test mindset 3'],
          methodology: ['Test method 1', 'Test method 2', 'Test method 3', 'Test method 4'],
          priorities: ['Test priority 1', 'Test priority 2', 'Test priority 3'],
          antiPatterns: ['Test anti-pattern 1', 'Test anti-pattern 2', 'Test anti-pattern 3']
        },
        expertise: {
          domains: ['testing', 'quality assurance'],
          skills: ['unit testing', 'integration testing']
        },
        decisionCriteria: ['Test criteria 1', 'Test criteria 2', 'Test criteria 3'],
        examples: [],
        tags: ['test'],
      };

      const prompt = personaManager.generatePrompt(testPersona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).not.toContain('Examples:');
    });
  });

  describe('addPersona', () => {
    it('should add new persona successfully', () => {
      const newPersona: Persona = {
        id: 'new-tester',
        name: 'Test Engineer',
        role: PersonaRole.TESTER,
        core: {
          identity: 'You are a testing expert.',
          primaryObjective: 'Test everything thoroughly',
          constraints: ['Test constraint 1', 'Test constraint 2', 'Test constraint 3']
        },
        behavior: {
          mindset: ['Test mindset 1', 'Test mindset 2', 'Test mindset 3'],
          methodology: ['Test method 1', 'Test method 2', 'Test method 3', 'Test method 4'],
          priorities: ['Test priority 1', 'Test priority 2', 'Test priority 3'],
          antiPatterns: ['Test anti-pattern 1', 'Test anti-pattern 2', 'Test anti-pattern 3']
        },
        expertise: {
          domains: ['unit testing', 'integration testing'],
          skills: ['test automation', 'quality assurance']
        },
        decisionCriteria: ['Test criteria 1', 'Test criteria 2', 'Test criteria 3'],
        examples: [],
        tags: ['testing', 'quality'],
      };

      personaManager.addPersona(newPersona);

      const retrieved = personaManager.getPersona('new-tester');
      expect(retrieved).toEqual(newPersona);

      const allPersonas = personaManager.getAllPersonas();
      expect(allPersonas).toHaveLength(13);
    });

    it('should replace existing persona with same id', () => {
      const updatedArchitect: Persona = {
        id: 'architect',
        name: 'Updated Architect',
        role: PersonaRole.ARCHITECT,
        core: {
          identity: 'Updated template',
          primaryObjective: 'Updated approach',
          constraints: ['Updated constraint 1', 'Updated constraint 2', 'Updated constraint 3']
        },
        behavior: {
          mindset: ['Updated mindset 1', 'Updated mindset 2', 'Updated mindset 3'],
          methodology: ['Updated method 1', 'Updated method 2', 'Updated method 3', 'Updated method 4'],
          priorities: ['Updated priority 1', 'Updated priority 2', 'Updated priority 3'],
          antiPatterns: ['Updated anti-pattern 1', 'Updated anti-pattern 2', 'Updated anti-pattern 3']
        },
        expertise: {
          domains: ['updated expertise'],
          skills: ['updated skill 1', 'updated skill 2']
        },
        decisionCriteria: ['Updated criteria 1', 'Updated criteria 2', 'Updated criteria 3'],
        examples: [],
        tags: ['updated'],
      };

      personaManager.addPersona(updatedArchitect);

      const retrieved = personaManager.getPersona('architect');
      expect(retrieved?.name).toBe('Updated Architect');
      expect(retrieved?.core.identity).toBe('Updated template');

      const allPersonas = personaManager.getAllPersonas();
      expect(allPersonas).toHaveLength(12); // Still 12 personas
    });
  });

  describe('removePersona', () => {
    it('should remove existing persona successfully', () => {
      const removed = personaManager.removePersona('architect');

      expect(removed).toBe(true);

      const retrieved = personaManager.getPersona('architect');
      expect(retrieved).toBeUndefined();

      const allPersonas = personaManager.getAllPersonas();
      expect(allPersonas).toHaveLength(11);
    });

    it('should return false when removing non-existent persona', () => {
      const removed = personaManager.removePersona('non-existent');

      expect(removed).toBe(false);
    });
  });
});
