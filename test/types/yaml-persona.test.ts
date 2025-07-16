import { describe, it, expect } from 'vitest';
import {
  YamlPersonaMetadataSchema,
  YamlPersonaSchema,
  PersonaValidationError,
  PersonaLoadingError,
  PersonaPrecedence,
  type YamlPersona,
  type PersonaSource,
  type LoadedPersona,
  type PersonaConfig,
} from '../../src/types/yaml-persona.js';

describe('YamlPersonaMetadataSchema', () => {
  it('should validate valid metadata', () => {
    const validMetadata = {
      category: 'engineering',
      difficulty: 'intermediate' as const,
      estimatedTime: '30 minutes',
      prerequisites: ['basic-typescript'],
      tags: ['coding', 'architecture'],
    };

    const result = YamlPersonaMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validMetadata);
    }
  });

  it('should validate empty metadata', () => {
    const result = YamlPersonaMetadataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('should validate undefined metadata', () => {
    const result = YamlPersonaMetadataSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it('should reject invalid difficulty level', () => {
    const invalidMetadata = {
      difficulty: 'expert', // Invalid difficulty level
    };

    const result = YamlPersonaMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid enum value');
    }
  });

  it('should reject non-array prerequisites', () => {
    const invalidMetadata = {
      prerequisites: 'not-an-array',
    };

    const result = YamlPersonaMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Expected array');
    }
  });

  it('should reject non-string tags', () => {
    const invalidMetadata = {
      tags: [123, 'valid-tag'],
    };

    const result = YamlPersonaMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Expected string');
    }
  });
});

describe('YamlPersonaSchema', () => {
  const validBasePersona = {
    id: 'test-persona',
    name: 'Test Persona',
    role: 'tester',
    description: 'A test persona',
    expertise: ['testing', 'quality-assurance'],
    approach: 'Systematic testing approach',
    promptTemplate: 'Test prompt template',
    examples: ['Example 1'],
    tags: ['test'],
  };

  it('should validate valid YAML persona', () => {
    const validPersona = {
      ...validBasePersona,
      version: '2.0',
      author: 'Test Author',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-02T00:00:00Z',
      dependencies: ['dep1', 'dep2'],
      extends: 'base-persona',
      metadata: {
        category: 'testing',
        difficulty: 'beginner' as const,
        estimatedTime: '15 minutes',
        prerequisites: ['basic-knowledge'],
        tags: ['unit-testing'],
      },
    };

    const result = YamlPersonaSchema.safeParse(validPersona);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validPersona);
    }
  });

  it('should apply default version', () => {
    const personaWithoutVersion = {
      ...validBasePersona,
    };

    const result = YamlPersonaSchema.safeParse(personaWithoutVersion);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe('1.0');
    }
  });

  it('should validate persona with minimal fields', () => {
    const minimalPersona = {
      ...validBasePersona,
    };

    const result = YamlPersonaSchema.safeParse(minimalPersona);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe('1.0');
      expect(result.data.author).toBeUndefined();
      expect(result.data.metadata).toBeUndefined();
    }
  });

  it('should reject invalid datetime format', () => {
    const invalidPersona = {
      ...validBasePersona,
      created: 'invalid-datetime',
    };

    const result = YamlPersonaSchema.safeParse(invalidPersona);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid');
    }
  });

  it('should reject extra fields due to strict mode', () => {
    const personaWithExtraField = {
      ...validBasePersona,
      extraField: 'not allowed',
    };

    const result = YamlPersonaSchema.safeParse(personaWithExtraField);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.code === 'unrecognized_keys')).toBe(true);
    }
  });

  it('should reject non-array dependencies', () => {
    const invalidPersona = {
      ...validBasePersona,
      dependencies: 'not-an-array',
    };

    const result = YamlPersonaSchema.safeParse(invalidPersona);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Expected');
    }
  });
});

