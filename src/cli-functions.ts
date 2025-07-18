import { ServerConfig } from './server.js';
import { VERSION } from './version.js';

export function printVersion(): void {
  console.error(VERSION);
}

export function printHelp(): void {
  console.error(`
Personas MCP Server

USAGE:
  personas-mcp [OPTIONS]

OPTIONS:
  -p, --port <number>           HTTP port (default: 3000)
  -h, --host <string>           HTTP host (default: localhost)
  --no-cors                     Disable CORS for HTTP transport
  -v, --version                 Show version number
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

export function parseArgs(args: string[]): ServerConfig {
  const config: ServerConfig = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--port':
      case '-p':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          config.port = parseInt(nextArg);
          config.forceHttpMode = true; // Force HTTP mode when port is specified
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
          config.forceHttpMode = true; // Force HTTP mode when host is specified
          i++;
        } else {
          console.error('Host value required');
          process.exit(1);
        }
        break;

      case '--no-cors':
        config.http = { ...config.http, enableCors: false };
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  // Check for environment variables for backward compatibility
  if (process.env.PORT) {
    config.port = parseInt(process.env.PORT, 10);
  }
  if (process.env.HOST) {
    config.host = process.env.HOST;
  }

  // Configure metrics from environment variables
  if (
    process.env.METRICS_ENABLED !== undefined ||
    process.env.METRICS_ENDPOINT ||
    process.env.METRICS_HEADERS ||
    process.env.METRICS_INTERVAL
  ) {
    config.metrics = {
      enabled: process.env.METRICS_ENABLED !== 'false',
      endpoint: process.env.METRICS_ENDPOINT,
      headers: process.env.METRICS_HEADERS
        ? (JSON.parse(process.env.METRICS_HEADERS) as Record<string, string>)
        : undefined,
      interval: process.env.METRICS_INTERVAL
        ? parseInt(process.env.METRICS_INTERVAL, 10)
        : undefined,
    };
  }

  return config;
}
