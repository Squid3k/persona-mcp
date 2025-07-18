# Frequently Asked Questions (FAQ)

## General Questions

### What is the Personas MCP Server?

The Personas MCP Server is a Model Context Protocol (MCP) server that provides AI assistants like Claude with specialized "personas" - different perspectives and approaches for tackling software development challenges. It helps AI provide more focused, contextual, and effective solutions based on the specific type of problem you're trying to solve.

### How does it work?

When you ask Claude to adopt a persona (e.g., "Please adopt the architect persona"), the MCP server provides Claude with specific instructions on how to approach problems from that perspective. This includes the persona's expertise, communication style, problem-solving approach, and domain knowledge.

### What personas are available?

The server includes 12 built-in personas:

- **Architect** - System design and architecture
- **Developer** - Code implementation
- **Debugger** - Troubleshooting and debugging
- **Reviewer** - Code review and quality
- **Tester** - Testing strategies
- **Optimizer** - Performance optimization
- **Security Analyst** - Security assessment
- **Product Manager** - Requirements and features
- **Technical Writer** - Documentation
- **Engineering Manager** - Team leadership
- **UI Designer** - User interface design
- **Performance Analyst** - Performance monitoring

### Can I create custom personas?

Yes! You can create custom personas by adding YAML files to:

- **User-level**: `~/.ai/personas/*.yaml` (applies to all projects)
- **Project-level**: `./.ai/personas/*.yaml` (specific to a project)

See the [Creating Personas Guide](./guides/creating-personas.md) for details.

## Setup and Installation

### Do I need to install anything special?

You need:

- Node.js 18 or higher
- npm or yarn
- Claude Desktop app (for MCP integration)

### How do I know if it's working?

After setup, try asking Claude: "Please adopt the architect persona". If Claude responds with the architect's perspective, the server is working correctly.

You can also check:

```bash
# Test server health
curl http://localhost:3000/health

# Should return something like:
# {"status":"healthy","server":{"name":"personas-mcp",...}}
```

### Can I run multiple instances?

Yes, you can run multiple instances on different ports:

```bash
# Instance 1
npm start -- --port 3000

# Instance 2
npm start -- --port 3001
```

## Usage Questions

### How do I choose the right persona?

You can:

1. Ask for recommendations: "Which persona should I use for debugging a memory leak?"
2. Use the recommendation tool: `@recommend-persona "your task description"`
3. Compare personas: `@compare-personas architect developer "for API design"`

### Can I use multiple personas?

While you can switch between personas during a conversation, only one persona can be active at a time. To switch:

```
Please now adopt the developer persona for implementation details.
```

### What's the difference between similar personas?

Some personas may seem similar but have different focuses:

- **Optimizer** vs **Performance Analyst**: Optimizer focuses on code-level optimizations, while Performance Analyst focuses on system-wide performance monitoring
- **Developer** vs **Architect**: Developer focuses on implementation details, while Architect focuses on high-level design
- **Reviewer** vs **Tester**: Reviewer focuses on code quality, while Tester focuses on test strategies

### How do personas affect Claude's responses?

Personas influence:

- **Perspective**: How problems are approached
- **Focus**: What aspects are prioritized
- **Communication**: Level of detail and terminology
- **Recommendations**: Types of solutions suggested

## Troubleshooting

### "Connection refused" error

This usually means the server isn't running:

```bash
# Start the server
npm start

# Or check if it's already running
lsof -i :3000
```

### "HTTP 404" error in Claude

Make sure your configuration uses the full MCP endpoint:

```json
{
  "transport": {
    "type": "http",
    "url": "http://localhost:3000/mcp" // Note the /mcp suffix
  }
}
```

### Personas not loading

Check:

1. YAML file syntax (use a YAML validator)
2. File permissions (must be readable)
3. Required fields (id, name, version, role, description, prompt)
4. Server logs for validation errors

### Changes to personas not reflecting

The server watches for file changes, but you may need to:

1. Wait a moment for the file watcher to detect changes
2. Check server logs for reload messages
3. Restart the server if changes aren't detected

## Performance and Optimization

### How much memory does it use?

The server is lightweight, typically using:

- Base memory: ~50-100MB
- Per persona: ~1-2MB
- File watching: minimal overhead

### Can I disable file watching?

Currently, file watching is always enabled for development convenience. This may become configurable in future versions.

### How fast are recommendations?

Typical response times:

- Persona loading: <10ms
- Recommendations: 10-50ms
- API responses: <100ms total

## Security and Privacy

### Is my data sent anywhere?

No. The Personas MCP Server:

- Runs entirely locally
- Doesn't send data to external services
- Doesn't collect analytics or telemetry
- All processing happens on your machine

### Can I use it in a corporate environment?

Yes, the server is designed for local use and doesn't require internet access. Check with your IT department about:

- Running Node.js applications
- Using localhost servers
- Installing development tools

### Are there any security considerations?

- The server binds to localhost by default (not accessible externally)
- CORS is enabled by default for development (disable with `--no-cors` in production)
- No authentication is currently implemented (planned for future versions)

## Advanced Usage

### Can I integrate it with other tools?

Yes! The server provides:

- REST API for direct HTTP access
- MCP protocol for AI assistants
- Examples in JavaScript, Python, and curl

See the [API Reference](./engineering/api-reference.md) for details.

### How can I extend the recommendation algorithm?

The scoring algorithm is configurable. Current weights:

- Keyword matching: 30%
- Role alignment: 25%
- Expertise match: 20%
- Context relevance: 15%
- Complexity fit: 10%

Future versions will allow customizing these weights.

### Can I use it without Claude?

Yes! The REST API allows any application to:

- Get persona recommendations
- Access persona definitions
- Compare personas

Example:

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "debug memory leak", "limit": 3}'
```

## Contributing

### How can I contribute?

See our [Contributing Guide](../CONTRIBUTING.md) for details on:

- Setting up development environment
- Adding new personas
- Submitting pull requests
- Reporting issues

### What kind of personas are you looking for?

We welcome personas that:

- Address specific development needs
- Cover new domains or technologies
- Improve on existing personas
- Add language/framework-specific expertise

### Can I share my custom personas?

Yes! You can:

1. Submit them as a PR to be included as built-in personas
2. Share YAML files in issues for community feedback
3. Create a collection of domain-specific personas

## Future Plans

### What features are planned?

Check our [Roadmap](../plans/roadmap.md) for planned features, including:

- Authentication and user management
- Persona marketplace
- Machine learning improvements
- Team collaboration features

### Will there be a cloud version?

Currently focused on local deployment, but cloud features are being considered for team collaboration scenarios.

### When will version 1.0 be released?

The project is currently in alpha (0.2.0). Version 1.0 is planned after:

- API stabilization
- Performance optimizations
- Security hardening
- Documentation completion

---

Have a question not answered here? [Open an issue](https://github.com/pidster/persona-mcp/issues) on GitHub!
