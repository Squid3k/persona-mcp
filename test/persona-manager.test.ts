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

      expect(personas).toHaveLength(4);
      expect(personas.map(p => p.id)).toEqual(
        expect.arrayContaining([
          'architect',
          'developer',
          'reviewer',
          'debugger',
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
          description: expect.any(String),
          expertise: expect.any(Array),
          approach: expect.any(String),
          promptTemplate: expect.any(String),
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
        description: 'Test description',
        expertise: ['testing'],
        approach: 'Test approach',
        promptTemplate: 'You are a test persona.',
        examples: ['Example 1', 'Example 2'],
        tags: ['test'],
      };

      const prompt = personaManager.generatePrompt(testPersona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).toContain('Examples of this approach:');
      expect(prompt).toContain('1. Example 1');
      expect(prompt).toContain('2. Example 2');
    });

    it('should generate prompt with context when provided', () => {
      const testPersona: Persona = {
        id: 'test',
        name: 'Test Persona',
        role: 'test',
        description: 'Test description',
        expertise: ['testing'],
        approach: 'Test approach',
        promptTemplate: 'You are a test persona.',
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
        description: 'Test description',
        expertise: ['testing'],
        approach: 'Test approach',
        promptTemplate: 'You are a test persona.',
        tags: ['test'],
      };

      const prompt = personaManager.generatePrompt(testPersona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).not.toContain('Examples of this approach:');
    });
  });

  describe('addPersona', () => {
    it('should add new persona successfully', () => {
      const newPersona: Persona = {
        id: 'tester',
        name: 'Test Engineer',
        role: PersonaRole.TESTER,
        description: 'Focuses on comprehensive testing',
        expertise: ['unit testing', 'integration testing'],
        approach: 'Test everything thoroughly',
        promptTemplate: 'You are a testing expert.',
        tags: ['testing', 'quality'],
      };

      personaManager.addPersona(newPersona);

      const retrieved = personaManager.getPersona('tester');
      expect(retrieved).toEqual(newPersona);

      const allPersonas = personaManager.getAllPersonas();
      expect(allPersonas).toHaveLength(5);
    });

    it('should replace existing persona with same id', () => {
      const updatedArchitect: Persona = {
        id: 'architect',
        name: 'Updated Architect',
        role: PersonaRole.ARCHITECT,
        description: 'Updated description',
        expertise: ['updated expertise'],
        approach: 'Updated approach',
        promptTemplate: 'Updated template',
        tags: ['updated'],
      };

      personaManager.addPersona(updatedArchitect);

      const retrieved = personaManager.getPersona('architect');
      expect(retrieved?.name).toBe('Updated Architect');
      expect(retrieved?.description).toBe('Updated description');

      const allPersonas = personaManager.getAllPersonas();
      expect(allPersonas).toHaveLength(4); // Still 4 personas
    });
  });

  describe('removePersona', () => {
    it('should remove existing persona successfully', () => {
      const removed = personaManager.removePersona('architect');

      expect(removed).toBe(true);

      const retrieved = personaManager.getPersona('architect');
      expect(retrieved).toBeUndefined();

      const allPersonas = personaManager.getAllPersonas();
      expect(allPersonas).toHaveLength(3);
    });

    it('should return false when removing non-existent persona', () => {
      const removed = personaManager.removePersona('non-existent');

      expect(removed).toBe(false);
    });
  });
});
