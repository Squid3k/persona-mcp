# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Personas MCP Server, targeting 100% coverage per engineering requirements.

## Testing Philosophy

### Core Principles

1. **Test-First Development**: Write tests before implementation
2. **100% Coverage Goal**: All code paths must be tested
3. **Fast Feedback**: Tests should run quickly
4. **Isolation**: Tests should not depend on external services
5. **Clarity**: Test names should describe behavior

## Test Structure

```
test/
├── unit/                    # Unit tests for individual components
│   ├── recommendation/      # Recommendation system tests
│   ├── personas/           # Persona management tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests
│   ├── mcp/               # MCP protocol tests
│   └── server/            # Server integration tests
├── e2e/                   # End-to-end tests
│   ├── recommendation-system.e2e.test.ts
│   └── server.e2e.test.ts
├── fixtures/              # Test data and mocks
└── helpers/               # Test utilities
```

## Testing Levels

### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Coverage Target**: 100% of business logic

**Example**:

```typescript
describe('PersonaScorer', () => {
  it('should score persona between 0 and 1', () => {
    const scorer = new PersonaScorer();
    const score = scorer.scorePersona(persona, task);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

**What to Test**:

- Pure functions
- Class methods
- Edge cases
- Error conditions
- State changes

### 2. Integration Tests

**Purpose**: Test component interactions

**Coverage Target**: All integration points

**Example**:

```typescript
describe('RecommendationEngine Integration', () => {
  it('should integrate with PersonaManager', async () => {
    const manager = new PersonaManager();
    const engine = new RecommendationEngine(manager);
    const result = await engine.processRecommendation(request);
    expect(result.recommendations).toHaveLength(3);
  });
});
```

**What to Test**:

- Service interactions
- Database operations
- File system operations
- External API calls (mocked)

### 3. End-to-End Tests

**Purpose**: Test complete user workflows

**Coverage Target**: Critical user paths

**Example**:

```typescript
describe('Recommendation System E2E', () => {
  it('should recommend architect for system design', async () => {
    const server = new PersonasMcpServer();
    await server.initialize();

    const result = await recommendationTool.handleToolCall(
      'recommend-persona',
      {
        title: 'Design microservices',
        description: 'Design scalable microservices',
        complexity: 'complex',
      }
    );

    expect(result.data.recommendations[0].personaId).toBe('architect');
  });
});
```

## Test Patterns

### 1. Arrange-Act-Assert (AAA)

```typescript
it('should calculate correct score', () => {
  // Arrange
  const scorer = new PersonaScorer();
  const persona = createTestPersona();
  const task = createTestTask();

  // Act
  const score = scorer.scorePersona(persona, task);

  // Assert
  expect(score).toBe(0.75);
});
```

### 2. Given-When-Then (BDD)

```typescript
describe('PersonaRecommendation', () => {
  describe('given a complex architecture task', () => {
    describe('when requesting recommendations', () => {
      it('then should recommend architect persona first', () => {
        // Test implementation
      });
    });
  });
});
```

### 3. Test Data Builders

```typescript
class PersonaBuilder {
  private persona: Partial<Persona> = {};

  withRole(role: string): this {
    this.persona.role = role;
    return this;
  }

  withExpertise(expertise: string[]): this {
    this.persona.expertise = expertise;
    return this;
  }

  build(): Persona {
    return {
      id: 'test',
      name: 'Test Persona',
      ...this.persona,
    } as Persona;
  }
}
```

## Mocking Strategy

### 1. Module Mocks

```typescript
vi.mock('../persona-manager.js', () => ({
  PersonaManager: vi.fn().mockImplementation(() => ({
    getAllPersonas: vi.fn().mockReturnValue([]),
    getPersona: vi.fn(),
  })),
}));
```

### 2. Spy Functions

```typescript
it('should call scorer for each persona', () => {
  const scoreSpy = vi.spyOn(scorer, 'scorePersona');
  engine.processRecommendation(request);
  expect(scoreSpy).toHaveBeenCalledTimes(4);
});
```

### 3. Stub External Services

```typescript
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'mocked' }),
    })
  );
});
```

## Coverage Requirements

### Metrics

```bash
# Coverage thresholds in vitest.config.ts
coverageThreshold: {
  global: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  }
}
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Excluding from Coverage

Only exclude if absolutely necessary:

```typescript
/* istanbul ignore next -- defensive code */
if (process.env.NODE_ENV === 'production') {
  // Production-only code
}
```

## Test Fixtures

### Static Fixtures

```typescript
// test/fixtures/personas.ts
export const testPersonas: Persona[] = [
  {
    id: 'test-architect',
    name: 'Test Architect',
    role: 'architect',
    // ...
  },
];
```

### Dynamic Fixtures

```typescript
// test/fixtures/generators.ts
export function generateTask(overrides?: Partial<Task>): Task {
  return {
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    keywords: faker.lorem.words(3).split(' '),
    ...overrides,
  };
}
```

## Performance Testing

### Benchmark Tests

```typescript
import { bench, describe } from 'vitest';

describe('Performance', () => {
  bench('scorePersona', () => {
    scorer.scorePersona(persona, task);
  });

  bench('processRecommendation', async () => {
    await engine.processRecommendation(request);
  });
});
```

### Load Testing

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array(100)
    .fill(null)
    .map(() => engine.processRecommendation(request));

  const start = Date.now();
  await Promise.all(requests);
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(1000); // Under 1 second
});
```

## Error Testing

### Expected Errors

```typescript
it('should throw ValidationError for invalid input', () => {
  expect(() => scorer.scorePersona(null, task)).toThrow(ValidationError);
});
```

### Error Messages

```typescript
it('should provide helpful error message', () => {
  try {
    engine.processRecommendation(invalidRequest);
  } catch (error) {
    expect(error.message).toContain('title is required');
  }
});
```

## Continuous Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## Test Maintenance

### Regular Tasks

1. **Weekly**: Review failing tests
2. **Monthly**: Update test dependencies
3. **Quarterly**: Refactor test suites
4. **Yearly**: Audit test strategy

### Test Quality Metrics

- **Execution Time**: < 30 seconds for unit tests
- **Flakiness**: 0% flaky tests allowed
- **Clarity**: Each test has clear purpose
- **Independence**: Tests can run in any order

## Debugging Failed Tests

### 1. Isolate the Test

```bash
# Run single test
npm test -- persona-scorer.test.ts -t "should score persona"
```

### 2. Enable Verbose Output

```bash
# Verbose mode
npm test -- --reporter=verbose

# With debug logs
DEBUG=* npm test
```

### 3. Use Debugger

```typescript
it('should calculate score', () => {
  debugger; // Breakpoint
  const score = scorer.scorePersona(persona, task);
  expect(score).toBe(0.75);
});
```

### 4. Snapshot Testing

```typescript
it('should match recommendation snapshot', () => {
  const result = engine.processRecommendation(request);
  expect(result).toMatchSnapshot();
});
```

## Best Practices

1. **Descriptive Names**: Test names should be sentences
2. **Single Assertion**: One logical assertion per test
3. **No Logic**: Tests should not contain conditionals or loops
4. **Fast Tests**: Mock external dependencies
5. **Deterministic**: Same input → same output
6. **Clean Up**: Always clean up after tests
