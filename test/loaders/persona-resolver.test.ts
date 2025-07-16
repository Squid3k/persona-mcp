import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { PersonaResolver } from '../../src/loaders/persona-resolver.js';
import { LoadedPersona, PersonaSource, PersonaPrecedence } from '../../src/types/yaml-persona.js';

describe('PersonaResolver', () => {
  let resolver: PersonaResolver;
  let mockConsoleError: Mock;
  let originalConsoleError: typeof console.error;

  const createMockPersona = (
    id: string,
    sourceType: PersonaSource['type'],
    filePath?: string,
    lastModified?: Date,
    isValid: boolean = true,
    role: string = 'tester',
    version: string = '1.0'
  ): LoadedPersona => ({
    id,
    name: `Test ${id}`,
    role,
    description: `Test persona ${id}`,
    expertise: ['testing'],
    approach: 'Test approach',
    promptTemplate: `You are ${id}`,
    tags: ['test'],
    version,
    source: {
      type: sourceType,
      filePath,
      lastModified
    },
    isValid,
    validationErrors: isValid ? undefined : ['Test error']
  });

  beforeEach(() => {
    resolver = new PersonaResolver();
    originalConsoleError = console.error;
    mockConsoleError = vi.fn();
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('resolveConflicts', () => {
    it('should resolve no conflicts when all personas have unique IDs', () => {
      const personas = [
        createMockPersona('persona1', 'default'),
        createMockPersona('persona2', 'user'),
        createMockPersona('persona3', 'project')
      ];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(3);
      expect(result.get('persona1')?.persona.id).toBe('persona1');
      expect(result.get('persona1')?.conflicts).toEqual([]);
      expect(result.get('persona2')?.persona.id).toBe('persona2');
      expect(result.get('persona2')?.conflicts).toEqual([]);
      expect(result.get('persona3')?.persona.id).toBe('persona3');
      expect(result.get('persona3')?.conflicts).toEqual([]);
    });

    it('should resolve conflicts with project taking precedence over user', () => {
      const userPersona = createMockPersona('test-persona', 'user');
      const projectPersona = createMockPersona('test-persona', 'project');
      const personas = [userPersona, projectPersona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.source.type).toBe('project');
      expect(resolved?.conflicts).toEqual([userPersona]);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Persona conflict resolved for 'test-persona': Using project version, ignoring 1 other(s)"
      );
    });

    it('should resolve conflicts with user taking precedence over default', () => {
      const defaultPersona = createMockPersona('test-persona', 'default');
      const userPersona = createMockPersona('test-persona', 'user');
      const personas = [defaultPersona, userPersona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.source.type).toBe('user');
      expect(resolved?.conflicts).toEqual([defaultPersona]);
    });

    it('should resolve conflicts with project taking precedence over default', () => {
      const defaultPersona = createMockPersona('test-persona', 'default');
      const projectPersona = createMockPersona('test-persona', 'project');
      const personas = [defaultPersona, projectPersona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.source.type).toBe('project');
      expect(resolved?.conflicts).toEqual([defaultPersona]);
    });

    it('should resolve conflicts with all three source types', () => {
      const defaultPersona = createMockPersona('test-persona', 'default');
      const userPersona = createMockPersona('test-persona', 'user');
      const projectPersona = createMockPersona('test-persona', 'project');
      const personas = [defaultPersona, userPersona, projectPersona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.source.type).toBe('project');
      expect(resolved?.conflicts).toHaveLength(2);
      expect(resolved?.conflicts).toContain(defaultPersona);
      expect(resolved?.conflicts).toContain(userPersona);
    });

    it('should prefer valid personas over invalid ones with same precedence', () => {
      const invalidPersona = createMockPersona('test-persona', 'user', '/path/invalid.yaml', undefined, false);
      const validPersona = createMockPersona('test-persona', 'user', '/path/valid.yaml', undefined, true);
      const personas = [invalidPersona, validPersona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.isValid).toBe(true);
      expect(resolved?.persona.source.filePath).toBe('/path/valid.yaml');
      expect(resolved?.conflicts).toEqual([invalidPersona]);
    });

    it('should handle sorting when invalid persona comes first', () => {
      const validPersona = createMockPersona('test-persona', 'user', '/path/valid.yaml', undefined, true);
      const invalidPersona = createMockPersona('test-persona', 'user', '/path/invalid.yaml', undefined, false);
      const personas = [validPersona, invalidPersona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.isValid).toBe(true);
      expect(resolved?.persona.source.filePath).toBe('/path/valid.yaml');
      expect(resolved?.conflicts).toEqual([invalidPersona]);
    });

    it('should prefer newer files when precedence and validity are equal', () => {
      const olderDate = new Date('2023-01-01');
      const newerDate = new Date('2023-01-02');
      const olderPersona = createMockPersona('test-persona', 'user', '/path/old.yaml', olderDate);
      const newerPersona = createMockPersona('test-persona', 'user', '/path/new.yaml', newerDate);
      const personas = [olderPersona, newerPersona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.source.filePath).toBe('/path/new.yaml');
      expect(resolved?.conflicts).toEqual([olderPersona]);
    });

    it('should fall back to alphabetical order when all other criteria are equal', () => {
      const personaB = createMockPersona('test-persona', 'user', '/path/b.yaml');
      const personaA = createMockPersona('test-persona', 'user', '/path/a.yaml');
      const personas = [personaB, personaA];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona.source.filePath).toBe('/path/a.yaml');
      expect(resolved?.conflicts).toEqual([personaB]);
    });

    it('should handle personas without file paths', () => {
      const persona1 = createMockPersona('test-persona', 'default');
      const persona2 = createMockPersona('test-persona', 'default');
      const personas = [persona1, persona2];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona).toBe(persona1);
      expect(resolved?.conflicts).toEqual([persona2]);
    });

    it('should handle single persona without conflicts', () => {
      const persona = createMockPersona('test-persona', 'user');
      const personas = [persona];

      const result = resolver.resolveConflicts(personas);

      expect(result.size).toBe(1);
      const resolved = result.get('test-persona');
      expect(resolved?.persona).toBe(persona);
      expect(resolved?.conflicts).toEqual([]);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle empty personas array', () => {
      const result = resolver.resolveConflicts([]);

      expect(result.size).toBe(0);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('getValidPersonas', () => {
    it('should return only valid personas', () => {
      const validPersona = createMockPersona('valid', 'user', undefined, undefined, true);
      const invalidPersona = createMockPersona('invalid', 'user', undefined, undefined, false);
      const personas = [validPersona, invalidPersona];

      const result = resolver.getValidPersonas(personas);

      expect(result).toEqual([validPersona]);
    });

    it('should return empty array when no valid personas', () => {
      const invalidPersona = createMockPersona('invalid', 'user', undefined, undefined, false);
      const personas = [invalidPersona];

      const result = resolver.getValidPersonas(personas);

      expect(result).toEqual([]);
    });

    it('should return all personas when all are valid', () => {
      const persona1 = createMockPersona('persona1', 'user');
      const persona2 = createMockPersona('persona2', 'user');
      const personas = [persona1, persona2];

      const result = resolver.getValidPersonas(personas);

      expect(result).toEqual([persona1, persona2]);
    });
  });

  describe('getInvalidPersonas', () => {
    it('should return only invalid personas', () => {
      const validPersona = createMockPersona('valid', 'user', undefined, undefined, true);
      const invalidPersona = createMockPersona('invalid', 'user', undefined, undefined, false);
      const personas = [validPersona, invalidPersona];

      const result = resolver.getInvalidPersonas(personas);

      expect(result).toEqual([invalidPersona]);
    });

    it('should return empty array when no invalid personas', () => {
      const validPersona = createMockPersona('valid', 'user');
      const personas = [validPersona];

      const result = resolver.getInvalidPersonas(personas);

      expect(result).toEqual([]);
    });

    it('should return all personas when all are invalid', () => {
      const persona1 = createMockPersona('persona1', 'user', undefined, undefined, false);
      const persona2 = createMockPersona('persona2', 'user', undefined, undefined, false);
      const personas = [persona1, persona2];

      const result = resolver.getInvalidPersonas(personas);

      expect(result).toEqual([persona1, persona2]);
    });
  });

  describe('getPersonasBySource', () => {
    it('should return personas filtered by source type', () => {
      const defaultPersona = createMockPersona('default', 'default');
      const userPersona = createMockPersona('user', 'user');
      const projectPersona = createMockPersona('project', 'project');
      const personas = [defaultPersona, userPersona, projectPersona];

      const defaultResult = resolver.getPersonasBySource(personas, 'default');
      const userResult = resolver.getPersonasBySource(personas, 'user');
      const projectResult = resolver.getPersonasBySource(personas, 'project');

      expect(defaultResult).toEqual([defaultPersona]);
      expect(userResult).toEqual([userPersona]);
      expect(projectResult).toEqual([projectPersona]);
    });

    it('should return empty array when no personas match source type', () => {
      const userPersona = createMockPersona('user', 'user');
      const personas = [userPersona];

      const result = resolver.getPersonasBySource(personas, 'project');

      expect(result).toEqual([]);
    });

    it('should return multiple personas of same source type', () => {
      const userPersona1 = createMockPersona('user1', 'user');
      const userPersona2 = createMockPersona('user2', 'user');
      const defaultPersona = createMockPersona('default', 'default');
      const personas = [userPersona1, userPersona2, defaultPersona];

      const result = resolver.getPersonasBySource(personas, 'user');

      expect(result).toEqual([userPersona1, userPersona2]);
    });
  });

  describe('hasPersona', () => {
    it('should return true when persona exists', () => {
      const persona = createMockPersona('test-persona', 'user');
      const personas = [persona];

      const result = resolver.hasPersona(personas, 'test-persona');

      expect(result).toBe(true);
    });

    it('should return false when persona does not exist', () => {
      const persona = createMockPersona('test-persona', 'user');
      const personas = [persona];

      const result = resolver.hasPersona(personas, 'non-existent');

      expect(result).toBe(false);
    });

    it('should return false for empty personas array', () => {
      const result = resolver.hasPersona([], 'test-persona');

      expect(result).toBe(false);
    });

    it('should return true when persona exists among multiple personas', () => {
      const persona1 = createMockPersona('persona1', 'user');
      const persona2 = createMockPersona('persona2', 'user');
      const personas = [persona1, persona2];

      const result = resolver.hasPersona(personas, 'persona2');

      expect(result).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics for mixed personas', () => {
      const defaultPersona = createMockPersona('default', 'default', undefined, undefined, true);
      const userPersona = createMockPersona('user', 'user', undefined, undefined, true);
      const projectPersona = createMockPersona('project', 'project', undefined, undefined, false);
      const personas = [defaultPersona, userPersona, projectPersona];

      const result = resolver.getStatistics(personas);

      expect(result).toEqual({
        total: 3,
        valid: 2,
        invalid: 1,
        bySource: {
          default: 1,
          user: 1,
          project: 1
        },
        conflicts: 0
      });
    });

    it('should count conflicts correctly', () => {
      const defaultPersona = createMockPersona('conflict-persona', 'default');
      const userPersona = createMockPersona('conflict-persona', 'user');
      const uniquePersona = createMockPersona('unique-persona', 'user');
      const personas = [defaultPersona, userPersona, uniquePersona];

      const result = resolver.getStatistics(personas);

      expect(result).toEqual({
        total: 3,
        valid: 3,
        invalid: 0,
        bySource: {
          default: 1,
          user: 2,
          project: 0
        },
        conflicts: 1
      });
    });

    it('should handle empty personas array', () => {
      const result = resolver.getStatistics([]);

      expect(result).toEqual({
        total: 0,
        valid: 0,
        invalid: 0,
        bySource: {
          default: 0,
          user: 0,
          project: 0
        },
        conflicts: 0
      });
    });

    it('should handle multiple conflicts', () => {
      const conflict1Default = createMockPersona('conflict1', 'default');
      const conflict1User = createMockPersona('conflict1', 'user');
      const conflict1Project = createMockPersona('conflict1', 'project');
      const conflict2Default = createMockPersona('conflict2', 'default');
      const conflict2User = createMockPersona('conflict2', 'user');
      const personas = [conflict1Default, conflict1User, conflict1Project, conflict2Default, conflict2User];

      const result = resolver.getStatistics(personas);

      expect(result).toEqual({
        total: 5,
        valid: 5,
        invalid: 0,
        bySource: {
          default: 2,
          user: 2,
          project: 1
        },
        conflicts: 2
      });
    });
  });

  describe('validatePersonaCompatibility', () => {
    it('should detect role conflicts', () => {
      const persona1 = createMockPersona('test-persona', 'default', undefined, undefined, true, 'developer');
      const persona2 = createMockPersona('test-persona', 'user', undefined, undefined, true, 'architect');
      const personas = [persona1, persona2];

      const result = resolver.validatePersonaCompatibility(personas);

      expect(result).toEqual([
        "Persona 'test-persona' has conflicting roles: developer, architect"
      ]);
    });

    it('should detect version conflicts', () => {
      const persona1 = createMockPersona('test-persona', 'default', undefined, undefined, true, 'developer', '1.0');
      const persona2 = createMockPersona('test-persona', 'user', undefined, undefined, true, 'developer', '2.0');
      const personas = [persona1, persona2];

      const result = resolver.validatePersonaCompatibility(personas);

      expect(result).toEqual([
        "Persona 'test-persona' has multiple versions: 1.0, 2.0"
      ]);
    });

    it('should detect both role and version conflicts', () => {
      const persona1 = createMockPersona('test-persona', 'default', undefined, undefined, true, 'developer', '1.0');
      const persona2 = createMockPersona('test-persona', 'user', undefined, undefined, true, 'architect', '2.0');
      const personas = [persona1, persona2];

      const result = resolver.validatePersonaCompatibility(personas);

      expect(result).toEqual([
        "Persona 'test-persona' has conflicting roles: developer, architect",
        "Persona 'test-persona' has multiple versions: 1.0, 2.0"
      ]);
    });

    it('should return empty array when no conflicts', () => {
      const persona1 = createMockPersona('persona1', 'default');
      const persona2 = createMockPersona('persona2', 'user');
      const personas = [persona1, persona2];

      const result = resolver.validatePersonaCompatibility(personas);

      expect(result).toEqual([]);
    });

    it('should return empty array for single persona', () => {
      const persona = createMockPersona('test-persona', 'user');
      const personas = [persona];

      const result = resolver.validatePersonaCompatibility(personas);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty personas', () => {
      const result = resolver.validatePersonaCompatibility([]);

      expect(result).toEqual([]);
    });

    it('should handle multiple personas with same roles and versions', () => {
      const persona1 = createMockPersona('test-persona', 'default', undefined, undefined, true, 'developer', '1.0');
      const persona2 = createMockPersona('test-persona', 'user', undefined, undefined, true, 'developer', '1.0');
      const personas = [persona1, persona2];

      const result = resolver.validatePersonaCompatibility(personas);

      expect(result).toEqual([]);
    });
  });

  describe('private methods', () => {
    it('should group personas by ID correctly', () => {
      const persona1 = createMockPersona('test-persona', 'default');
      const persona2 = createMockPersona('test-persona', 'user');
      const persona3 = createMockPersona('other-persona', 'user');
      const personas = [persona1, persona2, persona3];

      // Access private method through type assertion
      const privateResolver = resolver as any;
      const result = privateResolver.groupPersonasById(personas);

      expect(result.size).toBe(2);
      expect(result.get('test-persona')).toEqual([persona1, persona2]);
      expect(result.get('other-persona')).toEqual([persona3]);
    });

    it('should select winner by precedence correctly', () => {
      const defaultPersona = createMockPersona('test-persona', 'default');
      const userPersona = createMockPersona('test-persona', 'user');
      const projectPersona = createMockPersona('test-persona', 'project');
      const personas = [defaultPersona, userPersona, projectPersona];

      const privateResolver = resolver as any;
      const result = privateResolver.selectWinnerByPrecedence(personas);

      expect(result).toBe(projectPersona);
    });

    it('should return single persona when no conflicts', () => {
      const persona = createMockPersona('test-persona', 'user');
      const personas = [persona];

      const privateResolver = resolver as any;
      const result = privateResolver.selectWinnerByPrecedence(personas);

      expect(result).toBe(persona);
    });

    it('should get correct precedence values', () => {
      const privateResolver = resolver as any;

      expect(privateResolver.getPrecedence('default')).toBe(PersonaPrecedence.DEFAULT);
      expect(privateResolver.getPrecedence('user')).toBe(PersonaPrecedence.USER);
      expect(privateResolver.getPrecedence('project')).toBe(PersonaPrecedence.PROJECT);
    });

    it('should handle invalid precedence type', () => {
      const privateResolver = resolver as any;

      expect(privateResolver.getPrecedence('invalid' as any)).toBe(PersonaPrecedence.DEFAULT);
    });
  });
});