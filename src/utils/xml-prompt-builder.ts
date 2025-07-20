/**
 * XML Prompt Builder for generating semantic XML-structured prompts
 * with Mermaid diagram integration for personas
 */

import { Persona, BehaviorDiagram } from '../types/persona.js';
import {
  XmlPromptSection,
  MermaidDiagramReference,
  Priority,
  Weight,
  CompressionLevel,
} from '../types/prompt-format.js';

export class XmlPromptBuilder {
  private compressionLevel: CompressionLevel;

  constructor(compressionLevel: CompressionLevel = CompressionLevel.MODERATE) {
    this.compressionLevel = compressionLevel;
  }

  /**
   * Build a complete XML prompt from a persona
   */
  buildPrompt(persona: Persona, context?: string): string {
    const sections: XmlPromptSection[] = [
      this.buildContextSection(persona),
      this.buildCoreSection(persona),
      this.buildRulesSection(persona.core.constraints),
      this.buildWorkflowSection(
        persona.behavior.methodology,
        persona.behaviorDiagrams
      ),
      this.buildDecisionSection(
        persona.decisionCriteria,
        persona.behaviorDiagrams
      ),
    ];

    if (context) {
      sections.push({
        tag: 'current-context',
        content: context,
      });
    }

    const personaSection: XmlPromptSection = {
      tag: 'persona',
      attributes: { role: persona.id },
      content: sections,
    };

    return this.formatXml([personaSection]);
  }

  /**
   * Build the context section with narrative description
   */
  private buildContextSection(persona: Persona): XmlPromptSection {
    const context = this.compressText(
      this.extractContextNarrative(persona),
      'narrative'
    );

    return {
      tag: 'context',
      content: context,
    };
  }

  /**
   * Build the core section with objective and philosophy
   */
  private buildCoreSection(persona: Persona): XmlPromptSection {
    const objective = this.compressText(
      persona.core.primaryObjective,
      'objective'
    );

    // Extract philosophy from mindset
    const philosophy = this.compressText(
      persona.behavior.mindset[0] || persona.core.identity,
      'philosophy'
    );

    return {
      tag: 'core',
      content: [
        { tag: 'objective', content: objective },
        { tag: 'philosophy', content: philosophy },
      ],
    };
  }

  /**
   * Build the rules section from constraints
   */
  private buildRulesSection(constraints: string[]): XmlPromptSection {
    const rules: XmlPromptSection[] = [];

    constraints.forEach(constraint => {
      const isRequirement =
        constraint.toLowerCase().startsWith('must') ||
        constraint.toLowerCase().includes('document') ||
        constraint.toLowerCase().includes('ensure');

      const priority = this.determinePriority(constraint);
      const text = this.compressText(constraint, 'rule');

      if (isRequirement) {
        rules.push({
          tag: 'requirement',
          attributes: { priority },
          content: text,
        });
      } else {
        rules.push({
          tag: 'prohibition',
          attributes: { severity: priority },
          content: text,
        });
      }
    });

    return {
      tag: 'rules',
      content: rules,
    };
  }

  /**
   * Build the workflow section with optional Mermaid diagram
   */
  private buildWorkflowSection(
    methodology: string[],
    diagrams?: BehaviorDiagram[]
  ): XmlPromptSection {
    const sections: XmlPromptSection[] = [];

    // Add description
    const description = this.summarizeMethodology(methodology);
    sections.push({
      tag: 'description',
      content: description,
    });

    // Find and add workflow diagram
    const workflowDiagram = this.findWorkflowDiagram(diagrams);
    if (workflowDiagram) {
      sections.push({
        tag: 'diagram',
        attributes: { type: 'mermaid' },
        content: this.formatMermaidDiagram(workflowDiagram),
      });
    } else if (this.compressionLevel === CompressionLevel.NONE) {
      // Fall back to steps if no compression
      methodology.forEach((step, index) => {
        sections.push({
          tag: 'step',
          attributes: { order: (index + 1).toString() },
          content: this.compressText(step, 'step'),
        });
      });
    }

    return {
      tag: 'workflow',
      content: sections,
    };
  }

  /**
   * Build the decision framework section with optional Mermaid diagram
   */
  private buildDecisionSection(
    criteria: string[],
    diagrams?: BehaviorDiagram[]
  ): XmlPromptSection {
    const sections: XmlPromptSection[] = [];

    // Add description
    sections.push({
      tag: 'description',
      content: 'Decision criteria',
    });

    // Find and add decision diagram
    const decisionDiagram = this.findDecisionDiagram(diagrams);
    if (decisionDiagram) {
      sections.push({
        tag: 'diagram',
        attributes: { type: 'mermaid' },
        content: this.formatMermaidDiagram(decisionDiagram),
      });
    }

    // Add criteria questions
    const criteriaSection: XmlPromptSection = {
      tag: 'criteria',
      content: criteria.map(criterion => ({
        tag: 'question',
        attributes: { weight: this.determineWeight(criterion) },
        content: this.compressText(criterion, 'question'),
      })),
    };
    sections.push(criteriaSection);

    return {
      tag: 'decision-framework',
      content: sections,
    };
  }

