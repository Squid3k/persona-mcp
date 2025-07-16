import { Persona } from './types/persona.js';
import { architectPersona } from './personas/architect.js';
import { developerPersona } from './personas/developer.js';
import { reviewerPersona } from './personas/reviewer.js';
import { debuggerPersona } from './personas/debugger.js';
import { productManagerPersona } from './personas/product-manager.js';
import { technicalWriterPersona } from './personas/technical-writer.js';
import { engineeringManagerPersona } from './personas/engineering-manager.js';
import { optimizerPersona } from './personas/optimizer.js';
import { securityAnalystPersona } from './personas/security-analyst.js';
import { testerPersona } from './personas/tester.js';
import { uiDesignerPersona } from './personas/ui-designer.js';
import { performanceAnalystPersona } from './personas/performance-analyst.js';

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
      productManagerPersona,
      technicalWriterPersona,
      engineeringManagerPersona,
      optimizerPersona,
      securityAnalystPersona,
      testerPersona,
      uiDesignerPersona,
      performanceAnalystPersona,
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

    if (persona.behaviorDiagrams && persona.behaviorDiagrams.length > 0) {
      prompt += '\n\nBehavioral Process Flows:\n';
      persona.behaviorDiagrams.forEach((diagram) => {
        prompt += `\n### ${diagram.title}\n`;
        prompt += `${diagram.description}\n\n`;
        prompt += '```mermaid\n';
        prompt += diagram.mermaidDSL;
        prompt += '\n```\n';
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
