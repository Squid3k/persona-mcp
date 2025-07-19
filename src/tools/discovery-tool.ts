import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { EnhancedPersonaManager } from '../enhanced-persona-manager.js';
import { RecommendationEngine } from '../recommendation/recommendation-engine.js';
import { TaskDescription } from '../types/recommendation.js';
import { ToolNotFoundError } from '../errors/index.js';
import {
  matchesAdoptionTriggers,
  getPersonaEnhancement,
} from '../types/enhanced-persona.js';

interface ToolArgs {
  [key: string]: unknown;
}

interface ContextAnalysis {
  signals: string[];
  confidence: number;
  primaryIndicators: string[];
  secondaryIndicators: string[];
  possibleDomains?: string[];
  workflowStage?: string;
  complexity?: string;
  fileContext?: string[];
  errorMessages?: string[];
  currentTask?: string;
}

interface DiscoveryRecommendation {
  personaId: string;
  confidence: number;
  reasoning: string;
  adoptionTriggers: string[];
}

type DiscoveryResult =
  | {
      success: true;
      data: {
        contextAnalysis: ContextAnalysis;
        recommendations: DiscoveryRecommendation[];
        suggestedAction: string;
        adoptionPrompts?: Array<{
          personaId: string;
          prompt: string;
        }>;
      };
    }
  | {
      success: false;
      error: string;
    };

type TransitionResult =
  | {
      success: true;
      data: {
        currentStage: string;
        suggestedTransitions: Array<{
          personaId: string;
          reasoning: string;
          timing: string;
          adoptionPrompt?: string;
        }>;
        workflowAdvice: string;
      };
    }
  | {
      success: false;
      error: string;
    };

type EffectivenessResult =
  | {
      success: true;
      data: {
        overallScore: number;
        breakdown: {
          progressAlignment: number;
          satisfactionAlignment: number;
          taskComplexityMatch: number;
          timeEfficiency: number;
        };
        recommendations: string[];
        suggestedTransition?: {
          personaId: string;
          reasoning: string;
        };
      };
    }
  | {
      success: false;
      error: string;
    };

interface TransitionAnalysis {
  stage?: string;
  currentPersona?: string;
  progress?: string;
  encounteredException?: string;
  nextPlannedActivity?: string;
  workflowStage?: string;
}

interface TransitionSuggestion {
  personaId: string;
  reasoning: string;
  timing?: string;
  adoptionPrompt?: string;
  action?: string;
  confidence?: number;
}

interface EffectivenessData {
  overallScore: number;
  breakdown: {
    progressAlignment: number;
    satisfactionAlignment: number;
    taskComplexityMatch: number;
    timeEfficiency: number;
  };
}

interface ContextRecommendation {
  personaId: string;
  confidence: number;
  reasoning: string;
}

export class DiscoveryTool {
  private personaManager: EnhancedPersonaManager;
  private recommendationEngine: RecommendationEngine;

  constructor(personaManager: EnhancedPersonaManager) {
    this.personaManager = personaManager;
    this.recommendationEngine = new RecommendationEngine(personaManager);
  }

