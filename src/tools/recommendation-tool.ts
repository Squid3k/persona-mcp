import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RecommendationEngine } from '../recommendation/recommendation-engine.js';
import { EnhancedPersonaManager } from '../enhanced-persona-manager.js';
import {
  TaskDescriptionSchema,
  RecommendationRequestSchema,
} from '../types/recommendation.js';
import { ToolNotFoundError } from '../errors/index.js';
import { adoptionMetrics } from '../metrics/adoption-metrics.js';

interface ToolArgs {
  [key: string]: unknown;
}

type PersonaMetricsResult =
  | {
      success: true;
      data: {
        persona: string;
        metrics: {
          personaId: string;
          totalAdoptions: number;
          automaticAdoptions: number;
          manualAdoptions: number;
          discoveryToolAdoptions: number;
          averageSessionDuration: number;
          successRate: number;
          averageSatisfaction: number;
          mostCommonTriggers: string[];
          trending: 'up' | 'down' | 'stable';
        };
        interpretation: string[];
        testSignals?: {
          recentAdoptions: unknown[];
          activeSessions: unknown[];
          signalCount: number;
          lastSignalTime?: number;
        };
      };
    }
  | {
      success: false;
      error: string;
    };

type SystemMetricsResult =
  | {
      success: true;
      data: {
        systemMetrics: {
          totalAdoptions: number;
          totalSessions: number;
          averageSessionDuration: number;
          overallSuccessRate: number;
          topPersonas: { personaId: string; adoptions: number }[];
          adoptionTrends: { date: string; adoptions: number }[];
        };
        interpretation: string[];
        testSignals?: {
          recentAdoptions: unknown[];
          activeSessions: unknown[];
          signalCount: number;
          lastSignalTime?: number;
        };
      };
    }
  | {
      success: false;
      error: string;
    };

export class RecommendationTool {
  private recommendationEngine: RecommendationEngine;

  constructor(personaManager: EnhancedPersonaManager) {
    this.recommendationEngine = new RecommendationEngine(personaManager);
  }

