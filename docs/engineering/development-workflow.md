# Development Workflow

## Overview

This document outlines the development workflow and processes for the Personas MCP Server project.

## Development Environment Setup

### Prerequisites

1. **Node.js 18+**: Install via [nvm](https://github.com/nvm-sh/nvm) or [official installer](https://nodejs.org/)
2. **Git**: Version control system
3. **VS Code** (recommended): With TypeScript and ESLint extensions

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/pidster/persona-mcp.git
cd persona-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify setup
npm test
```

## Branch Strategy

### Main Branches

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: Feature development branches
- **`fix/*`**: Bug fix branches
- **`docs/*`**: Documentation updates

### Branch Naming

```
feature/add-persona-caching
fix/scoring-algorithm-bug
docs/update-api-reference
```

## Development Workflow

### 1. Starting New Work

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Install/update dependencies if needed
npm install
```

### 2. Development Cycle

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Check types continuously
npm run typecheck:watch
```

### 3. Code Quality Checks

Before committing, ensure:

```bash
# Run all tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### 4. Committing Changes

Follow conventional commit format:

```bash
# Format: <type>(<scope>): <subject>

feat(recommendation): add batch processing support
fix(scorer): correct keyword matching logic
docs(api): update tool documentation
test(engine): add edge case tests
refactor(manager): simplify persona loading
```

### 5. Pre-commit Hooks

Husky runs automatically before commits:
- ESLint validation
- TypeScript checking
- Test execution

If hooks fail:
```bash
# Fix issues and try again
npm run lint:fix
npm run format
git add .
git commit -m "..."
```

## Testing Strategy

### Test Types

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Component interaction testing
3. **E2E Tests**: Full system testing

### Test Structure

```
test/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test persona-scorer.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ComponentName', () => {
  let component: Component;

  beforeEach(() => {
    component = new Component();
  });

  it('should perform expected behavior', () => {
    const result = component.method();
    expect(result).toBe(expected);
  });
});
```

## Code Style Guide

### TypeScript Guidelines

1. **Use strict typing**: Avoid `any` types
2. **Explicit return types**: Always declare function return types
3. **Interface over type**: Prefer interfaces for object shapes
4. **Const assertions**: Use `as const` for literal types

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `IPascalCase` or `PascalCase`

### Import Organization

```typescript
// 1. External imports
import { z } from 'zod';
import express from 'express';

// 2. Internal imports
import { PersonaManager } from '../persona-manager.js';
import { Logger } from '../utils/logger.js';

// 3. Type imports
import type { Persona } from '../types/persona.js';
```

## Debugging

### VS Code Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/dist/index.js",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Debug Commands

```bash
# Run with debug logging
DEBUG=personas:* npm start

# Run with Node.js inspector
node --inspect dist/index.js

# Run specific test with debugging
node --inspect-brk node_modules/.bin/vitest run test-file.test.ts
```

## Performance Profiling

### CPU Profiling

```bash
# Start server with profiling
node --prof dist/index.js

# Process profile
node --prof-process isolate-*.log > profile.txt
```

### Memory Profiling

```bash
# Heap snapshot
node --inspect dist/index.js
# Open chrome://inspect and take heap snapshot
```

## Release Process

### 1. Version Bump

```bash
# Patch release (0.0.x)
npm version patch

# Minor release (0.x.0)
npm version minor

# Major release (x.0.0)
npm version major
```

### 2. Changelog Update

Update `CHANGELOG.md`:
```markdown
## [1.2.0] - 2025-07-15

### Added
- Persona recommendation system
- Multi-factor scoring algorithm

### Fixed
- Memory leak in file watcher

### Changed
- Improved error handling
```

### 3. Create Release

```bash
# Push tags
git push origin main --tags

# Create GitHub release
gh release create v1.2.0 \
  --title "Release v1.2.0" \
  --notes-file CHANGELOG.md
```

## Troubleshooting Development Issues

### Common Issues

1. **TypeScript errors after pulling**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. **Tests failing locally but not in CI**
   ```bash
   # Clear test cache
   npm test -- --clearCache
   ```

3. **Port already in use**
   ```bash
   # Find process
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

### Debug Logging

Enable debug logs:
```bash
# All logs
export DEBUG=*

# Specific module
export DEBUG=personas:recommendation

# Multiple modules
export DEBUG=personas:*,mcp:*
```

## Best Practices

1. **Write tests first**: TDD approach for new features
2. **Small commits**: Each commit should be atomic
3. **PR reviews**: All code must be reviewed
4. **Documentation**: Update docs with code changes
5. **Performance**: Profile before optimizing
6. **Security**: Never commit secrets or keys