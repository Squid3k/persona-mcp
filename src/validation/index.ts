/**
 * Central export point for validation schemas and middleware
 */

// Export all schemas
export {
  RecommendRequestSchema,
  CompareRequestSchema,
  PersonaIdParamSchema,
  ApiResponseSchema,
  PaginationSchema,
  type RecommendRequest,
  type CompareRequest,
  type PersonaIdParam,
  type PaginationParams,
} from './api-schemas.js';

// Export validation middleware
export {
  validateRequest,
  validateParams,
  validateQuery,
  validate,
  type ValidationSchemas,
} from './middleware.js';