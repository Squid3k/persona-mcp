#!/usr/bin/env node

import { PersonasMcpServer, ServerConfig } from './server.js';

function parseArgs(): ServerConfig {
  const args = process.argv.slice(2);
  const config: ServerConfig = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--port':
      case '-p':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          config.port = parseInt(nextArg);
          i++;
        } else {
          console.error('Invalid port number');
          process.exit(1);
        }
        break;

      case '--host':
      case '-h':
        if (nextArg) {
          config.host = nextArg;
          i++;
        } else {
          console.error('Host value required');
          process.exit(1);
        }
        break;

      case '--no-cors':
        config.http = { ...config.http, enableCors: false };
        break;

      case '--help':
        printHelp();
        process.exit(0);
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return config;
}

function printHelp(): void {
  console.error(`
Personas MCP Server

USAGE:
  personas-mcp [OPTIONS]

OPTIONS:
  -p, --port <number>           HTTP port (default: 3000)
  -h, --host <string>           HTTP host (default: localhost)
  --no-cors                     Disable CORS for HTTP transport
  --help                        Show this help message

EXAMPLES:
  # Run on default port
  personas-mcp

  # Run on custom port
  personas-mcp --port 8080

  # Run without CORS
  personas-mcp --no-cors

PERSONA DIRECTORIES:
  Default personas:    Built-in TypeScript personas
  User personas:       ~/.ai/personas/*.yaml
  Project personas:    ./.ai/personas/*.yaml

  Project personas take precedence over user personas,
  which take precedence over default personas.
`);
}

async function main(): Promise<void> {
  const config = parseArgs();
  const server = new PersonasMcpServer(config);

  // Handle graceful shutdown
  const shutdown = async () => {
    console.error('Shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  try {
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
