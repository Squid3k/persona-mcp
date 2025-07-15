import { z } from 'zod';

export const TaskDescriptionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  keywords: z.array(z.string().min(1)).optional(),
  context: z.string().optional(),
  domain: z.string().optional(),
  complexity: z.enum(['simple', 'moderate', 'complex', 'expert']).optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export type TaskDescription = z.infer<typeof TaskDescriptionSchema>;

export const PersonaRecommendationSchema = z.object({
  personaId: z.string().min(1),
  score: z.number().min(0).max(1),
  reasoning: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  limitations: z.array(z.string().min(1)).optional(),
  confidence: z.number().min(0).max(1),
});

export type PersonaRecommendation = z.infer<typeof PersonaRecommendationSchema>;

export const RecommendationRequestSchema = z.object({
  task: TaskDescriptionSchema,
  maxRecommendations: z.number().min(1).max(10).optional().default(3),
  includeReasoning: z.boolean().optional().default(true),
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;

export const RecommendationResponseSchema = z.object({
  recommendations: z.array(PersonaRecommendationSchema),
  totalPersonasEvaluated: z.number().min(0),
  processingTimeMs: z.number().min(0),
});

export type RecommendationResponse = z.infer<
  typeof RecommendationResponseSchema
>;

export interface ScoringWeights {
  keywordMatch: number;
  roleAlignment: number;
  expertiseMatch: number;
  contextRelevance: number;
  complexityFit: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  keywordMatch: 0.3,
  roleAlignment: 0.25,
  expertiseMatch: 0.2,
  contextRelevance: 0.15,
  complexityFit: 0.1,
};
