import fs from 'fs/promises';
import path from 'path';
import * as YAML from 'yaml';
import glob from 'fast-glob';
import { z } from 'zod';
import {
  YamlPersona,
  YamlPersonaSchema,
  LoadedPersona,
  PersonaSource,
  PersonaValidationError,
  PersonaLoadingError,
} from '../types/yaml-persona.js';

export class PersonaLoader {
  /**
   * Discover all YAML persona files in a directory
   */
  async discoverPersonaFiles(directory: string): Promise<string[]> {
    try {
      await fs.access(directory);
      const files = await glob(['**/*.yaml', '**/*.yml'], {
        cwd: directory,
        absolute: true,
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/.git/**'],
      });
      return files;
    } catch (error) {
      // Directory doesn't exist or is not accessible
      return [];
    }
  }

  /**
   * Load and validate a persona from a YAML file
   */
  async loadPersonaFromFile(
    filePath: string,
    sourceType: PersonaSource['type']
  ): Promise<LoadedPersona> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const yamlData = YAML.parse(content);

      // Validate with Zod schema
      const persona = YamlPersonaSchema.parse(yamlData);

      // Get file stats for metadata
      const stats = await fs.stat(filePath);

      return {
        ...persona,
        source: {
          type: sourceType,
          filePath,
          lastModified: stats.mtime,
        },
        isValid: true,
      };
    } catch (error) {
      return this.createInvalidPersona(filePath, sourceType, error);
    }
  }

  /**
   * Load multiple personas from a directory
   */
  async loadPersonasFromDirectory(
    directory: string,
    sourceType: PersonaSource['type']
  ): Promise<LoadedPersona[]> {
    const files = await this.discoverPersonaFiles(directory);
    const personas: LoadedPersona[] = [];

    await Promise.all(
      files.map(async filePath => {
        try {
          const persona = await this.loadPersonaFromFile(filePath, sourceType);
          personas.push(persona);
        } catch (error) {
          console.warn(`Failed to load persona from ${filePath}:`, error);
          // Create invalid persona for tracking
          const invalidPersona = this.createInvalidPersona(
            filePath,
            sourceType,
            error
          );
          personas.push(invalidPersona);
        }
      })
    );

    return personas;
  }

  /**
   * Check if a file is a valid persona file
   */
  async validatePersonaFile(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const yamlData = YAML.parse(content);
      YamlPersonaSchema.parse(yamlData);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get persona ID from file path
   */
  getPersonaIdFromPath(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Create an invalid persona for error tracking
   */
  private createInvalidPersona(
    filePath: string,
    sourceType: PersonaSource['type'],
    error: unknown
  ): LoadedPersona {
    const validationErrors = this.extractValidationErrors(error);
    const personaId = this.getPersonaIdFromPath(filePath);

    return {
      // Required fields with fallback values
      id: personaId,
      name: `Invalid Persona (${personaId})`,
      role: 'invalid',
      description: 'This persona failed validation and cannot be used.',
      expertise: [],
      approach: 'N/A - Invalid persona',
      promptTemplate: 'This persona is invalid and cannot be used.',
      version: '1.0',

      // Source information
      source: {
        type: sourceType,
        filePath,
      },
      isValid: false,
      validationErrors,
    };
  }

  /**
   * Extract human-readable validation errors
   */
  private extractValidationErrors(error: unknown): string[] {
    if (error instanceof z.ZodError) {
      return error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    }

    if (error instanceof YAML.YAMLParseError) {
      return [`YAML Parse Error: ${error.message}`];
    }

    if (error instanceof Error) {
      return [error.message];
    }

    return ['Unknown error occurred while loading persona'];
  }
}