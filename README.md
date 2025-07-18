# Personas MCP Server

[![Version](https://img.shields.io/badge/version-0.2.0--alpha-blue)](https://github.com/pidster/persona-mcp/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

A Model Context Protocol (MCP) server that enhances AI assistants with specialized personas for improved problem-solving in software development tasks.

## Why Use Personas?

- **Focused Solutions**: Get targeted advice from the right perspective (architecture vs implementation vs debugging)
- **Deep Expertise**: Each persona brings specialized knowledge and problem-solving approaches
- **Consistent Approach**: Personas maintain consistent methodologies across conversations
- **Faster Problem Solving**: Skip generic advice and get straight to expert-level guidance
- **Team Alignment**: Use the same personas your team would consult in real life

## Quick Start (5 minutes)

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

For detailed setup instructions, see the **[Installation Guide](./docs/books/installation.md)**.

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

## Documentation

### Getting Started

- **[Installation Guide](./docs/books/installation.md)** - Detailed installation and setup
- **[Quick Start Guide](./docs/quick-start.md)** - Get running in 5 minutes
- **[Claude Integration](./docs/books/claude-integration.md)** - Connect with Claude Desktop
- **[Using Personas](./docs/books/using-personas.md)** - How to effectively use personas

### Customization

- **[Creating Custom Personas](./docs/books/creating-personas.md)** - Build your own specialized personas
- **[API Client Integration](./docs/books/api-clients.md)** - Integrate with JavaScript, Python, Go, Ruby

### Technical Reference

- **[API Reference](./docs/engineering/api-reference.md)** - Complete API documentation
- **[System Architecture](./docs/architecture/system-overview.md)** - Technical architecture overview
- **[Recommendation System](./docs/designs/recommendation-system.md)** - How persona matching works
- **[Metrics & Monitoring](./docs/engineering/metrics-monitoring.md)** - OpenTelemetry metrics guide

### Development

- **[Development Setup](./docs/engineering/development-setup.md)** - Set up your dev environment
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Examples](./examples/)** - Code examples in multiple languages

### Support

- **[FAQ](./docs/FAQ.md)** - Frequently asked questions
- **[Troubleshooting Guide](./docs/books/troubleshooting-runbook.md)** - Common issues and solutions
- **[Roadmap](./plans/roadmap.md)** - Future plans and features

## Features

- **Dynamic Persona Loading**: Automatically loads personas from multiple sources
- **Intelligent Recommendations**: AI-powered persona matching for your tasks
- **Multi-Factor Scoring**: Advanced algorithm considering keywords, expertise, and complexity
- **Full MCP Support**: Resources, prompts, tools, and streaming responses
- **REST API**: Direct HTTP endpoints for non-MCP clients
- **OpenTelemetry Metrics**: Built-in performance monitoring

## Examples

### Using Personas in Claude

```
// Get recommendations
Which persona would be best for debugging a memory leak?

// Adopt a persona
Please adopt the debugger persona to help me troubleshoot this issue.

// Compare personas
Compare the architect and developer personas for API design.
```

### REST API Usage

```bash
# Get all personas
curl http://localhost:3000/api/personas

# Get recommendations
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "debug memory leak", "limit": 3}'
```

See more [examples](./examples/) for different programming languages.

## Contributing

We welcome contributions! Please see our **[Contributing Guide](./CONTRIBUTING.md)** for details on:

- Setting up your development environment
- Adding new personas
- Submitting pull requests
- Code style guidelines

## Getting Help

- **[Report Issues](https://github.com/pidster/persona-mcp/issues)** - Bug reports and feature requests
- **[FAQ](./docs/FAQ.md)** - Common questions answered
- Contact: [@pidster](https://github.com/pidster)

## License

MIT - See [LICENSE](./LICENSE) file for details

---

<div align="center">

**[Report an Issue](https://github.com/pidster/persona-mcp/issues)** | **[Request a Feature](https://github.com/pidster/persona-mcp/issues/new)**

If you find this project helpful, please consider giving it a ⭐

</div>