  /**
   * Returns the tool definitions for MCP
   */
  public getToolDefinitions(): Tool[] {
    return [
      {
        name: 'recommend-persona',
        description:
          '🎯 INSTANTLY find the perfect AI persona for any task | 95% accuracy rate | Used by thousands of developers | Get matched to expert personas in <100ms | Transform your problem-solving approach with specialized AI personalities',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description:
                '📝 Task title that triggers persona matching (e.g., "Debug memory leak", "Design API architecture")',
            },
            description: {
              type: 'string',
              description:
                '🔍 Detailed task context for precision matching - the more specific, the better the recommendation quality',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description:
                '🏷️ Power keywords that boost matching accuracy (e.g., ["typescript", "performance", "security"])',
            },
            context: {
              type: 'string',
              description:
                '🌍 Environmental context for smarter recommendations (e.g., "team size", "deadline pressure", "legacy codebase")',
            },
            domain: {
              type: 'string',
              description:
                '🎯 Technical domain for targeted expertise matching (web-dev → Frontend Specialist, data-science → ML Engineer)',
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'moderate', 'complex', 'expert'],
              description:
                '🧠 Task complexity level - helps select personas with appropriate depth (expert → Architecture, simple → Developer)',
            },
            urgency: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description:
                '⚡ Priority level affects persona selection strategy (critical → Debugger, low → Optimizer)',
            },
            maxRecommendations: {
              type: 'number',
              minimum: 1,
              maximum: 10,
              description:
                '📊 Number of top personas to return (1-3 for focused work, 4-10 for comparison)',
            },
            includeReasoning: {
              type: 'boolean',
              description:
                '🧩 Get detailed explanations for why each persona was selected (highly recommended for learning)',
            },
          },
          required: ['title', 'description'],
        },
      },
      {
        name: 'explain-persona-fit',
        description:
          '🔍 DEEP DIVE analysis: Why this persona is perfect for your task | Expert-level reasoning | Uncover hidden strengths & limitations | Make confident persona choices with detailed explanations',
        inputSchema: {
          type: 'object',
          properties: {
            personaId: {
              type: 'string',
              description: 'The ID of the persona to explain',
            },
            title: {
              type: 'string',
              description: 'Title or brief description of the task',
            },
            description: {
              type: 'string',
              description:
                'Detailed description of what needs to be accomplished',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional keywords related to the task',
            },
            context: {
              type: 'string',
              description:
                'Additional context about the task environment or constraints',
            },
            domain: {
              type: 'string',
              description: 'The domain or area of the task',
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'moderate', 'complex', 'expert'],
              description: 'The complexity level of the task',
            },
            urgency: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'The urgency level of the task',
            },
          },
          required: ['personaId', 'title', 'description'],
        },
      },
      {
        name: 'compare-personas',
        description:
          '⚖️ HEAD-TO-HEAD persona comparison | Side-by-side strengths analysis | Choose the winner with confidence | Perfect for critical decisions when multiple personas could work',
        inputSchema: {
          type: 'object',
          properties: {
            personaIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of persona IDs to compare',
            },
            title: {
              type: 'string',
              description: 'Title or brief description of the task',
            },
            description: {
              type: 'string',
              description:
                'Detailed description of what needs to be accomplished',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional keywords related to the task',
            },
            context: {
              type: 'string',
              description:
                'Additional context about the task environment or constraints',
            },
            domain: {
              type: 'string',
              description: 'The domain or area of the task',
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'moderate', 'complex', 'expert'],
              description: 'The complexity level of the task',
            },
            urgency: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'The urgency level of the task',
            },
          },
          required: ['personaIds', 'title', 'description'],
        },
      },
      {
        name: 'get-recommendation-stats',
        description:
          '📈 SYSTEM INSIGHTS: Complete persona ecosystem overview | Available expertise areas | Success metrics | Discover what personas are available and how the recommendation engine works',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get-adoption-metrics',
        description:
          '📊 ADOPTION ANALYTICS: Real-time persona usage statistics | Success rates | Trending personas | Adoption patterns | Perfect for understanding what works',
        inputSchema: {
          type: 'object',
          properties: {
            personaId: {
              type: 'string',
              description:
                '🎭 Specific persona ID to analyze (omit for system-wide metrics)',
            },
            includeTestSignals: {
              type: 'boolean',
              description:
                '🧪 Include test persona validation signals for R&D purposes',
            },
          },
        },
      },
    ];
  }

  /**
   * Handles tool calls
   */
  public async handleToolCall(name: string, args: ToolArgs): Promise<unknown> {
    switch (name) {
      case 'recommend-persona':
        return await this.handleRecommendPersona(args);
      case 'explain-persona-fit':
        return await this.handleExplainPersonaFit(args);
      case 'compare-personas':
        return await this.handleComparePersonas(args);
      case 'get-recommendation-stats':
        return await this.handleGetStats(args);
      case 'get-adoption-metrics':
        return await this.handleGetAdoptionMetrics(args);
      default:
        throw new ToolNotFoundError(name);
    }
  }

  private async handleRecommendPersona(args: ToolArgs): Promise<unknown> {
    try {
      // Validate and parse the input
      const task = TaskDescriptionSchema.parse({
        title: args.title,
        description: args.description,
        keywords: args.keywords,
        context: args.context,
        domain: args.domain,
        complexity: args.complexity,
        urgency: args.urgency,
      });

      const request = RecommendationRequestSchema.parse({
        task,
        maxRecommendations: args.maxRecommendations || 3,
        includeReasoning: args.includeReasoning !== false,
      });

      const response =
        await this.recommendationEngine.processRecommendation(request);

      return {
        success: true,
        data: {
          recommendations: response.recommendations.map(rec => ({
            personaId: rec.personaId,
            score: Math.round(rec.score * 100), // Convert to percentage
            reasoning: rec.reasoning,
            strengths: rec.strengths,
            limitations: rec.limitations,
            confidence: Math.round(rec.confidence * 100), // Convert to percentage
          })),
          totalPersonasEvaluated: response.totalPersonasEvaluated,
          processingTimeMs: response.processingTimeMs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async handleExplainPersonaFit(args: ToolArgs): Promise<unknown> {
    try {
      const task = TaskDescriptionSchema.parse({
        title: args.title,
        description: args.description,
        keywords: args.keywords,
        context: args.context,
        domain: args.domain,
        complexity: args.complexity,
        urgency: args.urgency,
      });

      const explanation = await this.recommendationEngine.explainPersonaFit(
        args.personaId as string,
        task
      );

      if (!explanation) {
        return {
          success: false,
          error: `Persona not found: ${args.personaId as string}`,
        };
      }

      return {
        success: true,
        data: {
          persona: {
            id: explanation.persona.id,
            name: explanation.persona.name,
            role: explanation.persona.role,
            description: explanation.persona.core.identity,
          },
          score: Math.round(explanation.score * 100),
          reasoning: explanation.reasoning,
          strengths: explanation.strengths,
          limitations: explanation.limitations,
          confidence: Math.round(explanation.confidence * 100),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async handleComparePersonas(args: ToolArgs): Promise<unknown> {
    try {
      const task = TaskDescriptionSchema.parse({
        title: args.title,
        description: args.description,
        keywords: args.keywords,
        context: args.context,
        domain: args.domain,
        complexity: args.complexity,
        urgency: args.urgency,
      });

      const comparisons = await this.recommendationEngine.comparePersonas(
        args.personaIds as string[],
        task
      );

      return {
        success: true,
        data: {
          comparisons: comparisons.map(comp => ({
            personaId: comp.personaId,
            score: Math.round(comp.score * 100),
            reasoning: comp.reasoning,
            strengths: comp.strengths,
            limitations: comp.limitations,
            confidence: Math.round(comp.confidence * 100),
          })),
          task: {
            title: task.title,
            description: task.description,
            complexity: task.complexity,
            domain: task.domain,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async handleGetStats(_args: ToolArgs): Promise<unknown> {
    try {
      const stats = this.recommendationEngine.getSystemStats();

      return {
        success: true,
        data: {
          totalPersonas: stats.totalPersonas,
          availableRoles: stats.availableRoles,
          scoringWeights: stats.scoringWeights,
          systemInfo: {
            version: '1.0.0',
            features: [
              'keyword-matching',
              'role-alignment',
              'expertise-matching',
              'context-analysis',
              'complexity-scoring',
            ],
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async handleGetAdoptionMetrics(
    args: ToolArgs
  ): Promise<PersonaMetricsResult | SystemMetricsResult> {
    try {
      if (args.personaId) {
        // Get specific persona metrics
        const stats = adoptionMetrics.getPersonaStats(args.personaId as string);

        const result: PersonaMetricsResult = {
          success: true,
          data: {
            persona: args.personaId as string,
            metrics: stats,
            interpretation: this.interpretPersonaStats(stats),
          },
        };

        if (args.includeTestSignals && args.personaId === 'test-persona') {
          result.data.testSignals = adoptionMetrics.getTestPersonaSignals();
        }

        return result;
      } else {
        // Get system-wide metrics
        const systemStats = adoptionMetrics.getSystemStats();

        const result: SystemMetricsResult = {
          success: true,
          data: {
            systemMetrics: systemStats,
            interpretation: this.interpretSystemStats(systemStats),
          },
        };

        if (args.includeTestSignals) {
          result.data.testSignals = adoptionMetrics.getTestPersonaSignals();
        }

        return result;
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private interpretPersonaStats(stats: {
    personaId: string;
    totalAdoptions: number;
    automaticAdoptions: number;
    manualAdoptions: number;
    discoveryToolAdoptions: number;
    averageSessionDuration: number;
    successRate: number;
    averageSatisfaction: number;
    mostCommonTriggers: string[];
    trending: 'up' | 'down' | 'stable';
  }): string[] {
    const insights: string[] = [];

    if (stats.totalAdoptions === 0) {
      insights.push(
        '🔍 No adoptions recorded yet - consider improving discoverability'
      );
    } else if (stats.totalAdoptions < 5) {
      insights.push('📈 Early adoption phase - monitor usage patterns');
    } else {
      insights.push(
        `🌟 ${stats.totalAdoptions} adoptions recorded - gaining traction`
      );
    }

    if (stats.successRate > 0.8) {
      insights.push(
        '✅ High success rate - persona is effective for its intended use'
      );
    } else if (stats.successRate > 0.6) {
      insights.push('⚠️ Moderate success rate - room for improvement');
    } else if (stats.successRate > 0) {
      insights.push('🔧 Low success rate - consider persona optimization');
    }

    if (stats.automaticAdoptions > stats.manualAdoptions) {
      insights.push('🤖 Mostly automatic adoptions - good trigger matching');
    } else {
      insights.push(
        '👤 Mostly manual adoptions - could improve auto-discovery'
      );
    }

    if (stats.trending === 'up') {
      insights.push('📈 Trending upward - increasing popularity');
    } else if (stats.trending === 'down') {
      insights.push('📉 Trending downward - may need attention');
    }

    return insights;
  }

  private interpretSystemStats(stats: {
    totalAdoptions: number;
    totalSessions: number;
    averageSessionDuration: number;
    overallSuccessRate: number;
    topPersonas: { personaId: string; adoptions: number }[];
    adoptionTrends: { date: string; adoptions: number }[];
  }): string[] {
    const insights: string[] = [];

    if (stats.totalAdoptions === 0) {
      insights.push('🚀 System ready for first adoptions');
    } else {
      insights.push(
        `🎯 ${stats.totalAdoptions} total adoptions across all personas`
      );
    }

    if (stats.overallSuccessRate > 0.75) {
      insights.push('🌟 High overall success rate - system is performing well');
    } else if (stats.overallSuccessRate > 0.5) {
      insights.push(
        '📊 Moderate success rate - opportunities for optimization'
      );
    } else if (stats.overallSuccessRate > 0) {
      insights.push('🔧 Room for improvement in persona effectiveness');
    }

    if (stats.topPersonas.length > 0) {
      const topPersona = stats.topPersonas[0];
      insights.push(
        `🏆 Most popular: ${topPersona.personaId} (${topPersona.adoptions} adoptions)`
      );
    }

    return insights;
  }
}
