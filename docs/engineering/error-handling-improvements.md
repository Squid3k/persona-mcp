# Error Handling, Validation, and Rate Limiting Improvements

## Overview

This document describes the comprehensive improvements made to error handling, request validation, rate limiting, and testing coverage in the Personas MCP Server.

## 1. Custom Error Types Implementation

### Error Module Structure
```
src/errors/
├── base.ts           # BaseError class with common functionality
├── persona-errors.ts # Persona-specific errors
├── mcp-errors.ts     # MCP protocol errors
├── api-errors.ts     # REST API errors
└── index.ts         # Central exports and error handler
```

### Key Error Types

#### Base Error Class
- Provides consistent error structure with `code`, `statusCode`, and `isOperational` properties
- Supports JSON serialization for API responses
- Maintains proper stack traces

#### Persona Errors
- `PersonaNotFoundError` (404) - When a requested persona doesn't exist
- `InvalidPersonaURIError` (400) - When persona URI format is invalid
- `PersonaValidationError` (422) - When persona validation fails
- `PersonaLoadingError` (500) - When persona file loading fails
- `PersonaConflictError` (409) - When persona conflicts are detected

#### MCP Protocol Errors
- `TransportNotInitializedError` (503) - When transport isn't ready
- `InvalidPromptNameError` (400) - When prompt name format is invalid
- `ServerInitializationError` (500) - When server fails to start
- `ServerShutdownError` (500) - When shutdown encounters errors
- `ToolNotFoundError` (404) - When requested tool doesn't exist

#### API Errors
- `ValidationError` (400) - Request validation failures with detailed field errors
- `MissingParameterError` (400) - Required parameters missing
- `RateLimitError` (429) - Rate limit exceeded with retry-after header
- `InternalServerError` (500) - Non-operational server errors

## 2. Request Validation Implementation

### Validation Schemas
```typescript
// src/validation/api-schemas.ts
export const RecommendRequestSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().positive().max(10).default(3).optional(),
});

export const CompareRequestSchema = z.object({
  persona1: z.string().min(1),
  persona2: z.string().min(1),
  context: z.string().max(1000).default('').optional(),
});

export const PersonaIdParamSchema = z.object({
  id: z.string().min(1).regex(/^[a-zA-Z0-9-_]+$/),
});
```

### Validation Middleware
- `validateRequest()` - Validates request body
- `validateParams()` - Validates URL parameters
- `validateQuery()` - Validates query parameters with type coercion
- `validate()` - Combined validation for all request parts

### Applied Endpoints
- `GET /api/personas/:id` - Validates persona ID parameter
- `POST /api/recommend` - Validates query and limit
- `POST /api/compare` - Validates persona IDs and context

## 3. Rate Limiting Implementation

### Rate Limiter Types
```typescript
// General API limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Recommendation limiter - 10 requests per minute
export const recommendLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
});

// Compute-intensive limiter - 5 requests per 5 minutes
export const computeIntensiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
});
```

### Features
- Custom error handling with `RateLimitError`
- Standard rate limit headers (RateLimit-*)
- IP-based limiting with proxy support
- Configurable limits per endpoint type

### Applied To
- All `/api/*` routes get general rate limiting
- `/api/recommend` and `/api/compare` get stricter limits

## 4. Enhanced CLI Testing

### New Test Files
```
test/cli/
├── cli.test.ts          # Main CLI functionality tests
├── error-paths.test.ts  # Error scenario coverage
└── fixtures/            # Test configuration files
```

### Test Coverage Areas
- Version and help flag handling
- Configuration parsing and validation
- Server lifecycle (start, shutdown, signals)
- Error handling (port conflicts, invalid config)
- Network errors and timeouts
- File system permission errors

### Key Test Scenarios
1. **Signal Handling**: SIGINT and SIGTERM graceful shutdown
2. **Port Conflicts**: Proper error when port is in use
3. **Invalid Configuration**: Handling malformed config files
4. **Shutdown Errors**: Graceful handling of shutdown failures
5. **Network Binding**: Errors with invalid host/port

## 5. Error Type Testing

### Test Structure
```
test/errors/
├── error-types.test.ts    # Unit tests for all error types
└── server-errors.test.ts  # Integration tests for error handling
```

### Coverage Areas
- All custom error types and their properties
- Error serialization to JSON
- Stack trace preservation
- Type guards (`isOperationalError`)
- Express error handler middleware
- Development vs production error responses

## 6. Migration Guide

### Before (Generic Errors)
```typescript
if (!persona) {
  throw new Error(`Persona not found: ${personaId}`);
}
```

### After (Custom Errors)
```typescript
if (!persona) {
  throw new PersonaNotFoundError(personaId);
}
```

### Express Route Updates
```typescript
// Before
app.post('/api/recommend', async (req, res) => {
  try {
    const body = req.body as { query?: unknown };
    if (!body.query || typeof body.query !== 'string') {
      return res.status(400).json({ error: 'Query required' });
    }
    // ... handle request
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// After
app.post('/api/recommend', 
  recommendLimiter,
  validateRequest(RecommendRequestSchema), 
  async (req, res, next) => {
    try {
      const { query, limit } = req.body;
      // ... handle request
    } catch (error) {
      next(error); // Error handler middleware handles response
    }
  }
);
```

## 7. Installation Requirements

### New Dependencies
```bash
npm install express-rate-limit
```

### Existing Dependencies Used
- `zod` - For schema validation
- `express` - For middleware support
- `vitest` - For testing

## 8. Benefits

### For Users
- **Clear Error Messages**: Specific error codes and messages
- **Validation Feedback**: Detailed field-level validation errors
- **Rate Limit Protection**: Prevents API abuse
- **Better Reliability**: Graceful error handling

### For Developers
- **Type Safety**: TypeScript support for all errors
- **Consistent Patterns**: Standardized error handling
- **Easy Testing**: Specific error types to assert against
- **Better Debugging**: Error codes and operational flags

## 9. Future Enhancements

1. **Internationalization**: Add multi-language error messages
2. **Error Tracking**: Integration with error monitoring services
3. **Advanced Rate Limiting**: Per-user limits with authentication
4. **WebSocket Errors**: Extend to cover WebSocket connections
5. **Retry Logic**: Automatic retry for transient errors

## 10. Testing the Implementation

### Run Tests
```bash
# Run all tests including new error and CLI tests
npm test

# Run with coverage to see improvements
npm run test:coverage

# Run specific test suites
npm test test/errors
npm test test/cli
```

### Manual Testing
```bash
# Test rate limiting
for i in {1..15}; do curl -X POST http://localhost:3000/api/recommend -H "Content-Type: application/json" -d '{"query":"test"}'; done

# Test validation errors
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":"", "limit": "invalid"}'

# Test error responses
curl http://localhost:3000/api/personas/non-existent-persona
```

## Conclusion

These improvements significantly enhance the robustness, security, and maintainability of the Personas MCP Server. The combination of custom error types, request validation, rate limiting, and comprehensive testing provides a solid foundation for production deployment.