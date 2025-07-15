import { Persona } from '../types/persona.js';
import {
  TaskDescription,
  PersonaRecommendation,
  RecommendationRequest,
  RecommendationResponse,
  ScoringWeights,
} from '../types/recommendation.js';
import { PersonaScorer } from './persona-scorer.js';
import { EnhancedPersonaManager } from '../enhanced-persona-manager.js';

export class RecommendationEngine {
  private personaManager: EnhancedPersonaManager;
  private scorer: PersonaScorer;

  constructor(
    personaManager: EnhancedPersonaManager,
    weights?: ScoringWeights
  ) {
    this.personaManager = personaManager;
    this.scorer = new PersonaScorer(weights);
  }

  /**
   * Processes a recommendation request and returns ranked persona recommendations
   */
  public async processRecommendation(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    const allPersonas = this.personaManager.getAllPersonas();
    const scoredPersonas = await this.scoreAllPersonas(
      allPersonas,
      request.task
    );

    // Sort by score (descending) and take top N
    const topRecommendations = scoredPersonas
      .sort((a, b) => b.score - a.score)
      .slice(0, request.maxRecommendations || 3);

    const recommendations = request.includeReasoning
      ? topRecommendations
      : topRecommendations.map(rec => ({ ...rec, reasoning: '' }));

    const processingTime = Date.now() - startTime;

    return {
      recommendations,
      totalPersonasEvaluated: allPersonas.length,
      processingTimeMs: processingTime,
    };
  }

  /**
   * Gets a quick recommendation for a simple task description
   */
  public async getQuickRecommendation(
    title: string,
    description: string,
    options: { maxRecommendations?: number; keywords?: string[] } = {}
  ): Promise<PersonaRecommendation[]> {
    const task: TaskDescription = {
      title,
      description,
      keywords: options.keywords,
    };

    const request: RecommendationRequest = {
      task,
      maxRecommendations: options.maxRecommendations || 1,
      includeReasoning: true,
    };

    const response = await this.processRecommendation(request);
    return response.recommendations;
  }

  /**
   * Explains why a specific persona was or wasn't recommended for a task
   */
  public async explainPersonaFit(
    personaId: string,
    task: TaskDescription
  ): Promise<{
    persona: Persona;
    score: number;
    reasoning: string;
    strengths: string[];
    limitations: string[];
    confidence: number;
  } | null> {
    const persona = this.personaManager.getPersona(personaId);
    if (!persona) {
      return null;
    }

    const score = this.scorer.scorePersona(persona, task);
    const reasoning = this.scorer.generateReasoning(persona, task, score);
    const strengths = this.scorer.identifyStrengths(persona, task);
    const limitations = this.scorer.identifyLimitations(persona, task);
    const confidence = this.calculateConfidence(score, task);

    return {
      persona,
      score,
      reasoning,
      strengths,
      limitations,
      confidence,
    };
  }

  /**
   * Compares multiple personas for the same task
   */
  public async comparePersonas(
    personaIds: string[],
    task: TaskDescription
  ): Promise<PersonaRecommendation[]> {
    const personas = personaIds
      .map(id => this.personaManager.getPersona(id))
      .filter((persona): persona is Persona => persona !== undefined);

    const scoredPersonas = await this.scoreAllPersonas(personas, task);
    return scoredPersonas.sort((a, b) => b.score - a.score);
  }

  /**
   * Gets recommendations based on task complexity and urgency
   */
  public async getContextualRecommendations(
    task: TaskDescription,
    context: {
      teamSize?: number;
      timeConstraint?: 'tight' | 'moderate' | 'flexible';
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<PersonaRecommendation[]> {
    const enhancedTask = { ...task };

    // Adjust task complexity based on context
    if (context.timeConstraint === 'tight' && !task.complexity) {
      enhancedTask.complexity = 'simple';
    } else if (context.priority === 'critical' && !task.complexity) {
      enhancedTask.complexity = 'complex';
    }

    // Add contextual information
    if (context.teamSize) {
      enhancedTask.context = `${task.context || ''} Team size: ${context.teamSize}`;
    }

    const request: RecommendationRequest = {
      task: enhancedTask,
      maxRecommendations: 3,
      includeReasoning: true,
    };

    const response = await this.processRecommendation(request);
    return response.recommendations;
  }

  private async scoreAllPersonas(
    personas: Persona[],
    task: TaskDescription
  ): Promise<PersonaRecommendation[]> {
    const recommendations: PersonaRecommendation[] = [];

    for (const persona of personas) {
      const score = this.scorer.scorePersona(persona, task);
      const reasoning = this.scorer.generateReasoning(persona, task, score);
      const strengths = this.scorer.identifyStrengths(persona, task);
      const limitations = this.scorer.identifyLimitations(persona, task);
      const confidence = this.calculateConfidence(score, task);

      recommendations.push({
        personaId: persona.id,
        score,
        reasoning,
        strengths,
        limitations: limitations.length > 0 ? limitations : undefined,
        confidence,
      });
    }

    return recommendations;
  }

  private calculateConfidence(score: number, task: TaskDescription): number {
    // Base confidence on score
    let confidence = score;

    // Adjust based on task information completeness
    const infoCompleteness = this.calculateTaskInformationCompleteness(task);
    confidence *= infoCompleteness;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  private calculateTaskInformationCompleteness(task: TaskDescription): number {
    let completeness = 0.5; // Base completeness

    // More complete information increases confidence
    if (task.keywords && task.keywords.length > 0) completeness += 0.1;
    if (task.context && task.context.length > 20) completeness += 0.1;
    if (task.domain) completeness += 0.1;
    if (task.complexity) completeness += 0.1;
    if (task.urgency) completeness += 0.1;

    // Detailed description increases confidence
    if (task.description.length > 50) completeness += 0.1;

    return Math.min(1, completeness);
  }

  /**
   * Updates the scoring weights for the recommendation engine
   */
  public updateScoringWeights(weights: ScoringWeights): void {
    this.scorer = new PersonaScorer(weights);
  }

  /**
   * Gets statistics about the recommendation system
   */
  public getSystemStats(): {
    totalPersonas: number;
    availableRoles: string[];
    scoringWeights: ScoringWeights;
  } {
    const allPersonas = this.personaManager.getAllPersonas();
    const roles = [...new Set(allPersonas.map(p => p.role))];

    return {
      totalPersonas: allPersonas.length,
      availableRoles: roles,
      scoringWeights: this.scorer['weights'], // Access private property for stats
    };
  }
}
