import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { PersonaLoader } from '../../src/loaders/persona-loader.js';
import { YamlPersonaSchema } from '../../src/types/yaml-persona.js';
import fs from 'fs/promises';
import path from 'path';
import * as YAML from 'yaml';
import glob from 'fast-glob';
import { z } from 'zod';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('path');
vi.mock('yaml');
vi.mock('fast-glob');

// Mock YamlPersonaSchema
vi.mock('../../src/types/yaml-persona.js', () => ({
  YamlPersonaSchema: {
    parse: vi.fn(),
  },
}));

describe('PersonaLoader', () => {
  let loader: PersonaLoader;
  let mockConsoleWarn: Mock;
  let originalConsoleWarn: typeof console.warn;

  const validPersonaData = {
    id: 'test-persona',
    name: 'Test Persona',
    role: 'tester',
    core: {
      identity: 'A test persona',
      primaryObjective: 'Ensure quality through testing',
      constraints: [
        'Test thoroughly',
        'Follow best practices',
        'Document results',
      ],
    },
    behavior: {
      mindset: ['Quality-focused', 'Methodical', 'Detail-oriented'],
      methodology: [
        'Plan tests',
        'Execute tests',
        'Analyze results',
        'Report findings',
      ],
      priorities: ['Test coverage', 'Bug detection', 'Quality assurance'],
      antiPatterns: [
        'Skipping tests',
        'Incomplete coverage',
        'Poor documentation',
      ],
    },
    expertise: {
      domains: ['testing'],
      skills: ['test automation'],
    },
    decisionCriteria: [
      'Is it testable?',
      'Does it improve quality?',
      'Is coverage adequate?',
    ],
    examples: ['Write unit tests', 'Create integration tests'],
    tags: ['test'],
    version: '1.0',
  };

  beforeEach(() => {
    originalConsoleWarn = console.warn;
    mockConsoleWarn = vi.fn();
    console.warn = mockConsoleWarn;

    loader = new PersonaLoader();

    // Setup default path mocks
    vi.mocked(path.basename).mockImplementation((filePath, ext) => {
      if (ext && filePath.endsWith(ext)) {
        return filePath.slice(0, -ext.length).split('/').pop() || 'test';
      }
      return filePath.split('/').pop() || 'test.yaml';
    });
    vi.mocked(path.extname).mockImplementation(filePath => {
      if (filePath.endsWith('.yaml')) return '.yaml';
      if (filePath.endsWith('.yml')) return '.yml';
      return '';
    });
    vi.mocked(path.resolve).mockImplementation((...args) => {
      // If only one argument, just return it
      if (args.length === 1) return args[0];
      // Otherwise join them
      return args.join('/');
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  describe('discoverPersonaFiles', () => {
    it('should discover YAML files in directory', async () => {
      const mockFiles = [
        '/path/to/persona1.yaml',
        '/path/to/persona2.yml',
        '/path/to/subdir/persona3.yaml',
      ];

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(glob).mockResolvedValue(mockFiles);

      const result = await loader.discoverPersonaFiles('/path/to');

      expect(fs.access).toHaveBeenCalledWith('/path/to');
      expect(glob).toHaveBeenCalledWith(['**/*.yaml', '**/*.yml'], {
        cwd: '/path/to',
        absolute: true,
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/.git/**'],
      });
      expect(result).toEqual(mockFiles);
    });

    it('should return empty array if directory does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Directory not found'));

      const result = await loader.discoverPersonaFiles('/nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array if directory is not accessible', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Permission denied'));

      const result = await loader.discoverPersonaFiles('/restricted');

      expect(result).toEqual([]);
    });
  });

  describe('loadPersonaFromFile', () => {
    const mockStats = {
      mtime: new Date('2023-01-01T00:00:00Z'),
    };

    beforeEach(() => {
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);
    });

    it('should load valid persona from file', async () => {
      const yamlContent = 'id: test-persona\nname: Test Persona\n';

      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(YAML.parse).mockReturnValue(validPersonaData);
      vi.mocked(YamlPersonaSchema.parse).mockReturnValue(validPersonaData);

      const result = await loader.loadPersonaFromFile(
        '/path/to/test.yaml',
        'user'
      );

      expect(fs.readFile).toHaveBeenCalledWith('/path/to/test.yaml', 'utf-8');
      expect(YAML.parse).toHaveBeenCalledWith(yamlContent);
      expect(vi.mocked(YamlPersonaSchema.parse)).toHaveBeenCalledWith(
        validPersonaData
      );
      expect(fs.stat).toHaveBeenCalledWith('/path/to/test.yaml');

      expect(result).toEqual({
        ...validPersonaData,
        source: {
          type: 'user',
          filePath: '/path/to/test.yaml',
          lastModified: mockStats.mtime,
        },
        isValid: true,
      });
    });

    it('should handle file read error', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const result = await loader.loadPersonaFromFile(
        '/path/to/test.yaml',
        'user'
      );

      expect(result).toEqual({
        id: 'test',
        name: 'Invalid Persona (test)',
        role: 'invalid',
        core: {
          identity: 'This persona failed validation and cannot be used.',
          primaryObjective: 'N/A - Invalid persona',
          constraints: ['Invalid persona - cannot be used'],
        },
        behavior: {
          mindset: ['Invalid'],
          methodology: ['Invalid'],
          priorities: ['Invalid'],
          antiPatterns: ['Invalid'],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: ['Invalid'],
        examples: [],
        tags: [],
        version: '1.0',
        source: {
          type: 'user',
          filePath: '/path/to/test.yaml',
        },
        isValid: false,
        validationErrors: ['File not found'],
      });
    });

    it('should handle YAML parse error', async () => {
      const yamlContent = 'invalid: yaml: content:';
      const yamlError = new Error('Invalid YAML syntax');
      Object.setPrototypeOf(yamlError, YAML.YAMLParseError.prototype);
      yamlError.name = 'YAMLParseError';

      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(YAML.parse).mockImplementation(() => {
        throw yamlError;
      });

      const result = await loader.loadPersonaFromFile(
        '/path/to/test.yaml',
        'user'
      );

      expect(result).toEqual({
        id: 'test',
        name: 'Invalid Persona (test)',
        role: 'invalid',
        core: {
          identity: 'This persona failed validation and cannot be used.',
          primaryObjective: 'N/A - Invalid persona',
          constraints: ['Invalid persona - cannot be used'],
        },
        behavior: {
          mindset: ['Invalid'],
          methodology: ['Invalid'],
          priorities: ['Invalid'],
          antiPatterns: ['Invalid'],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: ['Invalid'],
        examples: [],
        tags: [],
        version: '1.0',
        source: {
          type: 'user',
          filePath: '/path/to/test.yaml',
        },
        isValid: false,
        validationErrors: ['YAML Parse Error: Invalid YAML syntax'],
      });
    });

    it('should handle Zod validation error', async () => {
      const yamlContent = 'id: test-persona\nname: Test Persona\n';
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: ['core'],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'array',
          received: 'number',
          path: ['behavior', 'mindset'],
          message: 'Expected array, received number',
        },
      ]);

      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(YAML.parse).mockReturnValue(validPersonaData);
      vi.mocked(YamlPersonaSchema.parse).mockImplementation(() => {
        throw zodError;
      });

      const result = await loader.loadPersonaFromFile(
        '/path/to/test.yaml',
        'user'
      );

      expect(result).toEqual({
        id: 'test',
        name: 'Invalid Persona (test)',
        role: 'invalid',
        core: {
          identity: 'This persona failed validation and cannot be used.',
          primaryObjective: 'N/A - Invalid persona',
          constraints: ['Invalid persona - cannot be used'],
        },
        behavior: {
          mindset: ['Invalid'],
          methodology: ['Invalid'],
          priorities: ['Invalid'],
          antiPatterns: ['Invalid'],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: ['Invalid'],
        examples: [],
        tags: [],
        version: '1.0',
        source: {
          type: 'user',
          filePath: '/path/to/test.yaml',
        },
        isValid: false,
        validationErrors: [
          'core: Required',
          'behavior.mindset: Expected array, received number',
        ],
      });
    });

    it('should handle unknown error', async () => {
      vi.mocked(fs.readFile).mockRejectedValue('Unknown error');
      vi.mocked(path.basename).mockImplementation((filePath, ext) => {
        if (ext) return 'test';
        return 'test.yaml';
      });

      const result = await loader.loadPersonaFromFile(
        '/path/to/test.yaml',
        'user'
      );

      expect(result.validationErrors).toEqual([
        'Unknown error occurred while loading persona',
      ]);
    });
  });

  describe('loadPersonasFromDirectory', () => {
    it('should load multiple personas from directory', async () => {
      const mockFiles = ['/path/to/persona1.yaml', '/path/to/persona2.yaml'];

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(glob).mockResolvedValue(mockFiles);

      // Mock successful loading for both files
      vi.mocked(fs.readFile).mockResolvedValue('id: test\nname: Test\n');
      vi.mocked(YAML.parse).mockReturnValue(validPersonaData);
      vi.mocked(YamlPersonaSchema.parse).mockReturnValue(validPersonaData);
      vi.mocked(fs.stat).mockResolvedValue({ mtime: new Date() } as any);

      const result = await loader.loadPersonasFromDirectory('/path/to', 'user');

      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(true);
    });

    it('should handle mixed valid and invalid personas', async () => {
      const mockFiles = ['/path/to/valid.yaml', '/path/to/invalid.yaml'];

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(glob).mockResolvedValue(mockFiles);

      // Mock both calls with different results
      const mockLoadPersonaFromFile = vi.spyOn(loader, 'loadPersonaFromFile');
      mockLoadPersonaFromFile
        .mockResolvedValueOnce({
          ...validPersonaData,
          isValid: true,
          source: { type: 'user', filePath: '/path/to/valid.yaml' },
        } as any)
        .mockResolvedValueOnce({
          ...validPersonaData,
          isValid: false,
          source: { type: 'user', filePath: '/path/to/invalid.yaml' },
        } as any);

      const result = await loader.loadPersonasFromDirectory('/path/to', 'user');

      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(false);
    });
  });

  describe('validatePersonaFile', () => {
    it('should return true for valid persona file', async () => {
      const yamlContent = 'id: test-persona\nname: Test Persona\n';

      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(YAML.parse).mockReturnValue(validPersonaData);
      vi.mocked(YamlPersonaSchema.parse).mockReturnValue(validPersonaData);

      const result = await loader.validatePersonaFile('/path/to/test.yaml');

      expect(result).toBe(true);
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/test.yaml', 'utf-8');
      expect(YAML.parse).toHaveBeenCalledWith(yamlContent);
      expect(vi.mocked(YamlPersonaSchema.parse)).toHaveBeenCalledWith(
        validPersonaData
      );
    });

    it('should return false for invalid persona file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const result = await loader.validatePersonaFile(
        '/path/to/nonexistent.yaml'
      );

      expect(result).toBe(false);
    });

    it('should return false for YAML parse error', async () => {
      const yamlContent = 'invalid: yaml: content:';

      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(YAML.parse).mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      const result = await loader.validatePersonaFile('/path/to/test.yaml');

      expect(result).toBe(false);
    });

    it('should return false for Zod validation error', async () => {
      const yamlContent = 'id: test-persona\nname: Test Persona\n';

      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(YAML.parse).mockReturnValue(validPersonaData);
      vi.mocked(YamlPersonaSchema.parse).mockImplementation(() => {
        throw new z.ZodError([]);
      });

      const result = await loader.validatePersonaFile('/path/to/test.yaml');

      expect(result).toBe(false);
    });
  });

  describe('getPersonaIdFromPath', () => {
    it('should extract persona ID from file path', () => {
      vi.mocked(path.basename).mockImplementation((filePath, ext) => {
        if (ext) return 'test-persona';
        return 'test-persona.yaml';
      });
      vi.mocked(path.extname).mockReturnValue('.yaml');

      const result = loader.getPersonaIdFromPath('/path/to/test-persona.yaml');

      expect(result).toBe('test-persona');
      expect(path.basename).toHaveBeenCalledWith(
        '/path/to/test-persona.yaml',
        '.yaml'
      );
    });

    it('should handle .yml extension', () => {
      vi.mocked(path.basename).mockImplementation((filePath, ext) => {
        if (ext) return 'another-persona';
        return 'another-persona.yml';
      });
      vi.mocked(path.extname).mockReturnValue('.yml');

      const result = loader.getPersonaIdFromPath(
        '/path/to/another-persona.yml'
      );

      expect(result).toBe('another-persona');
      expect(path.basename).toHaveBeenCalledWith(
        '/path/to/another-persona.yml',
        '.yml'
      );
    });
  });

  describe('createInvalidPersona', () => {
    beforeEach(() => {
      vi.mocked(path.basename).mockImplementation((filePath, ext) => {
        if (ext) return 'test-persona';
        return 'test-persona.yaml';
      });
      vi.mocked(path.extname).mockReturnValue('.yaml');
    });

    it('should create invalid persona with Error', () => {
      const error = new Error('Test error');
      const result = (loader as any).createInvalidPersona(
        '/path/to/test.yaml',
        'user',
        error
      );

      expect(result).toEqual({
        id: 'test-persona',
        name: 'Invalid Persona (test-persona)',
        role: 'invalid',
        core: {
          identity: 'This persona failed validation and cannot be used.',
          primaryObjective: 'N/A - Invalid persona',
          constraints: ['Invalid persona - cannot be used'],
        },
        behavior: {
          mindset: ['Invalid'],
          methodology: ['Invalid'],
          priorities: ['Invalid'],
          antiPatterns: ['Invalid'],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: ['Invalid'],
        examples: [],
        tags: [],
        version: '1.0',
        source: {
          type: 'user',
          filePath: '/path/to/test.yaml',
        },
        isValid: false,
        validationErrors: ['Test error'],
      });
    });

    it('should create invalid persona with ZodError', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required',
        },
      ]);

      const result = (loader as any).createInvalidPersona(
        '/path/to/test.yaml',
        'project',
        zodError
      );

      expect(result).toEqual({
        id: 'test-persona',
        name: 'Invalid Persona (test-persona)',
        role: 'invalid',
        core: {
          identity: 'This persona failed validation and cannot be used.',
          primaryObjective: 'N/A - Invalid persona',
          constraints: ['Invalid persona - cannot be used'],
        },
        behavior: {
          mindset: ['Invalid'],
          methodology: ['Invalid'],
          priorities: ['Invalid'],
          antiPatterns: ['Invalid'],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: ['Invalid'],
        examples: [],
        tags: [],
        version: '1.0',
        source: {
          type: 'project',
          filePath: '/path/to/test.yaml',
        },
        isValid: false,
        validationErrors: ['name: Required'],
      });
    });

    it('should create invalid persona with YAMLParseError', () => {
      const yamlError = new Error('Invalid YAML syntax');
      Object.setPrototypeOf(yamlError, YAML.YAMLParseError.prototype);
      yamlError.name = 'YAMLParseError';
      const result = (loader as any).createInvalidPersona(
        '/path/to/test.yaml',
        'default',
        yamlError
      );

      expect(result).toEqual({
        id: 'test-persona',
        name: 'Invalid Persona (test-persona)',
        role: 'invalid',
        core: {
          identity: 'This persona failed validation and cannot be used.',
          primaryObjective: 'N/A - Invalid persona',
          constraints: ['Invalid persona - cannot be used'],
        },
        behavior: {
          mindset: ['Invalid'],
          methodology: ['Invalid'],
          priorities: ['Invalid'],
          antiPatterns: ['Invalid'],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: ['Invalid'],
        examples: [],
        tags: [],
        version: '1.0',
        source: {
          type: 'default',
          filePath: '/path/to/test.yaml',
        },
        isValid: false,
        validationErrors: ['YAML Parse Error: Invalid YAML syntax'],
      });
    });

    it('should create invalid persona with unknown error', () => {
      const unknownError = { unknown: 'error' };
      const result = (loader as any).createInvalidPersona(
        '/path/to/test.yaml',
        'user',
        unknownError
      );

      expect(result).toEqual({
        id: 'test-persona',
        name: 'Invalid Persona (test-persona)',
        role: 'invalid',
        core: {
          identity: 'This persona failed validation and cannot be used.',
          primaryObjective: 'N/A - Invalid persona',
          constraints: ['Invalid persona - cannot be used'],
        },
        behavior: {
          mindset: ['Invalid'],
          methodology: ['Invalid'],
          priorities: ['Invalid'],
          antiPatterns: ['Invalid'],
        },
        expertise: {
          domains: [],
          skills: [],
        },
        decisionCriteria: ['Invalid'],
        examples: [],
        tags: [],
        version: '1.0',
        source: {
          type: 'user',
          filePath: '/path/to/test.yaml',
        },
        isValid: false,
        validationErrors: ['Unknown error occurred while loading persona'],
      });
    });
  });

  describe('extractValidationErrors', () => {
    it('should extract ZodError messages', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'array',
          received: 'string',
          path: ['expertise', 0],
          message: 'Expected array, received string',
        },
      ]);

      const result = (loader as any).extractValidationErrors(zodError);

      expect(result).toEqual([
        'name: Required',
        'expertise.0: Expected array, received string',
      ]);
    });

    it('should extract YAMLParseError message', () => {
      const yamlError = new Error('Invalid YAML syntax');
      Object.setPrototypeOf(yamlError, YAML.YAMLParseError.prototype);
      yamlError.name = 'YAMLParseError';
      const result = (loader as any).extractValidationErrors(yamlError);

      expect(result).toEqual(['YAML Parse Error: Invalid YAML syntax']);
    });

    it('should extract Error message', () => {
      const error = new Error('File not found');
      const result = (loader as any).extractValidationErrors(error);

      expect(result).toEqual(['File not found']);
    });

    it('should handle unknown error', () => {
      const unknownError = { unknown: 'error' };
      const result = (loader as any).extractValidationErrors(unknownError);

      expect(result).toEqual(['Unknown error occurred while loading persona']);
    });
  });
});
