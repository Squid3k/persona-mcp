# Development Setup

This guide covers setting up a development environment for contributing to the Personas MCP Server.

## Prerequisites

- Node.js 18.0.0 or higher
- npm (comes with Node.js)
- Git
- A code editor (VS Code recommended)

## Initial Setup

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/YOUR-USERNAME/persona-mcp.git
   cd persona-mcp
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

## Development Commands

### Core Commands

#### Development Mode

Run the server with automatic reloading on file changes:

```bash
npm run dev
```

This uses `tsup` in watch mode to rebuild TypeScript files as you edit them.

#### Build

Create a production build:

```bash
npm run build
```

Outputs compiled JavaScript to the `dist/` directory.

#### Start

Run the built server:

```bash
npm start
```

### Code Quality Commands

#### Type Checking

Run TypeScript type checking without building:

```bash
npm run typecheck
```

This helps catch type errors before building.

#### Linting

Check code style and common errors:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint:fix
```

#### Formatting

Format code using Prettier:

```bash
npm run format
```

Check formatting without modifying files:

```bash
npm run format:check
```

### Testing Commands

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test:watch
```

Generate coverage report:

```bash
npm test:coverage
```

## Project Structure

```
persona-mcp/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── persona-manager.ts    # Persona loading and management
│   ├── personas/             # Built-in persona definitions
│   │   ├── architect.ts
│   │   ├── developer.ts
│   │   └── ...
│   ├── types/                # TypeScript type definitions
│   │   ├── persona.ts
│   │   ├── mcp.ts
│   │   └── ...
│   └── utils/                # Utility functions
├── dist/                     # Compiled output (git ignored)
├── docs/                     # Documentation
├── examples/                 # Usage examples
├── tests/                    # Test files
├── package.json             # Project configuration
├── tsconfig.json            # TypeScript configuration
├── .eslintrc.js             # ESLint configuration
└── .prettierrc              # Prettier configuration
```

## Development Workflow

### 1. Making Changes

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Start development mode:

   ```bash
   npm run dev
   ```

3. Make your changes in the `src/` directory

4. The server will automatically rebuild and restart

### 2. Testing Your Changes

1. **Manual testing** with the MCP Inspector:

   ```bash
   npx @modelcontextprotocol/inspector npm start
   ```

2. **Unit tests**:

   ```bash
   npm test
   ```

3. **Integration testing** with Claude Desktop:
   - Build your changes: `npm run build`
   - Update your Claude configuration to point to your local build
   - Test the persona functionality

### 3. Code Quality Checks

Before committing, run all quality checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format

# Tests
npm test
```

Or run all checks at once:

```bash
npm run check-all
```

### 4. Committing Changes

1. Stage your changes:

   ```bash
   git add .
   ```

2. Commit with a descriptive message:

   ```bash
   git commit -m "feat: add new persona for data science"
   ```

   Follow conventional commits:
   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test additions/changes
   - `chore:` Build process/auxiliary changes

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

## Environment Variables

For development, you can use these environment variables:

```bash
# Server configuration
PORT=3000                    # Server port
HOST=localhost              # Server host

# Metrics configuration
METRICS_ENABLED=true        # Enable/disable metrics
METRICS_ENDPOINT=http://localhost:4318/v1/metrics
METRICS_INTERVAL=60000      # Export interval in ms

# Development
NODE_ENV=development        # Set to 'production' for prod builds
DEBUG=personas:*           # Enable debug logging
```

Create a `.env` file in the project root for local development (git ignored).

## Debugging

### VS Code Launch Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/dist/index.js",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "sourceMaps": true
    }
  ]
}
```

### Debug Logging

Enable debug logs:

```bash
DEBUG=personas:* npm run dev
```

Add debug statements in code:

```typescript
import debug from 'debug';
const log = debug('personas:module-name');

log('Debug message with %o', someObject);
```

## Adding New Features

### Adding a New Persona

1. Create a new file in `src/personas/`:

   ```typescript
   // src/personas/my-persona.ts
   import { Persona } from '../types/persona.js';

   export const myPersona: Persona = {
     id: 'my-persona',
     name: 'My Custom Persona',
     // ... rest of persona definition
   };
   ```

2. Add to persona exports in `src/personas/index.ts`

3. Update documentation in `docs/`

### Adding New Tools

1. Define the tool in `src/tools/`:

   ```typescript
   export const myTool = {
     name: 'my-tool',
     description: 'Tool description',
     inputSchema: {
       /* zod schema */
     },
     handler: async input => {
       /* implementation */
     },
   };
   ```

2. Register in the MCP server

3. Add tests and documentation

## Performance Considerations

- Keep persona prompts concise
- Lazy load large data sets
- Use streaming for large responses
- Profile with Node.js built-in profiler:
  ```bash
  node --prof dist/index.js
  ```

## Troubleshooting Development Issues

### Build Errors

- Clear the dist folder: `rm -rf dist/`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run typecheck`

### Module Resolution Issues

- Ensure all imports use `.js` extension for ES modules
- Check `tsconfig.json` module settings
- Verify `package.json` type is set to "module"

### Hot Reload Not Working

- Check that `npm run dev` is running
- Verify file watchers aren't hitting OS limits
- Try restarting the dev server

## Contributing Guidelines

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for:

- Code style guide
- Pull request process
- Testing requirements
- Documentation standards

## Useful Resources

- [MCP SDK Documentation](https://modelcontextprotocol.io)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev)
- [ES Modules Guide](https://nodejs.org/api/esm.html)
