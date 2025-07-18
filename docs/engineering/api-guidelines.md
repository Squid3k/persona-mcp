# API Design Guidelines

## Overview

This document establishes API design principles and guidelines for the Personas MCP Server to ensure consistency, usability, and maintainability.

## Core Principles

### 1. Consistency

- Uniform naming conventions
- Predictable behavior patterns
- Standard response formats

### 2. Simplicity

- Intuitive interfaces
- Minimal required parameters
- Clear documentation

### 3. Extensibility

- Forward compatibility
- Version management
- Graceful deprecation

### 4. Error Handling

- Informative error messages
- Consistent error formats
- Actionable feedback

## MCP Tool Design

### Tool Naming

```typescript
// Good: Verb-noun format, kebab-case
'recommend-persona';
'explain-persona-fit';
'compare-personas';

// Bad: Inconsistent naming
'getRecommendation';
'persona_explain';
'COMPARE';
```

### Parameter Design

```typescript
interface ToolParameters {
  // Required parameters first
  title: string; // Always required
  description: string; // Always required

  // Optional parameters with defaults
  keywords?: string[]; // Optional array
  complexity?: Complexity; // Optional enum
  maxResults?: number; // Optional with default
}
```

### Response Structure

```typescript
// Success response
{
  "success": true,
  "data": {
    // Tool-specific data
  },
  "metadata": {
    "processingTimeMs": 45,
    "version": "1.0.0"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title",
      "provided": null
    }
  }
}
```

## Input Validation

### Schema Definition

```typescript
import { z } from 'zod';

// Define clear schemas
export const TaskDescriptionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  keywords: z.array(z.string()).max(20).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex', 'expert']).optional(),
});

// Validate at entry point
function validateInput<T>(schema: z.Schema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    throw new ValidationError(formatZodError(error));
  }
}
```

### Validation Rules

1. **String Length**: Define min/max for all strings
2. **Array Limits**: Set maximum array sizes
3. **Enum Values**: Use strict enums for categories
4. **Number Ranges**: Define valid ranges
5. **Required Fields**: Clearly mark required fields

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Not found errors (404)
  PERSONA_NOT_FOUND = 'PERSONA_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}
```

### Error Messages

```typescript
// Good: Specific and actionable
'Title must be between 1 and 200 characters';
"Persona 'architect' not found. Available personas: developer, reviewer";

// Bad: Vague or technical
'Invalid input';
'Error: undefined is not a string';
```

## Versioning

### API Version Strategy

```typescript
// Version in response metadata
{
  "data": { /* ... */ },
  "metadata": {
    "version": "1.2.0",
    "deprecated": ["feature-x"]
  }
}

// Version in headers
"X-API-Version": "1.2.0"
"X-Deprecation-Warning": "Tool 'old-tool' will be removed in v2.0.0"
```

### Breaking Changes

1. **Major Version**: Breaking changes
2. **Minor Version**: New features, backward compatible
3. **Patch Version**: Bug fixes only

### Deprecation Process

```typescript
// 1. Add deprecation warning
{
  "warning": "This tool will be deprecated in v2.0.0. Use 'new-tool' instead."
}

// 2. Support both old and new for one major version
// 3. Remove in next major version
```

## Performance Guidelines

### Response Time Targets

- **Simple queries**: < 100ms
- **Complex analysis**: < 500ms
- **Batch operations**: < 2000ms

### Optimization Strategies

```typescript
// 1. Implement caching
const cache = new Map<string, CachedResult>();

// 2. Use pagination for large results
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// 3. Provide field selection
interface QueryOptions {
  fields?: string[]; // Return only specified fields
  include?: string[]; // Include related data
}
```

## Documentation Standards

### Tool Documentation

````typescript
/**
 * Recommends the best personas for a given task
 *
 * @param title - Brief task description (required)
 * @param description - Detailed task description (required)
 * @param keywords - Related keywords (optional)
 * @param complexity - Task complexity level (optional)
 *
 * @returns PersonaRecommendations with scores and reasoning
 *
 * @example
 * ```json
 * {
 *   "title": "Design REST API",
 *   "description": "Create a RESTful API with authentication"
 * }
 * ```
 */
````

### API Examples

Always provide:

1. **Minimal example**: Required fields only
2. **Full example**: All fields populated
3. **Error example**: Common error case
4. **Response example**: Expected output

## Security Guidelines

### Input Sanitization

```typescript
// Sanitize user input
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, MAX_LENGTH); // Enforce length limits
}
```

### Rate Limiting

```typescript
interface RateLimitConfig {
  windowMs: number;      // Time window
  maxRequests: number;   // Max requests per window
  keyGenerator: (req: Request) => string; // Identify client
}

// Headers
"X-RateLimit-Limit": "100"
"X-RateLimit-Remaining": "95"
"X-RateLimit-Reset": "1625097600"
```

### Authentication (Future)

```typescript
// Bearer token authentication
headers: {
  "Authorization": "Bearer <token>"
}

// API key authentication
headers: {
  "X-API-Key": "<api-key>"
}
```

## Testing Requirements

### API Contract Testing

```typescript
describe('API Contract', () => {
  it('should match documented schema', async () => {
    const response = await callTool('recommend-persona', testInput);
    expect(response).toMatchSchema(RecommendationResponseSchema);
  });
});
```

### Integration Testing

```typescript
describe('Tool Integration', () => {
  it('should handle all documented parameters', async () => {
    const allParams = {
      title: 'Test',
      description: 'Test description',
      keywords: ['test'],
      complexity: 'moderate',
      // ... all optional params
    };

    const response = await callTool('recommend-persona', allParams);
    expect(response.success).toBe(true);
  });
});
```

## Best Practices

### 1. Idempotency

- GET requests always idempotent
- Tool calls with same input return same output

### 2. Null Handling

```typescript
// Prefer empty arrays over null
recommendations: []; // Not null

// Omit optional fields rather than null
{
  title: 'Test';
} // Not { title: "Test", keywords: null }
```

### 3. Enumeration Values

```typescript
// Use lowercase with underscores
complexity: 'very_complex'; // Not "VeryComplex" or "very-complex"

// Provide all valid values in error
('Invalid complexity. Must be one of: simple, moderate, complex, expert');
```

### 4. Timestamps

```typescript
// Always use ISO 8601
timestamp: '2025-07-15T10:30:00Z';

// Include timezone
createdAt: '2025-07-15T10:30:00-07:00';
```

### 5. Pagination

```typescript
// Consistent pagination parameters
{
  page: 1,        // 1-based, not 0-based
  pageSize: 20,   // Default size
  sort: "score",  // Sort field
  order: "desc"   // Sort order
}
```

## Evolution Guidelines

### Adding New Tools

1. **Propose**: Create design document
2. **Review**: API design review
3. **Implement**: Following guidelines
4. **Document**: Complete documentation
5. **Test**: Comprehensive testing
6. **Release**: With version bump

### Modifying Existing Tools

1. **Backward Compatible**: Add optional parameters
2. **Deprecation**: Mark old features
3. **Migration Guide**: Help users update
4. **Grace Period**: Support both versions
5. **Remove**: In major version only