describe('PersonaValidationError', () => {
  it('should create error with default message', () => {
    const filePath = '/test/path.yaml';
    const validationErrors = ['Error 1', 'Error 2'];
    
    const error = new PersonaValidationError(filePath, validationErrors);
    
    expect(error.name).toBe('PersonaValidationError');
    expect(error.message).toBe('Validation failed for /test/path.yaml');
    expect(error.filePath).toBe(filePath);
    expect(error.validationErrors).toEqual(validationErrors);
    expect(error instanceof Error).toBe(true);
  });

  it('should create error with custom message', () => {
    const filePath = '/test/path.yaml';
    const validationErrors = ['Error 1'];
    const customMessage = 'Custom validation error';
    
    const error = new PersonaValidationError(filePath, validationErrors, customMessage);
    
    expect(error.name).toBe('PersonaValidationError');
    expect(error.message).toBe(customMessage);
    expect(error.filePath).toBe(filePath);
    expect(error.validationErrors).toEqual(validationErrors);
  });

  it('should maintain error prototype chain', () => {
    const error = new PersonaValidationError('/test/path.yaml', ['Error']);
    
    expect(error instanceof PersonaValidationError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe('PersonaLoadingError', () => {
  it('should create error with default message', () => {
    const filePath = '/test/path.yaml';
    const originalError = new Error('Original error');
    
    const error = new PersonaLoadingError(filePath, originalError);
    
    expect(error.name).toBe('PersonaLoadingError');
    expect(error.message).toBe('Failed to load persona from /test/path.yaml');
    expect(error.filePath).toBe(filePath);
    expect(error.originalError).toBe(originalError);
    expect(error.cause).toBe(originalError);
    expect(error instanceof Error).toBe(true);
  });

  it('should create error with custom message', () => {
    const filePath = '/test/path.yaml';
    const originalError = new Error('Original error');
    const customMessage = 'Custom loading error';
    
    const error = new PersonaLoadingError(filePath, originalError, customMessage);
    
    expect(error.name).toBe('PersonaLoadingError');
    expect(error.message).toBe(customMessage);
    expect(error.filePath).toBe(filePath);
    expect(error.originalError).toBe(originalError);
    expect(error.cause).toBe(originalError);
  });

  it('should maintain error prototype chain', () => {
    const originalError = new Error('Original error');
    const error = new PersonaLoadingError('/test/path.yaml', originalError);
    
    expect(error instanceof PersonaLoadingError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe('PersonaPrecedence', () => {
  it('should have correct precedence values', () => {
    expect(PersonaPrecedence.DEFAULT).toBe(1);
    expect(PersonaPrecedence.USER).toBe(2);
    expect(PersonaPrecedence.PROJECT).toBe(3);
  });

  it('should maintain precedence order', () => {
    expect(PersonaPrecedence.DEFAULT).toBeLessThan(PersonaPrecedence.USER);
    expect(PersonaPrecedence.USER).toBeLessThan(PersonaPrecedence.PROJECT);
  });
});

describe('Type definitions', () => {
  it('should correctly infer YamlPersona type', () => {
    const persona: YamlPersona = {
      id: 'test',
      name: 'Test',
      role: 'tester',
      description: 'Test persona',
      expertise: ['testing'],
      approach: 'Test approach',
      promptTemplate: 'Test template',
      examples: ['Example'],
      tags: ['test'],
      version: '1.0',
    };

    expect(persona.id).toBe('test');
    expect(persona.version).toBe('1.0');
  });

  it('should correctly define PersonaSource interface', () => {
    const source: PersonaSource = {
      type: 'project',
      filePath: '/test/path.yaml',
      lastModified: new Date(),
    };

    expect(source.type).toBe('project');
    expect(source.filePath).toBe('/test/path.yaml');
    expect(source.lastModified).toBeInstanceOf(Date);
  });

  it('should correctly define LoadedPersona interface', () => {
    const loadedPersona: LoadedPersona = {
      id: 'test',
      name: 'Test',
      role: 'tester',
      description: 'Test persona',
      expertise: ['testing'],
      approach: 'Test approach',
      promptTemplate: 'Test template',
      examples: ['Example'],
      tags: ['test'],
      version: '1.0',
      source: {
        type: 'user',
        filePath: '/test/path.yaml',
      },
      isValid: true,
      validationErrors: ['Error 1'],
    };

    expect(loadedPersona.isValid).toBe(true);
    expect(loadedPersona.validationErrors).toEqual(['Error 1']);
    expect(loadedPersona.source.type).toBe('user');
  });

  it('should correctly define PersonaConfig interface', () => {
    const config: PersonaConfig = {
      directories: {
        user: '~/.ai/personas',
        project: '.ai/personas',
      },
      watchOptions: {
        enabled: true,
        debounceMs: 300,
      },
      validation: {
        strict: true,
        logErrors: true,
      },
    };

    expect(config.directories.user).toBe('~/.ai/personas');
    expect(config.watchOptions.enabled).toBe(true);
    expect(config.validation.strict).toBe(true);
  });
});