# Personas MCP Server - Enhanced with Claude Installation

[![Version](https://img.shields.io/badge/version-0.4.0--alpha-blue)](https://github.com/pidster/persona-mcp/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

A Model Context Protocol (MCP) server that enhances AI assistants with specialized personas for improved problem-solving in software development tasks. **Now featuring Claude-powered persona installation!**

## 🆕 New Feature: Claude Self-Installation of Personas

This fork adds the groundbreaking ability for **Claude to install new personas dynamically** through a simple MCP tool call. No more manual YAML editing - just describe what persona you want, and Claude will create and install it automatically!

### Key Benefits:
- **🤖 AI-Driven Persona Creation**: Claude can analyze your needs and create custom personas
- **⚡ Instant Installation**: New personas are immediately available after creation
- **🎯 Tailored Solutions**: Create personas specifically for your unique use cases
- **🔄 Dynamic Expansion**: Grow your persona library organically based on real needs

## Why Use Personas?

- **Focused Solutions**: Get targeted advice from the right perspective (architecture vs implementation vs debugging)
- **Deep Expertise**: Each persona brings specialized knowledge and problem-solving approaches
- **Consistent Approach**: Personas maintain consistent methodologies across conversations
- **Faster Problem Solving**: Skip generic advice and get straight to expert-level guidance
- **Team Alignment**: Use the same personas your team would consult in real life
- **🆕 Self-Expanding**: Let Claude create new personas as you encounter new challenges

## Quick Start (5 minutes)

```bash
# 1. Clone this enhanced version
git clone https://github.com/Squid3k/persona-mcp.git
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

# 4. Test the new installation feature:
"Please create and install a Game Developer persona that specializes in Unity and C# programming"
```

For detailed setup instructions, see the **[Installation Guide](./docs/books/installation.md)**.

## 🚀 New Tool: Install Persona

Claude can now install new personas using the `install-persona` tool. Just ask Claude to create a persona and it will handle everything automatically!

### Example Requests:
```
"I need a persona for blockchain development with Solidity expertise"

"Create a UX Research persona that can help with user interviews and usability testing"

"Install a DevOps persona focused on AWS and Kubernetes deployment"

"I want a Technical Writing persona for API documentation"
```

### What Claude Can Create:
- **Specialized Developer Personas** (Frontend, Backend, Mobile, Game Dev, etc.)
- **Domain Expert Personas** (Finance, Healthcare, Education, etc.) 
- **Process-Focused Personas** (DevOps, QA, Product Management, etc.)
- **Creative Personas** (UX Design, Technical Writing, Content Strategy, etc.)
- **Analytical Personas** (Data Science, Security Analysis, Performance Optimization, etc.)

## Available Personas

<details>
<summary>Click to see all 12+ available personas (growing dynamically!)</summary>

**Built-in Personas:**
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

**🆕 Claude-Installed Personas:**
Personas installed by Claude appear here automatically and are immediately available for use!

</details>

## Documentation

### Getting Started

- **[Installation Guide](./docs/books/installation.md)** - Detailed installation and setup
- **[Quick Start Guide](./docs/quick-start.md)** - Get running in 5 minutes
- **[Claude Integration](./docs/books/claude-integration.md)** - Connect with Claude Desktop
- **[Using Personas](./docs/books/using-personas.md)** - How to effectively use personas

### New Features

- **🆕 [Claude Persona Installation](./docs/claude-persona-installation.md)** - How to use Claude to install new personas
- **🆕 [Custom Persona Examples](./docs/persona-examples.md)** - Examples of personas Claude can create

### Customization

- **[Creating Custom Personas](./docs/books/creating-personas.md)** - Build your own specialized personas manually
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
- **🆕 Claude Persona Installation**: AI-powered persona creation and installation
- **Intelligent Recommendations**: AI-powered persona matching for your tasks
- **Multi-Factor Scoring**: Advanced algorithm considering keywords, expertise, and complexity
- **Full MCP Support**: Resources, prompts, tools, and streaming responses
- **REST API**: Direct HTTP endpoints for non-MCP clients
- **OpenTelemetry Metrics**: Built-in performance monitoring
- **🆕 Hot Reloading**: New personas are available immediately after installation

## Examples

### Using Personas in Claude

```
// Get recommendations
Which persona would be best for debugging a memory leak?

// Adopt a persona
Please adopt the debugger persona to help me troubleshoot this issue.

// 🆕 Install a new persona
Create and install a React Native persona for mobile app development

// Compare personas
Compare the architect and developer personas for API design.
```

### REST API Usage

```bash
# Get all personas (including Claude-installed ones)
curl http://localhost:3000/api/personas

# Get recommendations
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "debug memory leak", "limit": 3}'
```

See more [examples](./examples/) for different programming languages.

## 🤖 Claude Persona Installation Usage

### Simple Installation Request
```
"I need a persona for machine learning with PyTorch expertise"
```

### Detailed Installation Request
```
"Create a Cloud Architect persona that specializes in:
- AWS services and architecture patterns
- Infrastructure as Code with Terraform
- Containerization with Docker and Kubernetes  
- DevOps best practices and CI/CD
- Cost optimization and security

This persona should be able to help with both high-level architecture decisions and implementation details."
```

### Installation with Context
```
"Our team is working on a fintech application. Please create a Fintech Developer persona that understands:
- Financial regulations and compliance (PCI DSS, SOX)
- Payment processing and banking APIs
- Risk management systems
- Real-time trading systems
- Blockchain and cryptocurrency integration

The persona should balance security requirements with performance needs."
```

## Configuring AI Assistants for Automatic Persona Selection

To enable your AI assistant to automatically select and adopt the most appropriate persona for each task, add instructions to your assistant's configuration file:

### For Claude (CLAUDE.md)

```
When the Personas MCP server is available, you have the ability to:

1. **Automatically select personas** by analyzing the user's request to identify the type of task
2. **Install new personas** when existing ones don't meet the specific needs
3. **Use the @recommend-persona tool** to get persona recommendations
4. **Adopt the highest-scoring persona** for the task
5. **Create custom personas** using the @install-persona tool for unique requirements

Example workflows:
- If a user asks about debugging: automatically adopt the debugger persona
- If a user needs help with a technology not covered: create and install a new specialized persona
- For complex projects: suggest creating a project-specific persona with tailored expertise

Always inform the user which persona was selected and why, or if you're creating a new one.
```

### For Other AI Assistants

Similar instructions can be added to:
- `CURSOR.md` for Cursor
- `.github/copilot-instructions.md` for GitHub Copilot
- Project-specific AI configuration files

See our **[AI Assistant Configuration Guide](./docs/books/ai-assistant-configuration.md)** for detailed examples.

## Contributing

We welcome contributions! This enhanced version adds significant value through Claude-powered persona installation. Please see our **[Contributing Guide](./CONTRIBUTING.md)** for details on:

- Setting up your development environment
- Adding new personas (manually or through Claude)
- Submitting pull requests
- Code style guidelines

## Fork Information

This is an enhanced fork of [pidster/persona-mcp](https://github.com/pidster/persona-mcp) with the following additions:

- **🆕 Claude Persona Installation Tool**: Allows AI assistants to dynamically create and install new personas
- **🆕 Automatic Persona Manager Reload**: New personas are immediately available after installation
- **🆕 Enhanced Validation**: Comprehensive validation for AI-generated personas
- **🆕 YAML Export**: Proper YAML formatting for all installed personas

**Maintained by**: [Squid3k](https://github.com/Squid3k)  
**Original by**: [@pidster](https://github.com/pidster)

## Getting Help

- **[Report Issues](https://github.com/Squid3k/persona-mcp/issues)** - Bug reports and feature requests for this enhanced version
- **[FAQ](./docs/FAQ.md)** - Common questions answered
- **[Original Repository](https://github.com/pidster/persona-mcp)** - For issues with the base functionality
- Contact: [@Squid3k](https://github.com/Squid3k) for enhancement-specific questions

## License

MIT - See [LICENSE](./LICENSE) file for details

---

<div align="center">

**[Report an Issue](https://github.com/Squid3k/persona-mcp/issues)** | **[Request a Feature](https://github.com/Squid3k/persona-mcp/issues/new)** | **[Original Repository](https://github.com/pidster/persona-mcp)**

If you find this enhanced version helpful, please consider giving it a ⭐

**🚀 Try the new Claude persona installation feature today!**

</div>
