# Migration Checklist for Error Handling Improvements

## Prerequisites

- [ ] Install required dependency:
  ```bash
  npm install express-rate-limit
  ```

## Code Changes Applied

### 1. Error Handling ✅

- [x] Created `src/errors/` module with custom error types
- [x] Replaced all generic `throw new Error()` statements with specific error types
- [x] Added error handler middleware to Express app
- [x] Updated error responses to use consistent JSON format

### 2. Request Validation ✅

- [x] Created `src/validation/` module with Zod schemas
- [x] Added validation middleware for request body, params, and query
- [x] Applied validation to all REST API endpoints:
  - [x] `GET /api/personas/:id` - PersonaIdParamSchema
  - [x] `POST /api/recommend` - RecommendRequestSchema
  - [x] `POST /api/compare` - CompareRequestSchema

### 3. Rate Limiting ✅

- [x] Created `src/middleware/rate-limit.ts` with rate limiters
- [x] Applied general rate limiting to all `/api/*` routes
- [x] Applied stricter rate limiting to recommendation endpoints
- [x] Integrated custom RateLimitError with error handler

### 4. Testing ✅

- [x] Added comprehensive CLI tests in `test/cli/`
- [x] Added error type unit tests in `test/errors/`
- [x] Updated existing tests to expect new error types
- [x] Achieved higher test coverage for CLI module

## Breaking Changes

### API Response Format

Previous error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

New error responses:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error message",
  "statusCode": 400,
  "validationErrors": [...] // For validation errors
}
```

### Error Types

- Custom errors now thrown instead of generic `Error`
- Error handler middleware required for proper error responses
- All route handlers must use `next(error)` instead of sending error responses directly

## Verification Steps

1. **Run Tests**

   ```bash
   npm test
   npm run test:coverage
   ```

2. **Test Error Responses**

   ```bash
   # Should return 404 with PersonaNotFoundError
   curl http://localhost:3000/api/personas/non-existent

   # Should return 400 with ValidationError
   curl -X POST http://localhost:3000/api/recommend \
     -H "Content-Type: application/json" \
     -d '{"query": ""}'
   ```

3. **Test Rate Limiting**

   ```bash
   # Should eventually return 429 RateLimitError
   for i in {1..15}; do
     curl -X POST http://localhost:3000/api/recommend \
       -H "Content-Type: application/json" \
       -d '{"query": "test"}'
   done
   ```

4. **Test CLI Error Handling**
   ```bash
   # Should handle port conflict gracefully
   node dist/index.js --port 80  # Permission denied
   node dist/index.js --port invalid  # Invalid port
   ```

## Rollback Plan

If issues arise:

1. **Revert Error Handling**
   - Remove `src/errors/` directory
   - Revert changes in `src/server.ts` and other files
   - Remove error handler middleware

2. **Revert Validation**
   - Remove `src/validation/` directory
   - Remove validation middleware from routes

3. **Revert Rate Limiting**
   - Remove `src/middleware/rate-limit.ts`
   - Remove rate limiting middleware from routes
   - Uninstall express-rate-limit if needed

## Notes

- All changes are backward compatible for MCP protocol
- REST API clients may need updates for new error format
- Rate limits can be adjusted in `src/middleware/rate-limit.ts`
- Validation schemas can be customized in `src/validation/api-schemas.ts`
