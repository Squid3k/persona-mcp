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
- **Extensible Architecture**: Easy to add new personas
- **Full MCP Support**: Resources, prompts, and streaming responses
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

## License

MIT