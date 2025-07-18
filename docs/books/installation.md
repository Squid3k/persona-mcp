# Installation & Setup Guide

This guide provides detailed instructions for installing and configuring the Personas MCP Server.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Git**: For cloning the repository

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/pidster/persona-mcp.git
cd persona-mcp
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Schema validation
- `tsup` - Build tooling
- TypeScript and other development dependencies

### 3. Build the Project

```bash
npm run build
```

This compiles the TypeScript source code into JavaScript and creates the distributable files in the `dist/` directory.

### 4. Verify Installation

Start the server to verify everything is working:

```bash
npm start
```

You should see output indicating the server is running on `http://localhost:3000`.

Test the server with:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "server": {
    "name": "personas-mcp",
    "version": "0.2.0-alpha"
  }
}
```

## Command Line Options

The server supports several command-line options for customization:

### Port Configuration

Run on a custom port (default: 3000):

```bash
npm start -- --port 8080
```

### Host Configuration

Bind to a specific network interface (default: localhost):

```bash
npm start -- --host 0.0.0.0  # Listen on all interfaces
npm start -- --host 192.168.1.100  # Listen on specific IP
```

### CORS Configuration

Disable CORS for production environments:

```bash
npm start -- --no-cors
```

By default, CORS is enabled for development convenience.

### Combined Options

You can combine multiple options:

```bash
npm start -- --port 8080 --host 0.0.0.0 --no-cors
```

### Help

View all available options:

```bash
npm start -- --help
```

## Environment Variables

The server also supports configuration via environment variables:

- `PORT` - Server port (overridden by --port flag)
- `HOST` - Server host (overridden by --host flag)
- `METRICS_ENABLED` - Enable/disable OpenTelemetry metrics (default: true)
- `METRICS_ENDPOINT` - OTLP metrics endpoint (default: http://localhost:4318/v1/metrics)

Example:

```bash
PORT=8080 METRICS_ENABLED=false npm start
```

## Directory Structure

After installation, your directory should look like:

```
persona-mcp/
├── dist/               # Compiled JavaScript (after build)
├── src/                # TypeScript source code
│   ├── personas/       # Built-in persona definitions
│   └── types/          # TypeScript type definitions
├── docs/               # Documentation
├── examples/           # Usage examples
├── package.json        # Project configuration
└── tsconfig.json       # TypeScript configuration
```

## Next Steps

- For integrating with Claude Desktop, see the [Claude Integration Guide](./claude-integration.md)
- To create custom personas, see [Creating Custom Personas](./creating-personas.md)
- For development setup, see [Development Setup](../engineering/development-setup.md)

## Troubleshooting

If you encounter issues during installation:

1. **Node.js version**: Ensure you have Node.js 18+ installed:

   ```bash
   node --version
   ```

2. **Clear npm cache**: If dependency installation fails:

   ```bash
   npm cache clean --force
   npm install
   ```

3. **Build errors**: If the build fails, check TypeScript errors:

   ```bash
   npm run typecheck
   ```

4. **Port conflicts**: If the default port is in use:
   ```bash
   lsof -i :3000  # Check what's using port 3000
   npm start -- --port 8080  # Use a different port
   ```

For more troubleshooting help, see the [Troubleshooting Runbook](../books/troubleshooting-runbook.md).
