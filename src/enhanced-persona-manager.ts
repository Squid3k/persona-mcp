import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Persona } from './types/persona.js';
import {
  LoadedPersona,
  PersonaConfig,
  PersonaSource,
} from './types/yaml-persona.js';
import { PersonaLoader } from './loaders/persona-loader.js';
import { PersonaWatcher, WatchEvent } from './loaders/persona-watcher.js';
import { PersonaResolver } from './loaders/persona-resolver.js';

// Import existing default personas
import { architectPersona } from './personas/architect.js';
import { developerPersona } from './personas/developer.js';
import { reviewerPersona } from './personas/reviewer.js';
import { debuggerPersona } from './personas/debugger.js';

export class EnhancedPersonaManager {
  private personas = new Map<string, LoadedPersona>();
  private resolver = new PersonaResolver();
  private loader = new PersonaLoader();
  private watcher = new PersonaWatcher();
  private config: PersonaConfig;
  private initialized = false;

  constructor(config?: Partial<PersonaConfig>) {
    this.config = {
      directories: {
        user: path.join(os.homedir(), '.ai', 'personas'),
        project: path.join(process.cwd(), '.ai', 'personas'),
      },
      watchOptions: {
        enabled: true,
        debounceMs: 150,
      },
      validation: {
        strict: false,
        logErrors: true,
      },
      ...config,
    };
  }

  /**
   * Initialize the persona manager - load all personas and start watching
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.error('Initializing Enhanced Persona Manager...');

    // Create user directory if it doesn't exist
    await this.ensureDirectoryExists(this.config.directories.user);

    // Load all personas
    await this.loadAllPersonas();

    // Start file watching if enabled
    if (this.config.watchOptions.enabled) {
      await this.startWatching();
    }

    this.initialized = true;
    console.error('Enhanced Persona Manager initialized successfully');
  }

  /**
   * Shutdown the persona manager - stop watching and cleanup
   */
  async shutdown(): Promise<void> {
    await this.watcher.stopWatching();
    this.personas.clear();
    this.initialized = false;
  }

  /**
   * Get all valid personas
   */
  getAllPersonas(): Persona[] {
    const resolved = this.resolver.resolveConflicts(
      Array.from(this.personas.values())
    );
    return Array.from(resolved.values())
      .filter(r => r.persona.isValid)
      .map(r => this.convertToBasicPersona(r.persona));
  }

  /**
   * Get a specific persona by ID
   */
  getPersona(id: string): Persona | undefined {
    const resolved = this.resolver.resolveConflicts(
      Array.from(this.personas.values())
    );
    const resolvedPersona = resolved.get(id);

    if (!resolvedPersona || !resolvedPersona.persona.isValid) {
      return undefined;
    }

    return this.convertToBasicPersona(resolvedPersona.persona);
  }

  /**
   * Generate prompt using persona template and context
   */
  generatePrompt(persona: Persona, context: string = ''): string {
    // Build prompt from new structure
    let prompt = `${persona.core.identity}\n\n`;
    
    prompt += `Primary Objective: ${persona.core.primaryObjective}\n\n`;
    
    prompt += `Key Constraints:\n`;
    persona.core.constraints.forEach(constraint => {
      prompt += `- ${constraint}\n`;
    });
    
    prompt += `\nMindset:\n`;
    persona.behavior.mindset.forEach(mindset => {
      prompt += `- ${mindset}\n`;
    });
    
    prompt += `\nMethodology:\n`;
    persona.behavior.methodology.forEach((step, index) => {
      prompt += `${index + 1}. ${step}\n`;
    });
    
    prompt += `\nPriorities (in order):\n`;
    persona.behavior.priorities.forEach((priority, index) => {
      prompt += `${index + 1}. ${priority}\n`;
    });
    
    prompt += `\nAvoid:\n`;
    persona.behavior.antiPatterns.forEach(pattern => {
      prompt += `- ${pattern}\n`;
    });
    
    prompt += `\nDecision Criteria:\n`;
    persona.decisionCriteria.forEach(criteria => {
      prompt += `- ${criteria}\n`;
    });

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    if (persona.examples && persona.examples.length > 0) {
      prompt += '\n\nExamples:\n';
      persona.examples.forEach((example, index) => {
        prompt += `${index + 1}. ${example}\n`;
      });
    }

    return prompt;
  }

  /**
   * Get detailed information about loaded personas
   */
  getPersonaInfo(): {
    statistics: ReturnType<PersonaResolver['getStatistics']>;
    conflicts: Array<{ id: string; sources: PersonaSource['type'][] }>;
    invalid: Array<{ id: string; errors: string[] }>;
  } {
    const allPersonas = Array.from(this.personas.values());
    const statistics = this.resolver.getStatistics(allPersonas);
    const resolved = this.resolver.resolveConflicts(allPersonas);

    const conflicts = Array.from(resolved.entries())
      .filter(([, r]) => r.conflicts.length > 0)
      .map(([id, r]) => ({
        id,
        sources: [
          r.persona.source.type,
          ...r.conflicts.map(c => c.source.type),
        ],
      }));

    const invalid = this.resolver.getInvalidPersonas(allPersonas).map(p => ({
      id: p.id,
      errors: p.validationErrors || [],
    }));

    return { statistics, conflicts, invalid };
  }

  /**
   * Reload all personas from disk
   */
  async reloadPersonas(): Promise<void> {
    console.error('Reloading all personas...');
    this.personas.clear();
    await this.loadAllPersonas();
  }

