# Contributing to Personas MCP Server

Thank you for your interest in contributing to the Personas MCP Server! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Adding New Personas](#adding-new-personas)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing opinions and experiences

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/persona-mcp.git
   cd persona-mcp
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/pidster/persona-mcp.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)

### Initial Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests to ensure everything works
npm test

# Start development mode with auto-reload
npm run dev
```

### Development Commands

```bash
npm run dev          # Watch mode with auto-rebuild
npm run build        # Build for production
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run typecheck    # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
```

## Project Structure

```
persona-mcp/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── persona-manager.ts       # Core persona management
│   ├── enhanced-persona-manager.ts # Enhanced features
│   ├── personas/               # Built-in persona definitions
│   │   ├── architect.ts
│   │   ├── developer.ts
│   │   └── ...
│   ├── recommendation/         # Recommendation engine
│   │   ├── recommendation-engine.ts
│   │   ├── persona-scorer.ts
│   │   └── recommendation-tool.ts
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── test/                       # Test files
├── docs/                       # Documentation
├── examples/                   # Usage examples
└── plans/                      # Project planning documents
```

## How to Contribute

### 1. Find an Issue

- Check the [issue tracker](https://github.com/pidster/persona-mcp/issues) for open issues
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it

### 2. Create a Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or for bugfixes
git checkout -b fix/issue-description
```

### 3. Make Your Changes

- Write clean, documented code
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new persona recommendation feature"
# or
git commit -m "fix: correct scoring algorithm bug"
```

Follow conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `style:` for formatting changes
- `chore:` for maintenance tasks

## Adding New Personas

### 1. Create the Persona File

Create a new TypeScript file in `src/personas/`:

```typescript
// src/personas/your-persona.ts
import { Persona } from '../types/index.js';

export const yourPersona: Persona = {
  id: 'your-persona',
  name: 'Your Persona Name',
  role: 'specialist', // or architect, developer, reviewer, etc.
  description: 'Brief description of what this persona does',
  
  specialty: 'Primary area of expertise',
  approach: 'How this persona approaches problems',
  
  expertise: [
    'skill-1',
    'skill-2',
    'technology-1',
    'methodology-1'
  ],
  
  tags: ['tag1', 'tag2', 'tag3'],
  
  examplePrompts: [
    'How would you approach X?',
    'Can you help with Y?'
  ],
  
  prompt: `You are a [Role] specializing in [Domain].
  
  Your approach:
  - Key principle 1
  - Key principle 2
  - Key principle 3
  
  Technical expertise:
  - Area 1: Specific skills
  - Area 2: Specific skills
  
  Communication style:
  - How you communicate
  - Level of detail
  - Tone and approach`
};
```

### 2. Add to Persona Manager

Update `src/persona-manager.ts` to include your persona:

```typescript
import { yourPersona } from './personas/your-persona.js';

// Add to the defaultPersonas array
const defaultPersonas: Persona[] = [
  architectPersona,
  // ... other personas
  yourPersona, // Add your persona here
];
```

### 3. Add Tests

Create a test file `test/personas/your-persona.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { yourPersona } from '../../src/personas/your-persona.js';

describe('YourPersona', () => {
  it('should have required fields', () => {
    expect(yourPersona.id).toBe('your-persona');
    expect(yourPersona.name).toBeDefined();
    expect(yourPersona.prompt).toBeDefined();
  });

  it('should have appropriate expertise', () => {
    expect(yourPersona.expertise).toContain('expected-skill');
  });
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test your-persona.test.ts
```

### Writing Tests

- Write unit tests for all new functionality
- Aim for high test coverage (>80%)
- Test both success and error cases
- Use descriptive test names

Example test structure:
```typescript
describe('FeatureName', () => {
  describe('functionName', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = setupTestData();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
    
    it('should handle errors gracefully', () => {
      expect(() => functionUnderTest(invalidInput)).toThrow();
    });
  });
});
```

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Export types separately from implementations

### General Guidelines

- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Use async/await over callbacks
- Handle errors appropriately

### Formatting

The project uses Prettier for code formatting:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

## Pull Request Process

### 1. Before Submitting

- Ensure all tests pass: `npm test`
- Run type checking: `npm run typecheck`
- Fix linting issues: `npm run lint:fix`
- Update documentation if needed
- Add entries to CHANGELOG.md (if applicable)

### 2. Submitting the PR

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request on GitHub

3. Fill out the PR template with:
   - Clear description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)

### 3. PR Review Process

- Maintainers will review your PR
- Address feedback and push updates
- Once approved, a maintainer will merge your PR

### PR Title Format

Use conventional commit format for PR titles:
- `feat: add persona recommendation caching`
- `fix: resolve memory leak in file watcher`
- `docs: update API reference with new endpoints`

## Reporting Issues

### Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Minimal steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - Node.js version
   - OS and version
   - Personas MCP version

### Feature Requests

For feature requests, describe:

1. **Problem**: What problem does this solve?
2. **Solution**: Your proposed solution
3. **Alternatives**: Other solutions considered
4. **Additional Context**: Use cases, examples

## Development Tips

### Hot Reloading

Use development mode for automatic rebuilds:
```bash
npm run dev
```

### Debugging

1. Use VS Code debugger with provided launch configuration
2. Add `console.log` statements (remove before committing)
3. Use Node.js inspector:
   ```bash
   node --inspect dist/index.js
   ```

### Testing Changes Locally

1. Build your changes: `npm run build`
2. Test with the CLI: `node dist/index.js --help`
3. Test in Claude Desktop by updating your config
4. Use the example scripts in `examples/`

## Getting Help

- Check existing documentation in `docs/`
- Look for similar issues in the issue tracker
- Ask questions in issue discussions
- Review existing PRs for examples

## Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Thanked in commit messages

Thank you for contributing to Personas MCP Server! Your efforts help make AI assistance better for everyone.