  /**
   * Returns the discovery tool definitions for MCP
   */
  public getToolDefinitions(): Tool[] {
    return [
      {
        name: 'discover-persona-for-context',
        description:
          '🚀 SMART AUTO-DISCOVERY: Analyze conversation/file context and instantly suggest the perfect persona | Proactive recommendations | Context-aware suggestions | Never miss the right expertise again!',
        inputSchema: {
          type: 'object',
          properties: {
            conversationContext: {
              type: 'string',
              description:
                '💬 Recent conversation history or current discussion context for intelligent persona suggestions',
            },
            fileContext: {
              type: 'array',
              items: { type: 'string' },
              description:
                '📁 Current file paths, names, or types being worked on (e.g., ["src/auth.ts", "package.json", "dockerfile"])',
            },
            errorMessages: {
              type: 'array',
              items: { type: 'string' },
              description:
                '🚨 Recent error messages or warnings that might indicate needed expertise (triggers Debugger, Security Analyst, etc.)',
            },
            currentTask: {
              type: 'string',
              description:
                "🎯 Brief description of what you're currently trying to accomplish",
            },
            projectType: {
              type: 'string',
              description:
                '🏗️ Type of project or codebase (web app, mobile, CLI tool, library, etc.)',
            },
            teamSize: {
              type: 'string',
              enum: ['solo', 'small-team', 'large-team', 'enterprise'],
              description:
                '👥 Team context affects persona recommendations (solo → all-rounder, enterprise → specialists)',
            },
            timeConstraint: {
              type: 'string',
              enum: ['no-rush', 'moderate', 'tight-deadline', 'emergency'],
              description:
                '⏰ Time pressure level influences persona selection strategy',
            },
            includeAdoptionPrompt: {
              type: 'boolean',
              description:
                '✨ Generate ready-to-use adoption prompts for suggested personas (recommended for immediate use)',
            },
          },
          required: [],
        },
      },
      {
        name: 'suggest-persona-transition',
        description:
          '🔄 SMART TRANSITIONS: Detect when to switch personas mid-task | Workflow optimization | Seamless persona handoffs | Maximize productivity with intelligent persona sequencing',
        inputSchema: {
          type: 'object',
          properties: {
            currentPersona: {
              type: 'string',
              description:
                '👤 Currently active persona ID (if any) for transition analysis',
            },
            taskProgress: {
              type: 'string',
              enum: ['just-started', 'in-progress', 'nearly-complete', 'stuck'],
              description:
                '📊 Current progress state affects transition recommendations',
            },
            encounteredException: {
              type: 'string',
              description:
                '⚠️ Specific issue or roadblock encountered that might require different expertise',
            },
            nextPlannedActivity: {
              type: 'string',
              description:
                '🎯 What you plan to work on next (helps suggest preemptive persona switches)',
            },
            workflowStage: {
              type: 'string',
              enum: [
                'planning',
                'design',
                'implementation',
                'testing',
                'debugging',
                'optimization',
                'documentation',
                'review',
              ],
              description:
                '🔄 Current workflow stage for stage-appropriate persona suggestions',
            },
          },
          required: ['workflowStage'],
        },
      },
      {
        name: 'analyze-persona-effectiveness',
        description:
          '📊 PERFORMANCE ANALYTICS: Measure how well your current persona choice is working | Real-time effectiveness scoring | Optimization suggestions | Data-driven persona selection insights',
        inputSchema: {
          type: 'object',
          properties: {
            sessionDuration: {
              type: 'number',
              description:
                "⏱️ How long you've been working with the current persona (in minutes)",
            },
            taskComplexity: {
              type: 'string',
              enum: ['simple', 'moderate', 'complex', 'expert'],
              description: '🧠 Perceived complexity of the current task',
            },
            progressMade: {
              type: 'string',
              enum: ['none', 'minimal', 'good', 'excellent'],
              description:
                '📈 Self-assessment of progress made with current persona',
            },
            satisfactionLevel: {
              type: 'string',
              enum: ['frustrated', 'neutral', 'satisfied', 'very-satisfied'],
              description:
                "😊 Your satisfaction with the persona's performance",
            },
            encounterGaps: {
              type: 'array',
              items: { type: 'string' },
              description:
                '🔍 Specific areas where the persona seemed to lack expertise or guidance',
            },
            unexpectedStrengths: {
              type: 'array',
              items: { type: 'string' },
              description:
                '💪 Areas where the persona performed better than expected',
            },
          },
          required: ['progressMade', 'satisfactionLevel'],
        },
      },
    ];
  }

  /**
   * Handles discovery tool calls
   */
  public async handleToolCall(name: string, args: ToolArgs): Promise<unknown> {
    switch (name) {
      case 'discover-persona-for-context':
        return await this.handleDiscoverPersonaForContext(args);
      case 'suggest-persona-transition':
        return await this.handleSuggestPersonaTransition(args);
      case 'analyze-persona-effectiveness':
        return await this.handleAnalyzePersonaEffectiveness(args);
      default:
        throw new ToolNotFoundError(name);
    }
  }

