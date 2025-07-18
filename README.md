# Personas MCP Server

[![Version](https://img.shields.io/badge/version-0.2.0--alpha-blue)](https://github.com/pidster/persona-mcp/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

A Model Context Protocol (MCP) server that enhances AI assistants with specialized personas for improved problem-solving in software development tasks.

**[Quick Start Guide](./docs/quick-start.md)** | **[Documentation](./docs/)** | **[Create Custom Personas](./docs/guides/creating-personas.md)** | **[FAQ](./docs/FAQ.md)**

## Table of Contents

- [Why Use Personas?](#why-use-personas)
- [Quick Start](#quick-start-) (5-minute setup)
- [Available Personas](#available-personas)
- [Installation](#installation--setup)
- [Using with AI Assistants](#using-with-ai-assistants)
- [Custom Personas](#custom-personas)
- [Documentation](#documentation)
- [Examples](#examples)
- [Features](#features)
- [Getting Help](#getting-help-1)
- [Contributing](#contributing)
- [License](#license)

## Why Use Personas?

- **Focused Solutions**: Get targeted advice from the right perspective (architecture vs implementation vs debugging)
- **Deep Expertise**: Each persona brings specialized knowledge and problem-solving approaches
- **Consistent Approach**: Personas maintain consistent methodologies across conversations
- **Faster Problem Solving**: Skip generic advice and get straight to expert-level guidance
- **Team Alignment**: Use the same personas your team would consult in real life

## Available Personas

<details>
<summary>Click to see all 12 available personas</summary>

- **Architect**: System design, high-level architecture, scalability patterns
- **Debugger**: Systematic debugging, root cause analysis, troubleshooting
- **Developer**: Clean code implementation, best practices, maintainability
- **Engineering Manager**: Team leadership, project management, technical strategy
- **Optimizer**: Performance tuning, resource optimization, efficiency
- **Performance Analyst**: Performance monitoring, bottleneck identification, optimization
- **Product Manager**: Requirements gathering, user stories, feature prioritization
- **Reviewer**: Code quality analysis, security reviews, performance optimization
- **Security Analyst**: Security assessment, threat modeling, vulnerability analysis
- **Technical Writer**: Documentation, API docs, technical communication
- **Tester**: Test strategy, quality assurance, test automation
- **UI Designer**: User interface design, user experience, accessibility

</details>

## Quick Start

**Get up and running in 5 minutes!** 

```bash
# 1. Clone and build
git clone https://github.com/pidster/persona-mcp.git
cd persona-mcp
npm install && npm run build

# 2. Add to Claude Desktop config (~/.claude/claude_desktop_config.json)
{
  "mcpServers": {
    "personas": {
      "command": "node",
      "args": ["/absolute/path/to/persona-mcp/dist/index.js"]
    }
  }
}

# 3. Restart Claude Desktop

# 4. Test in Claude: "Please adopt the architect persona"
```

For detailed instructions, see our **[Quick Start Guide](./docs/quick-start.md)**.

## Installation & Setup

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

### Running the Personas MCP Server

The Personas MCP server can be run in two ways:

#### Option 1: Local Command Execution (Recommended)
This is the standard approach where Claude manages the server process directly:

1. **Build the project** (if not already done):
   ```bash
   npm run build
   ```

2. **Add to Claude Desktop configuration** (`~/.claude/claude_desktop_config.json`):
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

3. **Restart Claude Desktop** to load the new configuration

#### Option 2: HTTP Server with Project-Specific Configuration
This approach runs the server independently and connects via HTTP:

1. **Start the server**:
   ```bash
   npm start
   # Server runs on http://localhost:3000 by default
   ```

2. **Create a project-specific `.mcp.json` file** in your project root:
   ```json
   {
     "mcpServers": {
       "personas": {
         "command": "npx",
         "args": ["@anthropic-ai/mcp-client", "http://localhost:3000/mcp"],
         "transport": {
           "type": "http",
           "url": "http://localhost:3000/mcp"
         }
       }
     }
   }
   ```

3. **Alternative project-specific configuration** (if you have the MCP client installed):
   ```json
   {
     "mcpServers": {
       "personas": {
         "command": "curl",
         "args": ["-X", "POST", "http://localhost:3000/mcp", "-H", "Content-Type: application/json"],
         "transport": {
           "type": "http",
           "url": "http://localhost:3000/mcp"
         }
       }
     }
   }
   ```

### Server Configuration Options

You can customize the server behavior:

```bash
# Run on a custom port
npm start -- --port 8080

# Run on a specific host (for remote access)
npm start -- --host 0.0.0.0

# Disable CORS (for production environments)
npm start -- --no-cors

# Show all available options
npm start -- --help
```

### API Endpoints

When running as an HTTP server, the following endpoints are available:

#### MCP Protocol Endpoints
- **MCP Endpoint**: `http://localhost:3000/mcp` - Main MCP protocol endpoint
- **Health Check**: `http://localhost:3000/health` - Server health status
- **Info**: `http://localhost:3000/` - Server information and capabilities
- **Ready Check**: `http://localhost:3000/ready` - Server readiness status

#### REST API Endpoints
For direct HTTP access (non-MCP clients), the following REST endpoints are available:

- **GET `/api/personas`** - Get all available personas
  ```bash
  curl http://localhost:3000/api/personas
  ```

- **GET `/api/personas/:id`** - Get a specific persona by ID
  ```bash
  curl http://localhost:3000/api/personas/architect
  ```

- **POST `/api/recommend`** - Get persona recommendations for a task
  ```bash
  curl -X POST http://localhost:3000/api/recommend \
    -H "Content-Type: application/json" \
    -d '{"query": "debug memory leak", "limit": 3}'
  ```

- **POST `/api/compare`** - Compare multiple personas for a task
  ```bash
  curl -X POST http://localhost:3000/api/compare \
    -H "Content-Type: application/json" \
    -d '{"persona1": "architect", "persona2": "developer", "context": "API design"}'
  ```

### Metrics and Monitoring

The server includes OpenTelemetry (OTLP) metrics support for monitoring performance and usage:

#### Enabling Metrics

Metrics are enabled by default and export to a local OTLP collector. Configure via environment variables:

```bash
# Disable metrics
METRICS_ENABLED=false npm start

# Custom OTLP endpoint (default: http://localhost:4318/v1/metrics)
METRICS_ENDPOINT=http://otel-collector:4318/v1/metrics npm start

# With authentication
METRICS_ENDPOINT=https://otel.example.com/v1/metrics \
METRICS_HEADERS='{"Authorization": "Bearer token"}' \
npm start

# Custom export interval in milliseconds (default: 60000)
METRICS_INTERVAL=30000 npm start
```

#### Available Metrics

The following metrics are collected:

**HTTP Metrics:**
- `http_requests_total` - Total HTTP requests (by method, endpoint, status)
- `http_request_duration_seconds` - Request duration histogram
- `http_active_connections` - Current active connections gauge

**MCP Protocol Metrics:**
- `mcp_requests_total` - Total MCP requests (by type, status)
- `mcp_request_duration_seconds` - MCP request duration histogram
- `mcp_errors_total` - Total MCP errors (by type)

**Persona Metrics:**
- `persona_requests_total` - Total requests per persona
- `persona_prompt_generations_total` - Prompts generated per persona
- `persona_load_duration_seconds` - Persona loading time

**Tool Metrics:**
- `tool_invocations_total` - Total tool invocations (by name)
- `tool_execution_duration_seconds` - Tool execution duration
- `tool_errors_total` - Tool execution errors

#### Example Collector Configuration

For local development with the OpenTelemetry Collector:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  
  # Optional: Export to other backends
  jaeger:
    endpoint: jaeger:14250
  
processors:
  batch:

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
```

### Testing the Connection

You can verify the server is running correctly:

```bash
# Test server info
curl http://localhost:3000/

# Test health check
curl http://localhost:3000/health

# Test MCP endpoint (expects proper MCP protocol headers)
curl -H "Accept: text/event-stream" http://localhost:3000/mcp

# Test REST API endpoints
curl http://localhost:3000/api/personas
curl http://localhost:3000/api/personas/architect

# Test persona recommendations
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "debug memory leak", "limit": 3}'
```

### Troubleshooting Connection Issues

#### Common Error: "HTTP 404" or "Dynamic client registration failed"

**Problem**: Claude is trying to connect to `http://localhost:3000` instead of `http://localhost:3000/mcp`.

**Solution**:
1. **For HTTP connections**: Ensure your configuration uses the full MCP endpoint URL:
   ```json
   {
     "transport": {
       "type": "http",
       "url": "http://localhost:3000/mcp"
     }
   }
   ```

2. **For local command execution**: Use the recommended approach:
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

#### Common Error: "Connection refused" or "ECONNREFUSED"

**Problem**: The server is not running or is running on a different port.

**Solution**:
1. Start the server: `npm start`
2. Check if the server is running: `curl http://localhost:3000/health`
3. If using a custom port, update your configuration accordingly

#### Common Error: "Transport type not supported"

**Problem**: Claude doesn't recognize the transport configuration.

**Solution**: Use the local command execution method (Option 1) which is more reliable and widely supported.

#### Verification Steps

1. **Check server status**:
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"healthy","server":{"name":"personas-mcp",...}}
   ```

2. **Verify MCP endpoint**:
   ```bash
   curl -H "Accept: text/event-stream" http://localhost:3000/mcp
   # Should return MCP protocol response (not 404)
   ```

3. **Check Claude Desktop logs** for specific error messages
4. **Restart Claude Desktop** after configuration changes

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

## Using Personas in Claude

Once the Personas MCP server is connected, you can interact with personas in several ways:

### 1. Adopting a Persona

Use the adoption prompts to have Claude take on a specific persona:

```
Please adopt the architect persona for this conversation.
```

Claude will then respond with the persona's perspective and approach.

### 2. Getting Persona Recommendations

Use the recommendation tool to find the best persona for your task:

```
@recommend-persona "I need help debugging a memory leak in my Node.js application"
```

The system will analyze your request and suggest the most suitable persona(s).

### 3. Comparing Personas

Compare different personas to understand their strengths:

```
@compare-personas architect developer "for designing a new microservices architecture"
```

### 4. Available Personas

The server includes these built-in personas:

- **Architect**: System design, scalability, high-level architecture
- **Developer**: Code implementation, best practices, clean code
- **Reviewer**: Code quality, security analysis, performance optimization
- **Debugger**: Systematic troubleshooting, root cause analysis
- **Product Manager**: Requirements, user stories, feature prioritization
- **Technical Writer**: Documentation, API docs, technical communication
- **Engineering Manager**: Team leadership, project management, technical strategy
- **Optimizer**: Performance tuning, resource optimization, efficiency
- **Security Analyst**: Security assessment, threat modeling, vulnerability analysis
- **Tester**: Test strategy, quality assurance, test automation
- **UI Designer**: User interface design, user experience, accessibility
- **Performance Analyst**: Performance monitoring, bottleneck identification, optimization

### 5. Persona Resources

Access persona definitions and details:

```
Please show me the available persona resources.
```

This will list all available personas with their IDs and descriptions.

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
- **Multi-Transport Support**: Supports both HTTP and stdio transports simultaneously
- **REST API**: Direct HTTP endpoints for non-MCP clients
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

### Essential Guides

- **[Quick Start Guide](./docs/quick-start.md)** - Get running in 5 minutes
- **[Creating Custom Personas](./docs/guides/creating-personas.md)** - Build your own specialized personas with YAML
- **[API Client Integration](./docs/guides/api-clients.md)** - Integrate with JavaScript, Python, Go, Ruby
- **[FAQ](./docs/FAQ.md)** - Frequently asked questions and troubleshooting

### Technical Documentation

- **[API Reference](./docs/engineering/api-reference.md)** - Complete API documentation
- **[System Architecture](./docs/architecture/system-overview.md)** - Technical architecture overview
- **[Integration Examples](./examples/)** - Client code in multiple languages

### Community

- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Changelog](./CHANGELOG.md)** - Version history and upgrade instructions
- **[Roadmap](./plans/roadmap.md)** - Future plans and features

## Examples

Check out our [examples directory](./examples/) for working code:

- **[JavaScript Client](./examples/javascript-client.js)** - Node.js integration example
- **[Python Client](./examples/python-client.py)** - Python integration with requests
- **[Curl Examples](./examples/curl-examples.sh)** - Quick testing with curl
- **[TypeScript Example](./examples/recommendation-example.ts)** - Full recommendation system demo

## Contributing

We welcome contributions! Please see our **[Contributing Guide](./CONTRIBUTING.md)** for details on:

- Setting up your development environment
- Adding new personas
- Submitting pull requests
- Code style guidelines
- Testing requirements
- Reporting issues

Check the [roadmap](./plans/roadmap.md) for planned features and ideas for contributions.

## Getting Help

- Read the [FAQ](./docs/FAQ.md) for common questions
- [Report issues](https://github.com/pidster/persona-mcp/issues) on GitHub
- Join discussions in [GitHub Discussions](https://github.com/pidster/persona-mcp/discussions)
- Contact the maintainer: [@pidster](https://github.com/pidster)

---

<div align="center">

## Star Us on GitHub!

If you find this project helpful, please consider giving it a star

**[Report an Issue](https://github.com/pidster/persona-mcp/issues)** | **[Request a Feature](https://github.com/pidster/persona-mcp/issues/new)** | **[Join the Discussion](https://github.com/pidster/persona-mcp/discussions)**

</div>

---

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- Inspired by the need for specialized AI assistance in software development
- Thanks to all contributors and early adopters

## License

MIT - See [LICENSE](./LICENSE) file for details