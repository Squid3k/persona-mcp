# Quick Start Guide - Personas MCP Server

Get up and running with the Personas MCP Server in less than 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Claude Desktop app (for MCP integration)

## 5-Minute Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/pidster/persona-mcp.git
cd persona-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Configure Claude Desktop

Add the following to your Claude Desktop configuration file:

**Location**: `~/.claude/claude_desktop_config.json`

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

**Important**: Replace `/absolute/path/to/persona-mcp` with the actual path where you cloned the repository.

### Step 3: Restart Claude Desktop

Close and reopen Claude Desktop to load the new configuration.

### Step 4: Test It Works

In Claude, try this message:

```
Please adopt the architect persona for this conversation.
```

Claude should respond with the architect persona's perspective, indicating the server is working!

## Your First Persona Adoption

### Example 1: Getting Help with System Design

```
@architect I need to design a scalable API for a social media platform.
What architecture patterns should I consider?
```

### Example 2: Debugging a Problem

```
@debugger My Node.js app has a memory leak in production.
How should I approach finding and fixing it?
```

### Example 3: Code Review

```
@reviewer Can you review this authentication implementation and
point out security concerns?

[paste your code]
```

## Available Personas

Quick reference of built-in personas:

- **architect** - System design and architecture
- **developer** - Clean code implementation
- **debugger** - Systematic troubleshooting
- **reviewer** - Code quality and security
- **tester** - Testing strategies
- **optimizer** - Performance tuning
- **security-analyst** - Security assessment
- **product-manager** - Requirements and features
- **technical-writer** - Documentation
- **engineering-manager** - Team leadership
- **ui-designer** - User interface design
- **performance-analyst** - Performance monitoring

## Alternative: HTTP Server Mode

If you prefer running as a standalone HTTP server:

```bash
# Start the server
npm start

# Or with custom port
npm start -- --port 8080
```

Then add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "personas": {
      "command": "curl",
      "args": [
        "-X",
        "POST",
        "http://localhost:3000/mcp",
        "-H",
        "Content-Type: application/json"
      ],
      "transport": {
        "type": "http",
        "url": "http://localhost:3000/mcp"
      }
    }
  }
}
```

## What's Next?

- Read the [full documentation](../README.md)
- Learn to [create custom personas](./books/creating-personas.md)
- Explore [API integration](./engineering/api-reference.md)
- Check out [more examples](../examples/)

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/pidster/persona-mcp/issues)
- **Documentation**: [Full README](../README.md)
- **Troubleshooting**: [Common Problems](../README.md#troubleshooting)

---

**Congratulations!** You now have AI personas at your fingertips to help with any software development task!
