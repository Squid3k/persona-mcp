import fs from 'fs/promises';
import path from 'path';
import * as YAML from 'yaml';
import glob from 'fast-glob';
import { z } from 'zod';
import {
  LoadedPersona,
  PersonaSource,
  YamlPersonaSchema,
} from '../types/yaml-persona.js';
import { PathSecurity } from '../utils/path-security.js';

export class PersonaLoader {
  private fileCount = 0; // Track total files loaded
  
  /**
   * Discover all YAML persona files in a directory
   */
  async discoverPersonaFiles(directory: string, maxFiles?: number): Promise<string[]> {
    try {
      // Normalize the directory path
      const normalizedDir = path.resolve(directory);
      
      await fs.access(normalizedDir);
      const files = await glob(['**/*.yaml', '**/*.yml'], {
        cwd: normalizedDir,
        absolute: true,
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/.git/**'],
      });
      
      // Validate all discovered files stay within the directory
      const validFiles: string[] = [];
      for (const file of files) {
        try {
          PathSecurity.validatePath(file, normalizedDir);
          validFiles.push(file);
          
          // Check if we've reached the max files limit
          if (maxFiles && validFiles.length >= maxFiles) {
            console.warn(`Reached maximum file limit (${maxFiles}) in directory: ${directory}`);
            break;
          }
        } catch {
          console.warn(`Skipping potentially unsafe file: ${file}`);
        }
      }
      
      return validFiles;
    } catch {
      // Directory doesn't exist or is not accessible
      return [];
    }
  }

  /**
   * Load and validate a persona from a YAML file
   */
  async loadPersonaFromFile(
    filePath: string,
    sourceType: PersonaSource['type'],
    baseDirectory?: string,
    maxFileSize?: number
  ): Promise<LoadedPersona> {
    try {
      // If a base directory is provided, validate the path stays within it
      let validatedPath = filePath;
      if (baseDirectory) {
        validatedPath = PathSecurity.validatePath(filePath, baseDirectory);
      }
      
      // Check file extension
      if (!PathSecurity.hasAllowedExtension(validatedPath, ['.yaml', '.yml'])) {
        throw new Error(`Invalid file extension. Only .yaml and .yml files are allowed`);
      }
      
      // Check file size before reading
      const stats = await fs.stat(validatedPath);
      const defaultMaxSize = 1024 * 1024; // 1MB default
      const sizeLimit = maxFileSize ?? defaultMaxSize;
      
      if (stats.size > sizeLimit) {
        throw new Error(
          `File size (${stats.size} bytes) exceeds maximum allowed size (${sizeLimit} bytes)`
        );
      }
      
      const content = await fs.readFile(validatedPath, 'utf-8');
      const yamlData = YAML.parse(content) as unknown;

      // Validate with Zod schema
      const persona = YamlPersonaSchema.parse(yamlData);

      return {
        ...persona,
        source: {
          type: sourceType,
          filePath: validatedPath,
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
    sourceType: PersonaSource['type'],
    limits?: {
      maxFileSize?: number;
      maxFilesPerDirectory?: number;
      maxTotalFiles?: number;
    }
  ): Promise<LoadedPersona[]> {
    // Normalize the directory path
    const normalizedDir = path.resolve(directory);
    
    // Check total file count before loading more
    if (limits?.maxTotalFiles && this.fileCount >= limits.maxTotalFiles) {
      console.warn(`Reached maximum total file limit (${limits.maxTotalFiles}). Skipping directory: ${directory}`);
      return [];
    }
    
    const remainingFiles = limits?.maxTotalFiles ? limits.maxTotalFiles - this.fileCount : undefined;
    const maxFilesForDir = limits?.maxFilesPerDirectory 
      ? Math.min(limits.maxFilesPerDirectory, remainingFiles ?? Infinity)
      : remainingFiles;
    
    const files = await this.discoverPersonaFiles(normalizedDir, maxFilesForDir);
    const personas: LoadedPersona[] = [];

    await Promise.all(
      files.map(async filePath => {
        try {
          // Pass the base directory and size limit for validation
          const persona = await this.loadPersonaFromFile(
            filePath, 
            sourceType, 
            normalizedDir,
            limits?.maxFileSize
          );
          personas.push(persona);
          this.fileCount++;
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
   * Reset the file counter (useful for reloading)
   */
  resetFileCount(): void {
    this.fileCount = 0;
  }

  /**
   * Check if a file is a valid persona file
   */
  async validatePersonaFile(filePath: string, baseDirectory?: string): Promise<boolean> {
    try {
      // If a base directory is provided, validate the path stays within it
      let validatedPath = filePath;
      if (baseDirectory) {
        validatedPath = PathSecurity.validatePath(filePath, baseDirectory);
      }
      
      // Check file extension
      if (!PathSecurity.hasAllowedExtension(validatedPath, ['.yaml', '.yml'])) {
        return false;
      }
      
      const content = await fs.readFile(validatedPath, 'utf-8');
      const yamlData = YAML.parse(content) as unknown;
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
