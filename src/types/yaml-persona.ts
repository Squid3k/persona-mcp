import { z } from 'zod';
import { PersonaSchema } from './persona.js';

export const YamlPersonaMetadataSchema = z
  .object({
    category: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedTime: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .optional();

export const YamlPersonaSchema = PersonaSchema.extend({
  // YAML-specific metadata fields
  version: z.string().default('1.0'),
  author: z.string().optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional(),
  dependencies: z.array(z.string()).optional(),
  extends: z.string().optional(), // For persona inheritance

  // Enhanced metadata
  metadata: YamlPersonaMetadataSchema,
}).strict();

export type YamlPersona = z.infer<typeof YamlPersonaSchema>;

// Source information for loaded personas
export interface PersonaSource {
  type: 'default' | 'user' | 'project';
  filePath?: string;
  lastModified?: Date;
}

// Enhanced persona with source tracking
export interface LoadedPersona extends YamlPersona {
  source: PersonaSource;
  isValid: boolean;
  validationErrors?: string[];
}

// Configuration for persona loading
export interface PersonaConfig {
  directories: {
    user: string; // ~/.ai/personas
    project: string; // {project}/.ai/personas
  };
  watchOptions: {
    enabled: boolean;
    debounceMs: number;
  };
  validation: {
    strict: boolean;
    logErrors: boolean;
  };
}

// Precedence levels for conflict resolution
export enum PersonaPrecedence {
  DEFAULT = 1,
  USER = 2,
  PROJECT = 3,
}

// Error types for persona loading
export class PersonaValidationError extends Error {
  constructor(
    public filePath: string,
    public validationErrors: string[],
    message?: string
  ) {
    super(message || `Validation failed for ${filePath}`);
    this.name = 'PersonaValidationError';
  }
}

export class PersonaLoadingError extends Error {
  public cause?: Error;

  constructor(
    public filePath: string,
    public originalError: Error,
    message?: string
  ) {
    super(message || `Failed to load persona from ${filePath}`);
    this.name = 'PersonaLoadingError';
    this.cause = originalError;
  }
}
