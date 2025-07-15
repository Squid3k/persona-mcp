# Personas MCP Server

A Model Context Protocol (MCP) server that enhances AI assistants with specialized personas for improved problem-solving in software development tasks.

## What is this?

The Personas MCP Server provides AI assistants like Claude with different "personas" - specialized perspectives and approaches for tackling various software engineering challenges. By adopting these personas, AI assistants can provide more focused, contextual, and effective solutions.

### Available Personas

- **Architect**: System design, high-level architecture, scalability patterns
- **Developer**: Clean code implementation, best practices, maintainability
- **Reviewer**: Code quality analysis, security reviews, performance optimization
- **Debugger**: Systematic debugging, root cause analysis, troubleshooting

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation & Setup

1. Clone this repository:
```bash
git clone https://github.com/pidster/persona-mcp.git
cd persona-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
# Server runs on http://localhost:3000 by default
```

### Command Line Options

```bash
# Run on a custom port
npm start -- --port 8080

# Run on a specific host
npm start -- --host 0.0.0.0

# Disable CORS (for production environments)
npm start -- --no-cors

# Show help
npm start -- --help
```

## Using with AI Assistants

### Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "personas": {
      "command": "node",
      "args": ["/absolute/path/to/persona-mcp/dist/index.js"]
    }
  }
}
```

### API Endpoints

- **MCP Endpoint**: `http://localhost:3000/mcp` - Main MCP protocol endpoint
- **Health Check**: `http://localhost:3000/health` - Server health status
- **Info**: `http://localhost:3000/` - Server information and capabilities

## Custom Personas

You can add your own personas by creating YAML files:

### User-level personas
Place in `~/.ai/personas/`:
```yaml
id: my-custom-persona
name: My Custom Persona
version: "1.0"
role: specialist
description: Brief description of the persona
# ... additional fields
```

### Project-level personas
Place in `./.ai/personas/` within your project:
```yaml
id: project-persona
name: Project-Specific Persona
version: "1.0"
role: specialist
description: Persona tailored to this project
# ... additional fields
```

Project personas take precedence over user personas, which take precedence over built-in defaults.

## Development

```bash
# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## Features

- **Dynamic Persona Loading**: Automatically loads personas from multiple sources
- **File Watching**: Hot-reloads personas when YAML files change
- **Intelligent Recommendations**: AI-powered persona matching for your tasks
- **Multi-Factor Scoring**: Advanced algorithm considering keywords, expertise, and complexity
- **Extensible Architecture**: Easy to add new personas
- **Full MCP Support**: Resources, prompts, tools, and streaming responses
- **CORS Support**: Configurable for different environments

## Available Resources

When connected to an MCP client, the following resources are available:

- `persona://architect` - Software Architect persona
- `persona://developer` - Code Developer persona  
- `persona://reviewer` - Code Reviewer persona
- `persona://debugger` - Debugging Specialist persona

## Available Prompts

Each persona can be adopted via prompts:

- `adopt-persona-architect` - Think like a software architect
- `adopt-persona-developer` - Focus on implementation details
- `adopt-persona-reviewer` - Analyze code quality and security
- `adopt-persona-debugger` - Systematic debugging approach

Each prompt accepts an optional `context` parameter for specific problem context.

## Persona Recommendation System

The server includes an intelligent recommendation system that helps you find the best persona for your task.

### Available Tools

The following MCP tools are available for persona recommendations:

#### 1. `recommend-persona`
Find the best personas for your task based on description, keywords, and complexity.

```json
{
  "name": "recommend-persona",
  "arguments": {
    "title": "Design a REST API",
    "description": "Create a RESTful API with authentication and rate limiting",
    "keywords": ["api", "rest", "authentication"],
    "complexity": "moderate"
  }
}
```

#### 2. `explain-persona-fit`
Get a detailed explanation of why a specific persona fits (or doesn't fit) your task.

```json
{
  "name": "explain-persona-fit",
  "arguments": {
    "personaId": "architect",
    "title": "System design",
    "description": "Design a distributed system"
  }
}
```

#### 3. `compare-personas`
Compare multiple personas side-by-side for the same task.

```json
{
  "name": "compare-personas",
  "arguments": {
    "personaIds": ["architect", "developer"],
    "title": "API design",
    "description": "Design and implement a new API"
  }
}
```

#### 4. `get-recommendation-stats`
Get system statistics and scoring configuration.

### How It Works

The recommendation system uses a multi-factor scoring algorithm that considers:

- **Keyword Matching (30%)**: Semantic matching between task and persona expertise
- **Role Alignment (25%)**: How well the persona's role fits the task type
- **Expertise Match (20%)**: Direct expertise overlap
- **Context Relevance (15%)**: Domain and environmental factors
- **Complexity Fit (10%)**: Matching task complexity to persona capabilities

Each recommendation includes:
- **Score**: 0-100 indicating match quality
- **Reasoning**: Explanation of the recommendation
- **Strengths**: What the persona excels at for this task
- **Limitations**: Potential drawbacks or gaps
- **Confidence**: How confident the system is in the recommendation

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use: `lsof -i :3000`
- Use a different port: `npm start -- --port 8080`

### Personas not loading
- Check file permissions in `~/.ai/personas/`
- Verify YAML syntax in custom persona files
- Check server logs for validation errors

### Connection issues
- Ensure the server is running: `curl http://localhost:3000/health`
- Check firewall settings if accessing remotely
- Verify CORS settings match your client configuration

## Documentation

For detailed documentation, see:

- [API Reference](./docs/engineering/api-reference.md) - Complete API documentation for all tools
- [System Architecture](./docs/architecture/system-overview.md) - High-level architecture overview
- [Recommendation System Design](./docs/designs/recommendation-system.md) - Detailed design documentation

## Contributing

Contributions are welcome! Please read our contributing guidelines and check the [roadmap](./plans/roadmap.md) for planned features.

## License

MIT