  /**
   * Extract a narrative context from the persona
   */
  private extractContextNarrative(persona: Persona): string {
    // Create a compelling but concise narrative
    const _role = persona.role.replace(/-/g, ' ');

    // Extract key characteristic from identity
    const identityMatch = persona.core.identity.match(/who\s+(.+?)(?:\.|$)/i);
    const characteristic = identityMatch
      ? identityMatch[1].toLowerCase()
      : persona.core.identity.toLowerCase().slice(0, 50);

    // Use compressed mindset
    const mindset = this.compressText(persona.behavior.mindset[0], 'context');

    return `${characteristic}. ${mindset}`;
  }

  /**
   * Summarize methodology into a brief description
   */
  private summarizeMethodology(methodology: string[]): string {
    if (methodology.length === 0) return 'Systematic approach';

    // Extract key verbs from first 3 steps
    const keyActions = methodology
      .slice(0, 3)
      .map(step => {
        const verb = step.match(/^(\w+)/i);
        return verb ? verb[1].toLowerCase() : 'analyze';
      })
      .join('-');

    return keyActions;
  }

  /**
   * Find workflow-related diagram
   */
  private findWorkflowDiagram(
    diagrams?: BehaviorDiagram[]
  ): MermaidDiagramReference | null {
    if (!diagrams) return null;

    const diagram = diagrams.find(
      d =>
        d.diagramType === 'state' ||
        d.title.toLowerCase().includes('workflow') ||
        d.title.toLowerCase().includes('process')
    );

    return diagram
      ? {
          type: diagram.diagramType,
          title: diagram.title,
          content: diagram.mermaidDSL,
          description: diagram.description,
        }
      : null;
  }

  /**
   * Find decision-related diagram
   */
  private findDecisionDiagram(
    diagrams?: BehaviorDiagram[]
  ): MermaidDiagramReference | null {
    if (!diagrams) return null;

    const diagram = diagrams.find(
      d =>
        d.diagramType === 'decision-tree' ||
        d.diagramType === 'flowchart' ||
        d.title.toLowerCase().includes('decision')
    );

    return diagram
      ? {
          type: diagram.diagramType,
          title: diagram.title,
          content: diagram.mermaidDSL,
          description: diagram.description,
        }
      : null;
  }

  /**
   * Format a Mermaid diagram for XML embedding
   */
  private formatMermaidDiagram(diagram: MermaidDiagramReference): string {
    return `\`\`\`mermaid\n${diagram.content}\n\`\`\``;
  }

  /**
   * Compress text based on compression level and type
   */
  private compressText(text: string, _type: string): string {
    if (this.compressionLevel === CompressionLevel.NONE) {
      return text;
    }

    // Remove common prefixes (case-insensitive)
    let compressed = text
      .replace(/^Must\s+/i, '')
      .replace(/^Should\s+/i, '')
      .replace(/^Always\s+/i, '')
      .replace(/^Never\s+/i, '')
      .replace(/^Avoid\s+/i, '')
      .replace(/^Do not\s+/i, "Don't ")
      .replace(/^Cannot\s+/i, "Can't ")
      .replace(/^Document\s+/i, 'document '); // Fix for "Document all test results"

    // Ensure first letter is lowercase after prefix removal
    if (compressed.length > 0 && compressed !== text) {
      compressed = compressed.charAt(0).toLowerCase() + compressed.slice(1);
    }

    if (this.compressionLevel === CompressionLevel.AGGRESSIVE) {
      // More aggressive compression
      compressed = compressed
        .replace(/\s+the\s+/gi, ' ')
        .replace(/\s+a\s+/gi, ' ')
        .replace(/\s+an\s+/gi, ' ')
        .replace(/\s+with\s+/gi, ' w/ ')
        .replace(/\s+and\s+/gi, ' & ')
        .replace(/documentation/gi, 'docs')
        .replace(/requirements/gi, 'reqs')
        .replace(/implementation/gi, 'impl');
    }

    return compressed.trim();
  }

  /**
   * Determine priority level from constraint text
   */
  private determinePriority(constraint: string): string {
    const lower = constraint.toLowerCase();

    // Check for explicit priority indicators
    if (
      lower.includes('must') ||
      lower.includes('critical') ||
      lower.includes('always')
    ) {
      return Priority.CRITICAL;
    }
    if (
      lower.includes('never') ||
      lower.includes('avoid') ||
      lower.includes('do not')
    ) {
      return Priority.HIGH;
    }
    if (lower.includes('should') || lower.includes('important')) {
      return Priority.HIGH;
    }

    // Default to medium
    return Priority.MEDIUM;
  }

  /**
   * Determine weight level from criteria text
   */
  private determineWeight(criterion: string): string {
    const lower = criterion.toLowerCase();
    if (lower.includes('scale') || lower.includes('security')) {
      return Weight.CRITICAL;
    }
    if (lower.includes('maintain') || lower.includes('fail')) {
      return Weight.HIGH;
    }
    return Weight.MEDIUM;
  }

  /**
   * Format XML from sections with proper indentation
   */
  private formatXml(sections: XmlPromptSection[], indent: number = 0): string {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);

    sections.forEach(section => {
      const attrs = section.attributes
        ? ' ' +
          Object.entries(section.attributes)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ')
        : '';

      if (typeof section.content === 'string') {
        // Single line content
        lines.push(
          `${indentStr}<${section.tag}${attrs}>${section.content}</${section.tag}>`
        );
      } else {
        // Multi-line content
        lines.push(`${indentStr}<${section.tag}${attrs}>`);
        lines.push(this.formatXml(section.content, indent + 1));
        lines.push(`${indentStr}</${section.tag}>`);
      }
    });

    return lines.join('\n');
  }
}
