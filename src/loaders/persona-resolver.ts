import {
  LoadedPersona,
  PersonaSource,
  PersonaPrecedence,
} from '../types/yaml-persona.js';

export interface ResolvedPersona {
  persona: LoadedPersona;
  conflicts: LoadedPersona[];
}

export class PersonaResolver {
  /**
   * Resolve conflicts between personas with the same ID using precedence rules
   * Project > User > Default
   */
  resolveConflicts(personas: LoadedPersona[]): Map<string, ResolvedPersona> {
    const resolved = new Map<string, ResolvedPersona>();

    // Group personas by ID
    const grouped = this.groupPersonasById(personas);

    // Resolve conflicts for each group
    for (const [id, conflictingPersonas] of grouped) {
      const winner = this.selectWinnerByPrecedence(conflictingPersonas);
      const conflicts = conflictingPersonas.filter(p => p !== winner);

      resolved.set(id, {
        persona: winner,
        conflicts,
      });

      // Log conflicts for debugging
      if (conflicts.length > 0) {
        console.log(
          `Persona conflict resolved for '${id}': ` +
            `Using ${winner.source.type} version, ` +
            `ignoring ${conflicts.length} other(s)`
        );
      }
    }

    return resolved;
  }

  /**
   * Get only valid personas (exclude invalid ones)
   */
  getValidPersonas(personas: LoadedPersona[]): LoadedPersona[] {
    return personas.filter(p => p.isValid);
  }

  /**
   * Get only invalid personas for error reporting
   */
  getInvalidPersonas(personas: LoadedPersona[]): LoadedPersona[] {
    return personas.filter(p => !p.isValid);
  }

  /**
   * Get personas by source type
   */
  getPersonasBySource(
    personas: LoadedPersona[],
    sourceType: PersonaSource['type']
  ): LoadedPersona[] {
    return personas.filter(p => p.source.type === sourceType);
  }

  /**
   * Check if a persona with given ID exists in the collection
   */
  hasPersona(personas: LoadedPersona[], id: string): boolean {
    return personas.some(p => p.id === id);
  }

  /**
   * Get statistics about loaded personas
   */
  getStatistics(personas: LoadedPersona[]): {
    total: number;
    valid: number;
    invalid: number;
    bySource: Record<PersonaSource['type'], number>;
    conflicts: number;
  } {
    const bySource = {
      default: 0,
      user: 0,
      project: 0,
    };

    let valid = 0;
    let invalid = 0;

    for (const persona of personas) {
      if (persona.isValid) {
        valid++;
      } else {
        invalid++;
      }
      bySource[persona.source.type]++;
    }

    // Calculate conflicts
    const grouped = this.groupPersonasById(personas);
    const conflicts = Array.from(grouped.values()).filter(
      group => group.length > 1
    ).length;

    return {
      total: personas.length,
      valid,
      invalid,
      bySource,
      conflicts,
    };
  }

  /**
   * Group personas by their ID
   */
  private groupPersonasById(
    personas: LoadedPersona[]
  ): Map<string, LoadedPersona[]> {
    const grouped = new Map<string, LoadedPersona[]>();

    for (const persona of personas) {
      const existing = grouped.get(persona.id) || [];
      existing.push(persona);
      grouped.set(persona.id, existing);
    }

    return grouped;
  }

  /**
   * Select the winning persona based on precedence rules
   */
  private selectWinnerByPrecedence(personas: LoadedPersona[]): LoadedPersona {
    if (personas.length === 1) {
      return personas[0];
    }

    // Sort by precedence (highest first)
    const sorted = personas.sort((a, b) => {
      const aPrecedence = this.getPrecedence(a.source.type);
      const bPrecedence = this.getPrecedence(b.source.type);

      // Higher precedence wins
      if (aPrecedence !== bPrecedence) {
        return bPrecedence - aPrecedence;
      }

      // If same precedence, prefer valid over invalid
      if (a.isValid !== b.isValid) {
        return a.isValid ? -1 : 1;
      }

      // If same precedence and validity, prefer newer file
      if (a.source.lastModified && b.source.lastModified) {
        return b.source.lastModified.getTime() - a.source.lastModified.getTime();
      }

      // Fallback to alphabetical order by file path
      if (a.source.filePath && b.source.filePath) {
        return a.source.filePath.localeCompare(b.source.filePath);
      }

      return 0;
    });

    return sorted[0];
  }

  /**
   * Get numeric precedence value for source type
   */
  private getPrecedence(type: PersonaSource['type']): number {
    switch (type) {
      case 'default':
        return PersonaPrecedence.DEFAULT;
      case 'user':
        return PersonaPrecedence.USER;
      case 'project':
        return PersonaPrecedence.PROJECT;
      default:
        return PersonaPrecedence.DEFAULT;
    }
  }

  /**
   * Validate that personas don't have conflicting roles or properties
   */
  validatePersonaCompatibility(personas: LoadedPersona[]): string[] {
    const warnings: string[] = [];
    const grouped = this.groupPersonasById(personas);

    for (const [id, group] of grouped) {
      if (group.length <= 1) continue;

      // Check for role conflicts
      const roles = new Set(group.map(p => p.role));
      if (roles.size > 1) {
        warnings.push(
          `Persona '${id}' has conflicting roles: ${Array.from(roles).join(
            ', '
          )}`
        );
      }

      // Check for version conflicts
      const versions = new Set(group.map(p => p.version));
      if (versions.size > 1) {
        warnings.push(
          `Persona '${id}' has multiple versions: ${Array.from(
            versions
          ).join(', ')}`
        );
      }
    }

    return warnings;
  }
}