import { Persona } from './types/persona.js';
import { architectPersona } from './personas/architect.js';
import { developerPersona } from './personas/developer.js';
import { reviewerPersona } from './personas/reviewer.js';
import { debuggerPersona } from './personas/debugger.js';

export class PersonaManager {
  private personas: Map<string, Persona> = new Map();

  constructor() {
    this.loadPersonas();
  }

  private loadPersonas() {
    const defaultPersonas = [
      architectPersona,
      developerPersona,
      reviewerPersona,
      debuggerPersona,
    ];

    for (const persona of defaultPersonas) {
      this.personas.set(persona.id, persona);
    }
  }

  getAllPersonas(): Persona[] {
    return Array.from(this.personas.values());
  }

  getPersona(id: string): Persona | undefined {
    return this.personas.get(id);
  }

  generatePrompt(persona: Persona, context: string = ''): string {
    let prompt = persona.promptTemplate;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    if (persona.examples && persona.examples.length > 0) {
      prompt += '\n\nExamples of this approach:\n';
      persona.examples.forEach((example, index) => {
        prompt += `${index + 1}. ${example}\n`;
      });
    }

    return prompt;
  }

  addPersona(persona: Persona): void {
    this.personas.set(persona.id, persona);
  }

  removePersona(id: string): boolean {
    return this.personas.delete(id);
  }
}