  /**
   * Add a persona programmatically (for backwards compatibility)
   */
  addPersona(persona: Persona): void {
    const loadedPersona: LoadedPersona = {
      ...persona,
      version: '1.0',
      source: {
        type: 'default',
      },
      isValid: true,
    };
    this.personas.set(persona.id, loadedPersona);
  }

  /**
   * Remove a persona by ID
   */
  removePersona(id: string): boolean {
    return this.personas.delete(id);
  }

  /**
   * Load all personas from different sources
   */
  private async loadAllPersonas(): Promise<void> {
    const allPersonas: LoadedPersona[] = [];

    // Load default TypeScript personas
    console.error('Loading default personas...');
    const defaultPersonas = this.loadDefaultPersonas();
    allPersonas.push(...defaultPersonas);

    // Load user personas
    console.error('Loading user personas...');
    const userPersonas = await this.loader.loadPersonasFromDirectory(
      this.config.directories.user,
      'user'
    );
    allPersonas.push(...userPersonas);

    // Load project personas
    console.error('Loading project personas...');
    const projectPersonas = await this.loader.loadPersonasFromDirectory(
      this.config.directories.project,
      'project'
    );
    allPersonas.push(...projectPersonas);

    // Store all personas
    this.personas.clear();
    for (const persona of allPersonas) {
      // Use a unique key that includes source info to avoid overwrites
      const key = `${persona.id}:${persona.source.type}:${persona.source.filePath || 'default'}`;
      this.personas.set(key, persona);
    }

    // Log statistics
    const stats = this.resolver.getStatistics(allPersonas);
    console.error(
      `Loaded ${stats.total} personas (${stats.valid} valid, ${stats.invalid} invalid)`
    );
    console.error(
      `Sources: ${stats.bySource.default} default, ${stats.bySource.user} user, ${stats.bySource.project} project`
    );

    if (stats.conflicts > 0) {
      console.error(`Found ${stats.conflicts} persona conflicts`);
    }
  }

  /**
   * Load default TypeScript personas
   */
  private loadDefaultPersonas(): LoadedPersona[] {
    const defaults = [
      architectPersona,
      developerPersona,
      reviewerPersona,
      debuggerPersona,
    ];

    return defaults.map(persona => ({
      ...persona,
      version: '1.0',
      source: {
        type: 'default' as const,
      },
      isValid: true,
    }));
  }

  /**
   * Start watching for file changes
   */
  private async startWatching(): Promise<void> {
    const directories = [
      this.config.directories.user,
      this.config.directories.project,
    ];

    await this.watcher.startWatching(
      directories,
      this.handleFileChange.bind(this),
      this.config.watchOptions.debounceMs
    );
  }

  /**
   * Handle file system changes
   */
  private async handleFileChange(event: WatchEvent): Promise<void> {
    console.error(`File ${event.type}: ${event.filePath}`);

    try {
      switch (event.type) {
        case 'add':
        case 'change':
          await this.handleFileAddOrChange(event.filePath);
          break;
        case 'unlink':
          await this.handleFileRemove(event.filePath);
          break;
      }
    } catch (error) {
      console.error(`Error handling file change ${event.filePath}:`, error);
    }
  }

  /**
   * Handle file addition or modification
   */
  private async handleFileAddOrChange(filePath: string): Promise<void> {
    const sourceType = this.getSourceTypeFromPath(filePath);
    const persona = await this.loader.loadPersonaFromFile(filePath, sourceType);

    // Remove any existing version of this persona from the same file
    const existingKey = this.findPersonaKeyByPath(filePath);
    if (existingKey) {
      this.personas.delete(existingKey);
    }

    // Add the new/updated persona
    const key = `${persona.id}:${persona.source.type}:${filePath}`;
    this.personas.set(key, persona);

    console.error(
      `${persona.isValid ? 'Loaded' : 'Failed to load'} persona '${persona.id}' from ${filePath}`
    );
  }

  /**
   * Handle file removal
   */
  private async handleFileRemove(filePath: string): Promise<void> {
    const existingKey = this.findPersonaKeyByPath(filePath);
    if (existingKey) {
      const persona = this.personas.get(existingKey);
      this.personas.delete(existingKey);
      console.error(`Removed persona '${persona?.id}' from ${filePath}`);
    }
  }

  /**
   * Determine source type from file path
   */
  private getSourceTypeFromPath(filePath: string): PersonaSource['type'] {
    if (filePath.startsWith(this.config.directories.project)) {
      return 'project';
    }
    if (filePath.startsWith(this.config.directories.user)) {
      return 'user';
    }
    return 'default';
  }

  /**
   * Find persona key by file path
   */
  private findPersonaKeyByPath(filePath: string): string | undefined {
    for (const [key, persona] of this.personas) {
      if (persona.source.filePath === filePath) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Convert LoadedPersona to basic Persona interface
   */
  private convertToBasicPersona(loadedPersona: LoadedPersona): Persona {
    const {
      source: _source,
      isValid: _isValid,
      validationErrors: _validationErrors,
      version: _version,
      author: _author,
      created: _created,
      updated: _updated,
      dependencies: _dependencies,
      extends: _extendsField,
      metadata: _metadata,
      ...basicPersona
    } = loadedPersona;
    return basicPersona;
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.error(`Created directory: ${dir}`);
      } catch (error) {
        console.warn(`Failed to create directory ${dir}:`, error);
      }
    }
  }
}
