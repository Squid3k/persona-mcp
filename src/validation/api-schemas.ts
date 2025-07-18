import { z } from 'zod';

/**
 * Schema for persona recommendation request
 */
export const RecommendRequestSchema = z.object({
  query: z
    .string({
      required_error: 'Query string is required',
      invalid_type_error: 'Query must be a string',
    })
    .min(1, 'Query cannot be empty')
    .max(500, 'Query must be less than 500 characters'),
  limit: z
    .number({
      invalid_type_error: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(10, 'Limit cannot exceed 10')
    .default(3)
    .optional(),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

/**
 * Schema for persona comparison request
 */
export const CompareRequestSchema = z.object({
  persona1: z
    .string({
      required_error: 'persona1 is required',
      invalid_type_error: 'persona1 must be a string',
    })
    .min(1, 'persona1 cannot be empty'),
  persona2: z
    .string({
      required_error: 'persona2 is required',
      invalid_type_error: 'persona2 must be a string',
    })
    .min(1, 'persona2 cannot be empty'),
  context: z
    .string({
      invalid_type_error: 'context must be a string',
    })
    .max(1000, 'context must be less than 1000 characters')
    .default('')
    .optional(),
});

export type CompareRequest = z.infer<typeof CompareRequestSchema>;

/**
 * Schema for persona ID parameter
 */
export const PersonaIdParamSchema = z.object({
  id: z
    .string({
      required_error: 'Persona ID is required',
      invalid_type_error: 'Persona ID must be a string',
    })
    .min(1, 'Persona ID cannot be empty')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Persona ID can only contain letters, numbers, hyphens, and underscores'
    ),
});

export type PersonaIdParam = z.infer<typeof PersonaIdParamSchema>;

/**
 * Schema for common API response structure
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  code: z.string().optional(),
  statusCode: z.number().optional(),
});

/**
 * Schema for pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(20).optional(),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;
