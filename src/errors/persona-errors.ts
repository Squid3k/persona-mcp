import { BaseError } from './base.js';

/**
 * Error thrown when a requested persona cannot be found
 */
export class PersonaNotFoundError extends BaseError {
  constructor(personaId: string) {
    super(`Persona not found: ${personaId}`, 'PERSONA_NOT_FOUND', 404);
    this.name = 'PersonaNotFoundError';
  }
}

/**
 * Error thrown when persona URI is invalid
 */
export class InvalidPersonaURIError extends BaseError {
  constructor(uri: string) {
    super(
      `Invalid persona URI: ${uri}. Expected format: persona://[id]`,
      'INVALID_PERSONA_URI',
      400
    );
    this.name = 'InvalidPersonaURIError';
  }
}

/**
 * Error thrown when persona validation fails
 */
export class PersonaValidationError extends BaseError {
  public readonly validationErrors: string[];

  constructor(personaId: string, errors: string[]) {
    super(
      `Validation failed for persona '${personaId}': ${errors.join(', ')}`,
      'PERSONA_VALIDATION_ERROR',
      422
    );
    this.name = 'PersonaValidationError';
    this.validationErrors = errors;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Error thrown when persona loading fails
 */
export class PersonaLoadingError extends BaseError {
  public readonly filePath: string;
  public readonly originalError?: Error;

  constructor(filePath: string, originalError?: Error) {
    super(
      `Failed to load persona from ${filePath}${
        originalError ? `: ${originalError.message}` : ''
      }`,
      'PERSONA_LOADING_ERROR',
      500
    );
    this.name = 'PersonaLoadingError';
    this.filePath = filePath;
    this.originalError = originalError;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      filePath: this.filePath,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * Error thrown when there are conflicts between personas
 */
export class PersonaConflictError extends BaseError {
  public readonly conflicts: Array<{ id: string; sources: string[] }>;

  constructor(conflicts: Array<{ id: string; sources: string[] }>) {
    const conflictDetails = conflicts
      .map(c => `${c.id} (${c.sources.join(' vs ')}`)
      .join(', ');
    super(
      `Persona conflicts detected: ${conflictDetails}`,
      'PERSONA_CONFLICT',
      409
    );
    this.name = 'PersonaConflictError';
    this.conflicts = conflicts;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      conflicts: this.conflicts,
    };
  }
}
