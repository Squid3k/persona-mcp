# Claude Integration Guide

This guide covers how to integrate the Personas MCP Server with Claude Desktop and other AI assistants.

## Table of Contents

- [Running the Server](#running-the-server)
  - [Option 1: Local Command Execution](#option-1-local-command-execution-recommended)
  - [Option 2: HTTP Server](#option-2-http-server-with-project-specific-configuration)
- [Server Configuration](#server-configuration-options)
- [API Endpoints](#api-endpoints)
- [Testing the Connection](#testing-the-connection)
- [Troubleshooting](#troubleshooting-connection-issues)
- [Metrics and Monitoring](#metrics-and-monitoring)

## Running the Server

The Personas MCP server can be run in two ways:

### Option 1: Local Command Execution (Recommended)

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

   Replace `/absolute/path/to/persona-mcp` with the actual path to your installation.

3. **Restart Claude Desktop** to load the new configuration

4. **Verify the connection** in Claude:
   ```
   Please show me the available persona resources.
   ```

### Option 2: HTTP Server with Project-Specific Configuration

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

3. **Alternative configuration** using curl:
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

## Server Configuration Options

Customize the server behavior with command-line options:

```bash
# Run on a custom port
npm start -- --port 8080

# Run on a specific host (for remote access)
npm start -- --host 0.0.0.0

# Disable CORS (for production environments)
npm start -- --no-cors

# Combine multiple options
npm start -- --port 8080 --host 0.0.0.0 --no-cors

# Show all available options
npm start -- --help
```

## API Endpoints

When running as an HTTP server, the following endpoints are available:

### MCP Protocol Endpoints

- **`POST /mcp`** - Main MCP protocol endpoint
- **`GET /health`** - Server health status
- **`GET /`** - Server information and capabilities
- **`GET /ready`** - Server readiness status

### REST API Endpoints

For direct HTTP access (non-MCP clients):

#### Get All Personas
```bash
curl http://localhost:3000/api/personas
```

#### Get Specific Persona
```bash
curl http://localhost:3000/api/personas/architect
```

#### Get Persona Recommendations
```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "debug memory leak", "limit": 3}'
```

#### Compare Personas
```bash
curl -X POST http://localhost:3000/api/compare \
  -H "Content-Type: application/json" \
  -d '{"persona1": "architect", "persona2": "developer", "context": "API design"}'
```

## Testing the Connection

Verify the server is running correctly:

```bash
# Test server info
curl http://localhost:3000/

# Test health check
curl http://localhost:3000/health

# Test MCP endpoint (expects proper MCP protocol headers)
curl -H "Accept: text/event-stream" http://localhost:3000/mcp

# Test REST API
curl http://localhost:3000/api/personas
```

## Troubleshooting Connection Issues

### Common Error: "HTTP 404" or "Dynamic client registration failed"

**Problem**: Claude is trying to connect to `http://localhost:3000` instead of `http://localhost:3000/mcp`.

**Solution**:
1. For HTTP connections, ensure your configuration uses the full MCP endpoint URL:
   ```json
   {
     "transport": {
       "type": "http",
       "url": "http://localhost:3000/mcp"
     }
   }
   ```

2. For local command execution, use the recommended approach with absolute paths.

### Common Error: "Connection refused" or "ECONNREFUSED"

**Problem**: The server is not running or is running on a different port.

**Solution**:
1. Start the server: `npm start`
2. Check if the server is running: `curl http://localhost:3000/health`
3. If using a custom port, update your configuration accordingly

### Common Error: "Transport type not supported"

**Problem**: Claude doesn't recognize the transport configuration.

**Solution**: Use the local command execution method (Option 1) which is more reliable and widely supported.

### Verification Steps

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

## Metrics and Monitoring

The server includes OpenTelemetry (OTLP) metrics support. For detailed configuration and available metrics, see the [Metrics & Monitoring Guide](../engineering/metrics-monitoring.md).

### Quick Setup

Enable metrics with environment variables:

```bash
# Disable metrics
METRICS_ENABLED=false npm start

# Custom OTLP endpoint
METRICS_ENDPOINT=http://otel-collector:4318/v1/metrics npm start

# With authentication
METRICS_ENDPOINT=https://otel.example.com/v1/metrics \
METRICS_HEADERS='{"Authorization": "Bearer token"}' \
npm start
```

## Next Steps

- Learn how to [use personas](./using-personas.md) in your conversations
- Create [custom personas](./creating-personas.md) for your specific needs
- Explore the [API reference](../engineering/api-reference.md) for advanced usage
- Set up [metrics monitoring](../engineering/metrics-monitoring.md) for production