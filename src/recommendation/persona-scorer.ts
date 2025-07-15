import { Persona } from '../types/persona.js';
import {
  TaskDescription,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
} from '../types/recommendation.js';

export class PersonaScorer {
  private weights: ScoringWeights;

  constructor(weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Calculates a normalized score (0-1) for how well a persona matches a task
   */
  public scorePersona(persona: Persona, task: TaskDescription): number {
    const keywordScore = this.calculateKeywordMatch(persona, task);
    const roleScore = this.calculateRoleAlignment(persona, task);
    const expertiseScore = this.calculateExpertiseMatch(persona, task);
    const contextScore = this.calculateContextRelevance(persona, task);
    const complexityScore = this.calculateComplexityFit(persona, task);

    const totalScore =
      keywordScore * this.weights.keywordMatch +
      roleScore * this.weights.roleAlignment +
      expertiseScore * this.weights.expertiseMatch +
      contextScore * this.weights.contextRelevance +
      complexityScore * this.weights.complexityFit;

    return Math.max(0, Math.min(1, totalScore));
  }

  /**
   * Generates reasoning for why a persona received its score
   */
  public generateReasoning(
    persona: Persona,
    task: TaskDescription,
    score: number
  ): string {
    const reasons: string[] = [];

    if (score > 0.8) {
      reasons.push(`Excellent match for "${task.title}"`);
    } else if (score > 0.6) {
      reasons.push(`Good match for "${task.title}"`);
    } else if (score > 0.4) {
      reasons.push(`Moderate match for "${task.title}"`);
    } else {
      reasons.push(`Limited match for "${task.title}"`);
    }

    // Add specific reasoning based on matches
    const keywordMatches = this.findKeywordMatches(persona, task);
    if (keywordMatches.length > 0) {
      reasons.push(
        `Strong keyword alignment: ${keywordMatches.slice(0, 3).join(', ')}`
      );
    }

    const expertiseMatches = this.findExpertiseMatches(persona, task);
    if (expertiseMatches.length > 0) {
      reasons.push(
        `Relevant expertise: ${expertiseMatches.slice(0, 2).join(', ')}`
      );
    }

    if (task.complexity) {
      const complexityFit = this.getComplexityFitDescription(
        persona,
        task.complexity
      );
      reasons.push(complexityFit);
    }

    return reasons.join('. ');
  }

  /**
   * Identifies strengths of the persona for the given task
   */
  public identifyStrengths(persona: Persona, task: TaskDescription): string[] {
    const strengths: string[] = [];

    const keywordMatches = this.findKeywordMatches(persona, task);
    const expertiseMatches = this.findExpertiseMatches(persona, task);

    if (keywordMatches.length > 0) {
      strengths.push(
        `Specialized in ${keywordMatches.slice(0, 2).join(' and ')}`
      );
    }

    if (expertiseMatches.length > 0) {
      strengths.push(
        `Expert knowledge in ${expertiseMatches.slice(0, 2).join(' and ')}`
      );
    }

    // Add role-specific strengths
    switch (persona.role) {
      case 'architect':
        strengths.push('System-level thinking and design patterns');
        break;
      case 'developer':
        strengths.push('Clean code practices and implementation details');
        break;
      case 'reviewer':
        strengths.push('Code quality analysis and best practices');
        break;
      case 'debugger':
        strengths.push('Systematic problem-solving and root cause analysis');
        break;
    }

    return strengths.slice(0, 3); // Limit to top 3 strengths
  }

  /**
   * Identifies limitations of the persona for the given task
   */
  public identifyLimitations(
    persona: Persona,
    task: TaskDescription
  ): string[] {
    const limitations: string[] = [];

    // Check for potential gaps
    if (
      task.domain &&
      !this.hasRelevantDomainExperience(persona, task.domain)
    ) {
      limitations.push(`Limited experience in ${task.domain} domain`);
    }

    if (task.complexity === 'expert' && persona.role !== 'architect') {
      limitations.push('May need architectural guidance for complex systems');
    }

    if (task.complexity === 'simple' && persona.role === 'architect') {
      limitations.push('May overcomplicate simple implementations');
    }

    return limitations.slice(0, 2); // Limit to top 2 limitations
  }

  private calculateKeywordMatch(
    persona: Persona,
    task: TaskDescription
  ): number {
    const taskKeywords = this.extractTaskKeywords(task);
    const personaKeywords = this.extractPersonaKeywords(persona);

    if (taskKeywords.length === 0) return 0.5; // Neutral if no keywords

    const matches = taskKeywords.filter(keyword =>
      personaKeywords.some(pKeyword => this.isSemanticMatch(keyword, pKeyword))
    );

    return matches.length / taskKeywords.length;
  }

  private calculateRoleAlignment(
    persona: Persona,
    task: TaskDescription
  ): number {
    const taskType = this.inferTaskType(task);
    const roleAlignments: Record<string, string[]> = {
      architect: [
        'design',
        'architecture',
        'system',
        'scalability',
        'planning',
      ],
      developer: [
        'implementation',
        'code',
        'programming',
        'development',
        'build',
      ],
      reviewer: ['review', 'analysis', 'quality', 'audit', 'assessment'],
      debugger: ['debug', 'fix', 'troubleshoot', 'problem', 'error', 'bug'],
    };

    const alignedTypes = roleAlignments[persona.role] || [];
    return alignedTypes.some(type => taskType.includes(type)) ? 1.0 : 0.3;
  }

  private calculateExpertiseMatch(
    persona: Persona,
    task: TaskDescription
  ): number {
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    const expertiseMatches = persona.expertise.filter(
      exp =>
        taskText.includes(exp.toLowerCase()) ||
        this.hasSemanticOverlap(exp, taskText)
    );

    return expertiseMatches.length / persona.expertise.length;
  }

  private calculateContextRelevance(
    persona: Persona,
    task: TaskDescription
  ): number {
    if (!task.context) return 0.5; // Neutral if no context

    const contextLower = task.context.toLowerCase();
    const personaText =
      `${persona.description} ${persona.approach}`.toLowerCase();

    // Simple relevance based on shared concepts
    const contextWords = contextLower
      .split(/\s+/)
      .filter(word => word.length > 3);
    const matches = contextWords.filter(word => personaText.includes(word));

    return matches.length / contextWords.length;
  }

  private calculateComplexityFit(
    persona: Persona,
    task: TaskDescription
  ): number {
    if (!task.complexity) return 0.5; // Neutral if no complexity specified

    const complexityFits: Record<string, Record<string, number>> = {
      simple: {
        developer: 1.0,
        debugger: 0.8,
        reviewer: 0.7,
        architect: 0.4,
      },
      moderate: {
        developer: 0.9,
        debugger: 0.9,
        reviewer: 0.8,
        architect: 0.7,
      },
      complex: {
        architect: 1.0,
        developer: 0.7,
        reviewer: 0.8,
        debugger: 0.6,
      },
      expert: {
        architect: 1.0,
        reviewer: 0.8,
        developer: 0.6,
        debugger: 0.5,
      },
    };

    return complexityFits[task.complexity]?.[persona.role] || 0.5;
  }

  private extractTaskKeywords(task: TaskDescription): string[] {
    const explicit = task.keywords || [];
    const implicit = this.extractImplicitKeywords(
      task.title + ' ' + task.description
    );
    return [...explicit, ...implicit].map(k => k.toLowerCase());
  }

  private extractPersonaKeywords(persona: Persona): string[] {
    const fromExpertise = persona.expertise.map(e => e.toLowerCase());
    const fromTags = persona.tags?.map(t => t.toLowerCase()) || [];
    const fromDescription = this.extractImplicitKeywords(persona.description);

    return [...fromExpertise, ...fromTags, ...fromDescription];
  }

  private extractImplicitKeywords(text: string): string[] {
    // Simple keyword extraction - in production, might use NLP
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Filter out common words
    const stopWords = new Set([
      'that',
      'with',
      'from',
      'they',
      'this',
      'will',
      'have',
      'been',
      'their',
      'said',
      'each',
      'which',
      'there',
      'what',
      'were',
      'would',
      'when',
      'where',
      'while',
      'these',
      'those',
      'such',
      'then',
      'than',
      'them',
      'well',
      'some',
    ]);

    return words.filter(word => !stopWords.has(word));
  }

  private isSemanticMatch(keyword1: string, keyword2: string): boolean {
    // Simple semantic matching - exact match or substring
    return keyword1.includes(keyword2) || keyword2.includes(keyword1);
  }

  private hasSemanticOverlap(expertise: string, text: string): boolean {
    const expertiseWords = expertise.toLowerCase().split(/\s+/);
    return expertiseWords.some(word => text.includes(word));
  }

  private inferTaskType(task: TaskDescription): string {
    return `${task.title} ${task.description}`.toLowerCase();
  }

  private findKeywordMatches(
    persona: Persona,
    task: TaskDescription
  ): string[] {
    const taskKeywords = this.extractTaskKeywords(task);
    const personaKeywords = this.extractPersonaKeywords(persona);

    return taskKeywords.filter(keyword =>
      personaKeywords.some(pKeyword => this.isSemanticMatch(keyword, pKeyword))
    );
  }

  private findExpertiseMatches(
    persona: Persona,
    task: TaskDescription
  ): string[] {
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    return persona.expertise.filter(
      exp =>
        taskText.includes(exp.toLowerCase()) ||
        this.hasSemanticOverlap(exp, taskText)
    );
  }

  private hasRelevantDomainExperience(
    persona: Persona,
    domain: string
  ): boolean {
    const domainLower = domain.toLowerCase();
    const personaText =
      `${persona.description} ${persona.expertise.join(' ')}`.toLowerCase();
    return personaText.includes(domainLower);
  }

  private getComplexityFitDescription(
    persona: Persona,
    complexity: string
  ): string {
    const fits: Record<string, Record<string, string>> = {
      simple: {
        developer: 'Well-suited for straightforward implementations',
        debugger: 'Good for simple troubleshooting',
        reviewer: 'Appropriate for basic code reviews',
        architect: 'May overcomplicate simple tasks',
      },
      moderate: {
        developer: 'Excellent for balanced implementation work',
        debugger: 'Strong fit for systematic debugging',
        reviewer: 'Good for thorough code analysis',
        architect: 'Suitable for moderate design decisions',
      },
      complex: {
        architect: 'Ideal for complex system design',
        developer: 'Can handle with proper guidance',
        reviewer: 'Excellent for comprehensive analysis',
        debugger: 'Good for intricate problem-solving',
      },
      expert: {
        architect: 'Perfect for expert-level system design',
        reviewer: 'Ideal for critical code reviews',
        developer: 'May need architectural support',
        debugger: 'Can tackle complex debugging scenarios',
      },
    };

    return (
      fits[complexity]?.[persona.role] ||
      'Moderate fit for this complexity level'
    );
  }
}