  private async handleDiscoverPersonaForContext(
    args: ToolArgs
  ): Promise<DiscoveryResult> {
    try {
      const contextAnalysis = this.analyzeContext(args);
      const recommendations =
        await this.getContextualRecommendations(contextAnalysis);

      const result: DiscoveryResult = {
        success: true,
        data: {
          contextAnalysis,
          recommendations: recommendations.map(rec => ({
            personaId: rec.personaId,
            confidence: Math.round(rec.confidence * 100),
            reasoning: rec.reasoning,
            adoptionTriggers: this.generateAdoptionTriggers(
              rec.personaId,
              contextAnalysis
            ),
          })),
          suggestedAction: this.generateSuggestedAction(
            recommendations[0],
            contextAnalysis
          ),
        },
      };

      if (args.includeAdoptionPrompt) {
        result.data.adoptionPrompts = recommendations.slice(0, 2).map(rec => ({
          personaId: rec.personaId,
          prompt: this.generateAdoptionPrompt(rec.personaId, contextAnalysis),
        }));
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async handleSuggestPersonaTransition(
    args: ToolArgs
  ): Promise<TransitionResult> {
    try {
      const transitionAnalysis = this.analyzeTransition(args);
      const suggestions =
        await this.getTransitionSuggestions(transitionAnalysis);

      const result: TransitionResult = {
        success: true,
        data: {
          currentStage: transitionAnalysis.stage || 'unknown',
          suggestedTransitions: suggestions.map(s => ({
            personaId: s.personaId,
            reasoning: s.reasoning,
            timing: s.timing || 'immediate',
            adoptionPrompt: s.adoptionPrompt,
          })),
          workflowAdvice: this.generateWorkflowAdvice(
            transitionAnalysis,
            suggestions
          ),
        },
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async handleAnalyzePersonaEffectiveness(
    args: ToolArgs
  ): Promise<EffectivenessResult> {
    try {
      const effectiveness = this.calculateEffectiveness(args);
      const _insights = this.generateEffectivenessInsights(args, effectiveness);

      const result: EffectivenessResult = {
        success: true,
        data: {
          overallScore: effectiveness.overallScore,
          breakdown: effectiveness.breakdown,
          recommendations: this.generateEffectivenessRecommendations(
            args,
            effectiveness
          ),
        },
      };

      // Add transition suggestion if score is low
      if (effectiveness.overallScore < 0.5) {
        const transitionSuggestion = await this.suggestAlternativePersona(args);
        if (transitionSuggestion) {
          result.data.suggestedTransition = transitionSuggestion;
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private analyzeContext(args: ToolArgs): ContextAnalysis {
    const context: ContextAnalysis = {
      signals: [],
      confidence: 0,
      primaryIndicators: [],
      secondaryIndicators: [],
    };

    // Analyze file context
    if (args.fileContext && Array.isArray(args.fileContext)) {
      const files = args.fileContext as string[];
      for (const file of files) {
        if (file.includes('test') || file.includes('spec')) {
          context.signals.push('testing-activity');
        }
        if (file.includes('docker') || file.includes('deploy')) {
          context.signals.push('deployment-activity');
        }
        if (file.includes('.ts') || file.includes('.js')) {
          context.signals.push('development-activity');
        }
        if (file.includes('architecture') || file.includes('design')) {
          context.signals.push('architecture-activity');
        }
      }
    }

    // Analyze error messages
    if (args.errorMessages && Array.isArray(args.errorMessages)) {
      const errors = args.errorMessages as string[];
      context.signals.push('debugging-needed');

      for (const error of errors) {
        if (
          error.toLowerCase().includes('memory') ||
          error.toLowerCase().includes('leak')
        ) {
          context.primaryIndicators.push('memory-issues');
        }
        if (
          error.toLowerCase().includes('security') ||
          error.toLowerCase().includes('auth')
        ) {
          context.primaryIndicators.push('security-issues');
        }
        if (
          error.toLowerCase().includes('performance') ||
          error.toLowerCase().includes('slow')
        ) {
          context.primaryIndicators.push('performance-issues');
        }
      }
    }

    // Analyze current task
    if (args.currentTask) {
      const task = (args.currentTask as string).toLowerCase();
      if (
        task.includes('debug') ||
        task.includes('fix') ||
        task.includes('error')
      ) {
        context.primaryIndicators.push('debugging-required');
      }
      if (task.includes('design') || task.includes('architect')) {
        context.primaryIndicators.push('architecture-required');
      }
      if (task.includes('review') || task.includes('audit')) {
        context.primaryIndicators.push('review-required');
      }
      if (task.includes('optimize') || task.includes('performance')) {
        context.primaryIndicators.push('optimization-required');
      }
    }

    context.confidence = Math.min(
      0.9,
      (context.signals.length + context.primaryIndicators.length) * 0.15
    );

    return context;
  }

  private async getContextualRecommendations(
    contextAnalysis: ContextAnalysis
  ): Promise<ContextRecommendation[]> {
    // First, try enhanced trigger-based matching
    const allPersonas = this.personaManager.getAllPersonas();
    const triggerMatches: Array<{
      personaId: string;
      triggers: string[];
      score: number;
    }> = [];

    for (const persona of allPersonas) {
      const triggerResult = matchesAdoptionTriggers(persona.id, {
        keywords: [
          ...contextAnalysis.signals,
          ...contextAnalysis.primaryIndicators,
        ],
        files: contextAnalysis.fileContext,
        errors: contextAnalysis.errorMessages,
        task: contextAnalysis.currentTask,
        stage: contextAnalysis.workflowStage,
      });

      if (triggerResult.matches) {
        triggerMatches.push({
          personaId: persona.id,
          triggers: triggerResult.matchedTriggers,
          score: triggerResult.score,
        });
      }
    }

    // Sort trigger matches by score
    triggerMatches.sort((a, b) => b.score - a.score);

    // If we have good trigger matches, use them; otherwise fall back to traditional recommendation
    if (triggerMatches.length > 0 && triggerMatches[0].score > 0.5) {
      return triggerMatches.slice(0, 3).map(match => ({
        personaId: match.personaId,
        confidence: match.score,
        reasoning: `Enhanced trigger match: ${match.triggers.join(', ')}`,
      }));
    }

    // Fallback to traditional recommendation engine
    const task: TaskDescription = {
      title: 'Context-based recommendation',
      description: `Context signals: ${contextAnalysis.signals.join(', ')}. Primary indicators: ${contextAnalysis.primaryIndicators.join(', ')}`,
      keywords: [
        ...contextAnalysis.signals,
        ...contextAnalysis.primaryIndicators,
      ],
    };

    const response = await this.recommendationEngine.processRecommendation({
      task,
      maxRecommendations: 3,
      includeReasoning: true,
    });

    return response.recommendations;
  }

  private generateAdoptionTriggers(
    personaId: string,
    context: ContextAnalysis
  ): string[] {
    const enhancement = getPersonaEnhancement(personaId);
    const triggers: string[] = [];

    // Use enhanced metadata if available
    if (enhancement?.adoptionIncentives?.valueProposition) {
      triggers.push(`💡 ${enhancement.adoptionIncentives.valueProposition}`);
    }

    if (enhancement?.adoptionIncentives?.timeToValue) {
      triggers.push(`⚡ ${enhancement.adoptionIncentives.timeToValue}`);
    }

    // Add context-specific triggers
    if (context.primaryIndicators.includes('debugging-required')) {
      triggers.push('🚨 Error encountered - debugging expertise needed');
    }
    if (context.primaryIndicators.includes('architecture-required')) {
      triggers.push('🏗️ System design decisions required');
    }
    if (context.signals.includes('testing-activity')) {
      triggers.push('🧪 Test files detected - quality assurance focus');
    }

    // Add urgency indicators from enhancement
    if (enhancement?.attractivenessCues?.urgencyIndicators) {
      const urgentMatch = enhancement.attractivenessCues.urgencyIndicators.find(
        indicator =>
          context.primaryIndicators.some((pi: string) => pi.includes(indicator))
      );
      if (urgentMatch) {
        triggers.push(`🔥 URGENT: ${urgentMatch} detected`);
      }
    }

    return triggers;
  }

  private generateSuggestedAction(
    recommendation: ContextRecommendation | undefined,
    _context: ContextAnalysis
  ): string {
    if (!recommendation) {
      return 'Continue with current approach';
    }

    const enhancement = getPersonaEnhancement(recommendation.personaId);
    const confidence = Math.round(recommendation.confidence * 100);

    let action = `🎯 SUGGESTED: Adopt ${recommendation.personaId} persona`;

    if (enhancement?.adoptionIncentives?.difficultyReduction) {
      action += ` | ${enhancement.adoptionIncentives.difficultyReduction}`;
    }

    if (
      enhancement?.attractivenessCues?.confidenceMetrics &&
      enhancement.attractivenessCues.confidenceMetrics.length > 0
    ) {
      action += ` | ${enhancement.attractivenessCues.confidenceMetrics[0]}`;
    }

    action += ` (${confidence}% confidence)`;

    return action;
  }

  private generateAdoptionPrompt(
    personaId: string,
    context: ContextAnalysis
  ): string {
    const enhancement = getPersonaEnhancement(personaId);

    let prompt = `🎯 ADOPT ${personaId.toUpperCase()} PERSONA NOW\n\n`;

    if (enhancement?.adoptionIncentives?.valueProposition) {
      prompt += `💡 VALUE: ${enhancement.adoptionIncentives.valueProposition}\n`;
    }

    if (enhancement?.adoptionIncentives?.timeToValue) {
      prompt += `⚡ SPEED: ${enhancement.adoptionIncentives.timeToValue}\n`;
    }

    if (
      enhancement?.attractivenessCues?.socialProof &&
      enhancement.attractivenessCues.socialProof.length > 0
    ) {
      prompt += `👥 PROOF: ${enhancement.attractivenessCues.socialProof[0]}\n`;
    }

    prompt += `\n🎯 CONTEXT MATCH: ${context.signals.join(', ')}\n`;
    prompt += `🔍 INDICATORS: ${context.primaryIndicators.join(', ')}\n\n`;
    prompt += `Ready to adopt? Use: @adopt-persona-${personaId}`;

    return prompt;
  }

  private analyzeTransition(args: ToolArgs): TransitionAnalysis {
    return {
      currentPersona: args.currentPersona as string | undefined,
      stage: args.workflowStage as string | undefined,
      progress: args.taskProgress as string | undefined,
      encounteredException: args.encounteredException as string | undefined,
      nextPlannedActivity: args.nextPlannedActivity as string | undefined,
      workflowStage: args.workflowStage as string | undefined,
    };
  }

  private async getTransitionSuggestions(
    analysis: TransitionAnalysis
  ): Promise<TransitionSuggestion[]> {
    const suggestions: TransitionSuggestion[] = [];

    // Stage-based suggestions
    if (analysis.stage === 'implementation' && analysis.progress === 'stuck') {
      suggestions.push({
        personaId: 'debugger',
        reasoning:
          'Implementation blockage detected - debugging expertise needed',
        timing: 'immediate',
        action: 'switch-to-debugger',
        confidence: 0.8,
      });
    }

    if (analysis.stage === 'testing' && analysis.currentPersona !== 'tester') {
      suggestions.push({
        personaId: 'tester',
        reasoning: 'Testing phase - specialized testing expertise recommended',
        timing: 'when-convenient',
        action: 'switch-to-tester',
        confidence: 0.9,
      });
    }

    return suggestions;
  }

  private calculateOptimalTransitionTiming(args: ToolArgs): string {
    if (args.taskProgress === 'stuck') {
      return 'immediate';
    }
    if (args.workflowStage === 'testing' || args.workflowStage === 'review') {
      return 'at-stage-completion';
    }
    return 'when-convenient';
  }

  private calculateEffectiveness(args: ToolArgs): EffectivenessData {
    const progressScore = this.mapProgressToScore(args.progressMade as string);
    const satisfactionScore = this.mapSatisfactionToScore(
      args.satisfactionLevel as string
    );
    const durationPenalty = this.calculateDurationPenalty(
      args.sessionDuration as number
    );

    const overallScore = Math.max(
      0,
      Math.min(
        100,
        (progressScore * 0.4 + satisfactionScore * 0.4 - durationPenalty) * 100
      )
    );

    return {
      overallScore: Math.round(overallScore),
      breakdown: {
        progressAlignment: Math.round(progressScore * 100),
        satisfactionAlignment: Math.round(satisfactionScore * 100),
        taskComplexityMatch: 80, // Default value
        timeEfficiency: Math.round((1 - durationPenalty) * 100),
      },
    };
  }

  private mapProgressToScore(progress: string): number {
    const mapping: { [key: string]: number } = {
      none: 0,
      minimal: 0.3,
      good: 0.7,
      excellent: 1.0,
    };
    return mapping[progress] || 0.5;
  }

  private mapSatisfactionToScore(satisfaction: string): number {
    const mapping: { [key: string]: number } = {
      frustrated: 0,
      neutral: 0.5,
      satisfied: 0.8,
      'very-satisfied': 1.0,
    };
    return mapping[satisfaction] || 0.5;
  }

  private calculateDurationPenalty(duration: number): number {
    if (!duration) return 0;
    // Penalty increases after 30 minutes without good progress
    return Math.min(0.3, Math.max(0, (duration - 30) / 60));
  }

  private generateEffectivenessInsights(
    args: ToolArgs,
    effectiveness: EffectivenessData
  ): string[] {
    const insights: string[] = [];

    if (effectiveness.overallScore > 80) {
      insights.push(
        '🌟 Excellent persona-task alignment! Continue with current approach.'
      );
    } else if (effectiveness.overallScore > 60) {
      insights.push('✅ Good effectiveness, but room for optimization.');
    } else {
      insights.push('⚠️ Low effectiveness detected - consider persona change.');
    }

    if (
      args.encounterGaps &&
      Array.isArray(args.encounterGaps) &&
      args.encounterGaps.length > 0
    ) {
      insights.push(
        `🔍 Knowledge gaps identified: ${(args.encounterGaps as string[]).join(', ')}`
      );
    }

    return insights;
  }

  private generateEffectivenessRecommendations(
    args: ToolArgs,
    effectiveness: EffectivenessData
  ): string[] {
    const recommendations: string[] = [];

    if (effectiveness.overallScore < 50) {
      recommendations.push('Consider switching to a different persona');
      recommendations.push('Take a break and reassess the approach');
    }

    if (effectiveness.breakdown.timeEfficiency < 0.6) {
      recommendations.push(
        'Current persona may not be optimal for this task type'
      );
    }

    return recommendations;
  }

  private generateWorkflowAdvice(
    analysis: TransitionAnalysis,
    suggestions: TransitionSuggestion[]
  ): string {
    if (!suggestions.length) {
      return 'Continue with current approach - no transitions recommended at this time.';
    }

    const topSuggestion = suggestions[0];
    const stage = analysis.workflowStage || analysis.stage || 'current';

    return `For ${stage} stage: Consider adopting ${topSuggestion.personaId} persona. ${topSuggestion.reasoning}`;
  }

  private async suggestAlternativePersona(
    args: ToolArgs
  ): Promise<{ personaId: string; reasoning: string } | null> {
    const context = this.analyzeContext(args);
    const recommendations = await this.getContextualRecommendations(context);

    if (recommendations.length > 0) {
      return {
        personaId: recommendations[0].personaId,
        reasoning: recommendations[0].reasoning,
      };
    }

    return null;
  }
}
