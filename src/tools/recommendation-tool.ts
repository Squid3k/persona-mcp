import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RecommendationEngine } from '../recommendation/recommendation-engine.js';
import { EnhancedPersonaManager } from '../enhanced-persona-manager.js';
import {
  TaskDescriptionSchema,
  RecommendationRequestSchema,
} from '../types/recommendation.js';

interface ToolArgs {
  [key: string]: unknown;
}

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
          'Recommends the best personas for a given task description',
        inputSchema: {
          type: 'object',
          properties: {
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
              description:
                'The domain or area of the task (e.g., web development, data science)',
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
            maxRecommendations: {
              type: 'number',
              minimum: 1,
              maximum: 10,
              description:
                'Maximum number of persona recommendations to return (default: 3)',
            },
            includeReasoning: {
              type: 'boolean',
              description:
                'Whether to include reasoning for recommendations (default: true)',
            },
          },
          required: ['title', 'description'],
        },
      },
      {
        name: 'explain-persona-fit',
        description: 'Explains why a specific persona is suitable for a task',
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
        description: 'Compares multiple personas for the same task',
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
        description: 'Gets statistics about the recommendation system',
        inputSchema: {
          type: 'object',
          properties: {},
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
      default:
        throw new Error(`Unknown tool: ${name}`);
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
            description: explanation.persona.description,
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
}
